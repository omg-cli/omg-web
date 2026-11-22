function initScrollSpy() {
  const rail = document.querySelector('.rail-outline');
  if (!rail) return;
  const links = Array.from(rail.querySelectorAll('a[href^="#"]'));
  if (links.length === 0) return;
  const targets = links
    .map(link => {
      const id = decodeURIComponent(link.getAttribute('href').slice(1));
      const el = document.getElementById(id);
      return el ? { id, el, link } : null;
    })
    .filter(Boolean);
  if (targets.length === 0) return;

  const setActive = id => {
    for (const item of targets) {
      if (item.id === id) item.link.setAttribute('aria-current', 'location');
      else item.link.removeAttribute('aria-current');
    }
  };

  const visible = new Set();
  const observer = new IntersectionObserver(
    entries => {
      for (const entry of entries) {
        if (entry.isIntersecting) visible.add(entry.target.id);
        else visible.delete(entry.target.id);
      }
      const firstVisible = targets.find(item => visible.has(item.id));
      if (firstVisible) {
        setActive(firstVisible.id);
        return;
      }
      // Fallback: last heading scrolled above viewport top.
      let passed = targets[0];
      for (const item of targets) {
        if (item.el.getBoundingClientRect().top <= 120) passed = item;
      }
      if (passed) setActive(passed.id);
    },
    { rootMargin: '-48px 0px -65% 0px', threshold: 0 }
  );

  for (const item of targets) observer.observe(item.el);
  setActive(targets[0].id);
}

(() => {
  const root = document.documentElement;
  if (root.dataset.docCopy === 'ready') return;
  root.dataset.docCopy = 'ready';
  document.addEventListener('click', async event => {
    if (!(event.target instanceof Element)) return;
    const outlineLink = event.target.closest('.page-outline a[href^="#"]');
    if (outlineLink) outlineLink.closest('details')?.removeAttribute('open');
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

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initScrollSpy, { once: true });
  } else {
    initScrollSpy();
  }
})();
