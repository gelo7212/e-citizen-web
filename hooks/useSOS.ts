'use client';

import { useState, useCallback } from 'react';
import {
  SOSRequest,
  SOSMessage,
  SendMessagePayload,
  MessagesResponse,
  NearbySOS,
  Rescuer,
  getSOSRequestById,
  getUserSOSRequests,
  getActiveCitizenSOS,
  getNearbySOSRequests,
  updateSOSTag,
  closeSOSRequest,
  sendSOSMessage,
  getSOSMessages,
  getSOSMessageById,
  getRescuers,
  dispatchRescue,
} from '@/lib/services/sosService';

interface UseSOSState {
  sosRequest: SOSRequest | null;
  sosRequests: SOSRequest[];
  nearbySOS: NearbySOS[];
  messages: SOSMessage[];
  rescuers: Rescuer[];
  isLoading: boolean;
  error: string | null;
}

/**
 * Hook for managing SOS operations in components
 * Handles fetching, updating, and messaging for SOS requests
 */
export function useSOS() {
  const [state, setState] = useState<UseSOSState>({
    sosRequest: null,
    sosRequests: [],
    nearbySOS: [],
    messages: [],
    rescuers: [],
    isLoading: false,
    error: null,
  });

  const setLoading = useCallback((isLoading: boolean) => {
    setState(prev => ({ ...prev, isLoading }));
  }, []);

  const setError = useCallback((error: string | null) => {
    setState(prev => ({ ...prev, error }));
  }, []);

  // =========================================================================
  // SOS REQUEST OPERATIONS
  // =========================================================================

  /**
   * Fetch a specific SOS request by ID
   */
  const fetchSOSRequest = useCallback(async (sosId: string) => {
    setLoading(true);
    setError(null);
    try {
      const result = await getSOSRequestById(sosId);
      if (result.success && result.data) {
        setState(prev => ({ ...prev, sosRequest: result.data, isLoading: false }));
      } else {
        setError(result.error || 'Failed to fetch SOS request');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Fetch all SOS requests for a user
   */
  const fetchUserSOSRequests = useCallback(async (userId: string) => {
    setLoading(true);
    setError(null);
    try {
      const result = await getUserSOSRequests(userId);
      if (result.success && result.data) {
        setState(prev => ({ ...prev, sosRequests: result.data, isLoading: false }));
      } else {
        setError(result.error || 'Failed to fetch user SOS requests');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Fetch active SOS requests for a citizen
   */
  const fetchActiveCitizenSOS = useCallback(async (userId: string, cityCode?: string) => {
    setLoading(true);
    setError(null);
    try {
      const result = await getActiveCitizenSOS(userId, cityCode);
      if (result.success && result.data) {
        setState(prev => ({ ...prev, sosRequests: result.data, isLoading: false }));
      } else {
        setError(result.error || 'Failed to fetch active SOS requests');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Fetch nearby SOS requests by coordinates
   */
  const fetchNearbySOSRequests = useCallback(
    async (latitude: number, longitude: number, radius: number = 120) => {
      setLoading(true);
      setError(null);
      try {
        const result = await getNearbySOSRequests(latitude, longitude, radius);
        if (result.success && result.data) {
          setState(prev => ({ ...prev, nearbySOS: result.data, isLoading: false }));
        } else {
          setError(result.error || 'Failed to fetch nearby SOS requests');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    },
    []
  );

  /**
   * Update SOS tag/label
   */
  const updateTag = useCallback(async (sosId: string, tag: string) => {
    setLoading(true);
    setError(null);
    try {
      const result = await updateSOSTag(sosId, tag);
      if (result.success && result.data) {
        setState(prev => ({ ...prev, sosRequest: result.data, isLoading: false }));
        return true;
      } else {
        setError(result.error || 'Failed to update SOS tag');
        return false;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Close an SOS request
   */
  const closeSOS = useCallback(async (sosId: string) => {
    setLoading(true);
    setError(null);
    try {
      const result = await closeSOSRequest(sosId);
      if (result.success && result.data) {
        setState(prev => ({ ...prev, sosRequest: result.data, isLoading: false }));
        return true;
      } else {
        setError(result.error || 'Failed to close SOS request');
        return false;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  // =========================================================================
  // MESSAGE OPERATIONS
  // =========================================================================

  /**
   * Send a message to SOS conversation
   */
  const sendMessage = useCallback(async (sosId: string, payload: SendMessagePayload) => {
    setLoading(true);
    setError(null);
    try {
      const result = await sendSOSMessage(sosId, payload);
      if (result.success && result.data) {
        setState(prev => ({
          ...prev,
          messages: [...(Array.isArray(prev.messages) ? prev.messages : []), result.data],
          isLoading: false,
        }));
        return result.data;
      } else {
        setError(result.error || 'Failed to send message');
        return null;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Fetch all messages for an SOS request
   */
  const fetchMessages = useCallback(async (sosId: string, skip: number = 0, limit: number = 50) => {
    setLoading(true);
    setError(null);
    try {
      const result = await getSOSMessages(sosId, skip, limit);
      if (result.success && result.data) {
        setState(prev => ({ ...prev, messages: result.data.data, isLoading: false }));
      } else {
        setError(result.error || 'Failed to fetch messages');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Fetch a specific message by ID
   */
  const fetchMessageById = useCallback(async (messageId: string) => {
    setLoading(true);
    setError(null);
    try {
      const result = await getSOSMessageById(messageId);
      if (result.success && result.data) {
        setState(prev => ({
          ...prev,
          messages: [result.data],
          isLoading: false,
        }));
        return result.data;
      } else {
        setError(result.error || 'Failed to fetch message');
        return null;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // =========================================================================
  // RESCUER DISPATCH OPERATIONS
  // =========================================================================

  /**
   * Fetch all available rescuers
   */
  const fetchRescuers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getRescuers();
      if (result.success && result.data) {
        setState(prev => ({ ...prev, rescuers: result.data, isLoading: false }));
        return result.data;
      } else {
        setError(result.error || 'Failed to fetch rescuers');
        return null;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Dispatch a rescue to a specific rescuer
   */
  const assignRescuer = useCallback(async (sosId: string, rescuerId: string) => {
    setLoading(true);
    setError(null);
    try {
      const result = await dispatchRescue(sosId, rescuerId);
      if (result.success) {
        setError(null);
        return true;
      } else {
        setError(result.error || 'Failed to dispatch rescue');
        return false;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    ...state,
    setLoading,
    setError,
    // SOS Request operations
    fetchSOSRequest,
    fetchUserSOSRequests,
    fetchActiveCitizenSOS,
    fetchNearbySOSRequests,
    updateTag,
    closeSOS,
    // Message operations
    sendMessage,
    fetchMessages,
    fetchMessageById,
    // Rescuer dispatch operations
    fetchRescuers,
    assignRescuer,
  };
}
