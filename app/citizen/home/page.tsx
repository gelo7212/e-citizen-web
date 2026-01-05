'use client';

import React from 'react';
import { Card } from '@/components/shared/Card';

export default function CitizenHome() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white">
        <div className="max-w-6xl mx-auto px-4 py-12">
          <h1 className="text-4xl font-bold mb-4">Welcome to e-Citizen</h1>
          <p className="text-lg text-blue-100">
            Your gateway to city services and announcements
          </p>
        </div>
      </div>

      {/* Emergency Banner */}
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
          <h3 className="font-semibold text-red-800">Emergency? </h3>
          <p className="text-red-700">
            Call 911 or use the SOS feature in the mobile app for immediate assistance
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {[
            { title: 'News & Announcements', icon: '📰' },
            { title: 'City Services', icon: '🏢' },
            { title: 'Programs & Events', icon: '📅' },
            { title: 'Youth Assistance', icon: '👥' },
          ].map((item, idx) => (
            <Card key={idx} className="text-center cursor-pointer hover:shadow-lg">
              <div className="text-4xl mb-4">{item.icon}</div>
              <h3 className="font-semibold text-gray-900">{item.title}</h3>
            </Card>
          ))}
        </div>

        {/* Latest Updates Section */}
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Latest Updates</h2>
        <div className="space-y-4">
          {[1, 2, 3].map((idx) => (
            <Card key={idx}>
              <div className="flex items-start gap-4">
                <div className="text-3xl">📢</div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">Sample Announcement {idx}</h3>
                  <p className="text-gray-600 mt-2">
                    This is a sample announcement. Latest news will appear here.
                  </p>
                  <p className="text-sm text-gray-500 mt-3">2 hours ago</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
