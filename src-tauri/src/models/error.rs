use serde::Serialize;
use thiserror::Error;

#[derive(Debug, Error, Serialize)]
#[serde(tag = "type", content = "message")]
pub enum LeafForgeError {
    #[error("IO error: {0}")]
    Io(String),

    #[error("Security error: {0}")]
    Security(String),

    #[error("Project error: {0}")]
    Project(String),

    #[error("File not found: {0}")]
    NotFound(String),

    #[error("Invalid path: {0}")]
    InvalidPath(String),

    #[error("Serialization error: {0}")]
    Serialization(String),

    #[error("System error: {0}")]
    System(String),
}

impl From<std::io::Error> for LeafForgeError {
    fn from(err: std::io::Error) -> Self {
        LeafForgeError::Io(err.to_string())
    }
}

impl From<serde_json::Error> for LeafForgeError {
    fn from(err: serde_json::Error) -> Self {
        LeafForgeError::Serialization(err.to_string())
    }
}
