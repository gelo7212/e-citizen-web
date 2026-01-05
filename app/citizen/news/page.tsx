'use client';

import React, { useEffect, useState } from 'react';
import { Card } from '@/components/shared/Card';
import { getNews } from '@/lib/api/endpoints';
import type { CizenNews } from '@/types';

export default function NewsPage() {
  const [news, setNews] = useState<CizenNews[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadNews = async () => {
      setIsLoading(true);
      const response = await getNews();
      if (response.success && response.data) {
        setNews(response.data);
      }
      setIsLoading(false);
    };

    loadNews();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">News & Updates</h1>

        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-gray-600">Loading news...</p>
          </div>
        ) : news.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600">No news available</p>
          </div>
        ) : (
          <div className="space-y-6">
            {news.map((item) => (
              <Card key={item.id}>
                <div className="flex gap-4">
                  {item.imageUrl && (
                    <img
                      src={item.imageUrl}
                      alt={item.title}
                      className="w-48 h-32 object-cover rounded"
                    />
                  )}
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">
                          {item.title}
                        </h3>
                        <p className="text-gray-600 mt-2">{item.excerpt}</p>
                      </div>
                      <span className="text-xs bg-blue-100 text-blue-800 px-3 py-1 rounded-full">
                        {item.category}
                      </span>
                    </div>
                    <div className="flex justify-between items-end mt-4">
                      <p className="text-sm text-gray-500">{item.author}</p>
                      <p className="text-sm text-gray-500">
                        {new Date(item.publishedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
