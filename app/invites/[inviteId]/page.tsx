'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { validateInvite, acceptInvite } from '@/lib/api/endpoints';
import { refreshAccessToken } from '@/lib/services/authService';
import { useAuth } from '@/hooks/useAuth';
import { Alert } from '@/components/shared/Alert';
import { Card } from '@/components/shared/Card';
import { ValidateInviteResponse, AcceptInviteResponse, JWTClaims } from '@/types';

export default function AcceptInvitePage() {
  const params = useParams();
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const inviteId = params?.inviteId as string;

  const [inviteData, setInviteData] = useState<ValidateInviteResponse | null>(null);
  const [isValidating, setIsValidating] = useState(true);
  const [code, setCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<AcceptInviteResponse | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Check authentication status and handle redirects
  useEffect(() => {
    if (authLoading) return; // Wait for auth to load

    // User not logged in - show register/login options
    if (!user) {
      setIsInitialized(true);
      return;
    }

    setIsInitialized(true);
  }, [user, authLoading, inviteId, router]);

  // Validate invite on page load (only after auth check)
  useEffect(() => {
    if (!isInitialized) return;

    const validate = async () => {
      if (!inviteId) {
        setError('Invalid invite link');
        setIsValidating(false);
        return;
      }

      try {
        const response = await validateInvite(inviteId);
        if (response.success && response.data) {
          setInviteData(response.data);
        } else {
          setError(response.error?.message || 'Invalid or expired invite');
        }
      } catch (err: any) {
        const message = err.response?.data?.error?.message || 'Failed to validate invite';
        setError(message);
        console.error('Error validating invite:', err);
      } finally {
        setIsValidating(false);
      }
    };

    validate();
  }, [isInitialized, inviteId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!code || code.length !== 6 || !/^\d{6}$/.test(code)) {
      setError('Please enter a valid 6-digit code');
      return;
    }

    if (!inviteData?.inviteId) {
      setError('Invalid invite');
      return;
    }

    setIsSubmitting(true);

    try {
      // Accept invite
      const response = await acceptInvite(inviteData.inviteId, { code });

      if (response.success && response.data) {
        setSuccess(response.data);
        
        // Refresh token to get updated role and scopes after role change
        const refreshResult = await refreshAccessToken();
        
        if (refreshResult.success && refreshResult.data) {
          // Decode new token to get updated role
          const payload = JSON.parse(atob(refreshResult.data.accessToken.split('.')[1])) as JWTClaims;
          const newRole = payload.identity?.role;

          // Determine redirect URL based on updated role
          const roleMap: Record<string, string> = {
            'CITY_ADMIN': '/admin/city',
            'SOS_ADMIN': '/admin/sos',
            'SK_ADMIN': '/admin/sk',
            'SUPER_ADMIN': '/admin/super-user',
            'TEMPORARY_ACCESS': '/login',
          };
          const redirectUrl = roleMap[newRole] || '/admin/dashboard';

          // Redirect after 2 seconds
          setTimeout(() => {
            router.push(redirectUrl);
          }, 2000);
        } else {
          setError('Failed to refresh authentication');
        }
      } else {
        setError(response.error?.message || 'Failed to accept invite');
      }
    } catch (err: any) {
      let message = 'Failed to accept invite';
      if (err.response?.status === 410) {
        message = 'This invite has expired or already been used';
      } else if (err.response?.status === 422) {
        message = 'Invalid code. Please check and try again';
      } else if (err.response?.data?.error?.message) {
        message = err.response.data.error.message;
      }
      setError(message);
      console.error('Error accepting invite:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading || !isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <Card>
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Checking authentication...</p>
          </div>
        </Card>
      </div>
    );
  }

  if (isValidating) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <Card>
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Validating invite...</p>
          </div>
        </Card>
      </div>
    );
  }

  if (error && !inviteData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <Card className="max-w-md w-full">
          <div className="text-center">
            <div className="mb-4 text-4xl">⚠️</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Invalid Invite</h1>
            <div className="mt-4">
              <Alert type="error" message={error} />
            </div>
            <p className="mt-6 text-gray-600">
              Please check the invite link and try again, or contact your administrator.
            </p>
          </div>
        </Card>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <Card className="max-w-md w-full">
          <div className="text-center">
            <div className="mb-4 text-4xl">✅</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Invite Accepted!</h1>
            <div className="mt-4">
              <Alert type="success" message={success.message} />
            </div>
            <div className="mt-6 space-y-2 text-sm text-gray-600">
              <p>
                <strong>Role:</strong> {success.role}
              </p>
              <p>
                <strong>Municipality:</strong> {success.municipalityCode}
              </p>
            </div>
            <p className="mt-6 text-gray-500 text-sm">Redirecting to dashboard...</p>
          </div>
        </Card>
      </div>
    );
  }

  if (!inviteData?.valid) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <Card className="max-w-md w-full">
          <div className="text-center">
            <div className="mb-4 text-4xl">⏰</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Invite Unavailable</h1>
            <div className="mt-4">
              <Alert
                type="error"
                message={`Invite is ${inviteData?.reason?.toLowerCase() || 'unavailable'}`}
              />
            </div>
            <p className="mt-6 text-gray-600">
              {inviteData?.reason === 'EXPIRED' &&
                'This invite has expired. Invites are valid for 15 minutes.'}
              {inviteData?.reason === 'USED' &&
                'This invite has already been used.'}
              {!inviteData?.reason &&
                'This invite is no longer valid.'}
            </p>
            <p className="mt-4 text-gray-600 text-sm">
              Please contact your administrator for a new invite.
            </p>
          </div>
        </Card>
      </div>
    );
  }

  // Not authenticated - show register/login options
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <Card className="max-w-md w-full">
          <div className="text-center mb-6">
            <div className="mb-4 text-4xl">🎟️</div>
            <h1 className="text-2xl font-bold text-gray-900">Welcome!</h1>
            <p className="mt-2 text-gray-600 text-sm">You have been invited to join</p>
            <div className="mt-3 bg-blue-50 rounded p-3">
              <p className="text-sm font-semibold text-gray-900">{inviteData?.role}</p>
              <p className="text-xs text-gray-600">{inviteData?.municipalityCode}</p>
            </div>
          </div>

          <div className="space-y-3">
            <button
              onClick={() => router.push(`/invites/${inviteId}/register`)}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-4 rounded-lg transition"
            >
              Create New Account
            </button>
            
            <div className="relative flex items-center my-4">
              <div className="flex-grow border-t border-gray-300"></div>
              <span className="flex-shrink mx-4 text-gray-600 text-sm">or</span>
              <div className="flex-grow border-t border-gray-300"></div>
            </div>

            <button
              onClick={() => {
                const returnUrl = `/invites/${inviteId}`;
                sessionStorage.setItem('pendingInviteId', inviteId);
                router.push(`/login?returnUrl=${encodeURIComponent(returnUrl)}`);
              }}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition"
            >
              Login with Existing Account
            </button>
          </div>

          <div className="mt-6 bg-gray-50 rounded-lg p-4">
            <p className="text-xs font-medium text-gray-700 mb-2">Invite Details</p>
            <div className="space-y-1 text-xs text-gray-600">
              <p>
                <strong>Role:</strong> {inviteData?.role}
              </p>
              <p>
                <strong>Municipality:</strong> {inviteData?.municipalityCode}
              </p>
              <p>
                <strong>Expires:</strong> {inviteData?.expiresAt ? new Date(inviteData.expiresAt).toLocaleString() : 'N/A'}
              </p>
            </div>
          </div>

          <p className="text-center text-xs text-gray-500 mt-4">
            <a href="/citizen/home" className="text-blue-600 hover:underline">
              Go home
            </a>
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="max-w-md w-full">
        <div className="text-center mb-6">
          <div className="mb-4 text-4xl">🎟️</div>
          <h1 className="text-2xl font-bold text-gray-900">Accept Invite</h1>
          <p className="mt-2 text-gray-600 text-sm">Enter your invitation code to proceed</p>
        </div>

        {error && <div className="mb-4"><Alert type="error" message={error} /></div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-1">
              6-Digit Code
            </label>
            <input
              id="code"
              type="text"
              inputMode="numeric"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="000000"
              maxLength={6}
              disabled={isSubmitting}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-center text-2xl font-mono tracking-widest focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
              autoComplete="off"
            />
            <p className="mt-1 text-xs text-gray-500">Enter the 6-digit code from your invitation</p>
          </div>

          <div className="bg-gray-50 rounded-lg p-4 mt-6">
            <p className="text-xs font-medium text-gray-700 mb-2">Invite Details</p>
            <div className="space-y-1 text-xs text-gray-600">
              <p>
                <strong>Role:</strong> {inviteData?.role}
              </p>
              <p>
                <strong>Municipality:</strong> {inviteData?.municipalityCode}
              </p>
              <p>
                <strong>Expires:</strong> {new Date(inviteData?.expiresAt || '').toLocaleString()}
              </p>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting || code.length !== 6}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-3 px-4 rounded-lg transition mt-6"
          >
            {isSubmitting ? 'Accepting...' : 'Accept Invite'}
          </button>
        </form>

        <p className="text-center text-xs text-gray-500 mt-4">
          Don't have an invite?{' '}
          <a href="/citizen/home" className="text-blue-600 hover:underline">
            Go home
          </a>
        </p>
      </Card>
    </div>
  );
}
