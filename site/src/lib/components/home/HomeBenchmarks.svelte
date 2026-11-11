<script lang="ts">
  import Icon from '../Icon.svelte';
</script>

<section
  id="benchmarks"
  class="benchmarks home-shell home-section"
  aria-labelledby="benchmark-title"
>
  <header>
    <h2 id="benchmark-title">Performance you can inspect.</h2>
    <p>
      OMG can use a warm local package index on Arch. Useful comparisons must measure equivalent
      work and account for the state of that index.
    </p>
  </header>
  <div class="benchmark-record">
    <div class="record-heading">
      <Icon name="terminal" size={19} />
      <h3>What a fair comparison includes</h3>
    </div>
    <dl>
      <div>
        <dt>Same results</dt>
        <dd>Match package identities, sources, and limits.</dd>
      </div>
      <div>
        <dt>Same state</dt>
        <dd>Account for daemon startup and cache preparation.</dd>
      </div>
      <div>
        <dt>Full record</dt>
        <dd>Publish samples, variation, and failed cases.</dd>
      </div>
    </dl>
    <details>
      <summary>About the historical search result</summary>
      <p>
        A historical Arch development run returned six search lines from OMG and 458 from pacman.
        Those timings do not establish a search speedup.
      </p>
    </details>
    <a
      href="https://github.com/omg-cli/omg/tree/fe72b92b6e61c13a19f00627d22f3d1bc5713347/benchmarks/records/20260903_015949-5c43ddcc"
      >Inspect the benchmark record<Icon name="external" size={16} /></a
    >
  </div>
</section>

<style>
  .benchmarks {
    display: grid;
    grid-template-columns: 0.8fr 1fr;
    gap: 2rem 5rem;
  }
  h2 {
    max-width: 17ch;
    font-size: clamp(2rem, 3.4vw, 2.75rem);
    font-weight: 600;
    letter-spacing: -0.035em;
    line-height: 1.15;
  }
  header > p {
    max-width: 40ch;
    margin-top: 1.25rem;
    color: var(--ink-muted);
    font-size: 0.875rem;
    line-height: 1.8;
  }
  .benchmark-record {
    min-width: 0;
  }
  .record-heading {
    display: flex;
    gap: 0.75rem;
    align-items: center;
    padding-bottom: 1rem;
  }
  h3 {
    font-size: 0.9375rem;
    font-weight: 600;
  }
  dl {
    margin: 0;
  }
  dl > div {
    display: grid;
    grid-template-columns: 7rem 1fr;
    gap: 1rem;
    padding-block: 1rem;
    border-top: 1px solid var(--rule);
    font-size: 0.8125rem;
  }
  dt {
    font-weight: 600;
  }
  dd {
    margin: 0;
    color: var(--ink-muted);
  }
  details {
    border-top: 1px solid var(--rule);
    border-bottom: 1px solid var(--rule);
  }
  summary {
    padding-block: 1rem;
    min-height: 2.75rem;
    font-size: 0.75rem;
    cursor: pointer;
    color: var(--ink-muted);
  }
  summary:hover {
    color: var(--signal);
  }
  details p {
    padding-bottom: 1rem;
    color: var(--ink-muted);
    font-size: 0.75rem;
    line-height: 1.8;
  }
  a {
    display: inline-flex;
    align-items: center;
    gap: 0.75rem;
    min-height: 2.75rem;
    margin-top: 0.75rem;
    font-size: 0.8125rem;
    font-weight: 500;
    text-decoration: none;
  }
  a:hover {
    color: var(--signal);
  }
  @media (max-width: 44rem) {
    .benchmarks {
      grid-template-columns: 1fr;
    }
    dl > div {
      grid-template-columns: 6rem 1fr;
    }
  }
</style>
