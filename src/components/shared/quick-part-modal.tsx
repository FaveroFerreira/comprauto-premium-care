import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { partsApi } from '@/lib/api';
import type { CreatePartInput, Part, VehicleCompatibility } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { VehicleCompatibilityList } from '@/components/shared/vehicle-compatibility-list';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';

interface QuickPartModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPartCreated: (part: Part) => void;
  initialName?: string;
}

export function QuickPartModal({ open, onOpenChange, onPartCreated, initialName = '' }: QuickPartModalProps) {
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    number: '',
    name: initialName,
    unit_price: 0,
    unit_type: 'UN',
    is_universal: true,
    vehicle_compatibilities: [] as VehicleCompatibility[],
  });

  const mutation = useMutation({
    mutationFn: (data: CreatePartInput) => partsApi.create(data),
    onSuccess: (part) => {
      queryClient.invalidateQueries({ queryKey: ['parts'] });
      onPartCreated(part);
      onOpenChange(false);
      setFormData({ number: '', name: '', unit_price: 0, unit_type: 'UN', is_universal: true, vehicle_compatibilities: [] });
      setError(null);
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
      unit_type: formData.unit_type?.trim() || 'UN',
      is_universal: formData.is_universal,
    };

    if (!formData.is_universal && formData.vehicle_compatibilities.length > 0) {
      input.vehicle_compatibilities = formData.vehicle_compatibilities.filter(c => c.vehicle_brand.trim());
    }

    mutation.mutate(input);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Cadastrar Nova Peça</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-lg">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="quick-part-number">Número da Peça *</Label>
            <Input
              id="quick-part-number"
              value={formData.number}
              onChange={(e) => setFormData({ ...formData, number: e.target.value })}
              placeholder="Ex: PEC-001"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="quick-part-name">Nome *</Label>
            <Input
              id="quick-part-name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ex: Filtro de óleo"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="quick-part-price">Preço de Venda (R$) *</Label>
            <Input
              id="quick-part-price"
              type="number"
              step="0.01"
              min="0"
              value={formData.unit_price || ''}
              onChange={(e) => setFormData({ ...formData, unit_price: parseFloat(e.target.value) || 0 })}
              placeholder="0,00"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="quick-part-unit">Unidade</Label>
            <Input
              id="quick-part-unit"
              value={formData.unit_type || ''}
              onChange={(e) => setFormData({ ...formData, unit_type: e.target.value })}
              placeholder="UN"
            />
          </div>

          <div className="border-t pt-4">
            <h3 className="text-sm font-medium mb-3">Compatibilidade de Veículo</h3>

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

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Salvar Peça
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
