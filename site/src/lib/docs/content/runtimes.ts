/**
 * Curated runtime handbook. Reviewed against the omg-cli/omg implementation and
 * docs/runtimes.md at the commit recorded in the topic registry.
 */
import type { DocsTopic } from '../topic';
import { docsTopicMeta } from '../topics';

export const runtimesTopic: DocsTopic = {
  ...docsTopicMeta('runtimes'),
  sections: [
    {
      id: 'supported',
      heading: 'Supported runtimes',
      blocks: [
        {
          kind: 'table',
          title: 'Native runtimes and their binaries',
          columns: ['Runtime', 'Install and inspect'],
          rows: [
            ['Node.js', 'omg use node 20, then omg which node. Provides node, npm, and npx'],
            ['Python', 'omg use python 3.12. Provides python3 and pip'],
            ['Go', 'omg use go 1.21. Provides go and gofmt'],
            ['Rust', 'omg use rust stable or omg use rust nightly. Provides rustc and cargo'],
            ['Ruby', 'omg use ruby 3.2. Provides ruby and gem'],
            ['Java', 'omg use java 21. Provides java and javac'],
            ['Bun', 'omg use bun latest. Provides bun'],
            ['Deno', 'omg use deno latest. Provides deno'],
            ['Pi', 'omg use pi 0.83.0. Installs through npm with lifecycle scripts disabled'],
            ['Zig', 'omg use zig 0.13.0. Provides zig'],
            ['.NET', 'omg use dotnet 8.0. Provides dotnet'],
            ['Erlang', 'omg use erlang 26.2. Provides erl and erlc'],
            ['PHP', 'omg use php 8.3. Provides php'],
            ['Swift', 'omg use swift 5.10. Provides swift and swiftc'],
          ],
        },
        {
          kind: 'note',
          tone: 'warning',
          text: 'Unknown runtime names fail explicitly. OMG does not invoke or download another version manager.',
        },
      ],
    },
    {
      id: 'switching',
      heading: 'How version switching works',
      blocks: [
        {
          kind: 'diagram',
          diagram: {
            title: 'Which version file wins',
            caption:
              'OMG reads the project directory first and then its parents. Dedicated pins and supported language manifests come before .tool-versions; package.json follows for Node and Bun.',
            nodes: [
              {
                id: 'folder',
                label: 'Project directory',
                detail: 'checked upward',
                tone: 'signal',
              },
              { id: 'dedicated', label: 'Runtime-specific pin', detail: '.node-version, go.mod' },
              { id: 'manifest', label: 'Language manifest', detail: 'go.mod, pyproject.toml' },
              { id: 'tool-versions', label: '.tool-versions', detail: 'multi-runtime pin' },
              { id: 'package-json', label: 'package.json', detail: 'Node.js or Bun' },
              { id: 'active', label: 'Version on PATH' },
            ],
            edges: [
              { from: 'folder', to: 'dedicated' },
              { from: 'dedicated', to: 'manifest', label: 'not set', dashed: true },
              { from: 'manifest', to: 'tool-versions', label: 'not set', dashed: true },
              { from: 'tool-versions', to: 'package-json', label: 'not set', dashed: true },
              { from: 'dedicated', to: 'active' },
              { from: 'manifest', to: 'active' },
              { from: 'tool-versions', to: 'active' },
              { from: 'package-json', to: 'active' },
            ],
          },
        },
        {
          kind: 'note',
          tone: 'info',
          text: 'OMG is designed around native language version files (.node-version, .python-version, go.mod, rust-toolchain.toml) and standard .tool-versions. Support for mise.toml is strictly a migration compatibility surface so teams transitioning from mise can run without rewriting repository configurations; it is not OMG’s default or native configuration format.',
        },
        {
          kind: 'steps',
          steps: [
            {
              text: 'The generated shell hook invokes omg hook-env when the prompt or directory changes.',
            },
            {
              text: 'OMG reads version files in the current directory and then walks through its parents. The nearest pin wins.',
            },
            {
              text: 'The hook resets the base PATH and prepends the concrete installed version directory requested by each pin.',
            },
            { text: 'Subshells, tmux, and screen inherit the resulting PATH.' },
          ],
        },
        {
          kind: 'table',
          title: 'Version file priority per runtime',
          columns: ['Runtime', 'Detection order'],
          rows: [
            ['Node.js', '.node-version, .nvmrc, package.json, then .tool-versions'],
            ['Python', '.python-version, pyproject.toml, then .tool-versions'],
            ['Go', '.go-version, go.mod, then .tool-versions'],
            ['Rust', 'rust-toolchain, rust-toolchain.toml, then .tool-versions'],
            ['Ruby', '.ruby-version, then .tool-versions'],
            ['PHP', '.php-version, then .tool-versions'],
            ['Swift', '.swift-version, then .tool-versions'],
            ['Java', '.java-version, then .tool-versions'],
            ['Bun', '.bun-version, .tool-versions, then package.json'],
            ['Deno', '.deno-version, .dvmrc, then .tool-versions'],
            ['Zig', '.zig-version, then .tool-versions'],
            ['.NET', 'global.json, then .tool-versions'],
            ['Erlang and Pi', '.tool-versions'],
          ],
        },
        {
          kind: 'paragraphs',
          paragraphs: [
            'When no version file matches, the hook restores the base PATH. omg use installs the requested version and updates its current symlink. A matching project pin controls PATH the next time the hook runs. Runtime archives have provider-specific host support; native runtime management runs on supported Unix targets and is not a native Windows installation path.',
          ],
        },
      ],
    },
    {
      id: 'examples',
      heading: 'Common runtime tasks',
      blocks: [
        {
          kind: 'commands',
          title: 'Node.js',
          commands: [
            'omg use node lts',
            'omg list node',
            'omg list node --available',
            'omg which node',
          ],
        },
        {
          kind: 'commands',
          title: 'Python with a virtual environment',
          commands: ['omg use python 3.12', 'omg list python', 'omg which python'],
        },
        {
          kind: 'paragraphs',
          paragraphs: [
            'Record the required installed Python version in .python-version before relying on the shell hook. At a new prompt, verify python3 --version and which -a python3. Then create a fresh environment with python3 -m venv .venv. Invoke .venv/bin/python and .venv/bin/python -m pip explicitly: the reviewed Bash and Zsh hooks reset PATH at each prompt and can undo virtual-environment activation.',
          ],
        },
        {
          kind: 'commands',
          title: 'Rust components through rust-toolchain.toml',
          commands: ['[toolchain]', 'channel = "stable"', 'components = ["clippy", "rustfmt"]'],
        },
        {
          kind: 'commands',
          title: 'Deno',
          commands: [
            'omg use deno latest',
            'echo "2.9" > .deno-version',
            'omg list deno --available',
          ],
        },
        {
          kind: 'paragraphs',
          paragraphs: [
            'On Arch, Debian, and Ubuntu, omg env capture records selected runtime versions and explicit package names in omg.lock. Teammates use omg env check to inspect drift. This capture path is unavailable on Fedora and macOS, and the lock does not include application dependencies.',
          ],
        },
      ],
    },
    {
      id: 'storage',
      heading: 'Where versions live and how they are verified',
      blocks: [
        {
          kind: 'bullets',
          items: [
            'Every runtime installs under the OMG data directory. The default versions path is ~/.local/share/omg/versions on Linux and ~/Library/Application Support/omg/versions on macOS. Runtime switching does not need sudo.',
            'Verification depends on the provider. Archive-based managers compare published SHA-256 checksums when available; Python uses python-build-standalone metadata, Java uses Adoptium checksums, and Bun and Deno use release metadata or checksum sidecars. Pi installs through npm with lifecycle scripts disabled.',
            'Direct runtime downloads use HTTPS with certificate validation.',
            'OMG stages an installation in a temporary directory on the same filesystem, then publishes the version directory after installation and validation succeed.',
            'Each installed version has its own directory. Switch away from a version before removing it with omg use <runtime> <version> --uninstall.',
          ],
        },
      ],
    },
    {
      id: 'migration',
      heading: 'Migrating from other version managers',
      blocks: [
        {
          kind: 'note',
          tone: 'warning',
          text: 'There are no automatic migration subcommands. omg migrate only exports and imports a portable environment manifest. Migration from nvm, pyenv, or rustup is manual and non-destructive.',
        },
        {
          kind: 'steps',
          steps: [
            {
              text: 'Note your versions with the old tool, for example nvm list or pyenv versions.',
            },
            { text: 'Install the same versions with OMG.', command: 'omg use node 20' },
            {
              text: 'Keep both managers installed until you trust the switch, then remove the old entries from your shell profile.',
            },
          ],
        },
      ],
    },
    {
      id: 'problems',
      heading: 'When versions do not switch',
      blocks: [
        {
          kind: 'steps',
          steps: [
            { text: 'Inspect the version OMG selected.', command: 'omg which node' },
            {
              text: 'Check that the selected directory comes first in PATH.',
              command: 'which -a node',
            },
            {
              text: 'Confirm the project pin requests an installed version.',
              command: 'cat .node-version',
            },
            {
              text: 'Install or reactivate the requested version.',
              command: 'omg use node 20.10.0',
            },
            { text: 'Restart the shell so the hook reloads.', command: 'exec zsh' },
          ],
        },
        {
          kind: 'paragraphs',
          paragraphs: [
            'If the shell hook is missing entirely, PATH never updates on directory change. Confirm that eval of omg hook for your shell is present in the profile, and see the troubleshooting topic for the full checklist. Conflicting global packages from a previous manager can shadow OMG binaries; remove those PATH entries first.',
          ],
        },
      ],
    },
  ],
};
