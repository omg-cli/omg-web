(() => {
  const root = document.documentElement;
  if (root.dataset.docCopy === 'ready') return;
  root.dataset.docCopy = 'ready';
  document.addEventListener('click', async event => {
    if (!(event.target instanceof Element)) return;
    const button = event.target.closest('button[data-copy-code], button[data-copy-page]');
    if (!(button instanceof HTMLButtonElement) || button.disabled) return;
    const container = button.closest('[data-copy-container]');
    const status = container?.querySelector('[data-copy-status]');
    if (!(status instanceof HTMLElement)) return;
    button.disabled = true;
    status.textContent = '';
    try {
      if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable');
      let text;
      if (button.hasAttribute('data-copy-page')) {
        const url = new URL(button.dataset.markdownUrl ?? '', location.origin);
        if (url.origin !== location.origin || !url.pathname.startsWith('/markdown/'))
          throw new Error('Invalid Markdown URL');
        const response = await fetch(url);
        if (!response.ok || !(response.headers.get('content-type') ?? '').includes('text/markdown'))
          throw new Error('Markdown unavailable');
        text = await response.text();
      } else {
        text = container.querySelector('pre code')?.textContent;
      }
      if (text === undefined || text === null) throw new Error('No text to copy');
      await navigator.clipboard.writeText(text);
      status.textContent = button.hasAttribute('data-copy-page')
        ? 'Page copied as Markdown.'
        : 'Code copied.';
    } catch {
      status.textContent = button.hasAttribute('data-copy-page')
        ? 'Copy unavailable. Open the Markdown link to select the text.'
        : 'Copy unavailable. Select the code to copy it.';
    } finally {
      button.disabled = false;
    }
  });
})();
