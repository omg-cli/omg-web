#!/usr/bin/env bash
# Exercise the real installer functions with isolated transport/tool fixtures.
set -euo pipefail
cd "$(dirname "$0")/.."
task_dir=$(mktemp -d)
trap 'rm -rf "$task_dir"' EXIT
sed '$d' site/static/install.sh > "$task_dir/functions.sh"
# Exercise archive selection against private host-library layouts. A distro
# name must never silently choose an incompatible APT major or architecture.
(
  set --
  source "$task_dir/functions.sh"
  trap - EXIT
  for distro in debian ubuntu; do
    for scenario in apt6 apt7 both absent dangling directory arm64; do
      root="$task_dir/abi-$distro-$scenario"
      lib="$root/usr/lib/x86_64-linux-gnu"
      mkdir -p "$lib"
      arch=x86_64
      expected=""
      case "$scenario" in
        apt6) touch "$lib/libapt-pkg.so.6.0"; expected="$distro" ;;
        apt7) touch "$lib/libapt-pkg.so.7.0"; expected=debian-trixie ;;
        both) touch "$lib/libapt-pkg.so.6.0" "$lib/libapt-pkg.so.7.0"; expected=debian-trixie ;;
        dangling) ln -s nonexistent "$lib/libapt-pkg.so.7.0" ;;
        directory) mkdir "$lib/libapt-pkg.so.7.0" ;;
        arm64) touch "$lib/libapt-pkg.so.7.0"; arch=aarch64 ;;
      esac
      status=0
      actual=$(select_artifact v1.2.3 linux "$distro" "$arch" "$root" 2>"$root/error") || status=$?
      if [[ -n "$expected" ]]; then
        [[ "$status" == 0 && "$actual" == "omg-v1.2.3-x86_64-linux-$expected.tar.gz" ]]
      else
        [[ "$status" != 0 && -z "$actual" ]]
        grep -q 'No compatible native APT release' "$root/error"
      fi
    done
  done
  for distro in arch fedora unknown; do
    root="$task_dir/unpublished-$distro-arm64"
    mkdir -p "$root"
    status=0
    actual=$(select_artifact v1.2.3 linux "$distro" aarch64 "$root" 2>"$root/error") || status=$?
    [[ "$status" != 0 && -z "$actual" ]]
    grep -q 'No published OMG Linux artifact' "$root/error"
  done
  printf 'PASS: Debian/Ubuntu APT archive selection and refusal cases\n'
)
for scenario in missing rejected wrong_tag accepted loader_error wrong_version missing_daemon daemon_loader_error hung_probe; do
  (
    set --
    source "$task_dir/functions.sh"
    trap - EXIT
    scenario_dir="$task_dir/$scenario"
    mkdir -p "$scenario_dir"
    INSTALL_DIR="$scenario_dir/bin"
    OMG_VERSION=v1.2.3
    MAX_VERSION_PROBE_SECONDS=1
    case "$scenario" in
      loader_error | wrong_version | missing_daemon | daemon_loader_error | hung_probe)
        mkdir -p "$INSTALL_DIR"
        printf 'previous cli\n' > "$INSTALL_DIR/omg"
        printf 'previous daemon\n' > "$INSTALL_DIR/omgd"
        ;;
    esac
    for name in start_spinner stop_spinner fail_spinner header info success; do
      eval "$name() { :; }"
    done
    check_runtime_dependencies() { return 0; }
    detect_os() { echo linux; }
    detect_distro() { echo arch; }
    detect_arch() { echo x86_64; }
    if [[ "$scenario" == wrong_tag ]]; then
      resolve_version() { printf 'v1.2.2\n'; }
    fi
    curl() {
      local url="${@: -1}"
      if [[ "$url" == *.sha256 ]]; then
        printf '%064d  archive\n' 0
      elif [[ "$url" == "$RELEASES_BASE_URL/omg-v1.2.3-x86_64-linux-arch.tar.gz" ]]; then
        printf 'fixture'
      else
        printf 'Unexpected fixture URL: %s\n' "$url" >&2
        return 1
      fi
    }
    calculate_sha256() { printf '%064d\n' 0; }
    command() {
      if [[ "$scenario" == missing && "$*" == '-v gh' ]]; then return 1; fi
      builtin command "$@"
    }
    gh() {
      printf '%s\n' "$@" > "$scenario_dir/gh-args"
      [[ "$scenario" != rejected ]]
    }
    tar() {
      touch "$scenario_dir/extracted"
      printf '#!/bin/sh\nprintf "omg 1.2.3\\n"\n' > "$tmp_dir/omg"
      if [[ "$scenario" == loader_error ]]; then
        printf '#!/bin/sh\necho "missing libapt-pkg.so.6.0" >&2\nexit 127\n' > "$tmp_dir/omg"
      elif [[ "$scenario" == wrong_version ]]; then
        printf '#!/bin/sh\nprintf "omg 1.2.2\\n"\n' > "$tmp_dir/omg"
      elif [[ "$scenario" == hung_probe ]]; then
        printf '#!/bin/sh\necho "$$" > "%s/probe.pid"\nexec sleep 30\n' "$scenario_dir" > "$tmp_dir/omg"
      fi
      chmod +x "$tmp_dir/omg"
      if [[ "$scenario" != missing_daemon ]]; then
        printf '#!/bin/sh\nprintf "omgd 1.2.3\\n"\n' > "$tmp_dir/omgd"
        if [[ "$scenario" == daemon_loader_error ]]; then
          printf '#!/bin/sh\necho "daemon missing native library" >&2\nexit 127\n' > "$tmp_dir/omgd"
        fi
        chmod +x "$tmp_dir/omgd"
      fi
    }
    install_binary() { mkdir -p "$INSTALL_DIR"; cp "$1" "$2"; }
    if install_from_release > "$scenario_dir/output" 2>&1; then status=0; else status=$?; fi
    if [[ "$scenario" == accepted ]]; then
      [[ "$status" == 0 && -x "$INSTALL_DIR/omg" && -x "$INSTALL_DIR/omgd" ]]
      [[ $("$INSTALL_DIR/omg" --version) == 'omg 1.2.3' ]]
      [[ $("$INSTALL_DIR/omgd" --version) == 'omgd 1.2.3' ]]
      grep -Fx -- '--source-ref' "$scenario_dir/gh-args"
      grep -Fx 'refs/tags/v1.2.3' "$scenario_dir/gh-args"
      grep -Fx 'omg-cli/omg/.github/workflows/release.yml' "$scenario_dir/gh-args"
    elif [[ "$scenario" == loader_error || "$scenario" == wrong_version || "$scenario" == missing_daemon || "$scenario" == daemon_loader_error || "$scenario" == hung_probe ]]; then
      if [[ "$status" == 0 ]]; then
        printf 'Installer accepted unusable pair: %s\n' "$scenario" >&2
        exit 1
      fi
      [[ $(cat "$INSTALL_DIR/omg") == 'previous cli' ]]
      [[ $(cat "$INSTALL_DIR/omgd") == 'previous daemon' ]]
      case "$scenario" in
        loader_error) grep -F 'missing libapt-pkg.so.6.0' "$scenario_dir/output" ;;
        wrong_version) grep -F 'does not report omg 1.2.3' "$scenario_dir/output" ;;
        missing_daemon) grep -F 'missing omgd binary' "$scenario_dir/output" ;;
        daemon_loader_error) grep -F 'daemon missing native library' "$scenario_dir/output" ;;
        hung_probe)
          grep -F 'omg version probe timed out' "$scenario_dir/output"
          [[ -s "$scenario_dir/probe.pid" ]]
          if kill -0 "$(cat "$scenario_dir/probe.pid")" 2>/dev/null; then
            printf 'Hung version probe was left running\n' >&2
            exit 1
          fi
          ;;
      esac
    else
      [[ "$status" != 0 && ! -e "$scenario_dir/extracted" && ! -e "$INSTALL_DIR/omg" ]]
    fi
  )
done
# Replace an initially absent destination with a directory after its pre-check,
# during staging. The real final rename must fail without touching its child.
for rename_platform in native darwin; do
  (
    set --
    source "$task_dir/functions.sh"
    trap - EXIT
    INSTALL_DIR="$task_dir/raced-$rename_platform"
    mkdir -p "$INSTALL_DIR"
    printf 'new binary\n' > "$INSTALL_DIR/source"
    if [[ "$rename_platform" == darwin ]]; then
      uname() { printf 'Darwin\n'; }
    fi
    rename_install_binary "$INSTALL_DIR/source" "$INSTALL_DIR/control"
    [[ $(cat "$INSTALL_DIR/control") == 'new binary' ]]
    printf 'updated binary\n' > "$INSTALL_DIR/source"
    rename_install_binary "$INSTALL_DIR/source" "$INSTALL_DIR/control"
    [[ $(cat "$INSTALL_DIR/control") == 'updated binary' ]]
    printf 'new binary\n' > "$INSTALL_DIR/source"
    cp() {
      command cp "$@"
      mkdir "$INSTALL_DIR/omg"
      printf 'untouched\n' > "$INSTALL_DIR/omg/omg"
    }
    if (install_binary "$INSTALL_DIR/source" "$INSTALL_DIR/omg"); then
      printf 'Installer followed a directory swapped in during staging\n' >&2
      exit 1
    fi
    [[ $(cat "$INSTALL_DIR/omg/omg") == untouched ]]
    [[ $(find "$INSTALL_DIR/omg" -type f | wc -l) -eq 1 ]]
    printf 'PASS: %s direct rename and directory-swap controls\n' "$rename_platform"
  )
done
# The final move must replace a destination symlink, never install inside its
# directory target. Exercise the real install function, including regular updates.
(
  set --
  source "$task_dir/functions.sh"
  trap - EXIT
  INSTALL_DIR="$task_dir/atomic-bin"
  mkdir -p "$INSTALL_DIR" "$task_dir/outside"
  printf 'new binary\n' > "$task_dir/source"
  printf 'untouched\n' > "$task_dir/outside/omg"
  ln -s "$task_dir/outside" "$INSTALL_DIR/omg"
  install_binary "$task_dir/source" "$INSTALL_DIR/omg"
  [[ ! -L "$INSTALL_DIR/omg" && -f "$INSTALL_DIR/omg" ]]
  [[ $(cat "$task_dir/outside/omg") == untouched ]]
  printf 'updated binary\n' > "$task_dir/source"
  install_binary "$task_dir/source" "$INSTALL_DIR/omg"
  cmp "$task_dir/source" "$INSTALL_DIR/omg"
  mkdir "$INSTALL_DIR/omgd"
  if (install_binary "$task_dir/source" "$INSTALL_DIR/omgd"); then
    printf 'Installer accepted a directory destination\n' >&2
    exit 1
  fi
  [[ ! -e "$INSTALL_DIR/omgd/source" && ! -e "$INSTALL_DIR/omgd/omgd" ]]
)
# Piped definitions run in an attacker-controlled checkout, even with the old
# auto-detection bait. They must never qualify as an explicit source install.
mkdir -p "$task_dir/ambient"
printf '[package]\nname = "omg"\n' > "$task_dir/ambient/Cargo.toml"
{ cat "$task_dir/functions.sh"; printf '\n[[ "$IS_SOURCE_INSTALL" == false ]]\n'; } | (cd "$task_dir/ambient"; bash)
printf 'Installer security scenarios passed\n'
# Nearby source is executable only with explicit selection from an actual file.
printf '[package]\nname = "omg"\n' > "$task_dir/Cargo.toml"
for mode in default explicit; do
  (
    if [[ "$mode" == explicit ]]; then set -- --from-source; else set --; fi
    source "$task_dir/functions.sh"
    trap - EXIT
    for name in print_banner check_platform check_dependencies setup_config setup_telemetry setup_shell finish; do
      eval "$name() { :; }"
    done
    build_omg() { touch "$task_dir/built-$mode"; }
    install_from_release() { return 1; }
    error() { exit 1; }
    main
  ) && status=0 || status=$?
  if [[ "$mode" == explicit ]]; then
    [[ "$status" == 0 && -f "$task_dir/built-explicit" ]]
  else
    [[ "$status" != 0 && ! -e "$task_dir/built-default" ]]
  fi
done
{ cat "$task_dir/functions.sh"; printf '\n[[ "$IS_SOURCE_INSTALL" == false ]]\n'; } | (cd "$task_dir/ambient"; bash -s -- --from-source)
printf 'Explicit source and release failure scenarios passed\n'
