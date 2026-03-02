use argon2::{
    password_hash::{PasswordHash, PasswordHasher, PasswordVerifier, SaltString},
    Argon2,
};
use rand::rngs::OsRng;
use tauri::State;
use uuid::Uuid;

use crate::db::DbConnection;
use crate::error::{AppError, AppResult};
use crate::models::user::{CreateUserInput, LoginInput, UpdateUserInput, User};

fn hash_password(password: &str) -> AppResult<String> {
    let salt = SaltString::generate(&mut OsRng);
    let argon2 = Argon2::default();
    let hash = argon2
        .hash_password(password.as_bytes(), &salt)
        .map_err(|e| AppError::Internal(format!("Failed to hash password: {}", e)))?;
    Ok(hash.to_string())
}

fn verify_password(password: &str, hash: &str) -> AppResult<bool> {
    let parsed_hash = PasswordHash::new(hash)
        .map_err(|e| AppError::Internal(format!("Invalid password hash: {}", e)))?;
    Ok(Argon2::default()
        .verify_password(password.as_bytes(), &parsed_hash)
        .is_ok())
}

#[tauri::command]
pub fn register(db: State<DbConnection>, input: CreateUserInput) -> AppResult<User> {
    let conn = db.0.lock().map_err(|_| AppError::Internal("Failed to acquire database lock".to_string()))?;

    // Check for duplicate email
    let exists: bool = conn
        .query_row(
            "SELECT COUNT(*) > 0 FROM users WHERE email = ?",
            [&input.email],
            |row| row.get(0),
        )
        .unwrap_or(false);

    if exists {
        return Err(AppError::Duplicate(format!(
            "User with email {} already exists",
            input.email
        )));
    }

    let id = Uuid::new_v4().to_string();
    let now = chrono::Utc::now().to_rfc3339();
    let password_hash = hash_password(&input.password)?;

    conn.execute(
        "INSERT INTO users (id, name, email, password, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?)",
        (&id, &input.name, &input.email, &password_hash, &now, &now),
    )?;

    Ok(User {
        id,
        name: input.name,
        email: input.email,
        email_verified_at: None,
        created_at: now.clone(),
        updated_at: now,
    })
}

#[tauri::command]
pub fn login(db: State<DbConnection>, input: LoginInput) -> AppResult<User> {
    let conn = db.0.lock().map_err(|_| AppError::Internal("Failed to acquire database lock".to_string()))?;

    let result = conn.query_row(
        "SELECT id, name, email, email_verified_at, password, created_at, updated_at
         FROM users WHERE email = ?",
        [&input.email],
        |row| {
            Ok((
                User {
                    id: row.get(0)?,
                    name: row.get(1)?,
                    email: row.get(2)?,
                    email_verified_at: row.get(3)?,
                    created_at: row.get(5)?,
                    updated_at: row.get(6)?,
                },
                row.get::<_, String>(4)?,
            ))
        },
    );

    match result {
        Ok((user, password_hash)) => {
            if verify_password(&input.password, &password_hash)? {
                Ok(user)
            } else {
                Err(AppError::Auth("Invalid credentials".to_string()))
            }
        }
        Err(rusqlite::Error::QueryReturnedNoRows) => {
            Err(AppError::Auth("Invalid credentials".to_string()))
        }
        Err(e) => Err(AppError::Database(e)),
    }
}

#[tauri::command]
pub fn get_current_user(db: State<DbConnection>, user_id: String) -> AppResult<User> {
    let conn = db.0.lock().map_err(|_| AppError::Internal("Failed to acquire database lock".to_string()))?;

    conn.query_row(
        "SELECT id, name, email, email_verified_at, created_at, updated_at
         FROM users WHERE id = ?",
        [&user_id],
        |row| {
            Ok(User {
                id: row.get(0)?,
                name: row.get(1)?,
                email: row.get(2)?,
                email_verified_at: row.get(3)?,
                created_at: row.get(4)?,
                updated_at: row.get(5)?,
            })
        },
    )
    .map_err(|e| match e {
        rusqlite::Error::QueryReturnedNoRows => {
            AppError::NotFound(format!("User with id {} not found", user_id))
        }
        _ => AppError::Database(e),
    })
}

#[tauri::command]
pub fn update_user(db: State<DbConnection>, user_id: String, input: UpdateUserInput) -> AppResult<User> {
    let conn = db.0.lock().map_err(|_| AppError::Internal("Failed to acquire database lock".to_string()))?;

    // Get existing user
    let user = conn
        .query_row(
            "SELECT id, name, email, email_verified_at, created_at, updated_at
             FROM users WHERE id = ?",
            [&user_id],
            |row| {
                Ok(User {
                    id: row.get(0)?,
                    name: row.get(1)?,
                    email: row.get(2)?,
                    email_verified_at: row.get(3)?,
                    created_at: row.get(4)?,
                    updated_at: row.get(5)?,
                })
            },
        )
        .map_err(|e| match e {
            rusqlite::Error::QueryReturnedNoRows => {
                AppError::NotFound(format!("User with id {} not found", user_id))
            }
            _ => AppError::Database(e),
        })?;

    // Check for duplicate email if changing
    if let Some(ref new_email) = input.email {
        if new_email != &user.email {
            let exists: bool = conn
                .query_row(
                    "SELECT COUNT(*) > 0 FROM users WHERE email = ? AND id != ?",
                    [new_email, &user_id],
                    |row| row.get(0),
                )
                .unwrap_or(false);

            if exists {
                return Err(AppError::Duplicate(format!(
                    "User with email {} already exists",
                    new_email
                )));
            }
        }
    }

    let now = chrono::Utc::now().to_rfc3339();
    let new_name = input.name.unwrap_or(user.name);
    let new_email = input.email.unwrap_or(user.email);

    conn.execute(
        "UPDATE users SET name = ?, email = ?, updated_at = ? WHERE id = ?",
        (&new_name, &new_email, &now, &user_id),
    )?;

    Ok(User {
        id: user_id,
        name: new_name,
        email: new_email,
        email_verified_at: user.email_verified_at,
        created_at: user.created_at,
        updated_at: now,
    })
}

#[tauri::command]
pub fn update_password(
    db: State<DbConnection>,
    user_id: String,
    current_password: String,
    new_password: String,
) -> AppResult<()> {
    let conn = db.0.lock().map_err(|_| AppError::Internal("Failed to acquire database lock".to_string()))?;

    // Get current password hash
    let password_hash: String = conn
        .query_row(
            "SELECT password FROM users WHERE id = ?",
            [&user_id],
            |row| row.get(0),
        )
        .map_err(|e| match e {
            rusqlite::Error::QueryReturnedNoRows => {
                AppError::NotFound(format!("User with id {} not found", user_id))
            }
            _ => AppError::Database(e),
        })?;

    // Verify current password
    if !verify_password(&current_password, &password_hash)? {
        return Err(AppError::Auth("Current password is incorrect".to_string()));
    }

    // Hash and update new password
    let new_hash = hash_password(&new_password)?;
    let now = chrono::Utc::now().to_rfc3339();

    conn.execute(
        "UPDATE users SET password = ?, updated_at = ? WHERE id = ?",
        (&new_hash, &now, &user_id),
    )?;

    Ok(())
}

#[tauri::command]
pub fn list_users(db: State<DbConnection>) -> AppResult<Vec<User>> {
    let conn = db.0.lock().map_err(|_| AppError::Internal("Failed to acquire database lock".to_string()))?;
    let mut stmt = conn.prepare(
        "SELECT id, name, email, email_verified_at, created_at, updated_at
         FROM users
         ORDER BY created_at DESC",
    )?;

    let users = stmt
        .query_map([], |row| {
            Ok(User {
                id: row.get(0)?,
                name: row.get(1)?,
                email: row.get(2)?,
                email_verified_at: row.get(3)?,
                created_at: row.get(4)?,
                updated_at: row.get(5)?,
            })
        })?
        .collect::<Result<Vec<_>, _>>()?;

    Ok(users)
}

#[tauri::command]
pub fn delete_user(db: State<DbConnection>, user_id: String) -> AppResult<()> {
    let conn = db.0.lock().map_err(|_| AppError::Internal("Failed to acquire database lock".to_string()))?;

    let rows_affected = conn.execute("DELETE FROM users WHERE id = ?", [&user_id])?;

    if rows_affected == 0 {
        return Err(AppError::NotFound(format!(
            "User with id {} not found",
            user_id
        )));
    }

    Ok(())
}
