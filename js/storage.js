const Storage = (() => {
  function getTasks() { try { const d = localStorage.getItem('studyflow_tasks'); return d ? JSON.parse(d) : []; } catch { return []; } }
  function saveTasks(t) { localStorage.setItem('studyflow_tasks', JSON.stringify(t)); }
  function addTask(task) { const t = getTasks(); t.push(task); saveTasks(t); return task; }
  function updateTask(id, updates) { const t = getTasks(); const i = t.findIndex(x => x.id === id); if (i === -1) return null; t[i] = { ...t[i], ...updates }; saveTasks(t); return t[i]; }
  function deleteTask(id) { const t = getTasks(); const f = t.filter(x => x.id !== id); if (f.length === t.length) return false; saveTasks(f); return true; }
  function toggleTaskComplete(id) { const t = getTasks(); const task = t.find(x => x.id === id); if (!task) return null; task.completed = !task.completed; task.completedAt = task.completed ? new Date().toISOString() : null; saveTasks(t); return task; }
  function getPlannerSchedule() { try { const d = localStorage.getItem('studyflow_planner_schedule'); return d ? JSON.parse(d) : null; } catch { return null; } }
  function savePlannerSchedule(s) { localStorage.setItem('studyflow_planner_schedule', JSON.stringify(s)); }
  function savePlannerCompletedDates(d) { localStorage.setItem('studyflow_planner_completed_dates', JSON.stringify(d)); }
  return { getTasks, addTask, updateTask, deleteTask, toggleTaskComplete, getPlannerSchedule, savePlannerSchedule, savePlannerCompletedDates };
})();
