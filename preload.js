const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Notification API
  showNotification: (title, body) => ipcRenderer.invoke('show-notification', { title, body }),

  // Platform information
  platform: process.platform,

  // App version
  version: process.env.npm_package_version || '1.0.0',
});

// Enhance web notifications to work better with Electron
window.addEventListener('DOMContentLoaded', () => {
  // The web app can use the standard Notification API
  // Electron will handle it natively on macOS
  console.log('Confer Desktop loaded');
});
