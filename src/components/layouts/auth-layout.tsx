import { Outlet, Navigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth';
import logoWhite from '@/assets/logo-white.svg';

export function AuthLayout() {
  const { isAuthenticated } = useAuthStore();

  // Redirect to dashboard if already authenticated
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/50 p-4">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center gap-2 mb-8">
          <img src={logoWhite} alt="Rech Performance" className="h-20" />
        </div>
        <div className="bg-card rounded-lg border shadow-sm p-6">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
