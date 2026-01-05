'use client';

import React from 'react';
import { Card } from '@/components/shared/Card';
import { LoadingSkeleton } from '@/components/shared/LoadingSkeleton';
import { useRequireAuth } from '@/hooks/useAuth';

export default function RescueHistoryPage() {
  const auth = useRequireAuth();
  const [isLoading] = React.useState(false);

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">SOS History</h1>

      <Card>
        {isLoading ? (
          <LoadingSkeleton count={5} height="h-16" />
        ) : (
          <p className="text-gray-600">Historical SOS records coming soon.</p>
        )}
      </Card>
    </div>
  );
}
