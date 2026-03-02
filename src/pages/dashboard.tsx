import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { serviceOrdersApi, quotesApi, partsApi, expensesApi, statsApi } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { ClipboardList, FileText, Package, Receipt, Plus, TrendingUp, TrendingDown, Loader2 } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

const COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function DashboardPage() {
  const serviceOrdersQuery = useQuery({
    queryKey: ['service-orders', 'dashboard'],
    queryFn: () => serviceOrdersApi.list({ page: 1, page_size: 100 }),
  });

  const quotesQuery = useQuery({
    queryKey: ['quotes', 'dashboard'],
    queryFn: () => quotesApi.list({ page: 1, page_size: 100 }),
  });

  const partsQuery = useQuery({
    queryKey: ['parts', 'dashboard'],
    queryFn: () => partsApi.list({ page: 1, page_size: 1 }),
  });

  const expensesQuery = useQuery({
    queryKey: ['expenses', 'dashboard'],
    queryFn: () => expensesApi.list({ page: 1, page_size: 100 }),
  });

  const statsQuery = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: statsApi.getDashboardStats,
  });

  const openServiceOrders = serviceOrdersQuery.data?.items.filter(
    (so) => so.status === 'OPEN'
  ).length ?? 0;

  const pendingQuotes = quotesQuery.data?.items.filter(
    (q) => q.status === 'PENDING'
  ).length ?? 0;

  const totalParts = partsQuery.data?.total ?? 0;

  const totalExpenses = expensesQuery.data?.items.reduce(
    (acc, expense) => acc + expense.amount,
    0
  ) ?? 0;

  const stats = [
    {
      name: 'Ordens Abertas',
      value: openServiceOrders,
      icon: ClipboardList,
      href: '/service-orders',
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      name: 'Orçamentos Pendentes',
      value: pendingQuotes,
      icon: FileText,
      href: '/quotes',
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100',
    },
    {
      name: 'Peças Cadastradas',
      value: totalParts,
      icon: Package,
      href: '/parts',
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      name: 'Total Despesas',
      value: formatCurrency(totalExpenses),
      icon: Receipt,
      href: '/expenses',
      color: 'text-red-600',
      bgColor: 'bg-red-100',
    },
  ];

  const monthlyStats = statsQuery.data;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <div className="flex gap-2">
          <Link
            to="/service-orders/create"
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" />
            Nova OS
          </Link>
          <Link
            to="/quotes/create"
            className="inline-flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-accent"
          >
            <Plus className="h-4 w-4" />
            Novo Orçamento
          </Link>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Link
            key={stat.name}
            to={stat.href}
            className="bg-card rounded-lg border p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-full ${stat.bgColor} ${stat.color}`}>
                <stat.icon className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{stat.name}</p>
                <p className="text-2xl font-bold">{stat.value}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Financial Summary Cards */}
      {monthlyStats && (
        <div className="grid gap-4 md:grid-cols-2 mt-6">
          <div className="bg-card rounded-lg border p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-green-100 text-green-600">
                <TrendingUp className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Receita do Mês</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(monthlyStats.current_month_revenue)}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-card rounded-lg border p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-red-100 text-red-600">
                <TrendingDown className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Despesas do Mês</p>
                <p className="text-2xl font-bold text-red-600">
                  {formatCurrency(monthlyStats.current_month_expenses)}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Charts Section */}
      <div className="grid gap-6 lg:grid-cols-2 mt-8">
        {/* Service Orders by Month */}
        <div className="bg-card rounded-lg border p-6">
          <h3 className="text-lg font-semibold mb-4">Ordens de Serviço por Mês</h3>
          {statsQuery.isLoading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : monthlyStats?.service_orders_by_month.length === 0 ? (
            <div className="flex items-center justify-center h-64 text-muted-foreground">
              Nenhum dado disponível
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={monthlyStats?.service_orders_by_month}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="month" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                />
                <Legend />
                <Bar dataKey="open" name="Abertas" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                <Bar dataKey="finished" name="Finalizadas" fill="#22c55e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Revenue vs Expenses */}
        <div className="bg-card rounded-lg border p-6">
          <h3 className="text-lg font-semibold mb-4">Receita vs Despesas</h3>
          {statsQuery.isLoading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : monthlyStats?.revenue_expenses_by_month.length === 0 ? (
            <div className="flex items-center justify-center h-64 text-muted-foreground">
              Nenhum dado disponível
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={monthlyStats?.revenue_expenses_by_month}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="month" className="text-xs" />
                <YAxis className="text-xs" tickFormatter={(value) => `R$${value}`} />
                <Tooltip
                  formatter={(value) => formatCurrency(Number(value))}
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  name="Receita"
                  stroke="#22c55e"
                  fill="#22c55e"
                  fillOpacity={0.3}
                />
                <Area
                  type="monotone"
                  dataKey="expenses"
                  name="Despesas"
                  stroke="#ef4444"
                  fill="#ef4444"
                  fillOpacity={0.3}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Expenses by Category */}
        <div className="bg-card rounded-lg border p-6">
          <h3 className="text-lg font-semibold mb-4">Despesas por Categoria (Mês Atual)</h3>
          {statsQuery.isLoading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : !monthlyStats?.expenses_by_category.length ? (
            <div className="flex items-center justify-center h-64 text-muted-foreground">
              Nenhuma despesa este mês
            </div>
          ) : (
            <div className="flex items-center">
              <ResponsiveContainer width="60%" height={280}>
                <PieChart>
                  <Pie
                    data={monthlyStats?.expenses_by_category}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="amount"
                    nameKey="label"
                  >
                    {monthlyStats?.expenses_by_category.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => formatCurrency(Number(value))}
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="w-[40%] space-y-2">
                {monthlyStats?.expenses_by_category.map((entry, index) => (
                  <div key={entry.category} className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <span className="text-sm truncate">{entry.label}</span>
                    <span className="text-sm font-medium ml-auto">
                      {formatCurrency(entry.amount)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Recent Service Orders */}
        <div className="bg-card rounded-lg border p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Ordens de Serviço Recentes</h3>
            <Link to="/service-orders" className="text-sm text-primary hover:underline">
              Ver todas
            </Link>
          </div>
          {serviceOrdersQuery.isLoading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : serviceOrdersQuery.data?.items.length === 0 ? (
            <div className="flex items-center justify-center h-64 text-muted-foreground">
              Nenhuma ordem de serviço encontrada
            </div>
          ) : (
            <div className="space-y-3">
              {serviceOrdersQuery.data?.items.slice(0, 5).map((order) => (
                <Link
                  key={order.id}
                  to={`/service-orders/${order.id}`}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div>
                    <p className="font-medium">{order.customer_name}</p>
                    <p className="text-sm text-muted-foreground">
                      {order.vehicle_brand} {order.vehicle_model}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{formatCurrency(order.total)}</p>
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        order.status === 'OPEN'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-green-100 text-green-800'
                      }`}
                    >
                      {order.status === 'OPEN' ? 'Aberta' : 'Finalizada'}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
