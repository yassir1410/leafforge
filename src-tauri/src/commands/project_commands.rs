use std::path::Path;
use crate::models::error::LeafForgeError;
use crate::models::project::{ProjectInfo, RecentProject};
use crate::security::ActiveProjectRegistry;
use crate::services::ProjectService;

#[tauri::command]
pub async fn create_project(
    project_path: String,
    project_name: Option<String>,
    registry: tauri::State<'_, ActiveProjectRegistry>,
) -> Result<ProjectInfo, LeafForgeError> {
    let path = Path::new(&project_path);
    let info = ProjectService::create_project(path, project_name.as_deref())?;
    registry.register_project(Path::new(&info.path))?;
    Ok(info)
}

#[tauri::command]
pub async fn open_project(
    project_path: String,
    registry: tauri::State<'_, ActiveProjectRegistry>,
) -> Result<ProjectInfo, LeafForgeError> {
    let path = Path::new(&project_path);
    let info = ProjectService::open_project(path)?;
    registry.register_project(Path::new(&info.path))?;
    Ok(info)
}

#[tauri::command]
pub async fn list_recent_projects() -> Result<Vec<RecentProject>, LeafForgeError> {
    Ok(ProjectService::list_recent_projects())
}
