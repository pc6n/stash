use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ShellCommand {
    pub command: String,
    pub description: String,
}

#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct ShortcutSettings {
    #[serde(default = "default_toggle_picker")]
    pub toggle_picker: String,
    #[serde(default)]
    pub toggle_picker_alt: Option<String>,
}

fn default_toggle_picker() -> String {
    "Command+Shift+W".to_string()
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AppSettings {
    #[serde(default = "default_max_history")]
    pub max_clipboard_history: u32,
    #[serde(default, rename = "pasteOnSelect")]
    pub paste_on_select: bool,
    #[serde(default)]
    pub shortcuts: ShortcutSettings,
}

fn default_max_history() -> u32 {
    30
}

impl Default for AppSettings {
    fn default() -> Self {
        Self {
            max_clipboard_history: default_max_history(),
            paste_on_select: false,
            shortcuts: ShortcutSettings {
                toggle_picker: default_toggle_picker(),
                toggle_picker_alt: Some("Command+Shift+V".to_string()),
            },
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PickerItem {
    pub id: String,
    pub kind: String,
    pub label: String,
    pub text: String,
    pub subtitle: Option<String>,
}

pub struct AppStore {
    data_dir: PathBuf,
    pub history: Vec<String>,
    pub commands: Vec<ShellCommand>,
    pub settings: AppSettings,
    migrated: bool,
}

impl AppStore {
    pub fn new(data_dir: PathBuf) -> Self {
        fs::create_dir_all(&data_dir).ok();
        let mut store = Self {
            data_dir,
            history: Vec::new(),
            commands: Vec::new(),
            settings: AppSettings::default(),
            migrated: false,
        };
        store.load_all();
        store
    }

    fn path(&self, name: &str) -> PathBuf {
        self.data_dir.join(name)
    }

    pub fn load_all(&mut self) {
        self.settings = read_json(&self.path("settings.json")).unwrap_or_default();
        self.commands = read_json(&self.path("commands.json")).unwrap_or_default();
        self.history = read_json(&self.path("history.json")).unwrap_or_default();
        if !self.migrated {
            self.migrate_from_electron();
            self.migrated = true;
        }
        self.trim_history();
    }

    fn migrate_from_electron(&mut self) {
        let Some(home) = dirs::home_dir() else {
            return;
        };
        let legacy = home.join("Library/Application Support/Stash");
        if self.commands.is_empty() {
            if let Some(cmds) = read_json::<Vec<ShellCommand>>(&legacy.join("commands.json")) {
                self.commands = cmds;
            }
        }
        if self.settings.max_clipboard_history == default_max_history() {
            if let Some(s) = read_json::<AppSettings>(&legacy.join("settings.json")) {
                self.settings.max_clipboard_history = s.max_clipboard_history;
            }
        }
        self.persist_commands();
        self.persist_settings();
    }

    pub fn push_clipboard(&mut self, text: String) -> bool {
        if text.trim().is_empty() {
            return false;
        }
        if self.history.first() == Some(&text) {
            return false;
        }
        self.history.retain(|h| h != &text);
        self.history.insert(0, text);
        self.trim_history();
        self.persist_history();
        true
    }

    pub fn trim_history(&mut self) {
        let max = self.settings.max_clipboard_history as usize;
        self.history.truncate(max);
    }

    pub fn clear_history(&mut self) {
        self.history.clear();
        self.persist_history();
    }

    pub fn picker_items(&self, query: &str) -> Vec<PickerItem> {
        let q = query.trim().to_lowercase();
        let mut items = Vec::new();

        for (i, text) in self.history.iter().enumerate() {
            if !matches_query(text, None, &q) {
                continue;
            }
            items.push(PickerItem {
                id: format!("clip-{i}"),
                kind: "clipboard".into(),
                label: truncate(text, 80),
                text: text.clone(),
                subtitle: Some("Clipboard".into()),
            });
        }

        for (i, cmd) in self.commands.iter().enumerate() {
            if !matches_query(&cmd.command, Some(&cmd.description), &q) {
                continue;
            }
            items.push(PickerItem {
                id: format!("cmd-{i}"),
                kind: "command".into(),
                label: cmd.description.clone(),
                text: cmd.command.clone(),
                subtitle: Some("Command".into()),
            });
        }

        items
    }

    pub fn persist_history(&self) {
        write_json(&self.path("history.json"), &self.history);
    }

    pub fn persist_commands(&self) {
        write_json(&self.path("commands.json"), &self.commands);
    }

    pub fn persist_settings(&self) {
        write_json(&self.path("settings.json"), &self.settings);
    }
}

fn matches_query(text: &str, subtitle: Option<&str>, q: &str) -> bool {
    if q.is_empty() {
        return true;
    }
    text.to_lowercase().contains(q)
        || subtitle
            .map(|s| s.to_lowercase().contains(q))
            .unwrap_or(false)
}

pub fn truncate(s: &str, max: usize) -> String {
    if s.chars().count() <= max {
        return s.to_string();
    }
    format!("{}…", s.chars().take(max).collect::<String>())
}

fn read_json<T: for<'de> Deserialize<'de>>(path: &PathBuf) -> Option<T> {
    let raw = fs::read_to_string(path).ok()?;
    serde_json::from_str(&raw).ok()
}

fn write_json<T: Serialize>(path: &PathBuf, value: &T) {
    if let Ok(raw) = serde_json::to_string_pretty(value) {
        let _ = fs::write(path, raw);
    }
}
