import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { statsApi } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';
import { FileText, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

export default function ReportsIndexPage() {
  const currentDate = new Date();
  const [year, setYear] = useState(currentDate.getFullYear());
  const [month, setMonth] = useState(currentDate.getMonth() + 1);

  const { data, isLoading, error } = useQuery({
    queryKey: ['monthly-parts-report', year, month],
    queryFn: () => statsApi.getMonthlyPartsReport(year, month),
  });

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

      {/* Report Card */}
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
            {/* Summary Card */}
            <div className="p-6 bg-muted/30">
              <div className="bg-card rounded-lg border p-4 max-w-xs">
                <p className="text-sm text-muted-foreground mb-1">Total Vendas</p>
                <p className="text-2xl font-bold">{formatCurrency(data?.total_sale || 0)}</p>
              </div>
            </div>

            {/* Items Table */}
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
    </div>
  );
}
