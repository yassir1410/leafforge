use serde::Serialize;
use crate::models::error::LeafForgeError;
use crate::models::project::LaTeXEnvironment;
use crate::services::LaTeXDetector;

#[derive(Debug, Serialize)]
pub struct SystemInfo {
    pub os: String,
    pub arch: String,
    pub host: String,
}

#[tauri::command]
pub async fn detect_latex_tools() -> Result<LaTeXEnvironment, LeafForgeError> {
    Ok(LaTeXDetector::detect_tools())
}

#[tauri::command]
pub async fn get_system_info() -> Result<SystemInfo, LeafForgeError> {
    Ok(SystemInfo {
        os: std::env::consts::OS.to_string(),
        arch: std::env::consts::ARCH.to_string(),
        host: "Fedora Linux / GNOME Wayland".to_string(),
    })
}
