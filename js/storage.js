const Storage = (() => {
  const CURRENT_SCHEMA_VERSION = '2.0.0';

  // Safe migration and auto-backup on startup
  function initMigration() {
    try {
      // Create an automatic safety snapshot if none exists
      if (!localStorage.getItem('studyflow_auto_snapshot_v1')) {
        const snapshot = {};
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          if (k && k.startsWith('studyflow_')) {
            snapshot[k] = localStorage.getItem(k);
          }
        }
        localStorage.setItem('studyflow_auto_snapshot_v1', JSON.stringify({
          createdAt: new Date().toISOString(),
          keys: snapshot
        }));
      }

      // Upgrade existing tasks to support subtasks, recurring properties, and task type
      const tasks = getTasks();
      let modified = false;
      tasks.forEach(t => {
        if (!Array.isArray(t.subtasks)) { t.subtasks = []; modified = true; }
        if (t.isRecurring === undefined) { t.isRecurring = false; modified = true; }
        if (!t.recurrenceInterval) { t.recurrenceInterval = 'none'; modified = true; }
        if (t.actualDuration === undefined) { t.actualDuration = t.studiedMinutes || 0; modified = true; }
        if (!t.type) { t.type = 'assignment'; modified = true; }
      });
      if (modified) {
        saveTasks(tasks);
      }
    } catch (e) {
      console.warn('Storage migration notice:', e);
    }
  }

  // --- Task Methods ---
  function getTasks() {
    try {
      const d = localStorage.getItem('studyflow_tasks');
      return d ? JSON.parse(d) : [];
    } catch {
      return [];
    }
  }

  function saveTasks(t) {
    localStorage.setItem('studyflow_tasks', JSON.stringify(t));
  }

  function addTask(task) {
    const t = getTasks();
    if (!Array.isArray(task.subtasks)) task.subtasks = [];
    if (task.isRecurring === undefined) task.isRecurring = false;
    if (!task.recurrenceInterval) task.recurrenceInterval = 'none';
    if (task.actualDuration === undefined) task.actualDuration = 0;
    if (!task.type) task.type = 'assignment';
    t.push(task);
    saveTasks(t);
    return task;
  }

  function updateTask(id, updates) {
    const t = getTasks();
    const i = t.findIndex(x => x.id === id);
    if (i === -1) return null;
    t[i] = { ...t[i], ...updates };
    saveTasks(t);
    return t[i];
  }

  function deleteTask(id) {
    const t = getTasks();
    const f = t.filter(x => x.id !== id);
    if (f.length === t.length) return false;
    saveTasks(f);
    return true;
  }

  function toggleTaskComplete(id) {
    const t = getTasks();
    const task = t.find(x => x.id === id);
    if (!task) return null;
    task.completed = !task.completed;
    task.completedAt = task.completed ? new Date().toISOString() : null;
    
    // Handle Recurring Tasks on completion
    if (task.completed && task.isRecurring && task.recurrenceInterval && task.recurrenceInterval !== 'none') {
      spawnNextRecurringTask(task);
    }

    saveTasks(t);
    return task;
  }

  function spawnNextRecurringTask(prevTask) {
    if (!prevTask.dueDate) return;
    const nextDate = new Date(prevTask.dueDate + 'T12:00:00');
    if (prevTask.recurrenceInterval === 'daily') {
      nextDate.setDate(nextDate.getDate() + 1);
    } else if (prevTask.recurrenceInterval === 'weekly') {
      nextDate.setDate(nextDate.getDate() + 7);
    } else if (prevTask.recurrenceInterval === 'weekdays') {
      const day = nextDate.getDay();
      nextDate.setDate(nextDate.getDate() + (day === 5 ? 3 : day === 6 ? 2 : 1));
    }
    const nextDateStr = nextDate.getFullYear() + '-' + 
      String(nextDate.getMonth() + 1).padStart(2, '0') + '-' + 
      String(nextDate.getDate()).padStart(2, '0');

    const nextTask = {
      ...prevTask,
      id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
      dueDate: nextDateStr,
      completed: false,
      completedAt: null,
      studiedMinutes: 0,
      actualDuration: 0,
      createdAt: new Date().toISOString(),
      subtasks: (prevTask.subtasks || []).map(s => ({ ...s, id: Math.random().toString(36).substr(2, 6), completed: false }))
    };
    addTask(nextTask);
  }

  // --- Planner Schedule Methods ---
  function getPlannerSchedule() {
    try {
      const d = localStorage.getItem('studyflow_planner_schedule');
      return d ? JSON.parse(d) : null;
    } catch {
      return null;
    }
  }

  function savePlannerSchedule(s) {
    localStorage.setItem('studyflow_planner_schedule', JSON.stringify(s));
  }

  function savePlannerCompletedDates(d) {
    localStorage.setItem('studyflow_planner_completed_dates', JSON.stringify(d));
  }

  // --- Student Profile & Settings ---
  function getStudentName() {
    return localStorage.getItem('studyflow_student_name') || 'Student';
  }

  function setStudentName(name) {
    localStorage.setItem('studyflow_student_name', name.trim() || 'Student');
  }

  // --- Timetable Methods ---
  function getTimetable() {
    try {
      const d = localStorage.getItem('studyflow_timetable');
      return d ? JSON.parse(d) : getDefaultTimetable();
    } catch {
      return getDefaultTimetable();
    }
  }

  function saveTimetable(list) {
    localStorage.setItem('studyflow_timetable', JSON.stringify(list));
  }

  function addTimetableClass(item) {
    const list = getTimetable();
    list.push(item);
    saveTimetable(list);
    return item;
  }

  function deleteTimetableClass(id) {
    const list = getTimetable();
    const filtered = list.filter(c => c.id !== id);
    saveTimetable(filtered);
    return filtered;
  }

  function getDefaultTimetable() {
    // Sensible academic default schedule for university students (Mon-Fri)
    return [
      { id: 'tt_1', day: 'Monday', startTime: '09:00', endTime: '10:30', subject: 'DSA', room: 'Hall A', type: 'Lecture' },
      { id: 'tt_2', day: 'Monday', startTime: '11:00', endTime: '12:30', subject: 'Operating Systems', room: 'Lab 2', type: 'Lab' },
      { id: 'tt_3', day: 'Tuesday', startTime: '10:00', endTime: '11:30', subject: 'DBMS', room: 'Hall B', type: 'Lecture' },
      { id: 'tt_4', day: 'Wednesday', startTime: '09:00', endTime: '10:30', subject: 'Computer Networks', room: 'Hall C', type: 'Lecture' },
      { id: 'tt_5', day: 'Wednesday', startTime: '14:00', endTime: '16:00', subject: 'DSA', room: 'Lab 1', type: 'Lab' },
      { id: 'tt_6', day: 'Thursday', startTime: '11:00', endTime: '12:30', subject: 'Web Development', room: 'Lab 3', type: 'Lecture' },
      { id: 'tt_7', day: 'Friday', startTime: '10:00', endTime: '11:30', subject: 'Operating Systems', room: 'Hall A', type: 'Lecture' }
    ];
  }

  // --- Focus Session History (Time-series log) ---
  function getFocusHistory() {
    try {
      const d = localStorage.getItem('studyflow_focus_history');
      return d ? JSON.parse(d) : [];
    } catch {
      return [];
    }
  }

  function addFocusSession(session) {
    try {
      const history = getFocusHistory();
      session.id = session.id || ('foc_' + Date.now().toString(36));
      session.timestamp = session.timestamp || new Date().toISOString();
      history.push(session);
      // Keep last 1000 sessions to preserve performance
      const trimmed = history.slice(-1000);
      localStorage.setItem('studyflow_focus_history', JSON.stringify(trimmed));
      return session;
    } catch (e) {
      console.warn('Failed to add focus session:', e);
      return null;
    }
  }

  // --- Active Timer Persistence (Across Refreshes & Background Throttling) ---
  function getActiveTimerState() {
    try {
      const d = localStorage.getItem('studyflow_active_timer');
      return d ? JSON.parse(d) : null;
    } catch {
      return null;
    }
  }

  function saveActiveTimerState(state) {
    if (!state) {
      localStorage.removeItem('studyflow_active_timer');
    } else {
      localStorage.setItem('studyflow_active_timer', JSON.stringify(state));
    }
  }

  // --- Syllabus & Revision Tracking (Spaced Repetition) ---
  function getSyllabusTopics() {
    try {
      const d = localStorage.getItem('studyflow_syllabus_topics');
      return d ? JSON.parse(d) : getDefaultSyllabusTopics();
    } catch {
      return getDefaultSyllabusTopics();
    }
  }

  function saveSyllabusTopics(topics) {
    localStorage.setItem('studyflow_syllabus_topics', JSON.stringify(topics));
  }

  function addSyllabusTopic(topic) {
    const list = getSyllabusTopics();
    list.push(topic);
    saveSyllabusTopics(list);
    return topic;
  }

  function updateSyllabusTopic(id, updates) {
    const list = getSyllabusTopics();
    const idx = list.findIndex(t => t.id === id);
    if (idx === -1) return null;
    list[idx] = { ...list[idx], ...updates };
    saveSyllabusTopics(list);
    return list[idx];
  }

  function getDefaultSyllabusTopics() {
    return [
      { id: 'top_1', subject: 'DSA', topic: 'Dynamic Programming & Knapsack', status: 'Mastered', confidence: 90, lastRevised: '2026-10-25', nextRevisionDate: '2026-11-05', intervalIndex: 3 },
      { id: 'top_2', subject: 'DSA', topic: 'Graph Algorithms (Dijkstra, Bellman-Ford)', status: 'In Review', confidence: 75, lastRevised: '2026-10-28', nextRevisionDate: '2026-11-01', intervalIndex: 2 },
      { id: 'top_3', subject: 'Operating Systems', topic: 'Virtual Memory & Page Replacement', status: 'Needs Practice', confidence: 55, lastRevised: '2026-10-20', nextRevisionDate: '2026-10-31', intervalIndex: 1 },
      { id: 'top_4', subject: 'Operating Systems', topic: 'Process Synchronization & Semaphores', status: 'In Review', confidence: 70, lastRevised: '2026-10-27', nextRevisionDate: '2026-11-02', intervalIndex: 2 },
      { id: 'top_5', subject: 'DBMS', topic: 'Normalization & Normal Forms (1NF-BCNF)', status: 'Mastered', confidence: 85, lastRevised: '2026-10-26', nextRevisionDate: '2026-11-06', intervalIndex: 3 },
      { id: 'top_6', subject: 'DBMS', topic: 'Transactions & ACID Properties', status: 'In Review', confidence: 65, lastRevised: '2026-10-29', nextRevisionDate: '2026-11-01', intervalIndex: 1 },
      { id: 'top_7', subject: 'Computer Networks', topic: 'TCP/IP Protocol Stack & Subnetting', status: 'Needs Practice', confidence: 50, lastRevised: '2026-10-22', nextRevisionDate: '2026-10-30', intervalIndex: 1 }
    ];
  }

  // --- Academic Document Intelligence Persistence ---
  function getDocuments() {
    try {
      const d = localStorage.getItem('studyflow_documents');
      return d ? JSON.parse(d) : [];
    } catch {
      return [];
    }
  }

  function saveDocuments(docs) {
    localStorage.setItem('studyflow_documents', JSON.stringify(docs));
  }

  function addDocument(doc) {
    const docs = getDocuments();
    docs.push(doc);
    saveDocuments(docs);
    return doc;
  }

  function deleteDocument(id) {
    const docs = getDocuments();
    const filtered = docs.filter(d => d.id !== id);
    saveDocuments(filtered);
    return filtered;
  }

  // --- JSON Data Backup, Import & Schema Validation ---
  function exportAllDataJSON() {
    const payload = {
      version: CURRENT_SCHEMA_VERSION,
      exportedAt: new Date().toISOString(),
      studentName: getStudentName(),
      data: {
        tasks: getTasks(),
        plannerSchedule: getPlannerSchedule(),
        timetable: getTimetable(),
        focusHistory: getFocusHistory(),
        syllabusTopics: getSyllabusTopics(),
        documents: getDocuments(),
        settings: {
          theme: localStorage.getItem('studyflow_theme') || 'dark',
          notifSettings: localStorage.getItem('studyflow_notif_settings'),
          pomodoroSettings: localStorage.getItem('studyflow_pomodoro_settings')
        }
      }
    };
    return JSON.stringify(payload, null, 2);
  }

  function validateImportData(jsonString) {
    try {
      const parsed = JSON.parse(jsonString);
      if (!parsed || typeof parsed !== 'object') {
        return { valid: false, error: 'File is not a valid JSON object' };
      }
      if (!parsed.data || typeof parsed.data !== 'object') {
        return { valid: false, error: 'Missing core "data" envelope in backup' };
      }
      const tasks = Array.isArray(parsed.data.tasks) ? parsed.data.tasks : [];
      const timetable = Array.isArray(parsed.data.timetable) ? parsed.data.timetable : [];
      const focusHistory = Array.isArray(parsed.data.focusHistory) ? parsed.data.focusHistory : [];
      const syllabusTopics = Array.isArray(parsed.data.syllabusTopics) ? parsed.data.syllabusTopics : [];
      const documents = Array.isArray(parsed.data.documents) ? parsed.data.documents : [];

      return {
        valid: true,
        version: parsed.version || '1.0.0',
        exportedAt: parsed.exportedAt || 'Unknown',
        counts: {
          tasks: tasks.length,
          timetable: timetable.length,
          focusHistory: focusHistory.length,
          syllabusTopics: syllabusTopics.length,
          documents: documents.length
        },
        payload: parsed
      };
    } catch (e) {
      return { valid: false, error: 'JSON parse error: ' + e.message };
    }
  }

  function importAllData(validationResult, mode = 'replace') {
    if (!validationResult || !validationResult.valid) return false;
    const { data, studentName } = validationResult.payload;

    // Safety backup of current state before applying import
    const preImportBackup = exportAllDataJSON();
    localStorage.setItem('studyflow_pre_import_backup', preImportBackup);

    if (studentName) setStudentName(studentName);

    if (mode === 'replace') {
      if (Array.isArray(data.tasks)) saveTasks(data.tasks);
      if (data.plannerSchedule) savePlannerSchedule(data.plannerSchedule);
      if (Array.isArray(data.timetable)) saveTimetable(data.timetable);
      if (Array.isArray(data.focusHistory)) localStorage.setItem('studyflow_focus_history', JSON.stringify(data.focusHistory));
      if (Array.isArray(data.syllabusTopics)) saveSyllabusTopics(data.syllabusTopics);
      if (Array.isArray(data.documents)) saveDocuments(data.documents);
    } else {
      // Merge mode
      if (Array.isArray(data.tasks)) {
        const cur = getTasks();
        const ids = new Set(cur.map(x => x.id));
        data.tasks.forEach(t => { if (!ids.has(t.id)) cur.push(t); });
        saveTasks(cur);
      }
      if (Array.isArray(data.timetable)) {
        const cur = getTimetable();
        const ids = new Set(cur.map(x => x.id));
        data.timetable.forEach(item => { if (!ids.has(item.id)) cur.push(item); });
        saveTimetable(cur);
      }
      if (Array.isArray(data.syllabusTopics)) {
        const cur = getSyllabusTopics();
        const ids = new Set(cur.map(x => x.id));
        data.syllabusTopics.forEach(top => { if (!ids.has(top.id)) cur.push(top); });
        saveSyllabusTopics(cur);
      }
    }
    return true;
  }

  // Run initial migration
  initMigration();

  return {
    getTasks,
    addTask,
    updateTask,
    deleteTask,
    toggleTaskComplete,
    getPlannerSchedule,
    savePlannerSchedule,
    savePlannerCompletedDates,
    getStudentName,
    setStudentName,
    // Timetable
    getTimetable,
    saveTimetable,
    addTimetableClass,
    deleteTimetableClass,
    // Focus History
    getFocusHistory,
    addFocusSession,
    // Active Timer
    getActiveTimerState,
    saveActiveTimerState,
    // Syllabus & Revision
    getSyllabusTopics,
    saveSyllabusTopics,
    addSyllabusTopic,
    updateSyllabusTopic,
    // Documents
    getDocuments,
    saveDocuments,
    addDocument,
    deleteDocument,
    // Backup & Restore
    exportAllDataJSON,
    validateImportData,
    importAllData
  };
})();
