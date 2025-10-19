'use client';
import { SessionProvider, useSession, signIn, signOut } from 'next-auth/react';
import type { AuthenticatedUser } from '@/lib/types';
import React, { createContext, useContext, useMemo, useCallback, useState, useEffect } from 'react';

interface AuthContextType {
  user: AuthenticatedUser | null;
  isLoading: boolean;
  login: (credentials: Record<string, unknown>) => Promise<any>;
  logout: () => void;
  setAvatar?: (url: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderInternalProps {
  children: React.ReactNode;
}

function AuthProviderInternal({ children }: AuthProviderInternalProps) {
  const { data: session, status } = useSession();
  const isLoading = status === 'loading';

  // State to manage avatar URL
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>(undefined);

  const user = useMemo<AuthenticatedUser | null>(() => {
    if (session?.user) {
      const sessionUser = session.user as any;
      return {
        id: sessionUser.id,
        username: sessionUser.username || sessionUser.name || '',
        name: sessionUser.name || 'User',
        role: sessionUser.role || 'student',
        email: sessionUser.email,
        avatarUrl: avatarUrl || sessionUser.image, // Use state avatar first
      };
    }
    return null;
  }, [session, avatarUrl]);
  
  // Effect to set initial avatar from session if not already set
  useEffect(() => {
    if (session?.user?.image && !avatarUrl) {
      setAvatarUrl(session.user.image);
    }
  }, [session, avatarUrl]);


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
    setAvatar: setAvatarUrl,
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
