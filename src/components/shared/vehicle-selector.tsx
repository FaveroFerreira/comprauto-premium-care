import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ChevronDown, Car } from 'lucide-react';
import { vehiclesApi } from '@/lib/api';
import type { Vehicle } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface VehicleData {
  brand: string;
  model: string;
  year: number;
}

interface VehicleSelectorProps {
  value: VehicleData;
  onChange: (data: VehicleData) => void;
  disabled?: boolean;
}

export function VehicleSelector({ value, onChange, disabled }: VehicleSelectorProps) {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const { data: vehicles } = useQuery({
    queryKey: ['vehicles'],
    queryFn: vehiclesApi.list,
  });

  const filteredVehicles = vehicles?.filter((v) => {
    const search = searchTerm.toLowerCase();
    return (
      v.brand.toLowerCase().includes(search) ||
      v.model.toLowerCase().includes(search) ||
      v.year.toString().includes(search)
    );
  });

  const selectVehicle = (vehicle: Vehicle) => {
    onChange({
      brand: vehicle.brand,
      model: vehicle.model,
      year: vehicle.year,
    });
    setOpen(false);
    setSearchTerm('');
  };

  const displayValue = value.brand && value.model
    ? `${value.brand} ${value.model} (${value.year})`
    : '';

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-end gap-2">
          <div className="flex-1 space-y-2">
            <Label>Veículo</Label>
            <Button
              type="button"
              variant="outline"
              className="w-full justify-between font-normal"
              onClick={() => setOpen(true)}
              disabled={disabled}
            >
              {displayValue || 'Selecionar veículo cadastrado...'}
              <ChevronDown className="h-4 w-4 opacity-50" />
            </Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="vehicle_brand">Marca *</Label>
            <Input
              id="vehicle_brand"
              value={value.brand}
              onChange={(e) => onChange({ ...value, brand: e.target.value })}
              placeholder="Ex: Honda"
              disabled={disabled}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="vehicle_model">Modelo *</Label>
            <Input
              id="vehicle_model"
              value={value.model}
              onChange={(e) => onChange({ ...value, model: e.target.value })}
              placeholder="Ex: Civic"
              disabled={disabled}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="vehicle_year">Ano *</Label>
            <Input
              id="vehicle_year"
              type="number"
              min="1900"
              max="2100"
              value={value.year}
              onChange={(e) => onChange({ ...value, year: parseInt(e.target.value) || 0 })}
              disabled={disabled}
            />
          </div>
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Selecionar Veículo</DialogTitle>
          </DialogHeader>

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
                    onClick={() => selectVehicle(vehicle)}
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
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
