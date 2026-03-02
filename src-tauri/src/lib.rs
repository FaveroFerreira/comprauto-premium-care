mod commands;
mod db;
mod error;
mod models;

use db::{init_db, DbConnection};
use std::sync::Mutex;
use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(tauri_plugin_dialog::init())
        .setup(|app| {
            // Initialize database
            let conn = init_db(app.handle()).expect("Failed to initialize database");
            app.manage(DbConnection(Mutex::new(conn)));
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            // Vehicles
            commands::vehicles::list_vehicles,
            commands::vehicles::get_vehicle,
            commands::vehicles::create_vehicle,
            commands::vehicles::update_vehicle,
            commands::vehicles::delete_vehicle,
            // Parts
            commands::parts::list_parts,
            commands::parts::search_parts,
            commands::parts::get_part,
            commands::parts::create_part,
            commands::parts::update_part,
            commands::parts::delete_part,
            // Service Orders
            commands::service_orders::list_service_orders,
            commands::service_orders::get_service_order,
            commands::service_orders::create_service_order,
            commands::service_orders::update_service_order,
            commands::service_orders::delete_service_order,
            commands::service_orders::finish_service_order,
            // Quotes
            commands::quotes::list_quotes,
            commands::quotes::get_quote,
            commands::quotes::create_quote,
            commands::quotes::update_quote,
            commands::quotes::delete_quote,
            commands::quotes::convert_quote_to_service_order,
            // Customers
            commands::customers::list_customers,
            commands::customers::search_customers,
            commands::customers::get_customer,
            commands::customers::create_customer,
            commands::customers::update_customer,
            commands::customers::delete_customer,
            // Expenses
            commands::expenses::list_expenses,
            commands::expenses::get_expense,
            commands::expenses::create_expense,
            commands::expenses::update_expense,
            commands::expenses::delete_expense,
            commands::expenses::get_expense_category_labels,
            // Auth
            commands::auth::register,
            commands::auth::login,
            commands::auth::get_current_user,
            commands::auth::update_user,
            commands::auth::update_password,
            commands::auth::list_users,
            commands::auth::delete_user,
            // Stats
            commands::stats::get_dashboard_stats,
            commands::stats::get_monthly_parts_report,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
