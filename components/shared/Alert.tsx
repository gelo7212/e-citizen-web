'use client';

import React from 'react';

export type AlertType = 'success' | 'error' | 'warning' | 'info';

interface AlertProps {
  type: AlertType;
  title?: string;
  message: string;
  onClose?: () => void;
  dismissible?: boolean;
}

const colorMap: Record<AlertType, string> = {
  success: 'bg-green-50 border-green-200 text-green-800',
  error: 'bg-red-50 border-red-200 text-red-800',
  warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
  info: 'bg-blue-50 border-blue-200 text-blue-800',
};

const iconMap: Record<AlertType, string> = {
  success: '✓',
  error: '✕',
  warning: '⚠',
  info: 'ℹ',
};

export function Alert({
  type,
  title,
  message,
  onClose,
  dismissible = true,
}: AlertProps) {
  const [isVisible, setIsVisible] = React.useState(true);

  const handleClose = () => {
    setIsVisible(false);
    onClose?.();
  };

  if (!isVisible) return null;

  return (
    <div
      className={`border rounded-md p-4 ${colorMap[type]} flex items-start justify-between`}
      role="alert"
    >
      <div className="flex items-start gap-3">
        <span className="text-lg">{iconMap[type]}</span>
        <div>
          {title && <h3 className="font-semibold">{title}</h3>}
          <p>{message}</p>
        </div>
      </div>
      {dismissible && (
        <button
          onClick={handleClose}
          className="text-gray-400 hover:text-gray-600"
        >
          ✕
        </button>
      )}
    </div>
  );
}
