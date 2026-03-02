import { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Loader2, Trash2 } from 'lucide-react';
import { vehiclesApi } from '@/lib/api';
import type { UpdateVehicleInput } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function VehiclesEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const { data: vehicle, isLoading } = useQuery({
    queryKey: ['vehicles', id],
    queryFn: () => vehiclesApi.get(id!),
    enabled: !!id,
  });

  const [formData, setFormData] = useState<UpdateVehicleInput>({
    brand: '',
    model: '',
    year: 0,
  });

  useEffect(() => {
    if (vehicle) {
      setFormData({
        brand: vehicle.brand,
        model: vehicle.model,
        year: vehicle.year,
      });
    }
  }, [vehicle]);

  const updateMutation = useMutation({
    mutationFn: (data: UpdateVehicleInput) => vehiclesApi.update(id!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      navigate('/vehicles');
    },
    onError: (err) => {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar veículo');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => vehiclesApi.delete(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      navigate('/vehicles');
    },
    onError: (err) => {
      setError(err instanceof Error ? err.message : 'Erro ao excluir veículo');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.brand?.trim()) {
      setError('A marca é obrigatória');
      return;
    }
    if (!formData.model?.trim()) {
      setError('O modelo é obrigatório');
      return;
    }
    if (!formData.year || formData.year < 1900 || formData.year > 2100) {
      setError('O ano deve estar entre 1900 e 2100');
      return;
    }

    updateMutation.mutate({
      brand: formData.brand.trim(),
      model: formData.model.trim(),
      year: formData.year,
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!vehicle) {
    return (
      <div className="text-center p-12">
        <p className="text-muted-foreground">Veículo não encontrado</p>
        <Link to="/vehicles" className="text-primary hover:underline mt-2 inline-block">
          Voltar para lista
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <Link to="/vehicles" className="p-2 hover:bg-accent rounded-lg">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-2xl font-bold">Editar Veículo</h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-card rounded-lg border p-6 space-y-6">
        {error && (
          <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-lg">
            {error}
          </div>
        )}

        <div className="grid gap-6 md:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="brand">Marca *</Label>
            <Input
              id="brand"
              value={formData.brand || ''}
              onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
              placeholder="Ex: Honda"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="model">Modelo *</Label>
            <Input
              id="model"
              value={formData.model || ''}
              onChange={(e) => setFormData({ ...formData, model: e.target.value })}
              placeholder="Ex: Civic"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="year">Ano *</Label>
            <Input
              id="year"
              type="number"
              min="1900"
              max="2100"
              value={formData.year || ''}
              onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) || 0 })}
              placeholder="Ex: 2020"
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
            <Button type="button" variant="outline" onClick={() => navigate('/vehicles')}>
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
