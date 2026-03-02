import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { vehiclesApi } from '@/lib/api';
import type { CreateVehicleInput } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function VehiclesCreatePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<CreateVehicleInput>({
    brand: '',
    model: '',
    year: new Date().getFullYear(),
  });

  const mutation = useMutation({
    mutationFn: (data: CreateVehicleInput) => vehiclesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      navigate('/vehicles');
    },
    onError: (err) => {
      setError(err instanceof Error ? err.message : 'Erro ao criar veículo');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.brand.trim()) {
      setError('A marca é obrigatória');
      return;
    }
    if (!formData.model.trim()) {
      setError('O modelo é obrigatório');
      return;
    }
    if (!formData.year || formData.year < 1900 || formData.year > 2100) {
      setError('O ano deve estar entre 1900 e 2100');
      return;
    }

    mutation.mutate({
      brand: formData.brand.trim(),
      model: formData.model.trim(),
      year: formData.year,
    });
  };

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <Link to="/vehicles" className="p-2 hover:bg-accent rounded-lg">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-2xl font-bold">Novo Veículo</h1>
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
              value={formData.brand}
              onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
              placeholder="Ex: Honda"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="model">Modelo *</Label>
            <Input
              id="model"
              value={formData.model}
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
              value={formData.year}
              onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) || 0 })}
              placeholder="Ex: 2020"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button type="button" variant="outline" onClick={() => navigate('/vehicles')}>
            Cancelar
          </Button>
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Salvar
          </Button>
        </div>
      </form>
    </div>
  );
}
