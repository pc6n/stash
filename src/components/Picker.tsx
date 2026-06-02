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
type PickerFilter = 'all' | 'commands';

export default function Picker() {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<PickerFilter>('all');
  const [items, setItems] = useState<PickerItem[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [pasteOnSelect, setPasteOnSelect] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const loadItems = useCallback(async (q: string) => {
    const list = await invoke<PickerItem[]>('get_picker_items', { query: q });
    setItems(list);
    setActiveIndex(0);
  }, []);

  const visibleItems =
    filter === 'commands'
      ? items.filter((item) => item.kind === 'command')
      : items;

  useEffect(() => {
    document.documentElement.classList.add('picker-window');
    return () => document.documentElement.classList.remove('picker-window');
  }, []);

  useEffect(() => {
    loadItems('');
    invoke<AppSettings>('get_settings').then((s) =>
      setPasteOnSelect(s.pasteOnSelect ?? false),
    );
    const unlistenShown = listen('picker:shown', () => {
      setQuery('');
      setFilter('all');
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

  useEffect(() => {
    setActiveIndex(0);
  }, [filter]);

  const selectItem = async (item: PickerItem) => {
    await invoke('copy_picker_item', { id: item.id });
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      getCurrentWindow().hide();
      return;
    }
    if (e.key === 'Tab') {
      e.preventDefault();
      setFilter((f) => (f === 'all' ? 'commands' : 'all'));
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) =>
        Math.min(i + 1, Math.max(visibleItems.length - 1, 0)),
      );
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    }
    if (e.key === 'Enter' && visibleItems[activeIndex]) {
      e.preventDefault();
      selectItem(visibleItems[activeIndex]);
    }
  };

  const searchPlaceholder =
    filter === 'commands' ? 'Search commands…' : 'Clipboard & commands…';

  return (
    <div className={styles.wrap}>
      <div className={styles.shell} onKeyDown={onKeyDown}>
        <div className={styles.searchRow}>
          <div className={styles.searchWrap}>
            <input
              ref={inputRef}
              className={styles.search}
              type="text"
              placeholder={searchPlaceholder}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={onKeyDown}
              autoFocus
            />
            <button
              type="button"
              className={`${styles.cmdToggle} ${filter === 'commands' ? styles.cmdToggleActive : ''}`}
              aria-label={filter === 'commands' ? 'Show all' : 'Commands only'}
              aria-pressed={filter === 'commands'}
              title={filter === 'commands' ? 'Show all (Tab)' : 'Commands only (Tab)'}
              onClick={() =>
                setFilter((f) => (f === 'commands' ? 'all' : 'commands'))
              }
            >
              {'{ }'}
            </button>
          </div>
        </div>
        <div className={styles.list}>
          {visibleItems.length === 0 ? (
            <p className={styles.empty}>
              {filter === 'commands' ? 'No commands' : 'No matches'}
            </p>
          ) : (
            visibleItems.map((item, index) => (
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
          ↑↓ navigate · Enter {pasteOnSelect ? 'paste' : 'copy'} · Tab cmds · Esc close
        </div>
      </div>
    </div>
  );
}
