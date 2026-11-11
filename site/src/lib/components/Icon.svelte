<script lang="ts">
  let {
    name,
    size = 18,
  }: {
    name:
      | 'right'
      | 'down'
      | 'external'
      | 'copy'
      | 'check'
      | 'terminal'
      | 'sun'
      | 'moon'
      | 'pause'
      | 'play'
      | 'replay';
    size?: number;
  } = $props();
  const paths = {
    right: 'M4 12h16m-6-6 6 6-6 6',
    down: 'M12 4v16m-6-6 6 6 6-6',
    external: 'M7 17 17 7M7 7h10v10',
    copy: 'M8 8h12v12H8zM16 8V4H4v12h4',
    check: 'm5 12 4 4L19 6',
    terminal: 'm4 5 6 6-6 6m9 0h7',
    sun: 'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5',
    moon: 'M20.9 13a9 9 0 0 1-9.9-9.9A9 9 0 1 0 20.9 13Z',
    pause: 'M8 5v14M16 5v14',
    play: 'm8 5 11 7-11 7Z',
    replay: 'M4 10a8 8 0 1 1 1 7M4 4v6h6',
  };
</script>

<svg
  width={size}
  height={size}
  viewBox="0 0 24 24"
  fill="none"
  stroke="currentColor"
  stroke-width="1.7"
  stroke-linecap="round"
  stroke-linejoin="round"
  aria-hidden="true"><path d={paths[name]} /></svg
>
