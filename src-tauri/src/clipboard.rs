use crate::store::AppStore;
use crate::tray;
use parking_lot::Mutex;
use std::sync::Arc;
use std::time::Duration;
use tauri::AppHandle;
use tauri_plugin_clipboard_manager::ClipboardExt;

pub fn start_clipboard_watcher(app: AppHandle, store: Arc<Mutex<AppStore>>) {
    std::thread::spawn(move || {
        loop {
            std::thread::sleep(Duration::from_millis(500));
            let text = match app.clipboard().read_text() {
                Ok(t) => t,
                Err(_) => continue,
            };
            if text.trim().is_empty() {
                continue;
            }
            let changed = {
                let mut guard = store.lock();
                guard.push_clipboard(text)
            };
            if changed {
                tray::refresh(&app);
            }
        }
    });
}
