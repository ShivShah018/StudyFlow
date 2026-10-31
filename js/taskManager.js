const TaskManager = (() => {
  const DEFAULT_CATEGORIES = ['Study', 'Work', 'Personal', 'Health', 'Other'];
  let currentFilter = { search: '', priority: '', category: '', status: '', sort: 'dueDate' };

  function init() {
    renderPage();
    bindEvents();
  }

  function getFilteredTasks() {
    let tasks = Storage.getTasks();
    if (currentFilter.search) {
      const q = currentFilter.search.toLowerCase();
      tasks = tasks.filter(t => t.title.toLowerCase().includes(q) || (t.description && t.description.toLowerCase().includes(q)) || (t.subject && t.subject.toLowerCase().includes(q)));
    }
    if (currentFilter.priority) {
      tasks = tasks.filter(t => t.priority === currentFilter.priority);
    }
    if (currentFilter.category) {
      tasks = tasks.filter(t => t.category === currentFilter.category);
    }
    if (currentFilter.status === 'active') {
      tasks = tasks.filter(t => !t.completed);
    } else if (currentFilter.status === 'completed') {
      tasks = tasks.filter(t => t.completed);
    }

    tasks.sort((a, b) => {
      if (currentFilter.sort === 'dueDate') {
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return new Date(a.dueDate) - new Date(b.dueDate);
      }
      if (currentFilter.sort === 'title') return a.title.localeCompare(b.title);
      if (currentFilter.sort === 'priority') {
        const r = { high: 0, medium: 1, low: 2 };
        return r[a.priority] - r[b.priority];
      }
      return 0;
    });
    return tasks;
  }

  function getStats() {
    const t = Storage.getTasks();
    const total = t.length;
    const completed = t.filter(x => x.completed).length;
    const overdue = t.filter(x => !x.completed && x.dueDate && Utils.isOverdue(x.dueDate)).length;
    const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { total, completed, pending: total - completed, overdue, pct };
  }

  function renderPage() {
    const container = document.getElementById('page-tasks');
    if (!container) return;
    const tasks = getFilteredTasks();
    const stats = getStats();
    const categories = getCategories();
    const overdueTasks = Storage.getTasks().filter(t => !t.completed && t.dueDate && Utils.isOverdue(t.dueDate));

    container.innerHTML = `
      <div class="tasks-header">
        <div>
          <h2>Task & Assignment Manager</h2>
          <p style="color:var(--text-secondary);font-size:13px;margin-top:2px;">Track academic assignments, milestones, checklists, and recurring study tasks</p>
        </div>
        <div class="tasks-header-actions">
          <button class="btn btn-primary" id="addTaskBtn">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg> Add Task
          </button>
          ${stats.completed > 0 ? `
            <button class="btn btn-secondary btn-danger" id="clearCompletedBtn">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg> Clear Done
            </button>
          ` : ''}
        </div>
      </div>

      <!-- Overdue Task Triage Banner -->
      ${overdueTasks.length > 0 ? `
        <div class="card" style="margin-bottom:18px;background:rgba(239,68,68,0.08);border:1px solid var(--danger);padding:14px 18px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px;">
          <div style="display:flex;align-items:center;gap:10px;">
            <span style="font-size:20px;">⚠️</span>
            <div>
              <div style="font-weight:700;color:var(--danger);font-size:14px;">${overdueTasks.length} Overdue Assignment${overdueTasks.length > 1 ? 's' : ''}</div>
              <div style="font-size:12px;color:var(--text-secondary);">Keep your schedule on track with 1-click batch reschedule:</div>
            </div>
          </div>
          <div style="display:flex;gap:8px;">
            <button class="btn btn-sm btn-secondary" id="rescheduleTodayBtn" style="border-color:var(--danger);color:var(--text-primary);">
              Reschedule to Today
            </button>
            <button class="btn btn-sm btn-secondary" id="postpone2DaysBtn">
              Postpone +2 Days
            </button>
          </div>
        </div>
      ` : ''}

      <!-- Filters & Sorting Bar -->
      <div class="tasks-filters">
        <div class="filter-group">
          <span class="filter-label">Search</span>
          <input type="text" id="taskSearch" placeholder="Search title or subject..." value="${Utils.escapeHTML(currentFilter.search)}" />
        </div>
        <div class="filter-group">
          <span class="filter-label">Status</span>
          <select id="filterStatus">
            <option value="" ${currentFilter.status === '' ? 'selected' : ''}>All</option>
            <option value="active" ${currentFilter.status === 'active' ? 'selected' : ''}>Active / Pending</option>
            <option value="completed" ${currentFilter.status === 'completed' ? 'selected' : ''}>Completed</option>
          </select>
        </div>
        <div class="filter-group">
          <span class="filter-label">Priority</span>
          <select id="filterPriority">
            <option value="">All</option>
            <option value="high" ${currentFilter.priority === 'high' ? 'selected' : ''}>High</option>
            <option value="medium" ${currentFilter.priority === 'medium' ? 'selected' : ''}>Medium</option>
            <option value="low" ${currentFilter.priority === 'low' ? 'selected' : ''}>Low</option>
          </select>
        </div>
        <div class="filter-group">
          <span class="filter-label">Category</span>
          <select id="filterCategory">
            <option value="">All</option>
            ${categories.map(c => `<option value="${c}" ${currentFilter.category === c ? 'selected' : ''}>${c}</option>`).join('')}
          </select>
        </div>
        <div class="filter-group">
          <span class="filter-label">Sort</span>
          <select id="sortTasks">
            <option value="dueDate" ${currentFilter.sort === 'dueDate' ? 'selected' : ''}>Due Date</option>
            <option value="title" ${currentFilter.sort === 'title' ? 'selected' : ''}>Title</option>
            <option value="priority" ${currentFilter.sort === 'priority' ? 'selected' : ''}>Priority</option>
          </select>
        </div>
      </div>

      <!-- Progress Summary Bar -->
      <div class="tasks-progress-summary">
        <span class="tasks-progress-text">${stats.completed}/${stats.total} done (${stats.pending} pending)</span>
        <div class="tasks-progress-bar-wrapper">
          <div class="tasks-progress-bar" style="width:${stats.pct}%"></div>
        </div>
        <span class="tasks-progress-text" style="color:var(--accent);">${stats.pct}%</span>
      </div>

      <!-- Task Cards List -->
      <div class="tasks-list">
        ${tasks.length === 0 ? `
          <div class="empty-state">
            <div class="empty-state-icon">📋</div>
            <h3>No tasks match your criteria</h3>
            <p>Click "Add Task" or adjust filters to view items</p>
          </div>
        ` : tasks.map(t => renderTaskItem(t)).join('')}
      </div>
    `;

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
    const activeId = typeof Pomodoro !== 'undefined' ? Pomodoro.getActiveTaskId() : null;
    const ongoing = !task.completed && activeId === task.id;

    const subtasks = Array.isArray(task.subtasks) ? task.subtasks : [];
    const completedSubtasks = subtasks.filter(s => s.completed).length;

    return `
      <div class="task-item ${task.completed ? 'completed' : ''}${ongoing ? ' ongoing' : ''}" data-id="${task.id}">
        <div class="task-priority-indicator ${pc}"></div>
        <div class="task-checkbox ${task.completed ? 'checked' : ''}" data-id="${task.id}" title="Toggle Complete"></div>
        <div class="task-content">
          <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
            <span class="task-title-text" style="margin-bottom:0;">${Utils.escapeHTML(task.title)}</span>
            ${task.type && task.type !== 'assignment' ? `
              <span class="badge" style="background:rgba(99,102,241,0.15);color:var(--accent);text-transform:capitalize;font-size:11px;">
                ${task.type}
              </span>
            ` : ''}
            ${task.isRecurring && task.recurrenceInterval !== 'none' ? `
              <span class="badge" style="background:var(--success-light);color:var(--success);font-size:11px;" title="Recurring Task">
                🔁 ${Utils.capitalize(task.recurrenceInterval)}
              </span>
            ` : ''}
          </div>

          <div class="task-meta" style="margin-top:6px;">
            <span class="badge badge-${pc}">${Utils.capitalize(pc)}</span>
            ${task.subject ? `<span class="task-category" style="background:var(--accent-light);color:var(--accent);">${Utils.escapeHTML(task.subject)}</span>` : ''}
            ${task.category && task.category !== task.subject ? `<span class="task-category">${Utils.escapeHTML(task.category)}</span>` : ''}
            ${task.dueDate ? `
              <span class="task-due ${overdue ? 'overdue' : ''}">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                ${dueDisplay} (${dueLabel})
              </span>
            ` : ''}
            ${est || studied ? `<span class="task-study-progress">${studyLabel}</span>` : ''}
            ${subtasks.length > 0 ? `
              <span style="font-size:11px;font-weight:600;color:var(--text-secondary);display:inline-flex;align-items:center;gap:4px;">
                ☑️ ${completedSubtasks}/${subtasks.length} subtasks
              </span>
            ` : ''}
          </div>

          <!-- Interactive Subtasks List -->
          ${subtasks.length > 0 ? `
            <div class="task-subtasks-container" style="margin-top:8px;padding-top:8px;border-top:1px dashed var(--border-color);display:flex;flex-direction:column;gap:4px;">
              ${subtasks.map(s => `
                <div class="task-subtask-item" style="display:flex;align-items:center;gap:6px;font-size:12px;color:var(--text-secondary);">
                  <input type="checkbox" class="subtask-checkbox" data-task-id="${task.id}" data-subtask-id="${s.id}" ${s.completed ? 'checked' : ''} style="cursor:pointer;" />
                  <span style="${s.completed ? 'text-decoration:line-through;opacity:0.6;' : ''}">${Utils.escapeHTML(s.title)}</span>
                </div>
              `).join('')}
            </div>
          ` : ''}
        </div>

        <div class="task-actions">
          <button class="study-btn" data-id="${task.id}" title="Study this task in Pomodoro">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          </button>
          <button class="edit-btn" data-id="${task.id}" title="Edit task details">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          </button>
          <button class="delete-btn" data-id="${task.id}" title="Delete task">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
          </button>
        </div>
      </div>
    `;
  }

  function getCategories() {
    const t = Storage.getTasks();
    const s = new Set(DEFAULT_CATEGORIES);
    t.forEach(x => { if (x.category) s.add(x.category); });
    return Array.from(s);
  }

  function getSubjects() {
    const t = Storage.getTasks();
    const s = new Set(['DSA', 'DBMS', 'Operating Systems', 'Web Development', 'Computer Networks', 'Mathematics', 'Physics']);
    t.forEach(x => { if (x.subject) s.add(x.subject); });
    return Array.from(s);
  }

  function refreshRelatedViews() {
    if (typeof Dashboard !== 'undefined') Dashboard.render();
    if (typeof Calendar !== 'undefined') Calendar.render();
    if (typeof StudyPlanner !== 'undefined') {
      StudyPlanner.generateSchedule();
      if (document.getElementById('page-planner')?.classList.contains('active')) {
        StudyPlanner.render();
      }
    }
  }

  function showTaskModal(task = null) {
    const isEdit = task !== null;
    const categories = getCategories();
    const subjects = getSubjects();
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay active';
    const currentEst = isEdit && task.estimatedDuration ? task.estimatedDuration : '';

    let subtaskItems = isEdit && Array.isArray(task.subtasks) ? [...task.subtasks] : [];

    overlay.innerHTML = `
      <div class="modal" style="max-width:540px;">
        <div class="modal-header">
          <h2>${isEdit ? 'Edit Task' : 'New Academic Task'}</h2>
          <button class="modal-close" id="modalClose">&times;</button>
        </div>
        <form id="taskForm" novalidate>
          <div class="form-group" id="groupTaskTitle">
            <label for="taskTitle">Task Title <span style="color:var(--danger)">*</span></label>
            <input type="text" id="taskTitle" value="${isEdit ? Utils.escapeHTML(task.title) : ''}" placeholder="e.g. Implement Dijkstra Algorithm" required />
            <div class="form-error" id="errorTaskTitle">Title is required</div>
          </div>

          <div class="form-group" style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
            <div>
              <label for="taskSubject">Subject / Course</label>
              <input type="text" id="taskSubject" list="subjectList" placeholder="e.g. DSA" value="${isEdit && task.subject ? Utils.escapeHTML(task.subject) : ''}" />
              <datalist id="subjectList">
                ${subjects.map(s => `<option value="${s}"></option>`).join('')}
              </datalist>
            </div>
            <div>
              <label for="taskTypeSelect">Type</label>
              <select id="taskTypeSelect">
                <option value="assignment" ${isEdit && task.type === 'assignment' ? 'selected' : ''}>Assignment</option>
                <option value="exam_prep" ${isEdit && task.type === 'exam_prep' ? 'selected' : ''}>Exam Prep</option>
                <option value="lab_report" ${isEdit && task.type === 'lab_report' ? 'selected' : ''}>Lab Report</option>
                <option value="project" ${isEdit && task.type === 'project' ? 'selected' : ''}>Project</option>
                <option value="revision" ${isEdit && task.type === 'revision' ? 'selected' : ''}>Revision</option>
              </select>
            </div>
          </div>

          <div class="form-group">
            <label for="taskDesc">Description / Notes</label>
            <textarea id="taskDesc" placeholder="e.g. Focus on edge cases and memory leaks">${isEdit && task.description ? Utils.escapeHTML(task.description) : ''}</textarea>
          </div>

          <div class="form-group" style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
            <div>
              <label for="taskPriority">Priority</label>
              <select id="taskPriority">
                <option value="low" ${isEdit && task.priority === 'low' ? 'selected' : ''}>Low</option>
                <option value="medium" ${!isEdit || task.priority === 'medium' ? 'selected' : ''}>Medium</option>
                <option value="high" ${isEdit && task.priority === 'high' ? 'selected' : ''}>High</option>
              </select>
            </div>
            <div>
              <label for="taskCategory">Category</label>
              <select id="taskCategory">
                ${categories.map(c => `<option value="${c}" ${isEdit && task.category === c ? 'selected' : ''}>${c}</option>`).join('')}
              </select>
            </div>
          </div>

          <div class="form-group" id="groupTaskEst">
            <label for="taskEstDuration">Estimated Study Time (Minutes)</label>
            <input type="number" id="taskEstDuration" placeholder="e.g. 60" min="1" max="480" value="${currentEst}" />
            <div class="preset-chips">
              ${[30, 45, 60, 90, 120].map(m => `<button type="button" class="preset-chip ${currentEst == m ? 'active' : ''}" data-mins="${m}">${m}m</button>`).join('')}
            </div>
            <div class="form-error" id="errorTaskEst">Duration must be between 1 and 480 minutes</div>
          </div>

          <div class="form-group" style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
            <div>
              <label for="taskDueDate">Due Date</label>
              <input type="date" id="taskDueDate" value="${isEdit && task.dueDate ? task.dueDate : ''}" />
            </div>
            <div>
              <label for="taskRecurrence">Recurrence</label>
              <select id="taskRecurrence">
                <option value="none" ${!isEdit || !task.isRecurring ? 'selected' : ''}>None (One-time)</option>
                <option value="daily" ${isEdit && task.recurrenceInterval === 'daily' ? 'selected' : ''}>Daily</option>
                <option value="weekly" ${isEdit && task.recurrenceInterval === 'weekly' ? 'selected' : ''}>Weekly</option>
                <option value="weekdays" ${isEdit && task.recurrenceInterval === 'weekdays' ? 'selected' : ''}>Weekdays Only</option>
              </select>
            </div>
          </div>

          <!-- Subtasks / Checklist Manager -->
          <div class="form-group" style="background:var(--bg-input);padding:12px;border-radius:var(--radius-sm);border:1px solid var(--border-color);">
            <label style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
              <span>Subtasks & Checklists</span>
              <button type="button" class="btn btn-sm btn-secondary" id="modalAddSubtaskBtn" style="padding:2px 8px;font-size:11px;">+ Add Item</button>
            </label>
            <div id="modalSubtasksList" style="display:flex;flex-direction:column;gap:6px;max-height:130px;overflow-y:auto;">
              ${subtaskItems.map((st, idx) => `
                <div class="modal-subtask-row" style="display:flex;gap:6px;align-items:center;">
                  <input type="text" class="modal-subtask-input" value="${Utils.escapeHTML(st.title)}" placeholder="Subtask description" style="flex:1;padding:4px 8px;font-size:12px;" />
                  <button type="button" class="modal-del-subtask-btn" data-index="${idx}" style="background:none;border:none;color:var(--danger);cursor:pointer;font-size:16px;">&times;</button>
                </div>
              `).join('')}
            </div>
          </div>

          <div class="form-actions">
            <button type="button" class="btn btn-secondary" id="modalCancel">Cancel</button>
            <button type="submit" class="btn btn-primary">${isEdit ? 'Save Changes' : 'Create Task'}</button>
          </div>
        </form>
      </div>
    `;

    document.body.appendChild(overlay);

    const close = () => overlay.remove();
    document.getElementById('modalClose').addEventListener('click', close);
    document.getElementById('modalCancel').addEventListener('click', close);
    overlay.addEventListener('click', e => { if (e.target === overlay) close(); });

    // Duration preset click handlers
    const estInput = document.getElementById('taskEstDuration');
    overlay.querySelectorAll('.preset-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        overlay.querySelectorAll('.preset-chip').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        estInput.value = chip.dataset.mins;
      });
    });

    // Subtask add button
    const subtaskContainer = document.getElementById('modalSubtasksList');
    document.getElementById('modalAddSubtaskBtn').addEventListener('click', () => {
      const row = document.createElement('div');
      row.className = 'modal-subtask-row';
      row.style.cssText = 'display:flex;gap:6px;align-items:center;';
      row.innerHTML = `
        <input type="text" class="modal-subtask-input" placeholder="e.g. Read Chapter 4" style="flex:1;padding:4px 8px;font-size:12px;" />
        <button type="button" class="modal-del-subtask-btn" style="background:none;border:none;color:var(--danger);cursor:pointer;font-size:16px;">&times;</button>
      `;
      subtaskContainer.appendChild(row);
      row.querySelector('.modal-del-subtask-btn').addEventListener('click', () => row.remove());
    });

    // Existing subtask delete buttons
    overlay.querySelectorAll('.modal-del-subtask-btn').forEach(btn => {
      btn.addEventListener('click', () => btn.closest('.modal-subtask-row').remove());
    });

    // Form submission validation & save
    document.getElementById('taskForm').addEventListener('submit', e => {
      e.preventDefault();
      let isValid = true;

      const titleInput = document.getElementById('taskTitle');
      const titleGroup = document.getElementById('groupTaskTitle');
      const title = titleInput.value.trim();

      if (!title) {
        titleGroup.classList.add('has-error');
        isValid = false;
      } else {
        titleGroup.classList.remove('has-error');
      }

      const estVal = estInput.value.trim();
      const estGroup = document.getElementById('groupTaskEst');
      let estNum = null;
      if (estVal) {
        estNum = parseInt(estVal);
        if (isNaN(estNum) || estNum <= 0 || estNum > 480) {
          estGroup.classList.add('has-error');
          isValid = false;
        } else {
          estGroup.classList.remove('has-error');
        }
      } else {
        estGroup.classList.remove('has-error');
      }

      if (!isValid) return;

      // Extract subtasks from modal
      const newSubtasks = [];
      overlay.querySelectorAll('.modal-subtask-row').forEach(row => {
        const text = row.querySelector('.modal-subtask-input')?.value.trim();
        if (text) {
          newSubtasks.push({
            id: 'st_' + Math.random().toString(36).substr(2, 6),
            title: text,
            completed: false
          });
        }
      });

      const recurrenceVal = document.getElementById('taskRecurrence').value;

      const data = {
        title,
        description: document.getElementById('taskDesc').value.trim(),
        subject: document.getElementById('taskSubject').value.trim() || 'General',
        type: document.getElementById('taskTypeSelect').value,
        priority: document.getElementById('taskPriority').value,
        category: document.getElementById('taskCategory').value,
        estimatedDuration: estNum,
        dueDate: document.getElementById('taskDueDate').value || null,
        isRecurring: recurrenceVal !== 'none',
        recurrenceInterval: recurrenceVal,
        subtasks: newSubtasks.length > 0 ? newSubtasks : (isEdit ? task.subtasks : [])
      };

      if (isEdit) {
        Storage.updateTask(task.id, data);
        Utils.showToast('Task updated successfully', 'success');
      } else {
        data.id = Utils.generateId();
        data.completed = false;
        data.createdAt = new Date().toISOString();
        data.completedAt = null;
        data.studiedMinutes = 0;
        data.actualDuration = 0;
        Storage.addTask(data);
        Utils.showToast('Task created successfully', 'success');
      }
      overlay.remove();
      renderPage();
      refreshRelatedViews();
    });
  }

  function handleTaskClick(e) {
    // Checkbox toggle
    const cb = e.target.closest('.task-checkbox');
    if (cb) {
      const id = cb.dataset.id;
      Storage.toggleTaskComplete(id);
      renderPage();
      refreshRelatedViews();
      return;
    }

    // Subtask checkbox toggle
    if (e.target.classList.contains('subtask-checkbox')) {
      const taskId = e.target.dataset.taskId;
      const subtaskId = e.target.dataset.subtaskId;
      const tasks = Storage.getTasks();
      const task = tasks.find(t => t.id === taskId);
      if (task && Array.isArray(task.subtasks)) {
        const st = task.subtasks.find(s => s.id === subtaskId);
        if (st) {
          st.completed = e.target.checked;
          Storage.updateTask(taskId, { subtasks: task.subtasks });
          renderPage();
        }
      }
      return;
    }

    // Edit button
    const eb = e.target.closest('.edit-btn');
    if (eb) {
      const tasks = Storage.getTasks();
      const t = tasks.find(x => x.id === eb.dataset.id);
      if (t) showTaskModal(t);
      return;
    }

    // Delete button
    const db = e.target.closest('.delete-btn');
    if (db) {
      if (confirm('Delete this task?')) {
        Storage.deleteTask(db.dataset.id);
        Utils.showToast('Task deleted', 'error');
        renderPage();
        refreshRelatedViews();
      }
      return;
    }

    // Study button
    const sb = e.target.closest('.study-btn');
    if (sb) {
      const id = sb.dataset.id;
      if (typeof Pomodoro !== 'undefined') {
        Pomodoro.setActiveTask(id);
        if (typeof App !== 'undefined') App.navigate('pomodoro');
      }
      return;
    }
  }

  function batchRescheduleOverdue(daysToAdd = 0) {
    const tasks = Storage.getTasks();
    const todayStr = Utils.getTodayStr();
    let count = 0;
    tasks.forEach(t => {
      if (!t.completed && t.dueDate && Utils.isOverdue(t.dueDate)) {
        if (daysToAdd === 0) {
          t.dueDate = todayStr;
        } else {
          const d = new Date(t.dueDate + 'T12:00:00');
          d.setDate(d.getDate() + daysToAdd);
          t.dueDate = d.toISOString().split('T')[0];
        }
        count++;
      }
    });
    if (count > 0) {
      Storage.saveTasks(tasks);
      Utils.showToast(`Rescheduled ${count} overdue task${count > 1 ? 's' : ''}`, 'success');
      renderPage();
      refreshRelatedViews();
    }
  }

  function clearCompleted() {
    const tasks = Storage.getTasks();
    const completed = tasks.filter(t => t.completed);
    if (completed.length === 0) return;
    if (!confirm('Delete all ' + completed.length + ' completed task' + (completed.length > 1 ? 's' : '') + '?')) return;
    completed.forEach(t => Storage.deleteTask(t.id));
    Utils.showToast('Cleared ' + completed.length + ' completed task' + (completed.length > 1 ? 's' : ''), 'success');
    renderPage();
    if (typeof Dashboard !== 'undefined') Dashboard.render();
  }

  function bindEvents() {
    const container = document.getElementById('page-tasks');
    if (!container) return;

    document.getElementById('addTaskBtn')?.addEventListener('click', () => showTaskModal());
    document.getElementById('clearCompletedBtn')?.addEventListener('click', clearCompleted);
    document.getElementById('rescheduleTodayBtn')?.addEventListener('click', () => batchRescheduleOverdue(0));
    document.getElementById('postpone2DaysBtn')?.addEventListener('click', () => batchRescheduleOverdue(2));

    document.getElementById('taskSearch')?.addEventListener('input', Utils.debounce(e => {
      currentFilter.search = e.target.value;
      renderPage();
    }, 300));

    document.getElementById('filterStatus')?.addEventListener('change', e => {
      currentFilter.status = e.target.value;
      renderPage();
    });

    document.getElementById('filterPriority')?.addEventListener('change', e => {
      currentFilter.priority = e.target.value;
      renderPage();
    });

    document.getElementById('filterCategory')?.addEventListener('change', e => {
      currentFilter.category = e.target.value;
      renderPage();
    });

    document.getElementById('sortTasks')?.addEventListener('change', e => {
      currentFilter.sort = e.target.value;
      renderPage();
    });

    container.removeEventListener('click', handleTaskClick);
    container.addEventListener('click', handleTaskClick);
  }

  function setGlobalSearch(q) {
    currentFilter.search = q;
  }

  return {
    init,
    renderPage,
    getFilteredTasks,
    getStats,
    showTaskModal,
    setGlobalSearch
  };
})();
