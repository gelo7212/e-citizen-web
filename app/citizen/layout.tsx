'use client';

import React from 'react';

export default function CitizenLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-blue-600">e-Citizen</h1>
          <div className="flex gap-4 md:gap-8">
            <a
              href="/citizen/home"
              className="text-gray-700 hover:text-blue-600"
            >
              Home
            </a>
            <a
              href="/citizen/news"
              className="text-gray-700 hover:text-blue-600"
            >
              News
            </a>
            <a
              href="/citizen/announcements"
              className="text-gray-700 hover:text-blue-600"
            >
              Announcements
            </a>
            <a
              href="/citizen/services"
              className="text-gray-700 hover:text-blue-600"
            >
              Services
            </a>
            <a
              href="/citizen/programs"
              className="text-gray-700 hover:text-blue-600"
            >
              Programs
            </a>
          </div>
        </div>
      </nav>

      {/* Main content */}
      <main className="flex-1">{children}</main>

      {/* Footer */}
      <footer className="bg-gray-800 text-gray-400 py-8 mt-12">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <p>
            &copy; {new Date().getFullYear()} e-Citizen Platform. All rights
            reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
