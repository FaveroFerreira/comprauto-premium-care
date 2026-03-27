use rusqlite::Connection;
use std::path::PathBuf;
use std::sync::Mutex;
use tauri::{AppHandle, Manager};

use crate::error::AppResult;

pub struct DbConnection(pub Mutex<Connection>);

pub fn get_db_path(app: &AppHandle) -> PathBuf {
    let app_dir = app
        .path()
        .app_data_dir()
        .expect("Failed to get app data directory");

    std::fs::create_dir_all(&app_dir).expect("Failed to create app data directory");
    app_dir.join("comprauto_premium_care.db")
}

pub fn init_db(app: &AppHandle) -> AppResult<Connection> {
    let db_path = get_db_path(app);
    let conn = Connection::open(&db_path)?;

    // Enable foreign keys
    conn.execute_batch("PRAGMA foreign_keys = ON;")?;

    // Run migrations
    run_migrations(&conn)?;

    Ok(conn)
}

fn run_migrations(conn: &Connection) -> AppResult<()> {
    // Create migrations table if not exists
    conn.execute(
        "CREATE TABLE IF NOT EXISTS _migrations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL UNIQUE,
            applied_at TEXT NOT NULL DEFAULT (datetime('now'))
        )",
        [],
    )?;

    let migrations = get_migrations();

    for (name, sql) in migrations {
        let applied: bool = conn
            .query_row(
                "SELECT COUNT(*) > 0 FROM _migrations WHERE name = ?",
                [name],
                |row| row.get(0),
            )
            .unwrap_or(false);

        if !applied {
            conn.execute_batch(sql)?;
            conn.execute("INSERT INTO _migrations (name) VALUES (?)", [name])?;
            println!("Applied migration: {}", name);
        }
    }

    Ok(())
}

fn get_migrations() -> Vec<(&'static str, &'static str)> {
    vec![
        ("001_initial_schema", include_str!("../migrations/001_initial_schema.sql")),
        ("002_add_sequential_numbers", include_str!("../migrations/002_add_sequential_numbers.sql")),
    ]
}
