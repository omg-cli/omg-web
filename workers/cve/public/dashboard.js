let refreshing = false;
let lastRefresh = Date.now();

async function refresh() {
  const current = document.querySelector('#live-view');
  if (!current || document.hidden || refreshing) return;

  refreshing = true;
  lastRefresh = Date.now();
  try {
    const response = await fetch('/', { cache: 'no-store', signal: AbortSignal.timeout(8000) });
    const parsed = new DOMParser().parseFromString(await response.text(), 'text/html');
    const next = parsed.querySelector('#live-view');
    if (!next) throw new Error('Dashboard response missing');
    if (!current.contains(document.activeElement)) current.replaceWith(next);
    const records = document.querySelector('#current-revisions');
    const nextRecords = parsed.querySelector('#current-revisions');
    if (records && nextRecords && !records.contains(document.activeElement)) {
      records.replaceWith(nextRecords);
    }
  } catch {
    if (!current.querySelector('.refresh-notice')) {
      const notice = document.createElement('p');
      notice.className = 'notice refresh-notice';
      notice.setAttribute('role', 'status');
      notice.textContent = 'Refresh failed. The dashboard is showing the last loaded data.';
      current.querySelector('.hero')?.append(notice);
    }
  } finally {
    refreshing = false;
  }
}

setInterval(() => void refresh(), 60_000);
document.addEventListener('visibilitychange', () => {
  if (Date.now() - lastRefresh >= 60_000) void refresh();
});
