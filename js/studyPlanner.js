const StudyPlanner = (() => {
  const STUDY_HOURS = { start: 8, end: 22 };
  const SLOT_DURATION = 50;
  const BREAK_DURATION = 10;
  const MAX_SPLIT_BLOCKS = 3;
  let dragState = null;

  function init() { generateSchedule(); render(); }

  function generateSchedule() {
    const tasks = Storage.getTasks().filter(t => !t.completed && t.dueDate && t.estimatedDuration);
    const schedule = Storage.getPlannerSchedule() || { sessions: [], generatedAt: null };
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const sorted = tasks.sort((a, b) => {
      const da = new Date(a.dueDate), db = new Date(b.dueDate);
      if (da - db !== 0) return da - db;
      const rank = { high: 0, medium: 1, low: 2 };
      return rank[a.priority] - rank[b.priority];
    });
    const oldSessions = schedule.sessions || [];
    const keptSessions = oldSessions.filter(s => { if (s.completed) return true; const task = tasks.find(t => t.id === s.taskId); return task && !task.completed; });
    const newSessions = scheduleStudyBlocks(sorted, keptSessions);
    const merged = mergeSessions(keptSessions.filter(s => s.completed), newSessions);
    Storage.savePlannerSchedule({ sessions: merged, generatedAt: new Date().toISOString() });
  }

  function scheduleStudyBlocks(tasks, existingSessions) {
    const sessions = [];
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const existingMap = {};
    existingSessions.forEach(s => { if (!s.completed) existingMap[s.taskId] = s; });
    tasks.forEach(task => {
      if (existingMap[task.id]) { sessions.push(existingMap[task.id]); return; }
      const due = new Date(task.dueDate + 'T12:00:00'); due.setHours(0, 0, 0, 0);
      let daysUntilDue = Math.ceil((due - today) / (1000 * 60 * 60 * 24));
      if (daysUntilDue < 0) daysUntilDue = 0;
      const workingDays = Math.max(1, daysUntilDue + 1);
      let totalMin = parseInt(task.estimatedDuration) || 60;
      const subject = task.subject || task.category || 'General';
      let perDay = Math.ceil(totalMin / workingDays);
      perDay = Math.min(perDay, totalMin);
      let scheduled = 0;
      for (let d = 0; d < workingDays && scheduled < totalMin; d++) {
        const date = new Date(today); date.setDate(date.getDate() + d);
        const dateStr = formatDateStr(date);
        let blockMin = Math.min(perDay, totalMin - scheduled);
        let numBlocks = Math.min(Math.ceil(blockMin / SLOT_DURATION), MAX_SPLIT_BLOCKS);
        for (let b = 0; b < numBlocks && scheduled < totalMin; b++) {
          const blockDuration = b === numBlocks - 1 ? blockMin - (SLOT_DURATION * b) : SLOT_DURATION;
          const actualDuration = Math.min(blockDuration, totalMin - scheduled);
          if (actualDuration <= 0) break;
          const startTime = findFreeSlot(dateStr, actualDuration, sessions);
          if (startTime) {
            sessions.push({ id: Utils.generateId(), taskId: task.id, title: task.title, subject, date: dateStr, startTime, duration: actualDuration, priority: task.priority, completed: false, deadline: task.dueDate });
            scheduled += actualDuration;
          } else break;
        }
      }
    });
    return sessions;
  }

  function findFreeSlot(dateStr, duration, existingSessions) {
    const dayStart = STUDY_HOURS.start, dayEnd = STUDY_HOURS.end;
    const daySessions = existingSessions.filter(s => s.date === dateStr && !s.completed).sort((a, b) => a.startTime.localeCompare(b.startTime));
    let cursor = dayStart;
    for (const session of daySessions) {
      const [sh, sm] = session.startTime.split(':').map(Number);
      const sessionStart = sh + sm / 60;
      const sessionEnd = sessionStart + (session.duration || SLOT_DURATION) / 60;
      if (cursor + duration / 60 <= sessionStart) { const h = Math.floor(cursor); const m = Math.round((cursor - h) * 60); if (h >= dayStart && h + duration / 60 <= dayEnd) return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`; }
      cursor = Math.max(cursor, sessionEnd + BREAK_DURATION / 60);
    }
    if (cursor + duration / 60 <= dayEnd) { const h = Math.floor(cursor); const m = Math.round((cursor - h) * 60); return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`; }
    return null;
  }

  function mergeSessions(completed, newSessions) {
    const all = [...completed, ...newSessions];
    const seen = new Map();
    all.forEach(s => { if (!seen.has(s.id) || s.completed) seen.set(s.id, s); });
    return Array.from(seen.values());
  }

  function formatDateStr(date) { return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`; }

  function getStats() {
    const schedule = Storage.getPlannerSchedule();
    const sessions = schedule?.sessions || [];
    const today = Utils.getTodayStr();
    const tomorrow = Utils.getTomorrowStr();
    const todaySessions = sessions.filter(s => s.date === today);
    const tomorrowSessions = sessions.filter(s => s.date === tomorrow);
    const completedToday = todaySessions.filter(s => s.completed).length;
    const totalToday = todaySessions.length;
    const completedMin = sessions.filter(s => s.completed).reduce((sum, s) => sum + (s.duration || 0), 0);
    const totalMin = sessions.reduce((sum, s) => sum + (s.duration || 0), 0);
    const pct = totalMin > 0 ? Math.round((completedMin / totalMin) * 100) : 0;
    const upcomingDeadlines = Storage.getTasks().filter(t => !t.completed && t.dueDate).sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate)).slice(0, 5);
    const priorityTasks = Storage.getTasks().filter(t => !t.completed && t.priority === 'high').sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate)).slice(0, 5);
    const completedDates = sessions.filter(s => s.completed).map(s => s.date);
    const uniqueDates = [...new Set(completedDates)];
    Storage.savePlannerCompletedDates(uniqueDates);
    const streak = typeof Notifications !== 'undefined' ? Notifications.calculateStreak?.(uniqueDates) || 0 : 0;
    return { todaySessions, tomorrowSessions, completedToday, totalToday, totalPlannedMin: totalMin, pct, upcomingDeadlines, priorityTasks, streak };
  }

  function render() {
    const container = document.getElementById('page-planner');
    const stats = getStats();
    const schedule = Storage.getPlannerSchedule();
    const totalHours = Math.floor(stats.totalPlannedMin / 60);
    const totalMins = stats.totalPlannedMin % 60;
    container.innerHTML = `
      <div style="max-width:1000px;margin:0 auto;">
        <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;margin-bottom:24px;"><div><h2 style="font-size:24px;font-weight:800;letter-spacing:-0.3px;">Study Planner</h2><p style="color:var(--text-secondary);font-size:14px;">Auto-generated schedule from your tasks</p></div><button class="btn btn-secondary" id="regeneratePlanBtn"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg> Regenerate</button></div>
        <div class="stats-grid" style="grid-template-columns:repeat(auto-fit,minmax(150px,1fr));margin-bottom:24px;">
          <div class="stat-card"><div class="stat-icon blue"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg></div><div class="stat-info"><h4>Today</h4><div class="stat-value">${stats.completedToday}/${stats.totalToday}</div><div class="stat-sub">sessions done</div></div></div>
          <div class="stat-card"><div class="stat-icon green"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg></div><div class="stat-info"><h4>Progress</h4><div class="stat-value">${stats.pct}%</div><div class="stat-sub">overall</div></div></div>
          <div class="stat-card"><div class="stat-icon purple"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v4M12 22v-4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M22 12h-4"/></svg></div><div class="stat-info"><h4>Planned</h4><div class="stat-value">${totalHours}h ${totalMins}m</div><div class="stat-sub">total study time</div></div></div>
          <div class="stat-card"><div class="stat-icon yellow"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg></div><div class="stat-info"><h4>Streak</h4><div class="stat-value">${stats.streak}d</div><div class="stat-sub">study streak</div></div></div>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:24px;">
          <div class="card"><h3 style="font-size:16px;font-weight:700;margin-bottom:6px;">Today's Plan</h3><p style="color:var(--text-secondary);font-size:13px;margin-bottom:14px;">${stats.todaySessions.length} session(s)</p>${renderSessionList(stats.todaySessions)}</div>
          <div class="card"><h3 style="font-size:16px;font-weight:700;margin-bottom:6px;">Tomorrow's Plan</h3><p style="color:var(--text-secondary);font-size:13px;margin-bottom:14px;">${stats.tomorrowSessions.length} session(s)</p>${renderSessionList(stats.tomorrowSessions)}</div>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:20px;">
          <div class="card"><h3 style="font-size:16px;font-weight:700;margin-bottom:14px;">Upcoming Deadlines</h3>${stats.upcomingDeadlines.length === 0 ? '<div class="upcoming-empty">No upcoming deadlines</div>' : stats.upcomingDeadlines.map(t => `<div class="calendar-task-item"><span class="calendar-task-dot" style="background:${t.priority==='high'?'var(--priority-high)':t.priority==='medium'?'var(--priority-medium)':'var(--priority-low)'}"></span><span class="calendar-task-info">${t.title} <span class="badge badge-${t.priority||'medium'}">${t.dueDate?Utils.daysUntil(t.dueDate):''}</span></span></div>`).join('')}</div>
          <div class="card"><h3 style="font-size:16px;font-weight:700;margin-bottom:14px;">High Priority Tasks</h3>${stats.priorityTasks.length === 0 ? '<div class="upcoming-empty">No high priority tasks</div>' : stats.priorityTasks.map(t => `<div class="calendar-task-item"><span class="calendar-task-dot" style="background:var(--priority-high)"></span><span class="calendar-task-info">${t.title}${t.dueDate?`<span style="font-size:12px;color:var(--text-secondary);margin-left:8px;">${Utils.formatDateShort(t.dueDate)}</span>`:''}</span></div>`).join('')}</div>
        </div>
      </div>`;
    bindEvents();
  }

  function renderSessionList(sessions) {
    if (!sessions || sessions.length === 0) return '<div class="upcoming-empty">No sessions scheduled</div>';
    return sessions.sort((a, b) => a.startTime.localeCompare(b.startTime)).map(s => `
      <div class="planner-session ${s.completed?'completed':''}" data-id="${s.id}" draggable="true" style="display:flex;align-items:center;gap:14px;padding:12px 14px;border:1px solid var(--border-color);border-radius:var(--radius-md);margin-bottom:8px;cursor:grab;background:var(--bg-card);transition:all var(--transition);${s.completed?'opacity:0.6;':''}">
        <div style="font-size:14px;font-weight:700;color:var(--accent);min-width:44px;text-align:center;padding:4px 8px;background:var(--accent-light);border-radius:var(--radius-sm);">${s.startTime}</div>
        <div style="flex:1;min-width:0;"><div style="font-size:14px;font-weight:600;color:var(--text-primary);${s.completed?'text-decoration:line-through;':''}">${s.title}</div><div style="font-size:12px;color:var(--text-secondary);display:flex;align-items:center;flex-wrap:wrap;gap:4px;">${s.subject} <span class="badge badge-${s.priority||'medium'}">${Utils.capitalize(s.priority||'medium')}</span> <span>${s.duration}min</span></div></div>
        <button class="planner-complete-btn" data-id="${s.id}" style="background:none;border:none;color:var(--text-secondary);cursor:pointer;padding:6px;border-radius:var(--radius-sm);display:flex;" title="${s.completed?'Undo':'Mark Complete'}"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">${s.completed ? '<path d="M6 18L18 6M6 6l12 12"/>' : '<polyline points="20 6 9 17 4 12"/>'}</svg></button>
      </div>`).join('');
  }

  function bindEvents() {
    document.getElementById('regeneratePlanBtn')?.addEventListener('click', () => { generateSchedule(); render(); Utils.showToast('Schedule regenerated', 'success'); });
    const container = document.getElementById('page-planner');
    if (!container) return;
    container.addEventListener('click', e => {
      const btn = e.target.closest('.planner-complete-btn'); if (!btn) return;
      const id = btn.dataset.id; toggleSessionComplete(id);
    });
  }

  function toggleSessionComplete(id) {
    const schedule = Storage.getPlannerSchedule();
    if (!schedule?.sessions) return;
    const session = schedule.sessions.find(s => s.id === id);
    if (!session) return;
    session.completed = !session.completed;
    Storage.savePlannerSchedule(schedule);
    render(); Utils.showToast(session.completed ? 'Session completed!' : 'Session unmarked', session.completed ? 'success' : 'info');
    if (typeof Dashboard !== 'undefined') Dashboard.render();
  }

  return { init, generateSchedule, render, getStats };
})();
