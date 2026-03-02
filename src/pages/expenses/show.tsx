import { useQuery } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import { expensesApi } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';
import { ArrowLeft, Edit } from 'lucide-react';

const categoryLabels: Record<string, string> = {
  FUEL: 'Combustível',
  SUPPLIES: 'Suprimentos',
  UTILITIES: 'Utilidades',
  RENT: 'Aluguel',
  SALARY: 'Salário',
  TAXES: 'Impostos',
  OTHER: 'Outros',
};

export default function ExpensesShowPage() {
  const { id } = useParams();
  const { data, isLoading } = useQuery({
    queryKey: ['expense', id],
    queryFn: () => expensesApi.get(id!),
    enabled: !!id,
  });

  if (isLoading) {
    return <div className="p-6 text-center text-muted-foreground">Carregando...</div>;
  }

  if (!data) {
    return <div className="p-6 text-center text-muted-foreground">Despesa não encontrada</div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link to="/expenses" className="p-2 hover:bg-accent rounded-lg">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-2xl font-bold">Despesa</h1>
        </div>
        <Link
          to={`/expenses/${id}/edit`}
          className="inline-flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-accent"
        >
          <Edit className="h-4 w-4" />
          Editar
        </Link>
      </div>

      <div className="bg-card rounded-lg border p-6">
        <h2 className="font-semibold mb-4">Detalhes da Despesa</h2>
        <dl className="space-y-4">
          <div>
            <dt className="text-sm text-muted-foreground">Descrição</dt>
            <dd className="font-medium">{data.description}</dd>
          </div>
          <div>
            <dt className="text-sm text-muted-foreground">Categoria</dt>
            <dd>
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-muted">
                {categoryLabels[data.category] || data.category}
              </span>
            </dd>
          </div>
          <div>
            <dt className="text-sm text-muted-foreground">Data</dt>
            <dd className="font-medium">{formatDate(data.expense_date)}</dd>
          </div>
          <div>
            <dt className="text-sm text-muted-foreground">Valor</dt>
            <dd className="text-xl font-bold">{formatCurrency(data.amount)}</dd>
          </div>
          {data.notes && (
            <div>
              <dt className="text-sm text-muted-foreground">Observações</dt>
              <dd className="font-medium whitespace-pre-wrap">{data.notes}</dd>
            </div>
          )}
        </dl>
      </div>
    </div>
  );
}
