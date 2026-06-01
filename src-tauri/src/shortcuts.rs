use crate::store::AppStore;
use parking_lot::Mutex;
use std::str::FromStr;
use std::sync::Arc;
use tauri::AppHandle;
use tauri_plugin_global_shortcut::{GlobalShortcutExt, Shortcut};

pub fn register_shortcuts(app: &AppHandle, store: Arc<Mutex<AppStore>>) -> Result<(), String> {
    let gs = app.global_shortcut();
    let _ = gs.unregister_all();

    let settings = store.lock().settings.clone();
    let combos = [
        settings.shortcuts.toggle_picker.clone(),
        settings.shortcuts.toggle_picker_alt.clone().unwrap_or_default(),
    ];

    for combo in combos {
        if combo.trim().is_empty() {
            continue;
        }
        let shortcut = Shortcut::from_str(&combo).map_err(|e| format!("{combo}: {e}"))?;
        gs.register(shortcut).map_err(|e| e.to_string())?;
    }

    Ok(())
}
