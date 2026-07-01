const Pomodoro = (() => {
  let totalMinutes = 60, focusMinutes = 20, breakMinutes = 5;
  let focusSeconds = 1200, breakSeconds = 300;
  let timeLeft = 1200, elapsedSeconds = 0;
  let isFocus = true, cycleCount = 0;
  let timerId = null, isRunning = false, isPaused = false;

  function init() {
    try {
      loadSettings();
      syncInputsToDOM();

      document.getElementById('pomodoroStartBtn').onclick = function () {
        if ('Notification' in window && Notification.permission === 'default') Notification.requestPermission();
        startTimer();
      };
      document.getElementById('pomodoroPauseBtn').onclick = pauseTimer;
      document.getElementById('pomodoroResumeBtn').onclick = resumeTimer;
      document.getElementById('pomodoroResetBtn').onclick = resetTimer;

      document.getElementById('pTotalDec').onclick = function () { adjustValue('total', -1); };
      document.getElementById('pTotalInc').onclick = function () { adjustValue('total', 1); };
      document.getElementById('pFocusDec').onclick = function () { adjustValue('focus', -1); };
      document.getElementById('pFocusInc').onclick = function () { adjustValue('focus', 1); };
      document.getElementById('pBreakDec').onclick = function () { adjustValue('break', -1); };
      document.getElementById('pBreakInc').onclick = function () { adjustValue('break', 1); };

      updateDisplay();
    } catch (e) {
      console.error('Pomodoro init error:', e);
      document.getElementById('pomodoroDisplay').textContent = 'ERR';
      document.getElementById('pomodoroPhase').textContent = 'Init failed, check console';
    }
  }

  function loadSettings() {
    try {
      const s = JSON.parse(localStorage.getItem('studyflow_pomodoro_settings') || '{}');
      totalMinutes = s.totalMinutes || 60; focusMinutes = s.focusMinutes || 20; breakMinutes = s.breakMinutes || 5;
    } catch {}
    focusSeconds = focusMinutes * 60; breakSeconds = breakMinutes * 60;
    timeLeft = focusSeconds; elapsedSeconds = 0; isFocus = true; cycleCount = 0;
  }

  function saveSettings() {
    try { localStorage.setItem('studyflow_pomodoro_settings', JSON.stringify({ totalMinutes, focusMinutes, breakMinutes })); } catch {}
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
    if (f) { const v = parseInt(f.value); if (!isNaN(v) && v > 0 && v <= 120) focusMinutes = v; else f.value = focusMinutes; }
    if (b) { const v = parseInt(b.value); if (!isNaN(v) && v > 0 && v <= 60) breakMinutes = v; else b.value = breakMinutes; }
    focusSeconds = focusMinutes * 60; breakSeconds = breakMinutes * 60;
    if (!isRunning) { timeLeft = focusSeconds; elapsedSeconds = 0; isFocus = true; cycleCount = 0; }
    saveSettings();
  }

  function updateDisplay() {
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
    if (r) { r.setAttribute('stroke-dasharray', rc.toString()); r.setAttribute('stroke-dashoffset', (rc - (phasePct/100)*rc).toString()); r.setAttribute('stroke', isFocus ? 'var(--accent)' : 'var(--success)'); }
    if (tr) { tr.setAttribute('stroke-dasharray', tc.toString()); tr.setAttribute('stroke-dashoffset', (tc - (totalPct/100)*tc).toString()); }

    const startBtn = document.getElementById('pomodoroStartBtn');
    const pauseBtn = document.getElementById('pomodoroPauseBtn');
    const resumeBtn = document.getElementById('pomodoroResumeBtn');
    if (startBtn) startBtn.style.display = isRunning ? 'none' : '';
    if (pauseBtn) pauseBtn.style.display = (isRunning && !isPaused) ? '' : 'none';
    if (resumeBtn) resumeBtn.style.display = isPaused ? '' : 'none';

    document.querySelectorAll('#page-pomodoro .pomodoro-duration-row button').forEach(el => el.disabled = isRunning);
    document.querySelectorAll('#page-pomodoro .pomodoro-duration-row input').forEach(el => el.disabled = isRunning);
  }

  function formatTime(s) { return `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`; }

  function startTimer() {
    if (isRunning) return;
    readInputs();
    if (timeLeft <= 0) { timeLeft = focusSeconds; isFocus = true; elapsedSeconds = 0; cycleCount = 0; }
    isRunning = true; isPaused = false; cycleCount++;
    updateDisplay();
    if (timerId) clearInterval(timerId);
    timerId = setInterval(tick, 1000);
    if (typeof Notifications !== 'undefined') Notifications.notifyPomodoroStart();
  }

  function tick() {
    timeLeft--; elapsedSeconds++;
    updateDisplay();
    if (timeLeft > 0) return;
    const total = totalMinutes * 60;
    if (elapsedSeconds >= total) {
      clearInterval(timerId); timerId = null;
      isRunning = false; isPaused = false;
      updateDisplay();
      if (typeof Notifications !== 'undefined') Notifications.notifyPomodoroComplete();
      Utils.showToast('All study sessions complete! Great work!', 'success');
      return;
    }
    if (isFocus) {
      isFocus = false; timeLeft = breakSeconds;
      if (typeof Notifications !== 'undefined') Notifications.notifyPomodoroComplete();
    } else {
      isFocus = true; timeLeft = focusSeconds; cycleCount++;
      if (typeof Notifications !== 'undefined') Notifications.notifyPomodoroBreakOver();
      Utils.showToast('Break over! Time to focus.', 'info');
    }
    updateDisplay();
  }

  function pauseTimer() {
    if (!isRunning || isPaused) return;
    isPaused = true;
    if (timerId) { clearInterval(timerId); timerId = null; }
    updateDisplay();
  }

  function resumeTimer() {
    if (!isPaused) return;
    isPaused = false;
    timerId = setInterval(tick, 1000);
    updateDisplay();
  }

  function resetTimer() {
    if (timerId) { clearInterval(timerId); timerId = null; }
    isRunning = false; isPaused = false;
    loadSettings();
    syncInputsToDOM();
    updateDisplay();
  }

  function adjustValue(field, delta) {
    if (isRunning) return;
    const id = 'p' + field.charAt(0).toUpperCase() + field.slice(1);
    const input = document.getElementById(id);
    if (!input) return;
    let v = parseInt(input.value) || 0;
    v += delta;
    const max = field === 'total' ? 480 : field === 'focus' ? 120 : 60;
    if (v < 1) v = 1; if (v > max) v = max;
    input.value = v;
    readInputs();
    updateDisplay();
  }

  return { init };
})();
