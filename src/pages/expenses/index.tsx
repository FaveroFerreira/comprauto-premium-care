import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { expensesApi } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Plus, Eye, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Pagination } from '@/components/ui/pagination';

const PAGE_SIZE = 10;

const categoryLabels: Record<string, string> = {
  FUEL: 'Combustível',
  SUPPLIES: 'Suprimentos',
  UTILITIES: 'Utilidades',
  RENT: 'Aluguel',
  SALARY: 'Salário',
  TAXES: 'Impostos',
  OTHER: 'Outros',
};

export default function ExpensesIndexPage() {
  const [currentPage, setCurrentPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['expenses', currentPage],
    queryFn: () => expensesApi.list({ page: currentPage, page_size: PAGE_SIZE }),
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Despesas</h1>
        <Link
          to="/expenses/create"
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          Nova Despesa
        </Link>
      </div>

      <div className="bg-card rounded-lg border overflow-hidden">
        {isLoading ? (
          <div className="p-6 text-center text-muted-foreground">Carregando...</div>
        ) : data?.items.length === 0 ? (
          <div className="p-6 text-center text-muted-foreground">
            Nenhuma despesa encontrada
          </div>
        ) : (
          <>
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left p-3 text-sm font-medium">Descrição</th>
                  <th className="text-left p-3 text-sm font-medium">Categoria</th>
                  <th className="text-left p-3 text-sm font-medium">Data</th>
                  <th className="text-right p-3 text-sm font-medium">Valor</th>
                  <th className="text-right p-3 text-sm font-medium">Ações</th>
                </tr>
              </thead>
              <tbody>
                {data?.items.map((expense) => (
                  <tr key={expense.id} className="border-t hover:bg-muted/30">
                    <td className="p-3 font-medium">{expense.description}</td>
                    <td className="p-3">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-muted">
                        {categoryLabels[expense.category] || expense.category}
                      </span>
                    </td>
                    <td className="p-3">{formatDate(expense.expense_date)}</td>
                    <td className="p-3 text-right font-medium">
                      {formatCurrency(expense.amount)}
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" asChild title="Ver">
                          <Link to={`/expenses/${expense.id}`}>
                            <Eye className="h-4 w-4" />
                          </Link>
                        </Button>
                        <Button variant="ghost" size="icon" asChild title="Editar">
                          <Link to={`/expenses/${expense.id}/edit`}>
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
