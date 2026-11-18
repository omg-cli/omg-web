# OMG

<!-- impeccable:product-schema 1 -->

## Platform

web

## Product purpose

The public website explains OMG, an open-source package and language-runtime CLI, and helps visitors install it or find source-reviewed documentation. The SvelteKit app also contains account and operator workspaces.

## Users

Developers managing system packages and project runtimes. This audience is inferred from the existing CLI documentation and public pages, rather than participant research.

## Capabilities and constraints

- System packages through pacman/AUR on Arch, APT/DEB on Debian/Ubuntu, DNF/RPM on Fedora, and Homebrew on Apple Silicon macOS, including supported x86_64 Linux inside WSL2. No native Windows build.
- Language version management for JavaScript, Python, Go, Rust, Ruby, Java, Zig, Erlang, PHP, and Swift. JavaScript runtime choices include Node.js, Bun, and Deno; .NET SDK versions are supported too. The runtime handbook also documents the Pi tool.
- Environment capture and drift checks on Arch, Debian, and Ubuntu.
- The primary installer command is `curl -fsSL https://getomg.dev/install.sh | bash`, with a nearby source link for optional inspection. The installer requires GitHub CLI for provenance verification.
- Keep authentication, analytics privacy behavior, metadata, source references, and backend contracts intact.
- Do not turn historical unequal-work benchmarks into speed claims.

## Brand commitments

OMG name and existing logo. The user requested familiar, modern CLI-tool craft and named bun.com and ripgrep.dev as references. Public surfaces use neutral white and charcoal with a restrained orange action accent; green-tinted palettes and repetitive slogan/feature rows were explicitly rejected. The user reviewed and approved the replacement on 2026-11-11 and authorized merging into main and deployment with Wrangler.

## Evidence on hand

`site/src/lib/docs/`, `site/src/lib/learn/`, existing installer, benchmark record links, public route tests. No participant interviews or user analytics analysis were performed for this redesign.
