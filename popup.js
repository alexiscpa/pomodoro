// FocusFlow Pomodoro - Popup Script

let currentState = null;
let strictMode = false;

// Initialize popup
document.addEventListener('DOMContentLoaded', async () => {
  await loadState();
  await loadSettings();
  await loadTodos();
  await loadSprouts();
  setupEventListeners();
  startStatePolling();
});

// Setup event listeners
function setupEventListeners() {
  // Timer controls
  document.getElementById('startBtn').addEventListener('click', startTimer);
  document.getElementById('pauseBtn').addEventListener('click', pauseTimer);
  document.getElementById('resetBtn').addEventListener('click', resetTimer);
  document.getElementById('skipBtn').addEventListener('click', skipSession);

  // Task input
  const taskInput = document.getElementById('currentTask');
  const tagInputs = document.querySelectorAll('input[name="tag"]');

  taskInput.addEventListener('change', updateTask);
  tagInputs.forEach(input => {
    input.addEventListener('change', updateTask);
  });

  // Todo list
  document.getElementById('addTodoBtn').addEventListener('click', showTodoInput);
  document.getElementById('saveTodoBtn').addEventListener('click', saveTodo);
  document.getElementById('todoInput').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') saveTodo();
  });

  // Navigation
  document.getElementById('statsBtn').addEventListener('click', () => {
    chrome.runtime.openOptionsPage();
  });

  document.getElementById('settingsBtn').addEventListener('click', () => {
    chrome.runtime.openOptionsPage();
  });

  // Strict mode toggle
  document.getElementById('strictModeToggle').addEventListener('change', (e) => {
    strictMode = e.target.checked;
  });
}

// Load current state from background
async function loadState() {
  const response = await chrome.runtime.sendMessage({ action: 'getState' });
  if (response && response.state) {
    currentState = response.state;
    updateUI();
  }
}

// Load settings
async function loadSettings() {
  const data = await chrome.storage.local.get(['settings']);
  const settings = data.settings || {};

  // Update UI based on settings
  if (settings.strictMode) {
    document.getElementById('strictModeToggle').checked = true;
    strictMode = true;
  }
}

// Update UI based on state
function updateUI() {
  if (!currentState) return;

  // Update timer text
  const minutes = Math.floor(currentState.timeRemaining / 60);
  const seconds = currentState.timeRemaining % 60;
  const timerText = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  document.getElementById('timerText').textContent = timerText;

  // Update session type
  let sessionTypeName;
  switch (currentState.sessionType) {
    case 'work':
      sessionTypeName = 'Work Session';
      break;
    case 'shortBreak':
      sessionTypeName = 'Short Break';
      break;
    case 'longBreak':
      sessionTypeName = 'Long Break';
      break;
  }
  document.getElementById('sessionType').textContent = sessionTypeName;

  // Update session count
  const sessionNumber = (currentState.workSessionsCompleted % 4) + 1;
  document.getElementById('sessionCount').textContent = `Session ${sessionNumber}/4`;

  // Update timer status
  let statusText = 'Ready to focus';
  if (currentState.isRunning) {
    statusText = currentState.sessionType === 'work' ? 'Stay focused!' : 'Take a break';
  } else if (currentState.isPaused) {
    statusText = 'Paused';
  }
  document.getElementById('timerStatus').textContent = statusText;

  // Update controls
  const startBtn = document.getElementById('startBtn');
  const pauseBtn = document.getElementById('pauseBtn');

  if (currentState.isRunning) {
    startBtn.style.display = 'none';
    pauseBtn.style.display = 'flex';
  } else {
    startBtn.style.display = 'flex';
    pauseBtn.style.display = 'none';
  }

  // Update progress ring
  updateProgressRing();

  // Update current task
  if (currentState.currentTask) {
    document.getElementById('currentTask').value = currentState.currentTask;
  }

  // Update tag selection
  if (currentState.currentTag) {
    const tagInput = document.querySelector(`input[name="tag"][value="${currentState.currentTag}"]`);
    if (tagInput) tagInput.checked = true;
  }
}

// Update circular progress ring
function updateProgressRing() {
  const progressCircle = document.getElementById('timerRingProgress');
  const radius = 90;
  const circumference = 2 * Math.PI * radius;

  const progress = currentState.timeRemaining / currentState.totalTime;
  const offset = circumference * (1 - progress);

  progressCircle.style.strokeDasharray = `${circumference} ${circumference}`;
  progressCircle.style.strokeDashoffset = offset;

  // Change color based on session type
  const color = currentState.sessionType === 'work' ? '#EF4444' : '#10B981';
  progressCircle.style.stroke = color;
}

// Timer control functions
async function startTimer() {
  await chrome.runtime.sendMessage({ action: 'start' });
  await loadState();
}

async function pauseTimer() {
  await chrome.runtime.sendMessage({ action: 'pause' });
  await loadState();
}

async function resetTimer() {
  await chrome.runtime.sendMessage({ action: 'reset', strictMode: strictMode });
  await loadState();
}

async function skipSession() {
  await chrome.runtime.sendMessage({ action: 'skip' });
  await loadState();
}

// Update current task
async function updateTask() {
  const task = document.getElementById('currentTask').value;
  const tag = document.querySelector('input[name="tag"]:checked').value;

  await chrome.runtime.sendMessage({
    action: 'setTask',
    task: task,
    tag: tag
  });
}

// Todo list functions
async function loadTodos() {
  const data = await chrome.storage.local.get(['todos']);
  const todos = data.todos || [];

  const todoList = document.getElementById('todoList');
  todoList.innerHTML = '';

  if (todos.length === 0) {
    todoList.innerHTML = '<div class="empty-state">No tasks yet</div>';
    return;
  }

  todos.forEach((todo, index) => {
    const todoItem = createTodoElement(todo, index);
    todoList.appendChild(todoItem);
  });
}

function createTodoElement(todo, index) {
  const div = document.createElement('div');
  div.className = 'todo-item';

  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.checked = todo.completed || false;
  checkbox.addEventListener('change', () => toggleTodo(index));

  const text = document.createElement('span');
  text.className = 'todo-text';
  text.textContent = todo.text;
  if (todo.completed) {
    text.style.textDecoration = 'line-through';
    text.style.opacity = '0.5';
  }

  const deleteBtn = document.createElement('button');
  deleteBtn.className = 'todo-delete';
  deleteBtn.innerHTML = '×';
  deleteBtn.addEventListener('click', () => deleteTodo(index));

  div.appendChild(checkbox);
  div.appendChild(text);
  div.appendChild(deleteBtn);

  return div;
}

function showTodoInput() {
  const container = document.querySelector('.todo-input-container');
  container.style.display = 'flex';
  document.getElementById('todoInput').focus();
}

async function saveTodo() {
  const input = document.getElementById('todoInput');
  const text = input.value.trim();

  if (!text) return;

  const data = await chrome.storage.local.get(['todos']);
  const todos = data.todos || [];

  todos.push({ text, completed: false });
  await chrome.storage.local.set({ todos });

  input.value = '';
  document.querySelector('.todo-input-container').style.display = 'none';

  await loadTodos();
}

async function toggleTodo(index) {
  const data = await chrome.storage.local.get(['todos']);
  const todos = data.todos || [];

  if (todos[index]) {
    todos[index].completed = !todos[index].completed;
    await chrome.storage.local.set({ todos });
    await loadTodos();
  }
}

async function deleteTodo(index) {
  const data = await chrome.storage.local.get(['todos']);
  const todos = data.todos || [];

  todos.splice(index, 1);
  await chrome.storage.local.set({ todos });
  await loadTodos();
}

// Load sprouts (forest visualization)
async function loadSprouts() {
  const data = await chrome.storage.local.get(['sprouts']);
  const sprouts = data.sprouts || {};
  const today = new Date().toISOString().split('T')[0];
  const todaySprouts = sprouts[today] || 0;

  document.getElementById('sproutCount').textContent = `${todaySprouts} sprout${todaySprouts !== 1 ? 's' : ''}`;

  const forestGrid = document.getElementById('forestGrid');
  forestGrid.innerHTML = '';

  if (todaySprouts === 0) {
    forestGrid.innerHTML = '<div class="empty-state">Complete work sessions to grow your forest!</div>';
    return;
  }

  for (let i = 0; i < todaySprouts; i++) {
    const sprout = document.createElement('div');
    sprout.className = 'sprout';
    sprout.innerHTML = '🌱';
    sprout.style.animationDelay = `${i * 0.1}s`;
    forestGrid.appendChild(sprout);
  }
}

// Poll for state updates
function startStatePolling() {
  setInterval(async () => {
    await loadState();
  }, 1000);
}

// Listen for state updates from background
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'stateUpdate') {
    currentState = request.state;
    updateUI();
  }
});
