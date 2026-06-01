import { useCallback, useEffect, useRef, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import { getCurrentWindow } from '@tauri-apps/api/window';
import styles from './Picker.module.css';

type PickerItem = {
  id: string;
  kind: string;
  label: string;
  text: string;
  subtitle?: string;
};

type AppSettings = { pasteOnSelect?: boolean };

export default function Picker() {
  const [query, setQuery] = useState('');
  const [items, setItems] = useState<PickerItem[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [pasteOnSelect, setPasteOnSelect] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const loadItems = useCallback(async (q: string) => {
    const list = await invoke<PickerItem[]>('get_picker_items', { query: q });
    setItems(list);
    setActiveIndex(0);
  }, []);

  useEffect(() => {
    loadItems('');
    invoke<AppSettings>('get_settings').then((s) =>
      setPasteOnSelect(s.pasteOnSelect ?? false),
    );
    const unlistenShown = listen('picker:shown', () => {
      setQuery('');
      loadItems('');
      inputRef.current?.focus();
    });
    const unlistenSettings = listen<AppSettings>('settings:changed', (e) => {
      setPasteOnSelect(e.payload.pasteOnSelect ?? false);
    });
    return () => {
      unlistenShown.then((fn) => fn());
      unlistenSettings.then((fn) => fn());
    };
  }, [loadItems]);

  useEffect(() => {
    const t = setTimeout(() => loadItems(query), 80);
    return () => clearTimeout(t);
  }, [query, loadItems]);

  const selectItem = async (item: PickerItem) => {
    await invoke('copy_picker_item', { id: item.id });
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      getCurrentWindow().hide();
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, Math.max(items.length - 1, 0)));
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    }
    if (e.key === 'Enter' && items[activeIndex]) {
      e.preventDefault();
      selectItem(items[activeIndex]);
    }
  };

  return (
    <div className={styles.shell} onKeyDown={onKeyDown}>
      <div className={styles.searchRow}>
        <input
          ref={inputRef}
          className={styles.search}
          type="text"
          placeholder="Clipboard & commands…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoFocus
        />
      </div>
      <div className={styles.list}>
        {items.length === 0 ? (
          <p className={styles.empty}>No matches</p>
        ) : (
          items.map((item, index) => (
            <button
              key={item.id}
              type="button"
              className={`${styles.item} ${index === activeIndex ? styles.itemActive : ''}`}
              onMouseEnter={() => setActiveIndex(index)}
              onClick={() => selectItem(item)}
            >
              <div className={styles.label}>{item.label}</div>
              {item.subtitle && <div className={styles.sub}>{item.subtitle}</div>}
            </button>
          ))
        )}
      </div>
      <div className={styles.hint}>
        ↑↓ navigate · Enter {pasteOnSelect ? 'paste' : 'copy'} · Esc close
      </div>
    </div>
  );
}
