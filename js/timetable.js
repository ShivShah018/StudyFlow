const Timetable = (() => {
  const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  function init() {
    render();
  }

  function getBusyIntervals(dateStr) {
    if (!dateStr) return [];
    const date = new Date(dateStr + 'T12:00:00');
    const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
    const all = Storage.getTimetable();
    const dayClasses = all.filter(c => c.day === dayName);

    return dayClasses.map(c => {
      const [sh, sm] = c.startTime.split(':').map(Number);
      const [eh, em] = c.endTime.split(':').map(Number);
      return {
        subject: c.subject,
        room: c.room || '',
        type: c.type || 'Lecture',
        startHour: sh + (sm / 60),
        endHour: eh + (em / 60),
        startTime: c.startTime,
        endTime: c.endTime
      };
    });
  }

  function render() {
    const container = document.getElementById('page-timetable');
    if (!container) return;
    const schedule = Storage.getTimetable();
    const topics = Storage.getSyllabusTopics();

    container.innerHTML = `
      <div style="max-width:1100px;margin:0 auto;">
        <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;margin-bottom:24px;">
          <div>
            <h2 style="font-size:24px;font-weight:800;letter-spacing:-0.3px;">Academic Timetable & Course Manager</h2>
            <p style="color:var(--text-secondary);font-size:14px;">Manage recurring lecture schedules, lab blocks, and spaced revision progress</p>
          </div>
          <div style="display:flex;gap:10px;">
            <button class="btn btn-primary" id="addClassBtn">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg> Add Class / Lab
            </button>
            <button class="btn btn-secondary" id="addTopicBtn">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/></svg> Add Topic
            </button>
          </div>
        </div>

        <!-- Weekly Timetable Grid -->
        <div class="card" style="margin-bottom:28px;">
          <h3 style="font-size:17px;font-weight:700;margin-bottom:16px;display:flex;align-items:center;gap:8px;">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            Weekly Class & Lab Schedule
          </h3>
          <p style="font-size:13px;color:var(--text-secondary);margin-bottom:18px;">
            The Intelligent Study Planner references these fixed lecture commitments to guarantee collision-free study sessions.
          </p>
          <div class="timetable-grid" style="display:grid;grid-template-columns:repeat(auto-fit, minmax(135px, 1fr));gap:12px;">
            ${DAYS.map(day => {
              const dayItems = schedule.filter(s => s.day === day).sort((a,b) => a.startTime.localeCompare(b.startTime));
              return `
                <div class="timetable-day-col" style="background:var(--bg-input);border-radius:var(--radius-md);padding:12px;border:1px solid var(--border-color);">
                  <div style="font-weight:700;font-size:13px;text-align:center;padding-bottom:8px;border-bottom:1px solid var(--border-color);color:var(--accent);">${day.substring(0,3)}</div>
                  <div style="display:flex;flex-direction:column;gap:8px;margin-top:10px;min-height:140px;">
                    ${dayItems.length === 0 ? '<div style="font-size:11px;color:var(--text-secondary);text-align:center;padding-top:30px;">No classes</div>' : dayItems.map(c => `
                      <div class="timetable-class-card" style="padding:8px 10px;border-radius:var(--radius-sm);background:var(--bg-card);border-left:3px solid ${c.type === 'Lab' ? 'var(--warning)' : 'var(--accent)'};font-size:12px;box-shadow:var(--shadow-sm);position:relative;">
                        <div style="font-weight:700;color:var(--text-primary);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${Utils.escapeHTML(c.subject)}</div>
                        <div style="font-size:11px;color:var(--text-secondary);">${c.startTime} - ${c.endTime}</div>
                        ${c.room ? `<div style="font-size:10px;color:var(--text-secondary);margin-top:2px;">📍 ${Utils.escapeHTML(c.room)}</div>` : ''}
                        <button class="delete-class-btn" data-id="${c.id}" style="position:absolute;top:4px;right:4px;background:none;border:none;color:var(--text-secondary);cursor:pointer;font-size:14px;padding:2px;" title="Delete">&times;</button>
                      </div>
                    `).join('')}
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>

        <!-- Spaced Revision & Syllabus Progress Tracker -->
        <div class="card">
          <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;margin-bottom:16px;">
            <div>
              <h3 style="font-size:17px;font-weight:700;display:flex;align-items:center;gap:8px;">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
                Spaced Revision & Syllabus Master List
              </h3>
              <p style="font-size:13px;color:var(--text-secondary);margin-top:2px;">
                Automatic review interval scheduling (1d, 3d, 7d, 14d, 30d) based on the Ebbinghaus forgetting curve
              </p>
            </div>
            <div style="font-size:12px;font-weight:600;color:var(--accent);background:var(--accent-light);padding:4px 10px;border-radius:20px;">
              ${topics.length} Key Topics Tracked
            </div>
          </div>

          <div style="overflow-x:auto;">
            <table style="width:100%;border-collapse:collapse;font-size:13px;text-align:left;">
              <thead>
                <tr style="border-bottom:1px solid var(--border-color);color:var(--text-secondary);font-size:12px;text-transform:uppercase;">
                  <th style="padding:10px 12px;">Subject</th>
                  <th style="padding:10px 12px;">Topic / Concept</th>
                  <th style="padding:10px 12px;">Status</th>
                  <th style="padding:10px 12px;">Confidence</th>
                  <th style="padding:10px 12px;">Next Review</th>
                  <th style="padding:10px 12px;text-align:right;">Actions</th>
                </tr>
              </thead>
              <tbody>
                ${topics.map(t => {
                  const isDue = t.nextRevisionDate && t.nextRevisionDate <= Utils.getTodayStr();
                  const statusBadge = t.status === 'Mastered' ? 'badge-low' : (t.status === 'In Review' ? 'badge-medium' : 'badge-high');
                  return `
                    <tr style="border-bottom:1px solid var(--border-color);transition:background var(--transition);">
                      <td style="padding:12px;font-weight:600;color:var(--accent);">${Utils.escapeHTML(t.subject)}</td>
                      <td style="padding:12px;font-weight:500;">${Utils.escapeHTML(t.topic)}</td>
                      <td style="padding:12px;"><span class="badge ${statusBadge}">${t.status}</span></td>
                      <td style="padding:12px;">
                        <div style="display:flex;align-items:center;gap:8px;">
                          <div style="width:60px;height:6px;background:var(--bg-input);border-radius:3px;overflow:hidden;">
                            <div style="width:${t.confidence}%;height:100%;background:linear-gradient(90deg,var(--accent),var(--success));"></div>
                          </div>
                          <span style="font-size:11px;font-weight:600;">${t.confidence}%</span>
                        </div>
                      </td>
                      <td style="padding:12px;">
                        <span style="color:${isDue ? 'var(--danger)' : 'var(--text-secondary)'};font-weight:${isDue ? '700' : '500'};">
                          ${t.nextRevisionDate ? (isDue ? `⚠️ Due (${t.nextRevisionDate})` : t.nextRevisionDate) : 'Not scheduled'}
                        </span>
                      </td>
                      <td style="padding:12px;text-align:right;">
                        <button class="btn btn-sm btn-secondary revise-topic-btn" data-id="${t.id}" style="padding:4px 8px;font-size:11px;" title="Mark Revised">
                          ✓ Revised
                        </button>
                      </td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;

    bindEvents();
  }

  function showAddClassModal() {
    const subjects = ['DSA', 'DBMS', 'Operating Systems', 'Web Development', 'Computer Networks', 'Mathematics', 'Physics'];
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay active';
    overlay.innerHTML = `
      <div class="modal" style="max-width:460px;">
        <div class="modal-header">
          <h2>Add Class / Lab Schedule</h2>
          <button class="modal-close" id="cModalClose">&times;</button>
        </div>
        <form id="addClassForm">
          <div class="form-group">
            <label for="cSubject">Subject / Course <span style="color:var(--danger)">*</span></label>
            <input type="text" id="cSubject" list="ttSubjList" placeholder="e.g. Operating Systems" required />
            <datalist id="ttSubjList">
              ${subjects.map(s => `<option value="${s}"></option>`).join('')}
            </datalist>
          </div>
          <div class="form-group" style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
            <div>
              <label for="cDay">Day of Week</label>
              <select id="cDay">
                ${DAYS.map(d => `<option value="${d}">${d}</option>`).join('')}
              </select>
            </div>
            <div>
              <label for="cType">Session Type</label>
              <select id="cType">
                <option value="Lecture">Lecture</option>
                <option value="Lab">Lab</option>
                <option value="Tutorial">Tutorial</option>
              </select>
            </div>
          </div>
          <div class="form-group" style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
            <div>
              <label for="cStart">Start Time</label>
              <input type="time" id="cStart" value="09:00" required />
            </div>
            <div>
              <label for="cEnd">End Time</label>
              <input type="time" id="cEnd" value="10:30" required />
            </div>
          </div>
          <div class="form-group">
            <label for="cRoom">Room / Hall (Optional)</label>
            <input type="text" id="cRoom" placeholder="e.g. Hall 301 or Virtual" />
          </div>
          <div class="form-actions">
            <button type="button" class="btn btn-secondary" id="cModalCancel">Cancel</button>
            <button type="submit" class="btn btn-primary">Save to Schedule</button>
          </div>
        </form>
      </div>
    `;
    document.body.appendChild(overlay);

    const close = () => overlay.remove();
    document.getElementById('cModalClose').addEventListener('click', close);
    document.getElementById('cModalCancel').addEventListener('click', close);
    overlay.addEventListener('click', e => { if (e.target === overlay) close(); });

    document.getElementById('addClassForm').addEventListener('submit', e => {
      e.preventDefault();
      const subject = document.getElementById('cSubject').value.trim();
      const startTime = document.getElementById('cStart').value;
      const endTime = document.getElementById('cEnd').value;
      if (!subject || !startTime || !endTime) return;

      Storage.addTimetableClass({
        id: 'tt_' + Date.now().toString(36),
        day: document.getElementById('cDay').value,
        type: document.getElementById('cType').value,
        subject,
        startTime,
        endTime,
        room: document.getElementById('cRoom').value.trim()
      });

      Utils.showToast('Class schedule saved', 'success');
      close();
      render();
      if (typeof StudyPlanner !== 'undefined') StudyPlanner.generateSchedule();
    });
  }

  function showAddTopicModal() {
    const subjects = ['DSA', 'DBMS', 'Operating Systems', 'Web Development', 'Computer Networks'];
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay active';
    overlay.innerHTML = `
      <div class="modal" style="max-width:460px;">
        <div class="modal-header">
          <h2>Add Syllabus Topic for Revision</h2>
          <button class="modal-close" id="topModalClose">&times;</button>
        </div>
        <form id="addTopicForm">
          <div class="form-group">
            <label for="topSubj">Subject <span style="color:var(--danger)">*</span></label>
            <input type="text" id="topSubj" list="topSubjList" placeholder="e.g. DSA" required />
            <datalist id="topSubjList">
              ${subjects.map(s => `<option value="${s}"></option>`).join('')}
            </datalist>
          </div>
          <div class="form-group">
            <label for="topTitle">Topic / Chapter Title <span style="color:var(--danger)">*</span></label>
            <input type="text" id="topTitle" placeholder="e.g. Red-Black Trees & B-Trees" required />
          </div>
          <div class="form-group" style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
            <div>
              <label for="topStatus">Initial Status</label>
              <select id="topStatus">
                <option value="Needs Practice">Needs Practice</option>
                <option value="In Review">In Review</option>
                <option value="Mastered">Mastered</option>
              </select>
            </div>
            <div>
              <label for="topConf">Confidence (1-100%)</label>
              <input type="number" id="topConf" min="10" max="100" value="60" />
            </div>
          </div>
          <div class="form-actions">
            <button type="button" class="btn btn-secondary" id="topModalCancel">Cancel</button>
            <button type="submit" class="btn btn-primary">Add Topic</button>
          </div>
        </form>
      </div>
    `;
    document.body.appendChild(overlay);

    const close = () => overlay.remove();
    document.getElementById('topModalClose').addEventListener('click', close);
    document.getElementById('topModalCancel').addEventListener('click', close);
    overlay.addEventListener('click', e => { if (e.target === overlay) close(); });

    document.getElementById('addTopicForm').addEventListener('submit', e => {
      e.preventDefault();
      const subject = document.getElementById('topSubj').value.trim();
      const topic = document.getElementById('topTitle').value.trim();
      if (!subject || !topic) return;

      const nextRev = new Date();
      nextRev.setDate(nextRev.getDate() + 3); // initial 3-day interval
      const nextRevStr = nextRev.toISOString().split('T')[0];

      Storage.addSyllabusTopic({
        id: 'top_' + Date.now().toString(36),
        subject,
        topic,
        status: document.getElementById('topStatus').value,
        confidence: parseInt(document.getElementById('topConf').value) || 50,
        lastRevised: Utils.getTodayStr(),
        nextRevisionDate: nextRevStr,
        intervalIndex: 1
      });

      Utils.showToast('Topic added to spaced revision', 'success');
      close();
      render();
    });
  }

  function handleReviseTopic(topicId) {
    const topics = Storage.getSyllabusTopics();
    const t = topics.find(x => x.id === topicId);
    if (!t) return;

    // Spaced intervals (days): 1, 3, 7, 14, 30
    const intervals = [1, 3, 7, 14, 30];
    const curIdx = t.intervalIndex || 0;
    const nextIdx = Math.min(curIdx + 1, intervals.length - 1);
    const addedDays = intervals[nextIdx];

    const nextDate = new Date();
    nextDate.setDate(nextDate.getDate() + addedDays);
    const nextDateStr = nextDate.toISOString().split('T')[0];

    const updatedConf = Math.min(100, (t.confidence || 50) + 10);
    const updatedStatus = updatedConf >= 85 ? 'Mastered' : 'In Review';

    Storage.updateSyllabusTopic(topicId, {
      lastRevised: Utils.getTodayStr(),
      nextRevisionDate: nextDateStr,
      intervalIndex: nextIdx,
      confidence: updatedConf,
      status: updatedStatus
    });

    Utils.showToast(`Revised! Next review in ${addedDays} day(s)`, 'success');
    render();
  }

  function bindEvents() {
    const container = document.getElementById('page-timetable');
    if (!container) return;

    document.getElementById('addClassBtn')?.addEventListener('click', showAddClassModal);
    document.getElementById('addTopicBtn')?.addEventListener('click', showAddTopicModal);

    container.querySelectorAll('.delete-class-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.dataset.id;
        if (confirm('Remove this class from timetable?')) {
          Storage.deleteTimetableClass(id);
          Utils.showToast('Class removed', 'info');
          render();
          if (typeof StudyPlanner !== 'undefined') StudyPlanner.generateSchedule();
        }
      });
    });

    container.querySelectorAll('.revise-topic-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        handleReviseTopic(btn.dataset.id);
      });
    });
  }

  return { init, render, getBusyIntervals };
})();
