'use client';

import React, { useEffect, useState } from 'react';
import { useSOSParticipants } from '@/hooks/useSOSParticipants';

interface Participant {
  id: string;
  sosId: string;
  userId: string;
  userType: 'admin' | 'rescuer' | 'citizen';
  status: 'ACTIVE' | 'INACTIVE';
  joinedAt: string;
  leftAt: string | null;
  actorType: 'USER' | 'ANON';
}

interface ParticipantsListProps {
  sosId: string;
  token: string;
  currentUserId: string;
  onError?: (error: string) => void;
  className?: string;
}

const getRoleColor = (userType: string): string => {
  switch (userType) {
    case 'admin':
      return 'bg-red-100 text-red-800 border-red-300';
    case 'rescuer':
      return 'bg-blue-100 text-blue-800 border-blue-300';
    case 'citizen':
      return 'bg-green-100 text-green-800 border-green-300';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-300';
  }
};

const getRoleIcon = (userType: string): string => {
  switch (userType) {
    case 'admin':
      return '👨‍💼';
    case 'rescuer':
      return '🚨';
    case 'citizen':
      return '👤';
    default:
      return '❓';
  }
};

export const ParticipantsList: React.FC<ParticipantsListProps> = ({
  sosId,
  token,
  currentUserId,
  onError,
  className = '',
}) => {
  const { participants, loading, error, fetchActive, join, leave } = useSOSParticipants({
    sosId,
    token,
    enabled: !!sosId && !!token,
  });

  const [isJoined, setIsJoined] = useState(false);
  const [isJoining, setIsJoining] = useState(false);

  // Debug log
  useEffect(() => {
    console.log('📋 ParticipantsList received participants:', participants);
  }, [participants]);

  // Auto-refresh every 10 seconds (hook handles initial load)
  useEffect(() => {
    const interval = setInterval(() => fetchActive(), 10000); // Refresh every 10 seconds
    return () => clearInterval(interval);
  }, [fetchActive]);

  // Check if current user is already joined
  useEffect(() => {
    const isCurrentUserJoined = participants.some(
      (p) => p.userId === currentUserId && p.status === 'ACTIVE'
    );
    setIsJoined(isCurrentUserJoined);
  }, [participants, currentUserId]);

  // Handle error
  useEffect(() => {
    if (error && onError) {
      onError(error);
    }
  }, [error, onError]);

  const handleJoin = async () => {
    setIsJoining(true);
    try {
      await join('rescuer');
    } finally {
      setIsJoining(false);
    }
  };

  const handleLeave = async () => {
    setIsJoining(true);
    try {
      await leave(currentUserId);
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <div className={`bg-white rounded-lg shadow-md p-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold text-gray-800">Active Participants</h3>
          {loading && participants.length === 0 ? (
            <span className="inline-flex items-center justify-center w-6 h-6 bg-gray-100 text-gray-500 rounded-full text-sm font-semibold animate-pulse">
              ...
            </span>
          ) : (
            <span className="inline-flex items-center justify-center w-6 h-6 bg-blue-100 text-blue-800 rounded-full text-sm font-semibold">
              {participants.length}
            </span>
          )}
        </div>
        {isJoined ? (
          <button
            onClick={handleLeave}
            disabled={isJoining || loading}
            className="px-3 py-1 text-sm bg-red-500 hover:bg-red-600 disabled:bg-gray-400 text-white rounded-md transition-colors"
          >
            {isJoining ? '⏳ Leaving...' : '🚪 Leave'}
          </button>
        ) : (
          <button
            onClick={handleJoin}
            disabled={isJoining || loading}
            className="px-3 py-1 text-sm bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white rounded-md transition-colors"
          >
            {isJoining ? '⏳ Joining...' : '✋ Join'}
          </button>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-800 rounded-md text-sm">
          ⚠️ {error}
        </div>
      )}

      {/* Loading State */}
      {loading && participants.length === 0 && (
        <div className="flex justify-center py-4">
          <div className="animate-spin h-5 w-5 text-blue-500">⟳</div>
        </div>
      )}

      {/* Participants List */}
      {participants.length > 0 ? (
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {participants.map((participant) => {
            const isCurrentUser = participant.userId === currentUserId;
            return (
              <div
                key={participant.id}
                className={`p-3 rounded-md border-2 transition-all ${getRoleColor(participant.userType)} ${
                  isCurrentUser ? 'ring-2 ring-yellow-400' : ''
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{getRoleIcon(participant.userType)}</span>
                      <div>
                        <p className="font-semibold text-sm">
                          {participant.userType.charAt(0).toUpperCase() +
                            participant.userType.slice(1)}
                          {isCurrentUser && ' (You)'}
                        </p>
                        <p className="text-xs opacity-70">
                          {participant.userId.substring(0, 8)}...
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs opacity-70">
                      {new Date(participant.joinedAt).toLocaleTimeString()}
                    </p>
                    {participant.actorType === 'ANON' && (
                      <span className="inline-block text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded mt-1">
                        Anonymous
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        !loading && (
          <div className="text-center py-6 text-gray-500">
            <p className="text-sm">No active participants yet</p>
            <p className="text-xs mt-1">Click "Join" to participate in this SOS</p>
          </div>
        )
      )}

      {/* Status Indicator */}
      <div className="mt-4 pt-4 border-t border-gray-200 flex items-center justify-between text-xs text-gray-600">
        <span className="flex items-center gap-1">
          <span className={`w-2 h-2 rounded-full ${loading ? 'bg-yellow-400 animate-pulse' : 'bg-green-500'}`}></span>
          {loading ? 'Updating...' : 'Live'}
        </span>
        <span>Last updated: {new Date().toLocaleTimeString()}</span>
      </div>
    </div>
  );
};
