'use client';

import React from 'react';
import { Card } from '@/components/shared/Card';

export default function RescueHome() {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Rescue Operations Portal</h1>
      <Card>
        <p className="text-gray-600 mb-6">
          Welcome to the rescue operations center. Use the navigation above to view:
        </p>
        <ul className="list-disc list-inside space-y-2 text-gray-600">
          <li>Active SOS assignments</li>
          <li>Live map of SOS locations</li>
          <li>Historical records</li>
        </ul>
      </Card>
    </div>
  );
}
