const VoiceHandler = (() => {
  let floatingWidgetEl = null;
  let activeTimeout = null;

  function init() {
    VoiceSpeech.init();
    createFloatingWidget();
    bindEvents();
  }

  function createFloatingWidget() {
    if (document.getElementById('voiceAssistantWidget')) return;

    floatingWidgetEl = document.createElement('div');
    floatingWidgetEl.id = 'voiceAssistantWidget';
    floatingWidgetEl.className = 'voice-widget';
    floatingWidgetEl.style.cssText = `
      position: fixed;
      bottom: 24px;
      left: 50%;
      transform: translateX(-50%) translateY(120px);
      z-index: 2500;
      background: var(--bg-glass);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      border: 1px solid var(--border-color);
      box-shadow: var(--shadow-xl);
      border-radius: 30px;
      padding: 12px 20px;
      display: flex;
      align-items: center;
      gap: 14px;
      transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.3s;
      opacity: 0;
      pointer-events: none;
      max-width: 90vw;
    `;

    floatingWidgetEl.innerHTML = `
      <div class="voice-wave" style="display:flex;align-items:center;gap:3px;height:20px;">
        <span class="v-bar" style="width:3px;height:8px;background:var(--accent);border-radius:2px;animation:vWave 0.8s infinite ease-in-out;"></span>
        <span class="v-bar" style="width:3px;height:16px;background:var(--accent);border-radius:2px;animation:vWave 0.8s infinite ease-in-out 0.2s;"></span>
        <span class="v-bar" style="width:3px;height:10px;background:var(--accent);border-radius:2px;animation:vWave 0.8s infinite ease-in-out 0.4s;"></span>
      </div>
      <div style="display:flex;flex-direction:column;min-width:180px;max-width:380px;">
        <span id="voiceWidgetStatus" style="font-size:11px;font-weight:700;color:var(--accent);text-transform:uppercase;letter-spacing:0.5px;">Listening...</span>
        <span id="voiceWidgetTranscript" style="font-size:13px;font-weight:500;color:var(--text-primary);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">Speak a command in English or Hinglish...</span>
      </div>
      <button id="voiceWidgetStopBtn" style="background:var(--bg-input);border:none;color:var(--text-secondary);cursor:pointer;border-radius:50%;width:28px;height:28px;display:flex;align-items:center;justify-content:center;font-size:14px;" title="Stop Listening">&times;</button>
    `;

    document.body.appendChild(floatingWidgetEl);

    document.getElementById('voiceWidgetStopBtn').addEventListener('click', () => {
      VoiceSpeech.stopListening();
      hideWidget();
    });
  }

  function showWidget() {
    if (!floatingWidgetEl) createFloatingWidget();
    floatingWidgetEl.style.transform = 'translateX(-50%) translateY(0)';
    floatingWidgetEl.style.opacity = '1';
    floatingWidgetEl.style.pointerEvents = 'auto';
    document.getElementById('voiceWidgetStatus').textContent = 'Listening...';
    document.getElementById('voiceWidgetStatus').style.color = 'var(--accent)';
    document.getElementById('voiceWidgetTranscript').textContent = 'Speak command (e.g. "Open tasks", "Start timer")...';
  }

  function hideWidget() {
    if (!floatingWidgetEl) return;
    floatingWidgetEl.style.transform = 'translateX(-50%) translateY(120px)';
    floatingWidgetEl.style.opacity = '0';
    floatingWidgetEl.style.pointerEvents = 'none';
  }

  function triggerVoiceListening() {
    if (!VoiceSpeech.isSupported()) {
      Utils.showToast('Speech recognition is not supported in this browser. Please use Chrome, Edge, or Safari.', 'error');
      return;
    }

    showWidget();

    VoiceSpeech.startListening({
      onStart: () => {
        showWidget();
      },
      onInterim: (interimText) => {
        const el = document.getElementById('voiceWidgetTranscript');
        if (el) el.textContent = interimText;
      },
      onFinal: (finalText) => {
        const statusEl = document.getElementById('voiceWidgetStatus');
        const transEl = document.getElementById('voiceWidgetTranscript');
        if (statusEl) {
          statusEl.textContent = 'Processing...';
          statusEl.style.color = 'var(--success)';
        }
        if (transEl) transEl.textContent = `"${finalText}"`;

        const parsed = VoiceParser.parse(finalText);
        executeParsedCommand(parsed);

        // Auto-hide widget after 2.5 seconds
        clearTimeout(activeTimeout);
        activeTimeout = setTimeout(() => {
          hideWidget();
        }, 2500);
      },
      onError: (errCode, errMsg) => {
        const statusEl = document.getElementById('voiceWidgetStatus');
        const transEl = document.getElementById('voiceWidgetTranscript');
        if (statusEl) {
          statusEl.textContent = 'Notice';
          statusEl.style.color = 'var(--danger)';
        }
        if (transEl) transEl.textContent = errMsg;

        clearTimeout(activeTimeout);
        activeTimeout = setTimeout(() => {
          hideWidget();
        }, 3000);
      },
      onEnd: () => {
        // Recognition halted
      }
    });
  }

  function executeParsedCommand(parsed) {
    if (!parsed || parsed.intent === 'UNKNOWN') {
      Utils.showToast(`Command not recognized: "${parsed.rawText}"`, 'info');
      VoiceSpeech.speak("Sorry, I didn't recognize that command. Try saying 'Open tasks' or 'Start timer'.");
      return;
    }

    switch (parsed.intent) {
      case 'NAVIGATE':
        if (typeof App !== 'undefined') {
          App.navigate(parsed.page);
          Utils.showToast(`Navigated to ${Utils.capitalize(parsed.page)}`, 'success');
          VoiceSpeech.speak(`Opened ${parsed.page}`);
        }
        break;

      case 'SET_THEME':
        if (typeof App !== 'undefined') {
          App.setTheme(parsed.theme);
          Utils.showToast(`Switched to ${parsed.theme} theme`, 'success');
          VoiceSpeech.speak(`Switched to ${parsed.theme} theme`);
        }
        break;

      case 'POMODORO_START':
        if (typeof App !== 'undefined') App.navigate('pomodoro');
        if (typeof Pomodoro !== 'undefined') {
          if (parsed.minutes) {
            const fInput = document.getElementById('pFocus');
            if (fInput) fInput.value = parsed.minutes;
          }
          Pomodoro.startTimer();
          Utils.showToast('Pomodoro focus session started', 'success');
          VoiceSpeech.speak('Focus session started. Happy studying!');
        }
        break;

      case 'POMODORO_PAUSE':
        if (typeof Pomodoro !== 'undefined') {
          Pomodoro.pauseTimer();
          Utils.showToast('Timer paused', 'info');
          VoiceSpeech.speak('Timer paused');
        }
        break;

      case 'POMODORO_RESUME':
        if (typeof Pomodoro !== 'undefined') {
          Pomodoro.resumeTimer();
          Utils.showToast('Timer resumed', 'success');
          VoiceSpeech.speak('Timer resumed');
        }
        break;

      case 'POMODORO_RESET':
        if (typeof Pomodoro !== 'undefined') {
          Pomodoro.resetTimer();
          Utils.showToast('Timer reset', 'info');
          VoiceSpeech.speak('Timer reset');
        }
        break;

      case 'POMODORO_QUERY_REMAINING':
        if (typeof Pomodoro !== 'undefined') {
          const state = Pomodoro.getTimerState();
          const mins = Math.ceil(state.timeLeft / 60);
          const msg = state.isRunning 
            ? `${mins} minute${mins !== 1 ? 's' : ''} remaining in current ${state.isFocus ? 'focus' : 'break'} cycle.`
            : 'Timer is currently idle.';
          Utils.showToast(msg, 'info');
          VoiceSpeech.speak(msg);
        }
        break;

      case 'CREATE_TASK':
        // Safe Confirmation Rule: Never silently insert. Pre-fill modal for confirmation!
        if (typeof App !== 'undefined') App.navigate('tasks');
        if (typeof TaskManager !== 'undefined') {
          TaskManager.showTaskModal({
            title: parsed.taskData.title,
            subject: parsed.taskData.subject,
            estimatedDuration: parsed.taskData.estimatedDuration,
            dueDate: parsed.taskData.dueDate,
            priority: parsed.taskData.priority,
            category: 'Study',
            description: `Voice created from: "${parsed.rawText}"`
          });
          Utils.showToast('Task form pre-filled via voice. Review and confirm.', 'info');
          VoiceSpeech.speak(`Created ${parsed.taskData.subject} task for ${parsed.taskData.title}. Please review and save.`);
        }
        break;

      case 'COMPLETE_TASK': {
        const query = (parsed.searchTitle || '').toLowerCase();
        const tasks = Storage.getTasks().filter(t => !t.completed);
        const matches = tasks.filter(t => t.title.toLowerCase().includes(query) || (t.subject && t.subject.toLowerCase().includes(query)));

        if (matches.length === 1) {
          Storage.toggleTaskComplete(matches[0].id);
          Utils.showToast(`Completed task: "${matches[0].title}"`, 'success');
          VoiceSpeech.speak(`Marked ${matches[0].title} as completed! Great job!`);
          if (typeof TaskManager !== 'undefined') TaskManager.renderPage();
          if (typeof Dashboard !== 'undefined') Dashboard.render();
        } else if (matches.length > 1) {
          if (typeof App !== 'undefined') App.navigate('tasks');
          if (typeof TaskManager !== 'undefined') TaskManager.setGlobalSearch(query);
          Utils.showToast(`Found ${matches.length} matching tasks. Please tap to complete.`, 'info');
          VoiceSpeech.speak(`Found ${matches.length} tasks matching ${query}. Please choose which one to complete.`);
        } else {
          Utils.showToast(`No uncompleted task matched "${query}"`, 'info');
          VoiceSpeech.speak(`No active task found matching ${query}`);
        }
        break;
      }

      case 'SEARCH_TASKS':
        if (typeof App !== 'undefined') App.navigate('tasks');
        if (typeof TaskManager !== 'undefined') {
          TaskManager.setGlobalSearch(parsed.query);
          TaskManager.renderPage();
          Utils.showToast(`Filtered tasks for: "${parsed.query}"`, 'info');
          VoiceSpeech.speak(`Searching tasks for ${parsed.query}`);
        }
        break;

      case 'SHOW_OVERDUE':
        if (typeof App !== 'undefined') App.navigate('tasks');
        Utils.showToast('Showing overdue assignments', 'info');
        VoiceSpeech.speak('Displaying your overdue assignments.');
        break;

      case 'QUERY_SUMMARY': {
        let summary = '';
        if (typeof MLAnalytics !== 'undefined') {
          summary = MLAnalytics.getSpokenSummaryText();
        } else {
          const stats = TaskManager.getStats();
          summary = `You have ${stats.completed} completed tasks and ${stats.pending} pending tasks today.`;
        }
        Utils.showToast('Voice Summary Generated', 'info');
        VoiceSpeech.speak(summary);
        break;
      }

      case 'QUERY_SCHEDULE': {
        const pStats = typeof StudyPlanner !== 'undefined' ? StudyPlanner.getStats() : null;
        if (pStats && pStats.todaySessions.length > 0) {
          const s = pStats.todaySessions[0];
          const msg = `You have ${pStats.todaySessions.length} session${pStats.todaySessions.length > 1 ? 's' : ''} today. First up is ${s.subject} at ${s.startTime} for ${s.duration} minutes.`;
          Utils.showToast(msg, 'info');
          VoiceSpeech.speak(msg);
        } else {
          const msg = 'You have no study sessions scheduled for today. Great job, or click Regenerate to schedule pending tasks.';
          Utils.showToast(msg, 'info');
          VoiceSpeech.speak(msg);
        }
        break;
      }

      case 'QUERY_WEAK_SUBJECT': {
        if (typeof MLAnalytics !== 'undefined') {
          const risks = MLAnalytics.getSubjectRiskAssessments();
          if (risks.length > 0 && risks[0].riskLevel === 'High Risk') {
            const msg = `High attention recommended for ${risks[0].subject}. It has a risk index of ${risks[0].riskScore} percent with ${risks[0].overdueTasks} overdue tasks.`;
            Utils.showToast(msg, 'warning');
            VoiceSpeech.speak(msg);
          } else {
            const msg = 'All subjects are currently well-balanced with low risk scores.';
            Utils.showToast(msg, 'success');
            VoiceSpeech.speak(msg);
          }
        }
        break;
      }

      case 'QUERY_DEADLINES': {
        const tasks = Storage.getTasks()
          .filter(t => !t.completed && t.dueDate)
          .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
          .slice(0, 3);

        if (tasks.length > 0) {
          const items = tasks.map(t => `${t.title} due ${Utils.daysUntil(t.dueDate)}`).join('. Next is ');
          const msg = `Your upcoming deadlines: ${items}.`;
          Utils.showToast(msg, 'info');
          VoiceSpeech.speak(msg);
        } else {
          const msg = 'You have no upcoming deadlines in the immediate queue.';
          Utils.showToast(msg, 'info');
          VoiceSpeech.speak(msg);
        }
        break;
      }
    }
  }

  function bindEvents() {
    // Global keyboard shortcut: Press 'v' or 'V' outside of inputs to toggle voice assistant
    window.addEventListener('keydown', (e) => {
      const tag = document.activeElement ? document.activeElement.tagName.toLowerCase() : '';
      if (tag === 'input' || tag === 'textarea' || tag === 'select') return;

      if (e.key === 'v' || e.key === 'V') {
        e.preventDefault();
        triggerVoiceListening();
      } else if (e.key === 'Escape') {
        VoiceSpeech.stopListening();
        hideWidget();
      }
    });
  }

  return {
    init,
    triggerVoiceListening,
    hideWidget
  };
})();
