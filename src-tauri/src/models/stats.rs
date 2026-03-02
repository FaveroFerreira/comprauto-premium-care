use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct MonthData {
    pub month: String,
    pub year: i32,
    pub label: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ServiceOrdersByMonth {
    pub month: String,
    pub open: i32,
    pub finished: i32,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct RevenueExpenseByMonth {
    pub month: String,
    pub revenue: f64,
    pub expenses: f64,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ExpenseByCategory {
    pub category: String,
    pub label: String,
    pub amount: f64,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct DashboardStats {
    pub service_orders_by_month: Vec<ServiceOrdersByMonth>,
    pub revenue_expenses_by_month: Vec<RevenueExpenseByMonth>,
    pub expenses_by_category: Vec<ExpenseByCategory>,
    pub current_month_revenue: f64,
    pub current_month_expenses: f64,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct MonthlyPartsReportItem {
    pub service_order_id: String,
    pub service_order_date: String,
    pub customer_name: String,
    pub part_name: String,
    pub part_number: String,
    pub quantity: i32,
    pub unit_price: f64,
    pub sale_total: f64,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct MonthlyPartsReport {
    pub year: i32,
    pub month: i32,
    pub month_label: String,
    pub items: Vec<MonthlyPartsReportItem>,
    pub total_sale: f64,
}
