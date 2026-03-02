use rusqlite::Connection;
use tauri::State;
use uuid::Uuid;

use crate::db::DbConnection;
use crate::error::{AppError, AppResult};
use crate::models::service_order::{
    CreateServiceOrderInput, LaborTask, PaginatedServiceOrders, PartInfo, ServiceOrder, ServiceOrderPart, ServiceOrderStatus,
    ServiceOrderWithParts, UpdateServiceOrderInput,
};

/// Auto-cadastra o veículo na tabela vehicles se não existir
fn ensure_vehicle_exists(conn: &Connection, brand: &str, model: &str, year: i32) {
    let exists: bool = conn
        .query_row(
            "SELECT COUNT(*) > 0 FROM vehicles WHERE brand = ? AND model = ? AND year = ?",
            (brand, model, year),
            |row| row.get(0),
        )
        .unwrap_or(false);

    if !exists {
        let id = Uuid::new_v4().to_string();
        let now = chrono::Utc::now().to_rfc3339();
        let _ = conn.execute(
            "INSERT INTO vehicles (id, brand, model, year, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)",
            (&id, brand, model, year, &now, &now),
        );
    }
}

fn parse_labor_tasks(json_str: Option<String>) -> Option<Vec<LaborTask>> {
    json_str.and_then(|s| serde_json::from_str(&s).ok())
}

fn calculate_labor_cost(tasks: &Option<Vec<LaborTask>>) -> f64 {
    tasks
        .as_ref()
        .map(|t| t.iter().map(|task| task.cost).sum())
        .unwrap_or(0.0)
}

fn row_to_service_order(row: &rusqlite::Row) -> rusqlite::Result<ServiceOrder> {
    let status_str: String = row.get(11)?;
    let labor_tasks_str: Option<String> = row.get(10)?;
    Ok(ServiceOrder {
        id: row.get(0)?,
        customer_id: row.get(1)?,
        customer_name: row.get(2)?,
        vehicle_brand: row.get(3)?,
        vehicle_model: row.get(4)?,
        vehicle_year: row.get(5)?,
        vehicle_plate: row.get(6)?,
        mileage: row.get(7)?,
        parts_total: row.get(8)?,
        labor_cost: row.get(9)?,
        labor_tasks: parse_labor_tasks(labor_tasks_str),
        status: status_str.parse().unwrap_or(ServiceOrderStatus::Open),
        created_at: row.get(12)?,
        updated_at: row.get(13)?,
    })
}

const SELECT_SO: &str =
    "so.id, so.customer_id, COALESCE(c.name, so.customer_name) as customer_name, so.vehicle_brand, so.vehicle_model, so.vehicle_year, so.vehicle_plate, so.mileage, so.parts_total, so.labor_cost, so.labor_tasks, so.status, so.created_at, so.updated_at";

const FROM_SO: &str = "service_orders so LEFT JOIN customers c ON so.customer_id = c.id";

fn get_service_order_items(
    conn: &Connection,
    service_order_id: &str,
) -> AppResult<Vec<ServiceOrderPart>> {
    let mut stmt = conn.prepare(
        "SELECT sop.id, sop.service_order_id, sop.part_id, sop.quantity, sop.unit_price, sop.subtotal, sop.created_at, sop.updated_at,
                p.id, p.number, p.name, p.unit_price
         FROM service_order_parts sop
         JOIN parts p ON sop.part_id = p.id
         WHERE sop.service_order_id = ?",
    )?;

    let items = stmt
        .query_map([service_order_id], |row| {
            Ok(ServiceOrderPart {
                id: row.get(0)?,
                service_order_id: row.get(1)?,
                part_id: row.get(2)?,
                quantity: row.get(3)?,
                unit_price: row.get(4)?,
                subtotal: row.get(5)?,
                created_at: row.get(6)?,
                updated_at: row.get(7)?,
                part: Some(PartInfo {
                    id: row.get(8)?,
                    number: row.get(9)?,
                    name: row.get(10)?,
                    unit_price: row.get(11)?,
                }),
            })
        })?
        .collect::<Result<Vec<_>, _>>()?;

    Ok(items)
}

fn update_parts_total(conn: &Connection, service_order_id: &str) -> AppResult<f64> {
    let total: f64 = conn.query_row(
        "SELECT COALESCE(SUM(subtotal), 0) FROM service_order_parts WHERE service_order_id = ?",
        [service_order_id],
        |row| row.get(0),
    )?;

    conn.execute(
        "UPDATE service_orders SET parts_total = ?, updated_at = ? WHERE id = ?",
        (total, chrono::Utc::now().to_rfc3339(), service_order_id),
    )?;

    Ok(total)
}

#[tauri::command]
pub fn list_service_orders(db: State<DbConnection>, page: Option<i64>, page_size: Option<i64>, customer_id: Option<String>) -> AppResult<PaginatedServiceOrders> {
    let conn = db.0.lock().map_err(|_| AppError::Internal("Failed to acquire database lock".to_string()))?;

    let page = page.unwrap_or(1).max(1);
    let page_size = page_size.unwrap_or(10).max(1).min(100);
    let offset = (page - 1) * page_size;

    let (where_clause, count_where) = if customer_id.is_some() {
        (" WHERE so.customer_id = ?", " WHERE customer_id = ?")
    } else {
        ("", "")
    };

    let count_sql = format!("SELECT COUNT(*) FROM service_orders{}", count_where);
    let total: i64 = if let Some(ref cid) = customer_id {
        conn.query_row(&count_sql, [cid], |row| row.get(0))?
    } else {
        conn.query_row(&count_sql, [], |row| row.get(0))?
    };
    let total_pages = (total as f64 / page_size as f64).ceil() as i64;

    let query = format!(
        "SELECT {} FROM {}{} ORDER BY so.created_at DESC LIMIT ? OFFSET ?",
        SELECT_SO, FROM_SO, where_clause
    );
    let mut stmt = conn.prepare(&query)?;

    let orders: Vec<ServiceOrder> = if let Some(ref cid) = customer_id {
        stmt.query_map(rusqlite::params![cid, page_size, offset], |row| row_to_service_order(row))?
            .collect::<Result<Vec<_>, _>>()?
    } else {
        stmt.query_map([page_size, offset], |row| row_to_service_order(row))?
            .collect::<Result<Vec<_>, _>>()?
    };

    let mut result = Vec::new();
    for order in orders {
        let items = get_service_order_items(&conn, &order.id)?;
        let total = order.total();
        result.push(ServiceOrderWithParts {
            service_order: order,
            items,
            total,
        });
    }

    Ok(PaginatedServiceOrders {
        items: result,
        total,
        page,
        page_size,
        total_pages,
    })
}

#[tauri::command]
pub fn get_service_order(db: State<DbConnection>, id: String) -> AppResult<ServiceOrderWithParts> {
    let conn = db.0.lock().map_err(|_| AppError::Internal("Failed to acquire database lock".to_string()))?;

    let query = format!("SELECT {} FROM {} WHERE so.id = ?", SELECT_SO, FROM_SO);
    let order = conn
        .query_row(&query, [&id], |row| row_to_service_order(row))
        .map_err(|e| match e {
            rusqlite::Error::QueryReturnedNoRows => {
                AppError::NotFound(format!("Service order with id {} not found", id))
            }
            _ => AppError::Database(e),
        })?;

    let items = get_service_order_items(&conn, &id)?;
    let total = order.total();

    Ok(ServiceOrderWithParts {
        service_order: order,
        items,
        total,
    })
}

#[tauri::command]
pub fn create_service_order(
    db: State<DbConnection>,
    input: CreateServiceOrderInput,
) -> AppResult<ServiceOrderWithParts> {
    let conn = db.0.lock().map_err(|_| AppError::Internal("Failed to acquire database lock".to_string()))?;

    ensure_vehicle_exists(&conn, &input.vehicle_brand, &input.vehicle_model, input.vehicle_year);

    let id = Uuid::new_v4().to_string();
    let now = chrono::Utc::now().to_rfc3339();
    let labor_cost = calculate_labor_cost(&input.labor_tasks);
    let labor_tasks_json = input
        .labor_tasks
        .as_ref()
        .map(|t| serde_json::to_string(t).unwrap_or_default());

    conn.execute(
        "INSERT INTO service_orders (id, customer_id, customer_name, vehicle_brand, vehicle_model, vehicle_year, vehicle_plate, mileage, parts_total, labor_cost, labor_tasks, status, created_at, updated_at)
         VALUES (?, ?, '', ?, ?, ?, ?, ?, 0, ?, ?, 'OPEN', ?, ?)",
        (
            &id,
            &input.customer_id,
            &input.vehicle_brand,
            &input.vehicle_model,
            input.vehicle_year,
            &input.vehicle_plate,
            input.mileage,
            labor_cost,
            &labor_tasks_json,
            &now,
            &now,
        ),
    )?;

    if let Some(parts) = &input.parts {
        for part in parts {
            let part_id = Uuid::new_v4().to_string();
            let subtotal = part.quantity as f64 * part.unit_price;
            conn.execute(
                "INSERT INTO service_order_parts (id, service_order_id, part_id, quantity, unit_price, subtotal, created_at, updated_at)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
                (&part_id, &id, &part.part_id, part.quantity, part.unit_price, subtotal, &now, &now),
            )?;
        }
    }

    update_parts_total(&conn, &id)?;

    let query = format!("SELECT {} FROM {} WHERE so.id = ?", SELECT_SO, FROM_SO);
    let order = conn.query_row(&query, [&id], |row| row_to_service_order(row))?;
    let items = get_service_order_items(&conn, &id)?;
    let total = order.total();

    Ok(ServiceOrderWithParts { service_order: order, items, total })
}

#[tauri::command]
pub fn update_service_order(
    db: State<DbConnection>,
    id: String,
    input: UpdateServiceOrderInput,
) -> AppResult<ServiceOrderWithParts> {
    let conn = db.0.lock().map_err(|_| AppError::Internal("Failed to acquire database lock".to_string()))?;

    let query = format!("SELECT {} FROM {} WHERE so.id = ?", SELECT_SO, FROM_SO);
    let order = conn
        .query_row(&query, [&id], |row| row_to_service_order(row))
        .map_err(|e| match e {
            rusqlite::Error::QueryReturnedNoRows => {
                AppError::NotFound(format!("Service order with id {} not found", id))
            }
            _ => AppError::Database(e),
        })?;

    let now = chrono::Utc::now().to_rfc3339();
    let new_customer_id = input.customer_id.or(order.customer_id);
    let new_vehicle_brand = input.vehicle_brand.unwrap_or(order.vehicle_brand);
    let new_vehicle_model = input.vehicle_model.unwrap_or(order.vehicle_model);
    let new_vehicle_year = input.vehicle_year.unwrap_or(order.vehicle_year);
    let new_vehicle_plate = input.vehicle_plate.or(order.vehicle_plate);
    let new_mileage = input.mileage.or(order.mileage);
    let new_labor_tasks = input.labor_tasks.or(order.labor_tasks);
    let new_labor_cost = calculate_labor_cost(&new_labor_tasks);
    let labor_tasks_json = new_labor_tasks
        .as_ref()
        .map(|t| serde_json::to_string(t).unwrap_or_default());
    let new_status = input.status.unwrap_or(order.status);

    ensure_vehicle_exists(&conn, &new_vehicle_brand, &new_vehicle_model, new_vehicle_year);

    conn.execute(
        "UPDATE service_orders SET customer_id = ?, vehicle_brand = ?, vehicle_model = ?, vehicle_year = ?, vehicle_plate = ?, mileage = ?, labor_cost = ?, labor_tasks = ?, status = ?, updated_at = ? WHERE id = ?",
        (
            &new_customer_id,
            &new_vehicle_brand,
            &new_vehicle_model,
            new_vehicle_year,
            &new_vehicle_plate,
            new_mileage,
            new_labor_cost,
            &labor_tasks_json,
            new_status.to_string(),
            &now,
            &id,
        ),
    )?;

    if let Some(parts) = &input.parts {
        conn.execute("DELETE FROM service_order_parts WHERE service_order_id = ?", [&id])?;
        for part in parts {
            let part_id = Uuid::new_v4().to_string();
            let subtotal = part.quantity as f64 * part.unit_price;
            conn.execute(
                "INSERT INTO service_order_parts (id, service_order_id, part_id, quantity, unit_price, subtotal, created_at, updated_at)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
                (&part_id, &id, &part.part_id, part.quantity, part.unit_price, subtotal, &now, &now),
            )?;
        }
    }

    update_parts_total(&conn, &id)?;

    let query2 = format!("SELECT {} FROM {} WHERE so.id = ?", SELECT_SO, FROM_SO);
    let updated_order = conn.query_row(&query2, [&id], |row| row_to_service_order(row))?;
    let items = get_service_order_items(&conn, &id)?;
    let total = updated_order.total();

    Ok(ServiceOrderWithParts { service_order: updated_order, items, total })
}

#[tauri::command]
pub fn delete_service_order(db: State<DbConnection>, id: String) -> AppResult<()> {
    let conn = db.0.lock().map_err(|_| AppError::Internal("Failed to acquire database lock".to_string()))?;
    let rows_affected = conn.execute("DELETE FROM service_orders WHERE id = ?", [&id])?;
    if rows_affected == 0 {
        return Err(AppError::NotFound(format!("Service order with id {} not found", id)));
    }
    Ok(())
}

#[tauri::command]
pub fn finish_service_order(db: State<DbConnection>, id: String) -> AppResult<ServiceOrderWithParts> {
    let conn = db.0.lock().map_err(|_| AppError::Internal("Failed to acquire database lock".to_string()))?;

    let now = chrono::Utc::now().to_rfc3339();
    let rows_affected = conn.execute(
        "UPDATE service_orders SET status = 'FINISHED', updated_at = ? WHERE id = ?",
        (&now, &id),
    )?;

    if rows_affected == 0 {
        return Err(AppError::NotFound(format!("Service order with id {} not found", id)));
    }

    let query = format!("SELECT {} FROM {} WHERE so.id = ?", SELECT_SO, FROM_SO);
    let order = conn.query_row(&query, [&id], |row| row_to_service_order(row))?;
    let items = get_service_order_items(&conn, &id)?;
    let total = order.total();

    Ok(ServiceOrderWithParts { service_order: order, items, total })
}
