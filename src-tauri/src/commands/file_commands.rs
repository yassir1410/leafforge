use std::path::Path;
use crate::models::error::LeafForgeError;
use crate::models::project::FileNode;
use crate::services::FileService;

#[tauri::command]
pub async fn list_project_files(project_root: String) -> Result<FileNode, LeafForgeError> {
    let root = Path::new(&project_root);
    FileService::list_project_files(root)
}

#[tauri::command]
pub async fn read_file_content(
    project_root: String,
    file_path: String,
) -> Result<String, LeafForgeError> {
    let root = Path::new(&project_root);
    let path = Path::new(&file_path);
    FileService::read_file(root, path)
}

#[tauri::command]
pub async fn write_file_content(
    project_root: String,
    file_path: String,
    content: String,
) -> Result<(), LeafForgeError> {
    let root = Path::new(&project_root);
    let path = Path::new(&file_path);
    FileService::write_file(root, path, &content)
}

#[tauri::command]
pub async fn create_file(
    project_root: String,
    file_path: String,
    initial_content: Option<String>,
) -> Result<String, LeafForgeError> {
    let root = Path::new(&project_root);
    let path = Path::new(&file_path);
    let created = FileService::create_file(root, path, initial_content.as_deref())?;
    Ok(created.to_string_lossy().to_string())
}

#[tauri::command]
pub async fn create_directory(
    project_root: String,
    dir_path: String,
) -> Result<String, LeafForgeError> {
    let root = Path::new(&project_root);
    let path = Path::new(&dir_path);
    let created = FileService::create_directory(root, path)?;
    Ok(created.to_string_lossy().to_string())
}

#[tauri::command]
pub async fn rename_node(
    project_root: String,
    old_path: String,
    new_name: String,
) -> Result<String, LeafForgeError> {
    let root = Path::new(&project_root);
    let path = Path::new(&old_path);
    let renamed = FileService::rename_node(root, path, &new_name)?;
    Ok(renamed.to_string_lossy().to_string())
}

#[tauri::command]
pub async fn delete_node(
    project_root: String,
    target_path: String,
) -> Result<(), LeafForgeError> {
    let root = Path::new(&project_root);
    let path = Path::new(&target_path);
    FileService::delete_node(root, path)
}
