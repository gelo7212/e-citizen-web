'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { 
  useSOSSocket, 
  LocationBroadcast, 
  MessageBroadcast, 
  ParticipantEvent 
} from '@/hooks/useSOSSocket';
import { useSOSParticipants } from '@/hooks/useSOSParticipants';
import RescuerMap from '@/components/admin/rescuer/RescuerMap';

// Types
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

const decodeJWT = (jwtToken: string) => {
  try {
    const base64Url = jwtToken.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (err) {
    throw new Error('Failed to decode JWT');
  }
};

export default function RescuerPageRedesigned() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const rescuerId = params.rescuerId as string;
  const token = searchParams.get('token') || '';

  // State Management
  const [sosId, setSosId] = useState<string>('');
  const [isConnected, setIsConnected] = useState(false);
  const [locations, setLocations] = useState<Map<string, RescuerLocation>>(new Map());
  const [participants, setParticipants] = useState<Map<string, Participant>>(new Map());
  const [messages, setMessages] = useState<MessageBroadcast[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [decodedToken, setDecodedToken] = useState<any>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isValidatingToken, setIsValidatingToken] = useState(true);
  const [rescuerLocation, setRescuerLocation] = useState<RescuerLocation | null>(null);
  const [messageInput, setMessageInput] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [chatSheetOpen, setChatSheetOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [sosStatus, setSOSStatus] = useState<string>('active');
  const [isExiting, setIsExiting] = useState(false);
  const [mapViewType, setMapViewType] = useState<'map' | 'street'>('map');
  const [locationError, setLocationError] = useState<string | null>(null);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [inputFocused, setInputFocused] = useState(false);
  const [checkingParticipation, setCheckingParticipation] = useState(false);
  const [isAlreadyParticipant, setIsAlreadyParticipant] = useState<boolean | null>(null);
  const [showAcceptDialog, setShowAcceptDialog] = useState(false);
  const [acceptingParticipation, setAcceptingParticipation] = useState(false);
  const [acceptError, setAcceptError] = useState<string | null>(null);
  const [exitError, setExitError] = useState<string | null>(null);
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Token Validation
  useEffect(() => {
    if (!token) {
      setError('❌ No authentication token provided');
      setIsAuthenticated(false);
      setIsValidatingToken(false);
      return;
    }

    try {
      const decoded = decodeJWT(token);
      const role = decoded.identity?.role || decoded.role;

      console.log('🔐 Token decoded successfully:', {
        userId: decoded.userId || decoded.actor?.type,
        role: role,
        sosId: decoded.mission?.sosId || decoded.sosId,
      });

      if (role !== 'RESCUER') {
        setError(`❌ Not authenticated as rescuer. Role: ${role || 'unknown'}`);
        setIsAuthenticated(false);
        setIsValidatingToken(false);
        setTimeout(() => {
          console.log('🔄 Redirecting to citizen portal...');
          router.push('/citizen/home');
        }, 2000);
        return;
      }

      setDecodedToken(decoded);
      setIsAuthenticated(true);

      // Extract sosId - handle both token formats
      const sosIdFromToken = decoded.mission?.sosId || decoded.sosId;
      if (sosIdFromToken) {
        setSosId(sosIdFromToken);
        console.log('✓ Using sosId from token:', sosIdFromToken);
      } else {
        setSosId(rescuerId);
        console.warn('⚠️ Token does not contain sosId, using rescuerId:', rescuerId);
      }
    } catch (err) {
      console.error('❌ Error decoding token:', err);
      setError(`Failed to decode token: ${err instanceof Error ? err.message : 'Invalid token'}`);
      setIsAuthenticated(false);
      setTimeout(() => {
        console.log('🔄 Redirecting to citizen portal...');
        router.push('/citizen/home');
      }, 2000);
    } finally {
      setIsValidatingToken(false);
    }
  }, [token, rescuerId, router]);

  // Initialize map
  useEffect(() => {
    console.log('🗺️ Map component will handle initialization');
  }, []);

  // Get Rescuer's Geolocation
  useEffect(() => {
    if (!navigator.geolocation) return;

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        const timestamp = position.timestamp;

        setRescuerLocation({
          userId: rescuerId,
          latitude,
          longitude,
          accuracy,
          timestamp,
          deviceId: 'current-device',
          userRole: 'RESCUER',
        });
      },
      (error) => console.error('Geolocation error:', error),
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [rescuerId]);

  // WebSocket Setup
  const { socket, isConnected: wsConnected } = useSOSSocket({
    token,
    sosId,
    enabled: !!token && !!sosId && isAuthenticated === true,
    onLocationUpdate: (data: LocationBroadcast) => {
      const participant = participants.get(data.userId);
      const userRole = participant?.role || 'RESCUER';

      setLocations((prev) =>
        new Map(prev).set(data.userId, {
          userId: data.userId,
          latitude: data.latitude,
          longitude: data.longitude,
          accuracy: data.accuracy,
          timestamp: data.timestamp,
          deviceId: data.deviceId,
          userRole: userRole as 'RESCUER' | 'CITIZEN' | 'SOS_ADMIN',
        })
      );
    },
    onMessageBroadcast: (data: MessageBroadcast) => {
      setMessages((prev) => [...prev, data]);
      if (!chatSheetOpen) setUnreadCount((prev) => prev + 1);
    },
    onParticipantJoined: (data: ParticipantEvent) => {
      setParticipants((prev) =>
        new Map(prev).set(data.userId, {
          userId: data.userId,
          displayName: data.displayName,
          role: data.userRole,
          joinedAt: data.timestamp,
        })
      );
    },
    onParticipantLeft: (data: ParticipantEvent) => {
      setParticipants((prev) => {
        const updated = new Map(prev);
        updated.delete(data.userId);
        return updated;
      });
    },
  });

  useEffect(() => {
    setIsConnected(wsConnected);
  }, [wsConnected]);

  // Load initial SOS state on page load
  useEffect(() => {
    if (!sosId || isAuthenticated !== true || !token) return;

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
  }, [sosId, isAuthenticated, token]);

  // Check if rescuer is already a participant
  useEffect(() => {
    if (!sosId || isAuthenticated !== true || !token || checkingParticipation) return;

    const checkParticipationStatus = async () => {
      setCheckingParticipation(true);
      try {
        const bffUrl = process.env.NEXT_PUBLIC_API_BASE || 'http://admin.localhost';
        const currentUserId = decodedToken?.identity?.userId || decodedToken?.userId || rescuerId;
        const url = `${bffUrl}/api/sos/${sosId}/participants/${currentUserId}/check`;

        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          console.warn('Failed to check participation status:', response.statusText);
          setIsAlreadyParticipant(false);
          setShowAcceptDialog(true);
          return;
        }

        const data = await response.json();
        if (data.success && data.data?.isActive) {
          console.log('✓ Rescuer is already a participant');
          setIsAlreadyParticipant(true);
        } else {
          console.log('⚠️ Rescuer is not a participant, showing accept dialog');
          setIsAlreadyParticipant(false);
          setShowAcceptDialog(true);
        }
      } catch (error) {
        console.error('Error checking participation:', error);
        setIsAlreadyParticipant(false);
        setShowAcceptDialog(true);
      } finally {
        setCheckingParticipation(false);
      }
    };

    checkParticipationStatus();
  }, [sosId, isAuthenticated, token, decodedToken, rescuerId]);

  // Load historical messages from API
  useEffect(() => {
    if (!sosId || isAuthenticated !== true || !token) return;

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
  }, [sosId, isAuthenticated, token]);

  // Auto-scroll messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Send Message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim() || !sosId || !token) return;

    setSendingMessage(true);
    try {
      const bffUrl = process.env.NEXT_PUBLIC_API_BASE || 'http://admin.localhost';
      const url = `${bffUrl}/api/sos/${sosId}/messages`;

      const payload = {
        senderType: 'RESCUER',
        senderId: decodedToken?.userId || decodedToken?.actor?.type || 'unknown',
        senderDisplayName: decodedToken?.displayName || 'Rescuer',
        contentType: 'text' as const,
        content: messageInput.trim(),
        cityId: decodedToken?.cityId || '',
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
        console.error('Failed to send message:', response.statusText);
        return;
      }

      setMessageInput('');
      console.log('✓ Message sent successfully');
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSendingMessage(false);
    }
  };

  // Handle accept participation
  const handleAcceptParticipation = async () => {
    if (!sosId || !token) return;

    setAcceptingParticipation(true);
    setAcceptError(null);
    try {
      const bffUrl = process.env.NEXT_PUBLIC_API_BASE || 'http://admin.localhost';
      const url = `${bffUrl}/api/sos/${sosId}/participants/join`;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ userType: 'rescuer' }),
      });

      if (!response.ok) {
        throw new Error(`Failed to accept participation: ${response.statusText}`);
      }

      const data = await response.json();
      if (data.success) {
        console.log('✅ Successfully joined as participant');
        setIsAlreadyParticipant(true);
        setShowAcceptDialog(false);
      } else {
        setAcceptError(data.error || 'Failed to accept participation');
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Error accepting participation';
      console.error('❌ Error accepting participation:', errorMsg);
      setAcceptError(errorMsg);
    } finally {
      setAcceptingParticipation(false);
    }
  };

  // Exit Participation
  const handleExit = async () => {
    if (!sosId || !token) return;

    setIsExiting(true);
    setExitError(null);
    try {
      const bffUrl = process.env.NEXT_PUBLIC_API_BASE || 'http://admin.localhost';
      const currentUserId = decodedToken?.identity?.userId || decodedToken?.userId || rescuerId;
      const url = `${bffUrl}/api/sos/${sosId}/participants/${currentUserId}/leave`;

      const response = await fetch(url, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to exit participation: ${response.statusText}`);
      }

      const data = await response.json();
      if (data.success) {
        console.log('✅ Successfully left SOS');
        setIsAlreadyParticipant(false);
        setShowExitConfirm(false);
        setTimeout(() => {
          router.push('/citizen/home');
        }, 1500);
      } else {
        setExitError(data.error || 'Failed to exit SOS');
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Error exiting SOS';
      console.error('❌ Error exiting SOS:', errorMsg);
      setExitError(errorMsg);
    } finally {
      setIsExiting(false);
    }
  };

  // Open Google Maps
  const handleOpenGoogleMaps = () => {
    if (rescuerLocation) {
      const url = `https://www.google.com/maps?q=${rescuerLocation.latitude},${rescuerLocation.longitude}`;
      window.open(url, '_blank');
    }
  };

  // Loading & Error States
  if (isValidatingToken) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-gradient-to-br from-blue-500 to-blue-600">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white text-lg font-semibold">Validating Token...</p>
        </div>
      </div>
    );
  }

  if (isAuthenticated === false) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-gradient-to-br from-red-500 to-red-600">
        <div className="text-center">
          <div className="text-6xl mb-4">❌</div>
          <p className="text-white text-lg font-semibold mb-2">Authentication Failed</p>
          <p className="text-red-100">{error}</p>
          <p className="text-red-100 mt-4">Redirecting...</p>
        </div>
      </div>
    );
  }

  // Show accept participation dialog
  if (showAcceptDialog && isAlreadyParticipant === false) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center max-w-md bg-white rounded-lg shadow-2xl p-8">
          <div className="mb-6">
            <svg className="w-16 h-16 text-blue-600 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-2">Accept Participation</h1>
          <p className="text-gray-600 mb-4">
            You are about to join this emergency response incident as a rescuer.
          </p>

          <div className="bg-blue-50 border-l-4 border-blue-600 p-4 rounded mb-6 text-left">
            <p className="text-sm text-blue-900 font-semibold">You will be able to:</p>
            <ul className="text-sm text-blue-800 mt-2 space-y-1">
              <li>✓ Share real-time location</li>
              <li>✓ View other responders on the map</li>
              <li>✓ Communicate with the team</li>
              <li>✓ Track the incident status</li>
            </ul>
          </div>

          {acceptError && (
            <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded mb-4 text-sm">
              ⚠️ {acceptError}
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={() => router.push('/citizen/home')}
              disabled={acceptingParticipation}
              className="flex-1 px-4 py-2 text-gray-700 bg-gray-200 hover:bg-gray-300 disabled:bg-gray-100 disabled:text-gray-500 font-semibold rounded-lg transition-colors"
            >
              Decline
            </button>
            <button
              onClick={handleAcceptParticipation}
              disabled={acceptingParticipation}
              className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold rounded-lg transition-colors"
            >
              {acceptingParticipation ? 'Accepting...' : 'Accept'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Show exit confirmation dialog
  if (showExitConfirm) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-black/50 fixed inset-0 z-50">
        <div className="text-center max-w-md bg-white rounded-lg shadow-2xl p-8">
          <div className="mb-6">
            <svg className="w-16 h-16 text-red-600 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4v2m0 0v2m0-2h2m-2 0h-2" />
            </svg>
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-2">Exit Mission?</h1>
          <p className="text-gray-600 mb-4">
            Are you sure you want to exit this emergency response incident?
          </p>

          <div className="bg-red-50 border-l-4 border-red-600 p-4 rounded mb-6 text-left">
            <p className="text-sm text-red-900 font-semibold mb-2">You will lose:</p>
            <ul className="text-sm text-red-800 space-y-1 mb-3">
              <li>• Real-time location sharing</li>
              <li>• Access to the incident map</li>
              <li>• Team communication</li>
            </ul>
            <p className="text-sm text-white-700 border-t border-red-200 pt-2">
              ✓ You can rejoin anytime using your mission link
            </p>
          </div>

          {exitError && (
            <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded mb-4 text-sm">
              ⚠️ {exitError}
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={() => setShowExitConfirm(false)}
              disabled={isExiting}
              className="flex-1 px-4 py-2 text-gray-700 bg-gray-200 hover:bg-gray-300 disabled:bg-gray-100 disabled:text-gray-500 font-semibold rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleExit}
              disabled={isExiting}
              className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white font-semibold rounded-lg transition-colors"
            >
              {isExiting ? 'Exiting...' : 'Exit'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-screen h-screen flex flex-col bg-gray-200 relative overflow-hidden" style={{ position: 'fixed', inset: 0 }}>
    

      {/* Error Alert */}
      {error && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-50 bg-red-50 border border-red-200 rounded-lg p-4 max-w-md shadow-lg">
          <div className="flex items-start gap-3">
            <span className="text-2xl">⚠️</span>
            <div>
              <p className="font-semibold text-red-900">Error</p>
              <p className="text-sm text-red-700">{error}</p>
              <p className="text-xs text-red-600 mt-1">Check browser console for details</p>
            </div>
          </div>
        </div>
      )}

      {/* Map Container - Full Screen */}
      <RescuerMap 
        locations={rescuerLocation ? [rescuerLocation, ...Array.from(locations.values())] : Array.from(locations.values())}
        viewType={mapViewType}
      />

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

      {/* On Scene Count */}
      <div className="absolute top-16 left-4 z-30 bg-white rounded-lg shadow-lg px-4 py-2">
        <span className="text-sm font-semibold text-gray-900">On Scene {participants.size}</span>
      </div>

      {/* Participants Panel */}
      {/* <div className="absolute top-4 right-4 z-30 bg-white rounded-lg shadow-lg p-3 max-w-xs">
        <h3 className="font-semibold text-gray-900 mb-2 text-sm">Participants</h3>
        <div className="space-y-1 max-h-40 overflow-y-auto">
          {Array.from(participants.values()).map((participant) => (
            <div key={participant.userId} className="flex items-center gap-2 text-xs">
              <div
                className={`w-2 h-2 rounded-full ${
                  participant.role === 'RESCUER' ? 'bg-red-500' : 'bg-blue-500'
                }`}
              />
              <span className="text-gray-700">{participant.displayName}</span>
              <span className="text-xs text-gray-500">({participant.role})</span>
            </div>
          ))}
        </div>
      </div> */}

      {/* Bottom Sheet for Chat */}
      <div
        className={`fixed bottom-20 left-0 right-0 z-40 bg-white rounded-t-3xl shadow-2xl transition-all duration-300 ${
          chatSheetOpen ? 'max-h-96' : 'max-h-0 overflow-hidden'
        }`}
      >
        {/* Chat Header */}
        <div className="border-b border-gray-200 p-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">Messages</h2>
          <button
            onClick={() => {
              setChatSheetOpen(false);
              setUnreadCount(0);
            }}
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
            <div className="text-center text-gray-500 text-sm">Loading messages...</div>
          ) : messages.length === 0 ? (
            <div className="text-center text-gray-400 text-sm">No messages yet</div>
          ) : (
            [...messages].sort((a, b) => {
              return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
            }).map((msg, idx) => {
              const currentUserId = decodedToken?.identity?.userId;
              const isFromSender = msg.senderId === currentUserId;
              const messageTime = new Date(msg.createdAt).toLocaleTimeString('en-US', { 
                hour: '2-digit', 
                minute: '2-digit',
                hour12: true 
              });
              return (
                <div
                  key={idx}
                  className={`flex ${isFromSender ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xs px-4 py-2 rounded-lg ${
                      isFromSender
                        ? 'bg-red-500 text-white rounded-br-none'
                        : 'bg-gray-200 text-gray-900 rounded-bl-none'
                    }`}
                  >
                    {!isFromSender && <p className="text-xs font-semibold mb-1">{msg.senderDisplayName}</p>}
                    <p className="text-sm">{msg.content}</p>
                    <p className={`text-xs mt-1 ${isFromSender ? 'text-red-100' : 'text-gray-500'}`}>{messageTime}</p>
                  </div>
                </div>
              );
            })
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
            className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:border-red-500 disabled:bg-gray-100 disabled:text-gray-500"
          />
          <button
            type="submit"
            disabled={sendingMessage || !isConnected}
            className="bg-red-500 hover:bg-red-600 disabled:bg-red-300 text-white px-6 py-2 rounded-full font-semibold transition-colors"
          >
            {sendingMessage ? '...' : 'Send'}
          </button>
        </form>
      </div>

      {/* Bottom Navigation Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-2xl z-50">
        <div className="flex items-center justify-around px-4 py-3">
          {/* View on Maps Button */}
          <button
            onClick={handleOpenGoogleMaps}
            className="flex flex-col items-center justify-center gap-1 px-3 py-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="View on Google Maps"
          >
            <svg className="w-6 h-6 text-gray-700" viewBox="0 0 24 24" fill="currentColor">
              <path d="m23.5,11c-.276,0-.5.224-.5.5v4.5h-7.293l-5.707-5.707V1h2.5c.276,0,.5-.224.5-.5s-.224-.5-.5-.5H4.5C2.019,0,0,2.019,0,4.5v15c0,2.481,2.019,4.5,4.5,4.5h15c2.481,0,4.5-2.019,4.5-4.5v-8c0-.276-.224-.5-.5-.5ZM4.5,1h4.5v9.191L1,14.191V4.5c0-1.93,1.57-3.5,3.5-3.5ZM1,19.5v-4.191l8.401-4.201,5.45,5.45-4.459,6.441h-5.892c-1.93,0-3.5-1.57-3.5-3.5Zm18.5,3.5h-7.892l4.154-6h7.238v2.5c0,1.93-1.57,3.5-3.5,3.5Zm-1-15.5c1.103,0,2-.897,2-2s-.897-2-2-2-2,.897-2,2,.897,2,2,2Zm0-3c.552,0,1,.448,1,1s-.448,1-1,1-1-.448-1-1,.448-1,1-1Zm-3.874,4.867l1.972,1.812c.511.498,1.187.772,1.902.772s1.392-.274,1.893-.763l1.995-1.836c1.04-1.035,1.612-2.411,1.612-3.875s-.572-2.84-1.612-3.875c-1.038-1.034-2.419-1.604-3.888-1.604s-2.85.569-3.889,1.604c-1.039,1.035-1.611,2.411-1.611,3.875s.572,2.84,1.626,3.889Zm.69-7.055c.851-.847,1.981-1.312,3.184-1.312s2.333.466,3.183,1.312c.85.846,1.317,1.97,1.317,3.166s-.468,2.32-1.304,3.152l-1.991,1.832c-.646.631-1.753.641-2.421-.01l-1.968-1.809c-.849-.846-1.316-1.97-1.316-3.166s.468-2.32,1.316-3.166Z" />
            </svg>
            <span className="text-xs font-medium text-gray-700">Maps</span>
          </button>

          {/* Chat Button */}
          <button
            onClick={() => {
              setChatSheetOpen(!chatSheetOpen);
              setUnreadCount(0);
            }}
            className="flex flex-col items-center justify-center gap-1 px-3 py-2 hover:bg-gray-100 rounded-lg transition-colors relative"
            title="View Messages"
          >
            <svg className="w-6 h-6 text-gray-700" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19.675,2.758A11.936,11.936,0,0,0,10.474.1,12,12,0,0,0,12.018,24H19a5.006,5.006,0,0,0,5-5V11.309l0-.063A12.044,12.044,0,0,0,19.675,2.758ZM8,7h4a1,1,0,0,1,0,2H8A1,1,0,0,1,8,7Zm8,10H8a1,1,0,0,1,0-2h8a1,1,0,0,1,0,2Zm0-4H8a1,1,0,0,1,0-2h8a1,1,0,0,1,0,2Z" />
            </svg>
            {unreadCount > 0 && (
              <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
            <span className="text-xs font-medium text-gray-700">Chat</span>
          </button>

          {/* Toggle Layout Button */}
          <button
            onClick={() => setMapViewType(mapViewType === 'map' ? 'street' : 'map')}
            className="flex flex-col items-center justify-center gap-1 px-3 py-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="Toggle Map/Street View"
          >
            <svg className="w-6 h-6 text-gray-700" viewBox="0 0 24 24" fill="currentColor">
              <path d="M9.5,2.5c0-1.381,1.119-2.5,2.5-2.5s2.5,1.119,2.5,2.5-1.119,2.5-2.5,2.5-2.5-1.119-2.5-2.5Zm-1.5,9v-1.5c0-2.206,1.794-4,4-4s4,1.794,4,4v1.5c0,1.393-.819,2.599-2,3.162v2.838c0,.829-.672,1.5-1.5,1.5h-1c-.828,0-1.5-.671-1.5-1.5v-2.838c-1.181-.563-2-1.769-2-3.162Zm3,0c0,.276,.225,.5,.5,.5h1c.275,0,.5-.224,.5-.5v-1.5c0-.551-.448-1-1-1s-1,.449-1,1v1.5Zm7.865,3.545c-.806-.203-1.619,.286-1.82,1.09-.201,.803,.286,1.618,1.09,1.82,1.698,.426,2.497,.936,2.777,1.203-.67,.642-3.674,1.842-8.912,1.842s-8.242-1.2-8.912-1.842c.28-.268,1.079-.777,2.777-1.203,.804-.202,1.291-1.017,1.09-1.82-.202-.804-1.02-1.292-1.82-1.09-3.312,.832-5.135,2.293-5.135,4.114,0,3.344,6.027,4.841,12,4.841s12-1.497,12-4.841c0-1.821-1.823-3.283-5.135-4.114Z" />
            </svg>
            <span className="text-xs font-medium text-gray-700">{mapViewType === 'map' ? 'Street' : 'Map'}</span>
          </button>

          {/* Exit Button */}
          <button
            onClick={() => setShowExitConfirm(true)}
            disabled={isExiting}
            className="flex flex-col items-center justify-center gap-1 px-3 py-2 hover:bg-red-100 rounded-lg transition-colors disabled:opacity-50"
            title="Exit Mission"
          >
            <svg className="w-6 h-6 text-red-600" viewBox="0 0 512 512" fill="currentColor">
              <path d="M487.06,195.669l-82.752-82.752c-8.475-8.185-21.98-7.95-30.165,0.525c-7.985,8.267-7.985,21.374,0,29.641l82.752,82.752c2.459,2.507,4.607,5.301,6.4,8.32c-0.32,0-0.576-0.171-0.896-0.171l0,0l-334.592,0.683c-11.782,0-21.333,9.551-21.333,21.333c0,11.782,9.551,21.333,21.333,21.333l0,0l334.464-0.683c0.597,0,1.088-0.299,1.664-0.341c-1.892,3.609-4.292,6.928-7.125,9.856l-82.752,82.752c-8.475,8.185-8.71,21.69-0.525,30.165c8.185,8.475,21.69,8.71,30.165,0.525c0.178-0.172,0.353-0.347,0.525-0.525l82.752-82.752c33.313-33.323,33.313-87.339,0-120.661L487.06,195.669z"/>
              <path d="M149.374,469.333h-42.667c-35.346,0-64-28.654-64-64V106.667c0-35.346,28.654-64,64-64h42.667c11.782,0,21.333-9.551,21.333-21.333S161.157,0,149.374,0h-42.667C47.827,0.071,0.112,47.786,0.041,106.667v298.667C0.112,464.214,47.827,511.93,106.708,512h42.667c11.782,0,21.333-9.551,21.333-21.333C170.708,478.885,161.157,469.333,149.374,469.333z"/>
            </svg>
            <span className="text-xs font-medium text-red-600">Exit</span>
          </button>
        </div>
      </div>

      {/* Chat Sheet Overlay */}
      {chatSheetOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-35"
          onClick={() => setChatSheetOpen(false)}
        />
      )}
    </div>
  );
}
