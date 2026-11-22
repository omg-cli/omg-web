<img class="brand-mark" src="/logo.svg" alt="OMG" width="110" height="33" />

<style>
  .brand-mark {
    display: block;
    width: 6rem;
    padding: 0.3rem 0.35rem;
    border-radius: 4px;
    background: #090909;
    height: auto;
  }
  :global(:root[data-theme='dark']) .brand-mark {
    padding: 0;
    border-radius: 0;
    background: transparent;
    mix-blend-mode: lighten;
  }
  @media (prefers-color-scheme: dark) {
    :global(:root:not([data-theme])) .brand-mark {
      padding: 0;
      border-radius: 0;
      background: transparent;
      mix-blend-mode: lighten;
    }
  }
</style>
