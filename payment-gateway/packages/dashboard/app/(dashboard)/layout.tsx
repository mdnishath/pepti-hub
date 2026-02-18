'use client';

import { useState, ReactNode, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  CreditCard,
  Settings,
  Menu,
  X,
  LogOut,
  ChevronDown,
  Wallet,
  Activity,
} from 'lucide-react';

interface LayoutProps {
  children: ReactNode;
}

interface NavItem {
  name: string;
  href: string;
  icon: React.ElementType;
}

const navigation: NavItem[] = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Payments', href: '/payments', icon: CreditCard },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export default function DashboardLayout({ children }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [merchant, setMerchant] = useState<any>(null);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    // Load merchant data from localStorage
    const token = localStorage.getItem('token');
    const storedMerchant = localStorage.getItem('merchant');

    if (!token) {
      router.push('/login');
      return;
    }

    if (storedMerchant) {
      try {
        setMerchant(JSON.parse(storedMerchant));
      } catch (e) {
        console.error('Failed to parse merchant data');
      }
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('merchant');
    router.push('/login');
  };

  return (
    <div className="flex h-screen overflow-hidden bg-dark-bg text-gray-100">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-dark-bg-lighter border-r border-white/10 transform transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Sidebar Header */}
        <div className="flex items-center justify-between h-20 px-6 border-b border-white/10">
          <Link href="/dashboard" className="flex items-center space-x-3 group">
            <div className="w-10 h-10 bg-gradient-to-br from-brand-400 to-brand-600 rounded-xl flex items-center justify-center shadow-lg shadow-brand-500/20 group-hover:shadow-brand-500/40 transition-shadow">
              <Wallet className="w-6 h-6 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-bold text-gray-100 tracking-tight">
                {merchant?.businessName || 'PeptiPay'}
              </span>
              <span className="text-xs text-brand-400 font-medium tracking-wider uppercase">
                Merchant Portal
              </span>
            </div>
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-8 space-y-2 overflow-y-auto no-scrollbar">
          {navigation.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            const Icon = item.icon;

            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`sidebar-link ${
                  isActive ? 'sidebar-link-active' : 'sidebar-link-inactive'
                }`}
              >
                {isActive && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-brand-500 rounded-r-full" />
                )}
                <Icon
                  className={`w-5 h-5 transition-colors ${
                    isActive ? 'text-brand-400' : 'text-gray-500 group-hover:text-gray-300'
                  }`}
                />
                <span className="flex-1">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer - Merchant Info */}
        <div className="border-t border-white/10 p-4 m-4 bg-white/5 rounded-2xl">
          <div className="flex items-center space-x-3 w-full p-2 mb-3">
            <div className="w-10 h-10 bg-brand-900 rounded-full flex items-center justify-center border-2 border-brand-500/30">
              <span className="text-brand-300 font-semibold text-sm">
                {merchant?.businessName?.[0]?.toUpperCase() || 'M'}
              </span>
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-semibold text-gray-200 truncate">
                {merchant?.businessName || 'Merchant'}
              </p>
              <p className="text-xs text-gray-500 truncate">{merchant?.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center justify-center space-x-2 w-full px-3 py-2 rounded-lg text-sm font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-dark-bg">
        {/* Top Header */}
        <header className="flex-none h-20 bg-dark-bg-lighter/50 backdrop-blur-xl border-b border-white/5 lg:hidden">
          <div className="flex items-center justify-between h-full px-4 sm:px-6">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 -ml-2 text-gray-400 hover:text-white transition-colors"
            >
              <Menu className="w-6 h-6" />
            </button>

            <span className="text-lg font-bold text-gray-100">
              {merchant?.businessName || 'PeptiPay'}
            </span>

            <div className="w-8" />
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
