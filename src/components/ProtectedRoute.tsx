import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import type { UserRole } from '../types';

export function ProtectedRoute({ roles, children }: { roles?: UserRole[]; children: React.ReactNode }) {
  const { profile, loading, can } = useAuth();
  if (loading) return <div className="p-8 text-center text-slate-400">Loading…</div>;
  if (!profile) return <Navigate to="/login" replace />;
  if (roles && !can(roles)) return <Navigate to="/" replace />;
  return <>{children}</>;
}
