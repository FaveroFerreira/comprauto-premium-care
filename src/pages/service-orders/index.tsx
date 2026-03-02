import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { serviceOrdersApi } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Plus, Eye, Edit, FileText, CheckCircle, Loader2 } from 'lucide-react';
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

export default function ServiceOrdersIndexPage() {
  const queryClient = useQueryClient();
  const [currentPage, setCurrentPage] = useState(1);
  const [finishingId, setFinishingId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['service-orders', currentPage],
    queryFn: () => serviceOrdersApi.list({ page: currentPage, page_size: PAGE_SIZE }),
  });

  const finishMutation = useMutation({
    mutationFn: (id: string) => serviceOrdersApi.finish(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-orders'] });
      setFinishingId(null);
    },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Ordens de Serviço</h1>
        <Link
          to="/service-orders/create"
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          Nova OS
        </Link>
      </div>

      <div className="bg-card rounded-lg border overflow-hidden">
        {isLoading ? (
          <div className="p-6 text-center text-muted-foreground">Carregando...</div>
        ) : data?.items.length === 0 ? (
          <div className="p-6 text-center text-muted-foreground">
            Nenhuma ordem de serviço encontrada
          </div>
        ) : (
          <>
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left p-3 text-sm font-medium">Cliente</th>
                  <th className="text-left p-3 text-sm font-medium">Veículo</th>
                  <th className="text-left p-3 text-sm font-medium">Placa</th>
                  <th className="text-left p-3 text-sm font-medium">Status</th>
                  <th className="text-left p-3 text-sm font-medium">Data</th>
                  <th className="text-right p-3 text-sm font-medium">Total</th>
                  <th className="text-right p-3 text-sm font-medium">Ações</th>
                </tr>
              </thead>
              <tbody>
                {data?.items.map((order) => (
                  <tr key={order.id} className="border-t hover:bg-muted/30">
                    <td className="p-3">{order.customer_name}</td>
                    <td className="p-3">
                      {order.vehicle_brand} {order.vehicle_model} ({order.vehicle_year})
                    </td>
                    <td className="p-3">{order.vehicle_plate || '-'}</td>
                    <td className="p-3">
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          order.status === 'OPEN'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-green-100 text-green-800'
                        }`}
                      >
                        {order.status === 'OPEN' ? 'Aberta' : 'Finalizada'}
                      </span>
                    </td>
                    <td className="p-3">{formatDate(order.created_at)}</td>
                    <td className="p-3 text-right font-medium">
                      {formatCurrency(order.total)}
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Link to={`/service-orders/${order.id}`}>
                              <Button variant="ghost" size="icon">
                                <Eye className="h-4 w-4" />
                              </Button>
                            </Link>
                          </TooltipTrigger>
                          <TooltipContent>Visualizar</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Link to={`/service-orders/${order.id}/edit`}>
                              <Button variant="ghost" size="icon">
                                <Edit className="h-4 w-4" />
                              </Button>
                            </Link>
                          </TooltipTrigger>
                          <TooltipContent>Editar</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Link to={`/service-orders/${order.id}?preview=1`}>
                              <Button variant="ghost" size="icon">
                                <FileText className="h-4 w-4" />
                              </Button>
                            </Link>
                          </TooltipTrigger>
                          <TooltipContent>Visualizar PDF</TooltipContent>
                        </Tooltip>
                        {order.status === 'OPEN' && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setFinishingId(order.id)}
                              >
                                <CheckCircle className="h-4 w-4 text-green-600" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Finalizar OS</TooltipContent>
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

      <AlertDialog open={!!finishingId} onOpenChange={(open) => !open && setFinishingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Finalizar Ordem de Serviço</AlertDialogTitle>
            <AlertDialogDescription>
              Deseja finalizar esta ordem de serviço? Esta ação indica que o serviço foi concluído.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => finishingId && finishMutation.mutate(finishingId)}
              disabled={finishMutation.isPending}
            >
              {finishMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Finalizar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
