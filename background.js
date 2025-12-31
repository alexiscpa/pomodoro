// FocusFlow Pomodoro - Background Service Worker

const TIMER_ALARM = 'pomodoroTimer';
const SECOND_ALARM = 'secondTick';

// Default settings
const DEFAULT_SETTINGS = {
  workDuration: 25,
  shortBreakDuration: 5,
  longBreakDuration: 15,
  autoStartBreaks: false,
  autoStartWork: false,
  strictMode: false,
  notificationSound: true
};

// Timer state
let timerState = {
  isRunning: false,
  isPaused: false,
  sessionType: 'work', // 'work', 'shortBreak', 'longBreak'
  timeRemaining: 25 * 60, // in seconds
  totalTime: 25 * 60,
  workSessionsCompleted: 0,
  currentTask: '',
  currentTag: 'Work'
};

// Initialize on install
chrome.runtime.onInstalled.addListener(async () => {
  await chrome.storage.local.set({
    settings: DEFAULT_SETTINGS,
    timerState: timerState,
    history: [],
    todos: [],
    sprouts: {}
  });
  updateBadge();
});

// Load state on startup
chrome.runtime.onStartup.addListener(async () => {
  const data = await chrome.storage.local.get(['timerState', 'settings']);
  if (data.timerState) {
    timerState = data.timerState;
    // If timer was running, pause it
    if (timerState.isRunning) {
      timerState.isPaused = true;
      timerState.isRunning = false;
      await saveTimerState();
    }
  }
  updateBadge();
});

// Message handler
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  (async () => {
    try {
      switch (request.action) {
        case 'getState':
          sendResponse({ state: timerState });
          break;

        case 'start':
          await startTimer();
          sendResponse({ success: true, state: timerState });
          break;

        case 'pause':
          await pauseTimer();
          sendResponse({ success: true, state: timerState });
          break;

        case 'reset':
          await resetTimer(request.strictMode);
          sendResponse({ success: true, state: timerState });
          break;

        case 'skip':
          await skipSession();
          sendResponse({ success: true, state: timerState });
          break;

        case 'setTask':
          timerState.currentTask = request.task;
          timerState.currentTag = request.tag || 'Work';
          await saveTimerState();
          sendResponse({ success: true });
          break;

        case 'playSound':
          await playNotificationSound();
          sendResponse({ success: true });
          break;

        default:
          sendResponse({ error: 'Unknown action' });
      }
    } catch (error) {
      console.error('Error handling message:', error);
      sendResponse({ error: error.message });
    }
  })();
  return true; // Keep message channel open for async response
});

// Start timer
async function startTimer() {
  if (timerState.isRunning) return;

  timerState.isRunning = true;
  timerState.isPaused = false;

  // Create alarm for each second
  await chrome.alarms.create(SECOND_ALARM, { periodInMinutes: 1/60 });

  await saveTimerState();
  updateBadge();
}

// Pause timer
async function pauseTimer() {
  timerState.isRunning = false;
  timerState.isPaused = true;

  await chrome.alarms.clear(SECOND_ALARM);
  await saveTimerState();
  updateBadge();
}

// Reset timer
async function resetTimer(strictMode) {
  const wasRunning = timerState.isRunning;

  await chrome.alarms.clear(SECOND_ALARM);

  timerState.isRunning = false;
  timerState.isPaused = false;

  // In strict mode, reset progress if timer was running
  if (strictMode && wasRunning && timerState.sessionType === 'work') {
    // Don't count this session
    console.log('Strict mode: Session not counted');
  }

  // Reset to current session type's duration
  const settings = await getSettings();
  timerState.timeRemaining = getSessionDuration(timerState.sessionType, settings);
  timerState.totalTime = timerState.timeRemaining;

  await saveTimerState();
  updateBadge();
}

// Skip to next session
async function skipSession() {
  await completeSession(true); // Skip without counting
}

// Handle alarm tick
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === SECOND_ALARM && timerState.isRunning) {
    timerState.timeRemaining--;

    if (timerState.timeRemaining <= 0) {
      await completeSession(false);
    } else {
      await saveTimerState();
      updateBadge();

      // Notify popup every second
      notifyPopup();
    }
  }
});

// Complete session
async function completeSession(skipped = false) {
  await chrome.alarms.clear(SECOND_ALARM);

  const settings = await getSettings();
  const completedType = timerState.sessionType;

  // Record session if not skipped
  if (!skipped) {
    await recordSession(completedType);

    // Add sprout if work session
    if (completedType === 'work') {
      timerState.workSessionsCompleted++;
      await addSprout();
    }

    // Show notification
    await showNotification(completedType);

    // Play sound
    if (settings.notificationSound) {
      await playNotificationSound();
    }
  }

  // Determine next session
  let nextSession;
  if (completedType === 'work') {
    // After 4 work sessions, long break
    if (timerState.workSessionsCompleted % 4 === 0) {
      nextSession = 'longBreak';
    } else {
      nextSession = 'shortBreak';
    }
  } else {
    nextSession = 'work';
  }

  // Update state for next session
  timerState.sessionType = nextSession;
  timerState.timeRemaining = getSessionDuration(nextSession, settings);
  timerState.totalTime = timerState.timeRemaining;
  timerState.isRunning = false;
  timerState.isPaused = false;

  // Auto-start next session
  const shouldAutoStart = (nextSession === 'work' && settings.autoStartWork) ||
                          (nextSession !== 'work' && settings.autoStartBreaks);

  if (shouldAutoStart) {
    await startTimer();
  }

  await saveTimerState();
  updateBadge();
  notifyPopup();
}

// Get session duration
function getSessionDuration(type, settings) {
  switch (type) {
    case 'work':
      return settings.workDuration * 60;
    case 'shortBreak':
      return settings.shortBreakDuration * 60;
    case 'longBreak':
      return settings.longBreakDuration * 60;
    default:
      return 25 * 60;
  }
}

// Record session in history
async function recordSession(type) {
  const data = await chrome.storage.local.get(['history']);
  const history = data.history || [];

  const session = {
    type: type,
    tag: timerState.currentTag,
    task: timerState.currentTask,
    timestamp: Date.now(),
    date: new Date().toISOString().split('T')[0]
  };

  history.push(session);
  await chrome.storage.local.set({ history });
}

// Add sprout for completed work session
async function addSprout() {
  const data = await chrome.storage.local.get(['sprouts']);
  const sprouts = data.sprouts || {};
  const today = new Date().toISOString().split('T')[0];

  if (!sprouts[today]) {
    sprouts[today] = 0;
  }
  sprouts[today]++;

  await chrome.storage.local.set({ sprouts });
}

// Show notification
async function showNotification(type) {
  const title = type === 'work' ? 'Work Session Complete!' : 'Break Complete!';
  const message = type === 'work'
    ? 'Great job! Time for a break.'
    : 'Break is over. Ready to focus?';

  // Create notification without explicit icon - Chrome will use the extension icon from manifest
  try {
    await chrome.notifications.create({
      type: 'basic',
      title: title,
      message: message,
      priority: 2
    });
  } catch (error) {
    console.error('Error creating notification:', error);
  }
}

// Play notification sound using offscreen document
async function playNotificationSound() {
  try {
    // Check if offscreen document exists
    const existingContexts = await chrome.runtime.getContexts({
      contextTypes: ['OFFSCREEN_DOCUMENT']
    });

    if (existingContexts.length === 0) {
      // Create offscreen document
      await chrome.offscreen.createDocument({
        url: 'offscreen.html',
        reasons: ['AUDIO_PLAYBACK'],
        justification: 'Playing notification sound'
      });
    }

    // Send message to play sound
    await chrome.runtime.sendMessage({ action: 'playAudio' });

    // Close offscreen document after a delay
    setTimeout(async () => {
      await chrome.offscreen.closeDocument();
    }, 3000);
  } catch (error) {
    console.error('Error playing sound:', error);
  }
}

// Update badge
function updateBadge() {
  const minutes = Math.ceil(timerState.timeRemaining / 60);
  const badgeText = minutes > 0 ? minutes.toString() : '';

  chrome.action.setBadgeText({ text: badgeText });

  // Set badge color based on session type
  const color = timerState.sessionType === 'work' ? '#EF4444' : '#10B981';
  chrome.action.setBadgeBackgroundColor({ color: color });
}

// Notify popup of state change
function notifyPopup() {
  chrome.runtime.sendMessage({
    action: 'stateUpdate',
    state: timerState
  }).catch(() => {
    // Popup might not be open, ignore error
  });
}

// Save timer state
async function saveTimerState() {
  await chrome.storage.local.set({ timerState });
}

// Get settings
async function getSettings() {
  const data = await chrome.storage.local.get(['settings']);
  return data.settings || DEFAULT_SETTINGS;
}
