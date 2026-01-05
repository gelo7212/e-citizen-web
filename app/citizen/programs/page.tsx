'use client';

import React, { useEffect, useState } from 'react';
import { Card } from '@/components/shared/Card';
import { getPrograms } from '@/lib/api/endpoints';
import type { YouthProgram } from '@/types';

export default function ProgramsPage() {
  const [programs, setPrograms] = useState<YouthProgram[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadPrograms = async () => {
      setIsLoading(true);
      const response = await getPrograms();
      if (response.success && response.data) {
        setPrograms(response.data);
      }
      setIsLoading(false);
    };

    loadPrograms();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">Programs & Events</h1>

        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-gray-600">Loading programs...</p>
          </div>
        ) : programs.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600">No programs available</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {programs.map((program) => (
              <Card key={program.id} className="flex flex-col">
                <h3 className="text-lg font-bold text-gray-900">
                  {program.name}
                </h3>
                <p className="text-gray-600 text-sm mt-2">
                  {program.description}
                </p>
                <div className="mt-4 space-y-2 text-sm text-gray-600">
                  <p>📍 {program.location}</p>
                  <p>
                    📅{' '}
                    {new Date(program.startDate).toLocaleDateString()}
                  </p>
                  <p>
                    👥 {program.participants} / {program.maxParticipants}
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-gray-200">
                  <button className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700">
                    Join Program
                  </button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
