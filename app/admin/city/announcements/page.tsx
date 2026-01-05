'use client';

import React, { useEffect, useState } from 'react';
import { DataTable } from '@/components/shared/DataTable';
import { Card } from '@/components/shared/Card';
import { getAnnouncements } from '@/lib/api/endpoints';
import { useRequireAuth } from '@/hooks/useAuth';
import type { Announcement } from '@/types';

export default function AnnouncementsPage() {
  const auth = useRequireAuth();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!auth.isAuthenticated) return;

    const loadAnnouncements = async () => {
      setIsLoading(true);
      const response = await getAnnouncements(auth.user?.cityCode);
      if (response.success && response.data) {
        setAnnouncements(response.data);
      }
      setIsLoading(false);
    };

    loadAnnouncements();
  }, [auth.isAuthenticated, auth.user?.cityCode]);

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Announcements</h1>
        <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
          + New Announcement
        </button>
      </div>

      <Card>
        <DataTable
          columns={[
            { key: 'id', header: 'ID', width: '100px' },
            { key: 'title', header: 'Title' },
            {
              key: 'category',
              header: 'Category',
              width: '120px',
              render: (category) => (
                <span className="px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800">
                  {category}
                </span>
              ),
            },
            {
              key: 'publishedAt',
              header: 'Published',
              width: '150px',
              render: (date) => new Date(date).toLocaleDateString(),
            },
          ]}
          data={announcements}
          isLoading={isLoading}
          emptyState={<p className="text-gray-500">No announcements found</p>}
        />
      </Card>
    </div>
  );
}
