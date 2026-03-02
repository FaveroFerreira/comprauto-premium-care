import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { vehiclesApi } from '@/lib/api';
import { Plus, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function VehiclesIndexPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['vehicles'],
    queryFn: vehiclesApi.list,
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Veículos</h1>
        <Link
          to="/vehicles/create"
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          Novo Veículo
        </Link>
      </div>

      <div className="bg-card rounded-lg border overflow-hidden">
        {isLoading ? (
          <div className="p-6 text-center text-muted-foreground">Carregando...</div>
        ) : data?.length === 0 ? (
          <div className="p-6 text-center text-muted-foreground">
            Nenhum veículo encontrado
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left p-3 text-sm font-medium">Marca</th>
                <th className="text-left p-3 text-sm font-medium">Modelo</th>
                <th className="text-left p-3 text-sm font-medium">Ano</th>
                <th className="text-right p-3 text-sm font-medium">Ações</th>
              </tr>
            </thead>
            <tbody>
              {data?.map((vehicle) => (
                <tr key={vehicle.id} className="border-t hover:bg-muted/30">
                  <td className="p-3 font-medium">{vehicle.brand}</td>
                  <td className="p-3">{vehicle.model}</td>
                  <td className="p-3">{vehicle.year}</td>
                  <td className="p-3 text-right">
                    <Button variant="ghost" size="icon" asChild title="Editar">
                      <Link to={`/vehicles/${vehicle.id}/edit`}>
                        <Pencil className="h-4 w-4" />
                      </Link>
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
