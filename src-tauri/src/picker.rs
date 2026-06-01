use tauri::{AppHandle, Emitter, LogicalPosition, Manager, WebviewWindow};

const PICKER_LABEL: &str = "picker";
const SETTINGS_LABEL: &str = "settings";
const CURSOR_OFFSET: f64 = 12.0;

pub fn show_picker(app: &AppHandle) -> Result<(), String> {
    let window = get_picker(app)?;
    let (x, y) = cursor_position()?;
    window
        .set_position(LogicalPosition::new(x + CURSOR_OFFSET, y + CURSOR_OFFSET))
        .map_err(|e| e.to_string())?;
    window.show().map_err(|e| e.to_string())?;
    window.set_focus().map_err(|e| e.to_string())?;
    let _ = window.emit("picker:shown", ());
    Ok(())
}

pub fn hide_picker(app: &AppHandle) -> Result<(), String> {
    let window = get_picker(app)?;
    window.hide().map_err(|e| e.to_string())
}

pub fn toggle_picker(app: &AppHandle) -> Result<(), String> {
    let window = get_picker(app)?;
    if window.is_visible().unwrap_or(false) {
        hide_picker(app)
    } else {
        show_picker(app)
    }
}

pub fn show_settings(app: &AppHandle) -> Result<(), String> {
    let window = app
        .get_webview_window(SETTINGS_LABEL)
        .ok_or("settings window missing")?;
    window.center().map_err(|e| e.to_string())?;
    window.show().map_err(|e| e.to_string())?;
    window.set_focus().map_err(|e| e.to_string())?;
    Ok(())
}

fn get_picker(app: &AppHandle) -> Result<WebviewWindow, String> {
    app.get_webview_window(PICKER_LABEL)
        .ok_or_else(|| "picker window missing".into())
}

fn cursor_position() -> Result<(f64, f64), String> {
    #[cfg(target_os = "macos")]
    {
        use mouse_position::mouse_position::Mouse;
        return match Mouse::get_mouse_position() {
            Mouse::Position { x, y } => Ok((x as f64, y as f64)),
            Mouse::Error => Ok((120.0, 120.0)),
        };
    }
    #[cfg(not(target_os = "macos"))]
    {
        Ok((120.0, 120.0))
    }
}
