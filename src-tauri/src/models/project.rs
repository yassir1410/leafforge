use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProjectInfo {
    pub name: String,
    pub path: String,
    pub main_file: String,
    pub created_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct FileNode {
    pub id: String,
    pub name: String,
    pub path: String,
    pub relative_path: String,
    pub is_dir: bool,
    pub extension: Option<String>,
    pub size: Option<u64>,
    pub children: Option<Vec<FileNode>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RecentProject {
    pub name: String,
    pub path: String,
    pub last_opened: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LaTeXEngineInfo {
    pub name: String,
    pub command: String,
    pub available: bool,
    pub path: Option<String>,
    pub version: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LaTeXEnvironment {
    pub engines: Vec<LaTeXEngineInfo>,
    pub has_latexmk: bool,
    pub has_pdflatex: bool,
    pub has_xelatex: bool,
    pub has_lualatex: bool,
    pub has_bibtex: bool,
}
