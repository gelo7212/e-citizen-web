'use client';

import React from 'react';

interface StepContainerProps {
  title: string;
  description: string;
  children: React.ReactNode;
}

export default function StepContainer({ title, description, children }: StepContainerProps) {
  return (
    <div className="bg-white rounded-lg shadow-md p-8 max-w-2xl mx-auto">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">{title}</h2>
        <p className="text-gray-600">{description}</p>
      </div>

      {children}
    </div>
  );
}
