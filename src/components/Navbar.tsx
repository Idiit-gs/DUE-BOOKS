import React, { useState } from 'react';
import { useDuesBook } from '../context/DuesBookContext';
import {
  Building2,
  ChevronDown,
  Plus,
  Shield,
  UserCheck,
  Eye,
  RefreshCw,
  PlusCircle,
  CreditCard,
  UserPlus,
  Receipt,
  FileSpreadsheet,
  LogOut,
  Cloud,
  CloudCheck,
  Database,
} from 'lucide-react';

interface NavbarProps {
  onOpenRecordPayment: () => void;
  onOpenAddMember?: () => void;
  onOpenAddContribution?: () => void;
  onOpenAddExpense?: () => void;
  onOpenNewOrg?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenRecordPayment,
  onOpenAddMember,
  onOpenAddContribution,
  onOpenAddExpense,
  onOpenNewOrg,
}) => {
  const {
    currentOrg,
    organizations,
    setCurrentOrgId,
    currentUser,
    setCurrentUser,
    availableUsers,
    currentRole,
    effectiveRole,
    simulatedRole,
    setSimulatedRole,
    canMutate,
    resetToDemoData,
    logout,
    syncStatus,
  } = useDuesBook();

  const [orgDropdownOpen, setOrgDropdownOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);
  const [quickActionsOpen, setQuickActionsOpen] = useState(false);


  return (
    <header className="sticky top-0 z-30 bg-slate-900 text-white border-b border-slate-800 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left: Brand & Organization Selector */}
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <div className="w-9 h-9 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-bold shadow-inner">
                <Receipt className="w-5 h-5 text-emerald-100" />
              </div>
              <div className="hidden sm:block">
                <div className="flex items-center space-x-1.5">
                  <span className="font-bold text-lg tracking-tight text-white">Dues Book</span>
                  <span className="text-[10px] uppercase font-semibold bg-emerald-950 text-emerald-300 border border-emerald-700/60 px-1.5 py-0.5 rounded">
                    v7.0
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 font-medium">Every naira has a history.</p>
              </div>
            </div>

            {/* Organization Selector */}
            <div className="relative ml-2 sm:ml-4">
              <button
                id="org-selector-btn"
                onClick={() => setOrgDropdownOpen(!orgDropdownOpen)}
                className="flex items-center space-x-2 bg-slate-800/90 hover:bg-slate-700/90 text-slate-200 px-3 py-1.5 rounded-md text-xs sm:text-sm font-medium border border-slate-700 transition"
              >
                <Building2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="max-w-[130px] sm:max-w-[200px] truncate font-semibold">
                  {currentOrg?.name || 'Select Organization'}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {orgDropdownOpen && (
                <div className="absolute left-0 mt-2 w-72 bg-slate-800 rounded-lg shadow-xl border border-slate-700 py-1.5 z-50 animate-in fade-in slide-in-from-top-1 duration-150">
                  <div className="px-3 py-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    Organizations
                  </div>
                  {organizations.map((org) => (
                    <button
                      key={org.id}
                      onClick={() => {
                        setCurrentOrgId(org.id);
                        setOrgDropdownOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 text-xs flex items-start space-x-2 transition ${
                        org.id === currentOrg?.id
                          ? 'bg-emerald-950/60 text-emerald-300 border-l-2 border-emerald-400'
                          : 'text-slate-200 hover:bg-slate-700/70'
                      }`}
                    >
                      <Building2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <div>
                        <div className="font-semibold">{org.name}</div>
                        <div className="text-[10px] text-slate-400 capitalize">
                          {org.type} • {org.code}
                        </div>
                      </div>
                    </button>
                  ))}
                  <div className="border-t border-slate-700/80 my-1"></div>
                  <button
                    onClick={() => {
                      setOrgDropdownOpen(false);
                      onOpenNewOrg?.();
                    }}
                    className="w-full text-left px-3 py-2 text-xs text-emerald-400 hover:bg-slate-700/70 flex items-center space-x-2 font-medium"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Start New Organization</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Right: Quick Actions, Role simulation, User */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Quick Actions Button (Desktop & Mobile) */}
            {canMutate && (
              <div className="relative">
                <button
                  id="quick-record-payment-btn"
                  onClick={() => onOpenRecordPayment?.()}
                  className="hidden md:flex items-center space-x-1.5 bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded-md text-xs font-semibold shadow-sm transition"
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>Record Payment</span>
                </button>
              </div>
            )}

            {/* Quick Actions Dropdown for more */}
            <div className="relative">
              <button
                id="quick-actions-menu-btn"
                onClick={() => setQuickActionsOpen(!quickActionsOpen)}
                className="p-1.5 rounded-md text-slate-300 hover:text-white hover:bg-slate-800 transition border border-slate-700"
                title="Quick Record Actions"
              >
                <PlusCircle className="w-4 h-4 text-emerald-400" />
              </button>

              {quickActionsOpen && (
                <div className="absolute right-0 mt-2 w-52 bg-slate-800 rounded-lg shadow-xl border border-slate-700 py-1.5 z-50 text-xs">
                  <div className="px-3 py-1 text-[11px] font-semibold text-slate-400 uppercase">
                    Quick Actions
                  </div>
                  {canMutate ? (
                    <>
                      <button
                        onClick={() => {
                          setQuickActionsOpen(false);
                          onOpenRecordPayment?.();
                        }}
                        className="w-full text-left px-3 py-2 hover:bg-slate-700 text-slate-200 flex items-center space-x-2"
                      >
                        <CreditCard className="w-4 h-4 text-emerald-400" />
                        <span>Record Member Payment</span>
                      </button>
                      <button
                        onClick={() => {
                          setQuickActionsOpen(false);
                          onOpenAddMember?.();
                        }}
                        className="w-full text-left px-3 py-2 hover:bg-slate-700 text-slate-200 flex items-center space-x-2"
                      >
                        <UserPlus className="w-4 h-4 text-sky-400" />
                        <span>Enroll New Member</span>
                      </button>
                      <button
                        onClick={() => {
                          setQuickActionsOpen(false);
                          onOpenAddContribution?.();
                        }}
                        className="w-full text-left px-3 py-2 hover:bg-slate-700 text-slate-200 flex items-center space-x-2"
                      >
                        <Receipt className="w-4 h-4 text-amber-400" />
                        <span>Create Dues / Levy</span>
                      </button>
                      <button
                        onClick={() => {
                          setQuickActionsOpen(false);
                          onOpenAddExpense?.();
                        }}
                        className="w-full text-left px-3 py-2 hover:bg-slate-700 text-slate-200 flex items-center space-x-2"
                      >
                        <FileSpreadsheet className="w-4 h-4 text-rose-400" />
                        <span>Log Cash/Bank Expense</span>
                      </button>
                    </>
                  ) : (
                    <div className="px-3 py-2 text-slate-400 text-[11px] italic">
                      Read-only role active. Switch to Admin or Treasurer to perform entries.
                    </div>
                  )}
                  <div className="border-t border-slate-700/80 my-1"></div>
                  <button
                    onClick={() => {
                      setQuickActionsOpen(false);
                      resetToDemoData();
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-slate-700 text-slate-400 hover:text-slate-200 flex items-center space-x-2"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Reset to Verified Starter Data</span>
                  </button>
                </div>
              )}
            </div>

            {/* Role Tester / Switcher */}
            <div className="relative">
              <button
                id="role-switch-btn"
                onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
                className={`flex items-center space-x-1 px-2.5 py-1 rounded-md text-xs font-semibold border transition ${
                  effectiveRole === 'admin'
                    ? 'bg-purple-950/70 text-purple-300 border-purple-800'
                    : effectiveRole === 'treasurer'
                    ? 'bg-emerald-950/70 text-emerald-300 border-emerald-800'
                    : 'bg-amber-950/70 text-amber-300 border-amber-800'
                }`}
                title="Active Role (Click to simulate Admin / Treasurer / Viewer)"
              >
                {effectiveRole === 'admin' && <Shield className="w-3.5 h-3.5" />}
                {effectiveRole === 'treasurer' && <UserCheck className="w-3.5 h-3.5" />}
                {effectiveRole === 'viewer' && <Eye className="w-3.5 h-3.5" />}
                <span className="capitalize">{effectiveRole}</span>
                {simulatedRole && (
                  <span className="text-[10px] bg-slate-700 text-slate-300 px-1 rounded">sim</span>
                )}
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {roleDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-slate-800 rounded-lg shadow-xl border border-slate-700 py-1.5 z-50 text-xs">
                  <div className="px-3 py-1 text-[11px] font-semibold text-slate-400 uppercase">
                    Simulate Role (Testing)
                  </div>
                  <button
                    onClick={() => {
                      setSimulatedRole('admin');
                      setRoleDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3 py-1.5 flex items-center justify-between hover:bg-slate-700 ${
                      effectiveRole === 'admin' ? 'text-purple-300 font-bold' : 'text-slate-200'
                    }`}
                  >
                    <span>Administrator (Full Access)</span>
                    {effectiveRole === 'admin' && <span className="text-purple-400">✓</span>}
                  </button>
                  <button
                    onClick={() => {
                      setSimulatedRole('treasurer');
                      setRoleDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3 py-1.5 flex items-center justify-between hover:bg-slate-700 ${
                      effectiveRole === 'treasurer' ? 'text-emerald-300 font-bold' : 'text-slate-200'
                    }`}
                  >
                    <span>Treasurer (Ops & Receipts)</span>
                    {effectiveRole === 'treasurer' && <span className="text-emerald-400">✓</span>}
                  </button>
                  <button
                    onClick={() => {
                      setSimulatedRole('viewer');
                      setRoleDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3 py-1.5 flex items-center justify-between hover:bg-slate-700 ${
                      effectiveRole === 'viewer' ? 'text-amber-300 font-bold' : 'text-slate-200'
                    }`}
                  >
                    <span>Viewer (Read-Only)</span>
                    {effectiveRole === 'viewer' && <span className="text-amber-400">✓</span>}
                  </button>
                  {simulatedRole && (
                    <>
                      <div className="border-t border-slate-700/80 my-1"></div>
                      <button
                        onClick={() => {
                          setSimulatedRole(null);
                          setRoleDropdownOpen(false);
                        }}
                        className="w-full text-left px-3 py-1.5 text-slate-400 hover:text-white hover:bg-slate-700"
                      >
                        Reset to Actual ({currentRole})
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Cloud Sync Badge */}
            <div className="hidden md:flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-slate-800 border border-slate-700 text-[11px]">
              <span
                className={`w-2 h-2 rounded-full ${
                  syncStatus === 'synced'
                    ? 'bg-emerald-400 animate-pulse'
                    : syncStatus === 'syncing'
                    ? 'bg-amber-400 animate-spin'
                    : 'bg-slate-400'
                }`}
              />
              <span className="text-slate-300 font-medium">
                {syncStatus === 'synced' ? 'Cloud DB Synced' : syncStatus === 'syncing' ? 'Syncing...' : 'Local Cache'}
              </span>
            </div>

            {/* User Profile */}
            <div className="relative">
              <button
                id="user-profile-btn"
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center space-x-2 pl-2 text-slate-300 hover:text-white cursor-pointer"
              >
                <div className="w-8 h-8 rounded-full bg-emerald-800 text-emerald-100 flex items-center justify-center font-bold text-xs border border-emerald-600">
                  {currentUser?.name
                    ? currentUser.name
                        .split(' ')
                        .map((n) => n[0])
                        .join('')
                        .substring(0, 2)
                        .toUpperCase()
                    : 'U'}
                </div>
                <div className="hidden lg:block text-left text-xs leading-tight">
                  <div className="font-semibold text-slate-200 truncate max-w-[120px]">
                    {currentUser?.name || 'User Account'}
                  </div>
                  <div className="text-[10px] text-slate-400 truncate max-w-[120px]">
                    {currentUser?.email || ''}
                  </div>
                </div>
              </button>

              {userDropdownOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-slate-800 rounded-lg shadow-xl border border-slate-700 py-1.5 z-50 text-xs">
                  <div className="px-3 py-2 border-b border-slate-700">
                    <div className="font-bold text-white">{currentUser?.name || 'User Account'}</div>
                    <div className="text-[11px] text-slate-400">{currentUser?.email || ''}</div>
                    <div className="mt-1 flex items-center justify-between text-[11px]">
                      <span className="text-slate-400">Org Role:</span>
                      <span className="text-emerald-400 font-semibold uppercase">{currentRole}</span>
                    </div>
                  </div>

                  <div className="p-2">
                    <button
                      id="logout-btn"
                      onClick={() => {
                        setUserDropdownOpen(false);
                        logout();
                      }}
                      className="w-full text-left px-3 py-2 text-rose-300 hover:text-rose-100 hover:bg-rose-950/50 rounded-lg text-xs flex items-center space-x-2 cursor-pointer font-semibold transition"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sign Out (Logout)</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
