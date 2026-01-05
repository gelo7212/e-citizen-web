'use client';

import React, { useEffect, useState } from 'react';
import { DataTable } from '@/components/shared/DataTable';
import { Card } from '@/components/shared/Card';
import { getReports } from '@/lib/api/endpoints';
import { useRequireAuth } from '@/hooks/useAuth';
import type { Report } from '@/types';

export default function ReportsPage() {
  const auth = useRequireAuth();
  const [reports, setReports] = useState<Report[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!auth.isAuthenticated) return;

    const loadReports = async () => {
      setIsLoading(true);
      const response = await getReports({ cityId: auth.user?.cityCode });
      if (response.success && response.data) {
        setReports(response.data);
      }
      setIsLoading(false);
    };

    loadReports();
  }, [auth.isAuthenticated, auth.user?.cityCode]);

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">City Reports</h1>
        <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
          + New Report
        </button>
      </div>

      <Card>
        <DataTable
          columns={[
            { key: 'id', header: 'ID', width: '100px' },
            { key: 'title', header: 'Title' },
            { key: 'category', header: 'Category', width: '150px' },
            {
              key: 'status',
              header: 'Status',
              width: '120px',
              render: (status) => (
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    status === 'open'
                      ? 'bg-red-100 text-red-800'
                      : status === 'in-progress'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-green-100 text-green-800'
                  }`}
                >
                  {status}
                </span>
              ),
            },
            { key: 'priority', header: 'Priority', width: '120px' },
            {
              key: 'createdAt',
              header: 'Created',
              width: '150px',
              render: (date) => new Date(date).toLocaleDateString(),
            },
          ]}
          data={reports}
          isLoading={isLoading}
          emptyState={<p className="text-gray-500">No reports found</p>}
        />
      </Card>
    </div>
  );
}
