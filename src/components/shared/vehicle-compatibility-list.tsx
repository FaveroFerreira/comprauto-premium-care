import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, X, Search, Car, Loader2 } from 'lucide-react';
import { vehiclesApi } from '@/lib/api';
import type { VehicleCompatibility, CreateVehicleInput } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';

interface VehicleCompatibilityListProps {
  compatibilities: VehicleCompatibility[];
  onChange: (compatibilities: VehicleCompatibility[]) => void;
  disabled?: boolean;
}

export function VehicleCompatibilityList({
  compatibilities,
  onChange,
  disabled = false,
}: VehicleCompatibilityListProps) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newVehicle, setNewVehicle] = useState({ brand: '', model: '', year: new Date().getFullYear() });
  const [createError, setCreateError] = useState<string | null>(null);

  const queryClient = useQueryClient();

  const { data: vehicles } = useQuery({
    queryKey: ['vehicles'],
    queryFn: vehiclesApi.list,
  });

  const createMutation = useMutation({
    mutationFn: (input: CreateVehicleInput) => vehiclesApi.create(input),
    onSuccess: (vehicle) => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      onChange([
        ...compatibilities,
        {
          vehicle_brand: vehicle.brand,
          vehicle_model: vehicle.model,
          year_start: vehicle.year,
          year_end: vehicle.year,
        },
      ]);
      setShowCreateForm(false);
      setNewVehicle({ brand: '', model: '', year: new Date().getFullYear() });
      setCreateError(null);
      setPickerOpen(false);
    },
    onError: (err) => {
      setCreateError(err instanceof Error ? err.message : 'Erro ao cadastrar veículo');
    },
  });

  const filteredVehicles = vehicles?.filter((v) => {
    const search = searchTerm.toLowerCase();
    return (
      v.brand.toLowerCase().includes(search) ||
      v.model.toLowerCase().includes(search) ||
      v.year.toString().includes(search)
    );
  });

  const handleAddManual = () => {
    onChange([
      ...compatibilities,
      {
        vehicle_brand: '',
        vehicle_model: '',
        year_start: undefined,
        year_end: undefined,
      },
    ]);
  };

  const handleSelectVehicle = (vehicle: { brand: string; model: string; year: number }) => {
    onChange([
      ...compatibilities,
      {
        vehicle_brand: vehicle.brand,
        vehicle_model: vehicle.model,
        year_start: vehicle.year,
        year_end: vehicle.year,
      },
    ]);
    setPickerOpen(false);
    setSearchTerm('');
  };

  const handleRemove = (index: number) => {
    onChange(compatibilities.filter((_, i) => i !== index));
  };

  const handleChange = (index: number, field: keyof VehicleCompatibility, value: string | number | undefined) => {
    const updated = [...compatibilities];
    updated[index] = {
      ...updated[index],
      [field]: value,
    };
    onChange(updated);
  };

  const handleCreateVehicle = () => {
    setCreateError(null);
    if (!newVehicle.brand.trim()) {
      setCreateError('A marca é obrigatória');
      return;
    }
    if (!newVehicle.model.trim()) {
      setCreateError('O modelo é obrigatório');
      return;
    }
    createMutation.mutate({
      brand: newVehicle.brand.trim(),
      model: newVehicle.model.trim(),
      year: newVehicle.year,
    });
  };

  return (
    <div className="space-y-3 mt-4">
      {compatibilities.length > 0 && (
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left p-2 font-medium">Marca *</th>
                <th className="text-left p-2 font-medium">Modelo</th>
                <th className="text-left p-2 font-medium w-24">Ano Início</th>
                <th className="text-left p-2 font-medium w-24">Ano Fim</th>
                <th className="w-10"></th>
              </tr>
            </thead>
            <tbody>
              {compatibilities.map((compat, index) => (
                <tr key={index} className="border-t">
                  <td className="p-2">
                    <Input
                      value={compat.vehicle_brand}
                      onChange={(e) => handleChange(index, 'vehicle_brand', e.target.value)}
                      placeholder="Ex: Honda"
                      disabled={disabled}
                      className="h-8"
                    />
                  </td>
                  <td className="p-2">
                    <Input
                      value={compat.vehicle_model || ''}
                      onChange={(e) => handleChange(index, 'vehicle_model', e.target.value || undefined)}
                      placeholder="Ex: Civic"
                      disabled={disabled}
                      className="h-8"
                    />
                  </td>
                  <td className="p-2">
                    <Input
                      type="number"
                      value={compat.year_start || ''}
                      onChange={(e) => handleChange(index, 'year_start', e.target.value ? parseInt(e.target.value) : undefined)}
                      placeholder="2006"
                      min="1900"
                      max="2100"
                      disabled={disabled}
                      className="h-8"
                    />
                  </td>
                  <td className="p-2">
                    <Input
                      type="number"
                      value={compat.year_end || ''}
                      onChange={(e) => handleChange(index, 'year_end', e.target.value ? parseInt(e.target.value) : undefined)}
                      placeholder="2012"
                      min="1900"
                      max="2100"
                      disabled={disabled}
                      className="h-8"
                    />
                  </td>
                  <td className="p-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemove(index)}
                      disabled={disabled}
                      className="h-8 w-8 text-destructive hover:text-destructive"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setPickerOpen(true)}
          disabled={disabled}
          className="flex-1"
        >
          <Search className="h-4 w-4 mr-2" />
          Selecionar Veículo Cadastrado
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleAddManual}
          disabled={disabled}
          className="flex-1"
        >
          <Plus className="h-4 w-4 mr-2" />
          Digitar Manualmente
        </Button>
      </div>

      {compatibilities.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-2">
          Nenhum veículo adicionado.
        </p>
      )}

      <Dialog open={pickerOpen} onOpenChange={(open) => {
        setPickerOpen(open);
        if (!open) {
          setShowCreateForm(false);
          setSearchTerm('');
          setCreateError(null);
        }
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Selecionar Veículo</DialogTitle>
          </DialogHeader>

          {!showCreateForm ? (
            <div className="space-y-4">
              <Input
                placeholder="Buscar por marca, modelo ou ano..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                autoFocus
              />

              <div className="max-h-64 overflow-y-auto space-y-1">
                {filteredVehicles && filteredVehicles.length > 0 ? (
                  filteredVehicles.map((vehicle) => (
                    <button
                      key={vehicle.id}
                      type="button"
                      className="w-full text-left p-3 hover:bg-accent rounded-lg flex items-center gap-3 transition-colors"
                      onClick={() => handleSelectVehicle(vehicle)}
                    >
                      <Car className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">
                          {vehicle.brand} {vehicle.model}
                        </p>
                        <p className="text-sm text-muted-foreground">Ano: {vehicle.year}</p>
                      </div>
                    </button>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    {vehicles?.length === 0
                      ? 'Nenhum veículo cadastrado'
                      : 'Nenhum veículo encontrado'}
                  </p>
                )}
              </div>

              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => setShowCreateForm(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Cadastrar Novo Veículo
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {createError && (
                <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-lg">
                  {createError}
                </div>
              )}

              <div className="space-y-2">
                <Label>Marca *</Label>
                <Input
                  value={newVehicle.brand}
                  onChange={(e) => setNewVehicle({ ...newVehicle, brand: e.target.value })}
                  placeholder="Ex: Honda"
                  autoFocus
                />
              </div>

              <div className="space-y-2">
                <Label>Modelo *</Label>
                <Input
                  value={newVehicle.model}
                  onChange={(e) => setNewVehicle({ ...newVehicle, model: e.target.value })}
                  placeholder="Ex: Civic"
                />
              </div>

              <div className="space-y-2">
                <Label>Ano *</Label>
                <Input
                  type="number"
                  min="1900"
                  max="2100"
                  value={newVehicle.year}
                  onChange={(e) => setNewVehicle({ ...newVehicle, year: parseInt(e.target.value) || 0 })}
                />
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => {
                  setShowCreateForm(false);
                  setCreateError(null);
                }}>
                  Voltar
                </Button>
                <Button type="button" onClick={handleCreateVehicle} disabled={createMutation.isPending}>
                  {createMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                  Cadastrar e Adicionar
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
