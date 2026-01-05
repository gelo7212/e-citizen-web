'use client';

import React from 'react';
import { Card } from '@/components/shared/Card';

export default function AdminDashboardDefault() {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Select a section</h1>
      <Card>
        <p className="text-gray-600">
          Use the sidebar to navigate to specific admin sections.
        </p>
      </Card>
    </div>
  );
}
