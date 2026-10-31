const Pomodoro = (() => {
  let totalMinutes = 60, focusMinutes = 25, breakMinutes = 5;
  let focusSeconds = 1500, breakSeconds = 300;
  let timeLeft = 1500, elapsedSeconds = 0;
  let isFocus = true, cycleCount = 0;
  let timerId = null, isRunning = false, isPaused = false;
  let targetEndTime = null;
  let activeTaskId = null, taskFocusSeconds = 0;

  function init() {
    try {
      loadSettings();
      syncInputsToDOM();

      // Bind button controls
      document.getElementById('pomodoroStartBtn').onclick = () => {
        if ('Notification' in window && Notification.permission === 'default') {
          Notification.requestPermission();
        }
        startTimer();
      };
      document.getElementById('pomodoroPauseBtn').onclick = pauseTimer;
      document.getElementById('pomodoroResumeBtn').onclick = resumeTimer;
      document.getElementById('pomodoroResetBtn').onclick = resetTimer;

      ['Total', 'Focus', 'Break'].forEach(name => {
        const field = name.toLowerCase();
        document.getElementById(`p${name}Dec`).onclick = () => adjustValue(field, -1);
        document.getElementById(`p${name}Inc`).onclick = () => adjustValue(field, 1);
      });

      // Handle visibility changes for background-tab drift protection
      document.addEventListener('visibilitychange', () => {
        if (isRunning && !isPaused && targetEndTime) {
          syncTimestampDelta();
          updateDisplay();
        }
      });

      // Recover persisted timer state if user refreshed or navigated back
      recoverPersistedState();
      renderFocusStats();
      updateDisplay();
    } catch (e) {
      console.error('Pomodoro init error:', e);
      document.getElementById('pomodoroDisplay').textContent = 'ERR';
    }
  }

  function recoverPersistedState() {
    const saved = Storage.getActiveTimerState ? Storage.getActiveTimerState() : null;
    if (!saved || !saved.isRunning) return;

    if (saved.isPaused) {
      isRunning = true;
      isPaused = true;
      timeLeft = saved.timeLeft;
      elapsedSeconds = saved.elapsedSeconds;
      isFocus = saved.isFocus;
      cycleCount = saved.cycleCount;
      activeTaskId = saved.activeTaskId;
    } else if (saved.targetEndTime) {
      const now = Date.now();
      const remainingMs = saved.targetEndTime - now;
      if (remainingMs > 0) {
        isRunning = true;
        isPaused = false;
        targetEndTime = saved.targetEndTime;
        timeLeft = Math.round(remainingMs / 1000);
        elapsedSeconds = saved.elapsedSeconds + Math.round((now - (saved.lastTick || now)) / 1000);
        isFocus = saved.isFocus;
        cycleCount = saved.cycleCount;
        activeTaskId = saved.activeTaskId;
        timerId = setInterval(tick, 1000);
      } else {
        // Timer completed while away
        Storage.saveActiveTimerState(null);
      }
    }
  }

  function persistCurrentState() {
    if (!Storage.saveActiveTimerState) return;
    if (!isRunning) {
      Storage.saveActiveTimerState(null);
      return;
    }
    Storage.saveActiveTimerState({
      isRunning,
      isPaused,
      timeLeft,
      elapsedSeconds,
      isFocus,
      cycleCount,
      targetEndTime,
      activeTaskId,
      lastTick: Date.now()
    });
  }

  function syncTimestampDelta() {
    if (!targetEndTime) return;
    const now = Date.now();
    const remainingMs = targetEndTime - now;
    timeLeft = Math.max(0, Math.round(remainingMs / 1000));
  }

  function setActiveTask(taskId) {
    activeTaskId = taskId;
    taskFocusSeconds = 0;
    renderTaskInfo();
    persistCurrentState();
  }

  function clearActiveTask() {
    activeTaskId = null;
    taskFocusSeconds = 0;
    const info = document.getElementById('pomodoroTaskInfo');
    if (info) info.style.display = 'none';
    persistCurrentState();
  }

  function getActiveTask() {
    if (!activeTaskId) return null;
    const tasks = Storage.getTasks();
    return tasks.find(t => t.id === activeTaskId) || null;
  }

  function saveTaskProgress() {
    const task = getActiveTask();
    if (!task) return;
    const additional = Math.floor(taskFocusSeconds / 60);
    if (additional === 0) return;
    const studied = (task.studiedMinutes || 0) + additional;
    taskFocusSeconds = taskFocusSeconds % 60;
    Storage.updateTask(task.id, { studiedMinutes: studied, actualDuration: studied });
    
    if (task.estimatedDuration && studied >= task.estimatedDuration) {
      Storage.updateTask(task.id, { completed: true, completedAt: new Date().toISOString() });
      Utils.showToast('Task completed! Great work!', 'success');
      clearActiveTask();
      if (typeof TaskManager !== 'undefined') TaskManager.renderPage();
      if (typeof Dashboard !== 'undefined') Dashboard.render();
    }
  }

  function renderTaskInfo() {
    const task = getActiveTask();
    const info = document.getElementById('pomodoroTaskInfo');
    const titleEl = document.getElementById('pomodoroTaskTitle');
    const progressEl = document.getElementById('pomodoroTaskProgress');
    if (!task || !info || !titleEl || !progressEl) {
      if (info) info.style.display = 'none';
      return;
    }
    info.style.display = '';
    titleEl.textContent = 'Studying: ' + task.title;
    const studied = (task.studiedMinutes || 0) + Math.floor(taskFocusSeconds / 60);
    const total = task.estimatedDuration || 0;
    if (total > 0) {
      const remaining = Math.max(0, total - studied);
      progressEl.textContent = studied + ' min studied · ' + remaining + ' min remaining';
    } else {
      progressEl.textContent = studied + ' min studied';
    }
  }

  function loadSettings() {
    try {
      const s = JSON.parse(localStorage.getItem('studyflow_pomodoro_settings') || '{}');
      totalMinutes = s.totalMinutes || 60;
      focusMinutes = s.focusMinutes || 25;
      breakMinutes = s.breakMinutes || 5;
    } catch {}
    focusSeconds = focusMinutes * 60;
    breakSeconds = breakMinutes * 60;
    timeLeft = focusSeconds;
    elapsedSeconds = 0;
    isFocus = true;
    cycleCount = 0;
  }

  function saveSettings() {
    try {
      localStorage.setItem('studyflow_pomodoro_settings', JSON.stringify({ totalMinutes, focusMinutes, breakMinutes }));
    } catch {}
  }

  function syncInputsToDOM() {
    const t = document.getElementById('pTotal'); if (t) t.value = totalMinutes;
    const f = document.getElementById('pFocus'); if (f) f.value = focusMinutes;
    const b = document.getElementById('pBreak'); if (b) b.value = breakMinutes;
  }

  function readInputs() {
    const t = document.getElementById('pTotal');
    const f = document.getElementById('pFocus');
    const b = document.getElementById('pBreak');
    if (t) { const v = parseInt(t.value); if (!isNaN(v) && v > 0 && v <= 480) totalMinutes = v; else t.value = totalMinutes; }
    if (f) { const v = parseInt(f.value); if (!isNaN(v) && v > 0 && v <= 120) { if (v > totalMinutes) { Utils.showToast('Focus cannot exceed total study time', 'error'); f.value = focusMinutes; } else { focusMinutes = v; } } else f.value = focusMinutes; }
    if (b) { const v = parseInt(b.value); if (!isNaN(v) && v > 0 && v <= 60) { if (v > focusMinutes) { Utils.showToast('Break cannot exceed focus time', 'error'); b.value = breakMinutes; } else { breakMinutes = v; } } else b.value = breakMinutes; }
    focusSeconds = focusMinutes * 60; breakSeconds = breakMinutes * 60;
    if (!isRunning) { timeLeft = focusSeconds; elapsedSeconds = 0; isFocus = true; cycleCount = 0; }
    saveSettings();
  }

  function updateDisplay() {
    renderTaskInfo();
    const d = document.getElementById('pomodoroDisplay');
    const p = document.getElementById('pomodoroPhase');
    const s = document.getElementById('pomodoroStatus');
    const bar = document.getElementById('pomodoroProgressBar');
    const pctLabel = document.getElementById('pomodoroPctLabel');
    const r = document.getElementById('pomodoroRingProgress');
    const tr = document.getElementById('pomodoroTotalRing');

    const phaseMax = isFocus ? focusSeconds : breakSeconds;
    const phasePct = phaseMax > 0 ? ((phaseMax - timeLeft) / phaseMax) * 100 : 0;
    const total = totalMinutes * 60;
    const totalPct = total > 0 ? Math.min((elapsedSeconds / total) * 100, 100) : 0;
    const rc = 2 * Math.PI * 100;
    const tc = 2 * Math.PI * 80;
    const remainingTotal = Math.max(0, Math.ceil((total - elapsedSeconds) / 60));

    if (d) d.textContent = formatTime(timeLeft);
    if (p) {
      if (isRunning && !isPaused) p.textContent = isFocus ? 'Focus' : 'Break';
      else if (isPaused) p.textContent = 'Paused';
      else p.textContent = 'Ready';
      p.style.color = isFocus ? 'var(--accent)' : 'var(--success)';
    }
    if (s) s.textContent = `Cycle ${cycleCount} · ${remainingTotal} min left`;
    if (bar) bar.style.width = `${totalPct}%`;
    if (pctLabel) pctLabel.textContent = `${Math.round(totalPct)}% of total study time completed`;
    if (r) {
      r.setAttribute('stroke-dasharray', rc.toString());
      r.setAttribute('stroke-dashoffset', (rc - (phasePct / 100) * rc).toString());
      r.setAttribute('stroke', isFocus ? 'var(--accent)' : 'var(--success)');
    }
    if (tr) {
      tr.setAttribute('stroke-dasharray', tc.toString());
      tr.setAttribute('stroke-dashoffset', (tc - (totalPct / 100) * tc).toString());
    }

    const startBtn = document.getElementById('pomodoroStartBtn');
    const pauseBtn = document.getElementById('pomodoroPauseBtn');
    const resumeBtn = document.getElementById('pomodoroResumeBtn');
    if (startBtn) startBtn.style.display = isRunning ? 'none' : '';
    if (pauseBtn) pauseBtn.style.display = (isRunning && !isPaused) ? '' : 'none';
    if (resumeBtn) resumeBtn.style.display = isPaused ? '' : 'none';

    document.querySelectorAll('#page-pomodoro .pomodoro-duration-row button').forEach(el => el.disabled = isRunning);
    document.querySelectorAll('#page-pomodoro .pomodoro-duration-row input').forEach(el => el.disabled = isRunning);
  }

  function formatTime(s) {
    return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
  }

  function startTimer() {
    if (isRunning) return;
    readInputs();
    if (timeLeft <= 0) { timeLeft = focusSeconds; isFocus = true; elapsedSeconds = 0; cycleCount = 0; }
    isRunning = true;
    isPaused = false;
    cycleCount++;
    targetEndTime = Date.now() + (timeLeft * 1000);
    updateDisplay();
    persistCurrentState();

    if (timerId) clearInterval(timerId);
    timerId = setInterval(tick, 1000);
    if (typeof Notifications !== 'undefined') Notifications.notifyPomodoroStart();
  }

  function tick() {
    syncTimestampDelta();
    elapsedSeconds++;

    if (isFocus && activeTaskId) {
      taskFocusSeconds++;
      if (taskFocusSeconds % 60 === 0) saveTaskProgress();
    }

    persistCurrentState();
    updateDisplay();

    if (timeLeft > 0) return;

    // Time cycle completed
    const total = totalMinutes * 60;
    if (isFocus) {
      // Record immutable focus session log
      const activeTask = getActiveTask();
      Storage.addFocusSession({
        id: 'foc_' + Date.now().toString(36),
        taskId: activeTask ? activeTask.id : null,
        taskTitle: activeTask ? activeTask.title : 'General Study',
        subject: activeTask ? (activeTask.subject || activeTask.category || 'General') : 'General',
        durationMinutes: focusMinutes,
        timestamp: new Date().toISOString()
      });
      renderFocusStats();
    }

    if (elapsedSeconds >= total) {
      clearInterval(timerId); timerId = null;
      isRunning = false; isPaused = false; targetEndTime = null;
      persistCurrentState();
      updateDisplay();
      if (typeof Notifications !== 'undefined') Notifications.notifyPomodoroComplete();
      Utils.showToast('All planned study cycles completed! Excellent work!', 'success');
      return;
    }

    if (isFocus) {
      isFocus = false;
      timeLeft = breakSeconds;
      targetEndTime = Date.now() + (timeLeft * 1000);
      if (typeof Notifications !== 'undefined') Notifications.notifyPomodoroComplete();
    } else {
      isFocus = true;
      timeLeft = focusSeconds;
      cycleCount++;
      targetEndTime = Date.now() + (timeLeft * 1000);
      if (typeof Notifications !== 'undefined') Notifications.notifyPomodoroBreakOver();
      Utils.showToast('Break over! Time to focus.', 'info');
    }
    persistCurrentState();
    updateDisplay();
  }

  function pauseTimer() {
    if (!isRunning || isPaused) return;
    syncTimestampDelta();
    isPaused = true;
    targetEndTime = null;
    if (timerId) { clearInterval(timerId); timerId = null; }
    if (activeTaskId && taskFocusSeconds > 0) saveTaskProgress();
    persistCurrentState();
    updateDisplay();
  }

  function resumeTimer() {
    if (!isPaused) return;
    isPaused = false;
    targetEndTime = Date.now() + (timeLeft * 1000);
    timerId = setInterval(tick, 1000);
    persistCurrentState();
    updateDisplay();
  }

  function resetTimer() {
    if (timerId) { clearInterval(timerId); timerId = null; }
    isRunning = false;
    isPaused = false;
    targetEndTime = null;
    if (activeTaskId && taskFocusSeconds > 0) saveTaskProgress();
    loadSettings();
    syncInputsToDOM();
    persistCurrentState();
    updateDisplay();
  }

  function adjustValue(field, delta) {
    if (isRunning) return;
    const id = 'p' + field.charAt(0).toUpperCase() + field.slice(1);
    const input = document.getElementById(id);
    if (!input) return;
    let v = parseInt(input.value) || 0;
    v += delta;
    if (field === 'focus' && v > totalMinutes) { Utils.showToast('Focus cannot exceed total study time', 'error'); return; }
    if (field === 'break' && v > focusMinutes) { Utils.showToast('Break cannot exceed focus time', 'error'); return; }
    const max = field === 'total' ? 480 : field === 'focus' ? 120 : 60;
    if (v < 1) v = 1; if (v > max) v = max;
    input.value = v;
    readInputs();
    updateDisplay();
  }

  function renderFocusStats() {
    let statsCard = document.getElementById('pomodoroFocusHistoryCard');
    if (!statsCard) {
      const root = document.getElementById('pomodoroRoot');
      if (!root) return;
      statsCard = document.createElement('div');
      statsCard.id = 'pomodoroFocusHistoryCard';
      statsCard.className = 'card';
      statsCard.style.cssText = 'max-width:520px;width:100%;padding:20px;margin-top:20px;text-align:left;';
      root.appendChild(statsCard);
    }

    const history = Storage.getFocusHistory ? Storage.getFocusHistory() : [];
    const todayStr = Utils.getTodayStr();
    const todaySessions = history.filter(h => h.timestamp && h.timestamp.startsWith(todayStr));
    const todayMins = todaySessions.reduce((sum, s) => sum + (s.durationMinutes || 0), 0);

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const weeklySessions = history.filter(h => h.timestamp && new Date(h.timestamp) >= sevenDaysAgo);
    const weeklyMins = weeklySessions.reduce((sum, s) => sum + (s.durationMinutes || 0), 0);

    statsCard.innerHTML = `
      <h3 style="font-size:15px;font-weight:700;margin-bottom:12px;display:flex;align-items:center;justify-content:space-between;">
        <span>Focus Session Log & Audit</span>
        <span style="font-size:11px;font-weight:600;color:var(--accent);">${history.length} Total Sessions</span>
      </h3>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:12px;">
        <div style="background:var(--bg-input);padding:10px;border-radius:var(--radius-sm);text-align:center;">
          <div style="font-size:11px;color:var(--text-secondary);font-weight:600;">TODAY'S FOCUS</div>
          <div style="font-size:18px;font-weight:800;color:var(--accent);">${todayMins}m (${todaySessions.length} sessions)</div>
        </div>
        <div style="background:var(--bg-input);padding:10px;border-radius:var(--radius-sm);text-align:center;">
          <div style="font-size:11px;color:var(--text-secondary);font-weight:600;">LAST 7 DAYS</div>
          <div style="font-size:18px;font-weight:800;color:var(--success);">${Math.round(weeklyMins / 60 * 10) / 10}h (${weeklySessions.length} sessions)</div>
        </div>
      </div>
      <div style="font-size:12px;color:var(--text-secondary);">
        ${todaySessions.length === 0 ? 'No completed sessions logged today yet. Start a focus session above!' : `
          <div style="font-weight:600;margin-bottom:6px;">Today's Logged Sessions:</div>
          <div style="display:flex;flex-direction:column;gap:4px;max-height:120px;overflow-y:auto;">
            ${todaySessions.slice(-4).reverse().map(s => `
              <div style="display:flex;justify-content:space-between;padding:4px 8px;background:var(--bg-card);border-radius:var(--radius-sm);border:1px solid var(--border-color);">
                <span>${Utils.escapeHTML(s.taskTitle || s.subject)}</span>
                <span style="font-weight:700;color:var(--accent);">${s.durationMinutes} min</span>
              </div>
            `).join('')}
          </div>
        `}
      </div>
    `;
  }

  function getActiveTaskId() { return activeTaskId; }
  function getTimerState() { return { isRunning, isPaused, isFocus, timeLeft, totalMinutes, focusMinutes }; }

  return {
    init,
    startTimer,
    pauseTimer,
    resumeTimer,
    resetTimer,
    adjustValue,
    setActiveTask,
    clearActiveTask,
    getActiveTask,
    getActiveTaskId,
    getTimerState,
    renderFocusStats
  };
})();
