# Third-party tooling notices

OMG's MIT license applies to its authored source. Dependencies retain their upstream licenses. This inventory does not relicense their code or authorize license-policy exceptions.

## Sharp/libvips binary packages

The installed `sharp` 0.35.5 toolchain uses `@img/sharp-libvips-*` 1.3.4 platform binaries. Their npm metadata declares `LGPL-3.0-or-later`; the installed package README lists the licenses of the bundled native libraries. The packaging scripts' Apache-2.0 license is not the same as the binary libraries' license.

- [Packaging source and release information](https://github.com/lovell/sharp-libvips)
- [Upstream binary third-party notices](https://github.com/lovell/sharp-libvips/blob/main/THIRD-PARTY-NOTICES.md)
- [libvips source](https://github.com/libvips/libvips)
- The installed platform package's `README.md` and `versions.json` identify notices and bundled component versions. Retain those files with any redistribution of the binary package; review that redistribution separately.

## Lightning CSS

`lightningcss` 1.33.0 and its platform packages are licensed under MPL-2.0. The installed npm package includes the full `LICENSE` file. The compiler enters through Vite/Vitest; the application's CSS output does not contain the compiler implementation.

- [Source repository](https://github.com/parcel-bundler/lightningcss)
- [Upstream MPL-2.0 license](https://github.com/parcel-bundler/lightningcss/blob/master/LICENSE)
- Retain the upstream license and source information with any redistribution of the compiler itself. Review changes to, or redistribution of, this toolchain separately.

The current site and API Worker dry-run input manifests contain none of these toolchain modules. See [the package/version inventory and bundle-review hashes](./snyk-license-proposal-2026-11-20.json). This evidence is specific to the reviewed build and does not silently approve different future packaging.
