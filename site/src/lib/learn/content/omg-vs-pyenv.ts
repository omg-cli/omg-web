import type { LearningContent } from '../page';

export const content: LearningContent = {
  sections: [
    {
      id: 'summary',
      heading: 'Python runtime selection and virtual environments',
      blocks: [
        {
          kind: 'paragraphs',
          paragraphs: [
            'pyenv is a popular specialized tool for installing and switching Python versions. Like asdf, pyenv operates using executable shims on PATH, which intercept every call to python, pip, and installed script entry points to evaluate active directory pins.',
            'OMG manages Python runtimes alongside Node.js, Go, Rust, and system packages through a compiled Rust core. It modifies PATH directly rather than routing commands through shims. Both tools separate runtime selection from virtual environment management (venv/virtualenv).',
            'This comparison was reviewed against documented behavior. Review your workflow requirements before selecting or migrating your Python version manager.',
          ],
        },
      ],
    },
    {
      id: 'differences',
      heading: 'Documented behavior and tradeoffs',
      blocks: [
        {
          kind: 'table',
          title: 'Documented behavior and tradeoffs',
          columns: ['Feature', 'OMG and pyenv'],
          rows: [
            [
              'Scope',
              'OMG is a polyglot manager covering system packages, 14 runtimes, and developer tools. pyenv is strictly dedicated to Python.',
            ],
            [
              'Execution architecture',
              'OMG adds the selected interpreter directory directly to PATH through its shell hook. pyenv inserts executable shims on PATH for python, pip, and other entry points.',
            ],
            [
              'Distribution format',
              'OMG downloads precompiled python-build-standalone releases and verifies SHA-256 digests. pyenv compiles from source by default, requiring native compiler tools and header libraries.',
            ],
            [
              'Version file detection',
              'Both tools check .python-version. OMG also checks pyproject.toml (requires-python) and universal .tool-versions.',
            ],
            [
              'Virtual environments',
              'Both tools work with standard python3 -m venv. pyenv offers a pyenv-virtualenv plugin for automated activation; OMG uses standard venv directories. OMG environment inventory capture is available on Arch and Debian/Ubuntu.',
            ],
          ],
        },
      ],
    },
    {
      id: 'choose',
      heading: 'When each tool fits your workflow',
      blocks: [
        {
          kind: 'paragraphs',
          paragraphs: [
            'Evaluate OMG if you manage projects in languages beyond Python (like Node or Go), prefer direct PATH selection through a shell hook, or want system package commands in the same CLI.',
            'Stay with pyenv if your team heavily relies on custom pyenv plugins, specialized build flags (such as PGO or debug builds), or pyenv-virtualenv automated directory activation.',
          ],
        },
      ],
    },
    {
      id: 'workflow',
      heading: 'Working with Python projects in OMG',
      blocks: [
        {
          kind: 'paragraphs',
          paragraphs: [
            'Select the Python version specified by your project with omg use python, then create and use a standard virtual environment for project libraries.',
            'Remember that reviewed Bash and Zsh shell hooks reset PATH at each prompt; invoke .venv/bin/python and .venv/bin/pip directly in scripts to guarantee isolation.',
          ],
        },
        {
          kind: 'commands',
          title: 'Select Python and create a project virtual environment',
          commands: ['omg use python 3.12', 'python3 -m venv .venv', '.venv/bin/python --version'],
        },
      ],
    },
  ],
  sources: [
    { title: 'OMG Python runtime guide', href: '/runtimes/python/' },
    { title: 'OMG runtime handbook', href: '/docs/runtimes/' },
    { title: 'pyenv official repository', href: 'https://github.com/pyenv/pyenv' },
  ],
  related: ['/runtimes/python/', '/compare/omg-vs-asdf/', '/guides/reproducible-dev-environments/'],
};
