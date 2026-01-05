'use client';

import React from 'react';
import Link from 'next/link';
import { Card } from '@/components/shared/Card';

export default function InvitesInfoPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-2xl mx-auto">
        <Card className="text-center py-8">
          <div className="mb-6 text-5xl">🎟️</div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">User Invitations</h1>
          <p className="text-gray-600 mb-8">
            If you have received an invitation code, you can use it to create an admin account.
          </p>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">How it works</h2>
            <ol className="text-left space-y-3 text-gray-700">
              <li className="flex items-start">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold mr-3">
                  1
                </span>
                <span>Click the invitation link sent to you</span>
              </li>
              <li className="flex items-start">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold mr-3">
                  2
                </span>
                <span>Enter the 6-digit code from your invitation</span>
              </li>
              <li className="flex items-start">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold mr-3">
                  3
                </span>
                <span>Your admin account will be created automatically</span>
              </li>
            </ol>
          </div>

          <div className="space-y-3">
            <Link
              href="/citizen/home"
              className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg transition"
            >
              Back to Home
            </Link>
          </div>
        </Card>

        <div className="mt-8">
          <Card>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Important Information</h2>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-start">
                <span className="text-blue-600 mr-2">•</span>
                <span>Invitations expire 15 minutes after creation</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-600 mr-2">•</span>
                <span>Each invitation code can only be used once</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-600 mr-2">•</span>
                <span>You must be authenticated to accept an invitation</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-600 mr-2">•</span>
                <span>Contact your administrator if your invitation expires</span>
              </li>
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}
