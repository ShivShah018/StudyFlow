const TaskManager = (() => {
  const DEFAULT_CATEGORIES = ['Study', 'Work', 'Personal', 'Health', 'Other'];
  let currentFilter = { search: '', priority: '', category: '', sort: 'dueDate' };

  function init() { renderPage(); bindEvents(); }

  function getFilteredTasks() {
    let tasks = Storage.getTasks();
    if (currentFilter.search) { const q = currentFilter.search.toLowerCase(); tasks = tasks.filter(t => t.title.toLowerCase().includes(q) || (t.description && t.description.toLowerCase().includes(q))); }
    if (currentFilter.priority) tasks = tasks.filter(t => t.priority === currentFilter.priority);
    if (currentFilter.category) tasks = tasks.filter(t => t.category === currentFilter.category);
    tasks.sort((a, b) => {
      if (currentFilter.sort === 'dueDate') { if (!a.dueDate) return 1; if (!b.dueDate) return -1; return new Date(a.dueDate) - new Date(b.dueDate); }
      if (currentFilter.sort === 'title') return a.title.localeCompare(b.title);
      if (currentFilter.sort === 'priority') { const r = { high: 0, medium: 1, low: 2 }; return r[a.priority] - r[b.priority]; }
      return 0;
    });
    return tasks;
  }

  function getStats() { const t = Storage.getTasks(); const total = t.length; const completed = t.filter(x => x.completed).length; const pct = total > 0 ? Math.round((completed / total) * 100) : 0; return { total, completed, pending: total - completed, pct }; }

  function renderPage() {
    const container = document.getElementById('page-tasks');
    const tasks = getFilteredTasks();
    const stats = getStats();
    const categories = getCategories();
    container.innerHTML = `
      <div class="tasks-header"><h2>Task Manager</h2><div class="tasks-header-actions"><button class="btn btn-primary" id="addTaskBtn"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg> Add Task</button></div></div>
      <div class="tasks-filters">
        <div class="filter-group"><span class="filter-label">Search</span><input type="text" id="taskSearch" placeholder="Search tasks..." value="${currentFilter.search}" /></div>
        <div class="filter-group"><span class="filter-label">Priority</span><select id="filterPriority"><option value="">All</option><option value="high" ${currentFilter.priority==='high'?'selected':''}>High</option><option value="medium" ${currentFilter.priority==='medium'?'selected':''}>Medium</option><option value="low" ${currentFilter.priority==='low'?'selected':''}>Low</option></select></div>
        <div class="filter-group"><span class="filter-label">Category</span><select id="filterCategory"><option value="">All</option>${categories.map(c => `<option value="${c}" ${currentFilter.category===c?'selected':''}>${c}</option>`).join('')}</select></div>
        <div class="filter-group"><span class="filter-label">Sort</span><select id="sortTasks"><option value="dueDate" ${currentFilter.sort==='dueDate'?'selected':''}>Due Date</option><option value="title" ${currentFilter.sort==='title'?'selected':''}>Title</option><option value="priority" ${currentFilter.sort==='priority'?'selected':''}>Priority</option></select></div>
      </div>
      <div class="tasks-progress-summary"><span class="tasks-progress-text">${stats.completed}/${stats.total} done</span><div class="tasks-progress-bar-wrapper"><div class="tasks-progress-bar" style="width:${stats.pct}%"></div></div><span class="tasks-progress-text">${stats.pct}%</span></div>
      <div class="tasks-list">${tasks.length === 0 ? '<div class="empty-state"><div class="empty-state-icon">&#9744;</div><h3>No tasks found</h3><p>Add your first task to get started!</p></div>' : tasks.map(t => renderTaskItem(t)).join('')}</div>`;
    bindEvents();
  }

  function renderTaskItem(task) {
    const pc = task.priority || 'medium';
    const overdue = task.dueDate && !task.completed && Utils.isOverdue(task.dueDate);
    const dueDisplay = task.dueDate ? Utils.formatDateShort(task.dueDate) : '';
    const dueLabel = task.dueDate ? Utils.daysUntil(task.dueDate) : '';
    const studied = task.studiedMinutes || 0;
    const est = task.estimatedDuration;
    const studyLabel = est ? `${studied}/${est} min` : `${studied} min studied`;
    const ongoing = !task.completed && studied > 0;
    return `<div class="task-item ${task.completed?'completed':''}${ongoing?' ongoing':''}" data-id="${task.id}"><div class="task-priority-indicator ${pc}"></div><div class="task-checkbox ${task.completed?'checked':''}" data-id="${task.id}"></div><div class="task-content"><div class="task-title-text">${task.title}</div><div class="task-meta"><span class="badge badge-${pc}">${Utils.capitalize(pc)}</span>${task.category ? `<span class="task-category">${task.category}</span>` : ''}${task.dueDate ? `<span class="task-due ${overdue?'overdue':''}"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg> ${dueDisplay} (${dueLabel})</span>` : ''}${est || studied ? `<span class="task-study-progress">${studyLabel}</span>` : ''}</div></div><div class="task-actions"><button class="study-btn" data-id="${task.id}" title="Study this task"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg></button><button class="edit-btn" data-id="${task.id}" title="Edit"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button><button class="delete-btn" data-id="${task.id}" title="Delete"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg></button></div></div>`;
  }

  function getCategories() { const t = Storage.getTasks(); const s = new Set(DEFAULT_CATEGORIES); t.forEach(x => { if (x.category) s.add(x.category); }); return Array.from(s); }

  function refreshRelatedViews() {
    if (typeof Dashboard !== 'undefined') Dashboard.render();
    if (typeof Calendar !== 'undefined') Calendar.render();
    if (typeof StudyPlanner !== 'undefined') {
      StudyPlanner.generateSchedule();
      if (document.getElementById('page-planner')?.classList.contains('active')) StudyPlanner.render();
    }
  }

  function showTaskModal(task = null) {
    const isEdit = task !== null;
    const categories = getCategories();
    const overlay = document.createElement('div'); overlay.className = 'modal-overlay active';
    overlay.innerHTML = `<div class="modal"><div class="modal-header"><h2>${isEdit ? 'Edit Task' : 'New Task'}</h2><button class="modal-close" id="modalClose">&times;</button></div><form id="taskForm"><div class="form-group"><label for="taskTitle">Title</label><input type="text" id="taskTitle" value="${isEdit ? Utils.escapeHTML(task.title) : ''}" required /></div><div class="form-group"><label for="taskDesc">Description</label><textarea id="taskDesc">${isEdit && task.description ? task.description : ''}</textarea></div><div class="form-group"><label for="taskSubject">Subject</label><input type="text" id="taskSubject" placeholder="e.g. Mathematics, DBMS" value="${isEdit && task.subject ? Utils.escapeHTML(task.subject) : ''}" /></div><div class="form-group"><label for="taskPriority">Priority</label><select id="taskPriority"><option value="low" ${isEdit && task.priority === 'low' ? 'selected' : ''}>Low</option><option value="medium" ${!isEdit || task.priority === 'medium' ? 'selected' : ''}>Medium</option><option value="high" ${isEdit && task.priority === 'high' ? 'selected' : ''}>High</option></select></div><div class="form-group"><label for="taskCategory">Category</label><select id="taskCategory">${categories.map(c => `<option value="${c}" ${isEdit && task.category === c ? 'selected' : ''}>${c}</option>`).join('')}</select></div><div class="form-group"><label for="taskEstDuration">Estimated Study Duration (minutes)</label><input type="number" id="taskEstDuration" placeholder="e.g. 120" min="1" value="${isEdit && task.estimatedDuration ? task.estimatedDuration : ''}" /></div><div class="form-group"><label for="taskDueDate">Due Date</label><input type="date" id="taskDueDate" value="${isEdit && task.dueDate ? task.dueDate : ''}" /></div><div class="form-actions"><button type="button" class="btn btn-secondary" id="modalCancel">Cancel</button><button type="submit" class="btn btn-primary">${isEdit ? 'Update Task' : 'Add Task'}</button></div></form></div>`;
    document.body.appendChild(overlay);
    const close = () => overlay.remove();
    document.getElementById('modalClose').addEventListener('click', close);
    document.getElementById('modalCancel').addEventListener('click', close);
    overlay.addEventListener('click', e => { if (e.target === overlay) close(); });
    document.getElementById('taskForm').addEventListener('submit', e => {
      e.preventDefault();
      const title = document.getElementById('taskTitle').value.trim();
      if (!title) return;
      const est = document.getElementById('taskEstDuration').value;
      const data = { title, description: document.getElementById('taskDesc').value.trim(), subject: document.getElementById('taskSubject').value.trim(), priority: document.getElementById('taskPriority').value, category: document.getElementById('taskCategory').value, estimatedDuration: est ? parseInt(est) : null, dueDate: document.getElementById('taskDueDate').value || null };
      if (isEdit) { Storage.updateTask(task.id, data); Utils.showToast('Task updated', 'success'); } else { data.id = Utils.generateId(); data.completed = false; data.createdAt = new Date().toISOString(); data.completedAt = null; Storage.addTask(data); Utils.showToast('Task added', 'success'); }
      overlay.remove(); renderPage(); refreshRelatedViews();
    });
  }

  function handleTaskClick(e) {
    const cb = e.target.closest('.task-checkbox'); if (cb) { const id = cb.dataset.id; Storage.toggleTaskComplete(id); renderPage(); refreshRelatedViews(); return; }
    const eb = e.target.closest('.edit-btn'); if (eb) { const tasks = Storage.getTasks(); const t = tasks.find(x => x.id === eb.dataset.id); if (t) showTaskModal(t); return; }
    const db = e.target.closest('.delete-btn'); if (db) { if (confirm('Delete this task?')) { Storage.deleteTask(db.dataset.id); Utils.showToast('Task deleted', 'error'); renderPage(); refreshRelatedViews(); } return; }
    const sb = e.target.closest('.study-btn'); if (sb) { const id = sb.dataset.id; if (typeof Pomodoro !== 'undefined') { Pomodoro.setActiveTask(id); if (typeof App !== 'undefined') App.navigate('pomodoro'); } return; }
  }

  function bindEvents() {
    const container = document.getElementById('page-tasks');
    if (!container) return;
    document.getElementById('addTaskBtn')?.addEventListener('click', () => showTaskModal());
    document.getElementById('taskSearch')?.addEventListener('input', Utils.debounce(e => { currentFilter.search = e.target.value; renderPage(); }, 300));
    document.getElementById('filterPriority')?.addEventListener('change', e => { currentFilter.priority = e.target.value; renderPage(); });
    document.getElementById('filterCategory')?.addEventListener('change', e => { currentFilter.category = e.target.value; renderPage(); });
    document.getElementById('sortTasks')?.addEventListener('change', e => { currentFilter.sort = e.target.value; renderPage(); });
    container.removeEventListener('click', handleTaskClick);
    container.addEventListener('click', handleTaskClick);
  }

  function setGlobalSearch(q) { currentFilter.search = q; }
  return { init, renderPage, getFilteredTasks, getStats, showTaskModal, setGlobalSearch };
})();
