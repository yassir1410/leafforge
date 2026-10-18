use std::fs;
use std::path::{Path, PathBuf};
use chrono::Utc;
use crate::models::error::LeafForgeError;
use crate::models::project::{ProjectInfo, RecentProject};

const DEFAULT_MAIN_TEX: &str = r#"\documentclass[12pt,a4paper]{article}

\usepackage[utf8]{inputenc}
\usepackage[T1]{fontenc}

\title{Untitled Document}
\author{}
\date{\today}

\begin{document}

\maketitle

\section{Introduction}

Hello, LeafForge!

\end{document}
"#;

pub struct ProjectService;

impl ProjectService {
    /// Gets config directory for LeafForge (~/.config/leafforge)
    fn get_config_dir() -> PathBuf {
        let home = std::env::var("HOME").unwrap_or_else(|_| ".".to_string());
        PathBuf::from(home).join(".config").join("leafforge")
    }

    /// Gets recent projects JSON file path
    fn get_recent_projects_file() -> PathBuf {
        Self::get_config_dir().join("recent_projects.json")
    }

    /// Creates a new LaTeX project in the target directory
    pub fn create_project(project_path: &Path, project_name: Option<&str>) -> Result<ProjectInfo, LeafForgeError> {
        if !project_path.exists() {
            fs::create_dir_all(project_path)
                .map_err(|e| LeafForgeError::Io(format!("Failed to create project directory: {e}")))?;
        }

        let canonical_root = project_path
            .canonicalize()
            .map_err(|e| LeafForgeError::Io(format!("Failed to canonicalize project path: {e}")))?;

        let folder_name = project_name
            .map(|s| s.to_string())
            .unwrap_or_else(|| {
                canonical_root
                    .file_name()
                    .and_then(|n| n.to_str())
                    .unwrap_or("Untitled Project")
                    .to_string()
            });

        let main_tex_path = canonical_root.join("main.tex");
        if !main_tex_path.exists() {
            // Customize title with folder name if default
            let content = DEFAULT_MAIN_TEX.replace("Untitled Document", &folder_name);
            fs::write(&main_tex_path, content)
                .map_err(|e| LeafForgeError::Io(format!("Failed to write initial main.tex: {e}")))?;
        }

        let info = ProjectInfo {
            name: folder_name.clone(),
            path: canonical_root.to_string_lossy().to_string(),
            main_file: main_tex_path.to_string_lossy().to_string(),
            created_at: Utc::now().to_rfc3339(),
        };

        // Add to recent projects
        let _ = Self::add_recent_project(&folder_name, &canonical_root);

        Ok(info)
    }

    /// Opens an existing project
    pub fn open_project(project_path: &Path) -> Result<ProjectInfo, LeafForgeError> {
        if !project_path.exists() {
            return Err(LeafForgeError::NotFound(format!(
                "Directory does not exist: {}",
                project_path.display()
            )));
        }

        if !project_path.is_dir() {
            return Err(LeafForgeError::Project(format!(
                "Path is not a directory: {}",
                project_path.display()
            )));
        }

        let canonical_root = project_path
            .canonicalize()
            .map_err(|e| LeafForgeError::Io(format!("Failed to canonicalize project path: {e}")))?;

        let folder_name = canonical_root
            .file_name()
            .and_then(|n| n.to_str())
            .unwrap_or("LaTeX Project")
            .to_string();

        // Check for main.tex or other .tex files
        let main_tex = canonical_root.join("main.tex");
        let main_file = if main_tex.exists() {
            main_tex.to_string_lossy().to_string()
        } else {
            // Find first .tex file in root
            let mut found_tex = String::new();
            if let Ok(entries) = fs::read_dir(&canonical_root) {
                for entry in entries.flatten() {
                    let path = entry.path();
                    if path.is_file() && path.extension().and_then(|e| e.to_str()) == Some("tex") {
                        found_tex = path.to_string_lossy().to_string();
                        break;
                    }
                }
            }
            found_tex
        };

        let info = ProjectInfo {
            name: folder_name.clone(),
            path: canonical_root.to_string_lossy().to_string(),
            main_file,
            created_at: Utc::now().to_rfc3339(),
        };

        let _ = Self::add_recent_project(&folder_name, &canonical_root);

        Ok(info)
    }

    /// Lists recent projects
    pub fn list_recent_projects() -> Vec<RecentProject> {
        let file_path = Self::get_recent_projects_file();
        if !file_path.exists() {
            return Vec::new();
        }

        let Ok(data) = fs::read_to_string(&file_path) else {
            return Vec::new();
        };

        let mut list: Vec<RecentProject> = serde_json::from_str(&data).unwrap_or_default();
        // Filter out nonexistent projects
        list.retain(|p| Path::new(&p.path).exists());
        list
    }

    /// Adds a project to recent projects
    pub fn add_recent_project(name: &str, path: &Path) -> Result<(), LeafForgeError> {
        let config_dir = Self::get_config_dir();
        if !config_dir.exists() {
            let _ = fs::create_dir_all(&config_dir);
        }

        let file_path = Self::get_recent_projects_file();
        let mut list: Vec<RecentProject> = if file_path.exists() {
            fs::read_to_string(&file_path)
                .ok()
                .and_then(|s| serde_json::from_str(&s).ok())
                .unwrap_or_default()
        } else {
            Vec::new()
        };

        let path_str = path.to_string_lossy().to_string();
        // Remove existing entry for same path
        list.retain(|p| p.path != path_str);

        // Prepend current
        list.insert(
            0,
            RecentProject {
                name: name.to_string(),
                path: path_str,
                last_opened: Utc::now().to_rfc3339(),
            },
        );

        // Limit to 10
        if list.len() > 10 {
            list.truncate(10);
        }

        let json = serde_json::to_string_pretty(&list)?;
        fs::write(&file_path, json)?;
        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::tempdir;

    #[test]
    fn test_create_project_generates_main_tex() {
        let dir = tempdir().unwrap();
        let proj_path = dir.path().join("my_new_paper");

        let info = ProjectService::create_project(&proj_path, Some("My New Paper")).unwrap();
        assert_eq!(info.name, "My New Paper");

        let main_tex = proj_path.join("main.tex");
        assert!(main_tex.exists());

        let content = fs::read_to_string(main_tex).unwrap();
        assert!(content.contains(r"\documentclass[12pt,a4paper]{article}"));
        assert!(content.contains(r"\begin{document}"));
        assert!(content.contains(r"My New Paper"));
    }

    #[test]
    fn test_open_existing_project() {
        let dir = tempdir().unwrap();
        let proj_path = dir.path().join("existing_project");
        fs::create_dir(&proj_path).unwrap();
        fs::write(proj_path.join("main.tex"), "test content").unwrap();

        let info = ProjectService::open_project(&proj_path).unwrap();
        assert_eq!(info.name, "existing_project");
        assert!(info.main_file.ends_with("main.tex"));
    }
}
