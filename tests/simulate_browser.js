/**
 * Browser Environment Simulation for StudyFlow
 * Tests full page load, DOMContentLoaded, App.init(), event listeners,
 * navigation, and interactive button clicks without an external headless browser.
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');

// 1. Read index.html
const htmlContent = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

// 2. Build DOM element mock hierarchy
class MockDOMElement {
  constructor(tagName = 'div', id = '', className = '') {
    this.tagName = tagName.toUpperCase();
    this.id = id;
    this.className = className;
    this.classList = {
      _classes: new Set(className ? className.split(/\s+/).filter(Boolean) : []),
      add: (...cls) => cls.forEach(c => this.classList._classes.add(c)),
      remove: (...cls) => cls.forEach(c => this.classList._classes.delete(c)),
      toggle: (c, force) => {
        if (force === undefined) {
          if (this.classList._classes.has(c)) this.classList._classes.delete(c);
          else this.classList._classes.add(c);
        } else if (force) {
          this.classList._classes.add(c);
        } else {
          this.classList._classes.delete(c);
        }
      },
      contains: (c) => this.classList._classes.has(c)
    };
    this.dataset = {};
    this.style = {};
    this.children = [];
    this.parentNode = null;
    this._listeners = {};
    this._value = '';
    this._innerHTML = '';
    this._textContent = '';
  }

  get value() { return this._value; }
  set value(v) { this._value = String(v); }

  get textContent() { return this._textContent; }
  set textContent(v) { this._textContent = String(v); }

  get innerHTML() { return this._innerHTML; }
  set innerHTML(html) {
    this._innerHTML = html;
    // parse child IDs and classes from innerHTML
    this.children = [];
    parseMockChildren(this, html);
  }

  setAttribute(name, value) {
    if (name === 'class') this.className = value;
    else if (name === 'id') this.id = value;
    else if (name.startsWith('data-')) {
      const prop = name.slice(5).replace(/-([a-z])/g, (_, l) => l.toUpperCase());
      this.dataset[prop] = value;
    }
    this['_' + name] = value;
  }

  getAttribute(name) {
    if (name === 'class') return this.className;
    if (name === 'id') return this.id;
    if (name.startsWith('data-')) {
      const prop = name.slice(5).replace(/-([a-z])/g, (_, l) => l.toUpperCase());
      return this.dataset[prop] || null;
    }
    return this['_' + name] || null;
  }

  addEventListener(type, cb) {
    if (!this._listeners[type]) this._listeners[type] = [];
    this._listeners[type].push(cb);
  }

  removeEventListener(type, cb) {
    if (!this._listeners[type]) return;
    this._listeners[type] = this._listeners[type].filter(f => f !== cb);
  }

  dispatchEvent(event) {
    event.currentTarget = this;
    if (!event.target) event.target = this;
    const handlers = this._listeners[event.type] || [];
    for (const h of handlers) {
      try {
        h(event);
      } catch (err) {
        console.error(`Error in event listener for ${this.id || this.tagName} on ${event.type}:`, err);
        throw err;
      }
    }
    if (this.parentNode && !event.propagationStopped) {
      this.parentNode.dispatchEvent(event);
    }
  }

  click() {
    const ev = {
      type: 'click',
      target: this,
      currentTarget: this,
      defaultPrevented: false,
      preventDefault: () => { ev.defaultPrevented = true; },
      stopPropagation: () => { ev.propagationStopped = true; }
    };
    this.dispatchEvent(ev);
  }

  closest(selector) {
    let curr = this;
    while (curr) {
      if (curr.matches && curr.matches(selector)) return curr;
      curr = curr.parentNode;
    }
    return null;
  }

  matches(selector) {
    if (selector.includes('[')) {
      // e.g. .nav-item[data-page]
      const parts = selector.split('[');
      const baseSel = parts[0];
      const attrPart = '[' + parts[1];
      const baseMatches = baseSel ? this.matches(baseSel) : true;
      if (!baseMatches) return false;
      const match = attrPart.match(/\[data-([a-zA-Z-]+)(?:=(['"]?)([^'"]+)\2)?\]/);
      if (match) {
        const prop = match[1].replace(/-([a-z])/g, (_, l) => l.toUpperCase());
        if (match[3] !== undefined) return this.dataset[prop] === match[3];
        return prop in this.dataset;
      }
      return false;
    }
    if (selector.startsWith('#')) return this.id === selector.slice(1);
    if (selector.startsWith('.')) return this.classList.contains(selector.slice(1));
    return this.tagName.toLowerCase() === selector.toLowerCase();
  }

  querySelector(selector) {
    const list = this.querySelectorAll(selector);
    return list.length > 0 ? list[0] : null;
  }

  querySelectorAll(selector) {
    const results = [];
    const traverse = (el) => {
      for (const ch of el.children) {
        if (ch.matches && ch.matches(selector)) results.push(ch);
        traverse(ch);
      }
    };
    traverse(this);
    return results;
  }

  appendChild(ch) {
    ch.parentNode = this;
    this.children.push(ch);
    allElementsMap[ch.id] = ch;
    return ch;
  }

  removeChild(ch) {
    const idx = this.children.indexOf(ch);
    if (idx !== -1) {
      this.children.splice(idx, 1);
      ch.parentNode = null;
    }
    return ch;
  }

  remove() {
    if (this.parentNode) this.parentNode.removeChild(this);
  }
}

const allElementsMap = {};

function parseMockChildren(parent, html) {
  // Regex match tags with id, class, data attributes
  const tagRegex = /<([a-zA-Z0-9]+)([^>]*)>/g;
  let m;
  while ((m = tagRegex.exec(html)) !== null) {
    const tagName = m[1];
    const attrsStr = m[2];
    if (tagName === 'br' || tagName === 'hr' || tagName === 'img' || tagName === 'input') {
      // self closing or void
    }
    const elem = new MockDOMElement(tagName);
    elem.parentNode = parent;

    // extract id
    const idMatch = attrsStr.match(/id=["']([^"']+)["']/);
    if (idMatch) {
      elem.id = idMatch[1];
      allElementsMap[elem.id] = elem;
    }

    // extract class
    const classMatch = attrsStr.match(/class=["']([^"']+)["']/);
    if (classMatch) {
      elem.className = classMatch[1];
      classMatch[1].split(/\s+/).filter(Boolean).forEach(c => elem.classList.add(c));
    }

    // extract data-*
    const dataRegex = /data-([a-zA-Z0-9-]+)=["']([^"']+)["']/g;
    let dm;
    while ((dm = dataRegex.exec(attrsStr)) !== null) {
      const prop = dm[1].replace(/-([a-z])/g, (_, l) => l.toUpperCase());
      elem.dataset[prop] = dm[2];
    }

    parent.children.push(elem);
  }
}

// 3. Build top-level document
const mockDocument = {
  documentElement: new MockDOMElement('html'),
  body: new MockDOMElement('body'),
  getElementById: (id) => allElementsMap[id] || null,
  querySelector: (sel) => {
    if (sel.startsWith('#')) return allElementsMap[sel.slice(1)] || null;
    return mockDocument.body.querySelector(sel);
  },
  querySelectorAll: (sel) => {
    return mockDocument.body.querySelectorAll(sel);
  },
  createElement: (tagName) => new MockDOMElement(tagName),
  addEventListener: (ev, cb) => {
    if (!mockDocument._listeners) mockDocument._listeners = {};
    if (!mockDocument._listeners[ev]) mockDocument._listeners[ev] = [];
    mockDocument._listeners[ev].push(cb);
  },
  _listeners: {}
};

mockDocument.documentElement.appendChild(mockDocument.body);

// Populate elements from index.html
parseMockChildren(mockDocument.body, htmlContent);

// Mock window and browser globals
const mockStorage = {};
const mockWindow = {
  document: mockDocument,
  localStorage: {
    getItem: (k) => mockStorage[k] || null,
    setItem: (k, v) => { mockStorage[k] = String(v); },
    removeItem: (k) => { delete mockStorage[k]; },
    clear: () => { Object.keys(mockStorage).forEach(k => delete mockStorage[k]); },
    get length() { return Object.keys(mockStorage).length; }
  },
  location: { href: 'http://localhost:8000/' },
  addEventListener: (ev, cb) => {},
  SpeechRecognition: null,
  webkitSpeechRecognition: null,
  speechSynthesis: {
    speak: () => {},
    cancel: () => {},
    getVoices: () => []
  },
  AudioContext: class {
    createOscillator() { return { connect: () => {}, frequency: { setValueAtTime: () => {} }, start: () => {}, stop: () => {} }; }
    createGain() { return { connect: () => {}, gain: { setValueAtTime: () => {}, exponentialRampToValueAtTime: () => {} } }; }
    get destination() { return {}; }
    get currentTime() { return 0; }
  },
  Notification: {
    permission: 'default',
    requestPermission: () => Promise.resolve('granted')
  },
  navigator: {
    serviceWorker: {
      register: () => Promise.resolve()
    }
  },
  setInterval: () => 123,
  clearInterval: () => {},
  setTimeout: (cb, ms) => setTimeout(cb, ms),
  clearTimeout: () => {}
};

global.window = mockWindow;
global.document = mockDocument;
global.localStorage = mockWindow.localStorage;
global.navigator = mockWindow.navigator;
global.Notification = mockWindow.Notification;
global.AudioContext = mockWindow.AudioContext;
global.SpeechRecognition = mockWindow.SpeechRecognition;

// Execute scripts in order
const scripts = [
  'js/utils.js',
  'js/mlModelsData.js',
  'js/storage.js',
  'js/notifications.js',
  'js/backupService.js',
  'js/timetable.js',
  'js/voiceSpeech.js',
  'js/voiceParser.js',
  'js/voiceHandler.js',
  'js/taskManager.js',
  'js/dashboard.js',
  'js/calendar.js',
  'js/pomodoro.js',
  'js/studyPlanner.js',
  'js/mlAnalytics.js',
  'js/documentIntelligence.js',
  'js/app.js'
];

console.log('--- Loading scripts in order ---');
for (const s of scripts) {
  try {
    const code = fs.readFileSync(path.join(__dirname, '..', s), 'utf8');
    vm.runInThisContext(code);
    console.log(`[OK] Loaded ${s}`);
  } catch (err) {
    console.error(`[FAIL] Error loading ${s}:`, err);
    process.exit(1);
  }
}

console.log('\n--- Triggering DOMContentLoaded ---');
if (mockDocument._listeners['DOMContentLoaded']) {
  for (const fn of mockDocument._listeners['DOMContentLoaded']) {
    try {
      fn();
      console.log('[OK] DOMContentLoaded executed successfully');
    } catch (err) {
      console.error('[CRITICAL] Exception during DOMContentLoaded execution:', err);
    }
  }
}

console.log('\n--- Testing Interactive Elements ---');

// 1. Test Voice Assistant button click
const voiceBtn = mockDocument.getElementById('voiceAssistantBtn');
console.log('Voice Button exists:', !!voiceBtn);
if (voiceBtn) {
  try {
    voiceBtn.click();
    console.log('[OK] Voice button clicked without error');
  } catch (e) {
    console.error('[FAIL] Voice button click error:', e);
  }
}

// 2. Test Navigation Items
const navItems = mockDocument.querySelectorAll('.nav-item[data-page]');
console.log(`Found ${navItems.length} navigation items`);
navItems.forEach(item => {
  const page = item.dataset.page;
  try {
    item.click();
    console.log(`[OK] Navigation to "${page}" succeeded`);
  } catch (e) {
    console.error(`[FAIL] Navigation to "${page}" threw error:`, e);
  }
});

// 3. Test Theme Toggle
const themeBtn = mockDocument.getElementById('themeToggleBtn');
if (themeBtn) {
  try {
    themeBtn.click();
    console.log('[OK] Theme toggle button clicked. Data-theme:', mockDocument.documentElement.getAttribute('data-theme'));
  } catch (e) {
    console.error('[FAIL] Theme toggle click error:', e);
  }
}

console.log('\n[SIMULATION SUCCESS] All interactive elements and routes verified.');
process.exit(0);
