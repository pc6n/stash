use crate::paste;
use crate::picker;
use crate::store::truncate;
use crate::AppState;
use parking_lot::Mutex;
use tauri::menu::{Menu, MenuItem, PredefinedMenuItem};
use tauri::tray::{MouseButton, MouseButtonState, TrayIcon, TrayIconBuilder, TrayIconEvent};
use tauri::{AppHandle, Manager};
use tauri_plugin_clipboard_manager::ClipboardExt;

const TRAY_CLIP_LIMIT: usize = 8;
const URL_TECHNINJAS: &str = "https://techninjas.ch";
const URL_GITHUB: &str = "https://github.com/pc6n/stash";

pub struct TrayState(pub Mutex<Option<TrayIcon>>);

pub fn setup(app: &AppHandle) -> Result<(), Box<dyn std::error::Error>> {
    let menu = build_menu(app)?;
    let icon = super::tray_icon()?;
    let mut builder = TrayIconBuilder::new().icon(icon).menu(&menu);
    #[cfg(target_os = "macos")]
    {
        builder = builder.icon_as_template(true);
    }
    let tray = builder
        .show_menu_on_left_click(true)
        .on_menu_event(handle_menu_event)
        .on_tray_icon_event(handle_tray_click)
        .build(app)?;
    app.manage(TrayState(Mutex::new(Some(tray))));
    Ok(())
}

pub fn refresh(app: &AppHandle) {
    let Some(tray_state) = app.try_state::<TrayState>() else {
        return;
    };
    let tray = tray_state.0.lock();
    let Some(tray) = tray.as_ref() else {
        return;
    };
    if let Ok(menu) = build_menu(app) {
        let _ = tray.set_menu(Some(menu));
    }
}

fn build_menu(app: &AppHandle) -> Result<Menu<tauri::Wry>, Box<dyn std::error::Error>> {
    let history = app
        .state::<AppState>()
        .store
        .lock()
        .history
        .clone();
    let mut clip_items = Vec::new();
    for (i, text) in history.iter().take(TRAY_CLIP_LIMIT).enumerate() {
        let label = format!("{i} — {}", truncate(text, 50));
        clip_items.push(MenuItem::with_id(
            app,
            format!("tray-clip-{i}"),
            label,
            true,
            None::<&str>,
        )?);
    }
    let open_i = MenuItem::with_id(app, "open", "Open Picker", true, None::<&str>)?;
    let settings_i = MenuItem::with_id(app, "settings", "Settings…", true, None::<&str>)?;
    let techninjas_i =
        MenuItem::with_id(app, "techninjas", "techninjas.ch", true, None::<&str>)?;
    let github_i = MenuItem::with_id(app, "github", "GitHub Repository", true, None::<&str>)?;
    let quit_i = MenuItem::with_id(app, "quit", "Quit Stash", true, None::<&str>)?;
    let sep = PredefinedMenuItem::separator(app)?;
    let mut refs: Vec<&dyn tauri::menu::IsMenuItem<tauri::Wry>> = Vec::new();
    for item in &clip_items {
        refs.push(item);
    }
    if !clip_items.is_empty() {
        refs.push(&sep);
    }
    refs.push(&open_i);
    refs.push(&settings_i);
    refs.push(&sep);
    refs.push(&techninjas_i);
    refs.push(&github_i);
    refs.push(&sep);
    refs.push(&quit_i);
    Ok(Menu::with_items(app, &refs)?)
}

fn handle_menu_event(app: &AppHandle, event: tauri::menu::MenuEvent) {
    if let Some(idx) = event.id().as_ref().strip_prefix("tray-clip-") {
        if let Ok(idx) = idx.parse::<usize>() {
            let _ = copy_tray_clip(app, idx);
        }
        return;
    }
    match event.id().as_ref() {
        "open" => {
            let _ = picker::show_picker(app);
        }
        "settings" => {
            let _ = picker::show_settings(app);
        }
        "techninjas" => open_url(URL_TECHNINJAS),
        "github" => open_url(URL_GITHUB),
        "quit" => app.exit(0),
        _ => {}
    }
}

fn handle_tray_click(tray: &TrayIcon, event: TrayIconEvent) {
    if let TrayIconEvent::Click {
        button: MouseButton::Left,
        button_state: MouseButtonState::Up,
        ..
    } = event
    {
        let app = tray.app_handle();
        let _ = picker::toggle_picker(app);
    }
}

fn copy_tray_clip(app: &AppHandle, idx: usize) -> Result<(), String> {
    let (text, paste_on_select) = {
        let state = app.state::<AppState>();
        let store = state.store.lock();
        let text = store.history.get(idx).cloned();
        let paste = store.settings.paste_on_select;
        (text, paste)
    };
    let Some(text) = text else {
        return Err("item not found".into());
    };
    app.clipboard()
        .write_text(text)
        .map_err(|e| e.to_string())?;
    #[cfg(target_os = "macos")]
    if paste_on_select {
        paste::paste_after_delay();
    }
    Ok(())
}

pub fn open_url(url: &str) {
    #[cfg(target_os = "macos")]
    {
        let _ = std::process::Command::new("open").arg(url).spawn();
    }
    #[cfg(not(target_os = "macos"))]
    {
        let _ = url;
    }
}
