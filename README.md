# Stash

Lightweight clipboard history and command manager that lives in your menu bar. Built with Electron, React and TypeScript.

## Download

Grab the latest `.dmg` from [GitHub Releases](https://github.com/pc6n/stash/releases).

### macOS Gatekeeper

Because the app is not signed with an Apple Developer certificate, macOS will show a warning on first launch. To open it:

1. **Right-click** (or Control-click) on **Stash.app** and choose **Open**
2. In the dialog click **Open** to confirm

Alternatively: **System Settings → Privacy & Security** → scroll down to the blocked app and click **Open Anyway**.

Or remove the quarantine flag via Terminal:

```bash
xattr -cr /Applications/Stash.app
```

You only need to do this once -- subsequent launches work normally.

## Features

- **Clipboard History** -- automatically tracks copied text, searchable and one-click re-copy
- **Command Manager** -- save, organise and quickly copy shell commands you use often
- **Tray Menu** -- access clipboard history and commands directly from the menu bar
- **Always on Top** -- pin the window so it stays visible while you work
- **Keyboard Shortcut** -- `Cmd+Shift+W` toggles the window

## Development

### Requirements

- Node.js >= 18
- pnpm >= 9

### Getting Started

```bash
pnpm install --ignore-scripts
node node_modules/electron/install.js
pnpm start
```

### Build

```bash
# package for current platform
pnpm package
```

The output goes to `release/build/`.

## Project Structure

```
src/
  main/
    main.ts            # app lifecycle, window creation, shortcuts
    trayManager.ts     # tray icon, context menu, clipboard polling
    commandsStore.ts   # command persistence (JSON in userData)
    menu.ts            # native application menu
    preload.ts         # context bridge (IPC API for renderer)
  renderer/
    App.tsx            # root component, routing, theme
    ClipboardHistory.jsx
    ShellCommands.jsx
    AddCommandForm.jsx
    SideMenu.tsx
    hooks/             # useClipboardCopy, useSnackbar
```

## Tech Stack

| Layer     | Tech                          |
|-----------|-------------------------------|
| Runtime   | Electron                      |
| UI        | React, Material-UI            |
| Language  | TypeScript, JSX               |
| Bundler   | Webpack                       |
| Package   | pnpm                          |
| Build     | electron-builder              |

## License

MIT -- see [LICENSE](LICENSE).

---

Built by [techninjas.ch](https://techninjas.ch)
