'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Best-effort client-side sign-out: clears storage and common cookies, then redirect
export default function LogoutPage() {
  const router = useRouter();

  useEffect(() => {
    try {
      // Clear storages
      if (typeof window !== 'undefined') {
        // Preserve theme if needed: const theme = localStorage.getItem('theme');
        localStorage.clear();
        sessionStorage.clear();
        // Optionally restore theme here
      }

      // Clear cookies (best effort; HttpOnly cookies cannot be cleared client-side)
      if (typeof document !== 'undefined') {
        const cookies = document.cookie.split(';');
        for (const cookie of cookies) {
          const eqPos = cookie.indexOf('=');
          const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
          document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
        }
      }
    } catch {
      // ignore
    } finally {
      // Redirect to login/home
      router.replace('/');
    }
  }, [router]);

  return (
    <div className="min-h-[50vh] flex items-center justify-center text-gray-600">
      Signing you out...
    </div>
  );
}