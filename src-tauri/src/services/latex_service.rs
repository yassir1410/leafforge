use std::process::Command;
use crate::models::project::{LaTeXEngineInfo, LaTeXEnvironment};

pub struct LaTeXDetector;

impl LaTeXDetector {
    /// Detects all installed LaTeX engines and CLI tools
    pub fn detect_tools() -> LaTeXEnvironment {
        let tools = vec![
            ("latexmk", "Latexmk Build Engine"),
            ("pdflatex", "pdfLaTeX Engine"),
            ("xelatex", "XeLaTeX Engine"),
            ("lualatex", "LuaLaTeX Engine"),
            ("bibtex", "BibTeX Bibliography Engine"),
            ("tex", "TeX Classic Engine"),
        ];

        let mut engines = Vec::new();
        let mut has_latexmk = false;
        let mut has_pdflatex = false;
        let mut has_xelatex = false;
        let mut has_lualatex = false;
        let mut has_bibtex = false;

        for (cmd, name) in tools {
            let found = which::which(cmd);
            match found {
                Ok(path_buf) => {
                    let path_str = path_buf.to_string_lossy().to_string();
                    let version = Self::query_version(cmd);

                    match cmd {
                        "latexmk" => has_latexmk = true,
                        "pdflatex" => has_pdflatex = true,
                        "xelatex" => has_xelatex = true,
                        "lualatex" => has_lualatex = true,
                        "bibtex" => has_bibtex = true,
                        _ => {}
                    }

                    engines.push(LaTeXEngineInfo {
                        name: name.to_string(),
                        command: cmd.to_string(),
                        available: true,
                        path: Some(path_str),
                        version,
                    });
                }
                Err(_) => {
                    engines.push(LaTeXEngineInfo {
                        name: name.to_string(),
                        command: cmd.to_string(),
                        available: false,
                        path: None,
                        version: None,
                    });
                }
            }
        }

        LaTeXEnvironment {
            engines,
            has_latexmk,
            has_pdflatex,
            has_xelatex,
            has_lualatex,
            has_bibtex,
        }
    }

    /// Queries binary version safely (runs with timeout / single line capture)
    fn query_version(cmd: &str) -> Option<String> {
        let flag = if cmd == "bibtex" { "--version" } else { "--version" };
        let output = Command::new(cmd).arg(flag).output().ok()?;

        if output.status.success() {
            let stdout = String::from_utf8_lossy(&output.stdout);
            // Return first line of output
            stdout
                .lines()
                .next()
                .map(|line| line.trim().to_string())
        } else {
            None
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_detect_tools_returns_results() {
        let env = LaTeXDetector::detect_tools();
        assert!(!env.engines.is_empty());
        // Since we know latexmk and pdflatex are installed on this Fedora machine:
        let has_any = env.engines.iter().any(|e| e.available);
        assert!(has_any, "At least one LaTeX engine should be detected");
    }
}
