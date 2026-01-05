'use client';

import React, { useEffect, useState } from 'react';
import { DataTable } from '@/components/shared/DataTable';
import { Card } from '@/components/shared/Card';
import { getAssignedSos } from '@/lib/api/endpoints';
import { useRequireAuth } from '@/hooks/useAuth';
import type { SosEvent } from '@/types';

export default function RescuerActivePage() {
  const auth = useRequireAuth();
  const [sosEvents, setSosEvents] = useState<SosEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!auth.isAuthenticated) return;

    const loadAssignedSos = async () => {
      setIsLoading(true);
      const response = await getAssignedSos();
      if (response.success && response.data) {
        setSosEvents(response.data);
      }
      setIsLoading(false);
    };

    loadAssignedSos();
    const interval = setInterval(loadAssignedSos, 3000);
    return () => clearInterval(interval);
  }, [auth.isAuthenticated]);

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Active SOS</h1>

      <Card>
        <DataTable
          columns={[
            { key: 'id', header: 'ID', width: '100px' },
            { key: 'callerId', header: 'Caller', width: '150px' },
            {
              key: 'status',
              header: 'Status',
              width: '150px',
              render: (status) => (
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    status === 'pending'
                      ? 'bg-yellow-100 text-yellow-800'
                      : status === 'arrived'
                      ? 'bg-blue-100 text-blue-800'
                      : status === 'assisting'
                      ? 'bg-orange-100 text-orange-800'
                      : 'bg-green-100 text-green-800'
                  }`}
                >
                  {status}
                </span>
              ),
            },
            {
              key: 'priority',
              header: 'Priority',
              width: '100px',
              render: (priority) => (
                <span
                  className={`font-semibold ${
                    priority === 'critical'
                      ? 'text-red-600'
                      : priority === 'high'
                      ? 'text-orange-600'
                      : 'text-green-600'
                  }`}
                >
                  {priority}
                </span>
              ),
            },
          ]}
          data={sosEvents}
          isLoading={isLoading}
          emptyState={<p className="text-gray-500">No assigned SOS</p>}
        />
      </Card>
    </div>
  );
}
