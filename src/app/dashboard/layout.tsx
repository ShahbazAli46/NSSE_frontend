'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import Image from 'next/image';
import { RealtimeProvider } from '@/lib/realtime';
import { getStoredUser, clearSession, api, User } from '@/lib/api';
import { 
  Users, 
  Receipt, 
  ShieldCheck, 
  LogOut, 
  Building2, 
  ChevronRight,
  Shield,
  Menu,
  X,
  Tags,
  LayoutDashboard,
  PieChart,
  BarChart3,
  CheckSquare
} from 'lucide-react';
import FloatingChatWidget from '@/components/chat/FloatingChatWidget';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState<boolean>(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  const [isDesktopSidebarOpen, setIsDesktopSidebarOpen] = useState<boolean>(true);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const stored = getStoredUser();
    if (!stored) {
      router.replace('/');
      return;
    }
    setUser(stored);
  }, [router]);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await api.post('/auth/logout');
    } catch {
      // ignore network failure
    } finally {
      clearSession();
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-[#F2F9F5] flex items-center justify-center">
        <div className="w-8 h-8 border-3 border-[#0B462C] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const roleLabel = {
    admin: 'System Administrator',
    super_admin: 'System Administrator',
    director: 'Executive Director',
    chairman: 'Chairman of the Board',
    accountant: 'Finance & Accounts Officer',
    hr_accountant: 'Finance & Accounts Officer',
    principal: 'Principal / Headmaster',
    teacher: 'Faculty Member',
  }[user.role] || user.role;

  // Sidebar Menu Items by Category
  const menuSections = [
    {
      title: 'EXECUTIVE & EQUITY DESK',
      items: [
        { 
          label: 'Partners & Capital Cockpit', 
          href: '/director', 
          icon: PieChart,
          roles: ['chairman', 'director', 'super_admin', 'admin']
        },
        { 
          label: 'P & L Report', 
          href: '/director/pnl', 
          icon: BarChart3,
          roles: ['chairman', 'director', 'super_admin', 'admin']
        },
      ]
    },
    {
      title: 'INSTITUTIONAL GOVERNANCE',
      items: [
        { 
          label: 'Staff & Role Directory', 
          href: '/dashboard', 
          icon: Users,
          roles: ['super_admin', 'admin', 'chairman', 'director', 'principal']
        },
        { 
          label: 'Tasks & Action Items', 
          href: '/dashboard/tasks', 
          icon: CheckSquare,
          roles: ['super_admin', 'admin', 'chairman', 'director', 'principal', 'accountant', 'hr_accountant', 'teacher']
        },
      ]
    },
    {
      title: 'FINANCIAL & ACCOUNTS DESK',
      items: [
        { 
          label: 'Accounts Cockpit', 
          href: '/dashboard', 
          icon: LayoutDashboard,
          roles: ['accountant', 'hr_accountant']
        },
        { 
          label: 'Expense Ledger & Vouchers', 
          href: '/dashboard/expenses', 
          icon: Receipt,
          roles: ['accountant', 'hr_accountant', 'director', 'principal', 'super_admin', 'admin', 'chairman']
        },
        { 
          label: 'Expenses Overview', 
          href: '/dashboard/expenses/overview', 
          icon: PieChart,
          roles: ['accountant', 'hr_accountant', 'director', 'principal', 'super_admin', 'admin', 'chairman']
        },
        { 
          label: 'Expense Categories', 
          href: '/dashboard/categories', 
          icon: Tags,
          roles: ['accountant', 'hr_accountant', 'super_admin', 'admin', 'chairman']
        },
      ]
    },
  ];

  return (
    <RealtimeProvider>
      <div className="h-screen overflow-hidden bg-[#F4F6F4] flex flex-col">
        
        {/* ================= TOP EXECUTIVE HEADER ================= */}
        <header className="bg-white border-b border-gray-200/80 shrink-0 shadow-xs">
          <div className="w-full px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
            
            {/* Mobile Hamburger & Logo */}
            <div className="flex items-center gap-3 sm:gap-4">
              <button
                onClick={() => {
                  if (typeof window !== 'undefined' && window.innerWidth < 1024) {
                    setIsMobileMenuOpen(!isMobileMenuOpen);
                  } else {
                    setIsDesktopSidebarOpen(!isDesktopSidebarOpen);
                  }
                }}
                className="p-2 rounded-xl text-gray-600 hover:bg-gray-100 cursor-pointer"
              >
                <Menu className="w-6 h-6" />
              </button>

              <div className="w-12 h-12 relative flex-shrink-0">
                <Image
                  src="/logo.png"
                  alt="NSSE Logo"
                  fill
                  className="object-contain"
                  priority
                />
              </div>

              <div>
                <h1 className="text-base sm:text-lg font-black text-[#0B462C] font-cinzel tracking-wider uppercase leading-tight">
                  Nawaz Sharif
                </h1>
                <div className="text-[10px] font-bold text-[#C5A059] font-cinzel tracking-widest uppercase">
                  School of Eminence — Chunian Campus
                </div>
              </div>
            </div>

            {/* Profile Pill & Action Center */}
            <div className="flex items-center gap-3 sm:gap-4">
              
              {/* Role Badge Removed */}

              {/* User Avatar & Name */}
              <div className="text-right hidden md:block">
                <p className="text-xs font-bold text-gray-900 leading-tight">{user.name}</p>
                <p className="text-[11px] text-gray-500 font-medium">{user.email}</p>
              </div>

              {/* Logout Button */}
              <button
                onClick={handleLogout}
                disabled={isLoggingOut}
                title="Sign out securely"
                className="p-2.5 rounded-xl border border-gray-200 text-gray-500 hover:text-red-700 hover:bg-red-50/80 hover:border-red-200 transition-all cursor-pointer flex items-center gap-1.5 text-xs font-semibold"
              >
                <LogOut className="w-4 h-4 text-gray-500 hover:text-red-700" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>

          </div>
        </header>

        {/* ================= BODY WITH SIDEBAR & MAIN ================= */}
        <div className="flex-1 flex w-full overflow-hidden">
          
          {/* Mobile Overlay */}
          {isMobileMenuOpen && (
            <div 
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/50 z-30 lg:hidden backdrop-blur-xs"
            />
          )}

          {/* SIDEBAR */}
          <aside className={`
            fixed lg:static top-20 bottom-0 left-0 z-30 w-64 bg-white border-r border-gray-200/80 flex flex-col transition-all duration-300 ease-in-out shrink-0
            ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
            ${isDesktopSidebarOpen ? 'lg:translate-x-0 lg:ml-0' : 'lg:-translate-x-full lg:-ml-64'}
          `}>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-6">
              {menuSections.map((section, sIdx) => {
                const visibleItems = section.items.filter(
                  (item) => item.roles.includes(user.role)
                );

                if (visibleItems.length === 0) return null;

                return (
                  <div key={sIdx} className="space-y-1.5">
                    <div className="px-3 text-[10px] font-black tracking-wider text-[#0B462C]/70 uppercase">
                      {section.title}
                    </div>
                    {visibleItems.map((item) => {
                      const Icon = item.icon;
                      const isActive = pathname === item.href;
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => {
                            if (typeof window !== 'undefined' && window.innerWidth < 1024) {
                              setIsMobileMenuOpen(false);
                            } else {
                              setIsDesktopSidebarOpen(false);
                            }
                          }}
                          className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all group ${
                            isActive
                              ? 'bg-[#0B462C] text-[#E8D4A2] shadow-sm font-extrabold'
                              : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <Icon className={`w-4 h-4 ${
                              isActive ? 'text-[#C5A059]' : 'text-gray-400 group-hover:text-gray-600'
                            }`} />
                            <span>{item.label}</span>
                          </div>
                          {isActive && <ChevronRight className="w-3.5 h-3.5 text-[#C5A059]" />}
                        </Link>
                      );
                    })}
                  </div>
                );
              })}
            </div>

            {/* Sidebar Footer Note Removed */}

          </aside>

          {/* MAIN PAGE CONTENT */}
          <main 
            onClick={() => {
              if (typeof window !== 'undefined' && window.innerWidth >= 1024 && isDesktopSidebarOpen) {
                setIsDesktopSidebarOpen(false);
              }
            }}
            className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 w-full overflow-y-auto relative"
          >
            
            {/* Faint Logo Watermark Background */}
            <div className={`fixed inset-0 z-0 flex items-center justify-center opacity-[0.03] pointer-events-none pt-20 transition-all duration-300 ${isDesktopSidebarOpen ? 'lg:pl-64' : 'lg:pl-0'}`}>
              <Image 
                src="/logo.png" 
                alt="Watermark" 
                width={650} 
                height={650} 
                className="object-contain"
              />
            </div>

            <div className="w-full">
              {children}
            </div>
          </main>

        </div>

        {/* Global Staff Intercom & 1-on-1 Chat Widget */}
        <FloatingChatWidget />

      </div>
    </RealtimeProvider>
  );
}
