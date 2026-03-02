use serde::{Deserialize, Serialize};

/// Representa uma compatibilidade de veículo para uma peça
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct PartVehicle {
    pub id: String,
    pub part_id: String,
    pub vehicle_brand: String,
    pub vehicle_model: Option<String>,
    pub year_start: Option<i32>,
    pub year_end: Option<i32>,
    pub created_at: String,
}

/// Input para criar/atualizar compatibilidade de veículo
#[derive(Debug, Deserialize, Clone)]
pub struct VehicleCompatibilityInput {
    pub vehicle_brand: String,
    pub vehicle_model: Option<String>,
    pub year_start: Option<i32>,
    pub year_end: Option<i32>,
}
