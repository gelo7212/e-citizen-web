'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useSOS } from '@/hooks/useSOS';
import { useRequireAuth } from '@/hooks/useAuth';
import { useScopes } from '@/hooks/useScopes';
import type { NearbySOS, SOSHQ } from '@/lib/services/sosService';
import { getSOSHQByCity, createAnonymousRescuer } from '@/lib/services/sosService';
import SOSMapComponent from '@/components/admin/sos/SOSMap';
import SOSChatBox from '@/components/admin/sos/SOSChatBox';
import SOSDetailModal from '@/components/admin/sos/SOSDetailModal';
import { AssignRescuerModal } from '@/components/admin/sos/AssignRescuerModal';
import { AlertIcon, CheckIcon, LocationIcon, RefreshIcon } from '@/components/admin/sos/SOSIcons';

interface OpenChat {
  sosId: string;
  citizenName: string;
  isMinimized: boolean;
}

export default function SOSMonitorPage() {
  const auth = useRequireAuth();
  const scopes = useScopes();
  const { nearbySOS, fetchNearbySOSRequests, isLoading, error } = useSOS();
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'resolved'>('all');
  const [refreshRate, setRefreshRate] = useState<number>(5);
  const [notification, setNotification] = useState<{ message: string; sosId: string } | null>(null);
  const [openChats, setOpenChats] = useState<Map<string, OpenChat>>(new Map());
  const [selectedSOS, setSelectedSOS] = useState<NearbySOS | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const previousSOSCountRef = useRef<number>(0);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [hqLocation, setHqLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [sosHQs, setSOSHQs] = useState<SOSHQ[]>([]);
  const [selectedHQ, setSelectedHQ] = useState<SOSHQ | null>(null);
  const [correctedNearbySOS, setCorrectedNearbySOS] = useState<(NearbySOS & { distanceKm?: number })[]>([]);
  const [sharingLoading, setSharingLoading] = useState<string | null>(null);
  const [shareLinkSuccess, setShareLinkSuccess] = useState<{ sosId: string; link: string } | null>(null);
  const [selectedSOSForAssignment, setSelectedSOSForAssignment] = useState<string | null>(null);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);

  // Function to play SOS alert sound using Web Audio API
  const playSOSAlert = () => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Create a simple alert beep pattern (3 short beeps)
      const now = audioContext.currentTime;
      const beepDuration = 0.2;
      const beepGap = 0.1;
      const frequency = 800; // Hz
      
      for (let i = 0; i < 3; i++) {
        const startTime = now + (i * (beepDuration + beepGap));
        
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = frequency;
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0.3, startTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + beepDuration);
        
        oscillator.start(startTime);
        oscillator.stop(startTime + beepDuration);
      }
    } catch (err) {
      console.log('Could not play SOS alert:', err);
    }
  };

  // Play sound when there's a new active SOS
  useEffect(() => {
    const currentActiveSOS = nearbySOS.filter((sos) => sos.status === 'active').length;
    
    // Play sound only if there's a NEW active SOS (count increased)
    if (currentActiveSOS > previousSOSCountRef.current && currentActiveSOS > 0) {
      console.log('🔔 SOS Alert! Playing sound...');
      playSOSAlert();
    }
    
    previousSOSCountRef.current = currentActiveSOS;
  }, [nearbySOS]);

  useEffect(() => {
    if (!auth.isAuthenticated) return;

    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        (error) => {
          console.error('Failed to get user location:', error);
          setUserLocation({
            latitude: 14.5995,
            longitude: 120.9842,
          });
        }
      );
    } else {
      setUserLocation({
        latitude: 14.5995,
        longitude: 120.9842,
      });
    }
  }, [auth.isAuthenticated]);

  // Fetch SOS HQs for the current city
  useEffect(() => {
    if (!scopes.cityCode) {
      console.log('City code not available from scopes:', scopes);
      return;
    }

    console.log('Fetching SOS HQs for city:', scopes.cityCode);

    const loadSOSHQs = async () => {
      try {
        const result = await getSOSHQByCity(scopes.cityCode!);
        console.log('HQ fetch result:', result);
        
        if (result.success && result.data) {
          console.log('Setting HQs:', result.data);
          setSOSHQs(result.data);
          // Auto-select the main HQ
          const mainHQ = result.data.find((hq) => hq.isMain && hq.isActive);
          if (mainHQ) {
            console.log('Selected main HQ:', mainHQ);
            setSelectedHQ(mainHQ);
            setHqLocation({
              latitude: mainHQ.location.lat,
              longitude: mainHQ.location.lng,
            });
          } else {
            // If no main HQ, select the first active one
            const activeHQ = result.data.find((hq) => hq.isActive);
            if (activeHQ) {
              console.log('Selected first active HQ:', activeHQ);
              setSelectedHQ(activeHQ);
              setHqLocation({
                latitude: activeHQ.location.lat,
                longitude: activeHQ.location.lng,
              });
            }
          }
        } else {
          console.error('Failed to fetch HQs:', result.error);
        }
      } catch (error) {
        console.error('Error loading HQs:', error);
      }
    };

    loadSOSHQs();
  }, [scopes.cityCode]);

  // Helper function to calculate distance using Haversine formula
  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lng2 - lng1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // returns km
  };

  // Recalculate distances from HQ when nearbySOS or hqLocation changes
  useEffect(() => {
    if (!hqLocation || !nearbySOS.length) {
      setCorrectedNearbySOS(nearbySOS);
      return;
    }

    // Update distances in nearbySOS based on HQ location
    const updatedSOS = nearbySOS.map(sos => {
      if (sos.location?.latitude && sos.location?.longitude) {
        const distanceKm = calculateDistance(
          hqLocation.latitude,
          hqLocation.longitude,
          sos.location.latitude,
          sos.location.longitude
        );
        const sosWithDistance = {
          ...sos,
          distance: distanceKm * 1000, // Store distance in meters for compatibility
          distanceKm: distanceKm // Also store km version
        };
        return sosWithDistance;
      }
      return sos;
    });

    setCorrectedNearbySOS(updatedSOS);

    // Log first SOS distance for debugging
    if (updatedSOS.length > 0) {
      const firstSOS = updatedSOS[0];
      console.log('📏 Distances recalculated from HQ:', {
        hqLocation,
        firstSOS: {
          address: `${firstSOS.address?.barangay}, ${firstSOS.address?.city}`,
          distanceKm: (firstSOS as any).distanceKm,
          distanceM: firstSOS.distance
        }
      });
    }
  }, [hqLocation, nearbySOS]);

  useEffect(() => {
    if (!userLocation) return;

    const loadNearbySOSRequests = async () => {
      // Use HQ coverage radius if available, otherwise default to 120km
      const radius = selectedHQ?.coverageRadiusKm || 120;
      console.log('📡 Fetching nearby SOS with radius:', radius, 'from HQ:', selectedHQ?._id);
      
      await fetchNearbySOSRequests(
        userLocation.longitude,
        userLocation.latitude,
        radius
      );
    };

    loadNearbySOSRequests();
    pollingRef.current = setInterval(loadNearbySOSRequests, refreshRate * 1000);

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, [userLocation, refreshRate, fetchNearbySOSRequests, selectedHQ]);

  const filteredSOS = correctedNearbySOS.filter((sos) => {
    if (filterStatus === 'all') return true;
    return sos.status === (filterStatus as 'active' | 'inactive' | 'resolved');
  });

  const openChat = (sosId: string, citizenName: string) => {
    setOpenChats((prev) => {
      const newChats = new Map(prev);
      if (newChats.has(sosId)) {
        newChats.set(sosId, {
          ...newChats.get(sosId)!,
          isMinimized: false,
        });
      } else {
        newChats.set(sosId, {
          sosId,
          citizenName,
          isMinimized: false,
        });
      }
      return newChats;
    });
  };

  const closeChat = (sosId: string) => {
    setOpenChats((prev) => {
      const newChats = new Map(prev);
      newChats.delete(sosId);
      return newChats;
    });
  };

  const toggleMinimize = (sosId: string) => {
    setOpenChats((prev) => {
      const newChats = new Map(prev);
      const chat = newChats.get(sosId);
      if (chat) {
        newChats.set(sosId, {
          ...chat,
          isMinimized: !chat.isMinimized,
        });
      }
      return newChats;
    });
  };

  const handleShareRescuerLink = async (sosId: string) => {
    try {
      setSharingLoading(sosId);
      
      // Get city code from auth user or selected HQ
      const cityCode = auth.user?.cityCode || selectedHQ?.cityCode || 'default';
      
      const result = await createAnonymousRescuer(sosId, cityCode);
      
      if (result.success && result.data?.token) {
        const token = result.data.token;
        const link = `${window.location.origin}/admin/rescuer/${sosId}?token=${token}`;
        
        // Copy to clipboard
        try {
          await navigator.clipboard.writeText(link);
          setShareLinkSuccess({ sosId, link });
          setNotification({ 
            message: `✓ Rescuer link copied to clipboard!`, 
            sosId 
          });
          setTimeout(() => {
            setShareLinkSuccess(null);
            setNotification(null);
          }, 4000);
        } catch (clipboardError) {
          // If clipboard fails, show the link in notification
          console.error('Clipboard error:', clipboardError);
          setShareLinkSuccess({ sosId, link });
          setNotification({ 
            message: `✓ Link generated: ${link}`, 
            sosId 
          });
          setTimeout(() => {
            setShareLinkSuccess(null);
            setNotification(null);
          }, 5000);
        }
      } else {
        setNotification({ 
          message: `✗ Failed to create rescuer link: ${result.error}`, 
          sosId 
        });
        setTimeout(() => setNotification(null), 3000);
      }
    } catch (err) {
      console.error('Error sharing rescuer link:', err);
      setNotification({ 
        message: `✗ Error creating rescuer link`, 
        sosId 
      });
      setTimeout(() => setNotification(null), 3000);
    } finally {
      setSharingLoading(null);
    }
  };

  const activeSOS = nearbySOS.filter((sos) => sos.status === 'active').length;
  const resolvedSOS = nearbySOS.filter((sos) => sos.status === 'resolved').length;
  const inactiveSOS = nearbySOS.filter((sos) => sos.status === 'inactive').length;

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active':
        return { bg: 'bg-red-100', text: 'text-red-800', badge: 'bg-red-500', badgeBg: 'bg-red-50' };
      case 'inactive':
        return { bg: 'bg-gray-100', text: 'text-gray-800', badge: 'bg-gray-500', badgeBg: 'bg-gray-50' };
      case 'resolved':
        return { bg: 'bg-green-100', text: 'text-green-800', badge: 'bg-green-500', badgeBg: 'bg-green-50' };
      default:
        return { bg: 'bg-gray-100', text: 'text-gray-800', badge: 'bg-gray-500', badgeBg: 'bg-gray-50' };
    }
  };

  if (!scopes.canAccessAdmin) {
    return (
      <div className="p-8 text-center">
        <p className="text-red-600 font-semibold">You don't have access to SOS monitoring.</p>
      </div>
    );
  }

  // Fullscreen View
  if (isFullscreen) {
    return (
      <div className="fixed inset-0 bg-white z-50 flex flex-col">
        {/* Fullscreen Map */}
        <div className="flex-1 relative overflow-hidden">
          {userLocation && (
            <SOSMapComponent
              sosRequests={filteredSOS}
              userLocation={userLocation}
              hqLocation={hqLocation || undefined}
              coverageRadiusKm={selectedHQ?.coverageRadiusKm}
              onMarkerClick={(sos) => {
                const location = `${sos.address?.barangay || 'Unknown Location'}, ${sos.address?.city || ''}`.trim();
                openChat(sos.sosId, `SOS - ${location}`);
              }}
            />
          )}
        </div>

        {/* Exit Fullscreen Button - Top Left */}
        <button
          onClick={() => setIsFullscreen(false)}
          className="fixed top-4 left-4 z-50 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold flex items-center gap-2 shadow-lg"
          title="Exit fullscreen"
        >
          ✕ Exit
        </button>

        {/* SOS Cards - Bottom Right */}
        <div className="fixed bottom-4 right-4 z-50 max-w-sm max-h-96 overflow-y-auto bg-white border border-gray-200 rounded-lg shadow-xl">
          <div className="p-4">
            <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
              <span className="w-2 h-2 bg-red-600 rounded-full animate-pulse"></span>
              Live Incidents ({filteredSOS.length})
            </h3>
            {filteredSOS.length === 0 ? (
              <div className="text-center py-4">
                <CheckIcon className="w-8 h-8 text-green-600 mx-auto mb-2" />
                <p className="text-gray-600 text-sm">All Clear</p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredSOS.map((sos) => {
                  const statusColor = getStatusColor(sos.status);
                  const createdAt = new Date(sos.createdAt);
                  const now = new Date();
                  const timeDiff = Math.floor((now.getTime() - createdAt.getTime()) / 1000);
                  
                  let timeAgo = '';
                  if (timeDiff < 60) {
                    timeAgo = `${timeDiff}s ago`;
                  } else if (timeDiff < 3600) {
                    timeAgo = `${Math.floor(timeDiff / 60)}m ago`;
                  } else {
                    timeAgo = `${Math.floor(timeDiff / 3600)}h ago`;
                  }

                  const distanceKm = ((sos as any).distanceKm || sos.distance! / 1000);
                  const distanceStr = distanceKm < 1
                    ? `${(distanceKm * 1000).toFixed(0)}m`
                    : `${distanceKm.toFixed(1)}km`;

                  return (
                    <div
                      key={sos.sosId}
                      className="p-2 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div>
                          <p className="text-xs font-bold text-gray-900">
                            {sos.address?.barangay || 'Unknown'}
                          </p>
                          <p className="text-xs text-gray-500">{distanceStr} • {timeAgo}</p>
                        </div>
                        <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${statusColor.badgeBg} ${statusColor.text} flex-shrink-0 whitespace-nowrap`}>
                          {sos.status.toUpperCase()}
                        </span>
                      </div>
                      <div className="flex gap-1">
                        <button
                          onClick={() => {
                            const location = `${sos.address?.barangay || 'Unknown Location'}, ${sos.address?.city || ''}`.trim();
                            openChat(sos.sosId, `SOS - ${location}`);
                          }}
                          className="flex-1 px-2 py-1 bg-green-600 hover:bg-green-700 text-white text-xs font-bold rounded transition-all"
                        >
                          Chat
                        </button>
                        <button
                          onClick={() => setSelectedSOS(sos)}
                          className="flex-1 px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded transition-all"
                        >
                          Details
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* SOS Chat Boxes */}
        <div className="fixed bottom-4 right-96 z-40 flex gap-3 flex-wrap justify-end items-end">
          {Array.from(openChats.values()).map((chat) => (
            <SOSChatBox
              key={chat.sosId}
              sosId={chat.sosId}
              citizenName={chat.citizenName}
              isMinimized={chat.isMinimized}
              onClose={() => closeChat(chat.sosId)}
              onMinimize={() => toggleMinimize(chat.sosId)}
            />
          ))}
        </div>

        {selectedSOS && (
          <SOSDetailModal
            sos={selectedSOS}
            onClose={() => setSelectedSOS(null)}
            onOpenChat={() => {
              const location = `${selectedSOS.address?.barangay || 'Unknown Location'}, ${selectedSOS.address?.city || ''}`.trim();
              openChat(selectedSOS.sosId, `SOS - ${location}`);
            }}
          />
        )}
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-white overflow-hidden">
      {/* Main Content Area - Map (No Scroll) */}
      <div className="flex-1 bg-gray-50 flex flex-col overflow-hidden relative">
        <div className="h-full w-full bg-white overflow-hidden">
          {userLocation && (
            <SOSMapComponent
              sosRequests={filteredSOS}
              userLocation={userLocation}
              hqLocation={hqLocation || undefined}
              coverageRadiusKm={selectedHQ?.coverageRadiusKm}
              onMarkerClick={(sos) => {
                const location = `${sos.address?.barangay || 'Unknown Location'}, ${sos.address?.city || ''}`.trim();
                // setNotification({ message: `📍 Chat opened for ${location}`, sosId: sos.sosId });
                openChat(sos.sosId, `SOS - ${location}`);
                setTimeout(() => setNotification(null), 3000);
              }}
            />
          )}
        </div>
        {/* Fullscreen Button */}
        <button
          onClick={() => setIsFullscreen(true)}
          className="absolute top-4 right-4 z-40 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-sm flex items-center gap-2 shadow-lg"
          title="Enter fullscreen mode"
        >
          ⛶ Fullscreen
        </button>
      </div>

      {/* Right Sidebar - Live Command Center Scrollable */}
      <aside className="w-96 bg-white border-l border-gray-200 flex flex-col h-screen overflow-hidden">
        <div className="flex-1 overflow-y-auto">
          {/* HQ Selection */}
          {sosHQs.length > 0 && (
            <div className="px-4 py-3 border-b border-gray-200 bg-white">
              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">HQ</label>
              <select
                value={selectedHQ?._id || ''}
                onChange={(e) => {
                  const hq = sosHQs.find((h) => h._id === e.target.value);
                  if (hq) {
                    setSelectedHQ(hq);
                    setHqLocation({
                      latitude: hq.location.lat,
                      longitude: hq.location.lng,
                    });
                  }
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 bg-white font-medium"
              >
                {sosHQs.map((hq) => (
                  <option key={hq._id} value={hq._id}>
                    {hq.name} {hq.isMain ? '(Main)' : ''}
                  </option>
                ))}
              </select>
              {selectedHQ && (
                <p className="text-xs text-gray-600 mt-1">📍 Coverage: <span className="font-bold text-red-600">{selectedHQ.coverageRadiusKm}km</span></p>
              )}
            </div>
          )}

          {/* KPI Cards - Compact */}
          <div className="grid grid-cols-3 gap-2 px-4 py-2 bg-white border-b border-gray-200">
            <div className="bg-red-50 rounded-lg p-2 border border-red-200">
              <p className="text-xs text-red-600 font-bold uppercase">Active</p>
              <p className="text-2xl font-bold text-red-600">{activeSOS}</p>
            </div>
            <div className="bg-green-50 rounded-lg p-2 border border-green-200">
              <p className="text-xs text-green-600 font-bold uppercase">Resolved</p>
              <p className="text-2xl font-bold text-green-600">{resolvedSOS}</p>
            </div>
            <div className="bg-blue-50 rounded-lg p-2 border border-blue-200">
              <p className="text-xs text-blue-600 font-bold uppercase">Total</p>
              <p className="text-2xl font-bold text-blue-600">{nearbySOS.length}</p>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="px-4 py-2 bg-white border-b border-gray-200">
            <button
              onClick={() => userLocation && fetchNearbySOSRequests(userLocation.longitude, userLocation.latitude, 120)}
              disabled={isLoading}
              className="w-full px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg transition-all font-bold text-sm flex items-center justify-center gap-2"
            >
              <RefreshIcon /> {isLoading ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>

          {/* Status Filter & Refresh Rate - One Line */}
          <div className="px-4 py-2 bg-white border-b border-gray-200">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide block mb-1">Filter</label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value as 'all' | 'active' | 'resolved')}
                  className="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                >
                  <option value="all">All</option>
                  <option value="active">Active</option>
                  <option value="resolved">Resolved</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide block mb-1">Refresh</label>
                <select
                  value={refreshRate}
                  onChange={(e) => setRefreshRate(Number(e.target.value))}
                  className="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                >
                  <option value={2}>2s</option>
                  <option value={5}>5s</option>
                  <option value={10}>10s</option>
                  <option value={30}>30s</option>
                </select>
              </div>
            </div>
          </div>

          {/* Live Incidents - Priority Section */}
          <div className="px-4 py-2 border-b border-gray-200 bg-red-50 sticky top-0 z-10 border-l-4 border-l-red-600">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
                <span className="w-2 h-2 bg-red-600 rounded-full animate-pulse"></span>
                Live Incidents ({filteredSOS.length})
              </h3>
              {isLoading && <span className="text-xs text-blue-600 font-bold text-right">●</span>}
            </div>
          </div>

          <div>
            {error && (
              <div className="p-4 bg-red-50 border-b border-red-200">
                <p className="text-red-700 text-sm font-semibold">⚠️ {error}</p>
              </div>
            )}

            {isLoading && nearbySOS.length === 0 ? (
              <div className="flex items-center justify-center h-40">
                <div className="text-center">
                  <div className="animate-spin text-3xl mb-2">⟳</div>
                  <p className="text-gray-500 text-sm font-medium">Loading incidents...</p>
                </div>
              </div>
            ) : filteredSOS.length === 0 ? (
              <div className="flex items-center justify-center h-40">
                <div className="text-center">
                  <CheckIcon className="w-8 h-8 text-green-600 mx-auto mb-2" />
                  <p className="text-gray-600 text-sm font-semibold">All Clear</p>
                  <p className="text-gray-500 text-xs">No incidents in this view</p>
                </div>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {filteredSOS.map((sos) => {
                  const statusColor = getStatusColor(sos.status);
                  const createdAt = new Date(sos.createdAt);
                  const now = new Date();
                  const timeDiff = Math.floor((now.getTime() - createdAt.getTime()) / 1000);
                  
                  let timeAgo = '';
                  if (timeDiff < 60) {
                    timeAgo = `${timeDiff}s ago`;
                  } else if (timeDiff < 3600) {
                    timeAgo = `${Math.floor(timeDiff / 60)}m ago`;
                  } else {
                    timeAgo = `${Math.floor(timeDiff / 3600)}h ago`;
                  }

                  const distanceKm = ((sos as any).distanceKm || sos.distance! / 1000);
                  const distanceStr = distanceKm < 1
                    ? `${(distanceKm * 1000).toFixed(0)}m`
                    : `${distanceKm.toFixed(1)}km`;

                  return (
                    <div
                      key={sos.sosId}
                      className="p-4 hover:bg-red-50 transition-all border-b border-gray-100 last:border-b-0 hover:shadow-sm hover:border-red-200 cursor-pointer group"
                    >
                      {/* Incident Header */}
                      <div className="flex items-start gap-3 mb-3">
                        <div className={`w-3 h-3 rounded-full ${statusColor.badge} flex-shrink-0 mt-2 ${sos.status === 'active' ? 'animate-pulse' : ''}`}></div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="text-sm font-bold text-gray-900">
                                {sos.address?.barangay || 'Unknown Location'}
                              </p>
                              {sos.address?.city && (
                                <p className="text-xs text-gray-500">{sos.address.city}</p>
                              )}
                            </div>
                            <span className={`text-xs font-bold px-2 py-1 rounded-full ${statusColor.badgeBg} ${statusColor.text} flex-shrink-0 whitespace-nowrap`}>
                              {sos.status.toUpperCase()}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                            <span>📍 {distanceStr}</span>
                            <span>•</span>
                            <span>⏱️ {timeAgo}</span>
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons - Enhanced */}
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            const location = `${sos.address?.barangay || 'Unknown Location'}, ${sos.address?.city || ''}`.trim();
                            openChat(sos.sosId, `SOS - ${location}`);
                          }}
                          className="flex-1 px-3 py-2.5 bg-green-600 hover:bg-green-700 text-white text-xs font-bold rounded-lg transition-all shadow-sm hover:shadow-md flex items-center justify-center gap-1.5 group-hover:scale-105"
                        >
                          💬 Chat
                        </button>
                        <button
                          onClick={() => setSelectedSOS(sos)}
                          className="flex-1 px-3 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-all shadow-sm hover:shadow-md group-hover:scale-105"
                        >
                          📋 Details
                        </button>
                        <button
                          onClick={() => {
                            setSelectedSOSForAssignment(sos.sosId);
                            setIsAssignModalOpen(true);
                          }}
                          className="flex-1 px-3 py-2.5 bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold rounded-lg transition-all shadow-sm hover:shadow-md group-hover:scale-105"
                        >
                          👮 Assign
                        </button>
                        <button
                          onClick={() => handleShareRescuerLink(sos.sosId)}
                          disabled={sharingLoading === sos.sosId}
                          className="flex-1 px-3 py-2.5 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white text-xs font-bold rounded-lg transition-all shadow-sm hover:shadow-md group-hover:scale-105 flex items-center justify-center gap-1.5"
                        >
                          {sharingLoading === sos.sosId ? (
                            <>
                              <span className="animate-spin">⟳</span>
                              Sharing...
                            </>
                          ) : (
                            <>
                              🔗 Share
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* SOS Chat Boxes */}
      <div className="fixed bottom-4 right-4 z-40 flex gap-3 flex-wrap justify-end items-end">
        {Array.from(openChats.values()).map((chat) => (
          <SOSChatBox
            key={chat.sosId}
            sosId={chat.sosId}
            citizenName={chat.citizenName}
            isMinimized={chat.isMinimized}
            onClose={() => closeChat(chat.sosId)}
            onMinimize={() => toggleMinimize(chat.sosId)}
          />
        ))}
      </div>
      {notification && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 animate-in fade-in slide-in-from-top-2">
          <div className="bg-blue-600 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-2">
            <span className="text-xl">✓</span>
            <span className="font-medium">{notification.message}</span>
          </div>
        </div>
      )}

      {selectedSOS && (
        <SOSDetailModal
          sos={selectedSOS}
          onClose={() => setSelectedSOS(null)}
          onOpenChat={() => {
            const location = `${selectedSOS.address?.barangay || 'Unknown Location'}, ${selectedSOS.address?.city || ''}`.trim();
            // setNotification({ message: `💬 Chat opened for ${location}`, sosId: selectedSOS.sosId });
            openChat(selectedSOS.sosId, `SOS - ${location}`);
            setTimeout(() => setNotification(null), 3000);
          }}
        />
      )}

      {/* Assign Rescuer Modal */}
      {selectedSOSForAssignment && (
        <AssignRescuerModal
          sosId={selectedSOSForAssignment}
          isOpen={isAssignModalOpen}
          onClose={() => {
            setIsAssignModalOpen(false);
            setSelectedSOSForAssignment(null);
          }}
          onSuccess={() => {
            setNotification({
              message: '✓ Rescuer assigned successfully!',
              sosId: selectedSOSForAssignment,
            });
            setTimeout(() => setNotification(null), 3000);
          }}
        />
      )}
    </div>
  );
}
