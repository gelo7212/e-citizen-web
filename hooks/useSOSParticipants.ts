import { useState, useCallback, useEffect } from 'react';

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

interface UseSOSParticipantsOptions {
  sosId: string;
  token: string;
  enabled?: boolean;
}

export const useSOSParticipants = ({
  sosId,
  token,
  enabled = true,
}: UseSOSParticipantsOptions) => {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const bffUrl = process.env.NEXT_PUBLIC_API_BASE || 'http://admin.localhost';

  /**
   * Fetch active participants for a SOS
   */
  const fetchActive = useCallback(async () => {
    if (!enabled || !sosId || !token) return;

    setLoading(true);
    setError(null);
    try {
      const url = `${bffUrl}/api/sos/${sosId}/participants/active`;
      console.log('🔄 Fetching participants from:', url);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch active participants: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('📊 Participants response:', data);
      
      if (data.success) {
        const participantsList = data.data || [];
        console.log('✅ Loaded', participantsList.length, 'participants');
        setParticipants(participantsList);
      } else {
        setError(data.error || 'Failed to fetch participants');
        console.error('❌ API returned success=false:', data.error);
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Error fetching participants';
      setError(errorMsg);
      console.error('❌ Error fetching active participants:', errorMsg);
    } finally {
      setLoading(false);
    }
  }, [sosId, token, enabled, bffUrl]);

  /**
   * Fetch participant history (all participants, active and inactive)
   */
  const fetchHistory = useCallback(async () => {
    if (!enabled || !sosId || !token) return [];

    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `${bffUrl}/api/sos/${sosId}/participants/history`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch participant history: ${response.statusText}`);
      }

      const data = await response.json();
      if (data.success) {
        return data.data || [];
      } else {
        setError(data.error || 'Failed to fetch history');
        return [];
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Error fetching history';
      setError(errorMsg);
      console.error('❌ Error fetching participant history:', errorMsg);
      return [];
    } finally {
      setLoading(false);
    }
  }, [sosId, token, enabled, bffUrl]);

  /**
   * Join a SOS as a participant
   */
  const join = useCallback(
    async (userType?: string) => {
      if (!sosId || !token) {
        setError('Missing sosId or token');
        return null;
      }

      setLoading(true);
      setError(null);
      try {
        const response = await fetch(
          `${bffUrl}/api/sos/${sosId}/participants/join`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ userType:userType.toLocaleLowerCase() }),
          }
        );

        if (!response.ok) {
          throw new Error(`Failed to join SOS: ${response.statusText}`);
        }

        const data = await response.json();
        if (data.success) {
          // Refresh participants list
          await fetchActive();
          return data.data;
        } else {
          setError(data.error || 'Failed to join SOS');
          return null;
        }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Error joining SOS';
        setError(errorMsg);
        console.error('❌ Error joining SOS:', errorMsg);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [sosId, token, bffUrl, fetchActive]
  );

  /**
   * Leave a SOS
   */
  const leave = useCallback(
    async (userId: string) => {
      if (!sosId || !token) {
        setError('Missing sosId or token');
        return false;
      }

      setLoading(true);
      setError(null);
      try {
        const response = await fetch(
          `${bffUrl}/api/sos/${sosId}/participants/${userId}/leave`,
          {
            method: 'PATCH',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          }
        );

        if (!response.ok) {
          throw new Error(`Failed to leave SOS: ${response.statusText}`);
        }

        const data = await response.json();
        if (data.success) {
          // Refresh participants list
          await fetchActive();
          return true;
        } else {
          setError(data.error || 'Failed to leave SOS');
          return false;
        }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Error leaving SOS';
        setError(errorMsg);
        console.error('❌ Error leaving SOS:', errorMsg);
        return false;
      } finally {
        setLoading(false);
      }
    },
    [sosId, token, bffUrl, fetchActive]
  );

  /**
   * Check if user is actively participating in SOS
   */
  const checkActive = useCallback(
    async (userId: string): Promise<boolean> => {
      if (!sosId || !token) {
        setError('Missing sosId or token');
        return false;
      }

      try {
        const response = await fetch(
          `${bffUrl}/api/sos/${sosId}/participants/${userId}/check`,
          {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          }
        );

        if (!response.ok) {
          throw new Error(`Failed to check participation: ${response.statusText}`);
        }

        const data = await response.json();
        return data.success && data.data?.isActive === true;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Error checking participation';
        console.error('❌ Error checking participation:', errorMsg);
        return false;
      }
    },
    [sosId, token, bffUrl]
  );

  /**
   * Get user's participation history across all SOS
   */
  const getUserHistory = useCallback(
    async (userId: string): Promise<Participant[]> => {
      if (!sosId || !token) {
        setError('Missing sosId or token');
        return [];
      }

      try {
        const response = await fetch(
          `${bffUrl}/api/sos/${sosId}/participants/user/${userId}/history`,
          {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          }
        );

        if (!response.ok) {
          throw new Error(`Failed to fetch user history: ${response.statusText}`);
        }

        const data = await response.json();
        return data.success ? data.data || [] : [];
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Error fetching user history';
        console.error('❌ Error fetching user history:', errorMsg);
        return [];
      }
    },
    [sosId, token, bffUrl]
  );

  /**
   * Auto-load participants on mount or when sosId/token changes
   */
  useEffect(() => {
    if (enabled && sosId && token) {
      fetchActive();
    }
  }, [sosId, token, enabled, fetchActive]);

  return {
    participants,
    loading,
    error,
    fetchActive,
    fetchHistory,
    join,
    leave,
    checkActive,
    getUserHistory,
  };
};
