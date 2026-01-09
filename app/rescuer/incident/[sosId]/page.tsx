'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSOSSocket, LocationBroadcast, MessageBroadcast, ParticipantEvent } from '@/hooks/useSOSSocket';
import { useSOSParticipants } from '@/hooks/useSOSParticipants';
import RescuerMap from '@/components/admin/rescuer/RescuerMap';
import { ParticipantsList } from '@/components/admin/rescuer/ParticipantsList';
import { useRequireAuth } from '@/hooks/useAuth';
import { Card } from '@/components/shared/Card';
import { Alert } from '@/components/shared/Alert';
import { getAuthToken, isAuthenticated } from '@/lib/auth/store';

/**
 * Logged-In Rescuer SOS Incident Page
 * 
 * This page allows authenticated rescuers to track incidents in real-time.
 * Same functionality as anonymous rescuer but with proper authentication.
 * 
 * URL Format: /rescuer/incident/[sosId]
 * 
 * Features:
 * - Real-time location tracking on Mapbox
 * - Participant list
 * - Message feed
 * - Connection status indicator
 * - Accept/decline participation
 * - WebSocket connection via useSOSSocket hook
 */

interface RescuerLocation {
  userId: string;
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
  deviceId: string;
  userRole?: 'RESCUER' | 'CITIZEN' | 'SOS_ADMIN';
}

interface Participant {
  userId: string;
  displayName: string;
  role: 'SOS_ADMIN' | 'CITIZEN' | 'RESCUER';
  joinedAt: number;
}

export default function RescuerIncidentPage() {
  const params = useParams();
  const router = useRouter();
  const auth = useRequireAuth();
  const sosId = params.sosId as string;
//   const sosNo =
  const token = getAuthToken();

  const [isConnected, setIsConnected] = useState(false);
  const [locations, setLocations] = useState<Map<string, RescuerLocation>>(new Map());
  const [participants, setParticipants] = useState<Map<string, Participant>>(new Map());
  const [messages, setMessages] = useState<MessageBroadcast[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [rescuerLocation, setRescuerLocation] = useState<RescuerLocation | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [messageInput, setMessageInput] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [inputFocused, setInputFocused] = useState(false);
  const [mapViewType, setMapViewType] = useState<'map' | 'street'>('map');
  const [checkingParticipation, setCheckingParticipation] = useState(true);
  const [isAlreadyParticipant, setIsAlreadyParticipant] = useState<boolean | null>(null);
  const [showAcceptDialog, setShowAcceptDialog] = useState(false);
  const [acceptingParticipation, setAcceptingParticipation] = useState(false);
  const [acceptError, setAcceptError] = useState<string | null>(null);
  
  // Exit participation states
  const [isExiting, setIsExiting] = useState(false);
  const [exitError, setExitError] = useState<string | null>(null);
  
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    const scrollToBottom = () => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };
    
    if (messages.length > 0) {
      const timer = setTimeout(scrollToBottom, 0);
      return () => clearTimeout(timer);
    }
  }, [messages]);

  // Check if already a participant (only on initial load)
  useEffect(() => {
    if (!auth.isAuthenticated || !sosId || !token || !auth.user?.id || isAlreadyParticipant !== null) return;

    const checkParticipation = async () => {
      try {
        setCheckingParticipation(true);
        const bffUrl = process.env.NEXT_PUBLIC_API_BASE || 'http://admin.localhost';
        const response = await fetch(
          `${bffUrl}/api/sos/${sosId}/participants/${auth.user?.id}/check`,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          const isParticipant = data.data?.isActive === true || data.isActive === true;
          setIsAlreadyParticipant(isParticipant);
          if (!isParticipant) {
            setShowAcceptDialog(true);
          }
        } else {
          setIsAlreadyParticipant(false);
          setShowAcceptDialog(true);
        }
      } catch (err) {
        console.error('Error checking participation:', err);
        setIsAlreadyParticipant(false);
        setShowAcceptDialog(true);
      } finally {
        setCheckingParticipation(false);
      }
    };

    checkParticipation();
  }, [auth.isAuthenticated, sosId, token, auth.user?.id, isAlreadyParticipant]);

  // Handle accept participation
  const handleAcceptParticipation = async () => {
    if (!sosId || !token || !auth.user?.id) return;

    setAcceptingParticipation(true);
    setAcceptError(null);

    try {
      const bffUrl = process.env.NEXT_PUBLIC_API_BASE || 'http://admin.localhost';
      const response = await fetch(`${bffUrl}/api/sos/${sosId}/participants/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          userType: 'rescuer',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || 'Failed to join participation');
      }

      setIsAlreadyParticipant(true);
      setShowAcceptDialog(false);
      console.log('✓ Joined SOS incident');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to join participation';
      setAcceptError(message);
      console.error('Error accepting participation:', err);
    } finally {
      setAcceptingParticipation(false);
    }
  };

  // Handle decline
  const handleDecline = () => {
    router.push('/rescuer/dashboard');
  };

  // Handle exit participation
  const handleExitParticipation = async () => {
    if (!sosId || !token || !auth.user?.id) return;

    setIsExiting(true);
    setExitError(null);

    try {
      const bffUrl = process.env.NEXT_PUBLIC_API_BASE || 'http://admin.localhost';
      const response = await fetch(`${bffUrl}/api/sos/${sosId}/participants/${auth.user.id}/leave`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || 'Failed to exit participation');
      }

      router.push('/rescuer/dashboard');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to exit participation';
      setExitError(message);
      console.error('Error exiting participation:', err);
    } finally {
      setIsExiting(false);
    }
  };

  // WebSocket connection
  const { socket, isConnected: wsConnected } = useSOSSocket({
    token: token || '',
    sosId,
    enabled: !!token && !!sosId && (isAlreadyParticipant === true),
    onLocationUpdate: (data: LocationBroadcast) => {
      setLocations((prev) => new Map(prev).set(data.userId, data as RescuerLocation));
    },
    onMessageBroadcast: (data: MessageBroadcast) => {
      setMessages((prev) => [...prev, data].slice(-50)); // Keep last 50 messages
      setLoadingMessages(false);
    },
    onParticipantJoined: (data: ParticipantEvent) => {
      setParticipants((prev) => {
        const map = new Map(prev);
        map.set(data.userId, {
          userId: data.userId,
          displayName: data.displayName,
          role: data.userRole,
          joinedAt: data.timestamp,
        });
        return map;
      });
    },
    onParticipantLeft: (data: ParticipantEvent) => {
      setParticipants((prev) => {
        const map = new Map(prev);
        map.delete(data.userId);
        return map;
      });
    },
    onError: (err) => {
      console.error('WebSocket error:', err);
      setError(`Connection error: ${err.message}`);
    },
  });

  // Update connection state from hook
  useEffect(() => {
    setIsConnected(wsConnected);
    if (wsConnected) {
      console.log('✓ WebSocket connected');
    } else {
      console.log('○ WebSocket disconnected');
    }
  }, [wsConnected]);

  // Initialize participants
  const { participants: hookParticipants } = useSOSParticipants({
    sosId,
    token: token || '',
    enabled: !!sosId && !!token && (isAlreadyParticipant === true),
  });

  useEffect(() => {
    if (hookParticipants?.length) {
      const participantsMap = new Map<string, Participant>();
      hookParticipants.forEach((p: any) => {
        participantsMap.set(p.userId, {
          userId: p.userId,
          displayName: p.displayName || 'Unknown',
          role: p.role,
          joinedAt: new Date(p.joinedAt).getTime(),
        });
      });
      setParticipants(participantsMap);
    }
  }, [hookParticipants]);

  // Load initial SOS state (citizen's location)
  useEffect(() => {
    if (!sosId || !auth.isAuthenticated || !token || isAlreadyParticipant !== true) return;

    const loadSOSState = async () => {
      try {
        const bffUrl = process.env.NEXT_PUBLIC_API_BASE || 'http://admin.localhost';
        const url = `${bffUrl}/api/sos/${sosId}/state`;

        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          console.error('Failed to fetch SOS state:', response.statusText);
          return;
        }

        const apiResponse = await response.json();
        const sosData = apiResponse.data;

        if (sosData?.location) {
          setLocations((prev) => {
            const updated = new Map(prev);
            if (!updated.has(sosData.citizenId)) {
              updated.set(sosData.citizenId, {
                userId: sosData.citizenId,
                latitude: sosData.location.latitude,
                longitude: sosData.location.longitude,
                accuracy: sosData.location.accuracy,
                timestamp: sosData.location.timestamp,
                deviceId: sosData.location.deviceId,
                userRole: 'CITIZEN',
              });
            }
            return updated;
          });
        }

        console.log('✓ Loaded initial SOS state:', sosData);
      } catch (error) {
        console.error('Error loading SOS state:', error);
      }
    };

    loadSOSState();
  }, [sosId, auth.isAuthenticated, token, isAlreadyParticipant]);

  // Load historical messages from API
  useEffect(() => {
    if (!sosId || !auth.isAuthenticated || !token || isAlreadyParticipant !== true) return;

    const loadMessages = async () => {
      setLoadingMessages(true);
      try {
        const bffUrl = process.env.NEXT_PUBLIC_API_BASE || 'http://admin.localhost';
        const url = `${bffUrl}/api/sos/${sosId}/messages?skip=0&limit=50`;

        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          console.error('Failed to fetch messages:', response.statusText);
          return;
        }

        const apiResponse = await response.json();
        
        // Convert API messages to MessageBroadcast format
        const messagesData = Array.isArray(apiResponse.data) ? apiResponse.data : [];
        const formattedMessages = messagesData.map((msg: any) => ({
          id: msg.id,
          sosId: msg.sosId,
          senderType: msg.senderType.toUpperCase() as 'SOS_ADMIN' | 'CITIZEN' | 'RESCUER',
          senderId: msg.senderId || null,
          senderDisplayName: msg.senderDisplayName,
          contentType: msg.contentType as 'text' | 'system',
          content: msg.content,
          createdAt: msg.createdAt,
          timestamp: new Date(msg.createdAt).getTime(),
        }));
        
        setMessages(formattedMessages);
        console.log('✓ Loaded', formattedMessages.length, 'historical messages');
      } catch (error) {
        console.error('Error loading messages:', error);
      } finally {
        setLoadingMessages(false);
      }
    };

    loadMessages();
  }, [sosId, auth.isAuthenticated, token, isAlreadyParticipant]);

  // Watch user's location
  useEffect(() => {
    if (!auth.isAuthenticated || !isAlreadyParticipant) return;

    if (!navigator.geolocation) {
      setLocationError('Geolocation not supported');
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        const timestamp = position.timestamp;

        setRescuerLocation({
          userId: auth.user?.id || '',
          latitude,
          longitude,
          accuracy,
          timestamp,
          deviceId: 'current-device',
          userRole: 'RESCUER',
        });

        setLocationError(null);

        // Broadcast location if socket is connected
        if (socket && isConnected) {
          socket.emit('location:broadcast', {
            userId: auth.user?.id,
            sosId,
            latitude,
            longitude,
            accuracy,
            timestamp,
            deviceId: 'current-device',
          });
        }
      },
      (error) => {
        console.error('Geolocation error:', error.message);
        setLocationError(error.message);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [auth.isAuthenticated, isAlreadyParticipant, socket, isConnected, auth.user?.id, sosId]);

  // Handle send message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!messageInput.trim() || !sosId || !token || !auth.user?.id) return;

    setSendingMessage(true);
    try {
      const bffUrl = process.env.NEXT_PUBLIC_API_BASE || 'http://admin.localhost';
      const url = `${bffUrl}/api/sos/${sosId}/messages`;

      const payload = {
        senderType: 'RESCUER',
        senderId: auth.user.id,
        senderDisplayName: auth.user.id,
        contentType: 'text' as const,
        content: messageInput.trim(),
      };

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      setMessageInput('');
    } catch (err) {
      console.error('Error sending message:', err);
      setError('Failed to send message');
    } finally {
      setSendingMessage(false);
    }
  };

  // Handle open Google Maps
  const handleOpenGoogleMaps = () => {
    if (rescuerLocation) {
      const url = `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${rescuerLocation.latitude},${rescuerLocation.longitude}`;
      window.open(url, '_blank');
    }
  };

  // Loading states
  if (checkingParticipation) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="text-gray-700 font-semibold text-lg mt-4">Loading incident...</p>
        </div>
      </div>
    );
  }

  // Show acceptance dialog if not yet participant
  if (showAcceptDialog && isAlreadyParticipant === false) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <div className="text-center">
            <div className="mb-4">
              <svg className="w-16 h-16 text-blue-600 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.172l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Accept Participation</h1>
            <p className="text-gray-600 mb-4">
              You are about to join this emergency response incident as a rescuer.
            </p>
            
            <div className="bg-blue-50 border-l-4 border-blue-600 p-4 rounded mb-6 text-left">
              <p className="text-sm text-blue-900">
                <span className="font-semibold">📋 What you'll do:</span>
              </p>
              <ul className="text-sm text-blue-800 mt-2 space-y-1">
                <li>✓ Join the active SOS incident</li>
                <li>✓ Share your real-time location</li>
                <li>✓ Communicate with other responders</li>
                <li>✓ Coordinate rescue efforts</li>
              </ul>
            </div>

            {acceptError && (
              <div className="mb-4">
                <Alert type="error" message={acceptError} />
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={handleDecline}
                disabled={acceptingParticipation}
                className="flex-1 px-4 py-3 bg-gray-200 text-gray-900 font-semibold rounded-lg hover:bg-gray-300 disabled:bg-gray-100"
              >
                Decline
              </button>
              <button
                onClick={handleAcceptParticipation}
                disabled={acceptingParticipation}
                className="flex-1 px-4 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
              >
                {acceptingParticipation ? 'Accepting...' : 'Accept & Join'}
              </button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  // Main incident view
  if (isAlreadyParticipant !== true) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-gray-50">
        <Card className="max-w-md">
          <p className="text-red-600">Unable to load incident. Please try again.</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-screen h-screen flex flex-col bg-gray-200 relative overflow-hidden" style={{ position: 'fixed', inset: 0 }}>
      {/* Connection Status Alert */}
      {!isConnected && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-50 bg-yellow-50 border border-yellow-200 rounded-lg p-4 max-w-md shadow-lg">
          <div className="flex items-start gap-3">
            <span className="text-2xl">⏳</span>
            <div>
              <p className="font-semibold text-yellow-900">Connecting to incident...</p>
              <p className="text-sm text-yellow-700">Waiting for WebSocket connection</p>
            </div>
          </div>
        </div>
      )}

      {/* Error Alert */}
      {error && (
        <div className="absolute top-20 left-1/2 transform -translate-x-1/2 z-50 bg-red-50 border border-red-200 rounded-lg p-4 max-w-md shadow-lg">
          <div className="flex items-start gap-3">
            <span className="text-2xl">⚠️</span>
            <div>
              <p className="font-semibold text-red-900">Error</p>
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Map Container - Full Screen */}
      <div style={{ flex: 1, width: '100%', height: '100%' }}>
        <RescuerMap 
          locations={rescuerLocation ? [rescuerLocation, ...Array.from(locations.values())] : Array.from(locations.values())}
          viewType={mapViewType}
          mapboxToken={process.env.NEXT_PUBLIC_MAPBOX_TOKEN}
          centerLatitude={rescuerLocation?.latitude}
          centerLongitude={rescuerLocation?.longitude}
        />
      </div>

      {/* Connection Status Badge */}
      <div className="absolute top-4 left-4 z-30">
        <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-lg">
          <div
            className={`w-3 h-3 rounded-full ${
              isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'
            }`}
          />
          <span className="text-sm font-medium text-gray-700">
            {isConnected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
      </div>

      {/* Incident ID Badge */}
      <div className="absolute bottom-28 left-4 z-30 bg-white rounded-lg shadow-lg px-4 py-2">
        <p className="text-xs text-gray-600">Incident ID</p>
        <span className="text-sm font-semibold text-gray-900">{sosId.toUpperCase()}</span>
      </div>

      {/* Participant Count */}
      <div className="absolute top-16 left-4 z-30 bg-white rounded-lg shadow-lg px-4 py-2">
        <span className="text-sm font-semibold text-gray-900">Participants: {participants.size}</span>
      </div>

      {/* Bottom Sheet for Messages & Chat */}
      <div
        className={`fixed bottom-20 left-0 right-0 z-40 bg-white rounded-t-3xl shadow-2xl transition-all duration-300 ${
          showMobileMenu ? 'max-h-96' : 'max-h-0 overflow-hidden'
        }`}
      >
        {/* Chat Header */}
        <div className="border-b border-gray-200 p-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">Messages</h2>
          <button
            onClick={() => setShowMobileMenu(false)}
            className="text-gray-500 hover:text-gray-700"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 14l-7 7m0 0l-7-7m7 7V3"
              />
            </svg>
          </button>
        </div>

        {/* Messages List */}
        <div className="h-48 overflow-y-auto p-4 space-y-3">
          {loadingMessages && messages.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <p className="text-slate-500 text-xs mt-2">Loading...</p>
              </div>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-slate-400 text-xs">No messages</p>
            </div>
          ) : (
            (() => {
              const sortedMessages = [...messages].sort((a, b) => {
                return new Date(a.timestamp || a.createdAt).getTime() - new Date(b.timestamp || b.createdAt).getTime();
              });

              return sortedMessages.map((msg, idx) => {
                const currentUserId = auth.user?.id;
                const isOwnMessage = msg.senderType === 'RESCUER' && currentUserId === msg.senderId;

                let bubbleColor = 'bg-slate-100';
                let textColor = 'text-slate-900';
                let avatarBg = 'bg-slate-400';
                let justifyClass = 'justify-start';

                if (isOwnMessage) {
                  bubbleColor = 'bg-blue-500';
                  textColor = 'text-white';
                  avatarBg = 'bg-blue-600';
                  justifyClass = 'justify-end';
                } else if (msg.senderType === 'CITIZEN') {
                  bubbleColor = 'bg-emerald-100';
                  textColor = 'text-emerald-900';
                  avatarBg = 'bg-emerald-500';
                } else if (msg.senderType === 'SOS_ADMIN') {
                  bubbleColor = 'bg-purple-100';
                  textColor = 'text-purple-900';
                  avatarBg = 'bg-purple-500';
                }

                const timeStr = new Date(msg.timestamp || msg.createdAt).toLocaleTimeString('en-US', {
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: true,
                });

                const firstLetter = (msg.senderDisplayName || 'U')[0].toUpperCase();

                return (
                  <div key={`${idx}-${msg.id}`} className={`flex gap-2 ${justifyClass}`}>
                    {!isOwnMessage && (
                      <div className={`${avatarBg} w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0`}>
                        <span className="text-white text-xs font-semibold">
                          {firstLetter}
                        </span>
                      </div>
                    )}

                    <div className={`flex flex-col ${justifyClass === 'justify-end' ? 'items-end' : 'items-start'}`}>
                      <p className="text-xs text-slate-500 mb-0.5 px-1">
                        {timeStr}
                      </p>
                      <div className={`max-w-xs px-3 py-2 rounded ${bubbleColor}`}>
                        <p className={`${textColor} break-words text-sm`}>
                          {msg.content}
                        </p>
                      </div>
                    </div>

                    {isOwnMessage && (
                      <div className={`${avatarBg} w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0`}>
                        <span className="text-white text-xs font-semibold">
                          {firstLetter}
                        </span>
                      </div>
                    )}
                  </div>
                );
              });
            })()
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input */}
        <form onSubmit={handleSendMessage} className="border-t border-gray-200 p-4 flex gap-2">
          <input
            type="text"
            value={messageInput}
            onChange={(e) => setMessageInput(e.target.value)}
            onFocus={() => setInputFocused(true)}
            onBlur={() => setInputFocused(false)}
            placeholder="Type a message..."
            disabled={sendingMessage || !isConnected}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:border-blue-500 disabled:bg-gray-100 disabled:text-gray-500"
          />
          <button
            type="submit"
            disabled={sendingMessage || !isConnected}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-6 py-2 rounded-full font-semibold transition-colors"
          >
            {sendingMessage ? '...' : 'Send'}
          </button>
        </form>
      </div>

      {/* Bottom Navigation Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-2xl z-50">
        <div className="flex items-center justify-around px-4 py-3">
          {/* Google Maps Button */}
          <button
            onClick={handleOpenGoogleMaps}
            className="flex flex-col items-center justify-center gap-1 px-3 py-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="Open in Google Street View"
          >
            <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 003 16.382V5.618a1 1 0 011.553-.894L9 7m0 0l6-4m-6 4v12m0-12l6-4m6 4v6m0 0l5.447-2.724A1 1 0 0021 16.382V5.618a1 1 0 00-1.553-.894L15 7" />
            </svg>
            <span className="text-xs text-gray-600">Maps</span>
          </button>

          {/* Messages Button */}
          <button
            onClick={() => setShowMobileMenu(!showMobileMenu)}
            className="flex flex-col items-center justify-center gap-1 px-3 py-2 hover:bg-gray-100 rounded-lg transition-colors relative"
            title="View Messages"
          >
            <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            {messages.length > 0 && (
              <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                {messages.length > 9 ? '9+' : messages.length}
              </span>
            )}
            <span className="text-xs text-gray-600">Chat</span>
          </button>

          {/* Map View Toggle */}
          <button
            onClick={() => setMapViewType(mapViewType === 'map' ? 'street' : 'map')}
            className="flex flex-col items-center justify-center gap-1 px-3 py-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="Toggle Map/Street View"
          >
            <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.553-.894L9 7m0 0l6-4m-6 4v12m0-12l6-4m6 4v6m0 0l5.447-2.724A1 1 0 0021 16.382V5.618a1 1 0 00-1.553-.894L15 7" />
            </svg>
            <span className="text-xs text-gray-600">{mapViewType === 'map' ? 'Street' : 'Map'}</span>
          </button>

          {/* Exit Button */}
          <button
            onClick={handleExitParticipation}
            disabled={isExiting}
            className="flex flex-col items-center justify-center gap-1 px-3 py-2 hover:bg-red-100 rounded-lg transition-colors disabled:opacity-50"
            title="Exit Incident"
          >
            <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span className="text-xs text-red-600">{isExiting ? 'Exiting...' : 'Exit'}</span>
          </button>
        </div>
      </div>

      {/* Chat Sheet Overlay */}
      {showMobileMenu && (
        <div
          className="fixed inset-0 bg-black/20 z-35"
          onClick={() => setShowMobileMenu(false)}
        />
      )}
    </div>
  );
}
