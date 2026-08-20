/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { DuesBookProvider, useDuesBook } from './context/DuesBookContext';
import { Navbar } from './components/Navbar';
import { Navigation } from './components/Navigation';
import { DashboardView } from './components/DashboardView';
import { MembersView } from './components/MembersView';
import { ContributionsView } from './components/ContributionsView';
import { PaymentsView } from './components/PaymentsView';
import { TreasuryView } from './components/TreasuryView';
import { ReportsView } from './components/ReportsView';
import { AdminView } from './components/AdminView';
import { RecordPaymentModal } from './components/RecordPaymentModal';
import { ReceiptModal } from './components/ReceiptModal';
import { ReversePaymentModal } from './components/ReversePaymentModal';
import { AddExpenseModal } from './components/AddExpenseModal';
import { CreateOrgModal } from './components/CreateOrgModal';
import { AuthScreen } from './components/AuthScreen';
import { OnboardingOrgScreen } from './components/OnboardingOrgScreen';
import { Payment } from './types';
import { CheckCircle2, Loader2 } from 'lucide-react';

const DuesBookMainApp: React.FC = () => {
  const {
    firebaseUser,
    authLoading,
    currentUser,
    organizations,
    isNewUserOnboarding,
    loginAsDemoUser,
  } = useDuesBook();

  const [activeTab, setActiveTab] = useState<
    'dashboard' | 'members' | 'contributions' | 'payments' | 'treasury' | 'reports' | 'admin'
  >('dashboard');

  // Modal State
  const [isRecordPaymentOpen, setIsRecordPaymentOpen] = useState(false);
  const [recordPaymentMemberId, setRecordPaymentMemberId] = useState<string | undefined>(undefined);
  const [activeReceiptPayment, setActiveReceiptPayment] = useState<Payment | null>(null);
  const [reversalTargetPayment, setReversalTargetPayment] = useState<Payment | null>(null);
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [isCreateOrgOpen, setIsCreateOrgOpen] = useState(false);
  const [globalNotice, setGlobalNotice] = useState<string | null>(null);

  const showToast = (message: string) => {
    setGlobalNotice(message);
    setTimeout(() => {
      setGlobalNotice((prev) => (prev === message ? null : prev));
    }, 5000);
  };

  const handleOpenRecordPayment = (memberId?: string) => {
    setRecordPaymentMemberId(memberId);
    setIsRecordPaymentOpen(true);
  };

  const handlePaymentRecorded = (payment: Payment) => {
    showToast(`Receipt #${payment.receiptNumber} issued successfully for ${payment.memberName}.`);
    setActiveReceiptPayment(payment);
  };

  const handleReversalSuccess = (message: string) => {
    showToast(message);
    if (activeReceiptPayment) {
      setActiveReceiptPayment(null);
    }
  };

  // 1. Initial loading state
  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white space-y-4">
        <Loader2 className="w-10 h-10 text-emerald-400 animate-spin" />
        <div className="text-sm text-slate-300 font-medium tracking-wide">
          Connecting to Dues Book Cloud Database...
        </div>
      </div>
    );
  }

  // 2. Authentication screen if no authenticated user session
  if (!firebaseUser && !currentUser) {
    return <AuthScreen onDemoSignIn={loginAsDemoUser} />;
  }

  // 3. New User Onboarding (if user has 0 organizations)
  if (isNewUserOnboarding || organizations.length === 0) {
    return <OnboardingOrgScreen onCompleted={() => showToast('Organization initialized successfully!')} />;
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 font-sans flex flex-col antialiased selection:bg-emerald-100 selection:text-emerald-900">
      {/* Toast Notification */}
      {globalNotice && (
        <div className="fixed top-4 right-4 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-2xl border border-slate-700 flex items-center space-x-2 text-xs animate-in slide-in-from-top-4 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="font-medium">{globalNotice}</span>
          <button
            onClick={() => setGlobalNotice(null)}
            className="ml-2 text-slate-400 hover:text-white font-bold cursor-pointer"
          >
            ×
          </button>
        </div>
      )}

      {/* Top Navbar */}
      <Navbar
        onOpenRecordPayment={() => handleOpenRecordPayment()}
        onOpenAddMember={() => setActiveTab('members')}
        onOpenAddContribution={() => setActiveTab('contributions')}
        onOpenAddExpense={() => setIsAddExpenseOpen(true)}
        onOpenNewOrg={() => setIsCreateOrgOpen(true)}
      />

      {/* Subheader Navigation */}
      <Navigation activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main View Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-6">
        {activeTab === 'dashboard' && (
          <DashboardView
            onNavigate={(tab) => setActiveTab(tab as any)}
            onNavigateTab={(tab) => setActiveTab(tab as any)}
            onOpenRecordPayment={handleOpenRecordPayment}
            onOpenAddMember={() => setActiveTab('members')}
            onOpenAddContribution={() => setActiveTab('contributions')}
            onOpenAddExpense={() => setIsAddExpenseOpen(true)}
            onViewReceipt={(p) => setActiveReceiptPayment(p)}
          />
        )}

        {activeTab === 'members' && (
          <MembersView
            onOpenRecordPayment={handleOpenRecordPayment}
            onViewReceipt={(p) => setActiveReceiptPayment(p)}
          />
        )}

        {activeTab === 'contributions' && (
          <ContributionsView onOpenRecordPayment={handleOpenRecordPayment} />
        )}

        {activeTab === 'payments' && (
          <PaymentsView
            onOpenRecordPayment={() => handleOpenRecordPayment()}
            onViewReceipt={(p) => setActiveReceiptPayment(p)}
            onOpenReverseModal={(p) => setReversalTargetPayment(p)}
          />
        )}

        {activeTab === 'treasury' && (
          <TreasuryView onOpenAddExpense={() => setIsAddExpenseOpen(true)} />
        )}

        {activeTab === 'reports' && <ReportsView />}

        {activeTab === 'admin' && <AdminView />}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-4 mt-auto print:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
          <div className="flex items-center space-x-2">
            <span className="font-bold text-slate-700">Dues Book</span>
            <span>•</span>
            <span>Version 7.0 Digital Record Book</span>
            <span>•</span>
            <span className="italic text-emerald-800">&ldquo;Every naira has a history.&rdquo;</span>
          </div>
          <div>
            Signed in as <span className="font-medium text-slate-700">{currentUser.name}</span> ({currentUser.email})
          </div>
        </div>
      </footer>

      {/* Global Modals */}
      {isRecordPaymentOpen && (
        <RecordPaymentModal
          initialMemberId={recordPaymentMemberId}
          onClose={() => {
            setIsRecordPaymentOpen(false);
            setRecordPaymentMemberId(undefined);
          }}
          onPaymentRecorded={handlePaymentRecorded}
        />
      )}

      {activeReceiptPayment && (
        <ReceiptModal
          payment={activeReceiptPayment}
          onClose={() => setActiveReceiptPayment(null)}
          onOpenReverseModal={(p) => {
            setActiveReceiptPayment(null);
            setReversalTargetPayment(p);
          }}
        />
      )}

      {reversalTargetPayment && (
        <ReversePaymentModal
          payment={reversalTargetPayment}
          onClose={() => setReversalTargetPayment(null)}
          onSuccess={handleReversalSuccess}
        />
      )}

      {isAddExpenseOpen && (
        <AddExpenseModal onClose={() => setIsAddExpenseOpen(false)} />
      )}

      {isCreateOrgOpen && (
        <CreateOrgModal
          onClose={() => setIsCreateOrgOpen(false)}
          onSuccess={(org) => showToast(`Organization "${org.name}" created and selected.`)}
        />
      )}
    </div>
  );
};

export default function App() {
  return (
    <DuesBookProvider>
      <DuesBookMainApp />
    </DuesBookProvider>
  );
}
