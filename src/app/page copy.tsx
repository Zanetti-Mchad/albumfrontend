"use client";

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';

import { FiMail, FiLock, FiEye, FiEyeOff, FiLogIn, FiPhone } from 'react-icons/fi';

// Custom button props that extend motion button props

export default function SignIn() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [animationComplete, setAnimationComplete] = useState(false);

  useEffect(() => {
    // Set animation complete after initial render
    const timer = setTimeout(() => setAnimationComplete(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      console.log('Signing in with:', { identifier, password });
      setIsLoading(false);
    }, 1500);
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
                  <span className="relative group">
  <Link href="/reset-password" className="text-sm text-indigo-600 hover:text-indigo-500">
    Forgot?
  </Link>
  <span className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-max px-3 py-1 rounded bg-gray-800 text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20 whitespace-nowrap shadow-lg">
    Reset your password
  </span>
</span>
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
