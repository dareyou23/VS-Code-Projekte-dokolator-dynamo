'use client';

import { useRouter } from 'next/navigation';
import { apiClient } from './api';

export function useAuth() {
  const router = useRouter();
  
  const currentUser = apiClient.getCurrentUser();
  const isAuthenticated = apiClient.isAuthenticated();

  const logout = () => {
    apiClient.logout();
    router.push('/login');
  };

  return {
    currentUser,
    isAuthenticated,
    isLoading: false,
    logout,
  };
}
