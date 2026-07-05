const Dashboard = (() => {
  function init() { render(); }

  function render() {
    const container = document.getElementById('page-dashboard');
    const stats = TaskManager.getStats();
    const greeting = Utils.getGreeting();
    const todayDisplay = Utils.getTodayDisplay();
    const recentTasks = Storage.getTasks().filter(t => !t.completed).slice(0, 5);
    const circumference = 2 * Math.PI * 38;
    const offset = circumference - (stats.pct / 100) * circumference;

    container.innerHTML = `
      <div class="dashboard-welcome"><h2>${greeting}, Student!</h2><p class="welcome-subtitle">${todayDisplay}</p></div>
      <div class="stats-grid">
        <div class="stat-card"><div class="stat-icon blue"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg></div><div class="stat-info"><h4>Total Tasks</h4><div class="stat-value">${stats.total}</div></div></div>
        <div class="stat-card"><div class="stat-icon green"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg></div><div class="stat-info"><h4>Completed</h4><div class="stat-value">${stats.completed}</div></div></div>
        <div class="stat-card"><div class="stat-icon yellow"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v4M12 22v-4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M22 12h-4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg></div><div class="stat-info"><h4>Pending</h4><div class="stat-value">${stats.pending}</div></div></div>
        <div class="stat-card"><div class="stat-icon purple"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg></div><div class="stat-info"><h4>Productivity</h4><div class="stat-value">${stats.pct}%</div></div></div>
      </div>
      <div class="quick-actions"><h3>Quick Actions</h3><div class="quick-actions-grid">
        <button class="quick-action-btn" data-action="addTask"><span class="qa-icon blue"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg></span>New Task</button>
        <button class="quick-action-btn" data-action="goToTasks"><span class="qa-icon green"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg></span>View Tasks</button>
        <button class="quick-action-btn" data-action="goToPomodoro"><span class="qa-icon yellow"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg></span>Start Timer</button>
        <button class="quick-action-btn" data-action="goToPlanner"><span class="qa-icon red"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg></span>Study Planner</button>
        <button class="quick-action-btn" data-action="goToCalendar"><span class="qa-icon" style="background:var(--success-light);color:var(--success);"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg></span>View Calendar</button>
      </div></div>
      <div class="dashboard-bottom">
        <div class="glass-card"><h3><span>Recent Tasks</span><button class="btn btn-sm btn-secondary" data-action="goToTasks">View All</button></h3>${recentTasks.length === 0 ? '<div class="upcoming-empty">No pending tasks. Great job!</div>' : recentTasks.map(t => `<div class="recent-task-item"><div class="recent-task-check" data-id="${t.id}"></div><div class="recent-task-info"><div class="task-title">${t.title}</div><div class="task-meta"><span class="badge badge-${t.priority||'medium'}">${Utils.capitalize(t.priority||'medium')}</span>${t.category ? `<span class="task-category">${t.category}</span>` : ''}</div></div></div>`).join('')}</div>
        <div class="glass-card"><h3>Productivity Overview</h3><div class="productivity-ring"><div class="ring-container"><svg width="100" height="100" viewBox="0 0 100 100"><circle class="ring-bg" cx="50" cy="50" r="38"/><circle class="ring-progress" cx="50" cy="50" r="38" stroke-dasharray="${circumference}" stroke-dashoffset="${offset}"/></svg><div class="ring-label"><span class="pct">${stats.pct}%</span><span class="pct-label">Done</span></div></div><div class="ring-stats"><div class="ring-stat"><span class="ring-stat-dot" style="background:var(--accent)"></span>Completed: <strong>${stats.completed}</strong></div><div class="ring-stat"><span class="ring-stat-dot" style="background:var(--warning)"></span>Pending: <strong>${stats.pending}</strong></div><div class="ring-stat"><span class="ring-stat-dot" style="background:var(--border-color)"></span>Total: <strong>${stats.total}</strong></div></div></div></div>
      </div>`;
    bindEvents();
  }

  function handleQuickAction(e) {
    const btn = e.target.closest('[data-action]'); if (!btn) return;
    const a = btn.dataset.action;
    if (a === 'addTask') TaskManager.showTaskModal();
    else if (a === 'goToTasks') App.navigate('tasks');
    else if (a === 'goToPomodoro') App.navigate('pomodoro');
    else if (a === 'goToPlanner') App.navigate('planner');
    else if (a === 'goToCalendar') App.navigate('calendar');
  }

  function handleRecentCheck(e) {
    const check = e.target.closest('.recent-task-check'); if (!check) return;
    Storage.toggleTaskComplete(check.dataset.id); render(); TaskManager.renderPage(); Calendar.render();
    if (typeof StudyPlanner !== 'undefined') StudyPlanner.generateSchedule();
  }

  function bindEvents() {
    const container = document.getElementById('page-dashboard');
    if (!container) return;
    container.removeEventListener('click', handleQuickAction);
    container.removeEventListener('click', handleRecentCheck);
    container.addEventListener('click', handleQuickAction);
    container.addEventListener('click', handleRecentCheck);
  }

  return { init, render };
})();
