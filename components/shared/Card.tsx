'use client';

import React from 'react';

interface CardProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
  footer?: React.ReactNode;
}

export function Card({
  title,
  children,
  className = '',
  footer,
}: CardProps) {
  return (
    <div className={`bg-white rounded-lg border border-gray-200 shadow-sm ${className}`}>
      {title && (
        <div className="border-b border-gray-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
        </div>
      )}
      <div className="px-6 py-4">{children}</div>
      {footer && (
        <div className="border-t border-gray-200 px-6 py-4 bg-gray-50">
          {footer}
        </div>
      )}
    </div>
  );
}
