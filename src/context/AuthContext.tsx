import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { supabase } from '../lib/supabaseClient';
import type { Profile, UserRole } from '../types';

interface AuthState {
  profile: Profile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  can: (roles: UserRole[]) => boolean;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

// Central permission matrix — extend as new modules are added
export const PERMISSIONS = {
  manageEmployees: ['admin', 'hr_manager'] as UserRole[],
  viewAllEmployees: ['admin', 'hr_manager', 'production_manager'] as UserRole[],
  enterAttendance: ['admin', 'hr_manager', 'production_manager', 'supervisor'] as UserRole[],
  enterEvaluation: ['admin', 'hr_manager', 'production_manager'] as UserRole[],
  viewManagementDashboard: ['admin', 'hr_manager', 'production_manager'] as UserRole[],
  manageUsers: ['admin'] as UserRole[],
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  async function loadProfile(userId: string) {
    const { data } = await supabase.from('profiles').select('*').eq('id', userId).single();
    setProfile(data as Profile | null);
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session?.user) loadProfile(data.session.user.id);
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) loadProfile(session.user.id);
      else setProfile(null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  async function signIn(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message ?? null };
  }

  async function signOut() {
    await supabase.auth.signOut();
    setProfile(null);
  }

  function can(roles: UserRole[]) {
    return !!profile && roles.includes(profile.role);
  }

  return (
    <AuthContext.Provider value={{ profile, loading, signIn, signOut, can }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
