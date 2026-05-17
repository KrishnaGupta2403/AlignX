"use client";

import Navbar from '@/components/navbar/Navbar';
import Sidebar from '@/components/sidebar/Sidebar';
import { RoleGuard } from '@/middleware/roleMiddleware';

export default function ManagerLayout({ children }) {
  return (
    <RoleGuard allowedRoles={['manager']}>
      <div className="min-h-screen bg-[#0A0510] font-sans flex text-white">
        <Sidebar />
        <div className="flex-1 flex flex-col pl-64">
          <Navbar />
          <main className="flex-1 pt-16 p-8 overflow-y-auto">
            <div className="max-w-7xl mx-auto">
              {children}
            </div>
          </main>
        </div>
      </div>
    </RoleGuard>
  );
}
