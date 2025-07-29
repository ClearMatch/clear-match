'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Users, ArrowLeft } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { AUTH_CONFIG } from '@/config/auth';
import { getAuthErrorMessage, logError } from '@/utils/errorHandling';

export default function ResetPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [navigationLoading, setNavigationLoading] = useState(false);
  const router = useRouter();

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: AUTH_CONFIG.resetRedirectUrl,
      });

      if (error) {
        throw error;
      }

      setSuccess(true);
    } catch (err) {
      logError('Password reset request', err);
      setError(getAuthErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleBackToSignIn = async () => {
    setNavigationLoading(true);
    try {
      router.push('/auth');
    } finally {
      setNavigationLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="flex justify-center">
            <Users className="h-12 w-12 text-indigo-600" />
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Check your email
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            We&apos;ve sent a password reset link to your email address
          </p>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
            <div className="text-center space-y-4">
              <div className="bg-green-50 p-4 rounded-md">
                <p className="text-green-800 text-sm">
                  If an account with that email exists, we&apos;ve sent you a reset link. 
                  Please check your email and follow the instructions to reset your password.
                </p>
              </div>
              
              <p className="text-sm text-gray-600">
                Didn&apos;t receive the email? Check your spam folder or wait a few minutes and try again.
              </p>
              
              <button
                onClick={handleBackToSignIn}
                disabled={navigationLoading}
                className="inline-flex items-center text-sm text-indigo-600 hover:text-indigo-500 disabled:opacity-50"
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                {navigationLoading ? 'Loading...' : 'Back to sign in'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <Users className="h-12 w-12 text-indigo-600" />
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Reset your password
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Enter your email address and we&apos;ll send you a reset link
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleResetPassword}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email address
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="Enter your email address"
                />
              </div>
            </div>

            {error && (
              <div className="text-red-600 text-sm bg-red-50 p-3 rounded-md">
                {error}
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                {loading ? 'Sending reset link...' : 'Send reset link'}
              </button>
            </div>
          </form>

          <div className="mt-6">
            <button
              onClick={handleBackToSignIn}
              disabled={navigationLoading}
              className="w-full text-center text-sm text-indigo-600 hover:text-indigo-500 inline-flex items-center justify-center disabled:opacity-50"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              {navigationLoading ? 'Loading...' : 'Back to sign in'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}