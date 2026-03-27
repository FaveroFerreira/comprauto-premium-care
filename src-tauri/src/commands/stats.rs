use tauri::State;

use crate::db::DbConnection;
use crate::error::{AppError, AppResult};
use crate::models::stats::{
    CustomerOrderItem, CustomerOrdersReport, CustomerOrdersSummary,
    DashboardStats, ExpenseByCategory, MonthlyPartsReport, MonthlyPartsReportItem,
    RevenueExpenseByMonth, ServiceOrdersByMonth,
};


fn get_category_label(category: &str) -> &str {
    match category {
        "AUTO_PARTS" => "Auto Peças",
        "SERVICE_PROVIDER" => "Prestador de Serviço",
        "EQUIPMENT" => "Equipamentos",
        "OTHER" => "Outros",
        _ => category,
    }
}

#[tauri::command]
pub fn get_dashboard_stats(db: State<DbConnection>) -> AppResult<DashboardStats> {
    let conn = db
        .0
        .lock()
        .map_err(|_| AppError::Internal("Failed to acquire database lock".to_string()))?;

    // Get last 6 months for charts
    let months: Vec<(String, String)> = {
        let now = chrono::Utc::now();
        (0..6)
            .rev()
            .map(|i| {
                let date = now - chrono::Duration::days(i * 30);
                let month_num = date.format("%Y-%m").to_string();
                let month_label = date.format("%b").to_string();
                (month_num, month_label)
            })
            .collect()
    };

    // Service orders by month (last 6 months)
    let mut service_orders_by_month = Vec::new();
    for (month_num, month_label) in &months {
        let open: i32 = conn
            .query_row(
                "SELECT COUNT(*) FROM service_orders WHERE strftime('%Y-%m', created_at) = ? AND status = 'OPEN'",
                [month_num],
                |row| row.get(0),
            )
            .unwrap_or(0);

        let finished: i32 = conn
            .query_row(
                "SELECT COUNT(*) FROM service_orders WHERE strftime('%Y-%m', created_at) = ? AND status = 'FINISHED'",
                [month_num],
                |row| row.get(0),
            )
            .unwrap_or(0);

        service_orders_by_month.push(ServiceOrdersByMonth {
            month: month_label.clone(),
            open,
            finished,
        });
    }

    // Revenue (finished service orders) and expenses by month
    let mut revenue_expenses_by_month = Vec::new();
    for (month_num, month_label) in &months {
        // Revenue = sum of (parts_total + labor_cost) from finished service orders
        let revenue: f64 = conn
            .query_row(
                "SELECT COALESCE(SUM(parts_total + labor_cost), 0) FROM service_orders
                 WHERE strftime('%Y-%m', created_at) = ? AND status = 'FINISHED'",
                [month_num],
                |row| row.get(0),
            )
            .unwrap_or(0.0);

        let expenses: f64 = conn
            .query_row(
                "SELECT COALESCE(SUM(amount), 0) FROM expenses WHERE strftime('%Y-%m', expense_date) = ?",
                [month_num],
                |row| row.get(0),
            )
            .unwrap_or(0.0);

        revenue_expenses_by_month.push(RevenueExpenseByMonth {
            month: month_label.clone(),
            revenue,
            expenses,
        });
    }

    // Expenses by category (current month)
    let current_month = chrono::Utc::now().format("%Y-%m").to_string();
    let mut expenses_by_category = Vec::new();

    let mut stmt = conn.prepare(
        "SELECT category, SUM(amount) as total FROM expenses
         WHERE strftime('%Y-%m', expense_date) = ?
         GROUP BY category",
    )?;

    let rows = stmt.query_map([&current_month], |row| {
        let category: String = row.get(0)?;
        let amount: f64 = row.get(1)?;
        Ok((category, amount))
    })?;

    for row in rows {
        if let Ok((category, amount)) = row {
            expenses_by_category.push(ExpenseByCategory {
                label: get_category_label(&category).to_string(),
                category,
                amount,
            });
        }
    }

    // Current month totals
    let current_month_revenue: f64 = conn
        .query_row(
            "SELECT COALESCE(SUM(parts_total + labor_cost), 0) FROM service_orders
             WHERE strftime('%Y-%m', created_at) = ? AND status = 'FINISHED'",
            [&current_month],
            |row| row.get(0),
        )
        .unwrap_or(0.0);

    let current_month_expenses: f64 = conn
        .query_row(
            "SELECT COALESCE(SUM(amount), 0) FROM expenses WHERE strftime('%Y-%m', expense_date) = ?",
            [&current_month],
            |row| row.get(0),
        )
        .unwrap_or(0.0);

    Ok(DashboardStats {
        service_orders_by_month,
        revenue_expenses_by_month,
        expenses_by_category,
        current_month_revenue,
        current_month_expenses,
    })
}

fn get_month_label(month: i32) -> &'static str {
    match month {
        1 => "Janeiro",
        2 => "Fevereiro",
        3 => "Março",
        4 => "Abril",
        5 => "Maio",
        6 => "Junho",
        7 => "Julho",
        8 => "Agosto",
        9 => "Setembro",
        10 => "Outubro",
        11 => "Novembro",
        12 => "Dezembro",
        _ => "Desconhecido",
    }
}

#[tauri::command]
pub fn get_monthly_parts_report(
    db: State<DbConnection>,
    year: i32,
    month: i32,
) -> AppResult<MonthlyPartsReport> {
    let conn = db
        .0
        .lock()
        .map_err(|_| AppError::Internal("Failed to acquire database lock".to_string()))?;

    let month_str = format!("{:04}-{:02}", year, month);

    let mut stmt = conn.prepare(
        "SELECT
            so.id,
            so.created_at,
            COALESCE(c.name, so.customer_name) as customer_name,
            COALESCE(p.name, 'Peça desconhecida') as part_name,
            COALESCE(p.number, '') as part_number,
            sop.quantity,
            sop.unit_price
         FROM service_order_parts sop
         JOIN service_orders so ON so.id = sop.service_order_id
         LEFT JOIN customers c ON so.customer_id = c.id
         LEFT JOIN parts p ON p.id = sop.part_id
         WHERE strftime('%Y-%m', so.created_at) = ?
         AND so.status = 'FINISHED'
         ORDER BY so.created_at DESC",
    )?;

    let rows = stmt.query_map([&month_str], |row| {
        let quantity: i32 = row.get(5)?;
        let unit_price: f64 = row.get(6)?;
        let sale_total = quantity as f64 * unit_price;

        Ok(MonthlyPartsReportItem {
            service_order_id: row.get(0)?,
            service_order_date: row.get(1)?,
            customer_name: row.get(2)?,
            part_name: row.get(3)?,
            part_number: row.get(4)?,
            quantity,
            unit_price,
            sale_total,
        })
    })?;

    let mut items = Vec::new();
    let mut total_sale = 0.0;

    for row in rows {
        if let Ok(item) = row {
            total_sale += item.sale_total;
            items.push(item);
        }
    }

    Ok(MonthlyPartsReport {
        year,
        month,
        month_label: get_month_label(month).to_string(),
        items,
        total_sale,
    })
}

#[tauri::command]
pub fn get_customer_orders_report(
    db: State<DbConnection>,
    year: i32,
    month: i32,
) -> AppResult<CustomerOrdersReport> {
    let conn = db
        .0
        .lock()
        .map_err(|_| AppError::Internal("Failed to acquire database lock".to_string()))?;

    let month_str = format!("{:04}-{:02}", year, month);

    let mut stmt = conn.prepare(
        "SELECT
            so.id,
            so.number,
            so.customer_id,
            COALESCE(c.name, so.customer_name) as customer_name,
            so.vehicle_brand || ' ' || so.vehicle_model as vehicle,
            so.vehicle_plate,
            so.status,
            (so.parts_total + so.labor_cost) as total,
            so.created_at
         FROM service_orders so
         LEFT JOIN customers c ON so.customer_id = c.id
         WHERE strftime('%Y-%m', so.created_at) = ?
         ORDER BY customer_name, so.created_at DESC",
    )?;

    let rows = stmt.query_map([&month_str], |row| {
        Ok((
            row.get::<_, String>(2).unwrap_or_default(), // customer_id
            row.get::<_, String>(3)?,                     // customer_name
            CustomerOrderItem {
                id: row.get(0)?,
                number: row.get(1)?,
                vehicle: row.get(4)?,
                vehicle_plate: row.get(5)?,
                status: row.get(6)?,
                total: row.get(7)?,
                created_at: row.get(8)?,
            },
        ))
    })?;

    let mut customer_keys: Vec<String> = Vec::new();
    let mut customers_map: std::collections::HashMap<String, CustomerOrdersSummary> =
        std::collections::HashMap::new();

    for row in rows {
        if let Ok((customer_id, customer_name, order)) = row {
            let key = if customer_id.is_empty() {
                customer_name.clone()
            } else {
                customer_id.clone()
            };

            if !customers_map.contains_key(&key) {
                customer_keys.push(key.clone());
            }
            let entry = customers_map.entry(key).or_insert_with(|| CustomerOrdersSummary {
                customer_id: customer_id.clone(),
                customer_name: customer_name.clone(),
                open_count: 0,
                finished_count: 0,
                open_total: 0.0,
                finished_total: 0.0,
                total: 0.0,
                orders: Vec::new(),
            });

            match order.status.as_str() {
                "OPEN" => {
                    entry.open_count += 1;
                    entry.open_total += order.total;
                }
                "FINISHED" => {
                    entry.finished_count += 1;
                    entry.finished_total += order.total;
                }
                _ => {}
            }
            entry.total += order.total;
            entry.orders.push(order);
        }
    }

    let customers: Vec<CustomerOrdersSummary> = customer_keys
        .into_iter()
        .filter_map(|k| customers_map.remove(&k))
        .collect();
    let total_open: f64 = customers.iter().map(|c| c.open_total).sum();
    let total_finished: f64 = customers.iter().map(|c| c.finished_total).sum();
    let total = total_open + total_finished;

    Ok(CustomerOrdersReport {
        year,
        month,
        month_label: get_month_label(month).to_string(),
        customers,
        total_open,
        total_finished,
        total,
    })
}
