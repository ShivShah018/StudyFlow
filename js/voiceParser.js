const VoiceParser = (() => {
  const SUBJECT_MAP = {
    'dsa': 'DSA',
    'data structures': 'DSA',
    'the essay': 'DSA', // common phonetic error
    'algo': 'DSA',
    'dbms': 'DBMS',
    'database': 'DBMS',
    'the bms': 'DBMS',
    'os': 'Operating Systems',
    'operating systems': 'Operating Systems',
    'operating system': 'Operating Systems',
    'oh yes': 'Operating Systems',
    'web dev': 'Web Development',
    'web development': 'Web Development',
    'cn': 'Computer Networks',
    'computer networks': 'Computer Networks',
    'see an': 'Computer Networks',
    'maths': 'Mathematics',
    'math': 'Mathematics',
    'mathematics': 'Mathematics',
    'physics': 'Physics'
  };

  function parse(rawText) {
    if (!rawText || typeof rawText !== 'string') {
      return { intent: 'UNKNOWN', rawText: '' };
    }

    const text = rawText.toLowerCase().trim();

    // 1. Navigation Commands (English + Hinglish)
    if (matchAny(text, ['open dashboard', 'dashboard kholo', 'dashboard dikhao', 'go to dashboard'])) {
      return { intent: 'NAVIGATE', page: 'dashboard', rawText };
    }
    if (matchAny(text, ['show tasks', 'open tasks', 'tasks kholo', 'tasks dikhao', 'pending tasks dikhao', 'view tasks'])) {
      return { intent: 'NAVIGATE', page: 'tasks', rawText };
    }
    if (matchAny(text, ['open calendar', 'calendar dikhao', 'calendar kholo', 'view calendar'])) {
      return { intent: 'NAVIGATE', page: 'calendar', rawText };
    }
    if (matchAny(text, ['open pomodoro', 'open timer', 'timer kholo', 'timer dikhao', 'focus mode kholo', 'focus session kholo'])) {
      return { intent: 'NAVIGATE', page: 'pomodoro', rawText };
    }
    if (matchAny(text, ['open planner', 'planner kholo', 'planner dikhao', 'study planner kholo', 'schedule dikhao'])) {
      return { intent: 'NAVIGATE', page: 'planner', rawText };
    }
    if (matchAny(text, ['open analytics', 'analytics dikhao', 'analytics kholo', 'study analytics', 'intelligence kholo', 'show analytics'])) {
      return { intent: 'NAVIGATE', page: 'analytics', rawText };
    }
    if (matchAny(text, ['open timetable', 'timetable dikhao', 'timetable kholo', 'class schedule', 'classes dikhao'])) {
      return { intent: 'NAVIGATE', page: 'timetable', rawText };
    }
    if (matchAny(text, ['open documents', 'documents dikhao', 'notes kholo', 'document search', 'study materials'])) {
      return { intent: 'NAVIGATE', page: 'documents', rawText };
    }

    // 2. Theme Toggles
    if (matchAny(text, ['dark mode on karo', 'dark mode lagao', 'enable dark mode', 'switch to dark'])) {
      return { intent: 'SET_THEME', theme: 'dark', rawText };
    }
    if (matchAny(text, ['light mode on karo', 'light mode lagao', 'enable light mode', 'switch to light'])) {
      return { intent: 'SET_THEME', theme: 'light', rawText };
    }

    // 3. Pomodoro Timer Controls
    if (matchAny(text, ['start timer', 'timer start karo', 'start focus session', 'pomodoro start karo', 'chalu karo', 'timer shuru karo'])) {
      // Check if custom duration specified
      const durMatch = text.match(/(\d+)\s*(minute|min|m|ghanta|hour)/);
      const minutes = durMatch ? parseInt(durMatch[1]) : null;
      return { intent: 'POMODORO_START', minutes, rawText };
    }
    if (matchAny(text, ['pause timer', 'timer pause karo', 'timer roko', 'pause focus', 'roko'])) {
      return { intent: 'POMODORO_PAUSE', rawText };
    }
    if (matchAny(text, ['resume timer', 'timer resume karo', 'resume focus', 'fir se chalu karo'])) {
      return { intent: 'POMODORO_RESUME', rawText };
    }
    if (matchAny(text, ['reset timer', 'timer reset karo', 'reset pomodoro'])) {
      return { intent: 'POMODORO_RESET', rawText };
    }
    if (matchAny(text, ['how much time left', 'kitna time bacha hai', 'remaining time', 'time check'])) {
      return { intent: 'POMODORO_QUERY_REMAINING', rawText };
    }

    // 4. Overdue Task Triage
    if (matchAny(text, ['show overdue tasks', 'overdue assignments dikhao', 'overdue tasks dikhao', 'konsa task miss ho gaya', 'pending overdue'])) {
      return { intent: 'SHOW_OVERDUE', rawText };
    }

    // 5. Academic Queries & Summaries
    if (matchAny(text, ['give me today\'s summary', 'aaj ka summary batao', 'productivity summary', 'how many hours did i study', 'kitne ghante padha', 'is hafte kitna study kiya'])) {
      return { intent: 'QUERY_SUMMARY', rawText };
    }
    if (matchAny(text, ['what should i study today', 'aaj kya padhna hai', 'aaj ka schedule batao', 'show my next study session', 'what is my schedule'])) {
      return { intent: 'QUERY_SCHEDULE', rawText };
    }
    if (matchAny(text, ['which subject needs attention', 'kaunsa subject weak hai', 'weak subject kaunsa hai', 'subject risk'])) {
      return { intent: 'QUERY_WEAK_SUBJECT', rawText };
    }
    if (matchAny(text, ['what are my upcoming deadlines', 'deadlines this week', 'kya submit karna hai', 'upcoming assignments'])) {
      return { intent: 'QUERY_DEADLINES', rawText };
    }

    // 6. Complete Task by Voice
    if (text.includes('complete') || text.includes('mark as done') || text.includes('ho gaya') || text.includes('khatam ho gaya')) {
      const cleaned = text
        .replace(/mark/g, '')
        .replace(/as complete/g, '')
        .replace(/as done/g, '')
        .replace(/complete/g, '')
        .replace(/task/g, '')
        .replace(/assignment/g, '')
        .replace(/ho gaya/g, '')
        .replace(/khatam/g, '')
        .trim();
      return { intent: 'COMPLETE_TASK', searchTitle: cleaned, rawText };
    }

    // 7. Search Tasks by Keyword / Subject
    if (text.startsWith('search') || text.startsWith('find') || text.includes('dhundo') || text.includes('dikhao')) {
      const q = text
        .replace(/^search\s*(for)?/i, '')
        .replace(/^find/i, '')
        .replace(/tasks?/gi, '')
        .replace(/assignments?/gi, '')
        .replace(/dikhao/gi, '')
        .replace(/dhundo/gi, '')
        .trim();
      if (q) {
        return { intent: 'SEARCH_TASKS', query: q, rawText };
      }
    }

    // 8. Voice-Based Task Creation (English + Hinglish)
    if (matchAny(text, ['add', 'create', 'banao', 'add karo', 'new task', 'assign'])) {
      return parseTaskCreation(text, rawText);
    }

    return { intent: 'UNKNOWN', rawText };
  }

  function parseTaskCreation(text, rawText) {
    // Extract Subject
    let foundSubject = null;
    for (const [key, val] of Object.entries(SUBJECT_MAP)) {
      if (text.includes(key)) {
        foundSubject = val;
        break;
      }
    }

    // Extract Duration
    let duration = 60;
    const durMatch = text.match(/(\d+)\s*(minute|minutes|min|mins|m|ghante|ghanta|hours|hour|hr|hrs|h)/);
    if (durMatch) {
      const val = parseInt(durMatch[1]);
      const unit = durMatch[2];
      if (unit.startsWith('h') || unit.startsWith('g')) {
        duration = val * 60;
      } else {
        duration = val;
      }
    }

    // Extract Due Date
    let dueDate = null;
    const today = new Date();

    if (text.includes('today') || text.includes('aaj')) {
      dueDate = Utils.getTodayStr();
    } else if (text.includes('tomorrow') || text.includes('kal')) {
      // In task creation, "kal" deterministically means tomorrow
      dueDate = Utils.getTomorrowStr();
    } else if (text.includes('parso') || text.includes('day after tomorrow')) {
      const d = new Date(today);
      d.setDate(d.getDate() + 2);
      dueDate = d.toISOString().split('T')[0];
    } else {
      // Days of the week (Sunday..Saturday)
      const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      for (let i = 0; i < 7; i++) {
        if (text.includes(dayNames[i])) {
          const currentDay = today.getDay();
          const targetDay = i;
          let diff = targetDay - currentDay;
          if (diff <= 0) diff += 7; // Next occurrence
          const targetDate = new Date(today);
          targetDate.setDate(targetDate.getDate() + diff);
          dueDate = targetDate.toISOString().split('T')[0];
          break;
        }
      }
    }

    // Extract Priority
    let priority = 'medium';
    if (text.includes('urgent') || text.includes('high priority') || text.includes('zaroori') || text.includes('important')) {
      priority = 'high';
    } else if (text.includes('low priority') || text.includes('aaram se')) {
      priority = 'low';
    }

    // Clean title
    let title = rawText
      .replace(/add\s*(a)?/gi, '')
      .replace(/create\s*(a)?/gi, '')
      .replace(/task\s*(for)?/gi, '')
      .replace(/assignment\s*(for)?/gi, '')
      .replace(/add\s*karo/gi, '')
      .replace(/banao/gi, '')
      .replace(/due\s*(tomorrow|today|kal|aaj|sunday|monday|tuesday|wednesday|thursday|friday|saturday)/gi, '')
      .replace(/kal\s*ke\s*liye/gi, '')
      .replace(/duration\s*(\d+)\s*(hours|hour|minutes|mins|min)/gi, '')
      .replace(/urgent/gi, '')
      .replace(/high\s*priority/gi, '')
      .trim();

    if (!title || title.length < 2) {
      title = (foundSubject ? `${foundSubject} Assignment` : 'Study Session Task');
    }

    // Capitalize title
    title = title.charAt(0).toUpperCase() + title.slice(1);

    return {
      intent: 'CREATE_TASK',
      rawText,
      taskData: {
        title,
        subject: foundSubject || 'General',
        estimatedDuration: duration,
        dueDate,
        priority
      }
    };
  }

  function matchAny(text, patterns) {
    return patterns.some(p => text.includes(p));
  }

  return { parse };
})();
