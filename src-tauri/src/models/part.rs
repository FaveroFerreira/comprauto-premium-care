use serde::{Deserialize, Serialize};

use super::part_vehicle::{PartVehicle, VehicleCompatibilityInput};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct PaginatedParts {
    pub items: Vec<Part>,
    pub total: i64,
    pub page: i64,
    pub page_size: i64,
    pub total_pages: i64,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Part {
    pub id: String,
    pub number: String,
    pub name: String,
    pub unit_price: f64,
    pub unit_type: Option<String>,
    pub is_universal: bool,
    pub vehicle_compatibilities: Vec<PartVehicle>,
    // Campos legados - mantidos para compatibilidade
    pub vehicle_brand: Option<String>,
    pub vehicle_model: Option<String>,
    pub vehicle_year: Option<i32>,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Deserialize)]
pub struct CreatePartInput {
    pub number: String,
    pub name: String,
    pub unit_price: f64,
    pub unit_type: Option<String>,
    pub is_universal: bool,
    pub vehicle_compatibilities: Option<Vec<VehicleCompatibilityInput>>,
}

#[derive(Debug, Deserialize)]
pub struct UpdatePartInput {
    pub number: Option<String>,
    pub name: Option<String>,
    pub unit_price: Option<f64>,
    pub unit_type: Option<String>,
    pub is_universal: Option<bool>,
    pub vehicle_compatibilities: Option<Vec<VehicleCompatibilityInput>>,
}
