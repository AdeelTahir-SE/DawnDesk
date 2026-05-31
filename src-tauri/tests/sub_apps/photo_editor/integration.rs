#[test]
fn test_photo_export_file_integration() {
    let dummy_data = vec![0, 1, 2, 3, 4];
    let file_name = "integration_test_photo.png".to_string();
    let export_dir = std::env::current_dir()
        .expect("test should resolve current directory")
        .join("target")
        .join("test-exports")
        .join("photo-editor");

    std::env::set_var("DAWNDESK_EXPORT_DIR", &export_dir);
    let result = dawndesk_lib::sub_apps::photo_editor::photo_export_file(file_name, dummy_data);
    std::env::remove_var("DAWNDESK_EXPORT_DIR");

    assert!(result.is_ok());

    if let Ok(path_str) = result {
        assert!(std::path::Path::new(&path_str).exists());
        let _ = std::fs::remove_file(path_str);
    }

    let _ = std::fs::remove_dir_all(export_dir);
}
