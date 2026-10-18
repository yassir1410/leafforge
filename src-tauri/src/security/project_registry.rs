use std::collections::HashSet;
use std::path::{Path, PathBuf};
use std::sync::RwLock;
use crate::models::error::LeafForgeError;

/// Registry that tracks currently authorized project root paths in LeafForge.
/// Guarantees that file operations cannot be performed against arbitrary directories
/// on the filesystem unless they have been explicitly opened or created as a project.
pub struct ActiveProjectRegistry {
    authorized_roots: RwLock<HashSet<PathBuf>>,
}

impl Default for ActiveProjectRegistry {
    fn default() -> Self {
        Self::new()
    }
}

impl ActiveProjectRegistry {
    pub fn new() -> Self {
        Self {
            authorized_roots: RwLock::new(HashSet::new()),
        }
    }

    /// List of system paths that can never be registered as project roots
    const FORBIDDEN_ROOTS: &'static [&'static str] = &[
        "/",
        "/etc",
        "/usr",
        "/var",
        "/home",
        "/boot",
        "/dev",
        "/proc",
        "/sys",
        "/root",
        "/bin",
        "/sbin",
        "/lib",
        "/lib64",
        "/opt",
    ];

    /// Validates whether a candidate project root is safe and canonicalizes it
    pub fn validate_project_root(root: &Path) -> Result<PathBuf, LeafForgeError> {
        if !root.exists() {
            return Err(LeafForgeError::NotFound(format!(
                "Project directory does not exist: {}",
                root.display()
            )));
        }

        let canonical = root
            .canonicalize()
            .map_err(|e| LeafForgeError::Project(format!("Cannot canonicalize project path: {e}")))?;

        if !canonical.is_dir() {
            return Err(LeafForgeError::InvalidPath(format!(
                "Project root must be a directory: {}",
                canonical.display()
            )));
        }

        let path_str = canonical.to_string_lossy();

        // Disallow root and top-level system paths
        for &forbidden in Self::FORBIDDEN_ROOTS {
            if path_str == forbidden {
                return Err(LeafForgeError::Security(format!(
                    "System directory cannot be opened as a project: {forbidden}"
                )));
            }
        }

        // Disallow user home directory itself directly (e.g. /home/username)
        if let Some(home_str) = std::env::var_os("HOME") {
            let home_dir = PathBuf::from(home_str);
            if let Ok(canonical_home) = home_dir.canonicalize() {
                if canonical == canonical_home {
                    return Err(LeafForgeError::Security(
                        "User home directory cannot be opened directly as a project root. Use a project subfolder.".to_string(),
                    ));
                }
            }
        }

        Ok(canonical)
    }

    /// Authorizes a project root directory after validating safety
    pub fn register_project(&self, root: &Path) -> Result<PathBuf, LeafForgeError> {
        let canonical = Self::validate_project_root(root)?;

        let mut roots = self
            .authorized_roots
            .write()
            .map_err(|_| LeafForgeError::Security("Failed to acquire project registry lock".to_string()))?;

        roots.insert(canonical.clone());
        Ok(canonical)
    }

    /// Unregisters a project root directory
    pub fn unregister_project(&self, root: &Path) -> Result<(), LeafForgeError> {
        if let Ok(canonical) = root.canonicalize() {
            let mut roots = self
                .authorized_roots
                .write()
                .map_err(|_| LeafForgeError::Security("Failed to acquire project registry lock".to_string()))?;
            roots.remove(&canonical);
        }
        Ok(())
    }

    /// Verifies that a given project root has been explicitly authorized
    pub fn verify_authorized(&self, root: &Path) -> Result<PathBuf, LeafForgeError> {
        let canonical = root
            .canonicalize()
            .map_err(|e| LeafForgeError::Security(format!("Project root is invalid or inaccessible: {e}")))?;

        let roots = self
            .authorized_roots
            .read()
            .map_err(|_| LeafForgeError::Security("Failed to acquire project registry lock".to_string()))?;

        if roots.contains(&canonical) {
            Ok(canonical)
        } else {
            Err(LeafForgeError::Security(format!(
                "Access denied: project root '{}' has not been authorized. Open or create the project first.",
                canonical.display()
            )))
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::tempdir;

    #[test]
    fn test_register_and_verify_project() {
        let registry = ActiveProjectRegistry::new();
        let dir = tempdir().unwrap();
        let project_path = dir.path();

        // Not authorized initially
        assert!(registry.verify_authorized(project_path).is_err());

        // Register
        let canonical = registry.register_project(project_path).unwrap();
        assert_eq!(canonical, project_path.canonicalize().unwrap());

        // Authorized now
        assert!(registry.verify_authorized(project_path).is_ok());

        // Unregister
        registry.unregister_project(project_path).unwrap();
        assert!(registry.verify_authorized(project_path).is_err());
    }

    #[test]
    fn test_reject_system_directories() {
        let registry = ActiveProjectRegistry::new();

        assert!(registry.register_project(Path::new("/")).is_err());
        assert!(registry.register_project(Path::new("/etc")).is_err());
        assert!(registry.register_project(Path::new("/usr")).is_err());
    }
}
