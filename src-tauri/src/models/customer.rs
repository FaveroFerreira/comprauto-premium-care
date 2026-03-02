use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Customer {
    pub id: String,
    pub name: String,
    pub phone: Option<String>,
    pub email: Option<String>,
    pub cpf_cnpj: Option<String>,
    pub address_street: Option<String>,
    pub address_city: Option<String>,
    pub address_state: Option<String>,
    pub address_zip: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Deserialize)]
pub struct CreateCustomerInput {
    pub name: String,
    pub phone: Option<String>,
    pub email: Option<String>,
    pub cpf_cnpj: Option<String>,
    pub address_street: Option<String>,
    pub address_city: Option<String>,
    pub address_state: Option<String>,
    pub address_zip: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateCustomerInput {
    pub name: Option<String>,
    pub phone: Option<String>,
    pub email: Option<String>,
    pub cpf_cnpj: Option<String>,
    pub address_street: Option<String>,
    pub address_city: Option<String>,
    pub address_state: Option<String>,
    pub address_zip: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct PaginatedCustomers {
    pub items: Vec<Customer>,
    pub total: i64,
    pub page: i64,
    pub page_size: i64,
    pub total_pages: i64,
}
