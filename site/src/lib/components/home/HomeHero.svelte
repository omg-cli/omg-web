<section class="hero home-shell" aria-labelledby="hero-title">
  <p class="hero-eyebrow">Free and open source. Built in Rust. No account required.</p>
  <h1 id="hero-title">Packages &amp; runtimes.<br /><span>One command.</span></h1>
  <div class="hero-introduction">
    <p>
      Manage system packages and <a href="/runtimes/node/">Node.js</a>,
      <a href="/runtimes/python/">Python</a>, <a href="/runtimes/go/">Go</a>,
      <a href="/runtimes/rust/">Rust</a>, and <a href="/runtimes/bun/">Bun</a> versions with one
      free CLI for supported x86_64 Linux distributions and Apple Silicon macOS, including Linux
      inside WSL2. Keep your <a href="/guides/node-npm-pnpm/">npm and pnpm workflows</a>.
    </p>
    <nav class="hero-actions" aria-label="Homepage introduction">
      <a class="primary-link" href="#install">Install OMG <span aria-hidden="true">↓</span></a>
      <a class="text-link" href="#workflow">Explore workflows <span aria-hidden="true">→</span></a>
    </nav>
  </div>
  <div class="command-examples" aria-label="Example OMG commands">
    <a class="command-example" href="/docs/cli/">
      <span class="command-label">System packages</span>
      <code><span aria-hidden="true">$ </span>omg install ripgrep</code>
      <span class="command-destination"
        >Explore package commands <span aria-hidden="true">↗</span></span
      >
    </a>
    <a class="command-example" href="/docs/runtimes/">
      <span class="command-label">Project runtimes</span>
      <code><span aria-hidden="true">$ </span>omg use node 22</code>
      <span class="command-destination"
        >Explore runtime commands <span aria-hidden="true">↗</span></span
      >
    </a>
  </div>
</section>

<style>
  .hero {
    padding-block: clamp(2.5rem, 6vw, 5rem) 0;
  }

  .hero-eyebrow {
    margin: 0 0 clamp(1.75rem, 3vw, 2.75rem);
    color: var(--ink-muted);
    font-family: var(--font-mono);
    font-size: 0.75rem;
    line-height: 1.7;
  }

  h1 {
    margin: 0;
    font-family: var(--font-display);
    font-size: clamp(2.5rem, 7.8vw, 7rem);
    font-weight: 650;
    letter-spacing: -0.075em;
    line-height: 0.95;
  }

  h1 > span {
    color: var(--signal);
  }

  .hero-introduction {
    display: grid;
    gap: 2rem;
    margin-block: clamp(2rem, 4vw, 3rem) clamp(2.5rem, 4vw, 3.5rem);
  }

  .hero-introduction > p {
    max-width: 38rem;
    margin: 0;
    color: var(--ink-muted);
    font-size: clamp(1rem, 1.5vw, 1.25rem);
    line-height: 1.7;
    text-wrap: pretty;
  }

  .hero-actions {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 1.25rem 2rem;
  }

  .primary-link {
    display: inline-flex;
    min-height: 3.5rem;
    align-items: center;
    justify-content: center;
    gap: 2rem;
    padding-inline: 1.5rem;
    background: var(--signal);
    color: var(--signal-ink);
    font-weight: 600;
    text-decoration: none;
  }

  .primary-link:hover {
    background: var(--signal-hover);
  }

  .command-examples {
    display: grid;
    border-block: 1px solid var(--rule);
  }

  .command-example {
    display: grid;
    align-content: center;
    gap: 0.45rem;
    min-width: 0;
    padding-block: 1.35rem;
    text-decoration: none;
  }

  .command-example + .command-example {
    border-top: 1px solid var(--rule);
  }

  .command-example:hover .command-destination {
    color: var(--signal);
  }

  .command-label,
  .command-destination {
    color: var(--ink-muted);
    font-family: var(--font-mono);
    font-size: 0.75rem;
  }

  .command-example code {
    font-family: var(--font-mono);
    font-size: clamp(1rem, 1.7vw, 1.25rem);
    overflow-wrap: anywhere;
  }

  .command-example code span {
    color: var(--signal);
  }

  @media (min-width: 42rem) {
    .command-examples {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
    .command-example + .command-example {
      padding-left: clamp(1.5rem, 4vw, 4rem);
      border-top: 0;
      border-left: 1px solid var(--rule);
    }
  }

  @media (min-width: 60rem) {
    .hero-introduction {
      grid-template-columns: 1.15fr 1fr;
      align-items: center;
    }
    .hero-actions {
      justify-content: flex-end;
    }
  }
</style>
