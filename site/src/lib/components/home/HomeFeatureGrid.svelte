<script lang="ts">
  import Icon from '../Icon.svelte';
  const workflows = [
    {
      title: 'System packages, handled.',
      detail:
        'Search, inspect, and install software through your native package backend. The command stays the same across supported systems.',
      command: 'omg install ripgrep',
      href: '/docs/cli/',
      link: 'Package commands',
    },
    {
      title: 'The right runtime for the project.',
      detail:
        'Choose Node.js, Python, Go, Rust, or Bun versions. Keep using npm and pnpm for your JavaScript dependencies.',
      command: 'omg use node 22',
      href: '/docs/runtimes/',
      link: 'Runtime guide',
    },
    {
      title: 'A setup you can check.',
      detail:
        'On Arch, Debian, and Ubuntu, capture a working setup in omg.lock and check another machine for drift.',
      command: 'omg env capture',
      href: '/docs/cli/',
      link: 'Environment commands',
    },
  ];
</script>

<section id="workflow" class="workflow home-shell home-section" aria-labelledby="workflow-title">
  <header>
    <h2 id="workflow-title">Less tool-switching.<br />More getting things done.</h2>
    <p>One familiar interface for the work around your code.</p>
  </header>
  <div class="workflow-list">
    {#each workflows as workflow (workflow.title)}
      <article>
        <div class="workflow-copy">
          <h3>{workflow.title}</h3>
          <p>{workflow.detail}</p>
          <a href={workflow.href}>{workflow.link}<Icon name="right" size={16} /></a>
        </div>
        <div class="workflow-command">
          <Icon name="terminal" size={20} /><code>{workflow.command}</code>
        </div>
      </article>
    {/each}
  </div>
  <a class="workflow-docs" href="/docs/"
    >Read the full documentation<Icon name="right" size={17} /></a
  >
</section>

<style>
  header {
    display: flex;
    justify-content: space-between;
    align-items: end;
    flex-wrap: wrap;
    gap: 1.5rem 3rem;
    margin-bottom: 2.5rem;
  }
  h2 {
    font-size: clamp(2rem, 3.4vw, 2.75rem);
    font-weight: 600;
    letter-spacing: -0.035em;
    line-height: 1.15;
  }
  header > p {
    max-width: 28ch;
    color: var(--ink-muted);
    font-size: 0.9375rem;
    line-height: 1.7;
  }
  article {
    display: grid;
    grid-template-columns: 1fr 0.9fr;
    gap: 2rem 4rem;
    align-items: center;
    padding-block: 2rem;
    border-top: 1px solid var(--rule);
  }
  h3 {
    font-size: 1.25rem;
    font-weight: 600;
    letter-spacing: -0.025em;
    line-height: 1.3;
  }
  .workflow-copy p {
    max-width: 52ch;
    margin-block: 0.75rem;
    color: var(--ink-muted);
    font-size: 0.875rem;
    line-height: 1.75;
  }
  a {
    display: inline-flex;
    align-items: center;
    gap: 0.75rem;
    min-height: 2.75rem;
    font-size: 0.8125rem;
    font-weight: 500;
    text-decoration: none;
  }
  a:hover {
    color: var(--signal);
  }
  .workflow-command {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1.75rem;
    border-radius: 6px;
    background: var(--paper-raised);
    color: var(--ink-muted);
  }
  code {
    font-family: var(--font-mono);
    font-size: clamp(0.75rem, 1.3vw, 0.9375rem);
    color: var(--ink);
    overflow-wrap: anywhere;
  }
  .workflow-docs {
    margin-top: 1rem;
  }
  @media (max-width: 44rem) {
    article {
      grid-template-columns: 1fr;
      gap: 1rem;
    }
    .workflow-command {
      padding: 1.25rem;
    }
  }
</style>
