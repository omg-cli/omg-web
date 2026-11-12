# omg-web

Website, documentation site, and web workers for OMG.

## Structure

- `site/` - SvelteKit public, account, and operator application
- `shared/` - cross-runtime contracts
- `workers/api/` - independently deployed licensing, billing, telemetry, and administration API

## Documentation development

The site uses SveltePress for Markdown guides alongside its typed handbook. See [the platform decision](docs/decisions/2026-11-11-documentation-platform.md) for architecture and [documentation maintenance](docs/operations/documentation-maintenance.md) for source review, validation and publishing checks.

## Related Repository

Core Rust CLI and daemon live in:

- `https://github.com/omg-cli/omg`
