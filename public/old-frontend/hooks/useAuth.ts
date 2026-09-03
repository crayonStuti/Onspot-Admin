'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getAuthToken } from '@/service/service';
import { validateToken } from '@/lib/actions';

export const useAuth = () => {
  const [isValidating, setIsValidating] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = await getAuthToken();
        if (!token) {
          router.push('/auth/login');
          return;
        }
        
        await validateToken(token);
        setIsValidating(false);
      } catch (error) {
        localStorage.removeItem('authToken');
        router.push('/auth/login');
      }
    };

    checkAuth();
  }, [router]);

  return { isValidating };
};
