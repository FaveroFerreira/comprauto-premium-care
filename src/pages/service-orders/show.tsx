import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { serviceOrdersApi } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';
import { ArrowLeft, Edit, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ServiceOrderPrint } from '@/components/print/ServiceOrderPrint';
import { PrintPreviewModal } from '@/components/shared/PrintPreviewModal';

export default function ServiceOrdersShowPage() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const [showPreview, setShowPreview] = useState(false);
  const { data, isLoading } = useQuery({
    queryKey: ['service-order', id],
    queryFn: () => serviceOrdersApi.get(id!),
    enabled: !!id,
  });

  useEffect(() => {
    if (searchParams.get('preview') === '1' && data) {
      setShowPreview(true);
    }
  }, [searchParams, data]);

  if (isLoading) {
    return <div className="p-6 text-center text-muted-foreground">Carregando...</div>;
  }

  if (!data) {
    return <div className="p-6 text-center text-muted-foreground">Ordem não encontrada</div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6 print:hidden">
        <div className="flex items-center gap-4">
          <Link to="/service-orders" className="p-2 hover:bg-accent rounded-lg">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-2xl font-bold">Ordem de Serviço</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setShowPreview(true)}>
            <FileText className="h-4 w-4" />
            Visualizar PDF
          </Button>
          <Link
            to={`/service-orders/${id}/edit`}
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
        title={`Ordem de Serviço #${data.number ?? data.id.substring(0, 8)}`}
      >
        <ServiceOrderPrint data={data} />
      </PrintPreviewModal>

      <div className="space-y-6">
        <div className="bg-card rounded-lg border p-6 print:border-0 print:p-0">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-lg">Ordem de Serviço</h2>
            <span
              className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                data.status === 'OPEN'
                  ? 'bg-yellow-100 text-yellow-800'
                  : 'bg-green-100 text-green-800'
              }`}
            >
              {data.status === 'OPEN' ? 'Aberta' : 'Finalizada'}
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
            <div>
              <dt className="text-sm text-muted-foreground">Placa</dt>
              <dd className="font-medium">{data.vehicle_plate || '-'}</dd>
            </div>
            {data.mileage && (
              <div>
                <dt className="text-sm text-muted-foreground">Quilometragem</dt>
                <dd className="font-medium">{data.mileage.toLocaleString()} km</dd>
              </div>
            )}
          </div>
        </div>

        {data.items && data.items.length > 0 && (
          <div className="bg-card rounded-lg border p-6">
            <h3 className="font-medium mb-3">Peças</h3>
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
              <tfoot className="border-t">
                <tr>
                  <td colSpan={3} className="p-2 text-right font-medium">Total Peças:</td>
                  <td className="p-2 text-right font-bold">{formatCurrency(data.parts_total)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}

        {data.labor_tasks && data.labor_tasks.length > 0 && (
          <div className="bg-card rounded-lg border p-6">
            <h3 className="font-medium mb-3">Mão de Obra</h3>
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
              <tfoot className="border-t">
                <tr>
                  <td className="p-2 text-right font-medium">Total Mão de Obra:</td>
                  <td className="p-2 text-right font-bold">{formatCurrency(data.labor_cost)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}

        <div className="bg-card rounded-lg border p-6">
          <div className="flex justify-between items-center">
            <span className="text-lg font-semibold">Total da Ordem de Serviço</span>
            <span className="text-2xl font-bold">{formatCurrency(data.total)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
