'use client';

import React from 'react';

/**
 * Rescuer Layout
 * 
 * This layout wraps anonymous rescuer pages.
 * Unlike the parent /admin layout, this does NOT require authentication
 * since rescuers receive a token via shareable link.
 */
export default function RescuerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
