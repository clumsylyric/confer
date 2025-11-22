# Confer Desktop

A native macOS Electron app for Confer workspace collaboration.

## Features

-  Native macOS application
-  Menu bar (tray) integration
-  Native menus and keyboard shortcuts
-  Desktop notifications
-  Dock badge for unread messages
-  Deep linking support (`confer://` protocol)
-  Auto-updates
-  Secure context isolation

## Development

### Install Dependencies

```bash
npm install
```

### Run in Development Mode

```bash
npm run dev
```

### Build for macOS

```bash
npm run build:mac
```

The built app will be available in the `dist/` directory.

### Build Universal Binary (Intel + Apple Silicon)

```bash
npm run build:mac:universal
```

## Keyboard Shortcuts

- `Cmd+N` - New conversation
- `Cmd+Shift+K` - New direct message
- `Cmd+,` - Preferences
- `Cmd+Q` - Quit application
- `Cmd+W` - Close window (minimizes to tray)

## Deep Linking

The app supports deep linking with the `confer://` protocol:

- `confer://conversations/123` - Open specific conversation
- `confer://conversations/create` - Create new conversation

## Tray Icon

The app includes a menu bar icon that provides quick access to:
- Show/hide main window
- Create new conversation
- Access preferences
- Quit application

## Security

The app is built with security best practices:
- Context isolation enabled
- Sandbox enabled
- Node integration disabled
- Secure external link handling

## License

MIT
