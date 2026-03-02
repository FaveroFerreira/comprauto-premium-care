import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { partsApi } from '@/lib/api';
import type { CreatePartInput, VehicleCompatibility } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { VehicleCompatibilityList } from '@/components/shared/vehicle-compatibility-list';

export default function PartsCreatePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    number: '',
    name: '',
    unit_price: 0,
    unit_type: '',
    is_universal: true,
    vehicle_compatibilities: [] as VehicleCompatibility[],
  });

  const mutation = useMutation({
    mutationFn: (data: CreatePartInput) => partsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['parts'] });
      navigate('/parts');
    },
    onError: (err) => {
      setError(err instanceof Error ? err.message : 'Erro ao criar peça');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.number.trim()) {
      setError('O número da peça é obrigatório');
      return;
    }
    if (!formData.name.trim()) {
      setError('O nome da peça é obrigatório');
      return;
    }
    if (formData.unit_price <= 0) {
      setError('O preço unitário deve ser maior que zero');
      return;
    }

    // Validar compatibilidades se não for universal
    if (!formData.is_universal) {
      const invalidCompat = formData.vehicle_compatibilities.find(c => !c.vehicle_brand.trim());
      if (invalidCompat) {
        setError('Todas as compatibilidades devem ter uma marca informada');
        return;
      }
    }

    const input: CreatePartInput = {
      number: formData.number.trim(),
      name: formData.name.trim(),
      unit_price: formData.unit_price,
      is_universal: formData.is_universal,
    };

    if (formData.unit_type?.trim()) {
      input.unit_type = formData.unit_type.trim();
    }
    if (!formData.is_universal && formData.vehicle_compatibilities.length > 0) {
      input.vehicle_compatibilities = formData.vehicle_compatibilities.filter(c => c.vehicle_brand.trim());
    }

    mutation.mutate(input);
  };

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <Link to="/parts" className="p-2 hover:bg-accent rounded-lg">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-2xl font-bold">Nova Peça</h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-card rounded-lg border p-6 space-y-6">
        {error && (
          <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-lg">
            {error}
          </div>
        )}

        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="number">Número da Peça *</Label>
            <Input
              id="number"
              value={formData.number}
              onChange={(e) => setFormData({ ...formData, number: e.target.value })}
              placeholder="Ex: PEC-001"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Nome *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ex: Filtro de óleo"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="unit_price">Preço de Venda (R$) *</Label>
            <Input
              id="unit_price"
              type="number"
              step="0.01"
              min="0"
              value={formData.unit_price || ''}
              onChange={(e) => setFormData({ ...formData, unit_price: parseFloat(e.target.value) || 0 })}
              placeholder="0,00"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="unit_type">Unidade</Label>
            <Input
              id="unit_type"
              value={formData.unit_type || ''}
              onChange={(e) => setFormData({ ...formData, unit_type: e.target.value })}
              placeholder="Ex: UN, KG, L"
            />
          </div>
        </div>

        <div className="border-t pt-6">
          <h3 className="text-sm font-medium mb-4">Compatibilidade de Veículo</h3>

          <ToggleGroup
            type="single"
            value={formData.is_universal ? 'universal' : 'specific'}
            onValueChange={(value) => {
              if (value) {
                setFormData({
                  ...formData,
                  is_universal: value === 'universal',
                  vehicle_compatibilities: value === 'universal' ? [] : formData.vehicle_compatibilities,
                });
              }
            }}
            className="justify-start"
          >
            <ToggleGroupItem value="universal" className="px-4">
              Universal
            </ToggleGroupItem>
            <ToggleGroupItem value="specific" className="px-4">
              Veículos Específicos
            </ToggleGroupItem>
          </ToggleGroup>

          {formData.is_universal && (
            <p className="text-sm text-muted-foreground mt-3">
              Peça universal - compatível com todos os veículos.
            </p>
          )}

          {!formData.is_universal && (
            <VehicleCompatibilityList
              compatibilities={formData.vehicle_compatibilities}
              onChange={(compatibilities) => setFormData({ ...formData, vehicle_compatibilities: compatibilities })}
            />
          )}
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button type="button" variant="outline" onClick={() => navigate('/parts')}>
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
