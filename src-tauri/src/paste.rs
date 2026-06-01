use std::process::Command;
use std::thread;
use std::time::Duration;

const PASTE_DELAY_MS: u64 = 80;

pub fn paste_after_delay() {
    thread::spawn(|| {
        thread::sleep(Duration::from_millis(PASTE_DELAY_MS));
        let _ = simulate_paste();
    });
}

fn simulate_paste() -> Result<(), String> {
    let ok = Command::new("osascript")
        .args([
            "-e",
            "tell application \"System Events\" to keystroke \"v\" using command down",
        ])
        .status()
        .map_err(|e| e.to_string())?
        .success();
    if ok {
        Ok(())
    } else {
        Err("paste failed — grant Accessibility access in System Settings".into())
    }
}
