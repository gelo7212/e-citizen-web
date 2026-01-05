'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { getCityByCode } from '@/lib/api/setupEndpoints';
import { LoadingSkeleton } from '@/components/shared/LoadingSkeleton';
import { Alert } from '@/components/shared/Alert';

export default function SetupCheckPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    const checkAndRoute = async () => {
      // Wait for auth to load
      if (isLoading) {
        return;
      }

      // Redirect if not city admin
      if (!user || user.role.toUpperCase() !== 'CITY_ADMIN') {
        router.push('/admin/login');
        return;
      }

      try {
        // Try to get city by code from JWT
        if (user.cityCode) {
          const res = await getCityByCode(user.cityCode);

          if (res.success && res.data) {
            // City exists, go to setup wizard
            router.push('/admin/setup');
          } else {
            // City doesn't exist, go to create city
            router.push('/admin/setup/create-city');
          }
        } else {
          // No city code in JWT
          router.push('/admin/setup/create-city');
        }
      } catch (err) {
        console.error('Error checking city:', err);
        router.push('/admin/setup/create-city');
      }
    };

    checkAndRoute();
  }, [isLoading, user, router]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <LoadingSkeleton />
    </div>
  );
}
