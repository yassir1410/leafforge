use std::path::Path;
use crate::models::error::LeafForgeError;
use crate::models::project::{ProjectInfo, RecentProject};
use crate::services::ProjectService;

#[tauri::command]
pub async fn create_project(
    project_path: String,
    project_name: Option<String>,
) -> Result<ProjectInfo, LeafForgeError> {
    let path = Path::new(&project_path);
    ProjectService::create_project(path, project_name.as_deref())
}

#[tauri::command]
pub async fn open_project(project_path: String) -> Result<ProjectInfo, LeafForgeError> {
    let path = Path::new(&project_path);
    ProjectService::open_project(path)
}

#[tauri::command]
pub async fn list_recent_projects() -> Result<Vec<RecentProject>, LeafForgeError> {
    Ok(ProjectService::list_recent_projects())
}
