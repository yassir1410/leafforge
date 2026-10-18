use std::fs;
use std::path::{Component, Path, PathBuf};
use crate::models::error::LeafForgeError;

pub struct PathGuard;

impl PathGuard {
    /// Validates that a target path (whether absolute or relative) is strictly contained
    /// within the canonicalized project root directory.
    /// Handles existing paths and paths yet to be created.
    /// Rejects directory traversal attacks (../), symlink escapes, and null bytes.
    pub fn validate_within_project(
        project_root: &Path,
        target_path: &Path,
    ) -> Result<PathBuf, LeafForgeError> {
        let canonical_root = project_root
            .canonicalize()
            .map_err(|e| LeafForgeError::Project(format!("Invalid project root: {e}")))?;

        let full_path = if target_path.is_absolute() {
            target_path.to_path_buf()
        } else {
            canonical_root.join(target_path)
        };

        // If target exists, canonicalize directly (resolves all symlinks)
        if full_path.exists() {
            let canonical_target = full_path
                .canonicalize()
                .map_err(|e| LeafForgeError::Io(format!("Failed to canonicalize path: {e}")))?;

            if canonical_target.starts_with(&canonical_root) {
                Ok(canonical_target)
            } else {
                Err(LeafForgeError::Security(
                    "Access denied: path resolves outside of project root".to_string(),
                ))
            }
        } else {
            // Path does not exist yet (e.g. creating a new file)
            // Ensure no dangerous components like ParentDir ('..') in the relative part
            Self::normalize_and_validate_nonexistent(&canonical_root, &full_path)
        }
    }

    /// Validates that a target path is strictly within the project and is safe for writing.
    /// Explicitly forbids writing through symlinks to prevent TOCTOU symlink attacks.
    pub fn validate_for_write(
        project_root: &Path,
        target_path: &Path,
    ) -> Result<PathBuf, LeafForgeError> {
        let canonical_root = project_root
            .canonicalize()
            .map_err(|e| LeafForgeError::Project(format!("Invalid project root: {e}")))?;

        let full_path = if target_path.is_absolute() {
            target_path.to_path_buf()
        } else {
            canonical_root.join(target_path)
        };

        // If target or symlink exists on disk, check if it is a symlink via symlink_metadata
        if let Ok(meta) = fs::symlink_metadata(&full_path) {
            if meta.file_type().is_symlink() {
                return Err(LeafForgeError::Security(
                    "Access denied: writing through symlinks is forbidden for security".to_string(),
                ));
            }
        }

        let validated = Self::validate_within_project(project_root, target_path)?;
        Ok(validated)
    }

    /// Validates that a target node is safe to be deleted or renamed.
    /// Prevents deleting or renaming the project root, .git, or system files.
    pub fn validate_for_destructive_action(
        project_root: &Path,
        target_path: &Path,
    ) -> Result<PathBuf, LeafForgeError> {
        let canonical_root = project_root
            .canonicalize()
            .map_err(|e| LeafForgeError::Project(format!("Invalid project root: {e}")))?;

        let validated = Self::validate_within_project(project_root, target_path)?;

        // 1. Never allow deleting or renaming the project root itself
        if validated == canonical_root {
            return Err(LeafForgeError::Security(
                "Access denied: cannot delete or rename the project root directory".to_string(),
            ));
        }

        // 2. Never allow deleting or renaming the .git repository directory or its files
        if let Ok(rel) = validated.strip_prefix(&canonical_root) {
            if let Some(first_component) = rel.components().next() {
                if first_component.as_os_str() == ".git" {
                    return Err(LeafForgeError::Security(
                        "Access denied: cannot modify or delete files inside .git repository".to_string(),
                    ));
                }
            }
        }

        Ok(validated)
    }

    /// Normalizes and checks a path that may not yet exist on disk
    fn normalize_and_validate_nonexistent(
        canonical_root: &Path,
        full_path: &Path,
    ) -> Result<PathBuf, LeafForgeError> {
        // Find existing parent
        let mut curr = full_path.to_path_buf();
        let mut uncreated_parts: Vec<std::ffi::OsString> = Vec::new();

        while !curr.exists() {
            if let Some(file_name) = curr.file_name() {
                // Reject invalid filename characters
                let name_str = file_name.to_string_lossy();
                if name_str.is_empty() || name_str == "." || name_str == ".." || name_str.contains('\0') {
                    return Err(LeafForgeError::InvalidPath(
                        "Invalid path component in target path".to_string(),
                    ));
                }
                uncreated_parts.push(file_name.to_os_string());
                match curr.parent() {
                    Some(parent) => curr = parent.to_path_buf(),
                    None => {
                        return Err(LeafForgeError::InvalidPath(
                            "Cannot determine root of target path".to_string(),
                        ));
                    }
                }
            } else {
                return Err(LeafForgeError::InvalidPath(
                    "Invalid path structure".to_string(),
                ));
            }
        }

        // Canonicalize the existing ancestor (which resolves symlinks in existing ancestors)
        let canonical_ancestor = curr
            .canonicalize()
            .map_err(|e| LeafForgeError::Io(format!("Failed to canonicalize ancestor: {e}")))?;

        if !canonical_ancestor.starts_with(canonical_root) {
            return Err(LeafForgeError::Security(
                "Access denied: path ancestor resolves outside of project root".to_string(),
            ));
        }

        // Reconstruct path downwards
        let mut result = canonical_ancestor;
        for part in uncreated_parts.iter().rev() {
            result.push(part);
        }

        // Final check: normalize components to ensure no '..' sneaked through
        let mut normalized = PathBuf::new();
        for component in result.components() {
            match component {
                Component::ParentDir => {
                    return Err(LeafForgeError::Security(
                        "Access denied: path traversal detected".to_string(),
                    ));
                }
                Component::Normal(c) => normalized.push(c),
                Component::RootDir => normalized.push("/"),
                Component::Prefix(p) => normalized.push(p.as_os_str()),
                Component::CurDir => {}
            }
        }

        if normalized.starts_with(canonical_root) {
            Ok(normalized)
        } else {
            Err(LeafForgeError::Security(
                "Access denied: reconstructed path is outside project root".to_string(),
            ))
        }
    }

    /// Validates single file/directory name for safety
    pub fn is_safe_node_name(name: &str) -> Result<(), LeafForgeError> {
        let trimmed = name.trim();
        if trimmed.is_empty() {
            return Err(LeafForgeError::InvalidPath("Name cannot be empty".to_string()));
        }
        if trimmed == "." || trimmed == ".." {
            return Err(LeafForgeError::Security(
                "Directory traversal names are not allowed".to_string(),
            ));
        }
        if trimmed == ".git" {
            return Err(LeafForgeError::Security(
                "Cannot use protected .git name".to_string(),
            ));
        }
        if trimmed.contains('/') || trimmed.contains('\\') || trimmed.contains('\0') {
            return Err(LeafForgeError::InvalidPath(
                "Name cannot contain path separators or null bytes".to_string(),
            ));
        }
        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::tempdir;
    use std::fs::{self, File};

    #[test]
    fn test_valid_file_within_project() {
        let dir = tempdir().unwrap();
        let project_root = dir.path();
        let file_path = project_root.join("main.tex");
        File::create(&file_path).unwrap();

        let validated = PathGuard::validate_within_project(project_root, &file_path).unwrap();
        assert_eq!(validated, file_path.canonicalize().unwrap());
    }

    #[test]
    fn test_relative_path_within_project() {
        let dir = tempdir().unwrap();
        let project_root = dir.path();
        let file_path = project_root.join("chapter1.tex");
        File::create(&file_path).unwrap();

        let rel = Path::new("chapter1.tex");
        let validated = PathGuard::validate_within_project(project_root, rel).unwrap();
        assert_eq!(validated, file_path.canonicalize().unwrap());
    }

    #[test]
    fn test_path_traversal_prevention() {
        let dir = tempdir().unwrap();
        let project_root = dir.path();
        let evil_path = project_root.join("../outside.tex");

        let result = PathGuard::validate_within_project(project_root, &evil_path);
        assert!(result.is_err());
    }

    #[test]
    fn test_symlink_escape_prevention() {
        let dir = tempdir().unwrap();
        let outside_dir = tempdir().unwrap();
        let secret_file = outside_dir.path().join("secret.txt");
        fs::write(&secret_file, "secret").unwrap();

        let project_root = dir.path();
        let symlink_path = project_root.join("symlink_to_secret.txt");

        #[cfg(unix)]
        {
            std::os::unix::fs::symlink(&secret_file, &symlink_path).unwrap();
            let result = PathGuard::validate_within_project(project_root, &symlink_path);
            assert!(result.is_err(), "Symlink escape outside project root must fail");
        }
    }

    #[test]
    fn test_symlink_write_forbidden() {
        let dir = tempdir().unwrap();
        let project_root = dir.path();
        let real_file = project_root.join("real.tex");
        fs::write(&real_file, "hello").unwrap();

        let symlink_file = project_root.join("symlink.tex");
        #[cfg(unix)]
        {
            std::os::unix::fs::symlink(&real_file, &symlink_file).unwrap();
            let result = PathGuard::validate_for_write(project_root, &symlink_file);
            assert!(result.is_err(), "Writing through symlink must be rejected");
        }
    }

    #[test]
    fn test_destructive_protection() {
        let dir = tempdir().unwrap();
        let project_root = dir.path();

        // 1. Cannot delete project root
        let root_result = PathGuard::validate_for_destructive_action(project_root, project_root);
        assert!(root_result.is_err(), "Project root cannot be deleted or renamed");

        // 2. Cannot delete .git folder
        let git_dir = project_root.join(".git");
        fs::create_dir_all(&git_dir).unwrap();
        let git_result = PathGuard::validate_for_destructive_action(project_root, &git_dir);
        assert!(git_result.is_err(), ".git directory cannot be deleted or renamed");

        // 3. Normal file can be deleted
        let normal_file = project_root.join("chapter.tex");
        File::create(&normal_file).unwrap();
        assert!(PathGuard::validate_for_destructive_action(project_root, &normal_file).is_ok());
    }

    #[test]
    fn test_safe_node_name() {
        assert!(PathGuard::is_safe_node_name("main.tex").is_ok());
        assert!(PathGuard::is_safe_node_name("my-folder").is_ok());
        assert!(PathGuard::is_safe_node_name("..").is_err());
        assert!(PathGuard::is_safe_node_name(".git").is_err());
        assert!(PathGuard::is_safe_node_name("foo/bar").is_err());
        assert!(PathGuard::is_safe_node_name("").is_err());
    }
}
