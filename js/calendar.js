const Calendar = (() => {
  let currentMonth = new Date().getMonth();
  let currentYear = new Date().getFullYear();
  let selectedDate = null;
  const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

  function init() { render(); }

  function render() {
    const container = document.getElementById('page-calendar');
    const today = new Date();
    const firstDay = new Date(currentYear, currentMonth, 1).getDay();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const daysInPrev = new Date(currentYear, currentMonth, 0).getDate();
    const tasks = Storage.getTasks().filter(t => t.dueDate);

    container.innerHTML = `
      <div class="calendar-container">
        <div class="calendar-header"><h2>Calendar</h2>
          <div class="calendar-nav">
            <button id="prevMonth"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="15 18 9 12 15 6"/></svg></button>
            <span class="month-year">${MONTHS[currentMonth]} ${currentYear}</span>
            <button id="nextMonth"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="9 18 15 12 9 6"/></svg></button>
          </div>
        </div>
        <div class="calendar-grid">${DAYS.map(d => `<div class="calendar-day-header">${d}</div>`).join('')}${renderDays(firstDay, daysInMonth, daysInPrev, today, tasks)}</div>
        <div class="calendar-tasks" id="calendarTasks">${selectedDate ? renderDateTasks(selectedDate, tasks) : '<div class="upcoming-empty">Click on a date to view tasks</div>'}</div>
      </div>`;
    bindEvents();
  }

  function renderDays(firstDay, daysInMonth, daysInPrev, today, tasks) {
    let cells = '';
    const totalCells = Math.ceil((firstDay + daysInMonth) / 7) * 7;
    for (let i = 0; i < totalCells; i++) {
      let dayNum, isOther = false, dateStr;
      if (i < firstDay) { dayNum = daysInPrev - firstDay + i + 1; isOther = true; const m = currentMonth === 0 ? 11 : currentMonth - 1; const y = currentMonth === 0 ? currentYear - 1 : currentYear; dateStr = `${y}-${String(m+1).padStart(2,'0')}-${String(dayNum).padStart(2,'0')}`; }
      else if (i >= firstDay + daysInMonth) { dayNum = i - firstDay - daysInMonth + 1; isOther = true; const m = currentMonth === 11 ? 0 : currentMonth + 1; const y = currentMonth === 11 ? currentYear + 1 : currentYear; dateStr = `${y}-${String(m+1).padStart(2,'0')}-${String(dayNum).padStart(2,'0')}`; }
      else { dayNum = i - firstDay + 1; dateStr = `${currentYear}-${String(currentMonth+1).padStart(2,'0')}-${String(dayNum).padStart(2,'0')}`; }
      const isToday = !isOther && dayNum === today.getDate() && currentMonth === today.getMonth() && currentYear === today.getFullYear();
      const hasTasks = tasks.some(t => t.dueDate === dateStr);
      const isSelected = selectedDate === dateStr;
      cells += `<div class="calendar-day ${isOther?'other-month':''} ${isToday?'today':''} ${hasTasks?'has-tasks':''} ${isSelected?'selected':''}" data-date="${dateStr}"><span class="day-number">${dayNum}</span></div>`;
    }
    return cells;
  }

  function renderDateTasks(dateStr, tasks) {
    const dayTasks = tasks.filter(t => t.dueDate === dateStr);
    const d = new Date(dateStr + 'T12:00:00');
    return `<h3>${d.toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric',year:'numeric'})}</h3>${dayTasks.length === 0 ? '<div class="upcoming-empty">No tasks due</div>' : dayTasks.map(t => `<div class="calendar-task-item"><span class="calendar-task-dot" style="background:${t.priority==='high'?'var(--priority-high)':t.priority==='medium'?'var(--priority-medium)':'var(--priority-low)'}"></span><span class="calendar-task-info">${t.title} <span class="badge badge-${t.priority||'medium'}">${Utils.capitalize(t.priority||'medium')}</span>${t.completed ? ' <span class="badge badge-completed">Done</span>' : ''}</span></div>`).join('')}`;
  }

  function handleDayClick(e) {
    const dayEl = e.target.closest('.calendar-day'); if (!dayEl) return;
    selectedDate = dayEl.dataset.date;
    const tasks = Storage.getTasks().filter(t => t.dueDate);
    document.getElementById('calendarTasks').innerHTML = renderDateTasks(selectedDate, tasks);
    document.querySelectorAll('.calendar-day.selected').forEach(el => el.classList.remove('selected'));
    dayEl.classList.add('selected');
  }

  function bindEvents() {
    document.getElementById('prevMonth')?.addEventListener('click', () => { currentMonth--; if (currentMonth < 0) { currentMonth = 11; currentYear--; } selectedDate = null; render(); });
    document.getElementById('nextMonth')?.addEventListener('click', () => { currentMonth++; if (currentMonth > 11) { currentMonth = 0; currentYear++; } selectedDate = null; render(); });
    const container = document.getElementById('page-calendar');
    if (!container) return;
    container.removeEventListener('click', handleDayClick);
    container.addEventListener('click', handleDayClick);
  }

  return { init, render };
})();
