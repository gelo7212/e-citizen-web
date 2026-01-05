'use client';

import React from 'react';

interface SetupProgressProps {
  currentStep: number;
  totalSteps: number;
}

export default function SetupProgress({ currentStep, totalSteps }: SetupProgressProps) {
  const steps = [
    { num: 1, label: 'City Profile' },
    { num: 2, label: 'Departments' },
    { num: 3, label: 'SOS HQ' },
    { num: 4, label: 'Settings' },
  ];

  return (
    <div className="bg-white rounded-lg shadow-md p-8">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => (
          <React.Fragment key={step.num}>
            {/* Step circle */}
            <div className="flex flex-col items-center">
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg transition-colors ${
                  index <= currentStep
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-600'
                }`}
              >
                {index < currentStep ? (
                  <svg
                    className="w-6 h-6"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                ) : (
                  step.num
                )}
              </div>
              <p
                className={`mt-2 text-sm font-medium ${
                  index <= currentStep ? 'text-blue-600' : 'text-gray-500'
                }`}
              >
                {step.label}
              </p>
            </div>

            {/* Connector line */}
            {index < steps.length - 1 && (
              <div
                className={`flex-1 h-1 mx-4 transition-colors ${
                  index < currentStep ? 'bg-blue-600' : 'bg-gray-200'
                }`}
              />
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}
