---
title: 'Manage Java JDKs with OMG'
description: 'Install Temurin JDKs by feature number, use project pins, inspect JAVA_HOME, and understand patch-selection and host limits.'
navLabel: 'Java'
section: Runtimes
order: 101
release: v0.1.224
source:
  repo: omg-cli/omg
  path: docs/runtimes.md
  reviewedCommit: f0d8cb5d8a95dbbc6cae50460178702ac0263ebb
  reviewedAt: '2026-11-11'
implementation:
  - src/runtimes/java.rs
  - src/runtimes/common.rs
  - src/cli/runtimes.rs
  - src/hooks/mod.rs
---

## Install a JDK by feature number

OMG v0.1.224 downloads Eclipse Temurin JDKs from Eclipse Adoptium's API. It requests the HotSpot JDK image from the Eclipse vendor, not an arbitrary Java distribution or a standalone JRE.

Java requests use a feature number: `21` and `21.0` select the same managed `21` directory. A patch request such as `21.0.5` is rejected. This is a feature-level selection, not an exact security-update or build pin. The manager does not provide `latest` or `lts` aliases.

```bash
omg list java --available
omg use java 21
omg list java
omg which java
```

The remote list marks feature releases that Adoptium identifies as LTS; asset availability can still vary by architecture.

## Check host and executable selection

The provider maps Linux and macOS on x86_64 and aarch64 to Adoptium's host identifiers. Installation requires a matching downloadable package and the expected extracted layout.

OMG's published release binaries target Linux x86_64 and Apple Silicon macOS. The provider's broader architecture mapping does not add an OMG release target. Native Windows is unsupported; use a supported WSL guest for Linux workflows.

With shell integration enabled, verify Java at a fresh prompt:

```bash
java --version
javac --version
which -a java
which -a javac
```

## Pin a project

The nearest directory containing a Java pin wins. Within one directory, `.java-version` precedes `.tool-versions`; supported mise layers are considered afterward.

```bash
printf '%s\n' '21' > .java-version
omg use java
omg which java
```

Use the feature required by the project, not this example by default. `omg use java` can install the detected request. The prompt hook only selects a matching installed version and does not download missing JDKs.

A full patch number in `.java-version` cannot name one of this manager's feature directories. Update the pin to a feature number (such as `21`) because this manager tracks feature-level directories rather than individual patches.

## Set JAVA_HOME when your build needs it

The Java command prints a `JAVA_HOME` hint. Printing the path does not export it into the calling shell. The shell hook updates `PATH` for the selected runtime; it does not update a pre-existing `JAVA_HOME` used by Maven, Gradle, or an IDE.

For Bash or Zsh, after selecting feature `21`, an explicit session setting is:

```bash
export JAVA_HOME="$(omg config get data_dir)/versions/java/21"
"$JAVA_HOME/bin/java" --version
```

Update that value when changing features. An IDE or service may have its own JDK setting and may not read interactive shell startup files.

## Change or remove a feature

Use `omg use java FEATURE` to install or select another feature shown by the remote list. Reusing an already installed feature selects its existing directory; it is not a force-refresh command for the newest patch of that feature.

To remove a feature, switch to another one first, then run `omg use java FEATURE --uninstall`. Java removal accepts the feature form, such as `21`; the active managed feature cannot be removed.

There is no dedicated in-place JDK patch updater or `omg update java` command. If exact JDK build pinning is a requirement, this manager's feature-level contract is insufficient.

## Verification and troubleshooting

Adoptium supplies the archive URL, filename, and SHA-256 checksum. OMG validates the metadata, verifies the download over HTTPS, stages extraction, and requires the runtime launcher before activation. Checksums verify the upstream JDK archive against Adoptium metadata, not application dependencies.

| Symptom                                            | Check                                                                                               |
| -------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| Invalid Java version                               | Request a feature such as `21`, not a patch or an unsupported alias.                                |
| No JDK for the host                                | Inspect the Adoptium feature/OS/architecture combination; availability can differ between features. |
| Shell Java and build Java differ                   | Compare `which -a java`, `JAVA_HOME`, and the build tool's own JDK configuration.                   |
| Old patch remains after selecting the same feature | Existing features are reused; feature selection does not imply a fresh download.                    |

## Continue

See [runtime management](/docs/runtimes/), [configuration](/docs/configuration/), and [project tasks](/docs/tasks/).

Source: [Adoptium provider](https://github.com/omg-cli/omg/blob/f0d8cb5d8a95dbbc6cae50460178702ac0263ebb/src/runtimes/java.rs), [runtime dispatch](https://github.com/omg-cli/omg/blob/f0d8cb5d8a95dbbc6cae50460178702ac0263ebb/src/cli/runtimes.rs), and [hook pin resolution](https://github.com/omg-cli/omg/blob/f0d8cb5d8a95dbbc6cae50460178702ac0263ebb/src/hooks/mod.rs).
