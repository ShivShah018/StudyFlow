const Notifications = (() => {
  const DEFAULT_SETTINGS = { deadlineReminders: true, studySessionReminders: true, pomodoroNotifications: true, dailyMotivation: true, dailySummary: true, reminderTiming: 15 };
  const QUOTES = ['Small progress every day leads to big results.', 'Consistency beats intensity.', 'The secret of getting ahead is getting started.', 'Success is the sum of small efforts repeated day after day.', 'Believe you can and you are halfway there.', 'Your only limit is your mind.', 'Education is the most powerful weapon to change the world.', 'The expert in anything was once a beginner.', 'It does not matter how slowly you go as long as you do not stop.', 'Push yourself, because no one else is going to do it for you.'];
  function getSettings() { try { const d = localStorage.getItem('studyflow_notif_settings'); return d ? { ...DEFAULT_SETTINGS, ...JSON.parse(d) } : { ...DEFAULT_SETTINGS }; } catch { return { ...DEFAULT_SETTINGS }; } }
  function saveSettings(s) { localStorage.setItem('studyflow_notif_settings', JSON.stringify(s)); }

  function playBeep(tag) {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator(), gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.type = 'sine'; const now = ctx.currentTime;
      if (tag === 'pomodoro_complete') {
        [523, 659, 784].forEach((f, i) => { osc.frequency.setValueAtTime(f, now + i * 0.15); });
        gain.gain.setValueAtTime(0.25, now); gain.gain.exponentialRampToValueAtTime(0.01, now + 0.55);
        osc.start(now); osc.stop(now + 0.55);
      } else if (tag === 'pomodoro_break') {
        osc.frequency.setValueAtTime(440, now);
        gain.gain.setValueAtTime(0.15, now); gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
        osc.start(now); osc.stop(now + 0.25);
      } else if (tag && tag.startsWith('deadline')) {
        for (let i = 0; i < 3; i++) { const o = ctx.createOscillator(), g = ctx.createGain(); o.connect(g); g.connect(ctx.destination); o.type = 'square'; o.frequency.setValueAtTime(880, now + i * 0.35); g.gain.setValueAtTime(0.12, now + i * 0.35); g.gain.exponentialRampToValueAtTime(0.01, now + i * 0.35 + 0.2); o.start(now + i * 0.35); o.stop(now + i * 0.35 + 0.2); }
      } else {
        osc.frequency.setValueAtTime(660, now);
        gain.gain.setValueAtTime(0.15, now); gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
        osc.start(now); osc.stop(now + 0.2);
      }
    } catch {}
  }

  function init() { if (!('Notification' in window)) return; const status = localStorage.getItem('studyflow_notif_permission'); if (status === 'denied' || status === 'granted') return; if (Notification.permission === 'default') { Notification.requestPermission().then(p => localStorage.setItem('studyflow_notif_permission', p)); } else { localStorage.setItem('studyflow_notif_permission', Notification.permission); } scheduleDailyChecks(); }
  function send(title, body, tag) { if (!('Notification' in window) || Notification.permission !== 'granted') return; try { new Notification(title, { body, icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="45" fill="%236366f1"/><text x="50" y="68" font-size="50" text-anchor="middle" fill="white">&#9733;</text></svg>', tag, requireInteraction: true }); playBeep(tag); } catch {} }
  function notifyPomodoroStart() { const s = getSettings(); if (s.pomodoroNotifications) { send('Pomodoro Started', 'Focus Session Started! Time to study.', 'pomodoro_start'); playBeep('pomodoro_start'); } }
  function notifyPomodoroComplete() { const s = getSettings(); if (s.pomodoroNotifications) { send('Pomodoro Complete', 'Focus Session Complete! Take a break.', 'pomodoro_complete'); playBeep('pomodoro_complete'); } Utils.showToast('Pomodoro complete! Time for a break.', 'success'); }
  function notifyPomodoroBreakOver() { const s = getSettings(); if (s.pomodoroNotifications) { send('Break Over', 'Break over! Time to focus.', 'pomodoro_break'); playBeep('pomodoro_break'); } }
  function scheduleDailyChecks() { setInterval(() => { const h = new Date().getHours(); if (h === 8) { send('Daily Motivation', QUOTES[Math.floor(Math.random() * QUOTES.length)], 'motivation'); playBeep('motivation'); } }, 3600000); }
  function calculateStreak(completedDates) {
    if (!completedDates || completedDates.length === 0) return 0;
    const sorted = [...new Set(completedDates)].sort().reverse();
    let streak = 0;
    const today = new Date(); today.setHours(0,0,0,0);
    let checkDate = new Date(today);
    for (const dateStr of sorted) {
      const d = new Date(dateStr + 'T12:00:00'); d.setHours(0,0,0,0);
      if (d.getTime() === checkDate.getTime()) { streak++; checkDate.setDate(checkDate.getDate() - 1); }
      else if (d.getTime() < checkDate.getTime()) break;
    }
    return streak;
  }
  function renderSettingsModal() { const s = getSettings(); const overlay = document.createElement('div'); overlay.className = 'modal-overlay active'; overlay.innerHTML = `<div class="modal" style="max-width:480px;"><div class="modal-header"><h2>Notification Settings</h2><button class="modal-close" id="nClose">&times;</button></div><div style="display:flex;flex-direction:column;gap:14px;">${['deadlineReminders|Deadline Reminders','studySessionReminders|Study Session Reminders','pomodoroNotifications|Pomodoro Notifications','dailyMotivation|Daily Motivation','dailySummary|Daily Summary'].map(p => { const [k, lbl] = p.split('|'); return `<label class="notif-toggle"><span>${lbl}</span><input type="checkbox" id="n${k}" ${s[k]?'checked':''} /><span class="toggle-slider"></span></label>`; }).join('')}<div class="form-group"><label>Session Reminder Timing</label><select id="nTiming">${[5,10,15,30].map(v => `<option value="${v}" ${s.reminderTiming===v?'selected':''}>${v} minutes before</option>`).join('')}</select></div></div><div class="form-actions"><button class="btn btn-secondary" id="nClose2">Close</button></div></div>`; document.body.appendChild(overlay); const close = () => overlay.remove(); document.getElementById('nClose').addEventListener('click', close); document.getElementById('nClose2').addEventListener('click', close); overlay.addEventListener('click', e => { if (e.target === overlay) close(); }); ['deadlineReminders','studySessionReminders','pomodoroNotifications','dailyMotivation','dailySummary','Timing'].forEach(id => { const el = document.getElementById(`n${id}`); if (!el) return; el.addEventListener('change', () => { const ns = getSettings(); ns.deadlineReminders = document.getElementById('ndeadlineReminders').checked; ns.studySessionReminders = document.getElementById('nstudySessionReminders').checked; ns.pomodoroNotifications = document.getElementById('npomodoroNotifications').checked; ns.dailyMotivation = document.getElementById('ndailyMotivation').checked; ns.dailySummary = document.getElementById('ndailySummary').checked; ns.reminderTiming = parseInt(document.getElementById('nTiming').value); saveSettings(ns); }); }); }
  return { init, notifyPomodoroStart, notifyPomodoroComplete, notifyPomodoroBreakOver, renderSettingsModal, calculateStreak };
})();
