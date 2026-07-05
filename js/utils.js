const Utils = (() => {
  function generateId() { return Date.now().toString(36) + Math.random().toString(36).substr(2, 5); }
  function formatDateShort(dateStr) { const d = new Date(dateStr); return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }); }
  function isOverdue(dateStr) { const d = new Date(dateStr); const t = new Date(); t.setHours(23, 59, 59, 999); return d < t; }
  function getTodayStr() { const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
  function getTomorrowStr() { const d = new Date(); d.setDate(d.getDate() + 1); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
  function getGreeting() { const h = new Date().getHours(); if (h < 12) return 'Good Morning'; if (h < 18) return 'Good Afternoon'; return 'Good Evening'; }
  function getTodayDisplay() { const d = new Date(); return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }); }
  function daysUntil(dateStr) { const target = new Date(dateStr); const today = new Date(); today.setHours(0,0,0,0); target.setHours(0,0,0,0); const diff = Math.ceil((target - today) / (1000*60*60*24)); if (diff === 0) return 'Today'; if (diff === 1) return 'Tomorrow'; if (diff < 0) return `${Math.abs(diff)} days ago`; return `${diff} days left`; }
  function showToast(message, type = 'info') { let c = document.querySelector('.toast-container'); if (!c) { const div = document.createElement('div'); div.className = 'toast-container'; document.body.appendChild(div); c = div; } const toast = document.createElement('div'); toast.className = `toast toast-${type}`; toast.textContent = message; c.appendChild(toast); setTimeout(() => { toast.style.opacity = '0'; toast.style.transform = 'translateX(100%)'; toast.style.transition = 'all 0.3s ease'; }, 2500); setTimeout(() => toast.remove(), 3000); }
  function debounce(fn, delay) { let timer; return function (...args) { clearTimeout(timer); timer = setTimeout(() => fn.apply(this, args), delay); }; }
  function capitalize(str) { return str.charAt(0).toUpperCase() + str.slice(1); }
  function escapeHTML(str) { if (!str) return ''; const div = document.createElement('div'); div.textContent = str; return div.innerHTML; }
  return { generateId, formatDateShort, isOverdue, getTodayStr, getTomorrowStr, getGreeting, getTodayDisplay, daysUntil, showToast, debounce, capitalize, escapeHTML };
})();
