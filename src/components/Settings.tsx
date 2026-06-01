import { FormEvent, useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import styles from './Settings.module.css';

type AppSettings = {
  maxClipboardHistory: number;
  pasteOnSelect?: boolean;
  shortcuts: {
    togglePicker: string;
    togglePickerAlt?: string | null;
  };
};

type ShellCommand = {
  command: string;
  description: string;
};

export default function Settings() {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [commands, setCommands] = useState<ShellCommand[]>([]);
  const [newCmd, setNewCmd] = useState('');
  const [newDesc, setNewDesc] = useState('');

  const load = async () => {
    setSettings(await invoke<AppSettings>('get_settings'));
    setCommands(await invoke<ShellCommand[]>('get_commands'));
  };

  useEffect(() => {
    load();
  }, []);

  const saveSettings = async (partial: Partial<AppSettings>) => {
    const next = await invoke<AppSettings>('update_settings', { partial });
    setSettings(next);
  };

  const onAddCommand = async (e: FormEvent) => {
    e.preventDefault();
    if (!newCmd.trim()) return;
    const list = await invoke<ShellCommand[]>('add_command', {
      command: newCmd.trim(),
      description: newDesc.trim() || newCmd.trim(),
    });
    setCommands(list);
    setNewCmd('');
    setNewDesc('');
  };

  if (!settings) {
    return <div className={styles.shell}>Loading…</div>;
  }

  return (
    <div className={styles.shell}>
      <h1 className={styles.title}>Stash Settings</h1>

      <section className={styles.section}>
        <label className={styles.label} htmlFor="maxHistory">
          Max clipboard items
        </label>
        <input
          id="maxHistory"
          className={styles.input}
          type="number"
          min={5}
          max={200}
          value={settings.maxClipboardHistory}
          onChange={(e) =>
            saveSettings({ maxClipboardHistory: Number(e.target.value) })
          }
        />
      </section>

      <section className={styles.section}>
        <label className={styles.checkRow}>
          <input
            type="checkbox"
            checked={settings.pasteOnSelect ?? false}
            onChange={(e) => saveSettings({ pasteOnSelect: e.target.checked })}
          />
          <span>Paste immediately when selecting from picker</span>
        </label>
        <p className={styles.hint}>
          Copies to clipboard and sends ⌘V to the frontmost app. Requires
          Accessibility permission for Stash in System Settings.
        </p>
      </section>

      <section className={styles.section}>
        <label className={styles.label} htmlFor="shortcutPicker">
          Open picker shortcut
        </label>
        <input
          id="shortcutPicker"
          className={styles.input}
          value={settings.shortcuts.togglePicker}
          onChange={(e) =>
            saveSettings({
              shortcuts: {
                ...settings.shortcuts,
                togglePicker: e.target.value,
              },
            })
          }
        />
        <p className={styles.hint}>Tauri format, e.g. Command+Shift+W</p>

        <label className={styles.label} htmlFor="shortcutAlt" style={{ marginTop: 12 }}>
          Alternate shortcut (optional)
        </label>
        <input
          id="shortcutAlt"
          className={styles.input}
          value={settings.shortcuts.togglePickerAlt ?? ''}
          onChange={(e) =>
            saveSettings({
              shortcuts: {
                ...settings.shortcuts,
                togglePickerAlt: e.target.value || null,
              },
            })
          }
        />
      </section>

      <section className={styles.section}>
        <button
          type="button"
          className={`${styles.btn} ${styles.btnDanger}`}
          onClick={() => invoke('clear_history')}
        >
          Clear clipboard history
        </button>
      </section>

      <section className={styles.section}>
        <h2 className={styles.label}>Shell commands</h2>
        <ul className={styles.commandList}>
          {commands.map((cmd, index) => (
            <li key={`${cmd.command}-${index}`} className={styles.commandItem}>
              <div className={styles.commandText}>
                <div className={styles.commandDesc}>{cmd.description}</div>
                <div className={styles.commandCmd}>{cmd.command}</div>
              </div>
              <button
                type="button"
                className={`${styles.btn} ${styles.btnSecondary}`}
                onClick={async () =>
                  setCommands(await invoke('remove_command', { index }))
                }
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
        <form onSubmit={onAddCommand}>
          <input
            className={styles.input}
            placeholder="Command"
            value={newCmd}
            onChange={(e) => setNewCmd(e.target.value)}
          />
          <input
            className={styles.input}
            placeholder="Description"
            value={newDesc}
            onChange={(e) => setNewDesc(e.target.value)}
            style={{ marginTop: 8 }}
          />
          <button type="submit" className={styles.btn} style={{ marginTop: 8 }}>
            Add command
          </button>
        </form>
      </section>

      <footer className={styles.footer}>
        <button
          type="button"
          className={styles.linkBtn}
          onClick={() => invoke('open_external', { url: 'https://techninjas.ch' })}
        >
          techninjas.ch
        </button>
        <span className={styles.footerSep}>·</span>
        <button
          type="button"
          className={styles.linkBtn}
          onClick={() =>
            invoke('open_external', { url: 'https://github.com/pc6n/stash' })
          }
        >
          GitHub
        </button>
      </footer>
    </div>
  );
}
