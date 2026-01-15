import { Outlet, Navigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth';

export function AuthLayout() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">
        <Outlet />
      </div>
    </div>
  );
}
