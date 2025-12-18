"use client";

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { FiMail, FiLock, FiEye, FiEyeOff, FiPhone, FiAlertCircle, FiLogIn } from 'react-icons/fi';

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ||
  'https://albumbackend-production-7eed.up.railway.app/api/v1';

export default function SignIn() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [animationComplete, setAnimationComplete] = useState(false);

  const redirectBasedOnRole = useCallback((role: string) => {
    switch (role) {
      case 'admin':
        router.push('/admin');
        break;
      case 'member':
      default:
        router.push('/member');
        break;
    }
  }, [router]);

  useEffect(() => {
    // Redirect if already logged in
    const token = localStorage.getItem('token');
    const userRole = localStorage.getItem('userRole');
    if (token && userRole) {
      redirectBasedOnRole(userRole);
    } else {
      setAnimationComplete(true);
    }
  }, [redirectBasedOnRole]);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!identifier || !password) {
      setError('Please enter both email/phone and password');
      return;
    }

    setIsLoading(true);

    try {
      const isEmail = identifier.includes('@');
      // Backend expects either `email` or a generic `identifier` field for phone/username
      const loginData = isEmail 
        ? { email: identifier, password }
        : { identifier, password };

      console.log('Sending login request:', { loginData });
      
      const response = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(loginData),
      });

      let data;
      try {
        data = await response.json();
        console.log('Login response:', { status: response.status, data });
      } catch (jsonError) {
        console.error('Failed to parse JSON response:', jsonError);
        throw new Error('Invalid response from server');
      }

      if (!response.ok) {
        // Handle different error statuses
        if (response.status === 401) {
          throw new Error('Invalid email/phone or password');
        } else if (response.status === 400) {
          throw new Error(data.status?.returnMessage || 'Invalid request');
        } else if (response.status >= 500) {
          throw new Error('Server error. Please try again later.');
        } else {
          throw new Error(data.status?.returnMessage || 'Login failed');
        }
      }

      // Verify response structure
      if (!data.accessToken || !data.data?.user) {
        console.error('Invalid response structure:', data);
        throw new Error('Invalid response from server');
      }

      // Save token and user data
      localStorage.setItem('token', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);
      localStorage.setItem('userRole', data.data.user.role);
      localStorage.setItem('userName', data.data.user.name || '');
      localStorage.setItem('tokenExpiry', String(Date.now() + (data.expiresIn * 1000)));

      console.log('Login successful, redirecting...');
      // Redirect based on role
      redirectBasedOnRole(data.data.user.role || 'user');

    } catch (err) {
      console.error('Login error details:', {
        error: err,
        message: err instanceof Error ? err.message : 'Unknown error'
      });
      setError(err instanceof Error ? err.message : 'An error occurred during login');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 relative overflow-hidden">
      {/* Blurred Background Image */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
        <Image
          src="/family-bg.jpg"
          alt="Family Album Background"
          fill
          priority
          style={{ objectFit: 'cover', objectPosition: 'center', filter: 'blur(8px) brightness(0.9)', transform: 'scale(1.1)', minHeight: '100vh', minWidth: '100vw' }}
        />
        {/* Warm overlay */}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(254,243,199,0.8) 0%, rgba(251,207,232,0.7) 50%, rgba(191,219,254,0.6) 100%)', mixBlendMode: 'multiply' }} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        style={{ width: '100%', maxWidth: '28rem', zIndex: 10 }}
      >
        {/* Polaroid/Photo Frame Effect */}
        <div className="bg-white/95 rounded-3xl shadow-2xl border-4 border-white/80 p-2 pb-6 flex flex-col items-center relative" style={{ boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.17)' }}>
          {/* Animated Header */}
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={animationComplete ? { scale: 1, opacity: 1 } : { scale: 0.9, opacity: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            style={{ width: '100%', textAlign: 'center', paddingTop: '1.5rem', paddingBottom: '0.75rem' }}
          >
            <h1 style={{ fontSize: '2.25rem', fontWeight: 800, background: 'linear-gradient(90deg, #db2777, #fbbf24, #2563eb)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', letterSpacing: '.03em', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,.13))', margin: 0 }}>Family Album</h1>
            <p style={{ fontSize: '1.125rem', color: '#52525b', marginTop: '0.5rem', fontWeight: 500 }}>Sign in to cherish your memories together</p>
          </motion.div>

          {/* Sign In Form */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={animationComplete ? { opacity: 1 } : { opacity: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            style={{ padding: '2rem' }}
          >
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-1">
                <label htmlFor="identifier" className="block text-sm font-medium text-gray-700">
                  Email or Phone
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    {/^\d/.test(identifier) ? (
                      <FiPhone className="h-5 w-5 text-gray-400" />
                    ) : (
                      <FiMail className="h-5 w-5 text-gray-400" />
                    )}
                  </div>
                  <input
                    id="identifier"
                    name="identifier"
                    type="text"
                    autoComplete="username"
                    required
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-200"
                    placeholder="you@example.com or 0712345678"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                    Password
                  </label>
                  <Link href="/reset-password" className="text-sm text-indigo-600 hover:text-indigo-500 underline">
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiLock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-200"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? (
                      <FiEyeOff className="h-5 w-5" />
                    ) : (
                      <FiEye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>

              {error && (
                <div className="rounded-md bg-red-50 p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <FiAlertCircle className="h-5 w-5 text-red-400" aria-hidden="true" />
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-red-800">{error}</h3>
                    </div>
                  </div>
                </div>
              )}

              <div>
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  style={{ width: '100%' }}
                >
                  <button
                    type="submit"
                    style={{
                      width: '100%',
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      padding: '0.75rem 1rem',
                      border: '1px solid transparent',
                      borderRadius: '0.5rem',
                      boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                      fontSize: '0.875rem',
                      fontWeight: 500,
                      color: '#ffffff',
                      backgroundColor: '#4f46e5',
                      transition: 'all 0.2s',
                      opacity: isLoading ? 0.7 : 1,
                      cursor: isLoading ? 'not-allowed' : 'pointer'
                    }}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Signing in...
                      </>
                    ) : (
                      <>
                        <FiLogIn className="mr-2 h-4 w-4" />
                        Sign In
                      </>
                    )}
                  </button>
                </motion.div>
              </div>
            </form>

            <div className="mt-8 flex flex-col items-center">
              <blockquote className="italic text-lg text-gray-500 text-center max-w-xs mx-auto">
                &ldquo;Family is the heart of every memory, the album of every moment.&rdquo;
              </blockquote>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={animationComplete ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            style={{
              backgroundColor: '#f9fafb',
              padding: '1rem 2rem',
              textAlign: 'center' as const
            }}
          >
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
