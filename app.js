(() => {
  const STORE_KEY = 'trace-activity-demo-v1';
  const appCatalog = [
    { id: 'com.google.android.youtube', name: 'YouTube', category: 'Video', icon: '▶', color: '#fff0ed', ink: '#df5549', detail: 'Video & entertainment' },
    { id: 'com.whatsapp', name: 'WhatsApp', category: 'Social', icon: '◉', color: '#e8f7ed', ink: '#36a36f', detail: 'Messages & calls' },
    { id: 'com.google.android.gm', name: 'Gmail', category: 'Productivity', icon: 'M', color: '#fff0ee', ink: '#d86156', detail: 'Email & communication' },
    { id: 'com.instagram.android', name: 'Instagram', category: 'Social', icon: '◎', color: '#f8eefa', ink: '#af69aa', detail: 'Social & community' },
    { id: 'com.spotify.music', name: 'Spotify', category: 'Music', icon: '◖', color: '#eaf7ed', ink: '#31a25c', detail: 'Music & audio' },
    { id: 'com.google.android.apps.maps', name: 'Google Maps', category: 'Navigation', icon: '⌖', color: '#edf4fa', ink: '#5b8eb6', detail: 'Maps & navigation' },
    { id: 'com.android.chrome', name: 'Chrome', category: 'Browser', icon: '◉', color: '#fff5e8', ink: '#d18b43', detail: 'Web browsing' },
    { id: 'com.slack', name: 'Slack', category: 'Productivity', icon: '#', color: '#f2effa', ink: '#856ab2', detail: 'Work & collaboration' },
    { id: 'com.google.android.apps.photos', name: 'Photos', category: 'Media', icon: '✿', color: '#eef4ff', ink: '#6489c0', detail: 'Photo library' },
    { id: 'com.android.settings', name: 'Settings', category: 'System', icon: '⚙', color: '#f0f3f2', ink: '#75847f', detail: 'Device settings' }
  ];
  const defaultState = () => ({
    tracking: false,
    connected: false,
    lastSync: null,
    sessions: [
      ['com.google.android.youtube', 18, 24], ['com.whatsapp', 29, 11], ['com.google.android.gm', 43, 8],
      ['com.instagram.android', 57, 19], ['com.spotify.music', 91, 31], ['com.google.android.apps.maps', 135, 12],
      ['com.android.chrome', 182, 28], ['com.slack', 228, 23], ['com.google.android.youtube', 302, 37],
      ['com.whatsapp', 397, 16], ['com.google.android.apps.photos', 486, 29], ['com.android.chrome', 592, 24]
    ].map(([appId, minsAgo, duration]) => session(appId, minsAgo, duration))
  });
  function session(appId, minsAgo, durationMinutes) {
    const end = Date.now() - minsAgo * 60_000;
    const start = end - durationMinutes * 60_000;
    return { id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`, appId, start, end, seconds: durationMinutes * 60 };
  }

  let state = readState();
  let filter = 'all';
  let toastTimer;
  const $ = (selector) => document.querySelector(selector);

  function readState() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORE_KEY));
      if (saved && Array.isArray(saved.sessions)) return { ...defaultState(), ...saved };
    } catch (_) { /* use sample data */ }
    return defaultState();
  }
  function save() { localStorage.setItem(STORE_KEY, JSON.stringify(state)); }
  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
  }
  function getApp(id) { return appCatalog.find((app) => app.id === id) || { name: id, category: 'App', icon: '◻', color: '#eff3f2', ink: '#75847f', detail: 'Application' }; }
  function fmtDuration(seconds) {
    const minutes = Math.max(1, Math.round(seconds / 60));
    return minutes >= 60 ? `${Math.floor(minutes / 60)}h ${minutes % 60}m` : `${minutes} min`;
  }
  function timeAgo(timestamp) {
    const minutes = Math.max(0, Math.floor((Date.now() - timestamp) / 60_000));
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes} min ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours} hr${hours > 1 ? 's' : ''} ago`;
  }
  function clock(timestamp) {
    return new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' }).format(new Date(timestamp));
  }
  function isToday(timestamp) {
    const a = new Date(timestamp), b = new Date();
    return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  }
  function todayLabel() {
    $('#today-label').textContent = new Intl.DateTimeFormat(undefined, { weekday: 'long', month: 'long', day: 'numeric' }).format(new Date()).toUpperCase();
  }
  function showToast(message) {
    const toast = $('#toast'); toast.textContent = message; toast.classList.add('show');
    clearTimeout(toastTimer); toastTimer = setTimeout(() => toast.classList.remove('show'), 2800);
  }
  function render() {
    todayLabel(); renderMetrics(); renderList(); renderChart(); renderSync(); renderPipeline();
  }
  function renderMetrics() {
    const totalSeconds = state.sessions.reduce((sum, row) => sum + Number(row.seconds || 0), 0);
    $('#screen-time').textContent = fmtDuration(totalSeconds).replace(' min', 'm').replace(/h (\d+)m/, 'h $1m');
    $('#session-count').textContent = state.sessions.length;
    $('#nav-count').textContent = state.sessions.length;
    const appCount = new Set(state.sessions.map((row) => row.appId)).size;
    $('#app-count').textContent = `${appCount} app${appCount === 1 ? '' : 's'}`;
    $('#chart-total').textContent = `${fmtDuration(totalSeconds)} total`;
    $('#tracking-label').innerHTML = state.tracking ? '<i></i> ACTIVE' : '<i></i> PAUSED';
    $('#tracking-text').textContent = state.tracking ? 'Active' : 'Paused';
    $('#tracking-foot').textContent = state.tracking ? 'Sample events can be added' : 'No new events are being added';
    $('#tracking-toggle').innerHTML = state.tracking ? 'Pause logging <span>Ⅱ</span>' : 'Enable logging <span>→</span>';
    $('.tracking-card').classList.toggle('is-on', state.tracking);
  }
  function renderList() {
    const query = $('#search-input').value.trim().toLowerCase();
    const items = state.sessions.filter((row) => {
      const app = getApp(row.appId);
      return (filter !== 'today' || isToday(row.start)) && (!query || app.name.toLowerCase().includes(query) || app.category.toLowerCase().includes(query));
    }).sort((a, b) => b.start - a.start);
    const host = $('#activity-list');
    host.innerHTML = items.slice(0, 8).map((row, index) => {
      const app = getApp(row.appId);
      return `<article class="activity-row" style="animation-delay:${index * 25}ms">
        <div class="app-symbol" style="background:${app.color};color:${app.ink}">${escapeHtml(app.icon)}</div>
        <div class="app-main"><div class="app-title-row"><span class="app-title">${escapeHtml(app.name)}</span><span class="app-category">${escapeHtml(app.category)}</span></div><div class="app-subtitle">${escapeHtml(app.detail)} · ${clock(row.start)} – ${clock(row.end)}</div></div>
        <div class="session-duration">${fmtDuration(row.seconds)}<span>${timeAgo(row.end)}</span></div>
      </article>`;
    }).join('');
    $('#empty-state').hidden = items.length !== 0;
    host.hidden = items.length === 0;
    $('#list-summary').textContent = items.length ? `Showing ${Math.min(items.length, 8)} of ${items.length} sessions` : '0 sessions';
    $('#pipeline-local').textContent = `${state.sessions.length} session${state.sessions.length === 1 ? '' : 's'} stored`;
  }
  function renderChart() {
    const chart = $('#bar-chart');
    const hours = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19];
    const bins = hours.map(() => 0);
    state.sessions.forEach((row) => {
      const hour = new Date(row.start).getHours();
      const index = hours.indexOf(hour);
      if (index >= 0) bins[index] += row.seconds / 60;
    });
    const max = Math.max(60, ...bins);
    const labels = ['8a', '9a', '10a', '11a', '12p', '1p', '2p', '3p', '4p', '5p', '6p', '7p'];
    chart.innerHTML = bins.map((minutes, i) => {
      const height = minutes ? Math.max(8, Math.round((minutes / max) * 100)) : 3;
      const hourNow = new Date().getHours() === hours[i];
      return `<div class="bar-group"><div class="bar ${hourNow ? 'current' : ''}" style="height:${height}%" data-tip="${Math.round(minutes)} min"></div><span class="bar-label">${labels[i]}</span></div>`;
    }).join('');
  }
  function renderSync() {
    const card = $('.dropbox-card');
    card.classList.toggle('is-connected', state.connected);
    $('#dropbox-status').textContent = state.connected ? 'Connected · demo account' : 'Not connected';
    $('#connect-dropbox').innerHTML = state.connected ? 'Disconnect <span>×</span>' : 'Connect <span>→</span>';
    $('#sync-now').disabled = !state.connected || !state.sessions.length;
    $('#sync-foot').textContent = state.lastSync ? 'Synced to demo Dropbox' : (state.connected ? 'Ready to sync on request' : 'Waiting for Dropbox');
    $('#last-sync').textContent = state.lastSync ? timeAgo(state.lastSync).replace(' ago', '') : 'Not synced';
    $('.sync-state-dot').classList.toggle('is-synced', Boolean(state.lastSync));
    $('#pipeline-cloud').textContent = state.connected ? (state.lastSync ? `Synced ${timeAgo(state.lastSync)}` : 'Connected · awaiting sync') : 'Awaiting connection';
    $('#pipeline-cloud-state').textContent = state.connected ? 'CONNECTED' : 'OPTIONAL';
    $('#pipeline-cloud-state').classList.toggle('green', state.connected);
  }
  function modal(open) { $('#consent-modal').hidden = !open; if (open) $('#confirm-enable').focus(); }
  function enableLogging() { state.tracking = true; save(); renderMetrics(); showToast('Demo logging enabled. Add a sample event to see it in the log.'); }
  function simulateActivity() {
    if (!state.tracking) { showToast('Enable activity logging first to add a sample event.'); modal(true); return; }
    const options = appCatalog.filter((app) => app.id !== 'com.android.settings');
    const app = options[Math.floor(Math.random() * options.length)];
    const duration = 5 + Math.floor(Math.random() * 36);
    state.sessions.unshift(session(app.id, 0, duration));
    state.sessions = state.sessions.slice(0, 100);
    save(); render(); showToast(`${app.name} session added to the local demo log.`);
  }
  function connectDropbox() {
    if (state.connected) {
      state.connected = false; state.lastSync = null; save(); renderSync(); showToast('Demo Dropbox disconnected.'); return;
    }
    state.connected = true; save(); renderSync(); showToast('Demo Dropbox connected. No account was contacted.');
  }
  function syncNow() {
    if (!state.connected || !state.sessions.length) return;
    const button = $('#sync-now'), progress = $('#sync-progress');
    button.disabled = true; progress.hidden = false;
    const stages = [[20, 'Preparing local activity file…'], [48, 'Packaging  ' + state.sessions.length + ' demo sessions…'], [76, 'Simulating Dropbox upload…'], [100, 'Demo sync complete']];
    stages.forEach(([percent, label], index) => setTimeout(() => {
      $('#progress-bar').style.width = `${percent}%`; $('#progress-percent').textContent = `${percent}%`; $('#progress-label').textContent = label;
      if (percent === 100) {
        state.lastSync = Date.now(); save(); renderSync();
        setTimeout(() => { progress.hidden = true; $('#progress-bar').style.width = '0%'; button.disabled = !state.connected || !state.sessions.length; showToast('Demo sync complete. No data was sent to Dropbox.'); }, 850);
      }
    }, (index + 1) * 520));
  }
  function downloadLog() {
    const exportData = { demo: true, generatedAt: new Date().toISOString(), source: 'Browser simulation — sample events only', sessions: state.sessions.map((row) => ({
      packageName: row.appId, appName: getApp(row.appId).name, startedAt: new Date(row.start).toISOString(), endedAt: new Date(row.end).toISOString(), durationSeconds: row.seconds
    })) };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob), link = document.createElement('a');
    link.href = url; link.download = 'trace-activity-demo.json'; link.click(); URL.revokeObjectURL(url);
    showToast('Demo log downloaded as JSON.');
  }
  function clearLog() {
    if (!state.sessions.length) { showToast('The local demo log is already empty.'); return; }
    if (!window.confirm('Clear all sample sessions from this browser? This will not change a file already exported.')) return;
    state.sessions = []; state.lastSync = null; save(); render(); showToast('Local demo history cleared.');
  }
  function resetDemo() {
    if (!window.confirm('Reset the demo to its original sample data?')) return;
    localStorage.removeItem(STORE_KEY); state = defaultState(); render(); showToast('Demo reset to sample data.');
  }

  $('#tracking-toggle').addEventListener('click', () => state.tracking ? (state.tracking = false, save(), renderMetrics(), showToast('Demo logging paused.')) : modal(true));
  $('#confirm-enable').addEventListener('click', () => { modal(false); enableLogging(); });
  document.querySelectorAll('[data-close-modal]').forEach((button) => button.addEventListener('click', () => modal(false)));
  $('#consent-modal').addEventListener('click', (event) => { if (event.target === $('#consent-modal')) modal(false); });
  document.addEventListener('keydown', (event) => { if (event.key === 'Escape') modal(false); });
  $('#simulate-top').addEventListener('click', simulateActivity); $('#empty-simulate').addEventListener('click', simulateActivity);
  $('#connect-dropbox').addEventListener('click', connectDropbox); $('#sync-now').addEventListener('click', syncNow);
  $('#download-log').addEventListener('click', downloadLog); $('#clear-log').addEventListener('click', clearLog); $('#reset-demo').addEventListener('click', resetDemo);
  $('#search-input').addEventListener('input', renderList);
  document.querySelectorAll('[data-filter]').forEach((button) => button.addEventListener('click', () => {
    filter = button.dataset.filter; document.querySelectorAll('[data-filter]').forEach((item) => item.classList.toggle('filter-active', item === button)); renderList();
  }));
  $('#week-view').addEventListener('click', () => showToast('The demo currently displays the sample view for today.'));
  $('#dismiss-notice').addEventListener('click', () => $('.demo-notice').remove());
  document.querySelectorAll('.main-nav a').forEach((link) => link.addEventListener('click', () => {
    document.querySelectorAll('.main-nav a').forEach((item) => item.classList.toggle('active', item === link));
  }));
  render();
})();
