// FocusFlow Pomodoro - Options/Statistics Page

let sessionsChart = null;
let categoryChart = null;

// Initialize page
document.addEventListener('DOMContentLoaded', async () => {
  await loadSettings();
  await loadStatistics();
  setupEventListeners();
});

// Setup event listeners
function setupEventListeners() {
  document.getElementById('backBtn').addEventListener('click', () => {
    window.close();
  });

  document.getElementById('saveSettingsBtn').addEventListener('click', saveSettings);
  document.getElementById('resetSettingsBtn').addEventListener('click', resetSettings);
  document.getElementById('clearHistoryBtn').addEventListener('click', clearHistory);
}

// Load settings from storage
async function loadSettings() {
  const data = await chrome.storage.local.get(['settings']);
  const settings = data.settings || {
    workDuration: 25,
    shortBreakDuration: 5,
    longBreakDuration: 15,
    autoStartBreaks: false,
    autoStartWork: false,
    strictMode: false,
    notificationSound: true
  };

  // Populate form fields
  document.getElementById('workDuration').value = settings.workDuration;
  document.getElementById('shortBreakDuration').value = settings.shortBreakDuration;
  document.getElementById('longBreakDuration').value = settings.longBreakDuration;
  document.getElementById('autoStartBreaks').checked = settings.autoStartBreaks;
  document.getElementById('autoStartWork').checked = settings.autoStartWork;
  document.getElementById('strictMode').checked = settings.strictMode;
  document.getElementById('notificationSound').checked = settings.notificationSound;
}

// Save settings
async function saveSettings() {
  const settings = {
    workDuration: parseInt(document.getElementById('workDuration').value),
    shortBreakDuration: parseInt(document.getElementById('shortBreakDuration').value),
    longBreakDuration: parseInt(document.getElementById('longBreakDuration').value),
    autoStartBreaks: document.getElementById('autoStartBreaks').checked,
    autoStartWork: document.getElementById('autoStartWork').checked,
    strictMode: document.getElementById('strictMode').checked,
    notificationSound: document.getElementById('notificationSound').checked
  };

  await chrome.storage.local.set({ settings });

  // Show save message
  const saveMessage = document.getElementById('saveMessage');
  saveMessage.style.display = 'block';
  setTimeout(() => {
    saveMessage.style.display = 'none';
  }, 3000);
}

// Reset settings to defaults
async function resetSettings() {
  if (!confirm('Are you sure you want to reset all settings to defaults?')) {
    return;
  }

  const defaultSettings = {
    workDuration: 25,
    shortBreakDuration: 5,
    longBreakDuration: 15,
    autoStartBreaks: false,
    autoStartWork: false,
    strictMode: false,
    notificationSound: true
  };

  await chrome.storage.local.set({ settings: defaultSettings });
  await loadSettings();

  const saveMessage = document.getElementById('saveMessage');
  saveMessage.textContent = 'Settings reset to defaults!';
  saveMessage.style.display = 'block';
  setTimeout(() => {
    saveMessage.style.display = 'none';
    saveMessage.textContent = 'Settings saved successfully!';
  }, 3000);
}

// Load and display statistics
async function loadStatistics() {
  const data = await chrome.storage.local.get(['history', 'sprouts']);
  const history = data.history || [];
  const sprouts = data.sprouts || {};

  // Calculate summary statistics
  const totalSessions = history.filter(s => s.type === 'work').length;
  const totalMinutes = totalSessions * 25; // Approximate, assuming 25-min sessions

  // Calculate streak
  const streak = calculateStreak(history);

  // Calculate total sprouts
  const totalSprouts = Object.values(sprouts).reduce((sum, count) => sum + count, 0);

  // Update summary cards
  document.getElementById('totalSessions').textContent = totalSessions;
  document.getElementById('totalMinutes').textContent = totalMinutes;
  document.getElementById('currentStreak').textContent = streak;
  document.getElementById('totalSprouts').textContent = totalSprouts;

  // Render charts
  renderSessionsChart(history);
  renderCategoryChart(history);

  // Render session history
  renderHistory(history);
}

// Calculate streak of consecutive days
function calculateStreak(history) {
  if (history.length === 0) return 0;

  const workSessions = history.filter(s => s.type === 'work');
  if (workSessions.length === 0) return 0;

  const dates = [...new Set(workSessions.map(s => s.date))].sort().reverse();

  let streak = 0;
  let currentDate = new Date();
  currentDate.setHours(0, 0, 0, 0);

  for (const dateStr of dates) {
    const sessionDate = new Date(dateStr);
    sessionDate.setHours(0, 0, 0, 0);

    const diffDays = Math.floor((currentDate - sessionDate) / (1000 * 60 * 60 * 24));

    if (diffDays === streak) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
}

// Render sessions per day chart
function renderSessionsChart(history) {
  const ctx = document.getElementById('sessionsChart');

  // Get last 7 days
  const last7Days = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    last7Days.push(date.toISOString().split('T')[0]);
  }

  // Count sessions per day
  const sessionCounts = last7Days.map(date => {
    return history.filter(s => s.date === date && s.type === 'work').length;
  });

  // Format labels (e.g., "Mon", "Tue")
  const labels = last7Days.map(date => {
    const d = new Date(date);
    return d.toLocaleDateString('en-US', { weekday: 'short' });
  });

  // Destroy existing chart if it exists
  if (sessionsChart) {
    sessionsChart.destroy();
  }

  sessionsChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: 'Sessions',
        data: sessionCounts,
        backgroundColor: '#EF4444',
        borderColor: '#DC2626',
        borderWidth: 1,
        borderRadius: 6
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          display: false
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            stepSize: 1,
            color: '#9CA3AF'
          },
          grid: {
            color: '#374151'
          }
        },
        x: {
          ticks: {
            color: '#9CA3AF'
          },
          grid: {
            display: false
          }
        }
      }
    }
  });
}

// Render category chart (pie chart)
function renderCategoryChart(history) {
  const ctx = document.getElementById('categoryChart');

  // Count sessions by tag
  const tagCounts = {};
  history.filter(s => s.type === 'work').forEach(session => {
    const tag = session.tag || 'Work';
    tagCounts[tag] = (tagCounts[tag] || 0) + 1;
  });

  const labels = Object.keys(tagCounts);
  const data = Object.values(tagCounts);

  const colors = {
    'Work': '#EF4444',
    'Study': '#3B82F6',
    'Other': '#10B981'
  };

  const backgroundColors = labels.map(label => colors[label] || '#6B7280');

  // Destroy existing chart if it exists
  if (categoryChart) {
    categoryChart.destroy();
  }

  categoryChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: labels,
      datasets: [{
        data: data,
        backgroundColor: backgroundColors,
        borderColor: '#1F2937',
        borderWidth: 2
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            color: '#9CA3AF',
            padding: 15,
            font: {
              size: 12
            }
          }
        }
      }
    }
  });
}

// Render session history list
function renderHistory(history) {
  const historyList = document.getElementById('historyList');
  historyList.innerHTML = '';

  if (history.length === 0) {
    historyList.innerHTML = '<div class="empty-state">No sessions yet. Start your first Pomodoro!</div>';
    return;
  }

  // Show last 20 sessions
  const recentHistory = history.slice(-20).reverse();

  recentHistory.forEach(session => {
    const item = createHistoryItem(session);
    historyList.appendChild(item);
  });
}

// Create history item element
function createHistoryItem(session) {
  const div = document.createElement('div');
  div.className = 'history-item';

  const icon = document.createElement('div');
  icon.className = 'history-icon';
  icon.textContent = session.type === 'work' ? '🎯' : '☕';

  const details = document.createElement('div');
  details.className = 'history-details';

  const task = document.createElement('div');
  task.className = 'history-task';
  task.textContent = session.task || 'Untitled session';

  const meta = document.createElement('div');
  meta.className = 'history-meta';

  const tag = document.createElement('span');
  tag.className = 'history-tag';
  tag.textContent = session.tag || 'Work';
  tag.style.backgroundColor = getTagColor(session.tag);

  const time = document.createElement('span');
  time.className = 'history-time';
  time.textContent = formatTimestamp(session.timestamp);

  meta.appendChild(tag);
  meta.appendChild(time);

  details.appendChild(task);
  details.appendChild(meta);

  div.appendChild(icon);
  div.appendChild(details);

  return div;
}

// Get color for tag
function getTagColor(tag) {
  const colors = {
    'Work': '#DC2626',
    'Study': '#2563EB',
    'Other': '#059669'
  };
  return colors[tag] || '#4B5563';
}

// Format timestamp
function formatTimestamp(timestamp) {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 60) {
    return `${diffMins}m ago`;
  } else if (diffHours < 24) {
    return `${diffHours}h ago`;
  } else if (diffDays < 7) {
    return `${diffDays}d ago`;
  } else {
    return date.toLocaleDateString();
  }
}

// Clear history
async function clearHistory() {
  if (!confirm('Are you sure you want to clear all session history? This cannot be undone.')) {
    return;
  }

  await chrome.storage.local.set({
    history: [],
    sprouts: {}
  });

  // Reset timer state
  const data = await chrome.storage.local.get(['timerState']);
  if (data.timerState) {
    data.timerState.workSessionsCompleted = 0;
    await chrome.storage.local.set({ timerState: data.timerState });
  }

  await loadStatistics();

  alert('History cleared successfully!');
}
