const App = (() => {
  const PAGES = ['dashboard', 'tasks', 'calendar', 'pomodoro', 'planner'];

  function init() {
    initModules();
    startClock();
    updateTopBarDate();
    bindGlobalEvents();
    navigate('dashboard');
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('sw.js').catch(() => {});
    }
  }

  function initModules() {
    Dashboard.init();
    TaskManager.init();
    Calendar.init();
    Pomodoro.init();
    StudyPlanner.init();
    if (typeof Notifications !== 'undefined') Notifications.init();
  }

  function navigate(page) {
    if (!PAGES.includes(page)) return;
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById(`page-${page}`).classList.add('active');
    document.querySelectorAll('.nav-item').forEach(item => item.classList.toggle('active', item.dataset.page === page));
    if (page === 'dashboard') Dashboard.render();
    if (page === 'tasks') TaskManager.renderPage();
    if (page === 'calendar') Calendar.render();
    if (page === 'planner') StudyPlanner.render();
    closeMobileSidebar();
  }

  function updateTopBarDate() {
    const el = document.getElementById('topBarDate');
    if (el) el.innerHTML = `<span id="liveClock">00:00:00</span><span style="color:var(--text-secondary)"> &middot; ${Utils.getTodayDisplay()}</span>`;
  }

  function startClock() {
    function tick() {
      const clock = document.getElementById('liveClock');
      if (clock) clock.textContent = new Date().toLocaleTimeString('en-US', { hour12: false });
    }
    tick();
    setInterval(tick, 1000);
  }

  function closeMobileSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.querySelector('.sidebar-overlay');
    if (sidebar) sidebar.classList.remove('mobile-open');
    if (overlay) overlay.classList.remove('active');
  }

  function bindGlobalEvents() {
    document.querySelectorAll('.nav-item[data-page]').forEach(item => {
      item.addEventListener('click', e => { e.preventDefault(); navigate(item.dataset.page); });
    });
    document.getElementById('sidebarToggle')?.addEventListener('click', () => document.getElementById('sidebar').classList.toggle('collapsed'));
    document.getElementById('mobileMenuBtn')?.addEventListener('click', () => {
      const sidebar = document.getElementById('sidebar');
      sidebar.classList.toggle('mobile-open');
      let overlay = document.querySelector('.sidebar-overlay');
      if (!overlay) { overlay = document.createElement('div'); overlay.className = 'sidebar-overlay'; overlay.addEventListener('click', closeMobileSidebar); document.body.appendChild(overlay); }
      overlay.classList.toggle('active');
    });
    document.getElementById('notifSettingsBtn')?.addEventListener('click', () => { if (typeof Notifications !== 'undefined') Notifications.renderSettingsModal(); });
    document.getElementById('globalSearch')?.addEventListener('input', Utils.debounce(e => {
      const q = e.target.value.trim();
      const activePage = document.querySelector('.page.active');
      const pageId = activePage?.id.replace('page-', '');
      if (pageId === 'tasks') { TaskManager.setGlobalSearch(q); TaskManager.renderPage(); }
      else { navigate('tasks'); TaskManager.setGlobalSearch(q); TaskManager.renderPage(); }
    }, 300));
    document.addEventListener('keydown', e => { if (e.ctrlKey && e.key === 'k') { e.preventDefault(); document.getElementById('globalSearch')?.focus(); } });
  }

  return { init, navigate };
})();

document.addEventListener('DOMContentLoaded', () => App.init());
