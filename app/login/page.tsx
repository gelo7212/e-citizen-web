'use client';

import React, { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { decodeToken } from '@/lib/auth/jwt';
import { auth } from '@/lib/firebase';
import { loginWithFirebaseToken } from '@/lib/services/authService';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnUrl = searchParams.get('returnUrl') || null;
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');

    try {
      // Firebase authentication
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;
      const firebaseToken = await firebaseUser.getIdToken();

      // Exchange Firebase token for API tokens
      const result = await loginWithFirebaseToken(firebaseToken, firebaseUser.uid);

      if (!result.success) {
        throw new Error(result.error || 'Login failed');
      }

      setMessage('✓ Admin login successful!');

      // Redirect based on returnUrl or role
      setTimeout(() => {
        // If there's a returnUrl, use it (e.g., from invite acceptance)
        if (returnUrl) {
          router.push(returnUrl);
        } else {
          // Otherwise, redirect based on role
          const decoded = result.data.accessToken ? decodeToken(result.data.accessToken) : null;
          if (decoded?.identity?.role === 'CITY_ADMIN') {
            router.push('/admin/setup/check');
          } else {
            router.push('/admin/dashboard');
          }
        }
      }, 500);
    } catch (error: any) {
      console.error('Login error:', error);
      
      // Handle Firebase-specific errors
      let errorMessage = `✕ Login failed: ${error.message || 'Unknown error'}`;
      
      if (error.code === 'auth/user-not-found') {
        if (returnUrl?.includes('/invites/')) {
          errorMessage = `✕ Account not found. Please contact your administrator for an invite with account creation.`;
        } else {
          errorMessage = `✕ Account not found. Please check your email or contact your administrator.`;
        }
      } else if (error.code === 'auth/wrong-password') {
        errorMessage = `✕ Invalid password. Please try again.`;
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = `✕ Invalid email address.`;
      } else if (error.code === 'auth/user-disabled') {
        errorMessage = `✕ Your account has been disabled. Please contact your administrator.`;
      }
      
      setMessage(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-600 to-blue-800">
      <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">e-Citizen</h1>
        <p className="text-gray-600 mb-8">Login Portal</p>

        {/* Admin Login Form */}
          <form onSubmit={handleAdminLogin} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="admin@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter your password"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400"
            >
              {isLoading ? 'Logging in...' : 'Login as Admin'}
            </button>
          </form>

        {message && (
          <div
            className={`mt-4 p-3 rounded-lg text-sm ${
              message.startsWith('✓') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}
          >
            {message}
          </div>
        )}

        {/* Help for unregistered users with invite */}
        {returnUrl?.includes('/invites/') && message?.includes('not found') && (
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="font-semibold text-blue-900 text-sm mb-2">Don't have an account yet?</h3>
            <p className="text-blue-800 text-xs mb-2">
              If you have an invitation code, your account will be created when you complete the invite acceptance process.
            </p>
            <ol className="text-blue-700 text-xs space-y-1 ml-4 list-decimal">
              <li>Contact your administrator for an invite with account creation</li>
              <li>Click the invite link they send you</li>
              <li>A new account will be created automatically</li>
            </ol>
          </div>
        )}

      </div>
    </div>
  );
}
