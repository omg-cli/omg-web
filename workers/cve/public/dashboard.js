const liveView = document.querySelector('#live-view');
const indicator = document.querySelector('#stream-status');
const deferred = new Map();
const socketUrl = new URL('/live', location.href);
socketUrl.protocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
let wantedVersion = '';
let fetching = false;
let reconnectDelay = 1000;
let socket;

function indicate(message) {
  indicator.textContent = message;
  indicator.hidden = !message;
}

function applyRegion(current, replacement) {
  const details = current.querySelector('details[open]');
  if (details) replacement.querySelector('details')?.setAttribute('open', '');
  const scroll = current.querySelector('.table-wrap')?.scrollLeft ?? 0;
  current.replaceWith(replacement);
  const table = replacement.querySelector('.table-wrap');
  if (table) table.scrollLeft = scroll;
}

function applyDeferred() {
  for (const [id, replacement] of deferred) {
    const current = document.getElementById(id);
    if (current?.contains(document.activeElement)) continue;
    deferred.delete(id);
    if (current) applyRegion(current, replacement);
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
      if (current.contains(document.activeElement)) {
        deferred.set(current.id, replacement);
      } else {
        deferred.delete(current.id);
        applyRegion(current, replacement);
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
    indicate('');
  });
  socket.addEventListener('message', event => {
    indicate('');
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
