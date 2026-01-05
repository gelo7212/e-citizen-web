'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createUserWithEmailAndPassword, signOut, sendEmailVerification, onAuthStateChanged } from 'firebase/auth';
import { validateInvite, registerWithInvite } from '@/lib/api/endpoints';
import { auth } from '@/lib/firebase';
import { setAuth, clearAuth } from '@/lib/auth/store';
import { decodeToken, claimsToAuthUser } from '@/lib/auth/jwt';
import { Alert } from '@/components/shared/Alert';
import { Card } from '@/components/shared/Card';
import { ValidateInviteResponse, AuthUser } from '@/types';

type RegistrationStep = 'invite-validation' | 'signup' | 'email-verification' | 'profile-setup' | 'success';

export default function RegisterWithInvitePage() {
  const params = useParams();
  const router = useRouter();
  const inviteId = params?.inviteId as string;

  // Step tracking
  const [step, setStep] = useState<RegistrationStep>('invite-validation');
  const [inviteData, setInviteData] = useState<ValidateInviteResponse | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<any>(null);
  const [isUserRestored, setIsUserRestored] = useState(false);

  // Step 1: Signup form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Step 3: Profile setup form states
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');

  // UI states
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCheckingVerification, setIsCheckingVerification] = useState(false);
  const [checkCount, setCheckCount] = useState(0);

  // ===== Check if user is already logged in on mount =====
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setFirebaseUser(currentUser);
        if (currentUser.emailVerified) {
          setStep('profile-setup');
        } else {
          setStep('email-verification');
        }
        setIsUserRestored(true);
      } else {
        setIsUserRestored(true); // Mark as restored even if no user
      }
    });

    return unsubscribe;
  }, []);

  // ===== STEP 0: Validate invite on page load =====
  useEffect(() => {
    const validate = async () => {
      if (!inviteId) {
        setError('Invalid invite link');
        if (!isUserRestored) {
          setStep('signup');
        }
        return;
      }

      try {
        const response = await validateInvite(inviteId);
        if (response.success && response.data) {
          if (!response.data.valid) {
            setError(
              response.data.reason === 'EXPIRED'
                ? 'This invite has expired. Invites are valid for 15 minutes.'
                : response.data.reason === 'USED'
                ? 'This invite has already been used.'
                : 'This invite is no longer valid.'
            );
          } else {
            setInviteData(response.data);
            // Only set to signup if no user is already logged in
            if (!isUserRestored) {
              setStep('signup');
            }
          }
        } else {
          setError(response.error?.message || 'Invalid or expired invite');
        }
      } catch (err: any) {
        const message = err.response?.data?.error?.message || 'Failed to validate invite';
        setError(message);
        console.error('Error validating invite:', err);
      }
    };

    validate();
  }, [inviteId, isUserRestored]);

  // ===== STEP 1: Handle signup =====
  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!email || !password || !confirmPassword) {
      setError('Email and password are required');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setIsLoading(true);

    try {
      // Create Firebase user
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Send verification email
      await sendEmailVerification(user);

      setFirebaseUser(user);
      setStep('email-verification');
      setIsLoading(false);
    } catch (err: any) {
      console.error('Firebase creation error:', err);

      let message = 'Account creation failed';

      if (err.code === 'auth/email-already-in-use') {
        message = 'This email is already registered. Please login instead.';
      } else if (err.code === 'auth/invalid-email') {
        message = 'Invalid email address';
      } else if (err.code === 'auth/weak-password') {
        message = 'Password is too weak';
      } else if (err.message) {
        message = err.message;
      }

      setError(message);
      setIsLoading(false);
    }
  };

  // ===== Resend verification email =====
  const handleResendEmail = async () => {
    if (!firebaseUser) {
      setError('No user found. Please try again.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await sendEmailVerification(firebaseUser);
      alert('Verification email sent! Please check your inbox.');
      setIsLoading(false);
    } catch (err: any) {
      console.error('Error sending verification email:', err);
      setError('Failed to resend email. Please try again.');
      setIsLoading(false);
    }
  };

  // ===== STEP 2: Check email verification =====
  useEffect(() => {
    if (step !== 'email-verification' || !firebaseUser) return;

    let verificationCheckInterval: NodeJS.Timeout | null = null;
    let checkAttempts = 0;
    const maxChecks = 24; // Check for up to 2 minutes (24 checks * 5 seconds = 120 seconds)

    const checkVerification = async () => {
      try {
        setIsCheckingVerification(true);

        // Reload user to get latest email verification status
        await firebaseUser.reload();
        console.log('Email verified:', firebaseUser.emailVerified);

        if (firebaseUser.emailVerified) {
          // Email is verified - proceed to profile setup
          if (verificationCheckInterval) {
            clearInterval(verificationCheckInterval);
          }
          setStep('profile-setup');
          setIsCheckingVerification(false);
        } else {
          checkAttempts++;
          setCheckCount(checkAttempts);

          if (checkAttempts >= maxChecks) {
            // Timeout after 2 minutes
            if (verificationCheckInterval) {
              clearInterval(verificationCheckInterval);
            }
            setError('Email verification timeout. Please check your email and try again.');
            await signOut(auth);
            setStep('signup');
            setFirebaseUser(null);
            setIsCheckingVerification(false);
          }
        }
      } catch (err) {
        console.error('Error checking verification:', err);
        if (verificationCheckInterval) {
          clearInterval(verificationCheckInterval);
        }
        setError('Error checking email verification');
        setIsCheckingVerification(false);
      }
    };

    // Start checking verification every 5 seconds
    checkVerification();
    verificationCheckInterval = setInterval(checkVerification, 5000);

    return () => {
      if (verificationCheckInterval) {
        clearInterval(verificationCheckInterval);
      }
    };
  }, [step, firebaseUser]);

  // ===== STEP 3: Handle profile setup and register =====
  const handleProfileSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!firstName || !lastName || !phone || !code) {
      setError('All fields are required');
      return;
    }

    if (code.length !== 6 || !/^\d{6}$/.test(code)) {
      setError('Please enter a valid 6-digit code');
      return;
    }

    if (!firebaseUser || !inviteData) {
      setError('Missing user or invite data');
      return;
    }

    setIsLoading(true);

    try {
      const firebaseToken = await firebaseUser.getIdToken();
      const fullName = `${firstName} ${lastName}`.trim();

      // Call register API
      const registerResponse = await registerWithInvite(firebaseToken, {
        email: firebaseUser.email!,
        phone,
        displayName: fullName,
        firebaseUid: firebaseUser.uid,
        inviteId: inviteData.inviteId,
        code,
      });

      if (!registerResponse.success) {
        setError(registerResponse.error || 'Registration failed');
        setIsLoading(false);
        return;
      }

      // Use token from API response
      const authToken = registerResponse.data?.accessToken || firebaseToken;
      
      console.log('🔍 Token selection:', {
        hasApiToken: !!registerResponse.data?.accessToken,
        hasFirebaseToken: !!firebaseToken,
        selectedToken: authToken ? `${authToken.substring(0, 20)}...` : 'NONE',
      });

      // Decode token and extract claims to get actual role and scopes
      const claims = decodeToken(authToken);
      
      console.log('🔍 Decoded claims:', {
        hasClaims: !!claims,
        hasIdentity: !!claims?.identity,
        role: claims?.identity?.role,
        userId: claims?.identity?.userId,
        scopes: claims?.identity?.scopes,
      });
      
      let authUser: AuthUser;

      if (claims && claims.identity) {
        // Use actual role and scopes from token
        const convertedAuth = claimsToAuthUser(claims);
        console.log('🔍 Converted auth user from claims:', convertedAuth);
        
        authUser = {
          ...convertedAuth,
          email: firebaseUser.email || '',
          firebaseUid: firebaseUser.uid,
        } as AuthUser;
      } else {
        // Fallback if token decoding fails
        console.log('⚠️ Token decoding failed, using fallback role');
        authUser = {
          id: firebaseUser.uid,
          email: firebaseUser.email || '',
          role: registerResponse.data?.role || 'CITIZEN',
          scopes: [],
          cityCode: registerResponse.data?.municipalityCode || '',
          contextType: 'admin' as const,
          firebaseUid: firebaseUser.uid,
        };
      }

      console.log('Setting auth after registration:', { role: authUser.role, id: authUser.id, email: authUser.email });
      // Clear any old auth state first, then set new auth
      clearAuth();
      setAuth(authUser, authToken);

      setStep('success');

      // Determine redirect URL based on actual role from JWT token
      let redirectUrl = '/admin/dashboard';
      if (claims?.identity?.role) {
        const roleMap: Record<string, string> = {
          'CITY_ADMIN': '/admin/setup/check',
          'SOS_ADMIN': '/admin/sos',
          'SK_ADMIN': '/admin/sk-youth',
          'SK_YOUTH_ADMIN': '/admin/sk-youth',
          'APP_ADMIN': '/admin/super-user',
          'SUPER_ADMIN': '/admin/super-user',
        };
        redirectUrl = roleMap[claims.identity.role] || '/admin/dashboard';
      }

      // Redirect after 2 seconds
      setTimeout(() => {
        router.push(redirectUrl);
      }, 2000);
    } catch (err: any) {
      console.error('Registration error:', err);

      let message = 'Registration failed';

      if (err.response?.status === 422) {
        message = 'Invalid code. Please check and try again';
      } else if (err.response?.status === 410) {
        message = 'This invite has expired or already been used';
      } else if (err.response?.data?.error?.message) {
        message = err.response.data.error.message;
      } else if (err.message) {
        message = err.message;
      }

      setError(message);
      setIsLoading(false);
    }
  };

  // ===== RENDER: Loading/Validation =====
  if (step === 'invite-validation') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <Card className="max-w-md w-full">
          <div className="text-center py-8">
            {error ? (
              <>
                <div className="mb-4 text-4xl">⚠️</div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Invalid Invite</h1>
                <div className="mt-4 mb-4">
                  <Alert type="error" message={error} />
                </div>
                <p className="text-gray-600 text-sm">
                  Please check the invite link and try again, or contact your administrator.
                </p>
              </>
            ) : (
              <>
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <p className="mt-4 text-gray-600">Validating invite...</p>
              </>
            )}
          </div>
        </Card>
      </div>
    );
  }

  // Invalid invite
  if (error && !inviteData && step === 'signup') {
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

  // ===== RENDER: STEP 1 - Signup =====
  if (step === 'signup') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <Card className="max-w-md w-full">
          <div className="text-center mb-6">
            <div className="mb-4 text-4xl">📝</div>
            <h1 className="text-2xl font-bold text-gray-900">Create Account</h1>
            <p className="mt-2 text-gray-600 text-sm">Step 1 of 3: Setup your credentials</p>
          </div>

          {error && <div className="mb-4"><Alert type="error" message={error} /></div>}

          <form onSubmit={handleSignup} className="space-y-4">
            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="john@example.com"
                disabled={isLoading}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                disabled={isLoading}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
              <p className="mt-1 text-xs text-gray-500">Minimum 6 characters</p>
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                disabled={isLoading}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-3 px-4 rounded-lg transition mt-6"
            >
              {isLoading ? 'Creating Account...' : 'Next: Verify Email'}
            </button>
          </form>

          <p className="text-center text-xs text-gray-500 mt-4">
            Already have an account?{' '}
            <a href="/login" className="text-blue-600 hover:underline">
              Login
            </a>
          </p>
        </Card>
      </div>
    );
  }

  // ===== RENDER: STEP 2 - Email Verification =====
  if (step === 'email-verification' && firebaseUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <Card className="max-w-md w-full">
          <div className="text-center mb-6">
            <div className="mb-4 text-4xl">📧</div>
            <h1 className="text-2xl font-bold text-gray-900">Verify Your Email</h1>
            <p className="mt-2 text-gray-600 text-sm">Step 2 of 3: Email verification</p>
          </div>

          <div className="bg-blue-50 rounded-lg p-4 mb-6">
            <p className="text-sm text-gray-700 mb-3">
              We've sent a verification email to:
            </p>
            <p className="text-sm font-semibold text-blue-600 break-all">{firebaseUser.email}</p>
            <p className="text-xs text-gray-600 mt-3">
              Please check your email and click the verification link to continue.
            </p>
          </div>

          {error && <div className="mb-4"><Alert type="error" message={error} /></div>}

          <div className="space-y-3">
            <div className="text-center">
              {isCheckingVerification ? (
                <>
                  <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mb-3"></div>
                  <p className="text-sm text-gray-600">Checking verification status...</p>
                </>
              ) : (
                <p className="text-sm text-gray-600">
                  Waiting for verification...
                  {checkCount > 0 && ` (${checkCount}s elapsed)`}
                </p>
              )}
            </div>
          </div>

          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-600 mb-2">
              <strong>What's next?</strong>
            </p>
            <ol className="text-left space-y-2 text-xs text-gray-600">
              <li>1. Check your email inbox for our verification email</li>
              <li>2. Click the "Verify Email" button in the email</li>
              <li>3. Once verified, proceed to complete your profile</li>
            </ol>
          </div>

          <div className="mt-6 text-center space-y-3">
            <button
              onClick={async () => {
                try {
                  await firebaseUser.reload();
                  console.log('Manually checking verification...');
                } catch (err) {
                  console.error('Error reloading user:', err);
                }
              }}
              className="text-sm text-blue-600 hover:underline"
            >
              Click here if you've verified your email
            </button>

            <div className="border-t pt-3">
              <button
                onClick={handleResendEmail}
                disabled={isLoading}
                className="text-sm text-gray-600 hover:text-gray-900 underline disabled:opacity-50"
              >
                {isLoading ? 'Sending...' : 'Resend verification email'}
              </button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  // ===== RENDER: STEP 3 - Profile Setup =====
  if (step === 'profile-setup' && firebaseUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <Card className="max-w-md w-full">
          <div className="text-center mb-6">
            <div className="mb-4 text-4xl">👤</div>
            <h1 className="text-2xl font-bold text-gray-900">Complete Your Profile</h1>
            <p className="mt-2 text-gray-600 text-sm">Step 3 of 3: Final setup</p>
          </div>

          {error && <div className="mb-4"><Alert type="error" message={error} /></div>}

          <form onSubmit={handleProfileSetup} className="space-y-4">
            {/* First Name */}
            <div>
              <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
                First Name
              </label>
              <input
                id="firstName"
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="John"
                disabled={isLoading}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
            </div>

            {/* Last Name */}
            <div>
              <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
                Last Name
              </label>
              <input
                id="lastName"
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Doe"
                disabled={isLoading}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
            </div>

            {/* Phone */}
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number
              </label>
              <input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+63 912 345 6789"
                disabled={isLoading}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
            </div>

            {/* Invitation Code */}
            <div>
              <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-1">
                6-Digit Invitation Code
              </label>
              <input
                id="code"
                type="text"
                inputMode="numeric"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                maxLength={6}
                disabled={isLoading}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-center text-2xl font-mono tracking-widest focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                autoComplete="off"
              />
              <p className="mt-1 text-xs text-gray-500">Enter the code from your invitation email</p>
            </div>

            {/* Invite Details */}
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
                  <strong>Email:</strong> {firebaseUser.email}
                </p>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-medium py-3 px-4 rounded-lg transition mt-6"
            >
              {isLoading ? 'Completing Setup...' : 'Complete Registration'}
            </button>
          </form>
        </Card>
      </div>
    );
  }

  // ===== RENDER: Success =====
  if (step === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <Card className="max-w-md w-full">
          <div className="text-center">
            <div className="mb-4 text-4xl">✅</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Registration Complete!</h1>
            <p className="mt-4 text-gray-600">Your account has been created and invite accepted.</p>
            <div className="mt-6 space-y-2 text-sm text-gray-600">
              <p>
                <strong>Role:</strong> {inviteData?.role}
              </p>
              <p>
                <strong>Municipality:</strong> {inviteData?.municipalityCode}
              </p>
            </div>
            <p className="mt-6 text-gray-500 text-sm">Redirecting to dashboard...</p>
          </div>
        </Card>
      </div>
    );
  }

  return null;
}
