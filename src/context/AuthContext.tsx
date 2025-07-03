'use client';
import { SessionProvider, useSession, signIn, signOut } from 'next-auth/react';
import type { AuthenticatedUser } from '@/lib/types';
import React, { createContext, useContext, useMemo, useCallback } from 'react';

interface AuthContextType {
  user: AuthenticatedUser | null;
  isLoading: boolean;
  login: (credentials: Record<string, unknown>) => Promise<any>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderInternalProps {
  children: React.ReactNode;
}

function AuthProviderInternal({ children }: AuthProviderInternalProps) {
  const { data: session, status } = useSession();
  const isLoading = status === 'loading';

  const user = useMemo<AuthenticatedUser | null>(() => {
    if (session?.user) {
      const sessionUser = session.user as any;
      return {
        id: sessionUser.id,
        username: sessionUser.username || sessionUser.name || '',
        name: sessionUser.name || 'User',
        role: sessionUser.role || 'student',
        email: sessionUser.email,
      };
    }
    return null;
  }, [session]);

  const login = useCallback(async (credentials: Record<string, unknown>) => {
    const result = await signIn('credentials', { redirect: false, ...credentials });
    if (result?.error) {
      console.error('[AuthContext] signIn error:', result.error);
    }
    return result;
  }, []);

  const logout = useCallback(() => {
    signOut({ callbackUrl: '/' });
  }, []);

  const value = useMemo(() => ({
    user,
    isLoading,
    login,
    logout,
  }), [user, isLoading, login, logout]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <AuthProviderInternal>{children}</AuthProviderInternal>
    </SessionProvider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
