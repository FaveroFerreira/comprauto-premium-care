import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { partsApi } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { Plus, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Pagination } from '@/components/ui/pagination';
import type { VehicleCompatibility } from '@/types';

const PAGE_SIZE = 10;

function formatCompatibility(isUniversal: boolean, compatibilities: VehicleCompatibility[]): string {
  if (isUniversal) return 'Universal';
  if (!compatibilities || compatibilities.length === 0) return 'Universal';

  const first = compatibilities[0];
  let label = first.vehicle_brand;
  if (first.vehicle_model) {
    label += ` ${first.vehicle_model}`;
  }
  if (first.year_start && first.year_end && first.year_start !== first.year_end) {
    label += ` (${first.year_start}-${first.year_end})`;
  } else if (first.year_start) {
    label += ` (${first.year_start})`;
  }

  if (compatibilities.length > 1) {
    label += `, +${compatibilities.length - 1}`;
  }

  return label;
}

export default function PartsIndexPage() {
  const [currentPage, setCurrentPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['parts', currentPage],
    queryFn: () => partsApi.list({ page: currentPage, page_size: PAGE_SIZE }),
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Peças</h1>
        <Link
          to="/parts/create"
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          Nova Peça
        </Link>
      </div>

      <div className="bg-card rounded-lg border overflow-hidden">
        {isLoading ? (
          <div className="p-6 text-center text-muted-foreground">Carregando...</div>
        ) : data?.items.length === 0 ? (
          <div className="p-6 text-center text-muted-foreground">
            Nenhuma peça encontrada
          </div>
        ) : (
          <>
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left p-3 text-sm font-medium">Nome</th>
                  <th className="text-left p-3 text-sm font-medium">Número</th>
                  <th className="text-left p-3 text-sm font-medium">Compatibilidade</th>
                  <th className="text-right p-3 text-sm font-medium">Preço</th>
                  <th className="text-right p-3 text-sm font-medium">Ações</th>
                </tr>
              </thead>
              <tbody>
                {data?.items.map((part) => {
                  const compatibility = formatCompatibility(part.is_universal, part.vehicle_compatibilities);
                  return (
                    <tr key={part.id} className="border-t hover:bg-muted/30">
                      <td className="p-3 font-medium">{part.name}</td>
                      <td className="p-3 text-muted-foreground">{part.number || '-'}</td>
                      <td className="p-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                          part.is_universal
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
                        }`}>
                          {compatibility}
                        </span>
                      </td>
                      <td className="p-3 text-right">{formatCurrency(part.unit_price)}</td>
                      <td className="p-3 text-right">
                        <Button variant="ghost" size="icon" asChild title="Editar">
                          <Link to={`/parts/${part.id}/edit`}>
                            <Pencil className="h-4 w-4" />
                          </Link>
                        </Button>
                      </td>
                    </tr>
                  );
                })}
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
