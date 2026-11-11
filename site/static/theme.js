(() => {
  const root = document.documentElement;
  const system = window.matchMedia('(prefers-color-scheme: dark)');
  const key = 'omg-theme';
  let preference;

  function readPreference() {
    try {
      const stored = localStorage.getItem(key);
      return stored === 'dark' || stored === 'light' ? stored : undefined;
    } catch {
      return undefined;
    }
  }

  function apply() {
    const theme = preference ?? (system.matches ? 'dark' : 'light');
    root.dataset.theme = theme;
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute('content', theme === 'dark' ? '#141712' : '#fafbf8');
  }

  preference = readPreference();
  apply();
  system.addEventListener('change', () => {
    if (preference === undefined) apply();
  });
  window.addEventListener('storage', event => {
    if (event.key === key || event.key === null) {
      preference = readPreference();
      apply();
    }
  });
  document.addEventListener('click', event => {
    if (!(event.target instanceof Element) || !event.target.closest('[data-theme-toggle]')) return;
    preference = root.dataset.theme === 'dark' ? 'light' : 'dark';
    apply();
    try {
      localStorage.setItem(key, preference);
    } catch {
      // Keep the selected theme for this page when storage is unavailable.
      root.dataset.themePersistence = 'unavailable';
    }
  });
})();
