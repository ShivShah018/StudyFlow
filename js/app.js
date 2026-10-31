const App = (() => {
  const PAGES = ['dashboard', 'tasks', 'calendar', 'pomodoro', 'planner', 'analytics', 'timetable', 'documents'];

  function init() {
    initTheme();
    initModules();
    startClock();
    updateTopBarDate();
    updateStudentNameDisplay();
    bindGlobalEvents();
    navigate('dashboard');
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('sw.js').catch(() => {});
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
        Dashboard.render();
        Utils.showToast('Profile updated', 'success');
      }
      close();
    });
  }

  function initModules() {
    Dashboard.init();
    TaskManager.init();
    Calendar.init();
    Pomodoro.init();
    StudyPlanner.init();
    if (typeof Timetable !== 'undefined') Timetable.init();
    if (typeof MLAnalytics !== 'undefined') MLAnalytics.init();
    if (typeof DocumentIntelligence !== 'undefined') DocumentIntelligence.init();
    if (typeof VoiceHandler !== 'undefined') VoiceHandler.init();
    if (typeof Notifications !== 'undefined') Notifications.init();
  }

  function navigate(page) {
    if (!PAGES.includes(page)) return;
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    const targetPage = document.getElementById(`page-${page}`);
    if (targetPage) targetPage.classList.add('active');

    document.querySelectorAll('.nav-item').forEach(item => {
      item.classList.toggle('active', item.dataset.page === page);
    });

    if (page === 'dashboard') Dashboard.render();
    if (page === 'tasks') TaskManager.renderPage();
    if (page === 'calendar') Calendar.render();
    if (page === 'pomodoro' && typeof Pomodoro !== 'undefined') Pomodoro.renderFocusStats();
    if (page === 'planner') StudyPlanner.render();
    if (page === 'analytics' && typeof MLAnalytics !== 'undefined') MLAnalytics.render();
    if (page === 'timetable' && typeof Timetable !== 'undefined') Timetable.render();
    if (page === 'documents' && typeof DocumentIntelligence !== 'undefined') DocumentIntelligence.render();

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
      if (!overlay) {
        overlay = document.createElement('div');
        overlay.className = 'sidebar-overlay';
        overlay.addEventListener('click', closeMobileSidebar);
        document.body.appendChild(overlay);
      }
      overlay.classList.toggle('active');
    });

    document.getElementById('themeToggleBtn')?.addEventListener('click', toggleTheme);
    document.getElementById('profileEditBtn')?.addEventListener('click', showProfileModal);
    document.getElementById('notifSettingsBtn')?.addEventListener('click', () => {
      if (typeof Notifications !== 'undefined') Notifications.renderSettingsModal();
    });

    // Voice Assistant trigger button in top bar
    document.getElementById('voiceAssistantBtn')?.addEventListener('click', () => {
      if (typeof VoiceHandler !== 'undefined') {
        VoiceHandler.triggerVoiceListening();
      }
    });

    // Backup & Restore button in sidebar footer
    document.getElementById('backupRestoreBtn')?.addEventListener('click', () => {
      if (typeof BackupService !== 'undefined') {
        BackupService.showBackupModal();
      }
    });

    document.getElementById('globalSearch')?.addEventListener('input', Utils.debounce(e => {
      const q = e.target.value.trim();
      const activePage = document.querySelector('.page.active');
      const pageId = activePage?.id.replace('page-', '');
      if (pageId === 'tasks') {
        TaskManager.setGlobalSearch(q);
        TaskManager.renderPage();
      } else {
        navigate('tasks');
        TaskManager.setGlobalSearch(q);
        TaskManager.renderPage();
      }
    }, 300));
  }

  return { init, navigate, setTheme };
})();

document.addEventListener('DOMContentLoaded', () => App.init());
