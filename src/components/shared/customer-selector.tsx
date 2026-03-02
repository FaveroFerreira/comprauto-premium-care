import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Plus, X, User } from 'lucide-react';
import { customersApi } from '@/lib/api';
import type { Customer, CreateCustomerInput } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface CustomerSelectorProps {
  value: string | null;
  customerName: string;
  onChange: (customerId: string, customerName: string) => void;
  disabled?: boolean;
}

export function CustomerSelector({ value, customerName, onChange, disabled }: CustomerSelectorProps) {
  const [showSearch, setShowSearch] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  const { data: customers } = useQuery({
    queryKey: ['customers', 'search', searchTerm],
    queryFn: () => customersApi.search(searchTerm || ''),
    enabled: showSearch,
  });

  const selectCustomer = (customer: Customer) => {
    onChange(customer.id, customer.name);
    setShowSearch(false);
    setSearchTerm('');
  };

  const clearCustomer = () => {
    onChange('', '');
  };

  return (
    <div className="space-y-2">
      <Label>Cliente *</Label>
      {value && customerName ? (
        <div className="flex items-center gap-2 p-3 border rounded-lg bg-muted/30">
          <User className="h-4 w-4 text-muted-foreground" />
          <span className="flex-1 font-medium">{customerName}</span>
          {!disabled && (
            <div className="flex gap-1">
              <Button type="button" variant="ghost" size="sm" onClick={() => setShowSearch(true)}>
                Alterar
              </Button>
              <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={clearCustomer}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {!showSearch ? (
            <Button
              type="button"
              variant="outline"
              className="w-full justify-start text-muted-foreground"
              onClick={() => setShowSearch(true)}
              disabled={disabled}
            >
              <Search className="h-4 w-4 mr-2" />
              Buscar cliente...
            </Button>
          ) : (
            <div className="border rounded-lg p-4 space-y-3">
              <div className="flex gap-2">
                <Input
                  placeholder="Buscar por nome, telefone ou CPF/CNPJ..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  autoFocus
                />
                <Button type="button" variant="ghost" size="icon" onClick={() => { setShowSearch(false); setSearchTerm(''); }}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="max-h-48 overflow-y-auto space-y-1">
                {customers?.map((customer) => (
                  <button
                    key={customer.id}
                    type="button"
                    className="w-full text-left p-2 hover:bg-accent rounded flex justify-between items-center"
                    onClick={() => selectCustomer(customer)}
                  >
                    <div>
                      <span className="font-medium">{customer.name}</span>
                      {customer.phone && (
                        <span className="text-muted-foreground text-sm ml-2">{customer.phone}</span>
                      )}
                    </div>
                    {customer.cpf_cnpj && (
                      <span className="text-sm text-muted-foreground">{customer.cpf_cnpj}</span>
                    )}
                  </button>
                ))}
                {customers?.length === 0 && (
                  <div className="text-center py-4">
                    <p className="text-sm text-muted-foreground mb-2">Nenhum cliente encontrado</p>
                  </div>
                )}
              </div>
              <div className="pt-2 border-t">
                <Button type="button" variant="outline" size="sm" className="w-full" onClick={() => { setShowSearch(false); setShowCreateDialog(true); }}>
                  <Plus className="h-4 w-4" />
                  Cadastrar Novo Cliente
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      <QuickCustomerDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onCustomerCreated={(customer) => {
          selectCustomer(customer);
          setShowCreateDialog(false);
        }}
        initialName={searchTerm}
      />
    </div>
  );
}

interface QuickCustomerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCustomerCreated: (customer: Customer) => void;
  initialName?: string;
}

function QuickCustomerDialog({ open, onOpenChange, onCustomerCreated, initialName }: QuickCustomerDialogProps) {
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<CreateCustomerInput>({
    name: initialName || '',
    phone: '',
    email: '',
    cpf_cnpj: '',
  });

  const mutation = useMutation({
    mutationFn: (data: CreateCustomerInput) => customersApi.create(data),
    onSuccess: (customer) => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      onCustomerCreated(customer);
      setFormData({ name: '', phone: '', email: '', cpf_cnpj: '' });
      setError(null);
    },
    onError: (err) => {
      setError(err instanceof Error ? err.message : 'Erro ao criar cliente');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setError('O nome é obrigatório');
      return;
    }
    const input: CreateCustomerInput = { name: formData.name.trim() };
    if (formData.phone?.trim()) input.phone = formData.phone.trim();
    if (formData.email?.trim()) input.email = formData.email.trim();
    if (formData.cpf_cnpj?.trim()) input.cpf_cnpj = formData.cpf_cnpj.trim();
    mutation.mutate(input);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Cadastrar Cliente</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-lg">{error}</div>
          )}
          <div className="space-y-2">
            <Label htmlFor="quick-name">Nome *</Label>
            <Input
              id="quick-name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Nome do cliente"
              autoFocus
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="quick-phone">Telefone</Label>
            <Input
              id="quick-phone"
              value={formData.phone || ''}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="(00) 00000-0000"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="quick-cpf">CPF/CNPJ</Label>
            <Input
              id="quick-cpf"
              value={formData.cpf_cnpj || ''}
              onChange={(e) => setFormData({ ...formData, cpf_cnpj: e.target.value })}
              placeholder="000.000.000-00"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              Salvar
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
