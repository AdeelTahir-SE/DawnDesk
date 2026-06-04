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
    use std::sync::Mutex;
    use std::time::{SystemTime, UNIX_EPOCH};

    static EXPORT_ENV_LOCK: Mutex<()> = Mutex::new(());

    fn unique_export_dir(test_name: &str) -> PathBuf {
        let stamp = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .expect("system clock should be after unix epoch")
            .as_nanos();
        env::temp_dir().join(format!("dawndesk-{test_name}-{stamp}"))
    }

    #[test]
    fn test_sanitize_file_name() {
        assert_eq!(sanitize_file_name("valid_name.png"), "valid_name.png");
        assert_eq!(sanitize_file_name("invalid<name>.png"), "invalid_name_.png");
        assert_eq!(sanitize_file_name("path/to/file.png"), "path_to_file.png");
        assert_eq!(sanitize_file_name("windows\\path:file?.png"), "windows_path_file_.png");
        assert_eq!(sanitize_file_name("stars*and|pipes.png"), "stars_and_pipes.png");
        assert_eq!(sanitize_file_name("   "), "dawndesk-export.png");
    }

    #[test]
    fn photo_export_file_writes_bytes_to_configured_export_dir() {
        let _guard = EXPORT_ENV_LOCK.lock().expect("export env lock should not be poisoned");
        let export_dir = unique_export_dir("photo-export");
        env::set_var("DAWNDESK_EXPORT_DIR", &export_dir);

        let result = photo_export_file("nested/path:bad?.png".to_string(), vec![9, 8, 7, 6]);

        env::remove_var("DAWNDESK_EXPORT_DIR");

        let path = PathBuf::from(result.expect("export should succeed"));
        assert_eq!(path.parent(), Some(export_dir.as_path()));
        assert_eq!(path.file_name().and_then(|name| name.to_str()), Some("nested_path_bad_.png"));
        assert_eq!(fs::read(&path).expect("exported file should be readable"), vec![9, 8, 7, 6]);

        let _ = fs::remove_file(path);
        let _ = fs::remove_dir_all(export_dir);
    }

    #[test]
    fn photo_export_file_uses_default_name_for_blank_filename() {
        let _guard = EXPORT_ENV_LOCK.lock().expect("export env lock should not be poisoned");
        let export_dir = unique_export_dir("blank-photo-export");
        env::set_var("DAWNDESK_EXPORT_DIR", &export_dir);

        let result = photo_export_file("   ".to_string(), vec![1, 2, 3]);

        env::remove_var("DAWNDESK_EXPORT_DIR");

        let path = PathBuf::from(result.expect("export should succeed"));
        assert_eq!(path.file_name().and_then(|name| name.to_str()), Some("dawndesk-export.png"));
        assert_eq!(fs::read(&path).expect("exported file should be readable"), vec![1, 2, 3]);

        let _ = fs::remove_file(path);
        let _ = fs::remove_dir_all(export_dir);
    }
}
