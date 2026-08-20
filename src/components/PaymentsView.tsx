import React, { useState } from 'react';
import { useDuesBook } from '../context/DuesBookContext';
import { Payment } from '../types';
import { formatNaira, formatDate, formatDateTime } from '../utils/formatters';
import { calcTotalConfirmedInflow } from '../utils/financial';
import {
  Receipt,
  Search,
  Filter,
  Plus,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  ArrowUpRight,
  ShieldAlert,
  Info,
} from 'lucide-react';

interface PaymentsViewProps {
  onOpenRecordPayment: () => void;
  onViewReceipt: (payment: Payment) => void;
  onOpenReverseModal: (payment: Payment) => void;
}

export const PaymentsView: React.FC<PaymentsViewProps> = ({
  onOpenRecordPayment,
  onViewReceipt,
  onOpenReverseModal,
}) => {
  const { currentOrgPayments, canMutate, effectiveRole } = useDuesBook();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'confirmed' | 'reversed'>('all');
  const [methodFilter, setMethodFilter] = useState<string>('all');

  const confirmedPayments = currentOrgPayments.filter((p) => p.status === 'confirmed');
  const reversedPayments = currentOrgPayments.filter((p) => p.status === 'reversed');

  const totalConfirmedVolume = calcTotalConfirmedInflow(currentOrgPayments);
  const totalReversedVolume = reversedPayments.reduce((sum, p) => sum + (p.amount || 0), 0);

  const filteredPayments = currentOrgPayments.filter((p) => {
    // Search
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      p.receiptNumber.toLowerCase().includes(q) ||
      p.memberName.toLowerCase().includes(q) ||
      p.memberNumber.toLowerCase().includes(q) ||
      (p.referenceNote && p.referenceNote.toLowerCase().includes(q)) ||
      (p.channelDetails && p.channelDetails.toLowerCase().includes(q));

    if (!matchesSearch) return false;

    // Status filter
    if (statusFilter !== 'all' && p.status !== statusFilter) return false;

    // Method filter
    if (methodFilter !== 'all' && p.method !== methodFilter) return false;

    return true;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 flex items-center space-x-2">
            <Receipt className="w-6 h-6 text-emerald-700" />
            <span>Payments & Official Receipts</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Authoritative ledger of whole-naira transactions, allocations, and controlled reversals.
          </p>
        </div>

        {canMutate && (
          <button
            id="payments-record-btn"
            onClick={onOpenRecordPayment}
            className="flex items-center space-x-1.5 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg text-xs font-semibold shadow transition cursor-pointer self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Record Payment</span>
          </button>
        )}
      </div>

      {/* KPI Cards for Payments */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
            Confirmed Inflows ({confirmedPayments.length})
          </span>
          <div className="text-xl sm:text-2xl font-bold text-emerald-700 mt-1 font-mono">
            {formatNaira(totalConfirmedVolume)}
          </div>
          <div className="text-[11px] text-emerald-600 font-medium mt-0.5">
            Active and verified in financial balances
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
            Reversed Transactions ({reversedPayments.length})
          </span>
          <div className="text-xl sm:text-2xl font-bold text-rose-700 mt-1 font-mono">
            {formatNaira(totalReversedVolume)}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            Excluded from current received totals
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
            Total Issued Receipts
          </span>
          <div className="text-xl sm:text-2xl font-bold text-slate-900 mt-1 font-mono">
            {currentOrgPayments.length} Receipts
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            Traceable receipts issued with unique numbers
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        {/* Search Input */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by receipt no, member, ref..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
          />
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {/* Status Tabs */}
          <div className="flex items-center space-x-1">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
                statusFilter === 'all'
                  ? 'bg-slate-900 text-white font-semibold'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              All ({currentOrgPayments.length})
            </button>
            <button
              onClick={() => setStatusFilter('confirmed')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
                statusFilter === 'confirmed'
                  ? 'bg-emerald-700 text-white font-semibold'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Confirmed ({confirmedPayments.length})
            </button>
            <button
              onClick={() => setStatusFilter('reversed')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
                statusFilter === 'reversed'
                  ? 'bg-rose-700 text-white font-semibold'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Reversed ({reversedPayments.length})
            </button>
          </div>

          {/* Method Filter */}
          <select
            value={methodFilter}
            onChange={(e) => setMethodFilter(e.target.value)}
            className="px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs bg-white text-slate-700 focus:ring-2 focus:ring-emerald-500 outline-none capitalize"
          >
            <option value="all">All Methods</option>
            <option value="bank_transfer">Bank Transfer</option>
            <option value="cash">Cash at Hand</option>
            <option value="pos">POS Terminal</option>
            <option value="cheque">Cheque</option>
            <option value="mobile_money">Mobile Money</option>
          </select>
        </div>
      </div>

      {/* Payments Ledger Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Receipt No.</th>
                <th className="py-3 px-3">Date</th>
                <th className="py-3 px-3">Member</th>
                <th className="py-3 px-3">Channel / Method</th>
                <th className="py-3 px-3 text-right">Amount</th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-3">Recorded By</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-10 text-slate-400 text-xs">
                    No payment records match the current filters.
                  </td>
                </tr>
              ) : (
                filteredPayments.map((payment) => {
                  const isRev = payment.status === 'reversed';
                  const canReverse =
                    canMutate &&
                    !isRev &&
                    (effectiveRole === 'admin' || effectiveRole === 'treasurer');

                  return (
                    <tr
                      key={payment.id}
                      className={`hover:bg-slate-50/70 transition cursor-pointer ${
                        isRev ? 'bg-rose-50/30' : ''
                      }`}
                      onClick={() => onViewReceipt(payment)}
                    >
                      {/* Receipt Number */}
                      <td className="py-3 px-4">
                        <div className="font-mono font-bold text-slate-900 flex items-center space-x-1.5">
                          <span>{payment.receiptNumber}</span>
                        </div>
                      </td>

                      {/* Date */}
                      <td className="py-3 px-3 text-slate-600">{formatDate(payment.paymentDate)}</td>

                      {/* Member */}
                      <td className="py-3 px-3">
                        <div className="font-semibold text-slate-900">{payment.memberName}</div>
                        <div className="text-[10px] font-mono text-slate-400">
                          {payment.memberNumber}
                        </div>
                      </td>

                      {/* Method & Channel */}
                      <td className="py-3 px-3 text-slate-600">
                        <div className="capitalize font-medium text-slate-800">
                          {payment.method.replace('_', ' ')}
                        </div>
                        <div className="text-[10px] text-slate-400 truncate max-w-[150px]">
                          {payment.referenceNote || payment.channelDetails || '—'}
                        </div>
                      </td>

                      {/* Amount */}
                      <td
                        className={`py-3 px-3 text-right font-mono font-bold ${
                          isRev ? 'text-slate-400 line-through' : 'text-slate-900'
                        }`}
                      >
                        {formatNaira(payment.amount)}
                        {payment.unallocatedCredit > 0 && (
                          <div className="text-[9px] text-sky-600 font-normal">
                            +{formatNaira(payment.unallocatedCredit)} credit
                          </div>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-3 text-center">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            isRev
                              ? 'bg-rose-100 text-rose-800 border border-rose-300'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {payment.status.toUpperCase()}
                        </span>
                      </td>

                      {/* Officer */}
                      <td className="py-3 px-3 text-slate-500">
                        <div>{payment.recordedByName}</div>
                      </td>

                      {/* Action */}
                      <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => onViewReceipt(payment)}
                            className="text-emerald-700 hover:text-emerald-900 font-semibold underline text-[11px] cursor-pointer"
                          >
                            Receipt
                          </button>

                          {canReverse && (
                            <button
                              onClick={() => onOpenReverseModal(payment)}
                              className="text-rose-600 hover:text-rose-800 font-semibold text-[11px] bg-rose-50 px-2 py-0.5 rounded border border-rose-200 cursor-pointer"
                              title="Reverse payment with mandatory reason"
                            >
                              Reverse
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
