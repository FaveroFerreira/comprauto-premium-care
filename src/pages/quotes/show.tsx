import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { quotesApi } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';
import { ArrowLeft, Edit, FileText, ArrowRightLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { QuotePrint } from '@/components/print/QuotePrint';
import { PrintPreviewModal } from '@/components/shared/PrintPreviewModal';
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

const statusLabels: Record<string, { label: string; className: string }> = {
  PENDING: { label: 'Pendente', className: 'bg-yellow-100 text-yellow-800' },
  APPROVED: { label: 'Aprovado', className: 'bg-green-100 text-green-800' },
  REJECTED: { label: 'Rejeitado', className: 'bg-red-100 text-red-800' },
  CONVERTED: { label: 'Convertido', className: 'bg-blue-100 text-blue-800' },
};

export default function QuotesShowPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const [showConvertDialog, setShowConvertDialog] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['quote', id],
    queryFn: () => quotesApi.get(id!),
    enabled: !!id,
  });

  useEffect(() => {
    if (searchParams.get('preview') === '1' && data) {
      setShowPreview(true);
    }
  }, [searchParams, data]);

  const convertMutation = useMutation({
    mutationFn: () => quotesApi.convertToServiceOrder(id!),
    onSuccess: (serviceOrder) => {
      queryClient.invalidateQueries({ queryKey: ['quotes'] });
      queryClient.invalidateQueries({ queryKey: ['quote', id] });
      queryClient.invalidateQueries({ queryKey: ['service-orders'] });
      navigate(`/service-orders/${serviceOrder.id}`);
    },
  });

  if (isLoading) {
    return <div className="p-6 text-center text-muted-foreground">Carregando...</div>;
  }

  if (!data) {
    return <div className="p-6 text-center text-muted-foreground">Orçamento não encontrado</div>;
  }

  const canConvert = data.status !== 'CONVERTED' && data.status !== 'REJECTED';

  return (
    <div>
      <div className="flex items-center justify-between mb-6 print:hidden">
        <div className="flex items-center gap-4">
          <Link to="/quotes" className="p-2 hover:bg-accent rounded-lg">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-2xl font-bold">Orçamento</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setShowPreview(true)}>
            <FileText className="h-4 w-4" />
            Visualizar PDF
          </Button>
          {canConvert && (
            <Button variant="outline" onClick={() => setShowConvertDialog(true)}>
              <ArrowRightLeft className="h-4 w-4" />
              Converter para OS
            </Button>
          )}
          <Link
            to={`/quotes/${id}/edit`}
            className="inline-flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-accent"
          >
            <Edit className="h-4 w-4" />
            Editar
          </Link>
        </div>
      </div>

      <PrintPreviewModal
        open={showPreview}
        onOpenChange={setShowPreview}
        title={`Orçamento #${data.number ?? data.id.substring(0, 8)}`}
      >
        <QuotePrint data={data} />
      </PrintPreviewModal>

      <div className="bg-card rounded-lg border p-6 space-y-6 print:border-0 print:p-0">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-lg">Orçamento</h2>
          <span
            className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
              statusLabels[data.status]?.className
            }`}
          >
            {statusLabels[data.status]?.label}
          </span>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <dt className="text-sm text-muted-foreground">Cliente</dt>
            <dd className="font-medium">{data.customer_name}</dd>
          </div>
          <div>
            <dt className="text-sm text-muted-foreground">Data</dt>
            <dd className="font-medium">{formatDate(data.created_at)}</dd>
          </div>
          <div>
            <dt className="text-sm text-muted-foreground">Veículo</dt>
            <dd className="font-medium">
              {data.vehicle_brand} {data.vehicle_model} ({data.vehicle_year})
            </dd>
          </div>
        </div>

        {data.items && data.items.length > 0 && (
          <div>
            <h3 className="font-medium mb-2">Peças</h3>
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left p-2">Peça</th>
                  <th className="text-center p-2 w-20">Qtd</th>
                  <th className="text-right p-2 w-28">Preço Unit.</th>
                  <th className="text-right p-2 w-28">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((item, idx) => (
                  <tr key={idx} className="border-t">
                    <td className="p-2">{item.part?.name || `Peça ${item.part_id}`}</td>
                    <td className="p-2 text-center">{item.quantity}</td>
                    <td className="p-2 text-right">{formatCurrency(item.unit_price)}</td>
                    <td className="p-2 text-right">{formatCurrency(item.quantity * item.unit_price)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {data.labor_tasks && data.labor_tasks.length > 0 && (
          <div>
            <h3 className="font-medium mb-2">Mão de Obra</h3>
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left p-2">Descrição</th>
                  <th className="text-right p-2 w-28">Valor</th>
                </tr>
              </thead>
              <tbody>
                {data.labor_tasks.map((task, idx) => (
                  <tr key={idx} className="border-t">
                    <td className="p-2">{task.description}</td>
                    <td className="p-2 text-right">{formatCurrency(task.cost)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="border-t pt-4">
          <div className="flex justify-between items-center">
            <span className="text-lg font-semibold">Total</span>
            <span className="text-2xl font-bold">{formatCurrency(data.total)}</span>
          </div>
        </div>
      </div>

      <AlertDialog open={showConvertDialog} onOpenChange={setShowConvertDialog}>
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
              onClick={() => convertMutation.mutate()}
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
