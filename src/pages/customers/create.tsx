import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { customersApi } from '@/lib/api';
import type { CreateCustomerInput } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function CustomersCreatePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<CreateCustomerInput>({
    name: '',
    phone: '',
    email: '',
    cpf_cnpj: '',
    address_street: '',
    address_city: '',
    address_state: '',
    address_zip: '',
  });

  const mutation = useMutation({
    mutationFn: (data: CreateCustomerInput) => customersApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      navigate('/customers');
    },
    onError: (err) => {
      setError(err instanceof Error ? err.message : 'Erro ao criar cliente');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.name.trim()) {
      setError('O nome é obrigatório');
      return;
    }

    const input: CreateCustomerInput = {
      name: formData.name.trim(),
    };

    if (formData.phone?.trim()) input.phone = formData.phone.trim();
    if (formData.email?.trim()) input.email = formData.email.trim();
    if (formData.cpf_cnpj?.trim()) input.cpf_cnpj = formData.cpf_cnpj.trim();
    if (formData.address_street?.trim()) input.address_street = formData.address_street.trim();
    if (formData.address_city?.trim()) input.address_city = formData.address_city.trim();
    if (formData.address_state?.trim()) input.address_state = formData.address_state.trim();
    if (formData.address_zip?.trim()) input.address_zip = formData.address_zip.trim();

    mutation.mutate(input);
  };

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <Link to="/customers" className="p-2 hover:bg-accent rounded-lg">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-2xl font-bold">Novo Cliente</h1>
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
              value={formData.phone || ''}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="(00) 00000-0000"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">E-mail</Label>
            <Input
              id="email"
              type="email"
              value={formData.email || ''}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="email@exemplo.com"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="cpf_cnpj">CPF/CNPJ</Label>
            <Input
              id="cpf_cnpj"
              value={formData.cpf_cnpj || ''}
              onChange={(e) => setFormData({ ...formData, cpf_cnpj: e.target.value })}
              placeholder="000.000.000-00"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="address_zip">CEP</Label>
            <Input
              id="address_zip"
              value={formData.address_zip || ''}
              onChange={(e) => setFormData({ ...formData, address_zip: e.target.value })}
              placeholder="00000-000"
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="address_street">Endereço</Label>
            <Input
              id="address_street"
              value={formData.address_street || ''}
              onChange={(e) => setFormData({ ...formData, address_street: e.target.value })}
              placeholder="Rua, número, bairro"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="address_city">Cidade</Label>
            <Input
              id="address_city"
              value={formData.address_city || ''}
              onChange={(e) => setFormData({ ...formData, address_city: e.target.value })}
              placeholder="Cidade"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="address_state">Estado</Label>
            <Input
              id="address_state"
              value={formData.address_state || ''}
              onChange={(e) => setFormData({ ...formData, address_state: e.target.value })}
              placeholder="UF"
              maxLength={2}
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button type="button" variant="outline" onClick={() => navigate('/customers')}>
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
