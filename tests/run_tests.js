/**
 * StudyFlow - Automated Unit Test Suite
 * Tests core business logic, algorithms, ML inference, and voice parser.
 */

// Mock browser globals for Node.js environment
const mockStorage = {};
global.localStorage = {
  getItem: (k) => mockStorage[k] || null,
  setItem: (k, v) => { mockStorage[k] = String(v); },
  removeItem: (k) => { delete mockStorage[k]; },
  clear: () => { Object.keys(mockStorage).forEach(k => delete mockStorage[k]); },
  key: (i) => Object.keys(mockStorage)[i] || null,
  get length() { return Object.keys(mockStorage).length; }
};

global.window = {
  localStorage: global.localStorage
};

// Load modules in sequence
const fs = require('fs');
const path = require('path');
const vm = require('vm');

function loadScript(relPath) {
  const fullPath = path.join(__dirname, '..', relPath);
  const code = fs.readFileSync(fullPath, 'utf8');
  vm.runInThisContext(code);
}

loadScript('js/utils.js');
loadScript('js/mlModelsData.js');
loadScript('js/storage.js');
loadScript('js/notifications.js');
loadScript('js/timetable.js');
loadScript('js/voiceParser.js');
loadScript('js/studyPlanner.js');
loadScript('js/mlAnalytics.js');
loadScript('js/documentIntelligence.js');

let passedTests = 0;
let failedTests = 0;

function assert(condition, testName) {
  if (condition) {
    console.log(`  ✓ PASS: ${testName}`);
    passedTests++;
  } else {
    console.error(`  ✗ FAIL: ${testName}`);
    failedTests++;
  }
}

console.log('=== RUNNING STUDYFLOW AUTOMATED TEST SUITE ===\n');

// -------------------------------------------------------------
// Test Suite 1: Storage & Safe Migration
// -------------------------------------------------------------
console.log('Test Suite 1: Storage & Schema Integrity');
const task1 = Storage.addTask({
  id: 'test_t1',
  title: 'DSA Binary Search Tree',
  subject: 'DSA',
  priority: 'high',
  estimatedDuration: 60,
  dueDate: '2026-11-05'
});
assert(task1 && task1.id === 'test_t1', 'Task creation succeeds');
assert(Array.isArray(task1.subtasks), 'Subtasks array initialized with default empty array');
assert(task1.isRecurring === false, 'isRecurring initialized with default false');

// Subtask addition
task1.subtasks.push({ id: 'st1', title: 'Implement rotateLeft', completed: false });
Storage.updateTask(task1.id, { subtasks: task1.subtasks });
const fetched = Storage.getTasks().find(t => t.id === 'test_t1');
assert(fetched.subtasks.length === 1 && fetched.subtasks[0].title === 'Implement rotateLeft', 'Subtask saved and retrieved');

// JSON Export & Validation
const exportedJson = Storage.exportAllDataJSON();
assert(exportedJson && exportedJson.includes('test_t1'), 'JSON export serializes stored tasks');
const valResult = Storage.validateImportData(exportedJson);
assert(valResult.valid === true && valResult.counts.tasks >= 1, 'JSON validation passes schema checks');

// -------------------------------------------------------------
// Test Suite 2: Machine Learning Inference
// -------------------------------------------------------------
console.log('\nTest Suite 2: Machine Learning Client-Side Inference');
const predProb = MLAnalytics.predictCompletionProbability(task1);
assert(typeof predProb.probability === 'number' && predProb.probability >= 0 && predProb.probability <= 100, `Completion probability calculated: ${predProb.probability}% (${predProb.label})`);

const predDur = MLAnalytics.predictActualDuration(task1);
assert(typeof predDur === 'number' && predDur >= 15, `Actual duration predicted: ${predDur} mins (vs estimated: 60 mins)`);

const risks = MLAnalytics.getSubjectRiskAssessments();
assert(Array.isArray(risks) && risks.length > 0, `Subject risk matrix computed (${risks.length} subjects evaluated)`);

// -------------------------------------------------------------
// Test Suite 3: Bilingual Voice Intent Parser (English + Hinglish)
// -------------------------------------------------------------
console.log('\nTest Suite 3: Bilingual Voice Intent Parser');

// Navigation
const vNavEn = VoiceParser.parse('open dashboard');
assert(vNavEn.intent === 'NAVIGATE' && vNavEn.page === 'dashboard', 'Parses "open dashboard"');

const vNavHi = VoiceParser.parse('tasks kholo');
assert(vNavHi.intent === 'NAVIGATE' && vNavHi.page === 'tasks', 'Parses Hinglish "tasks kholo"');

const vNavPlan = VoiceParser.parse('schedule dikhao');
assert(vNavPlan.intent === 'NAVIGATE' && vNavPlan.page === 'planner', 'Parses Hinglish "schedule dikhao"');

// Pomodoro
const vPomoStart = VoiceParser.parse('pomodoro start karo');
assert(vPomoStart.intent === 'POMODORO_START', 'Parses Hinglish "pomodoro start karo"');

const vPomoTime = VoiceParser.parse('how much time left');
assert(vPomoTime.intent === 'POMODORO_QUERY_REMAINING', 'Parses "how much time left"');

// Task Creation with "kal" disambiguation
const vCreateHi = VoiceParser.parse('kal ke liye DBMS assignment add karo duration 90 minutes');
assert(vCreateHi.intent === 'CREATE_TASK', 'Parses task creation intent');
assert(vCreateHi.taskData.subject === 'DBMS', 'Extracts subject "DBMS"');
assert(vCreateHi.taskData.estimatedDuration === 90, 'Extracts duration "90 minutes"');
assert(vCreateHi.taskData.dueDate === Utils.getTomorrowStr(), 'Correctly resolves "kal" to tomorrow\'s date');

// Academic queries
const vQuerySum = VoiceParser.parse('aaj ka summary batao');
assert(vQuerySum.intent === 'QUERY_SUMMARY', 'Parses Hinglish "aaj ka summary batao"');

const vQueryWeak = VoiceParser.parse('kaunsa subject weak hai');
assert(vQueryWeak.intent === 'QUERY_WEAK_SUBJECT', 'Parses Hinglish "kaunsa subject weak hai"');

// -------------------------------------------------------------
// Test Suite 4: Timetable & Collision Avoidance
// -------------------------------------------------------------
console.log('\nTest Suite 4: Timetable & Collision Detection');
const busyMon = Timetable.getBusyIntervals('2026-11-02'); // A Monday
assert(Array.isArray(busyMon) && busyMon.length > 0, `Detected ${busyMon.length} class commitments on Monday`);
assert(busyMon[0].startHour === 9.0 && busyMon[0].endHour === 10.5, 'Accurately converts 09:00 - 10:30 to decimal hours (9.0 - 10.5)');

// -------------------------------------------------------------
// Test Suite 5: Document Intelligence & BM25 Search
// -------------------------------------------------------------
console.log('\nTest Suite 5: Document Intelligence & Search');
Storage.addDocument({
  id: 'doc_test_1',
  name: 'Operating Systems Virtual Memory',
  chunks: [
    { id: 'c1', text: 'Virtual memory allows the execution of processes that may not be completely in memory.', docName: 'OS' },
    { id: 'c2', text: 'Demand paging brings a logical page into physical memory only when a reference is made.', docName: 'OS' }
  ]
});
const searchRes = DocumentIntelligence.searchIndexedDocuments('virtual memory processes');
assert(searchRes.length > 0 && searchRes[0].id === 'c1', 'BM25 keyword search retrieves exact matching chunk');

console.log(`\n=== TEST RESULTS: ${passedTests} PASSED, ${failedTests} FAILED ===`);
if (failedTests > 0) process.exit(1);
