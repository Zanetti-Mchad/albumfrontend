'use client';

import { useState, useEffect, useMemo } from 'react';
import { 
  FiHome,
  FiImage, 
  FiUsers, 
  FiSettings, 
  FiLogOut,
  FiUserPlus,
  FiUser,
  FiList,
  FiPlus,
  FiEdit,
  FiTrash2
} from 'react-icons/fi';
import { useSearch } from './SearchContext';
import Link from 'next/link';
import DialogBox from '@/components/dialogbox';
import { usePathname } from 'next/navigation';

interface NavItem {
  name: string;
  icon: React.ElementType;
  active?: boolean;
  path: string;
  subItems?: NavItem[];
  roles?: string[];
  type?: 'divider' | 'header';
}

export default function Menu() {
  const [filteredItems, setFilteredItems] = useState<NavItem[]>([]);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const { searchQuery } = useSearch();
  const pathname = usePathname();

  const navItems = useMemo<NavItem[]>(() => [
    { 
      name: 'Home',
      icon: FiHome,
      active: true,
      path: '/admin'
    },
    { 
      name: 'Albums', 
      icon: FiImage, 
      active: true, 
      path: '/admin',
      subItems: [
        { name: 'Create Album', icon: FiPlus, active: false, path: '/pages/albums/create' },
        { name: 'View All', icon: FiList, active: false, path: '/pages/albums/view' },
        { name: 'Edit Album', icon: FiEdit, active: false, path: '/pages/albums/edit' },
        { name: 'Delete Album', icon: FiTrash2, active: false, path: '/pages/albums/delete' }
      ]
    },
    { name: 'Family Tree', icon: FiUsers, active: false, path: '/pages/familytree' },
    { 
      name: 'Members', 
      icon: FiUsers, 
      active: false, 
      path: '/pages/users/view',
      subItems: [
        { name: 'Create', icon: FiUserPlus, active: false, path: '/pages/users/create' },
        { name: 'View', icon: FiList, active: false, path: '/pages/users/view' },
        { name: 'Edit', icon: FiUser, active: false, path: '/pages/users/edit' }      
      ]
    },
    
    { name: 'Profile', icon: FiUser, active: false, path: '/pages/profile' },
    { name: 'Settings', icon: FiSettings, active: false, path: '/pages/settings' },
    { name: 'Log out', icon: FiLogOut, active: false, path: '/pages/logout' }
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
    <aside className="w-28 bg-white shadow-sm border-r border-slate-200 flex flex-col items-center py-6">
      <nav className="flex-1 flex flex-col gap-1 w-full px-2 overflow-y-auto mt-8">
        {filteredItems.length > 0 ? (
          filteredItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.path;
            const hasSubItems = (item.subItems?.length ?? 0) > 0;
            const isExpanded = expandedSection === item.name;
            const isLogout = item.name.toLowerCase() === 'log out' || item.path === '/pages/logout';
            return (
              <div key={item.name} className="flex flex-col items-center w-full">
                {hasSubItems ? (
                  <button
                    type="button"
                    onClick={() => setExpandedSection(isExpanded ? null : item.name)}
                    className="flex flex-col items-center w-full py-1 no-underline"
                  >
                    <div
                      className={`w-12 h-12 flex items-center justify-center rounded-lg transition-all ${
                        isExpanded
                          ? 'bg-indigo-100 text-indigo-600'
                          : 'text-slate-400 hover:bg-slate-100 hover:text-slate-600'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <span 
                      className={`text-xs mt-1 text-center ${
                        isExpanded ? 'text-indigo-600 font-medium' : 'text-slate-500'
                      }`}
                    >
                      {item.name}
                    </span>
                  </button>
                ) : isLogout ? (
                  <button
                    type="button"
                    onClick={() => setConfirmOpen(true)}
                    className="flex flex-col items-center w-full py-1 no-underline"
                  >
                    <div
                      className={`w-12 h-12 flex items-center justify-center rounded-lg transition-all text-slate-400 hover:bg-red-50 hover:text-red-500`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className={`text-xs mt-1 text-center text-slate-500`}>
                      {item.name}
                    </span>
                  </button>
                ) : (
                  <Link 
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
                )}
                {item.subItems && isExpanded && (
                  <div className="mt-2 w-full flex flex-col items-center gap-1">
                    {item.subItems.map((sub) => {
                      const SubIcon = sub.icon;
                      const subActive = pathname === sub.path;
                      return (
                        <Link
                          key={`${item.name}-${sub.name}`}
                          href={sub.path}
                          className="w-full no-underline"
                        >
                          <div
                            className={`mx-auto w-12 h-9 flex items-center justify-center rounded-md transition-all ${
                              subActive
                                ? 'bg-indigo-50 text-indigo-600'
                                : 'text-slate-400 hover:bg-slate-100 hover:text-slate-600'
                            }`}
                          >
                            <SubIcon className="w-4 h-4" />
                          </div>
                          <div className={`text-[10px] mt-0.5 text-center ${subActive ? 'text-indigo-600' : 'text-slate-500'}`}>
                            {sub.name}
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="flex flex-col items-center justify-center h-32 text-slate-400">
            <p className="text-sm">No menu items found</p>
            <p className="text-xs mt-1">Try a different search term</p>
          </div>
        )}
      </nav>
      {/* Optional redundant logout button removed to avoid duplicate entries */}

      <DialogBox
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="Sign out?"
        message="You will be signed out from this device. Continue?"
        type="warning"
        mode="confirm"
        cancelText="Cancel"
        confirmText="Yes, sign out"
        onCancel={() => setConfirmOpen(false)}
        onConfirm={() => {
          setConfirmOpen(false);
          window.location.href = '/pages/logout';
        }}
      />
    </aside>
  );
}