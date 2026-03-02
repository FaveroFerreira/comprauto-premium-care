use serde::Serialize;
use thiserror::Error;

#[derive(Error, Debug)]
pub enum AppError {
    #[error("Database error: {0}")]
    Database(#[from] rusqlite::Error),

    #[error("Not found: {0}")]
    NotFound(String),

    #[error("Validation error: {0}")]
    Validation(String),

    #[error("Authentication error: {0}")]
    Auth(String),

    #[error("Duplicate entry: {0}")]
    Duplicate(String),

    #[error("Internal error: {0}")]
    Internal(String),
}

impl Serialize for AppError {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        #[derive(Serialize)]
        struct ErrorResponse {
            error: String,
            message: String,
        }

        let (error_type, message) = match self {
            AppError::Database(e) => ("database", e.to_string()),
            AppError::NotFound(msg) => ("not_found", msg.clone()),
            AppError::Validation(msg) => ("validation", msg.clone()),
            AppError::Auth(msg) => ("auth", msg.clone()),
            AppError::Duplicate(msg) => ("duplicate", msg.clone()),
            AppError::Internal(msg) => ("internal", msg.clone()),
        };

        ErrorResponse {
            error: error_type.to_string(),
            message,
        }
        .serialize(serializer)
    }
}

pub type AppResult<T> = Result<T, AppError>;
