const App = (() => {
  const PAGES = ['dashboard', 'tasks', 'calendar', 'pomodoro', 'planner'];

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

  function showBackupModal() {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay active';
    overlay.innerHTML = `
      <div class="modal" style="max-width:480px;">
        <div class="modal-header">
          <h2>Backup & Restore Data</h2>
          <button class="modal-close" id="bModalClose">&times;</button>
        </div>
        <div style="display:flex;flex-direction:column;gap:16px;">
          <p style="font-size:14px;color:var(--text-secondary);">
            Export your StudyFlow data as a JSON file for backup, or restore data from a previously saved JSON file.
          </p>
          <div style="display:flex;gap:12px;flex-wrap:wrap;">
            <button class="btn btn-primary" id="exportDataBtn" style="flex:1;">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              Export Data (JSON)
            </button>
            <label class="btn btn-secondary" style="flex:1;cursor:pointer;text-align:center;display:inline-flex;align-items:center;justify-content:center;gap:6px;">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
              Import JSON
              <input type="file" id="importFileInput" accept=".json" style="display:none;" />
            </label>
          </div>
        </div>
        <div class="form-actions" style="margin-top:20px;">
          <button type="button" class="btn btn-secondary" id="bModalClose2">Close</button>
        </div>
      </div>`;
    document.body.appendChild(overlay);
    const close = () => overlay.remove();
    document.getElementById('bModalClose').addEventListener('click', close);
    document.getElementById('bModalClose2').addEventListener('click', close);
    overlay.addEventListener('click', e => { if (e.target === overlay) close(); });

    document.getElementById('exportDataBtn').addEventListener('click', () => {
      const data = Storage.exportData();
      const jsonStr = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `studyflow_backup_${Utils.getTodayStr()}.json`;
      a.click();
      URL.revokeObjectURL(url);
      Utils.showToast('Data exported successfully', 'success');
    });

    document.getElementById('importFileInput').addEventListener('change', e => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = evt => {
        try {
          const parsed = JSON.parse(evt.target.result);
          Storage.importData(parsed);
          Utils.showToast('Data restored successfully!', 'success');
          close();
          updateStudentNameDisplay();
          Dashboard.render();
          TaskManager.renderPage();
          Calendar.render();
          StudyPlanner.generateSchedule();
        } catch (err) {
          Utils.showToast('Failed to import JSON: ' + err.message, 'error');
        }
      };
      reader.readAsText(file);
    });
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
    document.getElementById('themeToggleBtn')?.addEventListener('click', toggleTheme);
    document.getElementById('profileEditBtn')?.addEventListener('click', showProfileModal);
    document.getElementById('dataBackupBtn')?.addEventListener('click', showBackupModal);
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

