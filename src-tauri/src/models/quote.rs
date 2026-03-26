use serde::{Deserialize, Serialize};

use super::service_order::LaborTask;

#[derive(Debug, Serialize, Deserialize, Clone, PartialEq)]
#[serde(rename_all = "UPPERCASE")]
pub enum QuoteStatus {
    Pending,
    Approved,
    Rejected,
    Converted,
}

impl Default for QuoteStatus {
    fn default() -> Self {
        Self::Pending
    }
}

impl std::fmt::Display for QuoteStatus {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            Self::Pending => write!(f, "PENDING"),
            Self::Approved => write!(f, "APPROVED"),
            Self::Rejected => write!(f, "REJECTED"),
            Self::Converted => write!(f, "CONVERTED"),
        }
    }
}

impl std::str::FromStr for QuoteStatus {
    type Err = String;
    fn from_str(s: &str) -> Result<Self, Self::Err> {
        match s.to_uppercase().as_str() {
            "PENDING" => Ok(Self::Pending),
            "APPROVED" => Ok(Self::Approved),
            "REJECTED" => Ok(Self::Rejected),
            "CONVERTED" => Ok(Self::Converted),
            _ => Err(format!("Invalid status: {}", s)),
        }
    }
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Quote {
    pub id: String,
    pub number: Option<i64>,
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
    pub status: QuoteStatus,
    pub valid_until: Option<String>,
    pub converted_service_order_id: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}

impl Quote {
    pub fn total(&self) -> f64 {
        self.parts_total + self.labor_cost
    }
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct QuotePart {
    pub id: String,
    pub quote_id: String,
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
pub struct QuoteWithParts {
    #[serde(flatten)]
    pub quote: Quote,
    pub items: Vec<QuotePart>,
    pub total: f64,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct PaginatedQuotes {
    pub items: Vec<QuoteWithParts>,
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
pub struct CreateQuoteInput {
    pub customer_id: String,
    pub vehicle_brand: String,
    pub vehicle_model: String,
    pub vehicle_year: i32,
    pub vehicle_plate: Option<String>,
    pub mileage: Option<i32>,
    pub labor_tasks: Option<Vec<LaborTask>>,
    pub valid_until: Option<String>,
    pub parts: Option<Vec<PartItem>>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateQuoteInput {
    pub customer_id: Option<String>,
    pub vehicle_brand: Option<String>,
    pub vehicle_model: Option<String>,
    pub vehicle_year: Option<i32>,
    pub vehicle_plate: Option<String>,
    pub mileage: Option<i32>,
    pub labor_tasks: Option<Vec<LaborTask>>,
    pub status: Option<QuoteStatus>,
    pub valid_until: Option<String>,
    pub parts: Option<Vec<PartItem>>,
}
