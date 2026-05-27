#[test]
fn test_photo_export_file_integration() {
    let dummy_data = vec![0, 1, 2, 3, 4];
    let file_name = "integration_test_photo.png".to_string();
    
    // Test the exported function. Note: This will actually write to the disk.
    let result = dawndesk_lib::sub_apps::photo_editor::photo_export_file(file_name, dummy_data);
    
    assert!(result.is_ok());
    
    // Cleanup the generated file if needed (the path is in the result)
    if let Ok(path_str) = result {
        let _ = std::fs::remove_file(path_str);
    }
}
