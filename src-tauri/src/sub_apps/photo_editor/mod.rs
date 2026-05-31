use std::{env, fs, path::PathBuf};

#[tauri::command]
pub fn photo_export_file(file_name: String, bytes: Vec<u8>) -> Result<String, String> {
    let safe_name = sanitize_file_name(&file_name);
    let path = downloads_dir()
        .unwrap_or_else(|| env::current_dir().unwrap_or_else(|_| PathBuf::from(".")))
        .join(safe_name);

    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent)
            .map_err(|err| format!("Failed to prepare export directory: {err}"))?;
    }

    fs::write(&path, bytes).map_err(|err| format!("Failed to write export: {err}"))?;
    Ok(path.to_string_lossy().to_string())
}

fn downloads_dir() -> Option<PathBuf> {
    if let Some(path) = env::var_os("DAWNDESK_EXPORT_DIR") {
        return Some(PathBuf::from(path));
    }

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

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_sanitize_file_name() {
        assert_eq!(sanitize_file_name("valid_name.png"), "valid_name.png");
        assert_eq!(sanitize_file_name("invalid<name>.png"), "invalid_name_.png");
        assert_eq!(sanitize_file_name("path/to/file.png"), "path_to_file.png");
        assert_eq!(sanitize_file_name("   "), "dawndesk-export.png");
    }
}
