import type { LearningContent } from '../page';

export const content: LearningContent = {
  sections: [
    {
      id: 'start',
      heading: 'Install Go and inspect the selected runtime',
      blocks: [
        {
          kind: 'paragraphs',
          paragraphs: [
            'OMG manages Go compiler releases and standard toolchain binaries in pure Rust without shell wrappers or external managers. It downloads official releases directly from go.dev, verifies SHA-256 archive checksums against official manifests, and unpacks the toolchain into your user-local data directory.',
            'OMG installer artifacts target Linux and Apple Silicon macOS. On Windows, run OMG inside a supported Linux distribution in WSL; native Windows execution is not supported.',
          ],
        },
        {
          kind: 'commands',
          title: 'Install a Go release and inspect the selection',
          commands: ['omg use go 1.21', 'omg list go', 'omg which go'],
        },
        {
          kind: 'paragraphs',
          paragraphs: [
            'Running omg use go records the selected version in OMG’s versions tree and updates the current symlink. The shell hook prepends that version’s bin directory to PATH when entering a directory with a matching pin, and restores your base PATH when leaving it.',
          ],
        },
        {
          kind: 'commands',
          title: 'Verify the active Go compiler at a fresh shell prompt',
          commands: ['go version', 'which -a go'],
        },
      ],
    },
    {
      id: 'project',
      heading: 'Project pins with go.mod and .go-version',
      blocks: [
        {
          kind: 'paragraphs',
          paragraphs: [
            'When you navigate into a repository, OMG checks the nearest directory with a Go version request first. Within that directory it reads .go-version, then the go directive in go.mod, then .tool-versions. Go defines its go directive as a minimum required version and may use a separate toolchain directive to suggest a newer compiler; OMG does not read that toolchain directive.',
            'Partial version requests such as 1.21 automatically resolve to the newest matching stable release on go.dev, avoiding release candidates and prereleases.',
          ],
        },
        {
          kind: 'commands',
          title: 'Inspect available upstream Go releases and local pins',
          commands: ['omg list go --available', 'cat go.mod', 'omg which go'],
        },
        {
          kind: 'note',
          tone: 'info',
          text: 'OMG manages the Go compiler and toolchain (go and gofmt). Project dependency resolution and integrity remain with go.mod and go.sum. Do not replace Go module tooling with a runtime manager.',
        },
      ],
    },
    {
      id: 'environment',
      heading: 'GOROOT resolution and GOPATH tools',
      blocks: [
        {
          kind: 'paragraphs',
          paragraphs: [
            'Modern Go compilers locate their standard library (GOROOT) relative to the active go binary executable path. OMG does not export a global GOROOT shell environment variable; the compiler operates directly from its directory on PATH. Upon installation, omg use go displays the detected GOROOT and PATH for verification.',
            'Global tools compiled via go install place binaries into $GOPATH/bin (defaulting to ~/go/bin). Keep your GOPATH bin directory in your shell profile independently of OMG runtime switching.',
          ],
        },
        {
          kind: 'commands',
          title: 'Inspect Go environment variables and paths',
          commands: ['go env GOROOT GOPATH', 'which -a go'],
        },
      ],
    },
    {
      id: 'troubleshooting',
      heading: 'When Go resolves to an unexpected installation',
      blocks: [
        {
          kind: 'commands',
          title: 'Diagnose competing Go installations',
          commands: ['omg which go', 'which -a go', 'go version'],
        },
        {
          kind: 'paragraphs',
          paragraphs: [
            'If a system package such as /usr/bin/go appears ahead of OMG in PATH, verify that eval of omg hook for your shell is present in your shell configuration (.zshrc, .bashrc, or config.fish) and restart your shell session.',
            'Consult the runtime handbook for complete storage paths, checksum verification, and version file detection precedence.',
          ],
        },
      ],
    },
  ],
  sources: [
    { title: 'OMG runtime handbook', href: '/docs/runtimes/' },
    { title: 'Go download and install documentation', href: 'https://go.dev/doc/install' },
    { title: 'Go modules reference', href: 'https://go.dev/ref/mod' },
    { title: 'Go toolchain selection', href: 'https://go.dev/doc/toolchain' },
  ],
  related: ['/docs/runtimes/', '/runtimes/rust/', '/guides/reproducible-dev-environments/'],
};
