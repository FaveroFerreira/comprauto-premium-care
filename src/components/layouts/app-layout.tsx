import { Outlet, Link, useLocation } from 'react-router-dom';
import {
  ClipboardList,
  FileText,
  Home,
  Package,
  Car,
  Receipt,
  Menu,
  BarChart3,
  Users,
} from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import logoWhite from '@/assets/logo-white.png';
import iconWhite from '@/assets/icon-white.png';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: Home },
  { name: 'Ordens de Serviço', href: '/service-orders', icon: ClipboardList },
  { name: 'Orçamentos', href: '/quotes', icon: FileText },
  { name: 'Clientes', href: '/customers', icon: Users },
  { name: 'Peças', href: '/parts', icon: Package },
  { name: 'Veículos', href: '/vehicles', icon: Car },
  { name: 'Despesas', href: '/expenses', icon: Receipt },
  { name: 'Relatórios', href: '/reports', icon: BarChart3 },
];

export function AppLayout() {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-64 transform bg-card border-r transition-transform duration-200 ease-in-out lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex h-16 items-center gap-2 border-b px-4">
          <img src={logoWhite} alt="Comprauto Premium Care" className="h-8" />
        </div>
        <nav className="flex-1 space-y-1 p-4">
          {navigation.map((item) => {
            const isActive = location.pathname.startsWith(item.href);
            return (
              <Link
                key={item.name}
                to={item.href}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                )}
              >
                <item.icon className="h-5 w-5" />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Mobile header */}
        <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background px-4 lg:hidden">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 -ml-2 hover:bg-accent rounded-lg"
          >
            <Menu className="h-6 w-6" />
          </button>
          <img src={iconWhite} alt="Comprauto Premium Care" className="h-8" />
        </header>

        {/* Page content */}
        <main className="p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
