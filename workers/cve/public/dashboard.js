const liveView = document.querySelector('#live-view');
const indicator = document.querySelector('#stream-status');
const deferred = new Map();
const socketUrl = new URL('/live', location.href);
socketUrl.protocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
let wantedVersion = '';
let fetching = false;
let reconnectDelay = 1000;
let socket;

function indicate(message, connected = false) {
  if (indicator.textContent !== message) indicator.textContent = message;
  indicator.hidden = false;
  indicator.toggleAttribute('data-connected', connected);
}

function matchingControl(replacement, active) {
  if (active.matches('details[id] > summary')) {
    return replacement.querySelector(`#${CSS.escape(active.parentElement.id)} > summary`);
  }
  if (active.matches('a[href]')) {
    return Array.from(replacement.querySelectorAll('a[href]')).find(
      link =>
        link.getAttribute('href') === active.getAttribute('href') &&
        link.textContent === active.textContent
    );
  }
  return null;
}

function applyRegion(current, replacement) {
  for (const details of current.querySelectorAll('details[id][open]')) {
    replacement.querySelector(`#${CSS.escape(details.id)}`)?.setAttribute('open', '');
  }
  if (current.isEqualNode(replacement)) return true;
  const active = document.activeElement;
  const focus = current.contains(active) ? matchingControl(replacement, active) : null;
  if (current.contains(active) && !focus) return false;
  const scroll = current.querySelector('.table-wrap')?.scrollLeft ?? 0;
  current.replaceWith(replacement);
  const table = replacement.querySelector('.table-wrap');
  if (table) table.scrollLeft = scroll;
  focus?.focus({ preventScroll: true });
  return true;
}

function applyDeferred() {
  for (const [id, replacement] of deferred) {
    const current = document.getElementById(id);
    if (!current || applyRegion(current, replacement)) deferred.delete(id);
  }
}

async function hydrate() {
  if (fetching || !wantedVersion || wantedVersion === liveView.dataset.version) return;
  fetching = true;
  const requested = wantedVersion;
  try {
    const response = await fetch('/live/sections', {
      cache: 'no-store',
      signal: AbortSignal.timeout(8000),
    });
    const parsed = new DOMParser().parseFromString(await response.text(), 'text/html');
    const version = parsed.querySelector('#live-view')?.dataset.version;
    if (!version) throw new Error('Advisory snapshot missing');

    for (const replacement of parsed.querySelectorAll('[data-live-region]')) {
      const current = document.getElementById(replacement.id);
      if (!current) continue;
      if (applyRegion(current, replacement)) {
        deferred.delete(current.id);
      } else {
        deferred.set(current.id, replacement);
      }
    }
    liveView.dataset.version = version;
    if (wantedVersion === requested) wantedVersion = version;
  } catch {
    indicate('Update interrupted. Reconnecting…');
    socket?.close();
  } finally {
    fetching = false;
  }
  if (wantedVersion !== requested) void hydrate();
}

function connect() {
  socket = new WebSocket(socketUrl);
  socket.addEventListener('open', () => {
    reconnectDelay = 1000;
    indicate('Live updates', true);
  });
  socket.addEventListener('message', event => {
    indicate('Live updates', true);
    wantedVersion = event.data;
    void hydrate();
  });
  socket.addEventListener('close', () => {
    indicate('Live updates reconnecting…');
    setTimeout(connect, reconnectDelay);
    reconnectDelay = Math.min(reconnectDelay * 2, 30_000);
  });
}

document.addEventListener('focusout', () => queueMicrotask(applyDeferred));
connect();
