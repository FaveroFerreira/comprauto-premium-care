use rusqlite::Connection;
use tauri::State;
use uuid::Uuid;

use crate::db::DbConnection;
use crate::error::{AppError, AppResult};
use crate::models::quote::{
    CreateQuoteInput, PaginatedQuotes, PartInfo, Quote, QuotePart, QuoteStatus, QuoteWithParts, UpdateQuoteInput,
};
use crate::models::service_order::{LaborTask, ServiceOrderStatus};

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

fn next_number(conn: &Connection, counter_name: &str) -> crate::error::AppResult<i64> {
    conn.execute(
        "UPDATE counters SET value = value + 1 WHERE name = ?",
        [counter_name],
    )?;
    let value: i64 = conn.query_row(
        "SELECT value FROM counters WHERE name = ?",
        [counter_name],
        |row| row.get(0),
    )?;
    Ok(value)
}

fn row_to_quote(row: &rusqlite::Row) -> rusqlite::Result<Quote> {
    let labor_tasks_str: Option<String> = row.get(11)?;
    let status_str: String = row.get(12)?;
    Ok(Quote {
        id: row.get(0)?,
        number: row.get(1)?,
        customer_id: row.get(2)?,
        customer_name: row.get(3)?,
        vehicle_brand: row.get(4)?,
        vehicle_model: row.get(5)?,
        vehicle_year: row.get(6)?,
        vehicle_plate: row.get(7)?,
        mileage: row.get(8)?,
        parts_total: row.get(9)?,
        labor_cost: row.get(10)?,
        labor_tasks: parse_labor_tasks(labor_tasks_str),
        status: status_str.parse().unwrap_or(QuoteStatus::Pending),
        valid_until: row.get(13)?,
        converted_service_order_id: row.get(14)?,
        created_at: row.get(15)?,
        updated_at: row.get(16)?,
    })
}

const SELECT_Q: &str =
    "q.id, q.number, q.customer_id, COALESCE(c.name, q.customer_name) as customer_name, q.vehicle_brand, q.vehicle_model, q.vehicle_year, q.vehicle_plate, q.mileage, q.parts_total, q.labor_cost, q.labor_tasks, q.status, q.valid_until, q.converted_service_order_id, q.created_at, q.updated_at";

const FROM_Q: &str = "quotes q LEFT JOIN customers c ON q.customer_id = c.id";

fn get_quote_items(conn: &Connection, quote_id: &str) -> AppResult<Vec<QuotePart>> {
    let mut stmt = conn.prepare(
        "SELECT qp.id, qp.quote_id, qp.part_id, qp.quantity, qp.unit_price, qp.subtotal, qp.created_at, qp.updated_at,
                p.id, p.number, p.name, p.unit_price
         FROM quote_parts qp
         JOIN parts p ON qp.part_id = p.id
         WHERE qp.quote_id = ?",
    )?;

    let items = stmt
        .query_map([quote_id], |row| {
            Ok(QuotePart {
                id: row.get(0)?,
                quote_id: row.get(1)?,
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

fn update_parts_total(conn: &Connection, quote_id: &str) -> AppResult<f64> {
    let total: f64 = conn.query_row(
        "SELECT COALESCE(SUM(subtotal), 0) FROM quote_parts WHERE quote_id = ?",
        [quote_id],
        |row| row.get(0),
    )?;

    conn.execute(
        "UPDATE quotes SET parts_total = ?, updated_at = ? WHERE id = ?",
        (total, chrono::Utc::now().to_rfc3339(), quote_id),
    )?;

    Ok(total)
}

#[tauri::command]
pub fn list_quotes(db: State<DbConnection>, page: Option<i64>, page_size: Option<i64>, customer_id: Option<String>, vehicle_plate: Option<String>) -> AppResult<PaginatedQuotes> {
    let conn = db.0.lock().map_err(|_| AppError::Internal("Failed to acquire database lock".to_string()))?;

    let page = page.unwrap_or(1).max(1);
    let page_size = page_size.unwrap_or(10).max(1).min(100);
    let offset = (page - 1) * page_size;

    let mut conditions = Vec::new();
    let mut params: Vec<Box<dyn rusqlite::types::ToSql>> = Vec::new();

    if let Some(ref cid) = customer_id {
        conditions.push("q.customer_id = ?");
        params.push(Box::new(cid.clone()));
    }
    if let Some(ref plate) = vehicle_plate {
        if !plate.is_empty() {
            conditions.push("q.vehicle_plate LIKE ?");
            params.push(Box::new(format!("%{}%", plate)));
        }
    }

    let where_clause = if conditions.is_empty() {
        String::new()
    } else {
        format!(" WHERE {}", conditions.join(" AND "))
    };

    let count_sql = format!("SELECT COUNT(*) FROM quotes q{}", where_clause);
    let total: i64 = conn.query_row(&count_sql, rusqlite::params_from_iter(params.iter().map(|p| p.as_ref())), |row| row.get(0))?;
    let total_pages = (total as f64 / page_size as f64).ceil() as i64;

    params.push(Box::new(page_size));
    params.push(Box::new(offset));

    let query = format!(
        "SELECT {} FROM {}{} ORDER BY q.created_at DESC LIMIT ? OFFSET ?",
        SELECT_Q, FROM_Q, where_clause
    );
    let mut stmt = conn.prepare(&query)?;

    let quotes: Vec<Quote> = stmt
        .query_map(rusqlite::params_from_iter(params.iter().map(|p| p.as_ref())), |row| row_to_quote(row))?
        .collect::<Result<Vec<_>, _>>()?;

    let mut result = Vec::new();
    for quote in quotes {
        let items = get_quote_items(&conn, &quote.id)?;
        let total = quote.total();
        result.push(QuoteWithParts { quote, items, total });
    }

    Ok(PaginatedQuotes {
        items: result,
        total,
        page,
        page_size,
        total_pages,
    })
}

#[tauri::command]
pub fn get_quote(db: State<DbConnection>, id: String) -> AppResult<QuoteWithParts> {
    let conn = db.0.lock().map_err(|_| AppError::Internal("Failed to acquire database lock".to_string()))?;

    let query = format!("SELECT {} FROM {} WHERE q.id = ?", SELECT_Q, FROM_Q);
    let quote = conn
        .query_row(&query, [&id], |row| row_to_quote(row))
        .map_err(|e| match e {
            rusqlite::Error::QueryReturnedNoRows => {
                AppError::NotFound(format!("Quote with id {} not found", id))
            }
            _ => AppError::Database(e),
        })?;

    let items = get_quote_items(&conn, &id)?;
    let total = quote.total();

    Ok(QuoteWithParts { quote, items, total })
}

#[tauri::command]
pub fn create_quote(db: State<DbConnection>, input: CreateQuoteInput) -> AppResult<QuoteWithParts> {
    let conn = db.0.lock().map_err(|_| AppError::Internal("Failed to acquire database lock".to_string()))?;

    ensure_vehicle_exists(&conn, &input.vehicle_brand, &input.vehicle_model, input.vehicle_year);

    let id = Uuid::new_v4().to_string();
    let now = chrono::Utc::now().to_rfc3339();
    let number = next_number(&conn, "quotes")?;
    let labor_cost = calculate_labor_cost(&input.labor_tasks);
    let labor_tasks_json = input
        .labor_tasks
        .as_ref()
        .map(|t| serde_json::to_string(t).unwrap_or_default());

    let valid_until = input.valid_until.or_else(|| {
        Some(
            (chrono::Utc::now() + chrono::Duration::days(7))
                .format("%Y-%m-%d")
                .to_string(),
        )
    });

    conn.execute(
        "INSERT INTO quotes (id, number, customer_id, customer_name, vehicle_brand, vehicle_model, vehicle_year, vehicle_plate, mileage, parts_total, labor_cost, labor_tasks, status, valid_until, created_at, updated_at)
         VALUES (?, ?, ?, '', ?, ?, ?, ?, ?, 0, ?, ?, 'PENDING', ?, ?, ?)",
        (
            &id,
            number,
            &input.customer_id,
            &input.vehicle_brand,
            &input.vehicle_model,
            input.vehicle_year,
            &input.vehicle_plate,
            input.mileage,
            labor_cost,
            &labor_tasks_json,
            &valid_until,
            &now,
            &now,
        ),
    )?;

    if let Some(parts) = &input.parts {
        for part in parts {
            let part_id = Uuid::new_v4().to_string();
            let subtotal = part.quantity as f64 * part.unit_price;
            conn.execute(
                "INSERT INTO quote_parts (id, quote_id, part_id, quantity, unit_price, subtotal, created_at, updated_at)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
                (&part_id, &id, &part.part_id, part.quantity, part.unit_price, subtotal, &now, &now),
            )?;
        }
    }

    update_parts_total(&conn, &id)?;

    let query = format!("SELECT {} FROM {} WHERE q.id = ?", SELECT_Q, FROM_Q);
    let quote = conn.query_row(&query, [&id], |row| row_to_quote(row))?;
    let items = get_quote_items(&conn, &id)?;
    let total = quote.total();

    Ok(QuoteWithParts { quote, items, total })
}

#[tauri::command]
pub fn update_quote(db: State<DbConnection>, id: String, input: UpdateQuoteInput) -> AppResult<QuoteWithParts> {
    let conn = db.0.lock().map_err(|_| AppError::Internal("Failed to acquire database lock".to_string()))?;

    let query = format!("SELECT {} FROM {} WHERE q.id = ?", SELECT_Q, FROM_Q);
    let quote = conn
        .query_row(&query, [&id], |row| row_to_quote(row))
        .map_err(|e| match e {
            rusqlite::Error::QueryReturnedNoRows => {
                AppError::NotFound(format!("Quote with id {} not found", id))
            }
            _ => AppError::Database(e),
        })?;

    if quote.status == QuoteStatus::Converted {
        return Err(AppError::Validation(
            "Cannot update a converted quote".to_string(),
        ));
    }

    let now = chrono::Utc::now().to_rfc3339();
    let new_customer_id = input.customer_id.or(quote.customer_id);
    let new_vehicle_brand = input.vehicle_brand.unwrap_or(quote.vehicle_brand);
    let new_vehicle_model = input.vehicle_model.unwrap_or(quote.vehicle_model);
    let new_vehicle_year = input.vehicle_year.unwrap_or(quote.vehicle_year);
    let new_vehicle_plate = input.vehicle_plate.or(quote.vehicle_plate);
    let new_mileage = input.mileage.or(quote.mileage);
    let new_labor_tasks = input.labor_tasks.or(quote.labor_tasks);
    let new_labor_cost = calculate_labor_cost(&new_labor_tasks);
    let labor_tasks_json = new_labor_tasks
        .as_ref()
        .map(|t| serde_json::to_string(t).unwrap_or_default());
    let new_status = input.status.unwrap_or(quote.status);
    let new_valid_until = input.valid_until.or(quote.valid_until);

    ensure_vehicle_exists(&conn, &new_vehicle_brand, &new_vehicle_model, new_vehicle_year);

    conn.execute(
        "UPDATE quotes SET customer_id = ?, vehicle_brand = ?, vehicle_model = ?, vehicle_year = ?, vehicle_plate = ?, mileage = ?, labor_cost = ?, labor_tasks = ?, status = ?, valid_until = ?, updated_at = ? WHERE id = ?",
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
            &new_valid_until,
            &now,
            &id,
        ),
    )?;

    if let Some(parts) = &input.parts {
        conn.execute("DELETE FROM quote_parts WHERE quote_id = ?", [&id])?;
        for part in parts {
            let part_id = Uuid::new_v4().to_string();
            let subtotal = part.quantity as f64 * part.unit_price;
            conn.execute(
                "INSERT INTO quote_parts (id, quote_id, part_id, quantity, unit_price, subtotal, created_at, updated_at)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
                (&part_id, &id, &part.part_id, part.quantity, part.unit_price, subtotal, &now, &now),
            )?;
        }
    }

    update_parts_total(&conn, &id)?;

    let query2 = format!("SELECT {} FROM {} WHERE q.id = ?", SELECT_Q, FROM_Q);
    let updated_quote = conn.query_row(&query2, [&id], |row| row_to_quote(row))?;
    let items = get_quote_items(&conn, &id)?;
    let total = updated_quote.total();

    Ok(QuoteWithParts { quote: updated_quote, items, total })
}

#[tauri::command]
pub fn delete_quote(db: State<DbConnection>, id: String) -> AppResult<()> {
    let conn = db.0.lock().map_err(|_| AppError::Internal("Failed to acquire database lock".to_string()))?;
    let rows_affected = conn.execute("DELETE FROM quotes WHERE id = ?", [&id])?;
    if rows_affected == 0 {
        return Err(AppError::NotFound(format!("Quote with id {} not found", id)));
    }
    Ok(())
}

#[tauri::command]
pub fn convert_quote_to_service_order(
    db: State<DbConnection>,
    id: String,
) -> AppResult<crate::models::service_order::ServiceOrderWithParts> {
    let conn = db.0.lock().map_err(|_| AppError::Internal("Failed to acquire database lock".to_string()))?;

    let query = format!("SELECT {} FROM {} WHERE q.id = ?", SELECT_Q, FROM_Q);
    let quote = conn
        .query_row(&query, [&id], |row| row_to_quote(row))
        .map_err(|e| match e {
            rusqlite::Error::QueryReturnedNoRows => {
                AppError::NotFound(format!("Quote with id {} not found", id))
            }
            _ => AppError::Database(e),
        })?;

    if quote.status == QuoteStatus::Converted {
        return Err(AppError::Validation(
            "Quote has already been converted to a service order".to_string(),
        ));
    }
    if quote.status == QuoteStatus::Rejected {
        return Err(AppError::Validation(
            "Cannot convert a rejected quote".to_string(),
        ));
    }

    let quote_items = get_quote_items(&conn, &id)?;

    let now = chrono::Utc::now().to_rfc3339();
    let service_order_id = Uuid::new_v4().to_string();
    let labor_tasks_json = quote
        .labor_tasks
        .as_ref()
        .map(|t| serde_json::to_string(t).unwrap_or_default());

    let so_number = next_number(&conn, "service_orders")?;

    conn.execute(
        "INSERT INTO service_orders (id, number, customer_id, customer_name, vehicle_brand, vehicle_model, vehicle_year, vehicle_plate, mileage, parts_total, labor_cost, labor_tasks, status, created_at, updated_at)
         VALUES (?, ?, ?, '', ?, ?, ?, ?, ?, ?, ?, ?, 'OPEN', ?, ?)",
        (
            &service_order_id,
            so_number,
            &quote.customer_id,
            &quote.vehicle_brand,
            &quote.vehicle_model,
            quote.vehicle_year,
            &quote.vehicle_plate,
            quote.mileage,
            quote.parts_total,
            quote.labor_cost,
            &labor_tasks_json,
            &now,
            &now,
        ),
    )?;

    for item in &quote_items {
        let part_id = Uuid::new_v4().to_string();
        conn.execute(
            "INSERT INTO service_order_parts (id, service_order_id, part_id, quantity, unit_price, subtotal, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
            (
                &part_id,
                &service_order_id,
                &item.part_id,
                item.quantity,
                item.unit_price,
                item.subtotal,
                &now,
                &now,
            ),
        )?;
    }

    conn.execute(
        "UPDATE quotes SET status = 'CONVERTED', converted_service_order_id = ?, updated_at = ? WHERE id = ?",
        (&service_order_id, &now, &id),
    )?;

    // Return the created service order using the same JOIN pattern from service_orders module
    let so_query = "SELECT so.id, so.number, so.customer_id, COALESCE(c.name, so.customer_name) as customer_name, so.vehicle_brand, so.vehicle_model, so.vehicle_year, so.vehicle_plate, so.mileage, so.parts_total, so.labor_cost, so.labor_tasks, so.status, so.created_at, so.updated_at FROM service_orders so LEFT JOIN customers c ON so.customer_id = c.id WHERE so.id = ?";

    let status_parse = |s: &str| -> ServiceOrderStatus {
        s.parse().unwrap_or(ServiceOrderStatus::Open)
    };

    let service_order = conn.query_row(so_query, [&service_order_id], |row| {
        let status_str: String = row.get(12)?;
        let labor_tasks_str: Option<String> = row.get(11)?;
        Ok(crate::models::service_order::ServiceOrder {
            id: row.get(0)?,
            number: row.get(1)?,
            customer_id: row.get(2)?,
            customer_name: row.get(3)?,
            vehicle_brand: row.get(4)?,
            vehicle_model: row.get(5)?,
            vehicle_year: row.get(6)?,
            vehicle_plate: row.get(7)?,
            mileage: row.get(8)?,
            parts_total: row.get(9)?,
            labor_cost: row.get(10)?,
            labor_tasks: parse_labor_tasks(labor_tasks_str),
            status: status_parse(&status_str),
            created_at: row.get(13)?,
            updated_at: row.get(14)?,
        })
    })?;

    let mut stmt = conn.prepare(
        "SELECT sop.id, sop.service_order_id, sop.part_id, sop.quantity, sop.unit_price, sop.subtotal, sop.created_at, sop.updated_at,
                p.id, p.number, p.name, p.unit_price
         FROM service_order_parts sop
         JOIN parts p ON sop.part_id = p.id
         WHERE sop.service_order_id = ?",
    )?;

    let items: Vec<crate::models::service_order::ServiceOrderPart> = stmt
        .query_map([&service_order_id], |row| {
            Ok(crate::models::service_order::ServiceOrderPart {
                id: row.get(0)?,
                service_order_id: row.get(1)?,
                part_id: row.get(2)?,
                quantity: row.get(3)?,
                unit_price: row.get(4)?,
                subtotal: row.get(5)?,
                created_at: row.get(6)?,
                updated_at: row.get(7)?,
                part: Some(crate::models::service_order::PartInfo {
                    id: row.get(8)?,
                    number: row.get(9)?,
                    name: row.get(10)?,
                    unit_price: row.get(11)?,
                }),
            })
        })?
        .collect::<Result<Vec<_>, _>>()?;

    let total = service_order.total();

    Ok(crate::models::service_order::ServiceOrderWithParts {
        service_order,
        items,
        total,
    })
}
