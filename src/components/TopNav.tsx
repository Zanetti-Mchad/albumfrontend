'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import DialogBox from '@/components/dialogbox';
import { FiSearch, FiBell, FiChevronDown, FiX } from 'react-icons/fi';

type Notification = {
  id: number;
  type: 'album' | 'photo' | 'comment';
  message: string;
  time: string;
  read: boolean;
};

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://albumbackend-production-7eed.up.railway.app/api/v1';

export default function TopNav() {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const router = useRouter();
  const [familyName, setFamilyName] = useState<string>('');
  const [familyPhoto, setFamilyPhoto] = useState<string>('');
  const [userName, setUserName] = useState<string>('User');
  const [userAvatar, setUserAvatar] = useState<string>('https://randomuser.me/api/portraits/men/32.jpg');
  const [userRole, setUserRole] = useState<string>('user');
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const [notifications] = useState<Notification[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  const handleClearSearch = () => {
    setSearchQuery('');
  };

  const unreadCount = 0;

  // Fetch family profile (name and photo) for the top navigation
  useEffect(() => {
    let isMounted = true;

    const fetchFamilyProfile = async () => {
      try {
        const res = await fetch('/api/family', { cache: 'no-store' });
        const json = await res.json();
        const profile = json?.data || {};
        if (!res.ok) return;
        if (isMounted) {
          setFamilyName(profile.familyName || '');
          setFamilyPhoto(profile.familyPhoto || '');
        }
      } catch {
        // Silently fall back to defaults
      }
    };

    fetchFamilyProfile();
    return () => {
      isMounted = false;
    };
  }, []);

  // Fetch logged-in user to get role, name, and avatar
  useEffect(() => {
    let isMounted = true;
    type PartialUser = {
      firstName?: string;
      lastName?: string;
      name?: string;
      role?: string;
      photo?: string;
      avatar?: string;
    };
    const extractUser = (obj: unknown): PartialUser | null => {
      if (!obj || typeof obj !== 'object') return null;
      const root = obj as Record<string, unknown>;
      const nestedData = root['data'];
      if (nestedData && typeof nestedData === 'object') {
        const nd = nestedData as Record<string, unknown>;
        if (nd['user'] && typeof nd['user'] === 'object') {
          return nd['user'] as PartialUser;
        }
        return nd as PartialUser;
      }
      if (root['user'] && typeof root['user'] === 'object') {
        return root['user'] as PartialUser;
      }
      return root as PartialUser;
    };
    const fetchUser = async () => {
      try {
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
        const res = await fetch(`${API_BASE}/auth/me`, {
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
        });
        let data: unknown = {};
        try {
          data = await res.json();
        } catch {
          data = {};
        }
        if (!res.ok) return;
        const user = extractUser(data);
        if (user && isMounted) {
          const derivedName = user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'User';
          setUserName(derivedName);
          setUserAvatar(prev => user.photo || user.avatar || prev);
          setUserRole(user.role || 'user');
        }
      } catch {
        // ignore and use defaults
      }
    };
    fetchUser();
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
      <div className="px-6 py-3 flex items-center justify-between">
        <div className={`transition-all duration-300 flex items-center ${isSearchFocused ? 'w-0 opacity-0' : 'w-auto opacity-100'}`}>
          <div className="relative w-16 h-16 rounded-full overflow-hidden border-2 border-white shadow-sm">
            <Image 
              src={familyPhoto || '/family-bg.jpg'} 
              alt="Family Logo" 
              fill
              className="object-cover"
              priority
              sizes="76px"
            />
          </div>
          <h1 className="ml-4 text-2xl font-bold text-slate-800 whitespace-nowrap">{familyName || 'Family Album'}</h1>
        </div>
        
        {/* Search Bar */}
        <div className={`relative mx-4 transition-all duration-300 ${isSearchFocused ? 'flex-1 max-w-2xl' : 'w-64'}`}>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FiSearch className="h-5 w-5 text-slate-400" />
            </div>
            <input
              type="text"
              className={`block w-full pl-10 pr-10 py-2 border border-slate-300 rounded-lg bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-all ${isSearchFocused ? 'shadow-md' : ''}`}
              placeholder={isSearchFocused ? 'Search menu items...' : 'Search...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setIsSearchFocused(false)}
            />
            {searchQuery && (
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                onClick={handleClearSearch}
              >
                <FiX className="h-5 w-5 text-slate-400 hover:text-slate-600" />
              </button>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          {/* Notifications */}
          <div className="relative">
            <button className="p-2 rounded-full text-slate-500 hover:bg-slate-100 relative">
              <FiBell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>
            
            {/* Notification Dropdown */}
            <div className="hidden group-hover:block absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-slate-200 z-20">
              <div className="p-3 border-b border-slate-100">
                <h3 className="font-semibold text-slate-800">Notifications</h3>
              </div>
              <div className="max-h-96 overflow-y-auto">
                {notifications.map((notification) => (
                  <div 
                    key={notification.id} 
                    className={`p-3 border-b border-slate-100 hover:bg-slate-50 cursor-pointer ${!notification.read ? 'bg-blue-50' : ''}`}
                  >
                    <p className="text-sm text-slate-700">{notification.message}</p>
                    <p className="text-xs text-slate-400 mt-1">{notification.time}</p>
                  </div>
                ))}
              </div>
              <div className="p-2 text-center border-t border-slate-100">
                <button className="text-sm text-blue-600 hover:text-blue-800">
                  View all notifications
                </button>
              </div>
            </div>
          </div>

          {/* User Profile */}
          <div className="relative">
            <button 
              className="flex items-center gap-2 pl-2 rounded-full hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              onClick={() => setIsProfileOpen(!isProfileOpen)}
            >
              <div className="relative w-8 h-8 rounded-full overflow-hidden">
                <Image 
                  src={userAvatar} 
                  alt={userName}
                  fill
                  sizes="32px"
                  className="object-cover"
                  priority
                />
              </div>
              <div className="hidden md:block pr-2 text-left">
                <p className="text-sm font-medium text-slate-800">{userName}</p>
                <p className="text-xs text-slate-500">{userRole}</p>
              </div>
              <FiChevronDown className={`hidden md:block w-4 h-4 text-slate-400 transition-transform duration-200 ${isProfileOpen ? 'transform rotate-180' : ''}`} />
            </button>
            
            {/* Dropdown Menu */}
            {isProfileOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
                <div className="py-1" role="menu" aria-orientation="vertical" aria-labelledby="options-menu">
                  <div className="px-4 py-2 border-b border-slate-100">
                    <p className="text-sm font-medium text-slate-800">{userName}</p>
                    <p className="text-xs text-slate-500 truncate">{userRole}</p>
                  </div>
                  <a
                    href="/pages/profile"
                    className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 hover:text-slate-900"
                    role="menuitem"
                  >
                    Your Profile
                  </a>
                  <div className="border-t border-slate-100"></div>
                  <button
                    onClick={() => {
                      setShowLogoutConfirm(true);
                    }}
                    className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 hover:text-red-800"
                    role="menuitem"
                  >
                    Sign out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      {/* Global confirm dialog for logout */}
      <DialogBox
        isOpen={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        title="Confirm sign out"
        message="Are you sure you want to sign out?"
        type="warning"
        mode="confirm"
        cancelText="No"
        confirmText="Yes, sign out"
        onCancel={() => setShowLogoutConfirm(false)}
        onConfirm={() => {
          setShowLogoutConfirm(false);
          router.push('/pages/logout');
        }}
      />
    </header>
  );
}
