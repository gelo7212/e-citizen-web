'use client';

import React, { ReactNode } from 'react';

interface TableProps {
  columns: Array<{
    key: string;
    header: string;
    width?: string;
    render?: (value: any, row: any) => ReactNode;
  }>;
  data: any[];
  onRowClick?: (row: any) => void;
  isLoading?: boolean;
  emptyState?: ReactNode;
}

export function DataTable({
  columns,
  data,
  onRowClick,
  isLoading,
  emptyState,
}: TableProps) {
  if (isLoading) {
    return (
      <div className="w-full h-40 flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="w-full h-40 flex items-center justify-center">
        {emptyState || <div className="text-gray-500">No data available</div>}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-gray-100 border-b border-gray-300">
            {columns.map((col) => (
              <th
                key={col.key}
                className="px-4 py-3 text-left font-semibold text-gray-700"
                style={{ width: col.width }}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, idx) => (
            <tr
              key={idx}
              className="border-b border-gray-200 hover:bg-gray-50 cursor-pointer"
              onClick={() => onRowClick?.(row)}
            >
              {columns.map((col) => (
                <td key={`${idx}-${col.key}`} className="px-4 py-3 text-gray-800">
                  {col.render ? col.render(row[col.key], row) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
