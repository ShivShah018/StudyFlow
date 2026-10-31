const BackupService = (() => {
  function exportData() {
    try {
      const jsonStr = Storage.exportAllDataJSON();
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const dateStr = Utils.getTodayStr();
      a.href = url;
      a.download = `studyflow_backup_${dateStr}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      Utils.showToast('StudyFlow backup downloaded successfully', 'success');
    } catch (e) {
      Utils.showToast('Export failed: ' + e.message, 'error');
    }
  }

  function showBackupModal() {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay active';
    overlay.innerHTML = `
      <div class="modal" style="max-width:500px;">
        <div class="modal-header">
          <h2>Data Backup & Recovery</h2>
          <button class="modal-close" id="bkModalClose">&times;</button>
        </div>
        <div style="display:flex;flex-direction:column;gap:18px;">
          <div>
            <h4 style="font-size:14px;font-weight:700;margin-bottom:4px;">Export Local Data</h4>
            <p style="font-size:13px;color:var(--text-secondary);margin-bottom:10px;">
              Download a complete JSON snapshot of your tasks, timetable, focus history, and study schedules.
            </p>
            <button class="btn btn-primary" id="bkExportBtn" style="width:100%;">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              Export JSON Backup
            </button>
          </div>

          <div style="border-top:1px solid var(--border-color);padding-top:18px;">
            <h4 style="font-size:14px;font-weight:700;margin-bottom:4px;">Import & Restore Data</h4>
            <p style="font-size:13px;color:var(--text-secondary);margin-bottom:10px;">
              Restore your study data from a previously exported StudyFlow JSON backup file.
            </p>
            <input type="file" id="bkFileInput" accept=".json" style="display:none;" />
            <button class="btn btn-secondary" id="bkImportPickBtn" style="width:100%;">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
              Select Backup File to Import
            </button>
          </div>

          <div id="bkPreviewArea" style="display:none;background:var(--bg-input);padding:14px;border-radius:var(--radius-sm);border:1px solid var(--border-color);font-size:12px;">
            <div style="font-weight:700;color:var(--accent);margin-bottom:6px;">Backup Summary Preview:</div>
            <div id="bkPreviewDetails" style="color:var(--text-primary);line-height:1.6;margin-bottom:12px;"></div>
            <div style="display:flex;gap:8px;">
              <button class="btn btn-sm btn-primary" id="bkConfirmReplaceBtn" style="flex:1;">Replace Existing</button>
              <button class="btn btn-sm btn-secondary" id="bkConfirmMergeBtn" style="flex:1;">Merge with Existing</button>
            </div>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    const close = () => overlay.remove();
    document.getElementById('bkModalClose').addEventListener('click', close);
    overlay.addEventListener('click', e => { if (e.target === overlay) close(); });

    document.getElementById('bkExportBtn').addEventListener('click', () => {
      exportData();
    });

    const fileInput = document.getElementById('bkFileInput');
    document.getElementById('bkImportPickBtn').addEventListener('click', () => {
      fileInput.click();
    });

    let currentValidatedResult = null;

    fileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target.result;
        const result = Storage.validateImportData(text);

        if (!result.valid) {
          Utils.showToast('Invalid backup file: ' + result.error, 'error');
          return;
        }

        currentValidatedResult = result;
        const previewArea = document.getElementById('bkPreviewArea');
        const detailsEl = document.getElementById('bkPreviewDetails');
        previewArea.style.display = 'block';

        detailsEl.innerHTML = `
          <strong>Version:</strong> ${result.version} &middot; <strong>Date:</strong> ${result.exportedAt}<br/>
          <strong>Tasks:</strong> ${result.counts.tasks} &middot; 
          <strong>Classes:</strong> ${result.counts.timetable} &middot; 
          <strong>Focus Logs:</strong> ${result.counts.focusHistory} &middot; 
          <strong>Topics:</strong> ${result.counts.syllabusTopics}
        `;
      };
      reader.readAsText(file);
    });

    document.getElementById('bkConfirmReplaceBtn').addEventListener('click', () => {
      if (!currentValidatedResult) return;
      if (confirm('Replace all existing local data with this backup? A pre-import snapshot will be saved.')) {
        Storage.importAllData(currentValidatedResult, 'replace');
        Utils.showToast('Data restored successfully', 'success');
        close();
        window.location.reload();
      }
    });

    document.getElementById('bkConfirmMergeBtn').addEventListener('click', () => {
      if (!currentValidatedResult) return;
      Storage.importAllData(currentValidatedResult, 'merge');
      Utils.showToast('Data merged successfully', 'success');
      close();
      window.location.reload();
    });
  }

  return { exportData, showBackupModal };
})();
