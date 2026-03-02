import { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Loader2, Trash2 } from 'lucide-react';
import { expensesApi } from '@/lib/api';
import type { UpdateExpenseInput, ExpenseCategory } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const categoryLabels: Record<ExpenseCategory, string> = {
  AUTO_PARTS: 'Autopeças',
  SERVICE_PROVIDER: 'Prestador de Serviço',
  EQUIPMENT: 'Equipamento',
  OTHER: 'Outros',
};

export default function ExpensesEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const { data: expense, isLoading } = useQuery({
    queryKey: ['expenses', id],
    queryFn: () => expensesApi.get(id!),
    enabled: !!id,
  });

  const [formData, setFormData] = useState<UpdateExpenseInput>({
    description: '',
    amount: 0,
    category: 'OTHER',
    supplier_name: '',
    reference: '',
    expense_date: '',
    notes: '',
  });

  useEffect(() => {
    if (expense) {
      setFormData({
        description: expense.description,
        amount: expense.amount,
        category: expense.category,
        supplier_name: expense.supplier_name || '',
        reference: expense.reference || '',
        expense_date: expense.expense_date.split('T')[0],
        notes: expense.notes || '',
      });
    }
  }, [expense]);

  const updateMutation = useMutation({
    mutationFn: (data: UpdateExpenseInput) => expensesApi.update(id!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      navigate('/expenses');
    },
    onError: (err) => {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar despesa');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => expensesApi.delete(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      navigate('/expenses');
    },
    onError: (err) => {
      setError(err instanceof Error ? err.message : 'Erro ao excluir despesa');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.description?.trim()) {
      setError('A descrição é obrigatória');
      return;
    }
    if (!formData.amount || formData.amount <= 0) {
      setError('O valor deve ser maior que zero');
      return;
    }
    if (!formData.expense_date) {
      setError('A data da despesa é obrigatória');
      return;
    }

    const input: UpdateExpenseInput = {
      description: formData.description.trim(),
      amount: formData.amount,
      category: formData.category,
      expense_date: formData.expense_date,
    };

    if (formData.supplier_name?.trim()) {
      input.supplier_name = formData.supplier_name.trim();
    }
    if (formData.reference?.trim()) {
      input.reference = formData.reference.trim();
    }
    if (formData.notes?.trim()) {
      input.notes = formData.notes.trim();
    }

    updateMutation.mutate(input);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!expense) {
    return (
      <div className="text-center p-12">
        <p className="text-muted-foreground">Despesa não encontrada</p>
        <Link to="/expenses" className="text-primary hover:underline mt-2 inline-block">
          Voltar para lista
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <Link to={`/expenses/${id}`} className="p-2 hover:bg-accent rounded-lg">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-2xl font-bold">Editar Despesa</h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-card rounded-lg border p-6 space-y-6">
        {error && (
          <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-lg">
            {error}
          </div>
        )}

        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="description">Descrição *</Label>
            <Input
              id="description"
              value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Ex: Compra de peças para estoque"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Valor (R$) *</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              min="0"
              value={formData.amount || ''}
              onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
              placeholder="0,00"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Categoria *</Label>
            <Select
              value={formData.category}
              onValueChange={(value: ExpenseCategory) => setFormData({ ...formData, category: value })}
            >
              <SelectTrigger id="category">
                <SelectValue placeholder="Selecione uma categoria" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(categoryLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="expense_date">Data *</Label>
            <Input
              id="expense_date"
              type="date"
              value={formData.expense_date || ''}
              onChange={(e) => setFormData({ ...formData, expense_date: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="supplier_name">Fornecedor</Label>
            <Input
              id="supplier_name"
              value={formData.supplier_name || ''}
              onChange={(e) => setFormData({ ...formData, supplier_name: e.target.value })}
              placeholder="Ex: Distribuidora XYZ"
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="reference">Referência</Label>
            <Input
              id="reference"
              value={formData.reference || ''}
              onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
              placeholder="Ex: NF 12345"
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="notes">Observações</Label>
            <Textarea
              id="notes"
              value={formData.notes || ''}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Observações adicionais..."
              rows={3}
            />
          </div>
        </div>

        <div className="flex justify-between gap-3 pt-4 border-t">
          <div>
            {!showDeleteConfirm ? (
              <Button
                type="button"
                variant="destructive"
                onClick={() => setShowDeleteConfirm(true)}
              >
                <Trash2 className="h-4 w-4" />
                Excluir
              </Button>
            ) : (
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
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowDeleteConfirm(false)}
                >
                  Não
                </Button>
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <Button type="button" variant="outline" onClick={() => navigate(`/expenses/${id}`)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={updateMutation.isPending}>
              {updateMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Salvar
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
