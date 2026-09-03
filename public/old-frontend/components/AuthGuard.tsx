"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ScreenLoader } from './screen-loader';
import { getAuthToken } from '@/service/service';
import { validateToken } from '@/lib/actions';

interface AuthGuardProps {
  children: React.ReactNode;
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = await getAuthToken();
        if (!token) {
          router.push('/login');
          return;
        }
        
        await validateToken(token);
        setIsAuthenticated(true);
      } catch (error) {
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        localStorage.removeItem('isLoggedIn');
        document.cookie = 'auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT; SameSite=Strict';
        router.push('/login');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();

    const handleUnauthorized = () => {
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      localStorage.removeItem('isLoggedIn');
      document.cookie = 'auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT; SameSite=Strict';
      router.push('/login');
    };

    window.addEventListener('onSpot:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('onSpot:unauthorized', handleUnauthorized);
  }, [router]);

  if (loading) {
    return <ScreenLoader />;
  }

  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}