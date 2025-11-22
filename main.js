const { app, BrowserWindow, Menu, Tray, shell, ipcMain, nativeImage } = require('electron');
const path = require('path');
const { autoUpdater } = require('electron-updater');

// Keep a global reference to prevent garbage collection
let mainWindow = null;
let tray = null;
let isQuitting = false;

const CONFER_URL = 'https://groundstatesystems.work';
const APP_PROTOCOL = 'confer';

// Single instance lock
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', (event, commandLine, workingDirectory) => {
    // Someone tried to run a second instance, focus our window instead
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();

      // Handle deep link on second instance (Windows/Linux)
      const url = commandLine.find(arg => arg.startsWith(`${APP_PROTOCOL}://`));
      if (url) {
        handleDeepLink(url);
      }
    }
  });

  // Create main window when ready
  app.whenReady().then(() => {
    // Set up protocol handler for deep linking
    if (process.defaultApp) {
      if (process.argv.length >= 2) {
        app.setAsDefaultProtocolClient(APP_PROTOCOL, process.execPath, [path.resolve(process.argv[1])]);
      }
    } else {
      app.setAsDefaultProtocolClient(APP_PROTOCOL);
    }

    createWindow();
    createTray();
    createMenu();

    // Check for updates (silently in background)
    if (!process.argv.includes('--dev')) {
      autoUpdater.checkForUpdatesAndNotify();
    }
  });
}

// macOS: Handle deep links when app is already running
app.on('open-url', (event, url) => {
  event.preventDefault();
  handleDeepLink(url);
});

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    title: 'Confer',
    icon: path.join(__dirname, 'assets/icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: true,
    },
    backgroundColor: '#ffffff',
    show: false, // Don't show until ready
  });

  // Load the Confer web app
  mainWindow.loadURL(CONFER_URL);

  // Show window when ready to avoid flash
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Handle external links - open in default browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http') && !url.includes('groundstatesystems.work')) {
      shell.openExternal(url);
      return { action: 'deny' };
    }
    return { action: 'allow' };
  });

  // Prevent window close, minimize to tray instead
  mainWindow.on('close', (event) => {
    if (!isQuitting) {
      event.preventDefault();
      mainWindow.hide();

      // macOS: Keep app in dock but hide window
      if (process.platform === 'darwin') {
        app.dock.hide();
      }
    }
  });

  // Update badge count (macOS dock)
  mainWindow.webContents.on('page-title-updated', (event, title) => {
    // Extract unread count from title if format is like "Confer (5)"
    const match = title.match(/\((\d+)\)/);
    if (match && process.platform === 'darwin') {
      const count = parseInt(match[1]);
      app.dock.setBadge(count > 0 ? count.toString() : '');
    }
  });

  // Handle navigation
  mainWindow.webContents.on('will-navigate', (event, url) => {
    // Allow navigation within the Confer domain
    if (!url.includes('groundstatesystems.work')) {
      event.preventDefault();
      shell.openExternal(url);
    }
  });

  // Development tools
  if (process.argv.includes('--dev')) {
    mainWindow.webContents.openDevTools();
  }

  return mainWindow;
}

function createTray() {
  // Create tray icon using template image for dark mode support
  const iconPath = path.join(__dirname, 'assets/iconTemplate.png');

  const icon = nativeImage.createFromPath(iconPath);
  icon.setTemplateImage(true); // Enable automatic dark/light mode adaptation

  tray = new Tray(icon);
  tray.setToolTip('Confer');

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Show Confer',
      click: () => {
        mainWindow.show();
        if (process.platform === 'darwin') {
          app.dock.show();
        }
      }
    },
    {
      label: 'New Conversation',
      click: () => {
        mainWindow.show();
        if (process.platform === 'darwin') {
          app.dock.show();
        }
        // You could navigate to new conversation page here
        mainWindow.webContents.executeJavaScript('window.location.href = "/conversations/create"').catch(() => {});
      }
    },
    { type: 'separator' },
    {
      label: 'Preferences',
      accelerator: 'CmdOrCtrl+,',
      click: () => {
        mainWindow.show();
        if (process.platform === 'darwin') {
          app.dock.show();
        }
        // Navigate to settings
        mainWindow.webContents.executeJavaScript('window.location.href = "/workspaces/settings"').catch(() => {});
      }
    },
    { type: 'separator' },
    {
      label: 'Quit',
      accelerator: 'CmdOrCtrl+Q',
      click: () => {
        isQuitting = true;
        app.quit();
      }
    }
  ]);

  tray.setContextMenu(contextMenu);

  // Double click to show/hide window
  tray.on('click', () => {
    if (mainWindow.isVisible()) {
      mainWindow.hide();
      if (process.platform === 'darwin') {
        app.dock.hide();
      }
    } else {
      mainWindow.show();
      if (process.platform === 'darwin') {
        app.dock.show();
      }
    }
  });
}

function createMenu() {
  const template = [
    // App menu (macOS)
    ...(process.platform === 'darwin' ? [{
      label: app.name,
      submenu: [
        { role: 'about' },
        { type: 'separator' },
        {
          label: 'Preferences',
          accelerator: 'Cmd+,',
          click: () => {
            mainWindow.webContents.executeJavaScript('window.location.href = "/workspaces/settings"').catch(() => {});
          }
        },
        { type: 'separator' },
        { role: 'services' },
        { type: 'separator' },
        { role: 'hide' },
        { role: 'hideOthers' },
        { role: 'unhide' },
        { type: 'separator' },
        { role: 'quit' }
      ]
    }] : []),

    // File menu
    {
      label: 'File',
      submenu: [
        {
          label: 'New Conversation',
          accelerator: 'CmdOrCtrl+N',
          click: () => {
            mainWindow.webContents.executeJavaScript('window.location.href = "/conversations/create"').catch(() => {});
          }
        },
        {
          label: 'New Direct Message',
          accelerator: 'CmdOrCtrl+Shift+K',
          click: () => {
            mainWindow.webContents.executeJavaScript('window.location.href = "/conversations/dm/start"').catch(() => {});
          }
        },
        { type: 'separator' },
        { role: process.platform === 'darwin' ? 'close' : 'quit' }
      ]
    },

    // Edit menu
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'selectAll' }
      ]
    },

    // View menu
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' },
        ...(process.argv.includes('--dev') ? [
          { type: 'separator' },
          { role: 'toggleDevTools' }
        ] : [])
      ]
    },

    // Window menu
    {
      label: 'Window',
      submenu: [
        { role: 'minimize' },
        { role: 'zoom' },
        ...(process.platform === 'darwin' ? [
          { type: 'separator' },
          { role: 'front' },
          { type: 'separator' },
          {
            label: 'Confer',
            click: () => mainWindow.show()
          }
        ] : [
          { role: 'close' }
        ])
      ]
    },

    // Help menu
    {
      role: 'help',
      submenu: [
        {
          label: 'Learn More',
          click: async () => {
            await shell.openExternal('https://groundstatesystems.work');
          }
        }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

function handleDeepLink(url) {
  console.log('Deep link:', url);

  // Parse the confer:// URL and navigate to it
  // Example: confer://conversations/123 -> https://groundstatesystems.work/conversations/123
  const path = url.replace(`${APP_PROTOCOL}://`, '');

  if (mainWindow) {
    mainWindow.show();
    if (process.platform === 'darwin') {
      app.dock.show();
    }
    mainWindow.loadURL(`${CONFER_URL}/${path}`);
  }
}

// App lifecycle events
app.on('window-all-closed', () => {
  // On macOS, keep app running even when all windows are closed
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On macOS, recreate window when dock icon is clicked
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  } else {
    mainWindow.show();
    if (process.platform === 'darwin') {
      app.dock.show();
    }
  }
});

app.on('before-quit', () => {
  isQuitting = true;
});

// Auto-updater events
autoUpdater.on('update-available', () => {
  console.log('Update available');
});

autoUpdater.on('update-downloaded', () => {
  console.log('Update downloaded');
  // You could show a notification here
});

// Handle notifications from renderer
ipcMain.handle('show-notification', (event, { title, body }) => {
  // Notifications will be handled by the web app through the Notification API
  // This is just a placeholder for future custom notification handling
  return true;
});
