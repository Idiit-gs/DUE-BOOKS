import React from 'react';
import {
  LayoutDashboard,
  Users,
  Coins,
  Receipt,
  Landmark,
  FileBarChart,
  ShieldAlert,
} from 'lucide-react';
import { useDuesBook } from '../context/DuesBookContext';

export type TabType =
  | 'dashboard'
  | 'members'
  | 'contributions'
  | 'payments'
  | 'treasury'
  | 'reports'
  | 'admin';

interface NavigationProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
}

export const Navigation: React.FC<NavigationProps> = ({ activeTab, setActiveTab }) => {
  const { currentOrgMembers, currentOrgPayments } = useDuesBook();

  const owingCount = currentOrgMembers.filter(
    (m) => m.status === 'active' && m.expectedBalance > m.paidBalance
  ).length;

  const reversedCount = currentOrgPayments.filter((p) => p.status === 'reversed').length;

  const navItems = [
    {
      id: 'dashboard' as TabType,
      label: 'Dashboard',
      icon: LayoutDashboard,
    },
    {
      id: 'members' as TabType,
      label: 'Members',
      icon: Users,
      badge: owingCount > 0 ? `${owingCount} owing` : undefined,
      badgeColor: 'bg-amber-100 text-amber-800 border-amber-300',
    },
    {
      id: 'contributions' as TabType,
      label: 'Dues & Levies',
      icon: Coins,
    },
    {
      id: 'payments' as TabType,
      label: 'Payments & Receipts',
      icon: Receipt,
      badge: reversedCount > 0 ? `${reversedCount} rev` : undefined,
      badgeColor: 'bg-rose-100 text-rose-800 border-rose-300',
    },
    {
      id: 'treasury' as TabType,
      label: 'Treasury & Cash',
      icon: Landmark,
    },
    {
      id: 'reports' as TabType,
      label: 'Financial Reports',
      icon: FileBarChart,
    },
    {
      id: 'admin' as TabType,
      label: 'Governance & Audit',
      icon: ShieldAlert,
    },
  ];

  return (
    <>
      {/* Desktop Horizontal Tabs */}
      <div className="bg-white border-b border-slate-200 sticky top-16 z-20 shadow-xs hidden md:block">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-1 sm:space-x-2 py-2 overflow-x-auto no-scrollbar">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  id={`nav-tab-${item.id}`}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                    isActive
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-300/80 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-700' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                  {item.badge && (
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium border ${item.badgeColor}`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 shadow-lg px-2 py-1.5 flex justify-around items-center">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              id={`mobile-nav-${item.id}`}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center justify-center p-1 rounded-md transition ${
                isActive ? 'text-emerald-700 font-bold' : 'text-slate-500'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 ${isActive ? 'text-emerald-700' : 'text-slate-400'}`} />
                {item.badge && (
                  <span className="absolute -top-1 -right-2 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white"></span>
                )}
              </div>
              <span className="text-[10px] tracking-tight mt-0.5 max-w-[54px] truncate text-center">
                {item.label.split(' ')[0]}
              </span>
            </button>
          );
        })}
      </div>
    </>
  );
};
