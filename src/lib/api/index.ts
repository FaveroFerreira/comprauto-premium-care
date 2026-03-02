import { invoke } from '@tauri-apps/api/core';
import type {
  User,
  CreateUserInput,
  UpdateUserInput,
  LoginInput,
  Vehicle,
  CreateVehicleInput,
  UpdateVehicleInput,
  Part,
  CreatePartInput,
  UpdatePartInput,
  Customer,
  CreateCustomerInput,
  UpdateCustomerInput,
  ServiceOrderWithParts,
  CreateServiceOrderInput,
  UpdateServiceOrderInput,
  QuoteWithParts,
  CreateQuoteInput,
  UpdateQuoteInput,
  Expense,
  CreateExpenseInput,
  UpdateExpenseInput,
  DashboardStats,
  Paginated,
  PaginationParams,
  MonthlyPartsReport,
} from '@/types';

// Auth API
export const authApi = {
  register: (input: CreateUserInput) => invoke<User>('register', { input }),
  login: (input: LoginInput) => invoke<User>('login', { input }),
  getCurrentUser: (userId: string) => invoke<User>('get_current_user', { userId }),
  updateUser: (userId: string, input: UpdateUserInput) => invoke<User>('update_user', { userId, input }),
  updatePassword: (userId: string, currentPassword: string, newPassword: string) =>
    invoke<void>('update_password', { userId, currentPassword, newPassword }),
  listUsers: () => invoke<User[]>('list_users'),
  deleteUser: (userId: string) => invoke<void>('delete_user', { userId }),
};

// Vehicles API
export const vehiclesApi = {
  list: () => invoke<Vehicle[]>('list_vehicles'),
  get: (id: string) => invoke<Vehicle>('get_vehicle', { id }),
  create: (input: CreateVehicleInput) => invoke<Vehicle>('create_vehicle', { input }),
  update: (id: string, input: UpdateVehicleInput) => invoke<Vehicle>('update_vehicle', { id, input }),
  delete: (id: string) => invoke<void>('delete_vehicle', { id }),
};

// Parts API
export const partsApi = {
  list: (params?: PaginationParams) =>
    invoke<Paginated<Part>>('list_parts', { page: params?.page, pageSize: params?.page_size }),
  search: (query: string) => invoke<Part[]>('search_parts', { query }),
  get: (id: string) => invoke<Part>('get_part', { id }),
  create: (input: CreatePartInput) => invoke<Part>('create_part', { input }),
  update: (id: string, input: UpdatePartInput) => invoke<Part>('update_part', { id, input }),
  delete: (id: string) => invoke<void>('delete_part', { id }),
};

// Customers API
export const customersApi = {
  list: (params?: PaginationParams) =>
    invoke<Paginated<Customer>>('list_customers', { page: params?.page, pageSize: params?.page_size }),
  search: (query: string) => invoke<Customer[]>('search_customers', { query }),
  get: (id: string) => invoke<Customer>('get_customer', { id }),
  create: (input: CreateCustomerInput) => invoke<Customer>('create_customer', { input }),
  update: (id: string, input: UpdateCustomerInput) => invoke<Customer>('update_customer', { id, input }),
  delete: (id: string) => invoke<void>('delete_customer', { id }),
};

// Service Orders API
export const serviceOrdersApi = {
  list: (params?: PaginationParams & { customer_id?: string }) =>
    invoke<Paginated<ServiceOrderWithParts>>('list_service_orders', { page: params?.page, pageSize: params?.page_size, customerId: params?.customer_id }),
  get: (id: string) => invoke<ServiceOrderWithParts>('get_service_order', { id }),
  create: (input: CreateServiceOrderInput) => invoke<ServiceOrderWithParts>('create_service_order', { input }),
  update: (id: string, input: UpdateServiceOrderInput) =>
    invoke<ServiceOrderWithParts>('update_service_order', { id, input }),
  delete: (id: string) => invoke<void>('delete_service_order', { id }),
  finish: (id: string) => invoke<ServiceOrderWithParts>('finish_service_order', { id }),
};

// Quotes API
export const quotesApi = {
  list: (params?: PaginationParams) =>
    invoke<Paginated<QuoteWithParts>>('list_quotes', { page: params?.page, pageSize: params?.page_size }),
  get: (id: string) => invoke<QuoteWithParts>('get_quote', { id }),
  create: (input: CreateQuoteInput) => invoke<QuoteWithParts>('create_quote', { input }),
  update: (id: string, input: UpdateQuoteInput) => invoke<QuoteWithParts>('update_quote', { id, input }),
  delete: (id: string) => invoke<void>('delete_quote', { id }),
  convertToServiceOrder: (id: string) => invoke<ServiceOrderWithParts>('convert_quote_to_service_order', { id }),
};

// Expenses API
export const expensesApi = {
  list: (params?: PaginationParams) =>
    invoke<Paginated<Expense>>('list_expenses', { page: params?.page, pageSize: params?.page_size }),
  get: (id: string) => invoke<Expense>('get_expense', { id }),
  create: (input: CreateExpenseInput) => invoke<Expense>('create_expense', { input }),
  update: (id: string, input: UpdateExpenseInput) => invoke<Expense>('update_expense', { id, input }),
  delete: (id: string) => invoke<void>('delete_expense', { id }),
  getCategoryLabels: () => invoke<[string, string][]>('get_expense_category_labels'),
};

// Stats API
export const statsApi = {
  getDashboardStats: () => invoke<DashboardStats>('get_dashboard_stats'),
  getMonthlyPartsReport: (year: number, month: number) =>
    invoke<MonthlyPartsReport>('get_monthly_parts_report', { year, month }),
};
