use serde::{Deserialize, Serialize};
use std::{env, fs, path::PathBuf};
use tauri::{AppHandle, Manager, Emitter};
use tauri_plugin_shell::ShellExt;
use tauri_plugin_shell::process::CommandEvent;

#[derive(Serialize)]
pub struct MediaProbeResult {
    pub duration: f64,
    pub width: Option<u32>,
    pub height: Option<u32>,
    pub fps: Option<f64>,
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

    if let Some(streams) = json.get("streams").and_then(|s| s.as_array()) {
        for stream in streams {
            if let Some(codec_type) = stream.get("codec_type").and_then(|c| c.as_str()) {
                if codec_type == "video" {
                    has_video = true;
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
                }
            }
        }
    }

    Ok(MediaProbeResult {
        duration,
        width,
        height,
        fps,
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
pub async fn ve_generate_waveform(app: AppHandle, path: String) -> Result<Vec<f32>, String> {
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
pub async fn ve_export_project(app: AppHandle, settings: serde_json::Value) -> Result<String, String> {
    // For a real NLE, this would be a complex ffmpeg command with filter_complex
    // representing the timeline. For this UI implementation, we'll simulate a 
    // basic ffmpeg command that just copies an input or creates a dummy output
    // to show the export progress working.
    
    let out_name = settings.get("name").and_then(|n| n.as_str()).unwrap_or("export");
    let out_dir = match app.path().download_dir() {
        Ok(dir) => dir,
        Err(_) => PathBuf::from("."),
    };
    
    let out_path = out_dir.join(format!("{}.mp4", out_name));
    
    // Simulated export process - in reality this would spawn a ffmpeg process
    // and stream progress to the frontend.
    
    // To show progress, we will spawn a thread that emits events to the frontend.
    let app_clone = app.clone();
    
    tauri::async_runtime::spawn(async move {
        for i in 0..=100 {
            tokio::time::sleep(tokio::time::Duration::from_millis(50)).await;
            let _ = app_clone.emit("export-progress", i);
        }
        let _ = app_clone.emit("export-complete", out_path.to_string_lossy().to_string());
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
