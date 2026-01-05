'use client';

import React from 'react';

interface LoadingSkeletonProps {
  count?: number;
  height?: string;
}

export function LoadingSkeleton({
  count = 5,
  height = 'h-4',
}: LoadingSkeletonProps) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, idx) => (
        <div key={idx} className={`${height} bg-gray-200 rounded animate-pulse`} />
      ))}
    </div>
  );
}
