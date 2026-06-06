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
    let output = app
        .shell()
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
    let output = app
        .shell()
        .sidecar("ffprobe")
        .map_err(|e| e.to_string())?
        .args([
            "-v",
            "quiet",
            "-print_format",
            "json",
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
                        codec = stream
                            .get("codec_name")
                            .and_then(|c| c.as_str())
                            .map(|c| c.to_string());
                    }
                    if width.is_none() {
                        width = stream
                            .get("width")
                            .and_then(|w| w.as_u64())
                            .map(|w| w as u32);
                        height = stream
                            .get("height")
                            .and_then(|h| h.as_u64())
                            .map(|h| h as u32);
                    }
                    if fps.is_none() {
                        if let Some(r_frame_rate) =
                            stream.get("r_frame_rate").and_then(|r| r.as_str())
                        {
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
                        codec = stream
                            .get("codec_name")
                            .and_then(|c| c.as_str())
                            .map(|c| c.to_string());
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
pub async fn ve_generate_thumbnail(
    app: AppHandle,
    path: String,
    time: f64,
) -> Result<String, String> {
    let output = app
        .shell()
        .sidecar("ffmpeg")
        .map_err(|e| e.to_string())?
        .args([
            "-ss",
            &time.to_string(),
            "-i",
            &path,
            "-vframes",
            "1",
            "-q:v",
            "2",
            "-vf",
            "thumbnail,scale=320:-1",
            "-f",
            "image2",
            "-c:v",
            "mjpeg",
            "pipe:1",
        ])
        .output()
        .await
        .map_err(|e| e.to_string())?;

    if !output.status.success() {
        return Err("Failed to generate thumbnail".into());
    }

    use base64::{engine::general_purpose::STANDARD, Engine as _};
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

#[derive(Clone, Debug)]
struct RenderClip {
    path: String,
    media_type: String,
    track_type: String,
    start_time: f64,
    duration: f64,
    in_point: f64,
    opacity: f64,
    volume: f64,
    position_x: f64,
    position_y: f64,
    scale: f64,
    effects: Vec<serde_json::Value>,
}

fn value_f64(value: &serde_json::Value, key: &str, fallback: f64) -> f64 {
    value.get(key).and_then(|v| v.as_f64()).unwrap_or(fallback)
}

fn effect_param_f64(effect: &serde_json::Value, key: &str, fallback: f64) -> f64 {
    effect
        .get("params")
        .and_then(|p| p.as_array())
        .and_then(|params| {
            params.iter().find_map(|param| {
                let param_key = param.get("key").and_then(|k| k.as_str())?;
                if param_key == key {
                    param.get("value").and_then(|v| v.as_f64())
                } else {
                    None
                }
            })
        })
        .unwrap_or(fallback)
}

fn effect_param_str<'a>(effect: &'a serde_json::Value, key: &str, fallback: &'a str) -> &'a str {
    effect
        .get("params")
        .and_then(|p| p.as_array())
        .and_then(|params| {
            params.iter().find_map(|param| {
                let param_key = param.get("key").and_then(|k| k.as_str())?;
                if param_key == key {
                    param.get("value").and_then(|v| v.as_str())
                } else {
                    None
                }
            })
        })
        .unwrap_or(fallback)
}

fn keyframe_progress(value: f64, interpolation: &str, handle_out_y: f64) -> f64 {
    let t = value.clamp(0.0, 1.0);
    match interpolation {
        "hold" => 0.0,
        "ease-in" => t * t,
        "ease-out" => 1.0 - (1.0 - t) * (1.0 - t),
        "ease-in-out" => {
            if t < 0.5 {
                2.0 * t * t
            } else {
                1.0 - (-2.0 * t + 2.0).powi(2) / 2.0
            }
        }
        "bezier" => {
            let y1 = handle_out_y;
            let y2 = 1.0 - y1;
            let inv = 1.0 - t;
            3.0 * inv * inv * t * y1 + 3.0 * inv * t * t * y2 + t * t * t
        }
        _ => t,
    }
}

fn evaluate_numeric_keyframes(effect: &serde_json::Value, property: &str, time: f64, fallback: f64) -> f64 {
    let mut keyframes: Vec<&serde_json::Value> = effect
        .get("keyframes")
        .and_then(|k| k.as_array())
        .map(|items| {
            items
                .iter()
                .filter(|keyframe| {
                    keyframe.get("property").and_then(|p| p.as_str()) == Some(property)
                        && keyframe.get("value").and_then(|v| v.as_f64()).is_some()
                })
                .collect()
        })
        .unwrap_or_default();

    if keyframes.is_empty() {
        return fallback;
    }

    keyframes.sort_by(|a, b| {
        value_f64(a, "time", 0.0)
            .partial_cmp(&value_f64(b, "time", 0.0))
            .unwrap_or(std::cmp::Ordering::Equal)
    });

    let first = keyframes[0];
    let first_time = value_f64(first, "time", 0.0);
    if time <= first_time {
        return value_f64(first, "value", fallback);
    }

    let last = keyframes[keyframes.len() - 1];
    let last_time = value_f64(last, "time", 0.0);
    if time >= last_time {
        return value_f64(last, "value", fallback);
    }

    for pair in keyframes.windows(2) {
        let from = pair[0];
        let to = pair[1];
        let from_time = value_f64(from, "time", 0.0);
        let to_time = value_f64(to, "time", from_time + 0.001);
        if time < from_time || time > to_time {
            continue;
        }
        let span = (to_time - from_time).max(0.001);
        let handle_out_y = from
            .get("handleOut")
            .and_then(|handle| handle.get("y"))
            .and_then(|value| value.as_f64())
            .unwrap_or(0.25);
        let interpolation = from
            .get("interpolation")
            .and_then(|value| value.as_str())
            .unwrap_or("linear");
        let progress = keyframe_progress((time - from_time) / span, interpolation, handle_out_y);
        let from_value = value_f64(from, "value", fallback);
        let to_value = value_f64(to, "value", fallback);
        return from_value + (to_value - from_value) * progress;
    }

    fallback
}

fn evaluate_point_keyframes(
    effect: &serde_json::Value,
    property: &str,
    time: f64,
    fallback_x: f64,
    fallback_y: f64,
) -> Option<(f64, f64)> {
    let mut keyframes: Vec<&serde_json::Value> = effect
        .get("keyframes")
        .and_then(|k| k.as_array())
        .map(|items| {
            items
                .iter()
                .filter(|keyframe| {
                    keyframe.get("property").and_then(|p| p.as_str()) == Some(property)
                        && keyframe
                            .get("value")
                            .and_then(|v| v.get("x"))
                            .and_then(|v| v.as_f64())
                            .is_some()
                        && keyframe
                            .get("value")
                            .and_then(|v| v.get("y"))
                            .and_then(|v| v.as_f64())
                            .is_some()
                })
                .collect()
        })
        .unwrap_or_default();

    if keyframes.is_empty() {
        return None;
    }

    keyframes.sort_by(|a, b| {
        value_f64(a, "time", 0.0)
            .partial_cmp(&value_f64(b, "time", 0.0))
            .unwrap_or(std::cmp::Ordering::Equal)
    });

    let point_value = |keyframe: &serde_json::Value| -> (f64, f64) {
        let value = keyframe.get("value").unwrap_or(&serde_json::Value::Null);
        (
            value.get("x").and_then(|v| v.as_f64()).unwrap_or(fallback_x),
            value.get("y").and_then(|v| v.as_f64()).unwrap_or(fallback_y),
        )
    };

    let first = keyframes[0];
    if time <= value_f64(first, "time", 0.0) {
        return Some(point_value(first));
    }

    let last = keyframes[keyframes.len() - 1];
    if time >= value_f64(last, "time", 0.0) {
        return Some(point_value(last));
    }

    for pair in keyframes.windows(2) {
        let from = pair[0];
        let to = pair[1];
        let from_time = value_f64(from, "time", 0.0);
        let to_time = value_f64(to, "time", from_time + 0.001);
        if time < from_time || time > to_time {
            continue;
        }
        let span = (to_time - from_time).max(0.001);
        let handle_out_y = from
            .get("handleOut")
            .and_then(|handle| handle.get("y"))
            .and_then(|value| value.as_f64())
            .unwrap_or(0.25);
        let interpolation = from
            .get("interpolation")
            .and_then(|value| value.as_str())
            .unwrap_or("linear");
        let progress = keyframe_progress((time - from_time) / span, interpolation, handle_out_y);
        let (from_x, from_y) = point_value(from);
        let (to_x, to_y) = point_value(to);
        return Some((
            from_x + (to_x - from_x) * progress,
            from_y + (to_y - from_y) * progress,
        ));
    }

    None
}

fn effect_with_animated_params(effect: &serde_json::Value, local_time: f64) -> serde_json::Value {
    let mut animated = effect.clone();
    let Some(params) = animated.get_mut("params").and_then(|p| p.as_array_mut()) else {
        return animated;
    };

    let position = if effect.get("type").and_then(|t| t.as_str()) == Some("text-overlay") {
        evaluate_point_keyframes(
            effect,
            "position",
            local_time,
            effect_param_f64(effect, "x", 50.0),
            effect_param_f64(effect, "y", 50.0),
        )
    } else {
        None
    };

    for param in params {
        let Some(param_key) = param.get("key").and_then(|k| k.as_str()).map(|key| key.to_string()) else {
            continue;
        };
        if let Some((x, y)) = position {
            if param_key == "x" {
                param["value"] = serde_json::json!(x);
                continue;
            }
            if param_key == "y" {
                param["value"] = serde_json::json!(y);
                continue;
            }
        }
        let Some(current_value) = param.get("value").and_then(|v| v.as_f64()) else {
            continue;
        };
        let animated_value = evaluate_numeric_keyframes(effect, &param_key, local_time, current_value);
        param["value"] = serde_json::json!(animated_value);
    }

    animated
}

fn push_effect_keyframe_boundaries(
    boundaries: &mut Vec<f64>,
    effect: &serde_json::Value,
    effect_start: f64,
    effect_end: f64,
    clip_start: f64,
    clip_end: f64,
) {
    if effect_end <= effect_start {
        return;
    }

    let Some(keyframes) = effect.get("keyframes").and_then(|k| k.as_array()) else {
        return;
    };

    let has_animatable_keyframes = keyframes.iter().any(|keyframe| {
        keyframe.get("value").and_then(|v| v.as_f64()).is_some()
            || keyframe
                .get("value")
                .and_then(|v| v.get("x"))
                .and_then(|v| v.as_f64())
                .is_some()
    });
    if !has_animatable_keyframes {
        return;
    }

    for keyframe in keyframes {
        let time = value_f64(keyframe, "time", 0.0);
        let absolute_time = (effect_start + time).clamp(effect_start, effect_end);
        boundaries.push(absolute_time.clamp(clip_start, clip_end));
    }

    let mut sample_time = effect_start;
    while sample_time < effect_end {
        boundaries.push(sample_time.clamp(clip_start, clip_end));
        sample_time += 0.1;
    }
    boundaries.push(effect_end.clamp(clip_start, clip_end));
}

fn escape_drawtext_text(value: &str) -> String {
    value
        .replace('\\', "\\\\")
        .replace(':', "\\:")
        .replace('\'', "\\'")
        .replace('%', "\\%")
}

fn ffmpeg_color(value: &str) -> String {
    if let Some(hex) = value.strip_prefix('#') {
        format!("0x{}", hex)
    } else {
        value.to_string()
    }
}

fn effect_filter_chain(effects: &[serde_json::Value]) -> String {
    let mut filters: Vec<String> = Vec::new();

    for effect in effects {
        if !effect
            .get("enabled")
            .and_then(|e| e.as_bool())
            .unwrap_or(true)
        {
            continue;
        }

        let effect_type = effect.get("type").and_then(|t| t.as_str()).unwrap_or("");
        match effect_type {
            "gaussian-blur" => {
                let radius = effect_param_f64(effect, "radius", 0.0).clamp(0.0, 100.0);
                if radius > 0.0 {
                    filters.push(format!("gblur=sigma={:.3}", radius));
                }
            }
            "brightness-contrast" => {
                let brightness =
                    effect_param_f64(effect, "brightness", 0.0).clamp(-100.0, 100.0) / 100.0;
                let contrast =
                    1.0 + effect_param_f64(effect, "contrast", 0.0).clamp(-100.0, 100.0) / 100.0;
                filters.push(format!(
                    "eq=brightness={:.4}:contrast={:.4}",
                    brightness,
                    contrast.max(0.0)
                ));
            }
            "grayscale" => {
                let amount = effect_param_f64(effect, "amount", 100.0).clamp(0.0, 100.0) / 100.0;
                if amount >= 0.99 {
                    filters.push("format=gray,format=rgba".to_string());
                } else if amount > 0.0 {
                    filters.push(format!("hue=s={:.4}", 1.0 - amount));
                }
            }
            "sepia" => {
                let amount = effect_param_f64(effect, "amount", 100.0).clamp(0.0, 100.0) / 100.0;
                if amount > 0.0 {
                    filters.push(format!(
                        "colorchannelmixer=rr={:.4}:rg={:.4}:rb={:.4}:gr={:.4}:gg={:.4}:gb={:.4}:br={:.4}:bg={:.4}:bb={:.4}",
                        1.0 - 0.607 * amount,
                        0.769 * amount,
                        0.189 * amount,
                        0.349 * amount,
                        1.0 - 0.314 * amount,
                        0.168 * amount,
                        0.272 * amount,
                        0.534 * amount,
                        1.0 - 0.869 * amount
                    ));
                }
            }
            "invert" => {
                let amount = effect_param_f64(effect, "amount", 100.0).clamp(0.0, 100.0) / 100.0;
                if amount > 0.0 {
                    filters.push(format!("negate=enable='lte({:.4},1)'", amount));
                }
            }
            "sharpen" | "unsharp-mask" => {
                let amount = effect_param_f64(effect, "amount", 50.0).clamp(0.0, 200.0) / 50.0;
                if amount > 0.0 {
                    filters.push(format!("unsharp=5:5:{:.3}:5:5:0.0", amount));
                }
            }
            "glow" => {
                let intensity = effect_param_f64(effect, "intensity", 50.0).clamp(0.0, 100.0);
                filters.push(format!(
                    "eq=brightness={:.4}:saturation={:.4}",
                    intensity / 300.0,
                    1.0 + intensity / 500.0
                ));
            }
            "mirror" => {
                let axis = effect_param_str(effect, "axis", "horizontal");
                if axis == "horizontal" || axis == "both" {
                    filters.push("hflip".to_string());
                }
                if axis == "vertical" || axis == "both" {
                    filters.push("vflip".to_string());
                }
            }
            "pixelate" => {
                let size = effect_param_f64(effect, "size", 10.0).clamp(2.0, 100.0);
                filters.push(format!(
                    "scale=iw/{0}:ih/{0}:flags=neighbor,scale=iw*{0}:ih*{0}:flags=neighbor",
                    size.round()
                ));
            }
            "text-overlay" => {
                let text = escape_drawtext_text(effect_param_str(effect, "text", "Text overlay"));
                if !text.trim().is_empty() {
                    let font_size = effect_param_f64(effect, "fontSize", 52.0).clamp(8.0, 180.0);
                    let x = effect_param_f64(effect, "x", 50.0).clamp(0.0, 100.0) / 100.0;
                    let y = effect_param_f64(effect, "y", 50.0).clamp(0.0, 100.0) / 100.0;
                    let color = ffmpeg_color(effect_param_str(effect, "color", "#ffffff"));
                    let background = ffmpeg_color(effect_param_str(effect, "background", "#000000"));
                    let background_opacity =
                        effect_param_f64(effect, "backgroundOpacity", 35.0).clamp(0.0, 100.0) / 100.0;
                    filters.push(format!(
                        "drawtext=text='{}':fontsize={:.0}:fontcolor={}:x=(w-text_w)*{:.4}:y=(h-text_h)*{:.4}:box=1:boxcolor={}@{:.3}:boxborderw=14",
                        text,
                        font_size,
                        color,
                        x,
                        y,
                        background,
                        background_opacity
                    ));
                }
            }
            _ => {}
        }
    }

    filters.join(",")
}

fn is_image_path(path: &str) -> bool {
    let lower = path.to_lowercase();
    lower.ends_with(".png")
        || lower.ends_with(".jpg")
        || lower.ends_with(".jpeg")
        || lower.ends_with(".webp")
        || lower.ends_with(".bmp")
        || lower.ends_with(".gif")
}

fn collect_render_clips(project: &serde_json::Value) -> Vec<RenderClip> {
    let mut clips = Vec::new();
    let mut timeline_effects: Vec<(f64, f64, serde_json::Value)> = Vec::new();

    if let Some(tracks) = project.get("tracks").and_then(|t| t.as_array()) {
        for track in tracks {
            let track_type = track.get("type").and_then(|t| t.as_str()).unwrap_or("");
            let muted = track
                .get("muted")
                .and_then(|m| m.as_bool())
                .unwrap_or(false);
            if track_type != "effect" || muted {
                continue;
            }

            if let Some(effects) = track.get("effects").and_then(|e| e.as_array()) {
                for effect in effects {
                    let start = value_f64(effect, "startTime", 0.0).max(0.0);
                    let duration = value_f64(effect, "duration", 0.0);
                    if duration > 0.0 {
                        timeline_effects.push((start, start + duration, effect.clone()));
                    }
                }
            }
        }

        for track in tracks {
            let track_type = track.get("type").and_then(|t| t.as_str()).unwrap_or("");
            let visible = track
                .get("visible")
                .and_then(|v| v.as_bool())
                .unwrap_or(true);
            let muted = track
                .get("muted")
                .and_then(|m| m.as_bool())
                .unwrap_or(false);
            let track_volume = value_f64(track, "volume", 1.0).clamp(0.0, 2.0);
            if muted || (track_type == "video" && !visible) {
                continue;
            }

            if track_type == "effect" {
                continue;
            }

            if let Some(track_clips) = track.get("clips").and_then(|c| c.as_array()) {
                for clip in track_clips {
                    let path = clip.get("path").and_then(|p| p.as_str()).unwrap_or("");
                    let media_type = clip.get("mediaType").and_then(|m| m.as_str()).unwrap_or("");
                    if path.is_empty()
                        || (media_type != "video" && media_type != "image" && media_type != "audio")
                    {
                        continue;
                    }

                    let duration = value_f64(clip, "duration", 0.0);
                    if duration <= 0.0 {
                        continue;
                    }

                    let clip_start = value_f64(clip, "startTime", 0.0).max(0.0);
                    let clip_end = clip_start + duration;
                    let mut boundaries = vec![clip_start, clip_end];
                    for (effect_start, effect_end, _) in &timeline_effects {
                        if *effect_start < clip_end && *effect_end > clip_start {
                            boundaries.push(effect_start.clamp(clip_start, clip_end));
                            boundaries.push(effect_end.clamp(clip_start, clip_end));
                        }
                    }
                    boundaries.sort_by(|a, b| a.partial_cmp(b).unwrap_or(std::cmp::Ordering::Equal));
                    boundaries.dedup_by(|a, b| (*a - *b).abs() < 0.0001);

                    let clip_effects = clip
                        .get("effects")
                        .and_then(|e| e.as_array())
                        .cloned()
                        .unwrap_or_default();
                    for effect in &clip_effects {
                        let Some(start_offset) = effect.get("startOffset").and_then(|v| v.as_f64()) else {
                            continue;
                        };
                        let effect_duration = value_f64(effect, "duration", duration);
                        let effect_start = clip_start + start_offset.clamp(0.0, duration);
                        let effect_end = (effect_start + effect_duration).clamp(clip_start, clip_end);
                        if effect_start < clip_end && effect_end > clip_start {
                            boundaries.push(effect_start);
                            boundaries.push(effect_end);
                            push_effect_keyframe_boundaries(
                                &mut boundaries,
                                effect,
                                effect_start,
                                effect_end,
                                clip_start,
                                clip_end,
                            );
                        }
                    }
                    boundaries.sort_by(|a, b| a.partial_cmp(b).unwrap_or(std::cmp::Ordering::Equal));
                    boundaries.dedup_by(|a, b| (*a - *b).abs() < 0.0001);
                    let base_in_point = value_f64(clip, "inPoint", 0.0).max(0.0);

                    for window in boundaries.windows(2) {
                        let segment_start = window[0];
                        let segment_end = window[1];
                        let segment_duration = segment_end - segment_start;
                        if segment_duration <= 0.0 {
                            continue;
                        }

                        let mut effects = Vec::new();
                        for effect in &clip_effects {
                            if let Some(start_offset) = effect.get("startOffset").and_then(|v| v.as_f64()) {
                                let effect_start = clip_start + start_offset.clamp(0.0, duration);
                                let effect_end =
                                    (effect_start + value_f64(effect, "duration", duration))
                                        .clamp(clip_start, clip_end);
                                if segment_start >= effect_start && segment_start < effect_end {
                                    effects.push(effect_with_animated_params(
                                        effect,
                                        (segment_start - clip_start - start_offset).max(0.0),
                                    ));
                                }
                            } else {
                                effects.push(effect_with_animated_params(effect, segment_start - clip_start));
                            }
                        }
                        for (effect_start, effect_end, effect) in &timeline_effects {
                            if segment_start >= *effect_start && segment_start < *effect_end {
                                effects.push(effect.clone());
                            }
                        }

                        let mut effective_scale = value_f64(clip, "scale", 1.0).clamp(0.1, 4.0);
                        let mut effective_position_x = value_f64(clip, "positionX", 0.0);
                        let mut effective_position_y = value_f64(clip, "positionY", 0.0);
                        for effect in &effects {
                            if !effect
                                .get("enabled")
                                .and_then(|e| e.as_bool())
                                .unwrap_or(true)
                            {
                                continue;
                            }
                            if effect.get("type").and_then(|t| t.as_str()) == Some("zoom-effect") {
                                let zoom_scale =
                                    (effect_param_f64(effect, "scale", 125.0) / 100.0).clamp(0.25, 4.0);
                                let center_x =
                                    effect_param_f64(effect, "centerX", 50.0).clamp(0.0, 100.0) / 100.0;
                                let center_y =
                                    effect_param_f64(effect, "centerY", 50.0).clamp(0.0, 100.0) / 100.0;
                                effective_scale *= zoom_scale;
                                effective_position_x += 2.0 * (0.5 - center_x) * (zoom_scale - 1.0);
                                effective_position_y += 2.0 * (0.5 - center_y) * (zoom_scale - 1.0);
                            }
                        }

                        clips.push(RenderClip {
                            path: path.to_string(),
                            media_type: media_type.to_string(),
                            track_type: track_type.to_string(),
                            start_time: segment_start,
                            duration: segment_duration,
                            in_point: base_in_point + (segment_start - clip_start),
                            opacity: value_f64(clip, "opacity", 1.0).clamp(0.0, 1.0),
                            volume: (value_f64(clip, "volume", 1.0) * track_volume).clamp(0.0, 4.0),
                            position_x: effective_position_x,
                            position_y: effective_position_y,
                            scale: effective_scale.clamp(0.1, 8.0),
                            effects,
                        });
                    }
                }
            }
        }
    }

    clips.sort_by(|a, b| {
        a.start_time
            .partial_cmp(&b.start_time)
            .unwrap_or(std::cmp::Ordering::Equal)
    });
    clips
}

fn codec_candidates(codec: &str) -> Vec<&'static str> {
    match codec {
        "h264" => vec!["h264_nvenc", "h264_qsv", "h264_amf", "libx264"],
        "h265" => vec!["hevc_nvenc", "hevc_qsv", "hevc_amf", "libx265"],
        "av1" => vec!["libaom-av1", "libx264"],
        "vp9" => vec!["libvpx-vp9", "libx264"],
        _ => vec!["libx264"],
    }
}

async fn media_has_audio(app: &AppHandle, path: &str) -> bool {
    let output = app.shell().sidecar("ffprobe").ok().and_then(|command| {
        Some(command.args([
            "-v",
            "error",
            "-select_streams",
            "a:0",
            "-show_entries",
            "stream=codec_type",
            "-of",
            "default=noprint_wrappers=1:nokey=1",
            path,
        ]))
    });

    if let Some(command) = output {
        if let Ok(result) = command.output().await {
            if result.status.success() {
                return String::from_utf8_lossy(&result.stdout).contains("audio");
            }
        }
    }

    false
}

#[tauri::command]
pub async fn ve_export_project(
    app: AppHandle,
    settings: serde_json::Value,
    project: serde_json::Value,
) -> Result<String, String> {
    let out_path = settings
        .get("outputPath")
        .and_then(|p| p.as_str())
        .unwrap_or("export.mp4")
        .to_string();
    let width = settings
        .get("width")
        .and_then(|v| v.as_u64())
        .unwrap_or(1920);
    let height = settings
        .get("height")
        .and_then(|v| v.as_u64())
        .unwrap_or(1080);
    let fps = settings
        .get("frameRate")
        .and_then(|v| v.as_f64())
        .unwrap_or(30.0);
    let v_codec = settings
        .get("videoCodec")
        .and_then(|v| v.as_str())
        .unwrap_or("h264")
        .to_string();
    let a_codec = settings
        .get("audioCodec")
        .and_then(|v| v.as_str())
        .unwrap_or("aac")
        .to_string();
    let audio_bitrate = settings
        .get("audioBitrate")
        .and_then(|v| v.as_u64())
        .unwrap_or(192);
    let sample_rate = settings
        .get("audioSampleRate")
        .and_then(|v| v.as_u64())
        .unwrap_or(48000);
    let mut duration = 5.0; // fallback duration

    if let Some(duration_val) = project.get("duration").and_then(|d| d.as_f64()) {
        duration = duration_val.max(0.1);
    }

    let render_clips = collect_render_clips(&project);

    let app_clone = app.clone();

    tauri::async_runtime::spawn(async move {
        let mut args = vec!["-y".to_string()];
        let mut clips_with_audio = Vec::new();

        args.push("-f".to_string());
        args.push("lavfi".to_string());
        args.push("-i".to_string());
        args.push(format!(
            "color=c=black:s={}x{}:r={}:d={}",
            width, height, fps, duration
        ));

        for clip in &render_clips {
            if clip.media_type == "image" || is_image_path(&clip.path) {
                args.push("-loop".to_string());
                args.push("1".to_string());
                args.push("-t".to_string());
                args.push(format!("{:.6}", clip.duration));
            } else {
                clips_with_audio.push(media_has_audio(&app_clone, &clip.path).await);
            }
            args.push("-i".to_string());
            args.push(clip.path.clone());
            if clip.media_type == "image" || is_image_path(&clip.path) {
                clips_with_audio.push(false);
            }
        }

        let mut filter_parts = vec!["[0:v]format=rgba[base0]".to_string()];
        let mut previous_label = "base0".to_string();

        let mut audio_labels: Vec<String> = Vec::new();

        for (idx, clip) in render_clips.iter().enumerate() {
            if clip.media_type == "audio" || clip.track_type == "audio" {
                continue;
            }

            let input_idx = idx + 1;
            let layer_label = format!("v{}", idx);
            let output_label = format!("base{}", idx + 1);
            let scaled_width = ((width as f64) * clip.scale).round().max(1.0) as u64;
            let scaled_height = ((height as f64) * clip.scale).round().max(1.0) as u64;
            let x_expr = format!("(W-w)/2+({:.6})*W/2", clip.position_x);
            let y_expr = format!("(H-h)/2+({:.6})*H/2", clip.position_y);
            let effect_chain = effect_filter_chain(&clip.effects);
            let effect_prefix = if effect_chain.is_empty() {
                String::new()
            } else {
                format!("{},", effect_chain)
            };

            let source_filter = if clip.media_type == "image" || is_image_path(&clip.path) {
                format!(
                    "[{}:v]{}scale={}:{}:force_original_aspect_ratio=decrease,pad={}:{}:(ow-iw)/2:(oh-ih)/2,setsar=1,format=rgba,colorchannelmixer=aa={:.6},setpts=PTS-STARTPTS+{:.6}/TB[{}]",
                    input_idx,
                    effect_prefix,
                    scaled_width,
                    scaled_height,
                    scaled_width,
                    scaled_height,
                    clip.opacity,
                    clip.start_time,
                    layer_label
                )
            } else {
                format!(
                    "[{}:v]trim=start={:.6}:duration={:.6},setpts=PTS-STARTPTS+{:.6}/TB,{}scale={}:{}:force_original_aspect_ratio=decrease,pad={}:{}:(ow-iw)/2:(oh-ih)/2,setsar=1,format=rgba,colorchannelmixer=aa={:.6}[{}]",
                    input_idx,
                    clip.in_point,
                    clip.duration,
                    clip.start_time,
                    effect_prefix,
                    scaled_width,
                    scaled_height,
                    scaled_width,
                    scaled_height,
                    clip.opacity,
                    layer_label
                )
            };

            filter_parts.push(source_filter);
            filter_parts.push(format!(
                "[{}][{}]overlay=x='{}':y='{}':enable='between(t,{:.6},{:.6})':eof_action=pass[{}]",
                previous_label,
                layer_label,
                x_expr,
                y_expr,
                clip.start_time,
                clip.start_time + clip.duration,
                output_label
            ));
            previous_label = output_label;
        }

        for (idx, clip) in render_clips.iter().enumerate() {
            if clip.media_type == "image" || is_image_path(&clip.path) {
                continue;
            }
            if !clips_with_audio.get(idx).copied().unwrap_or(false) {
                continue;
            }

            let input_idx = idx + 1;
            let label = format!("a{}", idx);
            let delay_ms = (clip.start_time * 1000.0).round().max(0.0) as u64;
            filter_parts.push(format!(
                "[{}:a]atrim=start={:.6}:duration={:.6},asetpts=PTS-STARTPTS,volume={:.6},adelay={}:all=1[{}]",
                input_idx,
                clip.in_point,
                clip.duration,
                clip.volume,
                delay_ms,
                label
            ));
            audio_labels.push(label);
        }

        if !audio_labels.is_empty() {
            if audio_labels.len() == 1 {
                filter_parts.push(format!(
                    "[{}]apad,atrim=0:{:.6},aresample={}[outa]",
                    audio_labels[0], duration, sample_rate
                ));
            } else {
                let inputs = audio_labels
                    .iter()
                    .map(|label| format!("[{}]", label))
                    .collect::<String>();
                filter_parts.push(format!("{}amix=inputs={}:duration=longest:dropout_transition=0,apad,atrim=0:{:.6},aresample={}[outa]", inputs, audio_labels.len(), duration, sample_rate));
            }
        }

        filter_parts.push(format!(
            "[{}]fps={},format=yuv420p[outv]",
            previous_label, fps
        ));

        args.push("-filter_complex".to_string());
        args.push(filter_parts.join(";"));
        args.push("-map".to_string());
        args.push("[outv]".to_string());
        if !audio_labels.is_empty() {
            args.push("-map".to_string());
            args.push("[outa]".to_string());
        }

        if render_clips.is_empty() {
            args.push("-f".to_string());
            args.push("mp4".to_string());
        }

        args.push("-t".to_string());
        args.push(format!("{:.6}", duration));
        args.push("-movflags".to_string());
        args.push("+faststart".to_string());

        let mut success = false;

        for codec in codec_candidates(&v_codec) {
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

            if !audio_labels.is_empty() {
                current_args.push("-c:a".to_string());
                current_args.push(a_codec.clone());
                current_args.push("-b:a".to_string());
                current_args.push(format!("{}k", audio_bitrate));
                current_args.push("-ar".to_string());
                current_args.push(sample_rate.to_string());
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
                                            let mut progress =
                                                (current_time / duration * 100.0) as u32;
                                            if progress > 100 {
                                                progress = 100;
                                            }
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
    use serde_json::json;
    use std::time::{SystemTime, UNIX_EPOCH};

    fn temp_project_path(name: &str) -> String {
        let stamp = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .expect("system clock should be after unix epoch")
            .as_nanos();
        std::env::temp_dir()
            .join(format!("dawndesk-{name}-{stamp}.json"))
            .to_string_lossy()
            .to_string()
    }

    #[tokio::test]
    async fn test_ve_generate_waveform() {
        // It's a simulated function but let's test if it returns exactly 100 length vector
        let path = "dummy_path.mp4".to_string();

        let waveform_result = ve_generate_waveform(path).await;
        assert!(waveform_result.is_ok());
        let peaks = waveform_result.unwrap();
        assert_eq!(peaks.len(), 100);
        assert!(peaks.iter().all(|peak| (0.2..=1.0).contains(peak)));
        assert!(peaks.windows(2).any(|pair| (pair[0] - pair[1]).abs() > f32::EPSILON));
    }

    #[tokio::test]
    async fn save_and_load_project_round_trips_exact_json() {
        let path = temp_project_path("video-project");
        let project_data = r#"{"name":"Cut 01","tracks":[{"type":"video","clips":[]}]}"#.to_string();

        ve_save_project(path.clone(), project_data.clone())
            .await
            .expect("project save should succeed");
        let loaded = ve_load_project(path.clone())
            .await
            .expect("project load should succeed");

        assert_eq!(loaded, project_data);
        let _ = fs::remove_file(path);
    }

    #[tokio::test]
    async fn load_project_reports_missing_file_errors() {
        let missing_path = temp_project_path("missing-video-project");
        let result = ve_load_project(missing_path).await;

        assert!(result.is_err());
    }

    #[tokio::test]
    async fn import_media_command_points_to_frontend_dialog() {
        let result = ve_import_media().await;

        assert_eq!(result.unwrap_err(), "Use frontend dialog plugin instead");
    }

    #[test]
    fn image_path_detection_is_case_insensitive_and_limited_to_supported_formats() {
        assert!(is_image_path("cover.PNG"));
        assert!(is_image_path("photo.JpEg"));
        assert!(is_image_path("frame.webp"));
        assert!(is_image_path("scan.BMP"));
        assert!(is_image_path("animation.gif"));
        assert!(!is_image_path("movie.mp4"));
        assert!(!is_image_path("archive.png.zip"));
    }

    #[test]
    fn codec_candidates_prefer_accelerated_codecs_before_software_fallbacks() {
        assert_eq!(codec_candidates("h264").last(), Some(&"libx264"));
        assert_eq!(codec_candidates("h265").last(), Some(&"libx265"));
        assert_eq!(codec_candidates("av1"), vec!["libaom-av1", "libx264"]);
        assert_eq!(codec_candidates("unknown"), vec!["libx264"]);
    }

    #[test]
    fn effect_filter_chain_clamps_values_and_skips_disabled_effects() {
        let effects = vec![
            json!({
                "type": "gaussian-blur",
                "enabled": true,
                "params": [{ "key": "radius", "value": 250.0 }]
            }),
            json!({
                "type": "brightness-contrast",
                "params": [
                    { "key": "brightness", "value": -150.0 },
                    { "key": "contrast", "value": 250.0 }
                ]
            }),
            json!({
                "type": "mirror",
                "enabled": false,
                "params": [{ "key": "axis", "value": "both" }]
            }),
            json!({
                "type": "pixelate",
                "params": [{ "key": "size", "value": 1.0 }]
            }),
        ];

        let chain = effect_filter_chain(&effects);

        assert!(chain.contains("gblur=sigma=100.000"));
        assert!(chain.contains("eq=brightness=-1.0000:contrast=2.0000"));
        assert!(chain.contains("scale=iw/2:ih/2:flags=neighbor"));
        assert!(!chain.contains("hflip"));
        assert!(!chain.contains("vflip"));
    }

    #[test]
    fn collect_render_clips_filters_invalid_tracks_and_applies_defaults() {
        let project = json!({
            "tracks": [
                {
                    "type": "video",
                    "visible": false,
                    "clips": [
                        { "path": "hidden.mp4", "mediaType": "video", "duration": 5.0 }
                    ]
                },
                {
                    "type": "audio",
                    "muted": false,
                    "volume": 0.5,
                    "clips": [
                        {
                            "path": "voice.wav",
                            "mediaType": "audio",
                            "startTime": -5.0,
                            "duration": 3.0,
                            "inPoint": -2.0,
                            "volume": 1.5
                        },
                        {
                            "path": "bad.mov",
                            "mediaType": "video",
                            "duration": 0.0
                        }
                    ]
                },
                {
                    "type": "video",
                    "clips": [
                        {
                            "path": "image.png",
                            "mediaType": "image",
                            "startTime": 8.0,
                            "duration": 4.0,
                            "opacity": 3.0,
                            "scale": 8.0,
                            "positionX": 0.25,
                            "positionY": -0.5
                        },
                        {
                            "path": "",
                            "mediaType": "image",
                            "duration": 1.0
                        }
                    ]
                }
            ]
        });

        let clips = collect_render_clips(&project);

        assert_eq!(clips.len(), 2);
        assert_eq!(clips[0].path, "voice.wav");
        assert_eq!(clips[0].start_time, 0.0);
        assert_eq!(clips[0].in_point, 0.0);
        assert_eq!(clips[0].volume, 0.75);
        assert_eq!(clips[1].path, "image.png");
        assert_eq!(clips[1].opacity, 1.0);
        assert_eq!(clips[1].scale, 4.0);
        assert_eq!(clips[1].position_x, 0.25);
        assert_eq!(clips[1].position_y, -0.5);
    }
}
