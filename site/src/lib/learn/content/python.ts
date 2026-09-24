import type { LearningContent } from '../page';

export const content: LearningContent = {
  sections: [
    {
      id: 'install',
      heading: 'Precompiled CPython from standalone builds',
      blocks: [
        {
          kind: 'paragraphs',
          paragraphs: [
            'Compiling Python from source on every new machine requires C build toolchains, header files, and system development packages (like zlib, openssl, and libffi). OMG avoids this overhead by downloading validated, precompiled CPython distributions from the `python-build-standalone` project (`src/runtimes/python.rs` and `src/runtimes/python/catalog.rs`).',
            'The published OMG release queries python-build-standalone releases on GitHub to select a binary matching the host platform target. It downloads the archive, validates its SHA-256 digest, and performs a pure-Rust `.tar.gz` extraction into a staged directory. Once extracted, the interpreter is published atomically to `~/.local/share/omg/versions/python/<version>`.',
          ],
        },
        {
          kind: 'commands',
          title: 'Install and switch Python versions',
          commands: [
            'omg use python 3.12',
            'omg use python 3.11',
            'omg list python',
            'omg which python',
          ],
        },
        {
          kind: 'paragraphs',
          paragraphs: [
            'Published OMG releases target Linux x86_64 and Apple Silicon macOS. On Windows, run OMG inside WSL; Intel macOS and Linux ARM64 are not published release targets.',
          ],
        },
      ],
    },
    {
      id: 'version-files',
      heading: 'Project version detection and pyproject.toml support',
      blocks: [
        {
          kind: 'paragraphs',
          paragraphs: [
            'OMG’s shell hook (`src/hooks/mod.rs`) searches the current directory and then its ancestors. The nearest directory with a Python requirement wins. Within one directory, the sources are checked in this order:',
          ],
        },
        {
          kind: 'steps',
          steps: [
            {
              text: 'Project `.python-version` file: first priority within the same directory.',
            },
            {
              text: '`pyproject.toml`: OMG reads the `[project] requires-python` specification if no `.python-version` is present.',
            },
            {
              text: '`.tool-versions`: multi-runtime configuration file for asdf and mise compatibility.',
            },
          ],
        },
        {
          kind: 'commands',
          title: 'Verify Python version selection',
          commands: ['python3 --version', 'omg which python', 'which -a python3'],
        },
      ],
    },
    {
      id: 'venv',
      heading: 'Virtual environments and dependency boundaries',
      blocks: [
        {
          kind: 'paragraphs',
          paragraphs: [
            'OMG provides the selected Python interpreter. Project libraries should be isolated in a standard virtual environment created by that interpreter. This maintains a clean boundary between runtime management and package dependencies.',
          ],
        },
        {
          kind: 'commands',
          title: 'Create and use an isolated virtual environment',
          commands: [
            'python3 -m venv .venv',
            '.venv/bin/python --version',
            '.venv/bin/pip install -r requirements.txt',
          ],
        },
        {
          kind: 'note',
          tone: 'info',
          text: 'OMG’s task runner discovers [tool.poetry.scripts] entries in pyproject.toml and [scripts] entries in Pipfile, with Python task priority 80. It does not currently discover PDM, Rye, or [project.scripts] entries.',
        },
      ],
    },
    {
      id: 'diagnose',
      heading: 'Diagnosing system Python conflicts',
      blocks: [
        {
          kind: 'paragraphs',
          paragraphs: [
            'Most Linux distributions and macOS ship a system-managed Python for operating-system utilities. OMG does not overwrite or mutate system Python packages in `/usr/bin/python3`. Instead, OMG manages user-space versions under `~/.local/share/omg/versions/python` and prepends the active symlink to your PATH.',
          ],
        },
        {
          kind: 'commands',
          title: 'Check interpreter locations across your PATH',
          commands: ['omg which python', 'which -a python3', 'python3 --version'],
        },
      ],
    },
  ],
  sources: [
    {
      title: 'OMG Python manager implementation (src/runtimes/python.rs)',
      href: '/docs/runtimes/',
    },
    {
      title: 'python-build-standalone GitHub releases',
      href: 'https://github.com/indygreg/python-build-standalone/releases',
    },
    { title: 'Python venv documentation', href: 'https://docs.python.org/3/library/venv.html' },
  ],
  related: [
    '/compare/omg-vs-pyenv/',
    '/guides/reproducible-dev-environments/',
    '/docs/troubleshooting/',
  ],
};
