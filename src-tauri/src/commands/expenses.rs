use tauri::State;
use uuid::Uuid;

use crate::db::DbConnection;
use crate::error::{AppError, AppResult};
use crate::models::expense::{CreateExpenseInput, Expense, ExpenseCategory, PaginatedExpenses, UpdateExpenseInput};

#[tauri::command]
pub fn list_expenses(db: State<DbConnection>, page: Option<i64>, page_size: Option<i64>) -> AppResult<PaginatedExpenses> {
    let conn = db.0.lock().map_err(|_| AppError::Internal("Failed to acquire database lock".to_string()))?;

    let page = page.unwrap_or(1).max(1);
    let page_size = page_size.unwrap_or(10).max(1).min(100);
    let offset = (page - 1) * page_size;

    // Get total count
    let total: i64 = conn.query_row("SELECT COUNT(*) FROM expenses", [], |row| row.get(0))?;
    let total_pages = (total as f64 / page_size as f64).ceil() as i64;

    let mut stmt = conn.prepare(
        "SELECT id, description, amount, category, supplier_name, reference, expense_date, notes, created_at, updated_at
         FROM expenses
         ORDER BY expense_date DESC
         LIMIT ? OFFSET ?",
    )?;

    let expenses = stmt
        .query_map([page_size, offset], |row| {
            let category_str: String = row.get(3)?;
            Ok(Expense {
                id: row.get(0)?,
                description: row.get(1)?,
                amount: row.get(2)?,
                category: category_str.parse().unwrap_or(ExpenseCategory::Other),
                supplier_name: row.get(4)?,
                reference: row.get(5)?,
                expense_date: row.get(6)?,
                notes: row.get(7)?,
                created_at: row.get(8)?,
                updated_at: row.get(9)?,
            })
        })?
        .collect::<Result<Vec<_>, _>>()?;

    Ok(PaginatedExpenses {
        items: expenses,
        total,
        page,
        page_size,
        total_pages,
    })
}

#[tauri::command]
pub fn get_expense(db: State<DbConnection>, id: String) -> AppResult<Expense> {
    let conn = db.0.lock().map_err(|_| AppError::Internal("Failed to acquire database lock".to_string()))?;
    let expense = conn
        .query_row(
            "SELECT id, description, amount, category, supplier_name, reference, expense_date, notes, created_at, updated_at
             FROM expenses WHERE id = ?",
            [&id],
            |row| {
                let category_str: String = row.get(3)?;
                Ok(Expense {
                    id: row.get(0)?,
                    description: row.get(1)?,
                    amount: row.get(2)?,
                    category: category_str.parse().unwrap_or(ExpenseCategory::Other),
                    supplier_name: row.get(4)?,
                    reference: row.get(5)?,
                    expense_date: row.get(6)?,
                    notes: row.get(7)?,
                    created_at: row.get(8)?,
                    updated_at: row.get(9)?,
                })
            },
        )
        .map_err(|e| match e {
            rusqlite::Error::QueryReturnedNoRows => {
                AppError::NotFound(format!("Expense with id {} not found", id))
            }
            _ => AppError::Database(e),
        })?;

    Ok(expense)
}

#[tauri::command]
pub fn create_expense(db: State<DbConnection>, input: CreateExpenseInput) -> AppResult<Expense> {
    let conn = db.0.lock().map_err(|_| AppError::Internal("Failed to acquire database lock".to_string()))?;

    let id = Uuid::new_v4().to_string();
    let now = chrono::Utc::now().to_rfc3339();

    conn.execute(
        "INSERT INTO expenses (id, description, amount, category, supplier_name, reference, expense_date, notes, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        (
            &id,
            &input.description,
            input.amount,
            input.category.to_string(),
            &input.supplier_name,
            &input.reference,
            &input.expense_date,
            &input.notes,
            &now,
            &now,
        ),
    )?;

    Ok(Expense {
        id,
        description: input.description,
        amount: input.amount,
        category: input.category,
        supplier_name: input.supplier_name,
        reference: input.reference,
        expense_date: input.expense_date,
        notes: input.notes,
        created_at: now.clone(),
        updated_at: now,
    })
}

#[tauri::command]
pub fn update_expense(db: State<DbConnection>, id: String, input: UpdateExpenseInput) -> AppResult<Expense> {
    let conn = db.0.lock().map_err(|_| AppError::Internal("Failed to acquire database lock".to_string()))?;

    // Get existing expense
    let expense = conn
        .query_row(
            "SELECT id, description, amount, category, supplier_name, reference, expense_date, notes, created_at, updated_at
             FROM expenses WHERE id = ?",
            [&id],
            |row| {
                let category_str: String = row.get(3)?;
                Ok(Expense {
                    id: row.get(0)?,
                    description: row.get(1)?,
                    amount: row.get(2)?,
                    category: category_str.parse().unwrap_or(ExpenseCategory::Other),
                    supplier_name: row.get(4)?,
                    reference: row.get(5)?,
                    expense_date: row.get(6)?,
                    notes: row.get(7)?,
                    created_at: row.get(8)?,
                    updated_at: row.get(9)?,
                })
            },
        )
        .map_err(|e| match e {
            rusqlite::Error::QueryReturnedNoRows => {
                AppError::NotFound(format!("Expense with id {} not found", id))
            }
            _ => AppError::Database(e),
        })?;

    let now = chrono::Utc::now().to_rfc3339();

    let new_description = input.description.unwrap_or(expense.description);
    let new_amount = input.amount.unwrap_or(expense.amount);
    let new_category = input.category.unwrap_or(expense.category);
    let new_supplier_name = input.supplier_name.or(expense.supplier_name);
    let new_reference = input.reference.or(expense.reference);
    let new_expense_date = input.expense_date.unwrap_or(expense.expense_date);
    let new_notes = input.notes.or(expense.notes);

    conn.execute(
        "UPDATE expenses SET description = ?, amount = ?, category = ?, supplier_name = ?, reference = ?, expense_date = ?, notes = ?, updated_at = ? WHERE id = ?",
        (
            &new_description,
            new_amount,
            new_category.to_string(),
            &new_supplier_name,
            &new_reference,
            &new_expense_date,
            &new_notes,
            &now,
            &id,
        ),
    )?;

    Ok(Expense {
        id,
        description: new_description,
        amount: new_amount,
        category: new_category,
        supplier_name: new_supplier_name,
        reference: new_reference,
        expense_date: new_expense_date,
        notes: new_notes,
        created_at: expense.created_at,
        updated_at: now,
    })
}

#[tauri::command]
pub fn delete_expense(db: State<DbConnection>, id: String) -> AppResult<()> {
    let conn = db.0.lock().map_err(|_| AppError::Internal("Failed to acquire database lock".to_string()))?;

    let rows_affected = conn.execute("DELETE FROM expenses WHERE id = ?", [&id])?;

    if rows_affected == 0 {
        return Err(AppError::NotFound(format!(
            "Expense with id {} not found",
            id
        )));
    }

    Ok(())
}

#[tauri::command]
pub fn get_expense_category_labels() -> Vec<(String, String)> {
    ExpenseCategory::all_labels()
        .into_iter()
        .map(|(k, v)| (k.to_string(), v.to_string()))
        .collect()
}
