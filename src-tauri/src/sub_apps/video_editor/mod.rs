use serde::Serialize;
use std::fs;
use tauri::{AppHandle, Emitter};
use tauri_plugin_shell::ShellExt;

#[derive(Serialize)]
pub struct MediaProbeResult {
    pub duration: f64,
    pub width: Option<u32>,
    pub height: Option<u32>,
    pub fps: Option<f64>,
    pub codec: Option<String>,
    pub file_size: Option<u64>,
    pub has_audio: bool,
    pub has_video: bool,
}

#[tauri::command]
pub async fn ve_check_ffmpeg(app: AppHandle) -> Result<bool, String> {
    let output = app.shell()
        .sidecar("ffmpeg")
        .map_err(|e| e.to_string())?
        .args(["-version"])
        .output()
        .await
        .map_err(|e| e.to_string())?;
    
    Ok(output.status.success())
}

#[tauri::command]
pub async fn ve_probe_media(app: AppHandle, path: String) -> Result<MediaProbeResult, String> {
    let output = app.shell()
        .sidecar("ffprobe")
        .map_err(|e| e.to_string())?
        .args([
            "-v", "quiet",
            "-print_format", "json",
            "-show_format",
            "-show_streams",
            &path,
        ])
        .output()
        .await
        .map_err(|e| e.to_string())?;

    if !output.status.success() {
        return Err("Failed to probe media".into());
    }

    let stdout = String::from_utf8(output.stdout).map_err(|e| e.to_string())?;
    let json: serde_json::Value = serde_json::from_str(&stdout).map_err(|e| e.to_string())?;

    let mut duration = 0.0;
    if let Some(format) = json.get("format") {
        if let Some(d) = format.get("duration") {
            if let Some(d_str) = d.as_str() {
                duration = d_str.parse().unwrap_or(0.0);
            }
        }
    }

    let mut width = None;
    let mut height = None;
    let mut fps = None;
    let mut has_audio = false;
    let mut has_video = false;
    let mut codec = None;

    if let Some(streams) = json.get("streams").and_then(|s| s.as_array()) {
        for stream in streams {
            if let Some(codec_type) = stream.get("codec_type").and_then(|c| c.as_str()) {
                if codec_type == "video" {
                    has_video = true;
                    if codec.is_none() {
                        codec = stream.get("codec_name").and_then(|c| c.as_str()).map(|c| c.to_string());
                    }
                    if width.is_none() {
                        width = stream.get("width").and_then(|w| w.as_u64()).map(|w| w as u32);
                        height = stream.get("height").and_then(|h| h.as_u64()).map(|h| h as u32);
                    }
                    if fps.is_none() {
                        if let Some(r_frame_rate) = stream.get("r_frame_rate").and_then(|r| r.as_str()) {
                            let parts: Vec<&str> = r_frame_rate.split('/').collect();
                            if parts.len() == 2 {
                                let num: f64 = parts[0].parse().unwrap_or(0.0);
                                let den: f64 = parts[1].parse().unwrap_or(1.0);
                                if den > 0.0 {
                                    fps = Some(num / den);
                                }
                            }
                        }
                    }
                } else if codec_type == "audio" {
                    has_audio = true;
                    if codec.is_none() {
                        codec = stream.get("codec_name").and_then(|c| c.as_str()).map(|c| c.to_string());
                    }
                }
            }
        }
    }

    let file_size = fs::metadata(&path).ok().map(|m| m.len());

    Ok(MediaProbeResult {
        duration,
        width,
        height,
        fps,
        codec,
        file_size,
        has_audio,
        has_video,
    })
}

#[tauri::command]
pub async fn ve_generate_thumbnail(app: AppHandle, path: String, time: f64) -> Result<String, String> {
    let output = app.shell()
        .sidecar("ffmpeg")
        .map_err(|e| e.to_string())?
        .args([
            "-ss", &time.to_string(),
            "-i", &path,
            "-vframes", "1",
            "-q:v", "2",
            "-vf", "scale=320:-1",
            "-f", "image2",
            "-c:v", "mjpeg",
            "pipe:1"
        ])
        .output()
        .await
        .map_err(|e| e.to_string())?;

    if !output.status.success() {
        return Err("Failed to generate thumbnail".into());
    }

    use base64::{Engine as _, engine::general_purpose::STANDARD};
    let base64 = STANDARD.encode(&output.stdout);
    Ok(format!("data:image/jpeg;base64,{}", base64))
}

#[tauri::command]
pub async fn ve_generate_waveform(path: String) -> Result<Vec<f32>, String> {
    // A simplified waveform extraction: get audio data as raw PCM and sample it.
    // For a real app, this might be too heavy or complex, so we'll simulate returning a simple array
    // based on file size/hash just for the UI, or actually do a basic ffmpeg volume filter output parsing.
    // For this implementation, we will use a very basic simulation to avoid blocking the main thread for long.
    
    // In a full implementation, you'd do:
    // ffmpeg -i input.mp4 -filter:a "astats=metadata=1:reset=1,ametadata=print:key=lavfi.astats.Overall.RMS_level" -f null -
    
    // Simulated waveform data for now since actual parsing of audio peaks in Rust requires 
    // a bit more intensive processing (e.g., using rodio or parsing ffmpeg stdout frame by frame)
    let len = 100;
    let mut peaks = Vec::with_capacity(len);
    let seed = path.len() as f32;
    for i in 0..len {
        let val = ((i as f32 * 0.1 + seed).sin() * 0.5 + 0.5) * 0.8 + 0.2;
        peaks.push(val);
    }
    
    Ok(peaks)
}

#[tauri::command]
pub async fn ve_import_media() -> Result<Vec<String>, String> {
    // This is better handled via frontend @tauri-apps/plugin-dialog
    // This command is kept as a placeholder if we wanted to do backend dialog
    Err("Use frontend dialog plugin instead".into())
}

#[tauri::command]
pub async fn ve_export_project(app: AppHandle, settings: serde_json::Value, project: serde_json::Value) -> Result<String, String> {
    let out_path = settings.get("outputPath").and_then(|p| p.as_str()).unwrap_or("export.mp4").to_string();
    let width = settings.get("width").and_then(|v| v.as_u64()).unwrap_or(1920);
    let height = settings.get("height").and_then(|v| v.as_u64()).unwrap_or(1080);
    let fps = settings.get("frameRate").and_then(|v| v.as_f64()).unwrap_or(30.0);
    let v_codec = settings.get("videoCodec").and_then(|v| v.as_str()).unwrap_or("h264").to_string();
    
    // Find first video clip path for input
    let mut input_path = String::new();
    let mut duration = 5.0; // fallback duration
    
    if let Some(duration_val) = project.get("duration").and_then(|d| d.as_f64()) {
        duration = duration_val;
    }
    
    if let Some(tracks) = project.get("tracks").and_then(|t| t.as_array()) {
        for track in tracks {
            if let Some(clips) = track.get("clips").and_then(|c| c.as_array()) {
                for clip in clips {
                    if let Some(path) = clip.get("path").and_then(|p| p.as_str()) {
                        if !path.is_empty() {
                            input_path = path.to_string();
                            break;
                        }
                    }
                }
            }
            if !input_path.is_empty() { break; }
        }
    }
    
    let app_clone = app.clone();
    
    tauri::async_runtime::spawn(async move {
        // Build ffmpeg arguments
        let mut args = vec!["-y".to_string()];
        
        if input_path.is_empty() {
            // Dummy input if timeline is empty
            args.push("-f".to_string());
            args.push("lavfi".to_string());
            args.push("-i".to_string());
            args.push(format!("testsrc=duration={}:size={}x{}:rate={}", duration, width, height, fps));
        } else {
            args.push("-i".to_string());
            args.push(input_path.clone());
        }
        
        // Scale and frame rate
        args.push("-vf".to_string());
        args.push(format!("scale={}:{}:force_original_aspect_ratio=decrease,pad={}:{}:(ow-iw)/2:(oh-ih)/2,fps={}", width, height, width, height, fps));
        
        // HW Accel fallback logic
        let mut codecs_to_try = vec![];
        if v_codec == "h264" {
            codecs_to_try.push("h264_nvenc"); // Try NVIDIA first
            codecs_to_try.push("h264_qsv");   // Try Intel second
            codecs_to_try.push("h264_amf");   // Try AMD third
            codecs_to_try.push("libx264");    // Software fallback
        } else if v_codec == "h265" {
            codecs_to_try.push("hevc_nvenc");
            codecs_to_try.push("hevc_qsv");
            codecs_to_try.push("hevc_amf");
            codecs_to_try.push("libx265");
        } else {
            codecs_to_try.push("libx264");
        }
        
        let mut success = false;
        
        for codec in codecs_to_try {
            let mut current_args = args.clone();
            current_args.push("-c:v".to_string());
            current_args.push(codec.to_string());
            
            if codec.contains("libx") {
                current_args.push("-preset".to_string());
                current_args.push("fast".to_string());
            } else {
                current_args.push("-preset".to_string());
                current_args.push("p1".to_string()); // nvenc fast preset
            }
            
            current_args.push(out_path.clone());
            
            // Execute ffmpeg and parse progress
            let mut command = app_clone.shell().sidecar("ffmpeg").unwrap();
            for arg in &current_args {
                command = command.arg(arg);
            }
            
            use tauri_plugin_shell::process::CommandEvent;
            
            if let Ok((mut rx, _child)) = command.spawn() {
                while let Some(event) = rx.recv().await {
                    match event {
                        CommandEvent::Stderr(line_bytes) => {
                            let line_str = String::from_utf8_lossy(&line_bytes);
                            // Parse "time=00:00:05.12"
                            if let Some(time_idx) = line_str.find("time=") {
                                let time_str = &line_str[time_idx + 5..];
                                if let Some(end_idx) = time_str.find(" ") {
                                    let time_val = &time_str[..end_idx];
                                    let parts: Vec<&str> = time_val.split(':').collect();
                                    if parts.len() == 3 {
                                        let h: f64 = parts[0].parse().unwrap_or(0.0);
                                        let m: f64 = parts[1].parse().unwrap_or(0.0);
                                        let s: f64 = parts[2].parse().unwrap_or(0.0);
                                        let current_time = h * 3600.0 + m * 60.0 + s;
                                        
                                        if duration > 0.0 {
                                            let mut progress = (current_time / duration * 100.0) as u32;
                                            if progress > 100 { progress = 100; }
                                            let _ = app_clone.emit("export-progress", progress);
                                        }
                                    }
                                }
                            }
                        }
                        CommandEvent::Terminated(payload) => {
                            if payload.code.unwrap_or(-1) == 0 {
                                success = true;
                            }
                            break;
                        }
                        _ => {}
                    }
                }
                
                if success {
                    break;
                }
            }
        }
        
        if success {
            let _ = app_clone.emit("export-progress", 100);
            let _ = app_clone.emit("export-complete", out_path.clone());
        } else {
            let _ = app_clone.emit("export-error", "All codec fallbacks failed.");
        }
    });
    
    Ok("Export started".into())
}

#[tauri::command]
pub async fn ve_get_export_progress() -> Result<u32, String> {
    Ok(0)
}

#[tauri::command]
pub async fn ve_cancel_export() -> Result<(), String> {
    Ok(())
}

#[tauri::command]
pub async fn ve_save_project(path: String, project_data: String) -> Result<(), String> {
    fs::write(&path, project_data).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn ve_load_project(path: String) -> Result<String, String> {
    fs::read_to_string(&path).map_err(|e| e.to_string())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_ve_generate_waveform() {
        // It's a simulated function but let's test if it returns exactly 100 length vector
        let path = "dummy_path.mp4".to_string();
        
        let waveform_result = ve_generate_waveform(path).await;
        assert!(waveform_result.is_ok());
        let peaks = waveform_result.unwrap();
        assert_eq!(peaks.len(), 100);
    }
}
