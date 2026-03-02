import { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Loader2, Trash2 } from 'lucide-react';
import { customersApi } from '@/lib/api';
import type { UpdateCustomerInput } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function CustomersEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const { data: customer, isLoading } = useQuery({
    queryKey: ['customer', id],
    queryFn: () => customersApi.get(id!),
    enabled: !!id,
  });

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    cpf_cnpj: '',
    address_street: '',
    address_city: '',
    address_state: '',
    address_zip: '',
  });

  useEffect(() => {
    if (customer) {
      setFormData({
        name: customer.name,
        phone: customer.phone || '',
        email: customer.email || '',
        cpf_cnpj: customer.cpf_cnpj || '',
        address_street: customer.address_street || '',
        address_city: customer.address_city || '',
        address_state: customer.address_state || '',
        address_zip: customer.address_zip || '',
      });
    }
  }, [customer]);

  const updateMutation = useMutation({
    mutationFn: (data: UpdateCustomerInput) => customersApi.update(id!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['customer', id] });
      navigate('/customers');
    },
    onError: (err) => {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar cliente');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => customersApi.delete(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      navigate('/customers');
    },
    onError: (err) => {
      setError(err instanceof Error ? err.message : 'Erro ao excluir cliente');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.name.trim()) {
      setError('O nome é obrigatório');
      return;
    }

    const input: UpdateCustomerInput = {
      name: formData.name.trim(),
    };

    input.phone = formData.phone.trim() || undefined;
    input.email = formData.email.trim() || undefined;
    input.cpf_cnpj = formData.cpf_cnpj.trim() || undefined;
    input.address_street = formData.address_street.trim() || undefined;
    input.address_city = formData.address_city.trim() || undefined;
    input.address_state = formData.address_state.trim() || undefined;
    input.address_zip = formData.address_zip.trim() || undefined;

    updateMutation.mutate(input);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="text-center p-12">
        <p className="text-muted-foreground">Cliente não encontrado</p>
        <Link to="/customers" className="text-primary hover:underline mt-2 inline-block">
          Voltar para lista
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <Link to="/customers" className="p-2 hover:bg-accent rounded-lg">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-2xl font-bold">Editar Cliente</h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-card rounded-lg border p-6 space-y-6">
        {error && (
          <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-lg">
            {error}
          </div>
        )}

        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="name">Nome *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Nome completo"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Telefone</Label>
            <Input
              id="phone"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="(00) 00000-0000"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">E-mail</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="email@exemplo.com"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="cpf_cnpj">CPF/CNPJ</Label>
            <Input
              id="cpf_cnpj"
              value={formData.cpf_cnpj}
              onChange={(e) => setFormData({ ...formData, cpf_cnpj: e.target.value })}
              placeholder="000.000.000-00"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="address_zip">CEP</Label>
            <Input
              id="address_zip"
              value={formData.address_zip}
              onChange={(e) => setFormData({ ...formData, address_zip: e.target.value })}
              placeholder="00000-000"
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="address_street">Endereço</Label>
            <Input
              id="address_street"
              value={formData.address_street}
              onChange={(e) => setFormData({ ...formData, address_street: e.target.value })}
              placeholder="Rua, número, bairro"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="address_city">Cidade</Label>
            <Input
              id="address_city"
              value={formData.address_city}
              onChange={(e) => setFormData({ ...formData, address_city: e.target.value })}
              placeholder="Cidade"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="address_state">Estado</Label>
            <Input
              id="address_state"
              value={formData.address_state}
              onChange={(e) => setFormData({ ...formData, address_state: e.target.value })}
              placeholder="UF"
              maxLength={2}
            />
          </div>
        </div>

        <div className="flex justify-between gap-3 pt-4 border-t">
          <div>
            {!showDeleteConfirm ? (
              <Button type="button" variant="destructive" onClick={() => setShowDeleteConfirm(true)}>
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
                <Button type="button" variant="outline" size="sm" onClick={() => setShowDeleteConfirm(false)}>
                  Não
                </Button>
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <Button type="button" variant="outline" onClick={() => navigate('/customers')}>
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
