import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { quotesApi } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Plus, Eye, Edit, FileText, ArrowRightLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Pagination } from '@/components/ui/pagination';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

const PAGE_SIZE = 10;

const statusLabels: Record<string, { label: string; className: string }> = {
  PENDING: { label: 'Pendente', className: 'bg-yellow-100 text-yellow-800' },
  APPROVED: { label: 'Aprovado', className: 'bg-green-100 text-green-800' },
  REJECTED: { label: 'Rejeitado', className: 'bg-red-100 text-red-800' },
  CONVERTED: { label: 'Convertido', className: 'bg-blue-100 text-blue-800' },
};

export default function QuotesIndexPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [currentPage, setCurrentPage] = useState(1);
  const [convertingId, setConvertingId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['quotes', currentPage],
    queryFn: () => quotesApi.list({ page: currentPage, page_size: PAGE_SIZE }),
  });

  const convertMutation = useMutation({
    mutationFn: (id: string) => quotesApi.convertToServiceOrder(id),
    onSuccess: (serviceOrder) => {
      queryClient.invalidateQueries({ queryKey: ['quotes'] });
      queryClient.invalidateQueries({ queryKey: ['service-orders'] });
      setConvertingId(null);
      navigate(`/service-orders/${serviceOrder.id}`);
    },
  });

  const canConvert = (status: string) => status !== 'CONVERTED' && status !== 'REJECTED';

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Orçamentos</h1>
        <Link
          to="/quotes/create"
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          Novo Orçamento
        </Link>
      </div>

      <div className="bg-card rounded-lg border overflow-hidden">
        {isLoading ? (
          <div className="p-6 text-center text-muted-foreground">Carregando...</div>
        ) : data?.items.length === 0 ? (
          <div className="p-6 text-center text-muted-foreground">
            Nenhum orçamento encontrado
          </div>
        ) : (
          <>
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left p-3 text-sm font-medium">Cliente</th>
                  <th className="text-left p-3 text-sm font-medium">Veículo</th>
                  <th className="text-left p-3 text-sm font-medium">Status</th>
                  <th className="text-left p-3 text-sm font-medium">Data</th>
                  <th className="text-right p-3 text-sm font-medium">Total</th>
                  <th className="text-right p-3 text-sm font-medium">Ações</th>
                </tr>
              </thead>
              <tbody>
                {data?.items.map((quote) => (
                  <tr key={quote.id} className="border-t hover:bg-muted/30">
                    <td className="p-3">{quote.customer_name}</td>
                    <td className="p-3">
                      {quote.vehicle_brand} {quote.vehicle_model} ({quote.vehicle_year})
                    </td>
                    <td className="p-3">
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          statusLabels[quote.status]?.className
                        }`}
                      >
                        {statusLabels[quote.status]?.label}
                      </span>
                    </td>
                    <td className="p-3">{formatDate(quote.created_at)}</td>
                    <td className="p-3 text-right font-medium">
                      {formatCurrency(quote.total)}
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Link to={`/quotes/${quote.id}`}>
                              <Button variant="ghost" size="icon">
                                <Eye className="h-4 w-4" />
                              </Button>
                            </Link>
                          </TooltipTrigger>
                          <TooltipContent>Visualizar</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Link to={`/quotes/${quote.id}/edit`}>
                              <Button variant="ghost" size="icon">
                                <Edit className="h-4 w-4" />
                              </Button>
                            </Link>
                          </TooltipTrigger>
                          <TooltipContent>Editar</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Link to={`/quotes/${quote.id}?preview=1`}>
                              <Button variant="ghost" size="icon">
                                <FileText className="h-4 w-4" />
                              </Button>
                            </Link>
                          </TooltipTrigger>
                          <TooltipContent>Visualizar PDF</TooltipContent>
                        </Tooltip>
                        {canConvert(quote.status) && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setConvertingId(quote.id)}
                              >
                                <ArrowRightLeft className="h-4 w-4 text-blue-600" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Converter para OS</TooltipContent>
                          </Tooltip>
                        )}
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

      <AlertDialog open={!!convertingId} onOpenChange={(open) => !open && setConvertingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Converter para Ordem de Serviço</AlertDialogTitle>
            <AlertDialogDescription>
              Deseja converter este orçamento em uma ordem de serviço? O orçamento será marcado como convertido e uma nova OS será criada com os mesmos dados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => convertingId && convertMutation.mutate(convertingId)}
              disabled={convertMutation.isPending}
            >
              {convertMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Converter
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
