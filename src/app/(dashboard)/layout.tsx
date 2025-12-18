'use client';

import Menu from '@/components/menu';
import TopNav from '@/components/TopNav';
import { SearchProvider } from '@/components/SearchContext';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      <SearchProvider>
        <TopNav />
        <div className="flex">
          <Menu />
          <main className="flex-1 p-6">
            {children}
          </main>
        </div>
      </SearchProvider>
    </div>
  );
}
