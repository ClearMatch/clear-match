'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Users } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export function Auth() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Check for messages from middleware
  const messageFromUrl = searchParams.get('message');
  const errorFromUrl = searchParams.get('error');

  // Clear any corrupted session on component mount
  useEffect(() => {
    const clearCorruptedSession = async () => {
      try {
        // Check if there's a session and if it's valid
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error && error.message.includes('refresh_token_not_found')) {
          console.log('Clearing corrupted session...');
          await supabase.auth.signOut();
        }
      } catch (err) {
        console.log('Error checking session, clearing:', err);
        await supabase.auth.signOut();
      }
    };

    clearCorruptedSession();
  }, []);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isSignUp) {
        console.log("Starting signup process...");
        
        // Clear any existing session before signup
        await supabase.auth.signOut();
        
        // Sign up user first
        const { data: authData, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
        });

        console.log("Auth signup result:", { authData, signUpError });

        if (signUpError) {
          console.error("Signup error:", signUpError);
          throw signUpError;
        }

        if (authData.user) {
          console.log("User created, finding Clear Match Talent organization...");
          
          // Find the Clear Match Talent organization
          const { data: orgData, error: orgError } = await supabase
            .from('organizations')
            .select('id')
            .eq('name', 'Clear Match Talent')
            .single();

          console.log("Organization lookup result:", { orgData, orgError });

          if (orgError) {
            console.error("Organization lookup error:", orgError);
            throw new Error("Unable to find Clear Match Talent organization. Please contact support.");
          }

          console.log("Organization found, creating profile...");

          // Create profile with Clear Match Talent organization
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .insert([{
              id: authData.user.id,
              organization_id: orgData.id,
              first_name: firstName,
              last_name: lastName,
              role: 'admin'
            }])
            .select()
            .single();

          console.log("Profile creation result:", { profileData, profileError });

          if (profileError) {
            console.error("Profile creation error:", profileError);
            throw profileError;
          }

          console.log("Signup completed successfully!");
        } else {
          console.error("No user returned from signup");
          throw new Error("Signup failed - no user created");
        }
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (signInError) throw signInError;
      }

      // Redirect to the original page or dashboard
      const redirectTo = searchParams.get('redirectTo') || '/dashboard';
      router.push(redirectTo);
    } catch (err) {
      console.error('Auth error:', err);
      
      // Handle specific refresh token errors
      if (err instanceof Error && err.message.includes('refresh_token_not_found')) {
        setError('Session expired. Please try again.');
        // Clear the corrupted session
        await supabase.auth.signOut();
      } else {
        setError(err instanceof Error ? err.message : 'An error occurred');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <Users className="h-12 w-12 text-indigo-600" />
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          {isSignUp ? 'Create your account' : 'Sign in to your account'}
        </h2>
        {isSignUp && (
          <p className="mt-2 text-center text-sm text-gray-600">
            Join Clear Match Talent to get started
          </p>
        )}
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleAuth}>
            {isSignUp && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
                      First Name
                    </label>
                    <div className="mt-1">
                      <input
                        id="firstName"
                        name="firstName"
                        type="text"
                        required
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
                      Last Name
                    </label>
                    <div className="mt-1">
                      <input
                        id="lastName"
                        name="lastName"
                        type="text"
                        required
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      />
                    </div>
                  </div>
                </div>
              </>
            )}
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
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
            </div>

            {/* Display middleware messages */}
            {messageFromUrl && (
              <div className="text-orange-600 text-sm bg-orange-50 p-3 rounded-md">
                {messageFromUrl}
              </div>
            )}
            
            {/* Display service error messages */}
            {errorFromUrl === 'service_unavailable' && (
              <div className="text-red-600 text-sm bg-red-50 p-3 rounded-md">
                Authentication service is temporarily unavailable. Please try again later.
              </div>
            )}
            
            {/* Display rate limit error */}
            {errorFromUrl === 'rate_limit_exceeded' && (
              <div className="text-red-600 text-sm bg-red-50 p-3 rounded-md">
                Too many requests. Please wait a moment before trying again.
              </div>
            )}

            {/* Display form errors */}
            {error && (
              <div className="text-red-600 text-sm bg-red-50 p-3 rounded-md">{error}</div>
            )}

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                {loading ? 'Processing...' : (isSignUp ? 'Sign up' : 'Sign in')}
              </button>
            </div>
          </form>

          <div className="mt-6">
            <button
              onClick={() => setIsSignUp(!isSignUp)}
              className="w-full text-center text-sm text-indigo-600 hover:text-indigo-500"
            >
              {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}