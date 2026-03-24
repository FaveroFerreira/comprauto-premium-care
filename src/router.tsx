import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AppLayout } from '@/components/layouts/app-layout';

// App pages
import DashboardPage from '@/pages/dashboard';
import ServiceOrdersIndexPage from '@/pages/service-orders/index';
import ServiceOrdersCreatePage from '@/pages/service-orders/create';
import ServiceOrdersEditPage from '@/pages/service-orders/edit';
import ServiceOrdersShowPage from '@/pages/service-orders/show';
import QuotesIndexPage from '@/pages/quotes/index';
import QuotesCreatePage from '@/pages/quotes/create';
import QuotesEditPage from '@/pages/quotes/edit';
import QuotesShowPage from '@/pages/quotes/show';
import PartsIndexPage from '@/pages/parts/index';
import PartsCreatePage from '@/pages/parts/create';
import PartsEditPage from '@/pages/parts/edit';
import VehiclesIndexPage from '@/pages/vehicles/index';
import VehiclesCreatePage from '@/pages/vehicles/create';
import VehiclesEditPage from '@/pages/vehicles/edit';
import CustomersIndexPage from '@/pages/customers/index';
import CustomersCreatePage from '@/pages/customers/create';
import CustomersShowPage from '@/pages/customers/show';
import CustomersEditPage from '@/pages/customers/edit';
import ExpensesIndexPage from '@/pages/expenses/index';
import ExpensesCreatePage from '@/pages/expenses/create';
import ExpensesEditPage from '@/pages/expenses/edit';
import ExpensesShowPage from '@/pages/expenses/show';
import ReportsIndexPage from '@/pages/reports/index';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Navigate to="/dashboard" replace />,
  },
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { path: 'dashboard', element: <DashboardPage /> },
      // Service Orders
      { path: 'service-orders', element: <ServiceOrdersIndexPage /> },
      { path: 'service-orders/create', element: <ServiceOrdersCreatePage /> },
      { path: 'service-orders/:id', element: <ServiceOrdersShowPage /> },
      { path: 'service-orders/:id/edit', element: <ServiceOrdersEditPage /> },
      // Quotes
      { path: 'quotes', element: <QuotesIndexPage /> },
      { path: 'quotes/create', element: <QuotesCreatePage /> },
      { path: 'quotes/:id', element: <QuotesShowPage /> },
      { path: 'quotes/:id/edit', element: <QuotesEditPage /> },
      // Parts
      { path: 'parts', element: <PartsIndexPage /> },
      { path: 'parts/create', element: <PartsCreatePage /> },
      { path: 'parts/:id/edit', element: <PartsEditPage /> },
      // Customers
      { path: 'customers', element: <CustomersIndexPage /> },
      { path: 'customers/create', element: <CustomersCreatePage /> },
      { path: 'customers/:id', element: <CustomersShowPage /> },
      { path: 'customers/:id/edit', element: <CustomersEditPage /> },
      // Vehicles
      { path: 'vehicles', element: <VehiclesIndexPage /> },
      { path: 'vehicles/create', element: <VehiclesCreatePage /> },
      { path: 'vehicles/:id/edit', element: <VehiclesEditPage /> },
      // Expenses
      { path: 'expenses', element: <ExpensesIndexPage /> },
      { path: 'expenses/create', element: <ExpensesCreatePage /> },
      { path: 'expenses/:id', element: <ExpensesShowPage /> },
      { path: 'expenses/:id/edit', element: <ExpensesEditPage /> },
      // Reports
      { path: 'reports', element: <ReportsIndexPage /> },
    ],
  },
]);
