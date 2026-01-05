'use client';

import React from 'react';

interface KPIGridProps {
  items: Array<{
    label: string;
    value: string | number;
    trend?: 'up' | 'down';
    trendValue?: string;
  }>;
}

export function KPIGrid({ items }: KPIGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {items.map((item, idx) => (
        <div
          key={idx}
          className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm"
        >
          <p className="text-gray-600 text-sm font-medium">{item.label}</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{item.value}</p>
          {item.trend && (
            <p
              className={`text-sm mt-2 ${
                item.trend === 'up' ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {item.trend === 'up' ? '↑' : '↓'} {item.trendValue}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}
