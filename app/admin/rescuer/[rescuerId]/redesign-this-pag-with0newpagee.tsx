'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams, useParams, useRouter } from 'next/navigation';
import { useSOSSocket, LocationBroadcast, MessageBroadcast, ParticipantEvent } from '@/hooks/useSOSSocket';
import { useSOSParticipants } from '@/hooks/useSOSParticipants';
import RescuerMap from '@/components/admin/rescuer/RescuerMap';
import { ParticipantsList } from '@/components/admin/rescuer/ParticipantsList';

/**
 * Anonymous Rescuer Page
 * 
 * This page allows anonymous rescuers to track incidents in real-time using a shared link.
 * 
 * URL Format: /admin/rescuer/[sosId]?token=<jwt_token>
 * 
 * The token should contain:
 * - userId: rescuer identifier
 * - role: 'RESCUER'
 * - sosId: incident ID
 * 
 * Features:
 * - Real-time location tracking on Mapbox
 * - Participant list
 * - Message feed
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

export default function AnonymousRescuerPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const rescuerId = params.rescuerId as string;
  const token = searchParams.get('token') || '';

  const [sosId, setSosId] = useState<string>('');
  const [isConnected, setIsConnected] = useState(false);
  const [locations, setLocations] = useState<Map<string, RescuerLocation>>(new Map());
  const [participants, setParticipants] = useState<Map<string, Participant>>(new Map());
  const [messages, setMessages] = useState<MessageBroadcast[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [decodedToken, setDecodedToken] = useState<any>(null);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isValidatingToken, setIsValidatingToken] = useState(true);
  const [rescuerLocation, setRescuerLocation] = useState<RescuerLocation | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [messageInput, setMessageInput] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [inputFocused, setInputFocused] = useState(false);
  const [mapViewType, setMapViewType] = useState<'map' | 'street'>('map');
  
  // Participation acceptance states
  const [checkingParticipation, setCheckingParticipation] = useState(false);
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
      // Use small delay to ensure DOM is updated
      const timer = setTimeout(scrollToBottom, 0);
      return () => clearTimeout(timer);
    }
  }, [messages]);

  // Initialize map
  useEffect(() => {
    if (!token) {
      setError('❌ No authentication token provided');
      setIsAuthenticated(false);
      setIsValidatingToken(false);
      return;
    }

    // Helper function to decode JWT payload with proper base64url handling
    const decodeJWT = (jwtToken: string) => {
      try {
        const parts = jwtToken.split('.');
        if (parts.length !== 3) {
          throw new Error('Invalid token format - must have 3 parts (header.payload.signature)');
        }

        // Decode payload - convert base64url to base64
        let payload = parts[1];
        
        // Convert base64url to base64
        // Replace - with +, _ with /
        payload = payload.replace(/-/g, '+').replace(/_/g, '/');
        
        // Add padding if needed
        const padding = 4 - (payload.length % 4);
        if (padding !== 4) {
          payload += '='.repeat(padding);
        }

        // Decode and parse
        const decoded = JSON.parse(atob(payload));
        return decoded;
      } catch (err) {
        throw new Error(`Failed to decode JWT: ${err instanceof Error ? err.message : 'Invalid token'}`);
      }
    };

    try {
      const decoded = decodeJWT(token);
      
      console.log('🔐 Token decoded successfully:', {
        userId: decoded.userId || decoded.actor?.type,
        role: decoded.identity?.role || decoded.role,
        sosId: decoded.mission?.sosId || decoded.sosId,
        iss: decoded.iss,
      });

      // Extract role from token - handle both token formats
      const role = decoded.identity?.role || decoded.role;
      
      // Validate token has RESCUER role
      if (role !== 'RESCUER') {
        console.warn('⚠️ User does not have RESCUER role:', role);
        setError(`❌ Not authenticated as rescuer. Role: ${role || 'unknown'}`);
        setIsAuthenticated(false);
        setIsValidatingToken(false);
        
        // Redirect to citizen portal after 2 seconds
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
        // Fall back to using rescuerId as sosId
        setSosId(rescuerId);
        console.warn('⚠️ Token does not contain sosId, using rescuerId:', rescuerId);
      }
    } catch (err) {
      console.error('❌ Error decoding token:', err);
      setError(`Failed to decode token: ${err instanceof Error ? err.message : 'Invalid token'}`);
      setIsAuthenticated(false);
      
      // Redirect to citizen portal after 2 seconds
      setTimeout(() => {
        console.log('🔄 Redirecting to citizen portal...');
        router.push('/citizen/home');
      }, 2000);
    } finally {
      setIsValidatingToken(false);
    }
  }, [token, rescuerId, router]);

  // Initialize participants hook
  const { participants: hookParticipants } = useSOSParticipants({
    sosId,
    token,
    enabled: !!sosId && !!token,
  });

  // Sync hook participants to local state for real-time updates
  useEffect(() => {
    if (hookParticipants && hookParticipants.length > 0) {
      setParticipants(prev => {
        const updated = new Map(prev);
        hookParticipants.forEach(p => {
          // Only add if not already in map (WebSocket will update with real-time events)
          if (!updated.has(p.userId)) {
            updated.set(p.userId, {
              userId: p.userId,
              displayName: `${p.userType.charAt(0).toUpperCase()}${p.userId.slice(-4)}`,
              role: p.userType === 'admin' ? 'SOS_ADMIN' : p.userType === 'rescuer' ? 'RESCUER' : 'CITIZEN',
              joinedAt: new Date(p.joinedAt).getTime(),
            });
          }
        });
        return updated;
      });
    }
  }, [hookParticipants]);

  // Setup WebSocket connection
  const { socket, isConnected: wsConnected } = useSOSSocket({
    token,
    sosId,
    enabled: !!token && !!sosId && isAuthenticated === true,
    onLocationUpdate: (data: LocationBroadcast) => {
      console.log('📍 Location update:', data);
      
      // Get user role from participants map
      const participant = participants.get(data.userId);
      const userRole = participant?.role || 'RESCUER';
      
      setLocations(prev => new Map(prev).set(data.userId, {
        userId: data.userId,
        latitude: data.latitude,
        longitude: data.longitude,
        accuracy: data.accuracy,
        timestamp: data.timestamp,
        deviceId: data.deviceId,
        userRole: userRole as 'RESCUER' | 'CITIZEN' | 'SOS_ADMIN',
      }));
    },
    onMessageBroadcast: (data: MessageBroadcast) => {
      console.log('💬 Message received:', data);
      setMessages(prev => [...prev, data]);
    },
    onParticipantJoined: (data: ParticipantEvent) => {
      console.log('👤 Participant joined:', data);
      setParticipants(prev => new Map(prev).set(data.userId, {
        userId: data.userId,
        displayName: data.displayName,
        role: data.userRole,
        joinedAt: data.timestamp,
      }));
    },
    onParticipantLeft: (data: ParticipantEvent) => {
      console.log('👤 Participant left:', data);
      setParticipants(prev => {
        const updated = new Map(prev);
        updated.delete(data.userId);
        return updated;
      });
    },
    onError: (err) => {
      console.error('❌ WebSocket error:', err);
      setError(err.message || 'Connection error');
    },
  });

  // Update WebSocket connection state
  useEffect(() => {
    setIsConnected(wsConnected);
  }, [wsConnected]);

  // Get rescuer's own geolocation
  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation not supported');
      console.warn('⚠️ Geolocation not supported in this browser');
      return;
    }

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

        setLocationError(null);
        console.log('📍 Rescuer location updated:', { latitude, longitude, accuracy });
      },
      (error) => {
        console.error('❌ Geolocation error:', error.message);
        setLocationError(error.message);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, [rescuerId]);

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
          // Add citizen's initial location if not already in locations map
          setLocations(prev => {
            const updated = new Map(prev);
            if (!updated.has(sosData.citizenId)) {
              updated.set(sosData.citizenId, {
                userId: sosData.citizenId,
                latitude: sosData.location.latitude,
                longitude: sosData.location.longitude,
                accuracy: sosData.location.accuracy,
                timestamp: sosData.lastLocationUpdate,
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

  // Handle exit participation
  const handleExitParticipation = async () => {
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
        // Redirect to citizen home after successful exit
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

  // Load historical messages from API
  useEffect(() => {
    if (!sosId || isAuthenticated !== true || !token) return;

    const loadMessages = async () => {
      setLoadingMessages(true);
      try {
        // Make authenticated request with rescuer's token
        const bffUrl = process.env.NEXT_PUBLIC_API_BASE || 'http://admin.localhost';
        const url = `${bffUrl}/api/sos/${sosId}/messages?skip=0&limit=50`;

        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`, // Use rescuer's URL token
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
  }, [sosId, isAuthenticated, token]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Send message handler
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
        cityId: decodedToken?.cityId || '', // Use cityId from token if available
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

      // Clear input on success
      setMessageInput('');
      console.log('✓ Message sent successfully');
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSendingMessage(false);
    }
  };

  // Show loading screen while validating
  if (isValidatingToken) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin mb-4">
            <svg className="w-16 h-16 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <p className="text-gray-700 font-semibold text-lg">Validating rescuer credentials...</p>
          <p className="text-gray-500 text-sm mt-2">Please wait</p>
        </div>
      </div>
    );
  }

  // Show error and redirect message if not authenticated
  if (isAuthenticated === false) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-red-100">
        <div className="text-center max-w-md">
          <div className="mb-4">
            <svg className="w-16 h-16 text-red-600 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-red-900 mb-2">Not Authenticated</h1>
          <p className="text-red-800 mb-4">
            {error || 'Invalid or missing authentication credentials'}
          </p>
          <div className="bg-red-200 border-l-4 border-red-600 p-3 rounded mb-4">
            <p className="text-sm text-red-900">
              <span className="font-semibold">Why?</span> Your token either doesn't have rescuer privileges or is invalid.
            </p>
          </div>
          <p className="text-gray-600 text-sm mb-4">
            Redirecting to citizen portal in 2 seconds...
          </p>
          <button
            onClick={() => router.push('/citizen/home')}
            className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors"
          >
            Go to Citizen Portal Now
          </button>
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
            <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded mb-4 text-sm">
              ⚠️ {acceptError}
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={() => {
                setShowAcceptDialog(false);
                router.push('/citizen/home');
              }}
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
              {acceptingParticipation ? '⏳ Accepting...' : '✅ Accept & Enter'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-screen flex flex-col bg-slate-50">
      {/* Header - Professional & Minimal */}
      <div className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-full mx-auto px-4 py-2.5 sm:py-3">
          {/* Top Row */}
          <div className="flex justify-between items-start mb-2 sm:mb-0">
            <div className="flex-1">
              <h1 className="text-base sm:text-lg font-bold text-slate-900">Response Operation</h1>
              <p className="text-xs text-slate-500 mt-0.5 font-mono">
                Incident {rescuerId.slice(0, 8)}
              </p>
            </div>

            {/* Status Badges - Mobile Optimized */}
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 items-end sm:items-center">
              {/* Connection Status */}
              <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-medium ${
                isConnected 
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                  : 'bg-amber-50 text-amber-700 border border-amber-200'
              }`}>
                <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500' : 'bg-amber-500'} ${isConnected ? '' : 'animate-pulse'}`} />
                {isConnected ? 'Connected' : 'Offline'}
              </div>

              {/* Participant Count Badge */}
              <div className="bg-slate-100 text-slate-700 px-2.5 py-1.5 rounded text-xs font-medium border border-slate-200 flex items-center gap-1.5">
                <span className="font-semibold">{participants.size}</span>
                <span>on scene</span>
              </div>
            </div>
          </div>

          {/* Bottom Row - Actions (Desktop) */}
          <div className="hidden sm:flex justify-end gap-2 mt-2">
            {isAlreadyParticipant && (
              <button
                onClick={handleExitParticipation}
                disabled={isExiting}
                title="Exit from this operation"
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 disabled:bg-slate-50 text-slate-700 font-medium text-xs rounded transition-colors flex items-center gap-1.5 border border-slate-300"
              >
                {isExiting ? (
                  <>
                    <span className="animate-spin">↻</span>
                    Leaving...
                  </>
                ) : (
                  <>
                    Exit
                  </>
                )}
              </button>
            )}
          </div>

          {/* Exit Error Message */}
          {exitError && (
            <div className="mt-2 sm:mt-0 bg-red-50 border border-red-200 text-red-700 px-3 py-1.5 rounded text-xs">
              {exitError}
            </div>
          )}
        </div>
      </div>

      {/* Main Content - True Mobile First */}
      <div className="flex-1 flex flex-col overflow-hidden gap-0">
        {/* Map Section - Primary Focus */}
        <div className="flex-1 min-h-96 sm:min-h-0 bg-white overflow-hidden relative">
          {/* Location permission warning */}
          {locationError && (
            <div className="absolute top-3 left-3 right-3 bg-amber-50 border border-amber-300 text-amber-800 px-3 py-2 rounded text-xs z-20 font-medium shadow">
              <p className="font-semibold">Location access required</p>
              <p className="text-xs mt-0.5 opacity-80">{locationError}</p>
            </div>
          )}

          {/* Map View Toggle Buttons */}
          <div className="absolute bottom-4 right-4 z-10 flex flex-col gap-1.5">
            {/* View Type Toggle */}
            <div className="flex gap-1 bg-white rounded shadow border border-slate-200 p-0.5">
              <button
                onClick={() => setMapViewType('map')}
                className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                  mapViewType === 'map'
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
                }`}
                title="Satellite/Map view"
              >
                Map
              </button>
              <button
                onClick={() => setMapViewType('street')}
                className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                  mapViewType === 'street'
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
                }`}
                title="Street view"
              >
                Street
              </button>
            </div>

            {/* Google Maps Buttons */}
            {(rescuerLocation || locations.size > 0) && (
              <div className="flex flex-col gap-1 bg-white rounded shadow border border-slate-200 p-1">
                <button
                  onClick={() => {
                    const targetLoc = rescuerLocation || Array.from(locations.values())[0];
                    if (targetLoc) {
                      window.open(
                        `https://www.google.com/maps/search/?api=1&query=${targetLoc.latitude},${targetLoc.longitude}`,
                        '_blank'
                      );
                    }
                  }}
                  className="px-2 py-1 rounded text-xs font-medium bg-slate-50 text-slate-700 hover:bg-slate-100 transition-colors text-left"
                  title="Open in Google Maps"
                >
                  <div className="font-semibold">Google Maps</div>
                </button>
                <button
                  onClick={() => {
                    const targetLoc = rescuerLocation || Array.from(locations.values())[0];
                    if (targetLoc) {
                      window.open(
                        `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${targetLoc.latitude},${targetLoc.longitude}`,
                        '_blank'
                      );
                    }
                  }}
                  className="px-2 py-1 rounded text-xs font-medium bg-slate-50 text-slate-700 hover:bg-slate-100 transition-colors text-left"
                  title="Open in Google Street View"
                >
                  <div className="font-semibold">Street View</div>
                </button>
              </div>
            )}
            </div>

          <RescuerMap 
            locations={rescuerLocation ? [rescuerLocation, ...Array.from(locations.values())] : Array.from(locations.values())}
            viewType={mapViewType}
          />
        </div>

        {/* Info Panels - Below map on mobile, visible as needed */}
        <div className="hidden sm:flex flex-1 gap-4 p-4 overflow-hidden">
          {/* Locations Panel */}
          <div className="flex-1 bg-white rounded-lg overflow-hidden flex flex-col border-l-2 border-blue-500 shadow-sm">
            <div className="bg-slate-50 px-4 py-3 border-b border-slate-200">
              <h2 className="text-sm font-semibold text-slate-900">Positions</h2>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {rescuerLocation && (
                <div className="bg-blue-50 p-3 rounded border border-blue-200">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-semibold text-slate-900 text-xs">Your Location</p>
                    {rescuerLocation.accuracy < 100 && (
                      <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded font-medium">Accurate</span>
                    )}
                  </div>
                  <p className="text-xs text-slate-700 font-mono">
                    {rescuerLocation.latitude.toFixed(5)}, {rescuerLocation.longitude.toFixed(5)}
                  </p>
                  <p className="text-xs text-slate-600 mt-1">
                    ±{rescuerLocation.accuracy.toFixed(0)}m
                  </p>
                </div>
              )}
              {locations.size === 0 ? (
                <div className="flex items-center justify-center h-full text-slate-500 text-xs">
                  <p>{rescuerLocation ? 'Awaiting updates...' : 'No positions available'}</p>
                </div>
              ) : (
                Array.from(locations.values()).map(loc => (
                  <div
                    key={loc.userId}
                    className="bg-slate-50 p-3 rounded border border-slate-200 hover:border-slate-300 transition-colors"
                  >
                    <p className="font-semibold text-slate-900 text-xs">{loc.userId.slice(-6)}</p>
                    <p className="text-xs text-slate-600 font-mono mt-1">
                      {loc.latitude.toFixed(5)}, {loc.longitude.toFixed(5)}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      ±{loc.accuracy.toFixed(0)}m • {new Date(loc.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Participants Panel */}
          <ParticipantsList
            sosId={sosId}
            token={token}
            currentUserId={decodedToken?.identity?.userId || decodedToken?.userId || rescuerId}
            onError={(error) => console.error('Participants error:', error)}
            className="flex-1 bg-white rounded-lg overflow-hidden border-l-2 border-purple-500 shadow-sm"
          />
        </div>
      </div>

      {/* Message Feed - Bottom Sheet Style */}
      <div className={`bg-white border-t border-slate-200 flex flex-col overflow-hidden transition-all duration-300 ${inputFocused ? 'h-72 sm:h-80' : 'h-40 sm:h-48'}`}>
        {/* Header */}
        <div className="px-4 py-2.5 border-b border-slate-200 bg-slate-50 flex-shrink-0">
          <h3 className="text-xs font-semibold text-slate-900 flex items-center gap-2">
            Communications
            {loadingMessages && <span className="text-xs text-slate-500 animate-pulse">(Loading)</span>}
            {messages.length > 0 && <span className="text-xs bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded font-semibold">{messages.length}</span>}
          </h3>
        </div>

        {/* Messages Container */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-white">
          {loadingMessages && messages.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="animate-spin mb-2">
                  <svg className="w-4 h-4 text-slate-400 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </div>
                <p className="text-slate-500 text-xs">Loading...</p>
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
                const currentUserId = decodedToken?.identity?.userId || decodedToken?.userId;
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
                  avatarBg = 'bg-emerald-600';
                  justifyClass = 'justify-start';
                } else if (msg.senderType === 'SOS_ADMIN') {
                  bubbleColor = 'bg-amber-100';
                  textColor = 'text-amber-900';
                  avatarBg = 'bg-amber-600';
                  justifyClass = 'justify-start';
                }

                const senderName = msg.senderDisplayName || msg.senderId || 'User';
                const firstLetter = senderName.charAt(0).toUpperCase();

                const timeStr = new Date(msg.timestamp || msg.createdAt).toLocaleTimeString([], { 
                  hour: '2-digit', 
                  minute: '2-digit'
                });

                return (
                  <div 
                    key={`msg-${idx}-${msg.id}`}
                    className={`flex ${justifyClass} gap-2 items-end`}
                  >
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
        <div className="border-t border-slate-200 bg-white p-3 flex-shrink-0">
          <form onSubmit={handleSendMessage} className="flex gap-2">
            <input
              type="text"
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              onFocus={() => setInputFocused(true)}
              onBlur={() => setInputFocused(false)}
              placeholder="Message..."
              disabled={sendingMessage || !isConnected}
              className="flex-1 px-3 py-2 text-sm border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-slate-100 disabled:text-slate-500 disabled:border-slate-200 placeholder-slate-400"
            />
            <button
              type="submit"
              disabled={sendingMessage || !isConnected || !messageInput.trim()}
              className="px-3 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors"
            >
              {sendingMessage ? 'Sending' : 'Send'}
            </button>
          </form>
        </div>
      </div>

      {/* Mobile Bottom Action Bar */}
      {isAlreadyParticipant && (
        <div className="sm:hidden bg-white border-t border-slate-200 p-2 shadow-sm">
          <button
            onClick={handleExitParticipation}
            disabled={isExiting}
            title="Exit from this operation"
            className="w-full px-4 py-2 bg-slate-100 hover:bg-slate-200 disabled:bg-slate-50 text-slate-700 font-medium text-xs rounded transition-colors flex items-center justify-center gap-2 border border-slate-300"
          >
            {isExiting ? (
              <>
                <span className="animate-spin">↻</span>
                Leaving...
              </>
            ) : (
              <>
                Exit
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
