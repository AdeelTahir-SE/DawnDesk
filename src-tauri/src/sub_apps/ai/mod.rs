use kalosm::language::*;
use serde::Serialize;
use std::path::PathBuf;
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

    let _ = app.emit(
        "ai://model-progress",
        ModelProgressEvent {stage: "loading".to_string(),
            message: "Loading Llama 3.1 8B chat model...".to_string(),
            done_percent: Some(50.0),
            remaining_percent: Some(50.0),
        },
    );

    let model = Llama::new_chat()
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
