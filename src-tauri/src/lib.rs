mod clipboard;
#[cfg(target_os = "macos")]
mod paste;
mod picker;
mod shortcuts;
mod store;
mod tray;

use parking_lot::Mutex;
use std::sync::Arc;
use store::{AppSettings, AppStore, PickerItem, ShellCommand};
use tauri::{AppHandle, Emitter, Manager, RunEvent, State};
use tauri_plugin_clipboard_manager::ClipboardExt;
use tauri_plugin_global_shortcut::ShortcutState;

pub struct AppState {
    pub store: Arc<Mutex<AppStore>>,
}

#[tauri::command]
fn get_picker_items(
    state: State<'_, AppState>,
    query: Option<String>,
) -> Result<Vec<PickerItem>, String> {
    let q = query.unwrap_or_default();
    Ok(state.store.lock().picker_items(&q))
}

#[tauri::command]
fn copy_picker_item(state: State<'_, AppState>, id: String, app: AppHandle) -> Result<(), String> {
    let text = {
        let store = state.store.lock();
        if let Some(stripped) = id.strip_prefix("clip-") {
            let idx: usize = stripped.parse().map_err(|_| "invalid id")?;
            store.history.get(idx).cloned()
        } else if let Some(stripped) = id.strip_prefix("cmd-") {
            let idx: usize = stripped.parse().map_err(|_| "invalid id")?;
            store.commands.get(idx).map(|c| c.command.clone())
        } else {
            None
        }
    };
    let Some(text) = text else {
        return Err("item not found".into());
    };
    let paste_on_select = state.store.lock().settings.paste_on_select;
    app.clipboard()
        .write_text(text)
        .map_err(|e| e.to_string())?;
    picker::hide_picker(&app)?;
    #[cfg(target_os = "macos")]
    if paste_on_select {
        paste::paste_after_delay();
    }
    Ok(())
}

#[tauri::command]
fn get_settings(state: State<'_, AppState>) -> Result<AppSettings, String> {
    Ok(state.store.lock().settings.clone())
}

#[tauri::command]
fn update_settings(
    state: State<'_, AppState>,
    app: AppHandle,
    partial: serde_json::Value,
) -> Result<AppSettings, String> {
    {
        let mut store = state.store.lock();
        if let Some(max) = partial.get("maxClipboardHistory").and_then(|v| v.as_u64()) {
            store.settings.max_clipboard_history = max as u32;
            store.trim_history();
            store.persist_history();
        }
        if let Some(paste) = partial.get("pasteOnSelect").and_then(|v| v.as_bool()) {
            store.settings.paste_on_select = paste;
        }
        if let Some(shortcuts) = partial.get("shortcuts") {
            if let Some(toggle) = shortcuts.get("togglePicker").and_then(|v| v.as_str()) {
                store.settings.shortcuts.toggle_picker = toggle.to_string();
            }
            if let Some(alt) = shortcuts.get("togglePickerAlt") {
                store.settings.shortcuts.toggle_picker_alt = alt.as_str().map(|s| s.to_string());
            }
        }
        store.persist_settings();
    }
    shortcuts::register_shortcuts(&app, state.store.clone())?;
    let settings = state.store.lock().settings.clone();
    let _ = app.emit("settings:changed", &settings);
    Ok(settings)
}

#[tauri::command]
fn get_commands(state: State<'_, AppState>) -> Result<Vec<ShellCommand>, String> {
    Ok(state.store.lock().commands.clone())
}

#[tauri::command]
fn add_command(
    state: State<'_, AppState>,
    command: String,
    description: String,
) -> Result<Vec<ShellCommand>, String> {
    let mut store = state.store.lock();
    store.commands.push(ShellCommand { command, description });
    store.persist_commands();
    Ok(store.commands.clone())
}

#[tauri::command]
fn remove_command(state: State<'_, AppState>, index: usize) -> Result<Vec<ShellCommand>, String> {
    let mut store = state.store.lock();
    if index < store.commands.len() {
        store.commands.remove(index);
        store.persist_commands();
    }
    Ok(store.commands.clone())
}

#[tauri::command]
fn clear_history(state: State<'_, AppState>, app: AppHandle) -> Result<(), String> {
    state.store.lock().clear_history();
    tray::refresh(&app);
    Ok(())
}

#[tauri::command]
fn hide_picker_cmd(app: AppHandle) -> Result<(), String> {
    picker::hide_picker(&app)
}

#[tauri::command]
fn show_picker_cmd(app: AppHandle) -> Result<(), String> {
    picker::show_picker(&app)
}

#[tauri::command]
fn show_settings_cmd(app: AppHandle) -> Result<(), String> {
    picker::show_settings(&app)
}

#[tauri::command]
fn open_external(url: String) -> Result<(), String> {
    tray::open_url(&url);
    Ok(())
}

pub(crate) fn tray_icon() -> tauri::Result<tauri::image::Image<'static>> {
    #[cfg(target_os = "macos")]
    const BYTES: &[u8] = include_bytes!("../../assets/tray-iconTemplate@2x.png");
    #[cfg(not(target_os = "macos"))]
    const BYTES: &[u8] = include_bytes!("../../assets/tray-iconTemplate.png");

    tauri::image::Image::from_bytes(BYTES)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let data_dir = dirs::data_dir()
        .unwrap_or_else(|| std::path::PathBuf::from("."))
        .join("ch.tnx.Stash");
    let store = Arc::new(Mutex::new(AppStore::new(data_dir)));
    let store_for_state = store.clone();

    tauri::Builder::default()
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(
            tauri_plugin_global_shortcut::Builder::new()
                .with_handler(|app, _shortcut, event| {
                    if event.state == ShortcutState::Pressed {
                        let _ = picker::toggle_picker(app);
                    }
                })
                .build(),
        )
        .manage(AppState {
            store: store_for_state,
        })
        .invoke_handler(tauri::generate_handler![
            get_picker_items,
            copy_picker_item,
            get_settings,
            update_settings,
            get_commands,
            add_command,
            remove_command,
            clear_history,
            hide_picker_cmd,
            show_picker_cmd,
            show_settings_cmd,
            open_external,
        ])
        .setup(move |app| {
            tray::setup(app.handle())?;
            clipboard::start_clipboard_watcher(app.handle().clone(), store.clone());
            shortcuts::register_shortcuts(app.handle(), store.clone())?;
            Ok(())
        })
        .build(tauri::generate_context!())
        .expect("error building tauri application")
        .run(|app, event| {
            match event {
                RunEvent::ExitRequested { api, .. } => {
                    api.prevent_exit();
                }
                RunEvent::WindowEvent {
                    label,
                    event: tauri::WindowEvent::Focused(false),
                    ..
                } if label == "picker" => {
                    if let Some(w) = app.get_webview_window("picker") {
                        let _ = w.hide();
                    }
                }
                _ => {}
            }
        });
}
