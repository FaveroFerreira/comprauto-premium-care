use rusqlite::Connection;
use tauri::State;
use uuid::Uuid;

use crate::db::DbConnection;
use crate::error::{AppError, AppResult};
use crate::models::part::{CreatePartInput, PaginatedParts, Part, UpdatePartInput};
use crate::models::part_vehicle::{PartVehicle, VehicleCompatibilityInput};

/// Busca as compatibilidades de veículos de uma peça
fn get_part_vehicles(conn: &Connection, part_id: &str) -> AppResult<Vec<PartVehicle>> {
    let mut stmt = conn.prepare(
        "SELECT id, part_id, vehicle_brand, vehicle_model, year_start, year_end, created_at
         FROM part_vehicles WHERE part_id = ?",
    )?;

    let vehicles = stmt
        .query_map([part_id], |row| {
            Ok(PartVehicle {
                id: row.get(0)?,
                part_id: row.get(1)?,
                vehicle_brand: row.get(2)?,
                vehicle_model: row.get(3)?,
                year_start: row.get(4)?,
                year_end: row.get(5)?,
                created_at: row.get(6)?,
            })
        })?
        .collect::<Result<Vec<_>, _>>()?;

    Ok(vehicles)
}

/// Insere compatibilidades de veículos para uma peça
fn insert_part_vehicles(
    conn: &Connection,
    part_id: &str,
    compatibilities: &[VehicleCompatibilityInput],
) -> AppResult<Vec<PartVehicle>> {
    let now = chrono::Utc::now().to_rfc3339();
    let mut result = Vec::new();

    for compat in compatibilities {
        let id = Uuid::new_v4().to_string();
        conn.execute(
            "INSERT INTO part_vehicles (id, part_id, vehicle_brand, vehicle_model, year_start, year_end, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?)",
            (
                &id,
                part_id,
                &compat.vehicle_brand,
                &compat.vehicle_model,
                compat.year_start,
                compat.year_end,
                &now,
            ),
        )?;

        result.push(PartVehicle {
            id,
            part_id: part_id.to_string(),
            vehicle_brand: compat.vehicle_brand.clone(),
            vehicle_model: compat.vehicle_model.clone(),
            year_start: compat.year_start,
            year_end: compat.year_end,
            created_at: now.clone(),
        });
    }

    Ok(result)
}

/// Deleta todas as compatibilidades de veículos de uma peça
fn delete_part_vehicles(conn: &Connection, part_id: &str) -> AppResult<()> {
    conn.execute("DELETE FROM part_vehicles WHERE part_id = ?", [part_id])?;
    Ok(())
}

#[tauri::command]
pub fn list_parts(db: State<DbConnection>, page: Option<i64>, page_size: Option<i64>) -> AppResult<PaginatedParts> {
    let conn = db.0.lock().map_err(|_| AppError::Internal("Failed to acquire database lock".to_string()))?;

    let page = page.unwrap_or(1).max(1);
    let page_size = page_size.unwrap_or(10).max(1).min(100);
    let offset = (page - 1) * page_size;

    // Get total count
    let total: i64 = conn.query_row("SELECT COUNT(*) FROM parts", [], |row| row.get(0))?;
    let total_pages = (total as f64 / page_size as f64).ceil() as i64;

    let mut stmt = conn.prepare(
        "SELECT id, number, name, unit_price, unit_type, is_universal, vehicle_brand, vehicle_model, vehicle_year, created_at, updated_at
         FROM parts
         ORDER BY created_at DESC
         LIMIT ? OFFSET ?",
    )?;

    let part_rows: Vec<(String, String, String, f64, Option<String>, Option<i32>, Option<String>, Option<String>, Option<i32>, String, String)> = stmt
        .query_map([page_size, offset], |row| {
            Ok((
                row.get(0)?,  // id
                row.get(1)?,  // number
                row.get(2)?,  // name
                row.get(3)?,  // unit_price
                row.get(4)?,  // unit_type
                row.get(5)?,  // is_universal
                row.get(6)?,  // vehicle_brand
                row.get(7)?,  // vehicle_model
                row.get(8)?,  // vehicle_year
                row.get(9)?,  // created_at
                row.get(10)?, // updated_at
            ))
        })?
        .collect::<Result<Vec<_>, _>>()?;

    let mut parts = Vec::new();
    for (id, number, name, unit_price, unit_type, is_universal, vehicle_brand, vehicle_model, vehicle_year, created_at, updated_at) in part_rows {
        let vehicle_compatibilities = get_part_vehicles(&conn, &id)?;
        parts.push(Part {
            id,
            number,
            name,
            unit_price,
            unit_type,
            is_universal: is_universal.unwrap_or(1) == 1,
            vehicle_compatibilities,
            vehicle_brand,
            vehicle_model,
            vehicle_year,
            created_at,
            updated_at,
        });
    }

    Ok(PaginatedParts {
        items: parts,
        total,
        page,
        page_size,
        total_pages,
    })
}

#[tauri::command]
pub fn search_parts(db: State<DbConnection>, query: String) -> AppResult<Vec<Part>> {
    let conn = db.0.lock().map_err(|_| AppError::Internal("Failed to acquire database lock".to_string()))?;
    let search_term = format!("%{}%", query);
    let mut stmt = conn.prepare(
        "SELECT id, number, name, unit_price, unit_type, is_universal, vehicle_brand, vehicle_model, vehicle_year, created_at, updated_at
         FROM parts
         WHERE number LIKE ? OR name LIKE ?
         ORDER BY name ASC
         LIMIT 20",
    )?;

    let part_rows: Vec<(String, String, String, f64, Option<String>, Option<i32>, Option<String>, Option<String>, Option<i32>, String, String)> = stmt
        .query_map([&search_term, &search_term], |row| {
            Ok((
                row.get(0)?,
                row.get(1)?,
                row.get(2)?,
                row.get(3)?,
                row.get(4)?,
                row.get(5)?,
                row.get(6)?,
                row.get(7)?,
                row.get(8)?,
                row.get(9)?,
                row.get(10)?,
            ))
        })?
        .collect::<Result<Vec<_>, _>>()?;

    let mut parts = Vec::new();
    for (id, number, name, unit_price, unit_type, is_universal, vehicle_brand, vehicle_model, vehicle_year, created_at, updated_at) in part_rows {
        let vehicle_compatibilities = get_part_vehicles(&conn, &id)?;
        parts.push(Part {
            id,
            number,
            name,
            unit_price,
            unit_type,
            is_universal: is_universal.unwrap_or(1) == 1,
            vehicle_compatibilities,
            vehicle_brand,
            vehicle_model,
            vehicle_year,
            created_at,
            updated_at,
        });
    }

    Ok(parts)
}

#[tauri::command]
pub fn get_part(db: State<DbConnection>, id: String) -> AppResult<Part> {
    let conn = db.0.lock().map_err(|_| AppError::Internal("Failed to acquire database lock".to_string()))?;

    let (part_id, number, name, unit_price, unit_type, is_universal, vehicle_brand, vehicle_model, vehicle_year, created_at, updated_at): (String, String, String, f64, Option<String>, Option<i32>, Option<String>, Option<String>, Option<i32>, String, String) = conn
        .query_row(
            "SELECT id, number, name, unit_price, unit_type, is_universal, vehicle_brand, vehicle_model, vehicle_year, created_at, updated_at
             FROM parts WHERE id = ?",
            [&id],
            |row| {
                Ok((
                    row.get(0)?,
                    row.get(1)?,
                    row.get(2)?,
                    row.get(3)?,
                    row.get(4)?,
                    row.get(5)?,
                    row.get(6)?,
                    row.get(7)?,
                    row.get(8)?,
                    row.get(9)?,
                    row.get(10)?,
                ))
            },
        )
        .map_err(|e| match e {
            rusqlite::Error::QueryReturnedNoRows => {
                AppError::NotFound(format!("Part with id {} not found", id))
            }
            _ => AppError::Database(e),
        })?;

    let vehicle_compatibilities = get_part_vehicles(&conn, &part_id)?;

    Ok(Part {
        id: part_id,
        number,
        name,
        unit_price,
        unit_type,
        is_universal: is_universal.unwrap_or(1) == 1,
        vehicle_compatibilities,
        vehicle_brand,
        vehicle_model,
        vehicle_year,
        created_at,
        updated_at,
    })
}

#[tauri::command]
pub fn create_part(db: State<DbConnection>, input: CreatePartInput) -> AppResult<Part> {
    let conn = db.0.lock().map_err(|_| AppError::Internal("Failed to acquire database lock".to_string()))?;

    // Check for duplicate number
    let exists: bool = conn
        .query_row(
            "SELECT COUNT(*) > 0 FROM parts WHERE number = ?",
            [&input.number],
            |row| row.get(0),
        )
        .unwrap_or(false);

    if exists {
        return Err(AppError::Duplicate(format!(
            "Part with number {} already exists",
            input.number
        )));
    }

    let id = Uuid::new_v4().to_string();
    let now = chrono::Utc::now().to_rfc3339();
    let is_universal_int = if input.is_universal { 1 } else { 0 };

    conn.execute(
        "INSERT INTO parts (id, number, name, unit_price, unit_type, is_universal, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        (
            &id,
            &input.number,
            &input.name,
            input.unit_price,
            &input.unit_type,
            is_universal_int,
            &now,
            &now,
        ),
    )?;

    // Insert vehicle compatibilities if not universal
    let vehicle_compatibilities = if !input.is_universal {
        if let Some(compatibilities) = &input.vehicle_compatibilities {
            insert_part_vehicles(&conn, &id, compatibilities)?
        } else {
            Vec::new()
        }
    } else {
        Vec::new()
    };

    Ok(Part {
        id,
        number: input.number,
        name: input.name,
        unit_price: input.unit_price,
        unit_type: input.unit_type,
        is_universal: input.is_universal,
        vehicle_compatibilities,
        vehicle_brand: None,
        vehicle_model: None,
        vehicle_year: None,
        created_at: now.clone(),
        updated_at: now,
    })
}

#[tauri::command]
pub fn update_part(db: State<DbConnection>, id: String, input: UpdatePartInput) -> AppResult<Part> {
    let conn = db.0.lock().map_err(|_| AppError::Internal("Failed to acquire database lock".to_string()))?;

    // Get existing part
    let (_, old_number, old_name, old_unit_price, old_unit_type, old_is_universal, _, _, _, created_at, _): (String, String, String, f64, Option<String>, Option<i32>, Option<String>, Option<String>, Option<i32>, String, String) = conn
        .query_row(
            "SELECT id, number, name, unit_price, unit_type, is_universal, vehicle_brand, vehicle_model, vehicle_year, created_at, updated_at
             FROM parts WHERE id = ?",
            [&id],
            |row| {
                Ok((
                    row.get(0)?,
                    row.get(1)?,
                    row.get(2)?,
                    row.get(3)?,
                    row.get(4)?,
                    row.get(5)?,
                    row.get(6)?,
                    row.get(7)?,
                    row.get(8)?,
                    row.get(9)?,
                    row.get(10)?,
                ))
            },
        )
        .map_err(|e| match e {
            rusqlite::Error::QueryReturnedNoRows => {
                AppError::NotFound(format!("Part with id {} not found", id))
            }
            _ => AppError::Database(e),
        })?;

    // Check for duplicate number if changing
    if let Some(ref new_number) = input.number {
        if new_number != &old_number {
            let exists: bool = conn
                .query_row(
                    "SELECT COUNT(*) > 0 FROM parts WHERE number = ? AND id != ?",
                    [new_number, &id],
                    |row| row.get(0),
                )
                .unwrap_or(false);

            if exists {
                return Err(AppError::Duplicate(format!(
                    "Part with number {} already exists",
                    new_number
                )));
            }
        }
    }

    let now = chrono::Utc::now().to_rfc3339();

    let new_number = input.number.unwrap_or(old_number);
    let new_name = input.name.unwrap_or(old_name);
    let new_unit_price = input.unit_price.unwrap_or(old_unit_price);
    let new_unit_type = input.unit_type.or(old_unit_type);
    let new_is_universal = input.is_universal.unwrap_or(old_is_universal.unwrap_or(1) == 1);
    let new_is_universal_int = if new_is_universal { 1 } else { 0 };

    conn.execute(
        "UPDATE parts SET number = ?, name = ?, unit_price = ?, unit_type = ?, is_universal = ?, updated_at = ? WHERE id = ?",
        (
            &new_number,
            &new_name,
            new_unit_price,
            &new_unit_type,
            new_is_universal_int,
            &now,
            &id,
        ),
    )?;

    // Update vehicle compatibilities
    let vehicle_compatibilities = if let Some(compatibilities) = input.vehicle_compatibilities {
        // Delete existing and insert new
        delete_part_vehicles(&conn, &id)?;
        if !new_is_universal && !compatibilities.is_empty() {
            insert_part_vehicles(&conn, &id, &compatibilities)?
        } else {
            Vec::new()
        }
    } else {
        // Keep existing compatibilities
        get_part_vehicles(&conn, &id)?
    };

    Ok(Part {
        id,
        number: new_number,
        name: new_name,
        unit_price: new_unit_price,
        unit_type: new_unit_type,
        is_universal: new_is_universal,
        vehicle_compatibilities,
        vehicle_brand: None,
        vehicle_model: None,
        vehicle_year: None,
        created_at,
        updated_at: now,
    })
}

#[tauri::command]
pub fn delete_part(db: State<DbConnection>, id: String) -> AppResult<()> {
    let conn = db.0.lock().map_err(|_| AppError::Internal("Failed to acquire database lock".to_string()))?;

    // Delete vehicle compatibilities first (CASCADE should handle this, but let's be explicit)
    delete_part_vehicles(&conn, &id)?;

    let rows_affected = conn.execute("DELETE FROM parts WHERE id = ?", [&id])?;

    if rows_affected == 0 {
        return Err(AppError::NotFound(format!("Part with id {} not found", id)));
    }

    Ok(())
}
