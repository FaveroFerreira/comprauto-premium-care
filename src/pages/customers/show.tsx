import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Pencil, Loader2, Phone, Mail, MapPin, FileText } from 'lucide-react';
import { customersApi, serviceOrdersApi, quotesApi } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Pagination } from '@/components/ui/pagination';

const PAGE_SIZE = 10;

const statusLabels: Record<string, { label: string; className: string }> = {
  OPEN: { label: 'Aberta', className: 'bg-blue-500/10 text-blue-600' },
  FINISHED: { label: 'Finalizada', className: 'bg-green-500/10 text-green-600' },
  PENDING: { label: 'Pendente', className: 'bg-yellow-500/10 text-yellow-600' },
  APPROVED: { label: 'Aprovado', className: 'bg-green-500/10 text-green-600' },
  REJECTED: { label: 'Rejeitado', className: 'bg-red-500/10 text-red-600' },
  CONVERTED: { label: 'Convertido', className: 'bg-purple-500/10 text-purple-600' },
};

export default function CustomersShowPage() {
  const { id } = useParams<{ id: string }>();
  const [soPage, setSoPage] = useState(1);

  const { data: customer, isLoading } = useQuery({
    queryKey: ['customer', id],
    queryFn: () => customersApi.get(id!),
    enabled: !!id,
  });

  const { data: serviceOrders } = useQuery({
    queryKey: ['service-orders', 'customer', id, soPage],
    queryFn: () => serviceOrdersApi.list({ page: soPage, page_size: PAGE_SIZE, customer_id: id }),
    enabled: !!id,
  });

  const { data: quotes } = useQuery({
    queryKey: ['quotes', 'customer', id],
    queryFn: () => quotesApi.list({ page: 1, page_size: 100 }),
    enabled: !!id,
  });

  // Filter quotes by customer_id on frontend (backend doesn't have filter yet)
  const customerQuotes = quotes ? {
    ...quotes,
    items: quotes.items.filter((q) => q.customer_id === id),
    total: quotes.items.filter((q) => q.customer_id === id).length,
  } : null;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="text-center p-12">
        <p className="text-muted-foreground">Cliente não encontrado</p>
        <Link to="/customers" className="text-primary hover:underline mt-2 inline-block">
          Voltar para lista
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link to="/customers" className="p-2 hover:bg-accent rounded-lg">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-2xl font-bold">{customer.name}</h1>
        </div>
        <Button asChild variant="outline">
          <Link to={`/customers/${id}/edit`}>
            <Pencil className="h-4 w-4" />
            Editar
          </Link>
        </Button>
      </div>

      {/* Customer Info */}
      <div className="bg-card rounded-lg border p-6 mb-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {customer.phone && (
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <span>{customer.phone}</span>
            </div>
          )}
          {customer.email && (
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span>{customer.email}</span>
            </div>
          )}
          {customer.cpf_cnpj && (
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <span>{customer.cpf_cnpj}</span>
            </div>
          )}
          {(customer.address_street || customer.address_city) && (
            <div className="flex items-start gap-2 md:col-span-2 lg:col-span-3">
              <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
              <span>
                {[customer.address_street, customer.address_city, customer.address_state, customer.address_zip]
                  .filter(Boolean)
                  .join(', ')}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Service Orders */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-3">Ordens de Serviço</h2>
        <div className="bg-card rounded-lg border overflow-hidden">
          {!serviceOrders || serviceOrders.items.length === 0 ? (
            <div className="p-6 text-center text-muted-foreground">
              Nenhuma ordem de serviço encontrada
            </div>
          ) : (
            <>
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left p-3 text-sm font-medium">Veículo</th>
                    <th className="text-left p-3 text-sm font-medium">Status</th>
                    <th className="text-left p-3 text-sm font-medium">Data</th>
                    <th className="text-right p-3 text-sm font-medium">Total</th>
                    <th className="text-right p-3 text-sm font-medium">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {serviceOrders.items.map((so) => {
                    const status = statusLabels[so.status] || { label: so.status, className: 'bg-muted' };
                    return (
                      <tr key={so.id} className="border-t hover:bg-muted/30">
                        <td className="p-3">
                          {so.vehicle_brand} {so.vehicle_model} ({so.vehicle_year})
                          {so.vehicle_plate && (
                            <span className="text-muted-foreground text-sm ml-2">{so.vehicle_plate}</span>
                          )}
                        </td>
                        <td className="p-3">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${status.className}`}>
                            {status.label}
                          </span>
                        </td>
                        <td className="p-3">{formatDate(so.created_at)}</td>
                        <td className="p-3 text-right font-medium">{formatCurrency(so.total)}</td>
                        <td className="p-3 text-right">
                          <Button variant="ghost" size="sm" asChild>
                            <Link to={`/service-orders/${so.id}`}>Ver</Link>
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {serviceOrders.total_pages > 1 && (
                <Pagination
                  currentPage={serviceOrders.page}
                  totalPages={serviceOrders.total_pages}
                  onPageChange={setSoPage}
                  totalItems={serviceOrders.total}
                  pageSize={serviceOrders.page_size}
                />
              )}
            </>
          )}
        </div>
      </div>

      {/* Quotes */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Orçamentos</h2>
        <div className="bg-card rounded-lg border overflow-hidden">
          {!customerQuotes || customerQuotes.items.length === 0 ? (
            <div className="p-6 text-center text-muted-foreground">
              Nenhum orçamento encontrado
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left p-3 text-sm font-medium">Veículo</th>
                  <th className="text-left p-3 text-sm font-medium">Status</th>
                  <th className="text-left p-3 text-sm font-medium">Data</th>
                  <th className="text-right p-3 text-sm font-medium">Total</th>
                  <th className="text-right p-3 text-sm font-medium">Ações</th>
                </tr>
              </thead>
              <tbody>
                {customerQuotes.items.map((q) => {
                  const status = statusLabels[q.status] || { label: q.status, className: 'bg-muted' };
                  return (
                    <tr key={q.id} className="border-t hover:bg-muted/30">
                      <td className="p-3">
                        {q.vehicle_brand} {q.vehicle_model} ({q.vehicle_year})
                      </td>
                      <td className="p-3">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${status.className}`}>
                          {status.label}
                        </span>
                      </td>
                      <td className="p-3">{formatDate(q.created_at)}</td>
                      <td className="p-3 text-right font-medium">{formatCurrency(q.total)}</td>
                      <td className="p-3 text-right">
                        <Button variant="ghost" size="sm" asChild>
                          <Link to={`/quotes/${q.id}`}>Ver</Link>
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
