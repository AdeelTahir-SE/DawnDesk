use kalosm::language::*;
use serde::Serialize;
use tauri::{AppHandle, Emitter};

#[derive(Serialize, Clone)]
struct ModelProgressEvent {
    stage: String,
    message: String,
    done_percent: Option<f64>,
    remaining_percent: Option<f64>,
}

#[tauri::command]
pub async fn generate_response(app: AppHandle, input: String) -> Result<String, String> {
    if input.trim().is_empty() {
        return Err("Prompt cannot be empty".to_string());
    }

    let _ = app.emit(
        "ai://model-progress",
        ModelProgressEvent {
            stage: "start".to_string(),
            message: "Starting model load".to_string(),
            done_percent: None,
            remaining_percent: None,
        },
    );

    let app_for_progress = app.clone();

    let model = Llama::builder()
        // Smaller model to reduce download size and startup time.
        .with_source(LlamaSource::tiny_llama_1_1b_chat())
        .build_with_loading_handler(move |progress| match progress {
            ModelLoadingProgress::Downloading { source, progress } => {
                let downloaded_bytes = progress.progress.saturating_sub(progress.cached_size);
                let downloaded = if progress.size == 0 {
                    0.0
                } else {
                    (downloaded_bytes as f64 / progress.size as f64) * 100.0
                }
                .clamp(0.0, 100.0);
                let remaining = (100.0_f64 - downloaded).clamp(0.0, 100.0);
                let elapsed = progress.start_time.elapsed().as_secs_f32();
                let _ = app_for_progress.emit(
                    "ai://model-progress",
                    ModelProgressEvent {
                        stage: "download".to_string(),
                        message: format!(
                            "Downloading {source}: {:.1}% done, {:.1}% remaining ({elapsed:.1}s)",
                            downloaded, remaining
                        ),
                        done_percent: Some(downloaded),
                        remaining_percent: Some(remaining),
                    },
                );
            }
            ModelLoadingProgress::Loading { progress } => {
                let loaded = (progress as f64 * 100.0).clamp(0.0, 100.0);
                let remaining = (100.0_f64 - loaded).clamp(0.0, 100.0);
                let _ = app_for_progress.emit(
                    "ai://model-progress",
                    ModelProgressEvent {
                        stage: "loading".to_string(),
                        message: format!(
                            "Loading model into memory: {:.1}% done, {:.1}% remaining",
                            loaded, remaining
                        ),
                        done_percent: Some(loaded),
                        remaining_percent: Some(remaining),
                    },
                );
            }
        })
        .await
        .map_err(|e| {
            let message = format!("Failed to load model: {e}");
            let _ = app.emit(
                "ai://model-progress",
                ModelProgressEvent {
                    stage: "error".to_string(),
                    message: message.clone(),
                    done_percent: None,
                    remaining_percent: None,
                },
            );
            message
        })?;

    let mut chat = model
        .chat()
        .with_system_prompt("You are a helpful assistant.");

    let mut response = chat(input.trim());
    let text = response.all_text().await;

    if text.trim().is_empty() {
        let message = "Model returned an empty response".to_string();
        let _ = app.emit(
            "ai://model-progress",
            ModelProgressEvent {
                stage: "error".to_string(),
                message: message.clone(),
                done_percent: None,
                remaining_percent: None,
            },
        );
        return Err(message);
    }

    let _ = app.emit(
        "ai://model-progress",
        ModelProgressEvent {
            stage: "done".to_string(),
            message: "Inference complete".to_string(),
            done_percent: Some(100.0),
            remaining_percent: Some(0.0),
        },
    );

    Ok(text)
}
