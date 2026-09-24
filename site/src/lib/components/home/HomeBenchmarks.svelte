<script lang="ts"></script>

<section
  id="benchmarks"
  class="benchmarks home-shell home-section"
  aria-labelledby="benchmark-title"
>
  <header>
    <p class="section-label">Performance, with context</p>
    <h2 id="benchmark-title">Speed deserves a fair test.</h2>
    <p class="benchmark-intro">
      OMG can use a warm local package index on Arch. A useful speed comparison must measure
      equivalent work and account for the state of that index.
    </p>
  </header>
  <div class="benchmark-results">
    <p class="benchmark-highlight">
      <strong>Evidence first.</strong> <span>How we evaluate package operations</span>
    </p>
    <table>
      <caption>What a meaningful comparison includes</caption>
      <thead><tr><th scope="col">Check</th><th scope="col">Why it matters</th></tr></thead>
      <tbody>
        <tr
          ><th scope="row">Same results</th><td>Match package identities, sources, and limits.</td
          ></tr
        >
        <tr
          ><th scope="row">Same state</th><td>Account for daemon startup and cache preparation.</td
          ></tr
        >
        <tr
          ><th scope="row">Full record</th><td>Publish samples, variation, and failed cases.</td
          ></tr
        >
      </tbody>
    </table>
    <p class="benchmark-method">
      A historical Arch development run returned six search lines from OMG and 458 from pacman.
      Those timings do not establish a search speedup.
    </p>
    <a
      class="text-link"
      href="https://github.com/omg-cli/omg/tree/fe72b92b6e61c13a19f00627d22f3d1bc5713347/benchmarks/records/20260903_015949-5c43ddcc"
      >Inspect the benchmark record <span aria-hidden="true">↗</span></a
    >
  </div>
</section>

<style>
  .benchmarks {
    display: grid;
    gap: 3rem;
    border-top: 1px solid var(--rule);
  }
  .section-label {
    color: var(--ink-muted);
    font-family: var(--font-mono);
    font-size: 0.75rem;
  }
  h2 {
    max-width: 12ch;
    margin-block: 1.5rem;
    font-family: var(--font-display);
    font-size: clamp(2.5rem, 5.7vw, 5.5rem);
    letter-spacing: -0.06em;
    font-weight: 550;
    line-height: 1;
  }
  .benchmark-intro {
    max-width: 35ch;
    color: var(--ink-muted);
    line-height: 1.7;
  }
  .benchmark-results {
    min-width: 0;
  }
  .benchmark-highlight {
    display: grid;
    gap: 0.75rem;
    margin-bottom: 2.5rem;
  }
  .benchmark-highlight strong {
    color: var(--signal);
    font-family: var(--font-display);
    font-size: clamp(2.5rem, 5vw, 4rem);
    font-weight: 550;
    letter-spacing: -0.07em;
    line-height: 1.05;
  }
  .benchmark-highlight > span,
  caption,
  .benchmark-method {
    color: var(--ink-muted);
    font-size: 0.75rem;
    line-height: 1.7;
  }
  table {
    width: 100%;
    border-collapse: collapse;
    font-size: clamp(0.75rem, 1.2vw, 0.875rem);
  }
  caption {
    text-align: left;
    padding-bottom: 0.75rem;
  }
  th,
  td {
    padding: 1rem 0.5rem;
    border-top: 1px solid var(--rule);
    text-align: left;
    font-weight: 400;
  }
  th:first-child {
    padding-left: 0;
    text-align: left;
  }
  td {
    line-height: 1.5;
  }
  thead th {
    color: var(--ink-muted);
  }
  .benchmark-method {
    margin-block: 1rem;
    max-width: 58ch;
  }
  .text-link {
    justify-content: flex-start;
  }
  @media (min-width: 60rem) {
    .benchmarks {
      grid-template-columns: 1fr 1.15fr;
      gap: 5rem;
    }
  }
</style>
