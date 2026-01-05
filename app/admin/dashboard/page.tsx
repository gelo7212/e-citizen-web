'use client';

import React, { useEffect, useState } from 'react';
import { KPIGrid } from '@/components/shared/KPIGrid';
import { Card } from '@/components/shared/Card';
import { LoadingSkeleton } from '@/components/shared/LoadingSkeleton';
import { getDashboardKPIs } from '@/lib/api/endpoints';
import { useRequireAuth } from '@/hooks/useAuth';
import { useScopes } from '@/hooks/useScopes';
import type { DashboardKPI } from '@/types';

export default function AdminDashboard() {
  const auth = useRequireAuth();
  const scopes = useScopes();
  const [kpis, setKpis] = useState<DashboardKPI | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!auth.isAuthenticated) return;

    const loadKPIs = async () => {
      setIsLoading(true);
      const response = await getDashboardKPIs(auth.user?.cityCode);
      if (response.success && response.data) {
        setKpis(response.data);
      }
      setIsLoading(false);
    };

    loadKPIs();
  }, [auth.isAuthenticated, auth.user?.cityCode]);

  if (!scopes.canAccessAdmin) {
    return (
      <div className="p-6">
        <p className="text-red-600">Access denied. Admin access required.</p>
      </div>
    );
  }

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Dashboard</h1>

      {isLoading ? (
        <LoadingSkeleton count={4} height="h-20" />
      ) : kpis ? (
        <KPIGrid
          items={[
            {
              label: 'Open Reports',
              value: kpis.openReports,
              trend: 'down',
              trendValue: '2.5%',
            },
            {
              label: 'Resolved Reports',
              value: kpis.resolvedReports,
              trend: 'up',
              trendValue: '5.2%',
            },
            {
              label: 'Active SOS',
              value: kpis.activeSos,
            },
            {
              label: 'Avg Response Time',
              value: `${kpis.avgResponseTimeMinutes}m`,
              trend: 'down',
              trendValue: '1.2m',
            },
          ]}
        />
      ) : (
        <div className="text-gray-500">Failed to load KPIs</div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        <Card title="Recent Activity">
          <p className="text-gray-600">Coming soon...</p>
        </Card>

        <Card title="Quick Actions">
          <div className="space-y-2">
            <button className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700">
              Create Report
            </button>
            <button className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700">
              Create Announcement
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
}
