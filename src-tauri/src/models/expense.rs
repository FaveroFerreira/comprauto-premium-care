use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Clone, PartialEq)]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum ExpenseCategory {
    AutoParts,
    ServiceProvider,
    Equipment,
    Other,
}

impl std::fmt::Display for ExpenseCategory {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            Self::AutoParts => write!(f, "AUTO_PARTS"),
            Self::ServiceProvider => write!(f, "SERVICE_PROVIDER"),
            Self::Equipment => write!(f, "EQUIPMENT"),
            Self::Other => write!(f, "OTHER"),
        }
    }
}

impl std::str::FromStr for ExpenseCategory {
    type Err = String;
    fn from_str(s: &str) -> Result<Self, Self::Err> {
        match s.to_uppercase().as_str() {
            "AUTO_PARTS" => Ok(Self::AutoParts),
            "SERVICE_PROVIDER" => Ok(Self::ServiceProvider),
            "EQUIPMENT" => Ok(Self::Equipment),
            "OTHER" => Ok(Self::Other),
            _ => Err(format!("Invalid category: {}", s)),
        }
    }
}

impl ExpenseCategory {
    pub fn all_labels() -> Vec<(&'static str, &'static str)> {
        vec![
            ("AUTO_PARTS", "Peças Automotivas"),
            ("SERVICE_PROVIDER", "Prestador de Serviço"),
            ("EQUIPMENT", "Equipamentos"),
            ("OTHER", "Outros"),
        ]
    }
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Expense {
    pub id: String,
    pub description: String,
    pub amount: f64,
    pub category: ExpenseCategory,
    pub supplier_name: Option<String>,
    pub reference: Option<String>,
    pub expense_date: String,
    pub notes: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct PaginatedExpenses {
    pub items: Vec<Expense>,
    pub total: i64,
    pub page: i64,
    pub page_size: i64,
    pub total_pages: i64,
}

#[derive(Debug, Deserialize)]
pub struct CreateExpenseInput {
    pub description: String,
    pub amount: f64,
    pub category: ExpenseCategory,
    pub supplier_name: Option<String>,
    pub reference: Option<String>,
    pub expense_date: String,
    pub notes: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateExpenseInput {
    pub description: Option<String>,
    pub amount: Option<f64>,
    pub category: Option<ExpenseCategory>,
    pub supplier_name: Option<String>,
    pub reference: Option<String>,
    pub expense_date: Option<String>,
    pub notes: Option<String>,
}
