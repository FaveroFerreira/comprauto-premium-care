use tauri::State;
use uuid::Uuid;

use crate::db::DbConnection;
use crate::error::{AppError, AppResult};
use crate::models::customer::{CreateCustomerInput, Customer, PaginatedCustomers, UpdateCustomerInput};

fn row_to_customer(row: &rusqlite::Row) -> rusqlite::Result<Customer> {
    Ok(Customer {
        id: row.get(0)?,
        name: row.get(1)?,
        phone: row.get(2)?,
        email: row.get(3)?,
        cpf_cnpj: row.get(4)?,
        address_street: row.get(5)?,
        address_city: row.get(6)?,
        address_state: row.get(7)?,
        address_zip: row.get(8)?,
        created_at: row.get(9)?,
        updated_at: row.get(10)?,
    })
}

const SELECT_COLUMNS: &str = "id, name, phone, email, cpf_cnpj, address_street, address_city, address_state, address_zip, created_at, updated_at";

#[tauri::command]
pub fn list_customers(db: State<DbConnection>, page: Option<i64>, page_size: Option<i64>) -> AppResult<PaginatedCustomers> {
    let conn = db.0.lock().map_err(|_| AppError::Internal("Failed to acquire database lock".to_string()))?;

    let page = page.unwrap_or(1).max(1);
    let page_size = page_size.unwrap_or(10).max(1).min(100);
    let offset = (page - 1) * page_size;

    let total: i64 = conn.query_row("SELECT COUNT(*) FROM customers", [], |row| row.get(0))?;
    let total_pages = (total as f64 / page_size as f64).ceil() as i64;

    let query = format!(
        "SELECT {} FROM customers ORDER BY name ASC LIMIT ? OFFSET ?",
        SELECT_COLUMNS
    );
    let mut stmt = conn.prepare(&query)?;

    let customers = stmt
        .query_map([page_size, offset], |row| row_to_customer(row))?
        .collect::<Result<Vec<_>, _>>()?;

    Ok(PaginatedCustomers {
        items: customers,
        total,
        page,
        page_size,
        total_pages,
    })
}

#[tauri::command]
pub fn search_customers(db: State<DbConnection>, query: String) -> AppResult<Vec<Customer>> {
    let conn = db.0.lock().map_err(|_| AppError::Internal("Failed to acquire database lock".to_string()))?;
    let search_term = format!("%{}%", query);
    let sql = format!(
        "SELECT {} FROM customers WHERE name LIKE ?1 OR phone LIKE ?1 OR cpf_cnpj LIKE ?1 ORDER BY name ASC LIMIT 20",
        SELECT_COLUMNS
    );
    let mut stmt = conn.prepare(&sql)?;

    let customers = stmt
        .query_map([&search_term], |row| row_to_customer(row))?
        .collect::<Result<Vec<_>, _>>()?;

    Ok(customers)
}

#[tauri::command]
pub fn get_customer(db: State<DbConnection>, id: String) -> AppResult<Customer> {
    let conn = db.0.lock().map_err(|_| AppError::Internal("Failed to acquire database lock".to_string()))?;
    let sql = format!("SELECT {} FROM customers WHERE id = ?", SELECT_COLUMNS);
    let customer = conn
        .query_row(&sql, [&id], |row| row_to_customer(row))
        .map_err(|e| match e {
            rusqlite::Error::QueryReturnedNoRows => {
                AppError::NotFound(format!("Customer with id {} not found", id))
            }
            _ => AppError::Database(e),
        })?;

    Ok(customer)
}

#[tauri::command]
pub fn create_customer(db: State<DbConnection>, input: CreateCustomerInput) -> AppResult<Customer> {
    let conn = db.0.lock().map_err(|_| AppError::Internal("Failed to acquire database lock".to_string()))?;

    let id = Uuid::new_v4().to_string();
    let now = chrono::Utc::now().to_rfc3339();

    conn.execute(
        "INSERT INTO customers (id, name, phone, email, cpf_cnpj, address_street, address_city, address_state, address_zip, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        (
            &id,
            &input.name,
            &input.phone,
            &input.email,
            &input.cpf_cnpj,
            &input.address_street,
            &input.address_city,
            &input.address_state,
            &input.address_zip,
            &now,
            &now,
        ),
    )?;

    Ok(Customer {
        id,
        name: input.name,
        phone: input.phone,
        email: input.email,
        cpf_cnpj: input.cpf_cnpj,
        address_street: input.address_street,
        address_city: input.address_city,
        address_state: input.address_state,
        address_zip: input.address_zip,
        created_at: now.clone(),
        updated_at: now,
    })
}

#[tauri::command]
pub fn update_customer(db: State<DbConnection>, id: String, input: UpdateCustomerInput) -> AppResult<Customer> {
    let conn = db.0.lock().map_err(|_| AppError::Internal("Failed to acquire database lock".to_string()))?;

    let sql = format!("SELECT {} FROM customers WHERE id = ?", SELECT_COLUMNS);
    let existing = conn
        .query_row(&sql, [&id], |row| row_to_customer(row))
        .map_err(|e| match e {
            rusqlite::Error::QueryReturnedNoRows => {
                AppError::NotFound(format!("Customer with id {} not found", id))
            }
            _ => AppError::Database(e),
        })?;

    let now = chrono::Utc::now().to_rfc3339();
    let new_name = input.name.unwrap_or(existing.name);
    let new_phone = input.phone.or(existing.phone);
    let new_email = input.email.or(existing.email);
    let new_cpf_cnpj = input.cpf_cnpj.or(existing.cpf_cnpj);
    let new_address_street = input.address_street.or(existing.address_street);
    let new_address_city = input.address_city.or(existing.address_city);
    let new_address_state = input.address_state.or(existing.address_state);
    let new_address_zip = input.address_zip.or(existing.address_zip);

    conn.execute(
        "UPDATE customers SET name = ?, phone = ?, email = ?, cpf_cnpj = ?, address_street = ?, address_city = ?, address_state = ?, address_zip = ?, updated_at = ? WHERE id = ?",
        (
            &new_name,
            &new_phone,
            &new_email,
            &new_cpf_cnpj,
            &new_address_street,
            &new_address_city,
            &new_address_state,
            &new_address_zip,
            &now,
            &id,
        ),
    )?;

    Ok(Customer {
        id,
        name: new_name,
        phone: new_phone,
        email: new_email,
        cpf_cnpj: new_cpf_cnpj,
        address_street: new_address_street,
        address_city: new_address_city,
        address_state: new_address_state,
        address_zip: new_address_zip,
        created_at: existing.created_at,
        updated_at: now,
    })
}

#[tauri::command]
pub fn delete_customer(db: State<DbConnection>, id: String) -> AppResult<()> {
    let conn = db.0.lock().map_err(|_| AppError::Internal("Failed to acquire database lock".to_string()))?;

    // Check for references
    let has_orders: bool = conn
        .query_row(
            "SELECT COUNT(*) > 0 FROM service_orders WHERE customer_id = ?",
            [&id],
            |row| row.get(0),
        )
        .unwrap_or(false);

    let has_quotes: bool = conn
        .query_row(
            "SELECT COUNT(*) > 0 FROM quotes WHERE customer_id = ?",
            [&id],
            |row| row.get(0),
        )
        .unwrap_or(false);

    if has_orders || has_quotes {
        return Err(AppError::Validation(
            "Não é possível excluir um cliente que possui ordens de serviço ou orçamentos vinculados".to_string(),
        ));
    }

    let rows_affected = conn.execute("DELETE FROM customers WHERE id = ?", [&id])?;

    if rows_affected == 0 {
        return Err(AppError::NotFound(format!("Customer with id {} not found", id)));
    }

    Ok(())
}
