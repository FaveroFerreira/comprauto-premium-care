use tauri::State;
use uuid::Uuid;

use crate::db::DbConnection;
use crate::error::{AppError, AppResult};
use crate::models::vehicle::{CreateVehicleInput, UpdateVehicleInput, Vehicle};

#[tauri::command]
pub fn list_vehicles(db: State<DbConnection>) -> AppResult<Vec<Vehicle>> {
    let conn = db.0.lock().map_err(|_| AppError::Internal("Failed to acquire database lock".to_string()))?;
    let mut stmt = conn.prepare(
        "SELECT id, brand, model, year, created_at, updated_at
         FROM vehicles
         ORDER BY brand ASC, model ASC, year DESC",
    )?;

    let vehicles = stmt
        .query_map([], |row| {
            Ok(Vehicle {
                id: row.get(0)?,
                brand: row.get(1)?,
                model: row.get(2)?,
                year: row.get(3)?,
                created_at: row.get(4)?,
                updated_at: row.get(5)?,
            })
        })?
        .collect::<Result<Vec<_>, _>>()?;

    Ok(vehicles)
}

#[tauri::command]
pub fn get_vehicle(db: State<DbConnection>, id: String) -> AppResult<Vehicle> {
    let conn = db.0.lock().map_err(|_| AppError::Internal("Failed to acquire database lock".to_string()))?;
    let vehicle = conn
        .query_row(
            "SELECT id, brand, model, year, created_at, updated_at
             FROM vehicles WHERE id = ?",
            [&id],
            |row| {
                Ok(Vehicle {
                    id: row.get(0)?,
                    brand: row.get(1)?,
                    model: row.get(2)?,
                    year: row.get(3)?,
                    created_at: row.get(4)?,
                    updated_at: row.get(5)?,
                })
            },
        )
        .map_err(|e| match e {
            rusqlite::Error::QueryReturnedNoRows => {
                AppError::NotFound(format!("Vehicle with id {} not found", id))
            }
            _ => AppError::Database(e),
        })?;

    Ok(vehicle)
}

#[tauri::command]
pub fn create_vehicle(db: State<DbConnection>, input: CreateVehicleInput) -> AppResult<Vehicle> {
    let conn = db.0.lock().map_err(|_| AppError::Internal("Failed to acquire database lock".to_string()))?;

    // Check for duplicate
    let exists: bool = conn
        .query_row(
            "SELECT COUNT(*) > 0 FROM vehicles WHERE brand = ? AND model = ? AND year = ?",
            (&input.brand, &input.model, input.year),
            |row| row.get(0),
        )
        .unwrap_or(false);

    if exists {
        return Err(AppError::Duplicate(format!(
            "Vehicle {} {} ({}) already exists",
            input.brand, input.model, input.year
        )));
    }

    let id = Uuid::new_v4().to_string();
    let now = chrono::Utc::now().to_rfc3339();

    conn.execute(
        "INSERT INTO vehicles (id, brand, model, year, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?)",
        (&id, &input.brand, &input.model, input.year, &now, &now),
    )?;

    Ok(Vehicle {
        id,
        brand: input.brand,
        model: input.model,
        year: input.year,
        created_at: now.clone(),
        updated_at: now,
    })
}

#[tauri::command]
pub fn update_vehicle(db: State<DbConnection>, id: String, input: UpdateVehicleInput) -> AppResult<Vehicle> {
    let conn = db.0.lock().map_err(|_| AppError::Internal("Failed to acquire database lock".to_string()))?;

    // Get existing vehicle
    let vehicle = conn
        .query_row(
            "SELECT id, brand, model, year, created_at, updated_at
             FROM vehicles WHERE id = ?",
            [&id],
            |row| {
                Ok(Vehicle {
                    id: row.get(0)?,
                    brand: row.get(1)?,
                    model: row.get(2)?,
                    year: row.get(3)?,
                    created_at: row.get(4)?,
                    updated_at: row.get(5)?,
                })
            },
        )
        .map_err(|e| match e {
            rusqlite::Error::QueryReturnedNoRows => {
                AppError::NotFound(format!("Vehicle with id {} not found", id))
            }
            _ => AppError::Database(e),
        })?;

    // Check for duplicate if changing fields
    let new_brand = input.brand.clone().unwrap_or(vehicle.brand.clone());
    let new_model = input.model.clone().unwrap_or(vehicle.model.clone());
    let new_year = input.year.unwrap_or(vehicle.year);

    let exists: bool = conn
        .query_row(
            "SELECT COUNT(*) > 0 FROM vehicles WHERE brand = ? AND model = ? AND year = ? AND id != ?",
            (&new_brand, &new_model, new_year, &id),
            |row| row.get(0),
        )
        .unwrap_or(false);

    if exists {
        return Err(AppError::Duplicate(format!(
            "Vehicle {} {} ({}) already exists",
            new_brand, new_model, new_year
        )));
    }

    let now = chrono::Utc::now().to_rfc3339();

    conn.execute(
        "UPDATE vehicles SET brand = ?, model = ?, year = ?, updated_at = ? WHERE id = ?",
        (&new_brand, &new_model, new_year, &now, &id),
    )?;

    Ok(Vehicle {
        id,
        brand: new_brand,
        model: new_model,
        year: new_year,
        created_at: vehicle.created_at,
        updated_at: now,
    })
}

#[tauri::command]
pub fn delete_vehicle(db: State<DbConnection>, id: String) -> AppResult<()> {
    let conn = db.0.lock().map_err(|_| AppError::Internal("Failed to acquire database lock".to_string()))?;

    let rows_affected = conn.execute("DELETE FROM vehicles WHERE id = ?", [&id])?;

    if rows_affected == 0 {
        return Err(AppError::NotFound(format!(
            "Vehicle with id {} not found",
            id
        )));
    }

    Ok(())
}
