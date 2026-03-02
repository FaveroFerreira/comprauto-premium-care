use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Clone, PartialEq)]
#[serde(rename_all = "UPPERCASE")]
pub enum ServiceOrderStatus {
    Open,
    Finished,
}

impl Default for ServiceOrderStatus {
    fn default() -> Self {
        Self::Open
    }
}

impl std::fmt::Display for ServiceOrderStatus {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            Self::Open => write!(f, "OPEN"),
            Self::Finished => write!(f, "FINISHED"),
        }
    }
}

impl std::str::FromStr for ServiceOrderStatus {
    type Err = String;
    fn from_str(s: &str) -> Result<Self, Self::Err> {
        match s.to_uppercase().as_str() {
            "OPEN" => Ok(Self::Open),
            "FINISHED" => Ok(Self::Finished),
            _ => Err(format!("Invalid status: {}", s)),
        }
    }
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct LaborTask {
    pub description: String,
    pub cost: f64,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ServiceOrder {
    pub id: String,
    pub customer_id: Option<String>,
    pub customer_name: String,
    pub vehicle_brand: String,
    pub vehicle_model: String,
    pub vehicle_year: i32,
    pub vehicle_plate: Option<String>,
    pub mileage: Option<i32>,
    pub parts_total: f64,
    pub labor_cost: f64,
    pub labor_tasks: Option<Vec<LaborTask>>,
    pub status: ServiceOrderStatus,
    pub created_at: String,
    pub updated_at: String,
}

impl ServiceOrder {
    pub fn total(&self) -> f64 {
        self.parts_total + self.labor_cost
    }
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ServiceOrderPart {
    pub id: String,
    pub service_order_id: String,
    pub part_id: String,
    pub quantity: i32,
    pub unit_price: f64,
    pub subtotal: f64,
    pub created_at: String,
    pub updated_at: String,
    // Joined fields
    pub part: Option<PartInfo>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct PartInfo {
    pub id: String,
    pub number: String,
    pub name: String,
    pub unit_price: f64,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ServiceOrderWithParts {
    #[serde(flatten)]
    pub service_order: ServiceOrder,
    pub items: Vec<ServiceOrderPart>,
    pub total: f64,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct PaginatedServiceOrders {
    pub items: Vec<ServiceOrderWithParts>,
    pub total: i64,
    pub page: i64,
    pub page_size: i64,
    pub total_pages: i64,
}

#[derive(Debug, Deserialize)]
pub struct PartItem {
    pub part_id: String,
    pub quantity: i32,
    pub unit_price: f64,
}

#[derive(Debug, Deserialize)]
pub struct CreateServiceOrderInput {
    pub customer_id: String,
    pub vehicle_brand: String,
    pub vehicle_model: String,
    pub vehicle_year: i32,
    pub vehicle_plate: Option<String>,
    pub mileage: Option<i32>,
    pub labor_tasks: Option<Vec<LaborTask>>,
    pub parts: Option<Vec<PartItem>>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateServiceOrderInput {
    pub customer_id: Option<String>,
    pub vehicle_brand: Option<String>,
    pub vehicle_model: Option<String>,
    pub vehicle_year: Option<i32>,
    pub vehicle_plate: Option<String>,
    pub mileage: Option<i32>,
    pub labor_tasks: Option<Vec<LaborTask>>,
    pub status: Option<ServiceOrderStatus>,
    pub parts: Option<Vec<PartItem>>,
}
