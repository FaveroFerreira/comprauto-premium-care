-- ===========================================
-- Schema inicial - Rech Performance Backoffice
-- ===========================================

-- Usuários
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    email_verified_at TEXT,
    password TEXT NOT NULL,
    remember_token TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Clientes
CREATE TABLE IF NOT EXISTS customers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    cpf_cnpj TEXT,
    address_street TEXT,
    address_city TEXT,
    address_state TEXT,
    address_zip TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_customers_name ON customers(name);
CREATE INDEX IF NOT EXISTS idx_customers_cpf_cnpj ON customers(cpf_cnpj);

-- Veículos
CREATE TABLE IF NOT EXISTS vehicles (
    id TEXT PRIMARY KEY,
    brand TEXT NOT NULL,
    model TEXT NOT NULL,
    year INTEGER,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(brand, model, year)
);

-- Peças
CREATE TABLE IF NOT EXISTS parts (
    id TEXT PRIMARY KEY,
    number TEXT NOT NULL,
    name TEXT NOT NULL,
    unit_price REAL NOT NULL DEFAULT 0,
    unit_type TEXT,
    is_universal INTEGER DEFAULT 1,
    vehicle_brand TEXT,
    vehicle_model TEXT,
    vehicle_year INTEGER,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Compatibilidade peça-veículo (N:N)
CREATE TABLE IF NOT EXISTS part_vehicles (
    id TEXT PRIMARY KEY,
    part_id TEXT NOT NULL REFERENCES parts(id) ON DELETE CASCADE,
    vehicle_brand TEXT NOT NULL,
    vehicle_model TEXT,
    year_start INTEGER,
    year_end INTEGER,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_part_vehicles_part_id ON part_vehicles(part_id);
CREATE INDEX IF NOT EXISTS idx_part_vehicles_brand_model ON part_vehicles(vehicle_brand, vehicle_model);

-- Ordens de Serviço
CREATE TABLE IF NOT EXISTS service_orders (
    id TEXT PRIMARY KEY,
    customer_name TEXT NOT NULL DEFAULT '',
    customer_id TEXT REFERENCES customers(id),
    vehicle_brand TEXT NOT NULL,
    vehicle_model TEXT NOT NULL,
    vehicle_year INTEGER NOT NULL,
    vehicle_plate TEXT,
    mileage INTEGER,
    parts_total REAL NOT NULL DEFAULT 0,
    labor_cost REAL NOT NULL DEFAULT 0,
    labor_tasks TEXT,
    status TEXT NOT NULL DEFAULT 'OPEN' CHECK(status IN ('OPEN', 'FINISHED')),
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_service_orders_status ON service_orders(status);
CREATE INDEX IF NOT EXISTS idx_service_orders_created_at ON service_orders(created_at);
CREATE INDEX IF NOT EXISTS idx_service_orders_customer_id ON service_orders(customer_id);

CREATE TABLE IF NOT EXISTS service_order_parts (
    id TEXT PRIMARY KEY,
    service_order_id TEXT NOT NULL,
    part_id TEXT NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_price REAL NOT NULL,
    subtotal REAL NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (service_order_id) REFERENCES service_orders(id) ON DELETE CASCADE,
    FOREIGN KEY (part_id) REFERENCES parts(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_service_order_parts_service_order_id ON service_order_parts(service_order_id);
CREATE INDEX IF NOT EXISTS idx_service_order_parts_part_id ON service_order_parts(part_id);

-- Orçamentos
CREATE TABLE IF NOT EXISTS quotes (
    id TEXT PRIMARY KEY,
    customer_name TEXT NOT NULL DEFAULT '',
    customer_id TEXT REFERENCES customers(id),
    vehicle_brand TEXT NOT NULL,
    vehicle_model TEXT NOT NULL,
    vehicle_year INTEGER NOT NULL,
    vehicle_plate TEXT,
    mileage INTEGER,
    parts_total REAL NOT NULL DEFAULT 0,
    labor_cost REAL NOT NULL DEFAULT 0,
    labor_tasks TEXT,
    status TEXT NOT NULL DEFAULT 'PENDING' CHECK(status IN ('PENDING', 'APPROVED', 'REJECTED', 'CONVERTED')),
    valid_until TEXT,
    converted_service_order_id TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (converted_service_order_id) REFERENCES service_orders(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_quotes_status ON quotes(status);
CREATE INDEX IF NOT EXISTS idx_quotes_created_at ON quotes(created_at);
CREATE INDEX IF NOT EXISTS idx_quotes_customer_id ON quotes(customer_id);

CREATE TABLE IF NOT EXISTS quote_parts (
    id TEXT PRIMARY KEY,
    quote_id TEXT NOT NULL,
    part_id TEXT NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_price REAL NOT NULL,
    subtotal REAL NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (quote_id) REFERENCES quotes(id) ON DELETE CASCADE,
    FOREIGN KEY (part_id) REFERENCES parts(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_quote_parts_quote_id ON quote_parts(quote_id);
CREATE INDEX IF NOT EXISTS idx_quote_parts_part_id ON quote_parts(part_id);

-- Despesas
CREATE TABLE IF NOT EXISTS expenses (
    id TEXT PRIMARY KEY,
    description TEXT NOT NULL,
    amount REAL NOT NULL,
    category TEXT NOT NULL CHECK(category IN ('AUTO_PARTS', 'SERVICE_PROVIDER', 'EQUIPMENT', 'OTHER')),
    supplier_name TEXT,
    reference TEXT,
    expense_date TEXT NOT NULL,
    notes TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category);
CREATE INDEX IF NOT EXISTS idx_expenses_expense_date ON expenses(expense_date);
