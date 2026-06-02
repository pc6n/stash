# Stash

Lightweight clipboard history and command manager for macOS. Lives in the menu bar — open a picker at your cursor with a global shortcut.

Built with **Tauri 2**, **React**, and **TypeScript**.

## Features

- **Clipboard history** — automatically tracks copied text (Rust-side, single source of truth)
- **Command manager** — save shell commands and copy them quickly
- **Picker at cursor** — `Command+Shift+W` (configurable) opens a small popup at the mouse position
- **Search** — filter history and commands in the picker
- **Configurable shortcuts** — change shortcuts in Settings
- **Menu bar app** — tray menu with recent clipboard items
- **Optional paste on select** — copy or paste directly from the picker
- **No Dock icon** (`LSUIElement`) — lives in the menu bar only

## Download

Download the latest `.dmg` from [GitHub Releases](https://github.com/pc6n/stash/releases), or build locally (see below).

### macOS Gatekeeper

Unsigned builds may require **right-click → Open** once, or:

```bash
xattr -cr /Applications/Stash.app
```

## Development

### Requirements

- Node.js >= 18
- pnpm >= 9
- Rust (stable)
- Xcode Command Line Tools (macOS)

### Run

```bash
pnpm install
pnpm tauri dev
```

### Build

```bash
pnpm tauri build
```

Output: `src-tauri/target/release/bundle/dmg/`

## Shortcuts (defaults)

| Action | Default |
|--------|---------|
| Toggle picker | `Command+Shift+W` |
| Alternate | `Command+Shift+V` |

Change in **Settings** (tray → Settings…).

## Data location

| File | Path |
|------|------|
| History | `~/Library/Application Support/ch.tnx.Stash/history.json` |
| Commands | `~/Library/Application Support/ch.tnx.Stash/commands.json` |
| Settings | `~/Library/Application Support/ch.tnx.Stash/settings.json` |

### Migration from Electron Stash

On first launch, commands and settings are imported from:

`~/Library/Application Support/Stash/`

## Project structure

```
src/                 # React UI (Picker + Settings)
src-tauri/src/
  lib.rs             # App entry, tray, commands
  store.rs           # Persistence + migration
  clipboard.rs       # Clipboard watcher
  picker.rs          # Cursor-positioned picker window
  shortcuts.rs       # Global shortcut registration
```

## License 

MIT — see [LICENSE](LICENSE).

Built by [techninjas.ch](https://techninjas.ch)