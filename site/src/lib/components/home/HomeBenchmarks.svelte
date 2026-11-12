<script lang="ts">
  import Icon from '../Icon.svelte';
</script>

<section id="benchmarks" class="benchmarks home-shell" aria-labelledby="benchmark-title">
  <div>
    <h2 id="benchmark-title">Open source. Open to inspection.</h2>
    <p>
      Built in Rust and released under the MIT license. Read the code, check the supported
      platforms, or help improve OMG.
    </p>
    <a href="https://github.com/omg-cli/omg/"
      >Explore the source <Icon name="external" size={16} /></a
    >
  </div>
  <details>
    <summary>What about performance?</summary>
    <p>
      OMG can use a warm local package index on Arch. A fair comparison needs the same package
      results, sources, and limits, with daemon startup and cache preparation accounted for.
    </p>
    <p>
      A historical Arch development run returned six search lines from OMG and 458 from pacman.
      Those timings do not establish a search speedup.
    </p>
    <a
      href="https://github.com/omg-cli/omg/tree/fe72b92b6e61c13a19f00627d22f3d1bc5713347/benchmarks/records/20260903_015949-5c43ddcc"
      >Inspect the benchmark record <Icon name="external" size={16} /></a
    >
  </details>
</section>

<style>
  .benchmarks {
    display: grid;
    grid-template-columns: 1fr 1fr;
    align-items: start;
    gap: 2rem 5rem;
    padding: 2rem;
    margin-bottom: 3.5rem;
    background: var(--paper-raised);
    border-radius: 12px;
  }
  h2 {
    margin: 0;
    font-size: 1.375rem;
    font-weight: 650;
    letter-spacing: -0.02em;
  }
  p {
    max-width: 58ch;
    margin: 0.75rem 0 0;
    color: var(--ink-muted);
    font-size: 0.8125rem;
    line-height: 1.8;
  }
  a {
    display: inline-flex;
    align-items: center;
    gap: 0.75rem;
    min-height: 2.75rem;
    margin-top: 0.5rem;
    font-size: 0.8125rem;
    font-weight: 600;
    text-decoration: none;
  }
  a:hover {
    color: var(--signal);
  }
  summary {
    min-height: 2.75rem;
    padding-block: 0.65rem;
    font-size: 0.875rem;
    font-weight: 600;
    cursor: pointer;
  }
  summary:hover {
    color: var(--signal);
  }
  @media (max-width: 40rem) {
    .benchmarks {
      grid-template-columns: 1fr;
      padding: 1.5rem;
      gap: 1rem;
    }
  }
</style>
