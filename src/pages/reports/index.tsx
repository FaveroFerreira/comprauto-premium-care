import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { statsApi } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';
import { FileText, Users, Loader2, ChevronLeft, ChevronRight, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';

const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

type ReportTab = 'parts' | 'customer-orders';

export default function ReportsIndexPage() {
  const currentDate = new Date();
  const [year, setYear] = useState(currentDate.getFullYear());
  const [month, setMonth] = useState(currentDate.getMonth() + 1);
  const [activeTab, setActiveTab] = useState<ReportTab>('customer-orders');

  const handlePreviousMonth = () => {
    if (month === 1) {
      setMonth(12);
      setYear(year - 1);
    } else {
      setMonth(month - 1);
    }
  };

  const handleNextMonth = () => {
    if (month === 12) {
      setMonth(1);
      setYear(year + 1);
    } else {
      setMonth(month + 1);
    }
  };

  const isCurrentMonth = year === currentDate.getFullYear() && month === currentDate.getMonth() + 1;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Relatórios</h1>
      </div>

      {/* Month Selector */}
      <div className="bg-card rounded-lg border p-4 mb-6">
        <div className="flex items-center justify-between">
          <Button variant="outline" size="icon" onClick={handlePreviousMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="text-lg font-semibold">
            {MONTHS[month - 1]} {year}
          </div>
          <Button variant="outline" size="icon" onClick={handleNextMonth} disabled={isCurrentMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <Button
          variant={activeTab === 'customer-orders' ? 'default' : 'outline'}
          onClick={() => setActiveTab('customer-orders')}
          className="gap-2"
        >
          <Users className="h-4 w-4" />
          OS por Cliente
        </Button>
        <Button
          variant={activeTab === 'parts' ? 'default' : 'outline'}
          onClick={() => setActiveTab('parts')}
          className="gap-2"
        >
          <FileText className="h-4 w-4" />
          Peças Vendidas
        </Button>
      </div>

      {activeTab === 'customer-orders' && (
        <CustomerOrdersReport year={year} month={month} />
      )}
      {activeTab === 'parts' && (
        <PartsReport year={year} month={month} />
      )}
    </div>
  );
}

// ─── Customer Orders Report ───

function CustomerOrdersReport({ year, month }: { year: number; month: number }) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['customer-orders-report', year, month],
    queryFn: () => statsApi.getCustomerOrdersReport(year, month),
  });

  const [expandedCustomers, setExpandedCustomers] = useState<Set<string>>(new Set());

  const toggleCustomer = (key: string) => {
    setExpandedCustomers((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  return (
    <div className="bg-card rounded-lg border overflow-hidden">
      <div className="p-6 border-b">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-full bg-primary/10 text-primary">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">OS por Cliente - {data?.month_label} {year}</h2>
            <p className="text-sm text-muted-foreground">
              Ordens de serviço agrupadas por cliente
            </p>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center p-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : error ? (
        <div className="p-6 text-center text-destructive">
          Erro ao carregar relatório
        </div>
      ) : data?.customers.length === 0 ? (
        <div className="p-6 text-center text-muted-foreground">
          Nenhuma OS neste mês
        </div>
      ) : (
        <>
          {/* Summary */}
          <div className="p-6 bg-muted/30">
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-card rounded-lg border p-4">
                <p className="text-sm text-muted-foreground mb-1">Abertas</p>
                <p className="text-xl font-bold text-yellow-600">{formatCurrency(data?.total_open || 0)}</p>
              </div>
              <div className="bg-card rounded-lg border p-4">
                <p className="text-sm text-muted-foreground mb-1">Finalizadas</p>
                <p className="text-xl font-bold text-green-600">{formatCurrency(data?.total_finished || 0)}</p>
              </div>
              <div className="bg-card rounded-lg border p-4">
                <p className="text-sm text-muted-foreground mb-1">Total</p>
                <p className="text-xl font-bold">{formatCurrency(data?.total || 0)}</p>
              </div>
            </div>
          </div>

          {/* Customer list */}
          <div>
            {data?.customers.map((customer) => {
              const key = customer.customer_id || customer.customer_name;
              const isExpanded = expandedCustomers.has(key);
              return (
                <div key={key} className="border-t">
                  <button
                    className="w-full flex items-center gap-4 p-4 hover:bg-muted/30 text-left"
                    onClick={() => toggleCustomer(key)}
                  >
                    <div className="flex-1">
                      <span className="font-medium">{customer.customer_name}</span>
                    </div>
                    <div className="flex items-center gap-6 text-sm">
                      {customer.open_count > 0 && (
                        <span className="inline-flex items-center gap-1">
                          <span className="inline-block w-2 h-2 rounded-full bg-yellow-500" />
                          {customer.open_count} aberta{customer.open_count > 1 ? 's' : ''}
                        </span>
                      )}
                      {customer.finished_count > 0 && (
                        <span className="inline-flex items-center gap-1">
                          <span className="inline-block w-2 h-2 rounded-full bg-green-500" />
                          {customer.finished_count} finalizada{customer.finished_count > 1 ? 's' : ''}
                        </span>
                      )}
                      <span className="font-semibold w-28 text-right">{formatCurrency(customer.total)}</span>
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    )}
                  </button>

                  {isExpanded && (
                    <div className="bg-muted/20 px-4 pb-4">
                      <table className="w-full text-sm">
                        <thead className="bg-muted/50">
                          <tr>
                            <th className="text-left p-2 font-medium">#</th>
                            <th className="text-left p-2 font-medium">Veículo</th>
                            <th className="text-left p-2 font-medium">Placa</th>
                            <th className="text-left p-2 font-medium">Status</th>
                            <th className="text-left p-2 font-medium">Data</th>
                            <th className="text-right p-2 font-medium">Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {customer.orders.map((order) => (
                            <tr key={order.id} className="border-t">
                              <td className="p-2">
                                <Link to={`/service-orders/${order.id}`} className="text-primary hover:underline">
                                  {order.number ?? '-'}
                                </Link>
                              </td>
                              <td className="p-2">{order.vehicle}</td>
                              <td className="p-2">{order.vehicle_plate || '-'}</td>
                              <td className="p-2">
                                <span
                                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                    order.status === 'OPEN'
                                      ? 'bg-yellow-100 text-yellow-800'
                                      : 'bg-green-100 text-green-800'
                                  }`}
                                >
                                  {order.status === 'OPEN' ? 'Aberta' : 'Finalizada'}
                                </span>
                              </td>
                              <td className="p-2">{formatDate(order.created_at)}</td>
                              <td className="p-2 text-right font-medium">{formatCurrency(order.total)}</td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot className="border-t font-medium">
                          <tr>
                            <td colSpan={5} className="p-2 text-right">Total cliente:</td>
                            <td className="p-2 text-right font-bold">{formatCurrency(customer.total)}</td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

// ─── Parts Report ───

function PartsReport({ year, month }: { year: number; month: number }) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['monthly-parts-report', year, month],
    queryFn: () => statsApi.getMonthlyPartsReport(year, month),
  });

  return (
    <div className="bg-card rounded-lg border overflow-hidden">
      <div className="p-6 border-b">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-full bg-primary/10 text-primary">
            <FileText className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Relatório de Peças - {data?.month_label} {year}</h2>
            <p className="text-sm text-muted-foreground">
              Peças vendidas em ordens de serviço finalizadas
            </p>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center p-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : error ? (
        <div className="p-6 text-center text-destructive">
          Erro ao carregar relatório
        </div>
      ) : data?.items.length === 0 ? (
        <div className="p-6 text-center text-muted-foreground">
          Nenhuma peça vendida neste mês
        </div>
      ) : (
        <>
          <div className="p-6 bg-muted/30">
            <div className="bg-card rounded-lg border p-4 max-w-xs">
              <p className="text-sm text-muted-foreground mb-1">Total Vendas</p>
              <p className="text-2xl font-bold">{formatCurrency(data?.total_sale || 0)}</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left p-3 text-sm font-medium">Data</th>
                  <th className="text-left p-3 text-sm font-medium">Cliente</th>
                  <th className="text-left p-3 text-sm font-medium">Peça</th>
                  <th className="text-center p-3 text-sm font-medium">Qtd</th>
                  <th className="text-right p-3 text-sm font-medium">Preço Unit.</th>
                  <th className="text-right p-3 text-sm font-medium">Total Venda</th>
                </tr>
              </thead>
              <tbody>
                {data?.items.map((item, index) => (
                  <tr key={`${item.service_order_id}-${index}`} className="border-t hover:bg-muted/30">
                    <td className="p-3 text-sm">{formatDate(item.service_order_date)}</td>
                    <td className="p-3">{item.customer_name}</td>
                    <td className="p-3">
                      <div>
                        <span className="font-medium">{item.part_name}</span>
                        {item.part_number && (
                          <span className="text-sm text-muted-foreground ml-2">({item.part_number})</span>
                        )}
                      </div>
                    </td>
                    <td className="p-3 text-center">{item.quantity}</td>
                    <td className="p-3 text-right">{formatCurrency(item.unit_price)}</td>
                    <td className="p-3 text-right font-medium">{formatCurrency(item.sale_total)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-muted/50 font-medium">
                <tr className="border-t">
                  <td colSpan={5} className="p-3 text-right">Total:</td>
                  <td className="p-3 text-right font-bold">{formatCurrency(data?.total_sale || 0)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
