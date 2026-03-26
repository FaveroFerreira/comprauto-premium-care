-- Tabela de contadores para números sequenciais
CREATE TABLE IF NOT EXISTS counters (
    name TEXT PRIMARY KEY,
    value INTEGER NOT NULL DEFAULT 0
);

-- Inicializar contadores
INSERT OR IGNORE INTO counters (name, value) VALUES ('service_orders', 0);
INSERT OR IGNORE INTO counters (name, value) VALUES ('quotes', 0);

-- Adicionar coluna number nas tabelas
ALTER TABLE service_orders ADD COLUMN number INTEGER;
ALTER TABLE quotes ADD COLUMN number INTEGER;

-- Preencher números sequenciais nos registros existentes (por ordem de criação)
UPDATE service_orders SET number = (
    SELECT COUNT(*) FROM service_orders so2 WHERE so2.created_at <= service_orders.created_at
);
UPDATE quotes SET number = (
    SELECT COUNT(*) FROM quotes q2 WHERE q2.created_at <= quotes.created_at
);

-- Atualizar contadores com o valor máximo atual
UPDATE counters SET value = COALESCE((SELECT MAX(number) FROM service_orders), 0) WHERE name = 'service_orders';
UPDATE counters SET value = COALESCE((SELECT MAX(number) FROM quotes), 0) WHERE name = 'quotes';

-- Índices para busca por número
CREATE INDEX IF NOT EXISTS idx_service_orders_number ON service_orders(number);
CREATE INDEX IF NOT EXISTS idx_quotes_number ON quotes(number);
