// Offscreen document for audio playback

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'playAudio') {
    const audio = document.getElementById('notificationSound');
    audio.play()
      .then(() => {
        sendResponse({ success: true });
      })
      .catch((error) => {
        console.error('Error playing audio:', error);
        sendResponse({ success: false, error: error.message });
      });
    return true; // Keep message channel open for async response
  }
});
