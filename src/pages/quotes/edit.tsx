import { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Loader2, Plus, Trash2, Search } from 'lucide-react';
import { quotesApi, partsApi } from '@/lib/api';
import type { UpdateQuoteInput, LaborTask, PartItem, Part, QuoteStatus } from '@/types';
import { formatCurrency } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { QuickPartModal } from '@/components/shared/quick-part-modal';
import { VehicleSelector } from '@/components/shared/vehicle-selector';
import { CustomerSelector } from '@/components/shared/customer-selector';

interface PartLine extends PartItem {
  name: string;
}

const statusLabels: Record<QuoteStatus, string> = {
  PENDING: 'Pendente',
  APPROVED: 'Aprovado',
  REJECTED: 'Rejeitado',
  CONVERTED: 'Convertido em OS',
};

export default function QuotesEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showQuickPartModal, setShowQuickPartModal] = useState(false);

  const { data: quote, isLoading } = useQuery({
    queryKey: ['quote', id],
    queryFn: () => quotesApi.get(id!),
    enabled: !!id,
  });

  const [formData, setFormData] = useState({
    customer_id: '',
    customer_name: '',
    vehicle_brand: '',
    vehicle_model: '',
    vehicle_year: new Date().getFullYear(),
    vehicle_plate: '',
    mileage: '' as string | number,
    valid_until: '',
    status: 'PENDING' as QuoteStatus,
  });

  const [parts, setParts] = useState<PartLine[]>([]);
  const [laborTasks, setLaborTasks] = useState<LaborTask[]>([]);

  useEffect(() => {
    if (quote) {
      setFormData({
        customer_id: quote.customer_id || '',
        customer_name: quote.customer_name,
        vehicle_brand: quote.vehicle_brand,
        vehicle_model: quote.vehicle_model,
        vehicle_year: quote.vehicle_year,
        vehicle_plate: quote.vehicle_plate || '',
        mileage: quote.mileage || '',
        valid_until: quote.valid_until?.split('T')[0] || '',
        status: quote.status,
      });
      setParts(
        quote.items.map((item) => ({
          part_id: item.part_id,
          name: item.part?.name || 'Peça desconhecida',
          quantity: item.quantity,
          unit_price: item.unit_price,
        }))
      );
      setLaborTasks(quote.labor_tasks || []);
    }
  }, [quote]);

  const { data: availableParts } = useQuery({
    queryKey: ['parts', 'search', searchTerm],
    queryFn: async () => {
      if (searchTerm.length >= 2) {
        return partsApi.search(searchTerm);
      }
      const result = await partsApi.list({ page: 1, page_size: 100 });
      return result.items;
    },
    enabled: showSearch,
  });

  const updateMutation = useMutation({
    mutationFn: (data: UpdateQuoteInput) => quotesApi.update(id!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotes'] });
      queryClient.invalidateQueries({ queryKey: ['quote', id] });
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      navigate(`/quotes/${id}`);
    },
    onError: (err) => {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar orçamento');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => quotesApi.delete(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotes'] });
      navigate('/quotes');
    },
    onError: (err) => {
      setError(err instanceof Error ? err.message : 'Erro ao excluir orçamento');
    },
  });

  const addPart = (part: Part) => {
    const existing = parts.find((p) => p.part_id === part.id);
    if (existing) {
      setParts(parts.map((p) => (p.part_id === part.id ? { ...p, quantity: p.quantity + 1 } : p)));
    } else {
      setParts([...parts, { part_id: part.id, name: part.name, quantity: 1, unit_price: part.unit_price }]);
    }
    setShowSearch(false);
    setSearchTerm('');
  };

  const handleQuickPartCreated = (part: Part) => {
    addPart(part);
  };

  const updatePartQuantity = (partId: string, quantity: number) => {
    if (quantity <= 0) {
      setParts(parts.filter((p) => p.part_id !== partId));
    } else {
      setParts(parts.map((p) => (p.part_id === partId ? { ...p, quantity } : p)));
    }
  };

  const updatePartPrice = (partId: string, unit_price: number) => {
    setParts(parts.map((p) => (p.part_id === partId ? { ...p, unit_price } : p)));
  };

  const removePart = (partId: string) => {
    setParts(parts.filter((p) => p.part_id !== partId));
  };

  const addLaborTask = () => {
    setLaborTasks([...laborTasks, { description: '', cost: 0 }]);
  };

  const updateLaborTask = (index: number, field: keyof LaborTask, value: string | number) => {
    setLaborTasks(laborTasks.map((task, i) => (i === index ? { ...task, [field]: value } : task)));
  };

  const removeLaborTask = (index: number) => {
    setLaborTasks(laborTasks.filter((_, i) => i !== index));
  };

  const partsTotal = parts.reduce((sum, p) => sum + p.quantity * p.unit_price, 0);
  const laborTotal = laborTasks.reduce((sum, t) => sum + (t.cost || 0), 0);
  const total = partsTotal + laborTotal;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.customer_id) {
      setError('O cliente é obrigatório');
      return;
    }
    if (!formData.vehicle_brand.trim()) {
      setError('A marca do veículo é obrigatória');
      return;
    }
    if (!formData.vehicle_model.trim()) {
      setError('O modelo do veículo é obrigatório');
      return;
    }

    const input: UpdateQuoteInput = {
      customer_id: formData.customer_id,
      vehicle_brand: formData.vehicle_brand.trim(),
      vehicle_model: formData.vehicle_model.trim(),
      vehicle_year: formData.vehicle_year,
      status: formData.status,
    };

    if (formData.vehicle_plate?.trim()) {
      input.vehicle_plate = formData.vehicle_plate.trim();
    }
    if (formData.mileage) {
      input.mileage = Number(formData.mileage);
    }
    if (formData.valid_until) {
      input.valid_until = formData.valid_until;
    }

    input.parts = parts.map((p) => ({
      part_id: p.part_id,
      quantity: p.quantity,
      unit_price: p.unit_price,
    }));

    const validTasks = laborTasks.filter((t) => t.description.trim() && t.cost > 0);
    input.labor_tasks = validTasks;

    updateMutation.mutate(input);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!quote) {
    return (
      <div className="text-center p-12">
        <p className="text-muted-foreground">Orçamento não encontrado</p>
        <Link to="/quotes" className="text-primary hover:underline mt-2 inline-block">
          Voltar para lista
        </Link>
      </div>
    );
  }

  const isConverted = quote.status === 'CONVERTED';

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <Link to={`/quotes/${id}`} className="p-2 hover:bg-accent rounded-lg">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-2xl font-bold">Editar Orçamento</h1>
      </div>

      {isConverted && (
        <div className="mb-6 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
          <p className="text-sm text-yellow-600 dark:text-yellow-400">
            Este orçamento foi convertido em Ordem de Serviço e não pode ser editado.
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-lg">{error}</div>
        )}

        <div className="bg-card rounded-lg border p-6 space-y-6">
          <h2 className="font-semibold">Dados do Cliente</h2>
          <CustomerSelector
            value={formData.customer_id || null}
            customerName={formData.customer_name}
            onChange={(id, name) => setFormData({ ...formData, customer_id: id, customer_name: name })}
            disabled={isConverted}
          />
        </div>

        <div className="bg-card rounded-lg border p-6 space-y-6">
          <h2 className="font-semibold">Dados do Veículo</h2>

          <VehicleSelector
            value={{
              brand: formData.vehicle_brand,
              model: formData.vehicle_model,
              year: formData.vehicle_year,
            }}
            onChange={(v) => setFormData({ ...formData, vehicle_brand: v.brand, vehicle_model: v.model, vehicle_year: v.year })}
            disabled={isConverted}
          />

          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="vehicle_plate">Placa</Label>
              <Input
                id="vehicle_plate"
                value={formData.vehicle_plate}
                onChange={(e) => setFormData({ ...formData, vehicle_plate: e.target.value.toUpperCase() })}
                placeholder="ABC-1234"
                disabled={isConverted}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="mileage">Quilometragem</Label>
              <Input
                id="mileage"
                type="number"
                min="0"
                value={formData.mileage}
                onChange={(e) => setFormData({ ...formData, mileage: e.target.value })}
                placeholder="Ex: 50000"
                disabled={isConverted}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="valid_until">Válido até</Label>
              <Input
                id="valid_until"
                type="date"
                value={formData.valid_until}
                onChange={(e) => setFormData({ ...formData, valid_until: e.target.value })}
                disabled={isConverted}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value: QuoteStatus) => setFormData({ ...formData, status: value })}
                disabled={isConverted}
              >
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(statusLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value} disabled={value === 'CONVERTED'}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-lg border p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Peças</h2>
            {!isConverted && (
              <div className="flex gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setShowQuickPartModal(true)}>
                  <Plus className="h-4 w-4" />
                  Nova Peça
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={() => setShowSearch(!showSearch)}>
                  <Search className="h-4 w-4" />
                  Buscar Peça
                </Button>
              </div>
            )}
          </div>

          {showSearch && !isConverted && (
            <div className="border rounded-lg p-4 space-y-3">
              <Input
                placeholder="Buscar peça por nome ou código..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                autoFocus
              />
              <div className="max-h-48 overflow-y-auto space-y-1">
                {availableParts?.map((part) => (
                  <button
                    key={part.id}
                    type="button"
                    className="w-full text-left p-2 hover:bg-accent rounded flex justify-between items-center"
                    onClick={() => addPart(part)}
                  >
                    <span>
                      {part.name} <span className="text-muted-foreground text-sm">({part.number})</span>
                    </span>
                    <span className="text-sm font-medium">{formatCurrency(part.unit_price)}</span>
                  </button>
                ))}
                {availableParts?.length === 0 && (
                  <div className="text-center py-4">
                    <p className="text-sm text-muted-foreground mb-2">Nenhuma peça encontrada</p>
                    <Button type="button" variant="link" size="sm" onClick={() => { setShowSearch(false); setShowQuickPartModal(true); }}>
                      Cadastrar nova peça
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}

          {parts.length > 0 ? (
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left p-2 text-sm font-medium">Peça</th>
                  <th className="text-center p-2 text-sm font-medium w-24">Qtd</th>
                  <th className="text-right p-2 text-sm font-medium w-32">Preço Unit.</th>
                  <th className="text-right p-2 text-sm font-medium w-32">Subtotal</th>
                  {!isConverted && <th className="w-10"></th>}
                </tr>
              </thead>
              <tbody>
                {parts.map((part) => (
                    <tr key={part.part_id} className="border-t">
                      <td className="p-2">{part.name}</td>
                      <td className="p-2">
                        <Input
                          type="number"
                          min="1"
                          value={part.quantity}
                          onChange={(e) => updatePartQuantity(part.part_id, parseInt(e.target.value) || 0)}
                          className="text-center h-8"
                          disabled={isConverted}
                        />
                      </td>
                      <td className="p-2">
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          value={part.unit_price}
                          onChange={(e) => updatePartPrice(part.part_id, parseFloat(e.target.value) || 0)}
                          className="text-right h-8"
                          disabled={isConverted}
                        />
                      </td>
                      <td className="p-2 text-right font-medium">{formatCurrency(part.quantity * part.unit_price)}</td>
                      {!isConverted && (
                        <td className="p-2">
                          <Button type="button" variant="ghost" size="icon" onClick={() => removePart(part.part_id)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </td>
                      )}
                    </tr>
                ))}
              </tbody>
              <tfoot className="border-t">
                <tr>
                  <td colSpan={3} className="p-2 text-right font-medium">
                    Total Peças:
                  </td>
                  <td className="p-2 text-right font-bold">{formatCurrency(partsTotal)}</td>
                  {!isConverted && <td></td>}
                </tr>
              </tfoot>
            </table>
          ) : (
            <p className="text-sm text-muted-foreground">Nenhuma peça adicionada</p>
          )}
        </div>

        <div className="bg-card rounded-lg border p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Mão de Obra</h2>
            {!isConverted && (
              <Button type="button" variant="outline" size="sm" onClick={addLaborTask}>
                <Plus className="h-4 w-4" />
                Adicionar Serviço
              </Button>
            )}
          </div>

          {laborTasks.length > 0 ? (
            <div className="space-y-3">
              {laborTasks.map((task, index) => (
                <div key={index} className="flex gap-3 items-start">
                  <div className="flex-1">
                    <Input
                      placeholder="Descrição do serviço"
                      value={task.description}
                      onChange={(e) => updateLaborTask(index, 'description', e.target.value)}
                      disabled={isConverted}
                    />
                  </div>
                  <div className="w-32">
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="Valor"
                      value={task.cost || ''}
                      onChange={(e) => updateLaborTask(index, 'cost', parseFloat(e.target.value) || 0)}
                      disabled={isConverted}
                      onKeyDown={(e) => {
                        if (e.key === 'Tab' && !e.shiftKey && !isConverted && index === laborTasks.length - 1) {
                          e.preventDefault();
                          addLaborTask();
                          setTimeout(() => {
                            const inputs = document.querySelectorAll<HTMLInputElement>('[placeholder="Descrição do serviço"]');
                            inputs[inputs.length - 1]?.focus();
                          }, 0);
                        }
                      }}
                    />
                  </div>
                  {!isConverted && (
                    <Button type="button" variant="ghost" size="icon" onClick={() => removeLaborTask(index)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  )}
                </div>
              ))}
              <div className="flex justify-end pt-2 border-t">
                <span className="font-medium">Total Mão de Obra: {formatCurrency(laborTotal)}</span>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Nenhum serviço adicionado</p>
          )}
        </div>

        <div className="bg-card rounded-lg border p-6">
          <div className="flex justify-between items-center">
            <span className="text-lg font-semibold">Total do Orçamento</span>
            <span className="text-2xl font-bold">{formatCurrency(total)}</span>
          </div>
        </div>

        <div className="flex justify-between gap-3">
          <div>
            {!isConverted && !showDeleteConfirm && (
              <Button type="button" variant="destructive" onClick={() => setShowDeleteConfirm(true)}>
                <Trash2 className="h-4 w-4" />
                Excluir
              </Button>
            )}
            {showDeleteConfirm && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Confirmar exclusão?</span>
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={() => deleteMutation.mutate()}
                  disabled={deleteMutation.isPending}
                >
                  {deleteMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Sim'}
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={() => setShowDeleteConfirm(false)}>
                  Não
                </Button>
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <Button type="button" variant="outline" onClick={() => navigate(`/quotes/${id}`)}>
              Cancelar
            </Button>
            {!isConverted && (
              <Button type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                Salvar
              </Button>
            )}
          </div>
        </div>
      </form>

      <QuickPartModal
        open={showQuickPartModal}
        onOpenChange={setShowQuickPartModal}
        onPartCreated={handleQuickPartCreated}
        initialName={searchTerm}
      />
    </div>
  );
}
