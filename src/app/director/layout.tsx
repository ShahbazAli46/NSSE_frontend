'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/app/dashboard/layout';
import { getStoredUser, User } from '@/lib/api';
import { ShieldAlert, ArrowLeft, RefreshCw } from 'lucide-react';
import Link from 'next/link';

const AUTHORIZED_ROLES = ['chairman', 'director', 'super_admin', 'admin'];

export default function DirectorLayout({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isChecking, setIsChecking] = useState<boolean>(true);
  const router = useRouter();

  useEffect(() => {
    const stored = getStoredUser();
    if (!stored) {
      router.replace('/');
      return;
    }
    setUser(stored);
    setIsChecking(false);
  }, [router]);

  if (isChecking) {
    return (
      <DashboardLayout>
        <div className="min-h-[50vh] flex flex-col items-center justify-center gap-3 text-gray-400">
          <RefreshCw className="w-8 h-8 animate-spin text-[#0B462C]" />
          <span className="text-xs font-semibold">Verifying Executive Clearance...</span>
        </div>
      </DashboardLayout>
    );
  }

  // Strict Role Guard
  if (!user || !AUTHORIZED_ROLES.includes(user.role)) {
    return (
      <DashboardLayout>
        <div className="min-h-[60vh] flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white border border-rose-200 rounded-3xl p-8 shadow-xl text-center space-y-4 animate-in fade-in zoom-in duration-150">
            <div className="w-16 h-16 rounded-2xl bg-rose-50 border border-rose-100 text-rose-600 flex items-center justify-center mx-auto shadow-xs">
              <ShieldAlert className="w-8 h-8" />
            </div>
            
            <div>
              <h2 className="text-xl font-black text-gray-900">403 — Access Restricted</h2>
              <p className="text-xs text-gray-500 font-medium mt-1">
                Executive Clearance Required. The Partners & Capital Equity Desk is reserved strictly for Board Directors, Chairmen, and System Administrators.
              </p>
            </div>

            <div className="p-3 bg-gray-50 rounded-xl text-left text-xs space-y-1">
              <div className="flex justify-between text-gray-600">
                <span>Authenticated User:</span>
                <strong className="text-gray-900">{user?.name}</strong>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Assigned Role:</span>
                <span className="px-2 py-0.5 rounded-md font-bold bg-amber-100 text-amber-800 text-[10px] uppercase">
                  {user?.role}
                </span>
              </div>
            </div>

            <div className="pt-2">
              <Link
                href="/dashboard"
                className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#0B462C] hover:bg-[#093823] text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                Return to Operational Dashboard
              </Link>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return <DashboardLayout>{children}</DashboardLayout>;
}
