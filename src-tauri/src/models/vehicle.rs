use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Vehicle {
    pub id: String,
    pub brand: String,
    pub model: String,
    pub year: i32,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Deserialize)]
pub struct CreateVehicleInput {
    pub brand: String,
    pub model: String,
    pub year: i32,
}

#[derive(Debug, Deserialize)]
pub struct UpdateVehicleInput {
    pub brand: Option<String>,
    pub model: Option<String>,
    pub year: Option<i32>,
}
