'use client';

import { useState, useEffect, useMemo } from 'react';
import { FiImage, FiUsers, FiSettings, FiLogOut } from 'react-icons/fi';
import { useSearch } from './SearchContext';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface NavItem {
  name: string;
  icon: React.ElementType;
  active: boolean;
  path: string;
}

export default function Menu() {
  const [filteredItems, setFilteredItems] = useState<NavItem[]>([]);
  const { searchQuery } = useSearch();
  const pathname = usePathname();

  const navItems = useMemo<NavItem[]>(() => [
    { name: 'Albums', icon: FiImage, active: true, path: '/admin' },
    { name: 'Members', icon: FiUsers, active: false, path: '/pages/users/view' },
    { name: 'Settings', icon: FiSettings, active: false, path: '/pages/settings' },
    { name: 'Photos', icon: FiImage, active: false, path: '/pages/photos' },
    { name: 'Shared', icon: FiUsers, active: false, path: '/pages/shared' },
    { name: 'Trash', icon: FiLogOut, active: false, path: '/pages/trash' }
  ], []);

  // Filter items based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredItems(navItems);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = navItems.filter(item => 
      item.name.toLowerCase().includes(query)
    );
    setFilteredItems(filtered);
  }, [searchQuery, navItems]);

  // Initialize with all items
  useEffect(() => {
    setFilteredItems(navItems);
  }, [navItems]);

  return (
    <aside className="w-20 bg-white shadow-sm border-r border-slate-200 flex flex-col items-center py-6">
      <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mb-8">
        <FiImage className="w-6 h-6 text-white" />
      </div>

      <nav className="flex-1 flex flex-col gap-1 w-full px-2 overflow-y-auto">
        {filteredItems.length > 0 ? (
          filteredItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.path;
            return (
              <Link 
                key={item.name} 
                href={item.path}
                className="flex flex-col items-center w-full py-1 no-underline"
              >
                <div
                  className={`w-12 h-12 flex items-center justify-center rounded-lg transition-all ${
                    isActive
                      ? 'bg-indigo-100 text-indigo-600'
                      : 'text-slate-400 hover:bg-slate-100 hover:text-slate-600'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <span 
                  className={`text-xs mt-1 text-center ${
                    isActive ? 'text-indigo-600 font-medium' : 'text-slate-500'
                  }`}
                >
                  {item.name}
                </span>
              </Link>
            );
          })
        ) : (
          <div className="flex flex-col items-center justify-center h-32 text-slate-400">
            <p className="text-sm">No menu items found</p>
            <p className="text-xs mt-1">Try a different search term</p>
          </div>
        )}
      </nav>

      <button className="w-12 h-12 flex items-center justify-center rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-500 transition-all">
        <FiLogOut className="w-5 h-5" />
      </button>
    </aside>
  );
}