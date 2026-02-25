'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/useAuth';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: Array<'admin' | 'user'>;
  requireAuth?: boolean;
}

export default function ProtectedRoute({ 
  children, 
  allowedRoles, 
  requireAuth = true 
}: ProtectedRouteProps) {
  const { isAuthenticated, currentUser, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    if (requireAuth && !isAuthenticated) {
      router.push('/login');
      return;
    }

    if (allowedRoles && currentUser && !allowedRoles.includes(currentUser.rolle)) {
      router.push('/unauthorized');
      return;
    }
  }, [isAuthenticated, currentUser, isLoading, requireAuth, allowedRoles, router]);

  if (isLoading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontSize: '20px', color: '#666' }}>Lade...</div>
      </div>
    );
  }

  if (requireAuth && !isAuthenticated) {
    return null;
  }

  if (allowedRoles && currentUser && !allowedRoles.includes(currentUser.rolle)) {
    return null;
  }

  return <>{children}</>;
}
