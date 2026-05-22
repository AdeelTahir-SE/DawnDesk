use std::{env, fs, path::PathBuf};

#[tauri::command]
pub fn photo_export_file(file_name: String, bytes: Vec<u8>) -> Result<String, String> {
    let safe_name = sanitize_file_name(&file_name);
    let path = downloads_dir()
        .unwrap_or_else(|| env::current_dir().unwrap_or_else(|_| PathBuf::from(".")))
        .join(safe_name);

    fs::write(&path, bytes).map_err(|err| format!("Failed to write export: {err}"))?;
    Ok(path.to_string_lossy().to_string())
}

fn downloads_dir() -> Option<PathBuf> {
    #[cfg(target_os = "windows")]
    {
        env::var_os("USERPROFILE").map(|home| PathBuf::from(home).join("Downloads"))
    }

    #[cfg(not(target_os = "windows"))]
    {
        env::var_os("HOME").map(|home| PathBuf::from(home).join("Downloads"))
    }
}

fn sanitize_file_name(file_name: &str) -> String {
    let sanitized: String = file_name
        .chars()
        .map(|ch| match ch {
            '<' | '>' | ':' | '"' | '/' | '\\' | '|' | '?' | '*' => '_',
            _ => ch,
        })
        .collect();

    if sanitized.trim().is_empty() {
        "dawndesk-export.png".to_string()
    } else {
        sanitized
    }
}
