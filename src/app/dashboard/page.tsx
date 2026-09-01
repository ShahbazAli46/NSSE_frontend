'use client';

import React, { useEffect, useState } from 'react';
import { getStoredUser, User } from '@/lib/api';
import SuperAdminDashboard from '@/components/SuperAdminDashboard';
import AccountantDashboard from '@/components/AccountantDashboard';
import PrincipalDashboard from '@/components/PrincipalDashboard';
import TeacherDashboard from '@/components/TeacherDashboard';
import DirectorPortalPage from '@/app/director/page';
import { RefreshCw } from 'lucide-react';

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const stored = getStoredUser();
    setUser(stored);
    setIsLoading(false);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center gap-3 text-gray-400">
        <RefreshCw className="w-8 h-8 animate-spin text-[#0B462C]" />
        <span className="text-xs font-semibold">Authenticating Institutional Session...</span>
      </div>
    );
  }

  // Principal View: Campus Command Center & Order Requisitions
  if (user?.role === 'principal') {
    return <PrincipalDashboard currentUser={user} />;
  }

  // Teacher View: Personal Profile & Faculty Member Dashboard
  if (user?.role === 'teacher') {
    return <TeacherDashboard currentUser={user} />;
  }

  // Chairman & Director View: Executive Oversight & Partners Equity Cockpit
  if (user?.role === 'chairman' || user?.role === 'director') {
    return <DirectorPortalPage />;
  }

  // Super Admin View: Institutional Governance & Staff Role Administration
  if (user?.role === 'super_admin' || user?.role === 'admin') {
    return <SuperAdminDashboard currentUser={user} />;
  }

  // Accountant View: Financial Expense Desk & Ledger Operations
  if (user?.role === 'hr_accountant' || user?.role === 'accountant') {
    return <AccountantDashboard currentUser={user} />;
  }

  // Default Fallback
  return (
    <div className="p-8 mt-10 text-center text-gray-500">
      <h2 className="text-2xl font-bold text-[#0B462C] mb-2">Welcome to NSSE Portal</h2>
      <p>The dashboard view for your role <strong>{user?.role}</strong> is currently under construction.</p>
    </div>
  );
}
