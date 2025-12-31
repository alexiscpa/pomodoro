# FocusFlow Pomodoro - Chrome Extension

A powerful, feature-rich Pomodoro timer Chrome extension built with Manifest V3. Stay focused, track your productivity, and grow your virtual forest!

## Features

### Core Timer Functionality
- **Robust Background Timer**: Uses Chrome Service Worker with persistent alarms
- **Three Session Types**: Work (25m), Short Break (5m), Long Break (15m)
- **Auto-Cycle Logic**: Automatically triggers Long Break after 4 work sessions
- **Automation Options**: Auto-start next sessions and breaks
- **Strict Mode**: Option to reset progress if timer stopped mid-session

### User Interface
- **Modern Dark Theme**: Beautiful, easy-on-the-eyes design with Tailwind CSS
- **Circular Progress Indicator**: Visual timer with color-coded rings (Red for Work, Green for Breaks)
- **Dynamic Badge**: Shows remaining minutes on browser toolbar icon
- **Task Management**: Set current task with tagging (Work, Study, Other)
- **Mini Todo List**: Quick task list integrated into the popup

### Statistics & Analytics
- **Session Tracking**: Complete history of all completed sessions
- **Visual Charts**: Bar chart for daily sessions and pie chart for categories (powered by Chart.js)
- **Productivity Metrics**: Total sessions, focused minutes, and day streaks
- **Tag-based Analytics**: Break down your sessions by Work, Study, or Other

### Gamification
- **Forest Growth**: Earn virtual "sprouts" (🌱) for each completed work session
- **Daily Forest View**: See your forest grow throughout the day
- **Streak Tracking**: Monitor consecutive days of productivity

### Technical Highlights
- **Manifest V3 Compliant**: Uses latest Chrome Extension standards
- **Offscreen Audio**: Proper audio playback implementation for MV3
- **Chrome Storage**: All data persists using `chrome.storage.local`
- **System Notifications**: Native Chrome notifications on session completion

## Installation

### Prerequisites
Before installing, you need to create icon files. See instructions below.

### Step 1: Generate Icons

Navigate to the `icons/` directory and generate placeholder icons:

```bash
cd icons
python generate_icons.py
```

Or create your own 16x16, 48x48, and 128x128 PNG icons and place them in the `icons/` directory.

### Step 2: Load Extension in Chrome

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top-right corner)
3. Click "Load unpacked"
4. Select the `pomodoro` directory (this folder)
5. The FocusFlow Pomodoro extension should now appear in your extensions list

### Step 3: Pin the Extension

1. Click the Extensions icon (puzzle piece) in Chrome toolbar
2. Find "FocusFlow Pomodoro"
3. Click the pin icon to keep it visible in your toolbar

## Usage

### Starting a Pomodoro Session

1. Click the FocusFlow icon in your toolbar
2. (Optional) Enter your current task in the "Current Task" field
3. (Optional) Select a category tag (Work, Study, Other)
4. Click the **Start** button
5. Stay focused until the timer completes!

### Managing Sessions

- **Pause**: Click the Pause button to temporarily stop the timer
- **Reset**: Reset the current session (in Strict Mode, this won't count toward stats)
- **Skip**: Skip to the next session type without waiting

### Using the Todo List

1. Click the **+** button in the Tasks section
2. Enter your task and press Enter or click Add
3. Check off tasks as you complete them
4. Delete tasks by clicking the × button

### Viewing Statistics

1. Click the **Stats** icon (bar chart) in the popup header, or
2. Click the **Settings** button at the bottom of the popup
3. View your productivity metrics, charts, and session history

### Customizing Settings

In the Settings page, you can customize:

- **Timer Durations**: Adjust work, short break, and long break lengths
- **Automation**: Enable auto-start for breaks and work sessions
- **Strict Mode**: Enforce completion to count sessions
- **Notification Sound**: Toggle audio notifications

## File Structure

```
pomodoro/
├── manifest.json              # Extension manifest (MV3)
├── background.js              # Service worker with timer logic
├── popup.html                 # Main popup interface
├── popup.js                   # Popup logic and UI handlers
├── options.html               # Statistics and settings page
├── options.js                 # Options page logic
├── offscreen.html             # Offscreen document for audio
├── offscreen.js               # Audio playback handler
├── styles.css                 # Complete styling (dark theme)
├── icons/                     # Extension icons
│   ├── icon16.png            # 16x16 toolbar icon
│   ├── icon48.png            # 48x48 extension page icon
│   ├── icon128.png           # 128x128 store icon
│   ├── generate_icons.py     # Icon generator script
│   └── README.md             # Icon instructions
└── README.md                 # This file
```

## How It Works

### Background Timer (Service Worker)

The timer runs in a persistent Service Worker that:
- Uses `chrome.alarms` API for precise 1-second intervals
- Maintains state even when popup is closed
- Communicates with popup via message passing
- Updates badge text and color in real-time
- Triggers notifications and audio on completion

### Auto-Cycle Logic

After completing a work session:
- If it's the 4th session → trigger Long Break (15m)
- Otherwise → trigger Short Break (5m)

After completing any break:
- Return to Work session (25m)

### Data Persistence

All data is stored using `chrome.storage.local`:
- `timerState`: Current timer state and progress
- `settings`: User preferences
- `history`: Array of completed sessions
- `todos`: Task list items
- `sprouts`: Daily forest growth counts

### Strict Mode

When enabled, stopping a timer mid-session will:
- NOT count toward your statistics
- Reset the current session
- Prevent "gaming" the system

## Tips for Maximum Productivity

1. **Set Clear Tasks**: Always enter what you're working on before starting
2. **Honor the Timer**: Avoid stopping sessions early (enable Strict Mode!)
3. **Take Breaks**: Use your break time to truly rest and recharge
4. **Review Stats Regularly**: Check your weekly patterns and optimize
5. **Grow Your Forest**: Aim for a full forest each day to stay motivated

## Troubleshooting

### Timer doesn't update
- Ensure the extension has necessary permissions
- Check that Chrome hasn't put the service worker to sleep (rare)
- Try reloading the extension from `chrome://extensions/`

### No sound on completion
- Check that notification sound is enabled in Settings
- Ensure Chrome has permission to play audio
- Try clicking the browser window to activate audio context

### Badge not showing
- The badge only shows when a timer is active
- Make sure the extension is pinned to toolbar
- Try restarting Chrome if issues persist

### Icons not showing
- Make sure you've created icon files in the `icons/` directory
- Run `python icons/generate_icons.py` to generate placeholders
- Or create your own 16x16, 48x48, and 128x128 PNG files

## Development

### Making Changes

After editing any files:
1. Go to `chrome://extensions/`
2. Find FocusFlow Pomodoro
3. Click the refresh icon (↻)
4. Test your changes

### Adding New Features

The codebase is well-structured for extensions:
- **Timer Logic**: Modify `background.js`
- **UI Changes**: Edit `popup.html` and `popup.js`
- **Styling**: Update `styles.css`
- **Stats/Settings**: Modify `options.html` and `options.js`

## Future Enhancements

Potential features to add:
- [ ] Custom session durations
- [ ] Different forest themes (trees, flowers, etc.)
- [ ] Export statistics to CSV
- [ ] Integration with task management apps
- [ ] Background ambient sounds during work
- [ ] Browser website blocking during work sessions
- [ ] Weekly/monthly reports

## Credits

Built with:
- **Chart.js** - Beautiful charts for statistics
- **Chrome Extension APIs** - Manifest V3
- **Modern CSS** - Dark theme design

## License

This project is free to use and modify for personal and educational purposes.

---

**Happy Focusing! 🍅🌱**

*Remember: The key to productivity is consistent, focused work sessions. Use FocusFlow to build better work habits!*
