// Vehicle types
export interface Vehicle {
  id: string;
  brand: string;
  model: string;
  year: number;
  created_at: string;
  updated_at: string;
}

export interface CreateVehicleInput {
  brand: string;
  model: string;
  year: number;
}

export interface UpdateVehicleInput {
  brand?: string;
  model?: string;
  year?: number;
}

// Part Vehicle Compatibility
export interface VehicleCompatibility {
  id?: string;
  part_id?: string;
  vehicle_brand: string;
  vehicle_model?: string;
  year_start?: number;
  year_end?: number;
  created_at?: string;
}

// Part types
export interface Part {
  id: string;
  number: string;
  name: string;
  unit_price: number;
  unit_type: string | null;
  is_universal: boolean;
  vehicle_compatibilities: VehicleCompatibility[];
  // Campos legados - mantidos para compatibilidade
  vehicle_brand: string | null;
  vehicle_model: string | null;
  vehicle_year: number | null;
  created_at: string;
  updated_at: string;
}

export interface CreatePartInput {
  number: string;
  name: string;
  unit_price: number;
  unit_type?: string;
  is_universal: boolean;
  vehicle_compatibilities?: VehicleCompatibility[];
}

export interface UpdatePartInput {
  number?: string;
  name?: string;
  unit_price?: number;
  unit_type?: string;
  is_universal?: boolean;
  vehicle_compatibilities?: VehicleCompatibility[];
}

// Customer types
export interface Customer {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  cpf_cnpj: string | null;
  address_street: string | null;
  address_city: string | null;
  address_state: string | null;
  address_zip: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateCustomerInput {
  name: string;
  phone?: string;
  email?: string;
  cpf_cnpj?: string;
  address_street?: string;
  address_city?: string;
  address_state?: string;
  address_zip?: string;
}

export interface UpdateCustomerInput {
  name?: string;
  phone?: string;
  email?: string;
  cpf_cnpj?: string;
  address_street?: string;
  address_city?: string;
  address_state?: string;
  address_zip?: string;
}

// Service Order types
export type ServiceOrderStatus = 'OPEN' | 'FINISHED';

export interface LaborTask {
  description: string;
  cost: number;
}

export interface PartInfo {
  id: string;
  number: string;
  name: string;
  unit_price: number;
}

export interface ServiceOrderPart {
  id: string;
  service_order_id: string;
  part_id: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
  created_at: string;
  updated_at: string;
  part: PartInfo | null;
}

export interface ServiceOrder {
  id: string;
  customer_id: string | null;
  customer_name: string;
  vehicle_brand: string;
  vehicle_model: string;
  vehicle_year: number;
  vehicle_plate: string | null;
  mileage: number | null;
  parts_total: number;
  labor_cost: number;
  labor_tasks: LaborTask[] | null;
  status: ServiceOrderStatus;
  created_at: string;
  updated_at: string;
}

export interface ServiceOrderWithParts extends ServiceOrder {
  items: ServiceOrderPart[];
  total: number;
}

export interface PartItem {
  part_id: string;
  quantity: number;
  unit_price: number;
}

export interface CreateServiceOrderInput {
  customer_id: string;
  vehicle_brand: string;
  vehicle_model: string;
  vehicle_year: number;
  vehicle_plate?: string;
  mileage?: number;
  labor_tasks?: LaborTask[];
  parts?: PartItem[];
}

export interface UpdateServiceOrderInput {
  customer_id?: string;
  vehicle_brand?: string;
  vehicle_model?: string;
  vehicle_year?: number;
  vehicle_plate?: string;
  mileage?: number;
  labor_tasks?: LaborTask[];
  status?: ServiceOrderStatus;
  parts?: PartItem[];
}

// Quote types
export type QuoteStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CONVERTED';

export interface QuotePart {
  id: string;
  quote_id: string;
  part_id: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
  created_at: string;
  updated_at: string;
  part: PartInfo | null;
}

export interface Quote {
  id: string;
  customer_id: string | null;
  customer_name: string;
  vehicle_brand: string;
  vehicle_model: string;
  vehicle_year: number;
  vehicle_plate: string | null;
  mileage: number | null;
  parts_total: number;
  labor_cost: number;
  labor_tasks: LaborTask[] | null;
  status: QuoteStatus;
  valid_until: string | null;
  converted_service_order_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface QuoteWithParts extends Quote {
  items: QuotePart[];
  total: number;
}

export interface CreateQuoteInput {
  customer_id: string;
  vehicle_brand: string;
  vehicle_model: string;
  vehicle_year: number;
  vehicle_plate?: string;
  mileage?: number;
  labor_tasks?: LaborTask[];
  valid_until?: string;
  parts?: PartItem[];
}

export interface UpdateQuoteInput {
  customer_id?: string;
  vehicle_brand?: string;
  vehicle_model?: string;
  vehicle_year?: number;
  vehicle_plate?: string;
  mileage?: number;
  labor_tasks?: LaborTask[];
  status?: QuoteStatus;
  valid_until?: string;
  parts?: PartItem[];
}

// Expense types
export type ExpenseCategory = 'AUTO_PARTS' | 'SERVICE_PROVIDER' | 'EQUIPMENT' | 'OTHER';

export interface Expense {
  id: string;
  description: string;
  amount: number;
  category: ExpenseCategory;
  supplier_name: string | null;
  reference: string | null;
  expense_date: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateExpenseInput {
  description: string;
  amount: number;
  category: ExpenseCategory;
  supplier_name?: string;
  reference?: string;
  expense_date: string;
  notes?: string;
}

export interface UpdateExpenseInput {
  description?: string;
  amount?: number;
  category?: ExpenseCategory;
  supplier_name?: string;
  reference?: string;
  expense_date?: string;
  notes?: string;
}

// API Error type
export interface ApiError {
  error: string;
  message: string;
}

// Pagination types
export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface PaginationParams {
  page?: number;
  page_size?: number;
}

// Dashboard Stats types
export interface ServiceOrdersByMonth {
  month: string;
  open: number;
  finished: number;
}

export interface RevenueExpenseByMonth {
  month: string;
  revenue: number;
  expenses: number;
}

export interface ExpenseByCategory {
  category: string;
  label: string;
  amount: number;
}

export interface DashboardStats {
  service_orders_by_month: ServiceOrdersByMonth[];
  revenue_expenses_by_month: RevenueExpenseByMonth[];
  expenses_by_category: ExpenseByCategory[];
  current_month_revenue: number;
  current_month_expenses: number;
}

// Monthly Parts Report types
export interface MonthlyPartsReportItem {
  service_order_id: string;
  service_order_date: string;
  customer_name: string;
  part_name: string;
  part_number: string;
  quantity: number;
  unit_price: number;
  sale_total: number;
}

export interface MonthlyPartsReport {
  year: number;
  month: number;
  month_label: string;
  items: MonthlyPartsReportItem[];
  total_sale: number;
}
