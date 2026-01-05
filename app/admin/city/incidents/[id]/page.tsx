'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { IncidentDetail } from '@/components/admin/incidents/IncidentDetail';

interface IncidentPageProps {
  params: {
    id: string;
  };
}

export default function IncidentPage({ params }: IncidentPageProps) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="p-8 admin-page">
        <div className="flex items-center justify-center min-h-screen">
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user?.cityCode) {
    return <div className="text-red-600">City code not found</div>;
  }

  return (
    <div className="p-8 admin-page">
      <Link href="/admin/city/incidents" className="text-blue-600 hover:text-blue-800 mb-4 inline-block">
        ← Back to Incidents
      </Link>

      <IncidentDetail incidentId={params.id} cityCode={user.cityCode} />
    </div>
  );
}
