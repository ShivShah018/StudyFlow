const App = (() => {
  const PAGES = ['dashboard', 'tasks', 'calendar', 'pomodoro', 'planner', 'analytics', 'timetable', 'documents'];
  let isInitialized = false;

  function init() {
    if (isInitialized) return;
    isInitialized = true;

    try {
      initTheme();
    } catch (e) {
      console.warn('Theme init notice:', e);
    }

    try {
      startClock();
      updateTopBarDate();
      updateStudentNameDisplay();
    } catch (e) {
      console.warn('Top bar clock/date init notice:', e);
    }

    // 1. Bind global shell & navigation events FIRST so all buttons and links are interactive
    try {
      bindGlobalEvents();
    } catch (e) {
      console.error('Error binding global events:', e);
    }

    // 2. Initialize application modules with strict isolation
    initModules();

    // 3. Navigate to initial dashboard view
    try {
      navigate('dashboard');
    } catch (e) {
      console.error('Error during initial dashboard navigation:', e);
    }

    // 4. Register service worker using relative path for GitHub Pages compatibility
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('./sw.js').catch((err) => {
        console.warn('Service Worker registration skipped:', err);
      });
    }
  }

  function initTheme() {
    const savedTheme = localStorage.getItem('studyflow_theme') || 'dark';
    setTheme(savedTheme);
  }

  function setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('studyflow_theme', theme);
    const sunIcon = document.getElementById('themeIconSun');
    const moonIcon = document.getElementById('themeIconMoon');
    const themeLabel = document.getElementById('themeLabel');
    if (theme === 'light') {
      if (sunIcon) sunIcon.style.display = '';
      if (moonIcon) moonIcon.style.display = 'none';
      if (themeLabel) themeLabel.textContent = 'Light';
    } else {
      if (sunIcon) sunIcon.style.display = 'none';
      if (moonIcon) moonIcon.style.display = '';
      if (themeLabel) themeLabel.textContent = 'Dark';
    }
  }

  function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme') || 'dark';
    setTheme(current === 'dark' ? 'light' : 'dark');
  }

  function updateStudentNameDisplay() {
    const el = document.getElementById('sidebarStudentName');
    if (el) el.textContent = Storage.getStudentName ? Storage.getStudentName() : 'Student Profile';
  }

  function showProfileModal() {
    const currentName = Storage.getStudentName ? Storage.getStudentName() : 'Student';
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay active';
    overlay.innerHTML = `
      <div class="modal" style="max-width:420px;">
        <div class="modal-header">
          <h2>Student Profile</h2>
          <button class="modal-close" id="pModalClose">&times;</button>
        </div>
        <form id="profileForm">
          <div class="form-group">
            <label for="studentNameInput">Your Name</label>
            <input type="text" id="studentNameInput" value="${Utils.escapeHTML(currentName)}" placeholder="e.g. Alex Sharma" required />
          </div>
          <div class="form-actions">
            <button type="button" class="btn btn-secondary" id="pModalCancel">Cancel</button>
            <button type="submit" class="btn btn-primary">Save Profile</button>
          </div>
        </form>
      </div>`;
    document.body.appendChild(overlay);
    const close = () => overlay.remove();
    document.getElementById('pModalClose').addEventListener('click', close);
    document.getElementById('pModalCancel').addEventListener('click', close);
    overlay.addEventListener('click', e => { if (e.target === overlay) close(); });
    document.getElementById('profileForm').addEventListener('submit', e => {
      e.preventDefault();
      const val = document.getElementById('studentNameInput').value.trim();
      if (val && Storage.setStudentName) {
        Storage.setStudentName(val);
        updateStudentNameDisplay();
        if (typeof Dashboard !== 'undefined') Dashboard.render();
        Utils.showToast('Profile updated', 'success');
      }
      close();
    });
  }

  function initModules() {
    const moduleList = [
      { name: 'Dashboard', fn: () => typeof Dashboard !== 'undefined' && Dashboard.init() },
      { name: 'TaskManager', fn: () => typeof TaskManager !== 'undefined' && TaskManager.init() },
      { name: 'Calendar', fn: () => typeof Calendar !== 'undefined' && Calendar.init() },
      { name: 'Pomodoro', fn: () => typeof Pomodoro !== 'undefined' && Pomodoro.init() },
      { name: 'StudyPlanner', fn: () => typeof StudyPlanner !== 'undefined' && StudyPlanner.init() },
      { name: 'Timetable', fn: () => typeof Timetable !== 'undefined' && Timetable.init() },
      { name: 'MLAnalytics', fn: () => typeof MLAnalytics !== 'undefined' && MLAnalytics.init() },
      { name: 'DocumentIntelligence', fn: () => typeof DocumentIntelligence !== 'undefined' && DocumentIntelligence.init() },
      { name: 'VoiceHandler', fn: () => typeof VoiceHandler !== 'undefined' && VoiceHandler.init() },
      { name: 'Notifications', fn: () => typeof Notifications !== 'undefined' && Notifications.init() }
    ];

    moduleList.forEach(m => {
      try {
        m.fn();
      } catch (err) {
        console.error(`[StudyFlow] Failed to initialize module ${m.name}:`, err);
      }
    });
  }

  function navigate(page) {
    if (!PAGES.includes(page)) return;
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    const targetPage = document.getElementById(`page-${page}`);
    if (targetPage) targetPage.classList.add('active');

    document.querySelectorAll('.nav-item').forEach(item => {
      item.classList.toggle('active', item.dataset.page === page);
    });

    try {
      if (page === 'dashboard' && typeof Dashboard !== 'undefined') Dashboard.render();
      if (page === 'tasks' && typeof TaskManager !== 'undefined') TaskManager.renderPage();
      if (page === 'calendar' && typeof Calendar !== 'undefined') Calendar.render();
      if (page === 'pomodoro' && typeof Pomodoro !== 'undefined') {
        Pomodoro.renderFocusStats();
        if (typeof Pomodoro.updateDisplay === 'function') Pomodoro.updateDisplay();
      }
      if (page === 'planner' && typeof StudyPlanner !== 'undefined') StudyPlanner.render();
      if (page === 'analytics' && typeof MLAnalytics !== 'undefined') MLAnalytics.render();
      if (page === 'timetable' && typeof Timetable !== 'undefined') Timetable.render();
      if (page === 'documents' && typeof DocumentIntelligence !== 'undefined') DocumentIntelligence.render();
    } catch (err) {
      console.error(`[StudyFlow] Error rendering page "${page}":`, err);
    }

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
    // 1. Sidebar navigation with event delegation
    const sidebarNav = document.querySelector('.sidebar-nav');
    if (sidebarNav) {
      sidebarNav.addEventListener('click', e => {
        const item = e.target.closest('.nav-item[data-page]');
        if (item) {
          e.preventDefault();
          navigate(item.dataset.page);
        }
      });
    }

    // Direct event listener fallback for all navigation links
    document.querySelectorAll('.nav-item[data-page]').forEach(item => {
      item.addEventListener('click', e => {
        e.preventDefault();
        navigate(item.dataset.page);
      });
    });

    // 2. Sidebar and mobile controls
    document.getElementById('sidebarToggle')?.addEventListener('click', () => {
      document.getElementById('sidebar')?.classList.toggle('collapsed');
    });

    document.getElementById('mobileMenuBtn')?.addEventListener('click', () => {
      const sidebar = document.getElementById('sidebar');
      if (!sidebar) return;
      sidebar.classList.toggle('mobile-open');
      let overlay = document.querySelector('.sidebar-overlay');
      if (!overlay) {
        overlay = document.createElement('div');
        overlay.className = 'sidebar-overlay';
        overlay.addEventListener('click', closeMobileSidebar);
        document.body.appendChild(overlay);
      }
      overlay.classList.toggle('active');
    });

    // 3. Theme Toggle
    document.getElementById('themeToggleBtn')?.addEventListener('click', toggleTheme);

    // 4. Student Profile Modal
    document.getElementById('profileEditBtn')?.addEventListener('click', showProfileModal);

    // 5. Notifications Settings
    document.getElementById('notifSettingsBtn')?.addEventListener('click', () => {
      if (typeof Notifications !== 'undefined' && typeof Notifications.renderSettingsModal === 'function') {
        Notifications.renderSettingsModal();
      }
    });

    // 6. Voice Assistant Trigger
    document.getElementById('voiceAssistantBtn')?.addEventListener('click', () => {
      if (typeof VoiceHandler !== 'undefined') {
        VoiceHandler.triggerVoiceListening();
      } else {
        Utils.showToast('Voice Assistant module is initializing...', 'info');
      }
    });

    // 7. Backup & Restore
    document.getElementById('backupRestoreBtn')?.addEventListener('click', () => {
      if (typeof BackupService !== 'undefined') {
        BackupService.showBackupModal();
      } else {
        Utils.showToast('Backup Service module is initializing...', 'info');
      }
    });

    // 8. Global Search
    document.getElementById('globalSearch')?.addEventListener('input', Utils.debounce(e => {
      const q = e.target.value.trim();
      const activePage = document.querySelector('.page.active');
      const pageId = activePage?.id.replace('page-', '');
      if (pageId === 'tasks') {
        if (typeof TaskManager !== 'undefined') {
          TaskManager.setGlobalSearch(q);
          TaskManager.renderPage();
        }
      } else {
        navigate('tasks');
        if (typeof TaskManager !== 'undefined') {
          TaskManager.setGlobalSearch(q);
          TaskManager.renderPage();
        }
      }
    }, 300));
  }

  return { init, navigate, setTheme };
})();

// Reliable initialization handling: execute immediately if document is already parsed,
// otherwise bind to DOMContentLoaded.
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => App.init());
} else {
  App.init();
}
