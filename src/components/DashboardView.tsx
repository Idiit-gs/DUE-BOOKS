import React from 'react';
import { useDuesBook } from '../context/DuesBookContext';
import {
  calcOutstanding,
  calcCollectionRate,
  calcContributionReceived,
  calcContributionExpected,
  calcTotalConfirmedInflow,
  calcTotalExpenses,
} from '../utils/financial';
import { formatNaira, formatDate } from '../utils/formatters';
import {
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Wallet,
  Landmark,
  ArrowUpRight,
  ArrowDownRight,
  Receipt,
  UserCheck,
  CreditCard,
  Building,
  HeartHandshake,
  ShieldCheck,
} from 'lucide-react';
import { Payment } from '../types';

interface DashboardViewProps {
  onOpenRecordPayment: (prefillMemberId?: string) => void;
  onOpenAddMember?: () => void;
  onOpenAddContribution?: () => void;
  onOpenAddExpense?: () => void;
  onViewReceipt: (payment: Payment) => void;
  onNavigateTab?: (tab: any) => void;
  onNavigate?: (tab: any) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onOpenRecordPayment,
  onOpenAddMember,
  onOpenAddContribution,
  onOpenAddExpense,
  onViewReceipt,
  onNavigateTab,
  onNavigate,
}) => {
  const handleNav = (tab: any) => {
    if (onNavigateTab) {
      onNavigateTab(tab);
    } else if (onNavigate) {
      onNavigate(tab);
    }
  };
  const {
    currentOrg,
    currentOrgMembers,
    currentOrgContributions,
    currentOrgPayments,
    currentOrgExpenses,
    canMutate,
    effectiveRole,
  } = useDuesBook();

  const activeMembers = currentOrgMembers.filter((m) => m.status === 'active');
  const activeMembersCount = activeMembers.length;

  // Compulsory Dues calculations
  const totalCompulsoryExpected = activeMembers.reduce((sum, m) => sum + (m.expectedBalance || 0), 0);
  const totalCompulsoryPaid = activeMembers.reduce((sum, m) => sum + (m.paidBalance || 0), 0);
  const totalOutstandingArrears = calcOutstanding(totalCompulsoryExpected, totalCompulsoryPaid);
  const globalCollectionRate = calcCollectionRate(totalCompulsoryExpected, totalCompulsoryPaid);

  // Treasury & Inflows
  const totalConfirmedInflows = calcTotalConfirmedInflow(currentOrgPayments);
  const totalExpenses = calcTotalExpenses(currentOrgExpenses);
  const netTreasuryBalance = Math.max(0, totalConfirmedInflows - totalExpenses);

  // Owing members
  const owingMembers = activeMembers
    .filter((m) => m.expectedBalance > m.paidBalance)
    .sort((a, b) => (b.expectedBalance - b.paidBalance) - (a.expectedBalance - a.paidBalance));

  // Recent payments
  const recentPayments = currentOrgPayments.slice(0, 6);

  // Active contributions breakdown
  const activeContributions = currentOrgContributions.filter((c) => c.status === 'active');

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Banner / Org Info */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 text-white rounded-xl p-5 shadow-sm border border-slate-700/60">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-800 text-emerald-100 uppercase tracking-wide">
                {currentOrg?.code || 'ORG'}
              </span>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                {currentOrg?.name}
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 italic">
              &ldquo;{currentOrg?.motto || 'Every naira has a history.'}&rdquo;
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {canMutate ? (
              <>
                <button
                  id="dashboard-record-payment-btn"
                  onClick={() => onOpenRecordPayment()}
                  className="flex items-center space-x-1.5 bg-emerald-600 hover:bg-emerald-500 text-white px-3.5 py-2 rounded-lg text-xs font-semibold shadow transition cursor-pointer"
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>Record Payment</span>
                </button>
                <button
                  id="dashboard-add-expense-btn"
                  onClick={() => onOpenAddExpense?.()}
                  className="flex items-center space-x-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 px-3 py-2 rounded-lg text-xs font-semibold shadow-xs transition cursor-pointer"
                >
                  <ArrowDownRight className="w-3.5 h-3.5 text-rose-400" />
                  <span>Log Expense</span>
                </button>
              </>
            ) : (
              <div className="flex items-center space-x-1.5 bg-slate-800/80 text-amber-300 border border-amber-500/40 px-3 py-1.5 rounded-lg text-xs">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Viewing as {effectiveRole.toUpperCase()} (Read-only)</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Primary KPI Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Levied / Expected */}
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
              Total Levied / Dues
            </span>
            <span className="p-1.5 rounded-md bg-slate-100 text-slate-600">
              <Building className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2">
            <div className="text-lg sm:text-2xl font-bold text-slate-900 tracking-tight">
              {formatNaira(totalCompulsoryExpected)}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              Assigned across {activeMembersCount} active members
            </div>
          </div>
        </div>

        {/* Total Collected */}
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
              Compulsory Dues Paid
            </span>
            <span className="p-1.5 rounded-md bg-emerald-50 text-emerald-700">
              <ArrowUpRight className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2">
            <div className="text-lg sm:text-2xl font-bold text-emerald-700 tracking-tight">
              {formatNaira(totalCompulsoryPaid)}
            </div>
            <div className="text-[11px] text-emerald-600 font-medium mt-0.5 flex items-center space-x-1">
              <CheckCircle2 className="w-3 h-3 inline" />
              <span>{globalCollectionRate}% collection rate</span>
            </div>
          </div>
        </div>

        {/* Outstanding Arrears */}
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
              Outstanding Arrears
            </span>
            <span className="p-1.5 rounded-md bg-amber-50 text-amber-700">
              <AlertCircle className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2">
            <div className="text-lg sm:text-2xl font-bold text-amber-700 tracking-tight">
              {formatNaira(totalOutstandingArrears)}
            </div>
            <div className="text-[11px] text-amber-600 font-medium mt-0.5">
              {owingMembers.length} of {activeMembersCount} members owing
            </div>
          </div>
        </div>

        {/* Net Treasury Balance */}
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
              Net Treasury Balance
            </span>
            <span className="p-1.5 rounded-md bg-sky-50 text-sky-700">
              <Wallet className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2">
            <div className="text-lg sm:text-2xl font-bold text-slate-900 tracking-tight">
              {formatNaira(netTreasuryBalance)}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              Inflows {formatNaira(totalConfirmedInflows)} • Expenses {formatNaira(totalExpenses)}
            </div>
          </div>
        </div>
      </div>

      {/* Treasury Structure: Cash at Hand with Custodians vs Bank Accounts */}
      <div className="bg-white rounded-xl p-4 sm:p-5 border border-slate-200 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
          <div>
            <h2 className="text-sm sm:text-base font-bold text-slate-900 flex items-center space-x-2">
              <Landmark className="w-4 h-4 text-emerald-700" />
              <span>Treasury Custody (Cash at Hand & Money in Bank)</span>
            </h2>
            <p className="text-xs text-slate-500">
              Traceable record of funds held with officers and financial institutions.
            </p>
          </div>
          <button
            onClick={() => handleNav('treasury')}
            className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 transition self-start sm:self-auto cursor-pointer"
          >
            Open Treasury Book →
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          {/* Bank Accounts Section */}
          <div className="bg-slate-50 rounded-lg p-3.5 border border-slate-200">
            <div className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center justify-between">
              <span className="flex items-center space-x-1.5">
                <Landmark className="w-3.5 h-3.5 text-slate-500" />
                <span>Bank Accounts ({currentOrg?.bankAccounts?.length || 0})</span>
              </span>
            </div>
            <div className="space-y-2">
              {(currentOrg?.bankAccounts || []).map((b) => (
                <div
                  key={b.id}
                  className="bg-white p-2.5 rounded-md border border-slate-200 flex items-center justify-between text-xs"
                >
                  <div>
                    <div className="font-semibold text-slate-900">{b.bankName}</div>
                    <div className="text-[11px] text-slate-500 font-mono">
                      {b.accountNumber} • {b.accountName}
                    </div>
                  </div>
                  <span className="text-[11px] font-semibold bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                    Active Channel
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Cash Custodians Section */}
          <div className="bg-slate-50 rounded-lg p-3.5 border border-slate-200">
            <div className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center justify-between">
              <span className="flex items-center space-x-1.5">
                <UserCheck className="w-3.5 h-3.5 text-slate-500" />
                <span>Cash Custodians ({currentOrg?.custodians?.length || 0})</span>
              </span>
            </div>
            <div className="space-y-2">
              {(currentOrg?.custodians || []).map((c) => (
                <div
                  key={c.id}
                  className="bg-white p-2.5 rounded-md border border-slate-200 flex items-center justify-between text-xs"
                >
                  <div>
                    <div className="font-semibold text-slate-900">{c.name}</div>
                    <div className="text-[11px] text-slate-500">{c.role} {c.phone ? `• ${c.phone}` : ''}</div>
                  </div>
                  <span className="text-[11px] font-semibold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded border border-emerald-200">
                    Authorized
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Dues Progress & Owing Members */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Contributions Collection Status */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl p-4 sm:p-5 border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h2 className="text-sm sm:text-base font-bold text-slate-900">
                  Dues, Levies & Free-Will Contributions
                </h2>
                <p className="text-xs text-slate-500">
                  Real-time collection performance (excluding reversed payments).
                </p>
              </div>
              <button
                onClick={() => handleNav('contributions')}
                className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 cursor-pointer"
              >
                View All ({activeContributions.length}) →
              </button>
            </div>

            <div className="space-y-3.5 mt-4">
              {activeContributions.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs">
                  No active dues or levies recorded yet.
                  {canMutate && (
                    <button
                      onClick={() => (onOpenAddContribution ? onOpenAddContribution() : handleNav('contributions'))}
                      className="block mx-auto mt-2 text-emerald-700 font-semibold hover:underline"
                    >
                      + Create First Contribution
                    </button>
                  )}
                </div>
              ) : (
                activeContributions.map((contrib) => {
                  const isDonation = contrib.type === 'donation';
                  const expected = calcContributionExpected(contrib, activeMembers);
                  const received = calcContributionReceived(contrib.id, currentOrgPayments);
                  const rate = isDonation ? 100 : calcCollectionRate(expected, received);

                  return (
                    <div
                      key={contrib.id}
                      className="p-3 rounded-lg border border-slate-200/90 hover:border-slate-300 transition bg-slate-50/50"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-semibold text-xs sm:text-sm text-slate-900">
                              {contrib.name}
                            </span>
                            <span
                              className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${
                                isDonation
                                  ? 'bg-purple-100 text-purple-800'
                                  : contrib.type === 'levy'
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-emerald-100 text-emerald-800'
                              }`}
                            >
                              {contrib.type}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-500 mt-0.5">
                            {isDonation
                              ? 'Voluntary free-will contribution (no compulsory obligation)'
                              : `${formatNaira(contrib.amount)} per member • ${contrib.frequency}`}
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="font-bold text-xs sm:text-sm text-slate-900">
                            {formatNaira(received)}
                          </div>
                          {!isDonation && (
                            <div className="text-[10px] text-slate-500">
                              of {formatNaira(expected)} ({rate}%)
                            </div>
                          )}
                          {isDonation && (
                            <div className="text-[10px] text-purple-700 font-medium flex items-center justify-end space-x-1">
                              <HeartHandshake className="w-3 h-3 inline" />
                              <span>Generosity Pool</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Progress Bar */}
                      {!isDonation && (
                        <div className="mt-2.5 w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              rate >= 100
                                ? 'bg-emerald-500'
                                : rate >= 50
                                ? 'bg-emerald-600'
                                : 'bg-amber-500'
                            }`}
                            style={{ width: `${rate}%` }}
                          />
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Recent Confirmed & Reversed Transactions */}
          <div className="bg-white rounded-xl p-4 sm:p-5 border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h2 className="text-sm sm:text-base font-bold text-slate-900">
                  Recent Payment Receipts
                </h2>
                <p className="text-xs text-slate-500">
                  Traceable receipt logs with before & after balances.
                </p>
              </div>
              <button
                onClick={() => handleNav('payments')}
                className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 cursor-pointer"
              >
                All Receipts ({currentOrgPayments.length}) →
              </button>
            </div>

            <div className="divide-y divide-slate-100 mt-2">
              {recentPayments.length === 0 ? (
                <div className="text-center py-6 text-slate-400 text-xs">
                  No payment records found.
                </div>
              ) : (
                recentPayments.map((payment) => {
                  const isRev = payment.status === 'reversed';
                  return (
                    <div
                      key={payment.id}
                      onClick={() => onViewReceipt(payment)}
                      className="py-2.5 flex items-center justify-between hover:bg-slate-50 px-2 rounded-lg cursor-pointer transition"
                    >
                      <div className="flex items-center space-x-3">
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                            isRev
                              ? 'bg-rose-100 text-rose-700'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          <Receipt className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-semibold text-xs text-slate-900">
                              {payment.memberName}
                            </span>
                            <span className="font-mono text-[10px] text-slate-500">
                              {payment.receiptNumber}
                            </span>
                            {isRev && (
                              <span className="text-[9px] uppercase font-bold bg-rose-100 text-rose-700 px-1.5 py-0.2 rounded border border-rose-300">
                                REVERSED
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-500">
                            {formatDate(payment.paymentDate)} • via{' '}
                            <span className="capitalize font-medium">
                              {payment.method.replace('_', ' ')}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <div
                          className={`font-bold text-xs sm:text-sm ${
                            isRev ? 'text-slate-400 line-through' : 'text-slate-900'
                          }`}
                        >
                          {formatNaira(payment.amount)}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {payment.allocations?.length || 0} items
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Right 1 Col: Top Owing Members / Arrears */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl p-4 sm:p-5 border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h2 className="text-sm sm:text-base font-bold text-slate-900">
                  Members with Arrears
                </h2>
                <p className="text-xs text-slate-500">
                  Highest outstanding dues balances.
                </p>
              </div>
              <button
                onClick={() => handleNav('members')}
                className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 cursor-pointer"
              >
                Roster →
              </button>
            </div>

            <div className="space-y-3 mt-3">
              {owingMembers.length === 0 ? (
                <div className="text-center py-8 text-emerald-600 text-xs font-medium bg-emerald-50/50 rounded-lg p-3">
                  <CheckCircle2 className="w-6 h-6 mx-auto mb-1 text-emerald-600" />
                  All active members are currently in good financial standing!
                </div>
              ) : (
                owingMembers.slice(0, 6).map((member) => {
                  const arrears = calcOutstanding(member.expectedBalance, member.paidBalance);
                  return (
                    <div
                      key={member.id}
                      className="p-2.5 rounded-lg border border-slate-200 bg-slate-50/70 flex items-center justify-between"
                    >
                      <div>
                        <div className="font-semibold text-xs text-slate-900">
                          {member.fullName}
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono">
                          {member.memberNumber} • Paid: {formatNaira(member.paidBalance)}
                        </div>
                      </div>

                      <div className="text-right flex items-center space-x-2">
                        <div>
                          <div className="font-bold text-xs text-amber-700">
                            {formatNaira(arrears)}
                          </div>
                          <div className="text-[9px] text-slate-400 uppercase">Arrears</div>
                        </div>

                        {canMutate && (
                          <button
                            onClick={() => onOpenRecordPayment(member.id)}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white px-2 py-1 rounded text-[11px] font-semibold transition cursor-pointer"
                            title="Record Payment for this member"
                          >
                            Pay
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Core Philosophy Notice */}
          <div className="bg-slate-900 text-white rounded-xl p-4 border border-slate-800 shadow-sm text-xs space-y-2">
            <div className="font-bold flex items-center space-x-1.5 text-emerald-400">
              <Receipt className="w-4 h-4" />
              <span>Version 7 Financial Governance</span>
            </div>
            <p className="text-slate-300 leading-relaxed">
              Dues Book never performs silent overwrites. Financial records are preserved through
              traceable reversals, non-negative bounds, whole naira calculations, and visible audit trails.
            </p>
            <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
              <span>Prepared for: Engr. Peter Orazulike</span>
              <span className="font-mono text-emerald-400">v7.0</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
