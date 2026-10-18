use std::fs::{self, File};
use std::io::Write;
use std::path::{Path, PathBuf};
use crate::models::error::LeafForgeError;
use crate::models::project::FileNode;
use crate::security::PathGuard;

pub struct FileService;

const MAX_READ_BYTES: u64 = 15 * 1024 * 1024; // 15MB max file read

impl FileService {
    /// Builds a hierarchical FileNode tree of the project directory
    pub fn list_project_files(project_root: &Path) -> Result<FileNode, LeafForgeError> {
        let canonical_root = project_root
            .canonicalize()
            .map_err(|e| LeafForgeError::Io(format!("Invalid project root: {e}")))?;

        Self::build_tree(&canonical_root, &canonical_root)
    }

    fn build_tree(root: &Path, current: &Path) -> Result<FileNode, LeafForgeError> {
        let name = current
            .file_name()
            .and_then(|n| n.to_str())
            .unwrap_or("")
            .to_string();

        let rel_path = current
            .strip_prefix(root)
            .unwrap_or(Path::new(""))
            .to_string_lossy()
            .to_string();

        let metadata = fs::symlink_metadata(current)
            .map_err(|e| LeafForgeError::Io(format!("Failed to read metadata for {}: {e}", current.display())))?;

        let is_dir = metadata.is_dir();
        let extension = if is_dir {
            None
        } else {
            current.extension().and_then(|e| e.to_str()).map(|s| s.to_lowercase())
        };

        let mut children = None;
        if is_dir {
            let mut child_nodes = Vec::new();
            if let Ok(entries) = fs::read_dir(current) {
                for entry in entries.flatten() {
                    let entry_name = entry.file_name().to_string_lossy().to_string();
                    // Skip hidden directories like .git
                    if entry_name.starts_with('.') && entry_name == ".git" {
                        continue;
                    }
                    let child_path = entry.path();
                    if let Ok(child_node) = Self::build_tree(root, &child_path) {
                        child_nodes.push(child_node);
                    }
                }
            }

            // Sort: directories first, then alphabetically
            child_nodes.sort_by(|a, b| {
                match (a.is_dir, b.is_dir) {
                    (true, false) => std::cmp::Ordering::Less,
                    (false, true) => std::cmp::Ordering::Greater,
                    _ => a.name.to_lowercase().cmp(&b.name.to_lowercase()),
                }
            });

            children = Some(child_nodes);
        }

        Ok(FileNode {
            id: current.to_string_lossy().to_string(),
            name,
            path: current.to_string_lossy().to_string(),
            relative_path: rel_path,
            is_dir,
            extension,
            size: if is_dir { None } else { Some(metadata.len()) },
            children,
        })
    }

    /// Reads UTF-8 content of a file within the project
    pub fn read_file(project_root: &Path, file_path: &Path) -> Result<String, LeafForgeError> {
        let validated_path = PathGuard::validate_within_project(project_root, file_path)?;

        if !validated_path.is_file() {
            return Err(LeafForgeError::NotFound(format!(
                "Path is not a regular file: {}",
                validated_path.display()
            )));
        }

        let metadata = fs::metadata(&validated_path)?;
        if metadata.len() > MAX_READ_BYTES {
            return Err(LeafForgeError::Security(format!(
                "File size exceeds maximum readable limit ({} MB)",
                MAX_READ_BYTES / (1024 * 1024)
            )));
        }

        fs::read_to_string(&validated_path).map_err(|e| {
            LeafForgeError::Io(format!(
                "Could not read file as UTF-8 (it may be a binary file): {e}"
            ))
        })
    }

    /// Performs atomic write to file to prevent corruption on crash
    pub fn write_file(
        project_root: &Path,
        file_path: &Path,
        content: &str,
    ) -> Result<(), LeafForgeError> {
        let validated_path = PathGuard::validate_for_write(project_root, file_path)?;

        let parent_dir = validated_path
            .parent()
            .ok_or_else(|| LeafForgeError::InvalidPath("Cannot get parent directory".to_string()))?;

        if !parent_dir.exists() {
            fs::create_dir_all(parent_dir)?;
        }

        // Create atomic temp file in same directory
        let mut temp_file = tempfile::Builder::new()
            .prefix(".leafforge_tmp_")
            .tempfile_in(parent_dir)
            .map_err(|e| LeafForgeError::Io(format!("Failed to create temporary file: {e}")))?;

        temp_file
            .write_all(content.as_bytes())
            .map_err(|e| LeafForgeError::Io(format!("Failed to write to temp file: {e}")))?;

        temp_file
            .flush()
            .map_err(|e| LeafForgeError::Io(format!("Failed to flush temp file: {e}")))?;

        temp_file
            .persist(&validated_path)
            .map_err(|e| LeafForgeError::Io(format!("Failed to atomically persist file: {e}")))?;

        Ok(())
    }

    /// Creates a new file safely within the project
    pub fn create_file(
        project_root: &Path,
        target_path: &Path,
        initial_content: Option<&str>,
    ) -> Result<PathBuf, LeafForgeError> {
        let validated_path = PathGuard::validate_for_write(project_root, target_path)?;

        if validated_path.exists() {
            return Err(LeafForgeError::Project(format!(
                "File already exists: {}",
                validated_path.display()
            )));
        }

        if let Some(parent) = validated_path.parent() {
            if !parent.exists() {
                fs::create_dir_all(parent)?;
            }
        }

        let mut file = File::create(&validated_path)
            .map_err(|e| LeafForgeError::Io(format!("Failed to create file: {e}")))?;

        if let Some(content) = initial_content {
            file.write_all(content.as_bytes())?;
        }

        Ok(validated_path)
    }

    /// Creates a new directory safely within the project
    pub fn create_directory(
        project_root: &Path,
        target_path: &Path,
    ) -> Result<PathBuf, LeafForgeError> {
        let validated_path = PathGuard::validate_within_project(project_root, target_path)?;

        if validated_path.exists() {
            return Err(LeafForgeError::Project(format!(
                "Directory already exists: {}",
                validated_path.display()
            )));
        }

        fs::create_dir_all(&validated_path)
            .map_err(|e| LeafForgeError::Io(format!("Failed to create directory: {e}")))?;

        Ok(validated_path)
    }

    /// Renames a file or directory within the project
    pub fn rename_node(
        project_root: &Path,
        old_path: &Path,
        new_name: &str,
    ) -> Result<PathBuf, LeafForgeError> {
        PathGuard::is_safe_node_name(new_name)?;
        let validated_old = PathGuard::validate_for_destructive_action(project_root, old_path)?;

        if !validated_old.exists() {
            return Err(LeafForgeError::NotFound(format!(
                "Path does not exist: {}",
                validated_old.display()
            )));
        }

        let parent = validated_old
            .parent()
            .ok_or_else(|| LeafForgeError::InvalidPath("Cannot get parent directory".to_string()))?;

        let new_path = parent.join(new_name);
        let validated_new = PathGuard::validate_within_project(project_root, &new_path)?;

        if validated_new.exists() {
            return Err(LeafForgeError::Project(format!(
                "Target name already exists: {}",
                validated_new.display()
            )));
        }

        fs::rename(&validated_old, &validated_new)
            .map_err(|e| LeafForgeError::Io(format!("Failed to rename: {e}")))?;

        Ok(validated_new)
    }

    /// Deletes a file or directory within the project
    pub fn delete_node(project_root: &Path, target_path: &Path) -> Result<(), LeafForgeError> {
        let validated_path = PathGuard::validate_for_destructive_action(project_root, target_path)?;

        if !validated_path.exists() {
            return Err(LeafForgeError::NotFound(format!(
                "Target does not exist: {}",
                validated_path.display()
            )));
        }

        if validated_path.is_dir() {
            fs::remove_dir_all(&validated_path)
                .map_err(|e| LeafForgeError::Io(format!("Failed to delete directory: {e}")))?;
        } else {
            fs::remove_file(&validated_path)
                .map_err(|e| LeafForgeError::Io(format!("Failed to delete file: {e}")))?;
        }

        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::tempdir;

    #[test]
    fn test_list_and_read_write_atomic() {
        let dir = tempdir().unwrap();
        let root = dir.path();

        let test_file = root.join("test.tex");
        FileService::write_file(root, &test_file, "\\section{Hello}").unwrap();

        let content = FileService::read_file(root, &test_file).unwrap();
        assert_eq!(content, "\\section{Hello}");

        let tree = FileService::list_project_files(root).unwrap();
        assert_eq!(tree.children.unwrap().len(), 1);
    }

    #[test]
    fn test_create_and_delete_node() {
        let dir = tempdir().unwrap();
        let root = dir.path();

        let subfolder = root.join("chapters");
        FileService::create_directory(root, &subfolder).unwrap();
        assert!(subfolder.exists());

        let file = subfolder.join("ch1.tex");
        FileService::create_file(root, &file, Some("chapter 1")).unwrap();
        assert!(file.exists());

        FileService::delete_node(root, &file).unwrap();
        assert!(!file.exists());
    }

    #[test]
    fn test_rename_node() {
        let dir = tempdir().unwrap();
        let root = dir.path();

        let file = root.join("old.tex");
        FileService::create_file(root, &file, Some("content")).unwrap();

        let new_file = FileService::rename_node(root, &file, "new.tex").unwrap();
        assert!(!file.exists());
        assert!(new_file.exists());
    }
}
