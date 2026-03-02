import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { customersApi } from '@/lib/api';
import { Plus, Eye, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Pagination } from '@/components/ui/pagination';

const PAGE_SIZE = 10;

export default function CustomersIndexPage() {
  const [currentPage, setCurrentPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['customers', currentPage],
    queryFn: () => customersApi.list({ page: currentPage, page_size: PAGE_SIZE }),
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Clientes</h1>
        <Link
          to="/customers/create"
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          Novo Cliente
        </Link>
      </div>

      <div className="bg-card rounded-lg border overflow-hidden">
        {isLoading ? (
          <div className="p-6 text-center text-muted-foreground">Carregando...</div>
        ) : data?.items.length === 0 ? (
          <div className="p-6 text-center text-muted-foreground">
            Nenhum cliente encontrado
          </div>
        ) : (
          <>
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left p-3 text-sm font-medium">Nome</th>
                  <th className="text-left p-3 text-sm font-medium">Telefone</th>
                  <th className="text-left p-3 text-sm font-medium">CPF/CNPJ</th>
                  <th className="text-left p-3 text-sm font-medium">Cidade/UF</th>
                  <th className="text-right p-3 text-sm font-medium">Ações</th>
                </tr>
              </thead>
              <tbody>
                {data?.items.map((customer) => (
                  <tr key={customer.id} className="border-t hover:bg-muted/30">
                    <td className="p-3 font-medium">{customer.name}</td>
                    <td className="p-3">{customer.phone || '-'}</td>
                    <td className="p-3">{customer.cpf_cnpj || '-'}</td>
                    <td className="p-3">
                      {customer.address_city && customer.address_state
                        ? `${customer.address_city}/${customer.address_state}`
                        : customer.address_city || '-'}
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" asChild title="Ver">
                          <Link to={`/customers/${customer.id}`}>
                            <Eye className="h-4 w-4" />
                          </Link>
                        </Button>
                        <Button variant="ghost" size="icon" asChild title="Editar">
                          <Link to={`/customers/${customer.id}/edit`}>
                            <Pencil className="h-4 w-4" />
                          </Link>
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {data && (
              <Pagination
                currentPage={data.page}
                totalPages={data.total_pages}
                onPageChange={setCurrentPage}
                totalItems={data.total}
                pageSize={data.page_size}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}
