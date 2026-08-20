import React, { useState, useEffect } from 'react';
import { useDuesBook } from '../context/DuesBookContext';
import { Member, Contribution, PaymentMethod, PaymentAllocation, Payment } from '../types';
import { formatNaira, formatDate } from '../utils/formatters';
import { calcOutstanding, getMemberContributionStatus, isObligationApplicableToMember } from '../utils/financial';
import confetti from 'canvas-confetti';
import {
  CreditCard,
  X,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Landmark,
  User,
  HeartHandshake,
  Receipt,
  ArrowRight,
} from 'lucide-react';

interface RecordPaymentModalProps {
  initialMemberId?: string;
  onClose: () => void;
  onPaymentRecorded: (payment: Payment) => void;
}

export const RecordPaymentModal: React.FC<RecordPaymentModalProps> = ({
  initialMemberId,
  onClose,
  onPaymentRecorded,
}) => {
  const {
    currentOrg,
    currentOrgMembers,
    currentOrgContributions,
    currentOrgPayments,
    recordPayment,
  } = useDuesBook();

  const activeMembers = currentOrgMembers.filter((m) => m.status === 'active');
  const activeContributions = currentOrgContributions.filter((c) => c.status === 'active');

  const [selectedMemberId, setSelectedMemberId] = useState<string>(
    initialMemberId || activeMembers[0]?.id || ''
  );
  const [amount, setAmount] = useState<number | ''>(50000);
  const [method, setMethod] = useState<PaymentMethod>('bank_transfer');
  const [paymentDate, setPaymentDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [channelDetails, setChannelDetails] = useState<string>(
    currentOrg?.bankAccounts?.[0]
      ? `${currentOrg.bankAccounts[0].bankName} (${currentOrg.bankAccounts[0].accountNumber})`
      : 'Cash with Treasurer'
  );
  const [referenceNote, setReferenceNote] = useState('');
  const [allocations, setAllocations] = useState<{ [contribId: string]: number }>({});
  const [error, setError] = useState('');

  // Selected member object
  const selectedMember = activeMembers.find((m) => m.id === selectedMemberId);

  // Calculate member's current arrears
  const memberArrears = selectedMember
    ? calcOutstanding(selectedMember.expectedBalance, selectedMember.paidBalance)
    : 0;

  // Auto-fill channel if method changes
  useEffect(() => {
    if (method === 'cash') {
      const cust = currentOrg?.custodians?.[0];
      setChannelDetails(cust ? `Cash with ${cust.name}` : 'Cash with Treasurer');
    } else if (method === 'bank_transfer' || method === 'pos') {
      const bank = currentOrg?.bankAccounts?.[0];
      setChannelDetails(
        bank ? `${bank.bankName} (${bank.accountNumber})` : 'Association Bank Account'
      );
    }
  }, [method, currentOrg]);

  // Initial Auto-Allocation when Member or Amount changes
  const runSmartAutoAllocation = (targetAmount: number) => {
    if (!selectedMember || targetAmount <= 0) return;

    let remaining = targetAmount;
    const newAllocations: { [contribId: string]: number } = {};

    // 1. First allocate to compulsory dues and levies that have outstanding balances
    for (const contrib of activeContributions) {
      if (contrib.type === 'donation') continue;
      const st = getMemberContributionStatus(selectedMember, contrib, currentOrgPayments);
      if (st.outstanding > 0 && remaining > 0) {
        const toAlloc = Math.min(remaining, st.outstanding);
        newAllocations[contrib.id] = toAlloc;
        remaining -= toAlloc;
      } else {
        newAllocations[contrib.id] = 0;
      }
    }

    // 2. Free-will donation remains 0 unless explicitly typed
    for (const contrib of activeContributions) {
      if (contrib.type === 'donation') {
        newAllocations[contrib.id] = 0;
      }
    }

    setAllocations(newAllocations);
  };

  // Run auto allocation when member or amount changes if allocations are empty
  useEffect(() => {
    if (typeof amount === 'number' && amount > 0) {
      runSmartAutoAllocation(amount);
    }
  }, [selectedMemberId]);

  // Total allocated
  const totalAllocated = (Object.values(allocations) as number[]).reduce((sum: number, val: number) => sum + (val || 0), 0);
  const numAmount: number = typeof amount === 'number' ? amount : 0;
  const unallocatedCredit: number = Math.max(0, numAmount - totalAllocated);

  // Sum non-donation allocations to compute projected balance
  const appliedObligations: number = activeContributions
    .filter((c) => c.type !== 'donation')
    .reduce((sum: number, c) => sum + (allocations[c.id] || 0), 0);

  const projectedBalanceAfter = Math.max(0, memberArrears - appliedObligations);

  const handleAllocationChange = (contribId: string, val: number) => {
    const safeVal = Math.max(0, Math.round(val || 0));
    setAllocations((prev) => ({
      ...prev,
      [contribId]: safeVal,
    }));
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMember) {
      setError('Please select a member.');
      return;
    }

    if (numAmount <= 0) {
      setError('Please enter a whole-naira payment amount greater than zero.');
      return;
    }

    if (totalAllocated > numAmount) {
      setError('Total allocations cannot exceed the payment amount.');
      return;
    }

    // Prepare allocation array
    const allocArray: PaymentAllocation[] = activeContributions
      .map((c) => ({
        contributionId: c.id,
        contributionName: c.name,
        contributionType: c.type,
        amount: allocations[c.id] || 0,
      }))
      .filter((a) => a.amount > 0);

    const res = recordPayment({
      memberId: selectedMember.id,
      amount: numAmount,
      method,
      paymentDate,
      channelDetails,
      referenceNote: referenceNote.trim() || undefined,
      allocations: allocArray,
    });

    if (res.success && res.payment) {
      // Trigger festive confetti
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#059669', '#10b981', '#34d399', '#f59e0b'],
        });
      } catch {
        // ignore if not supported
      }

      onPaymentRecorded(res.payment);
      onClose();
    } else {
      setError(res.message || 'Failed to record payment.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-auto animate-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="bg-slate-900 text-white px-5 py-3.5 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <CreditCard className="w-5 h-5 text-emerald-400" />
            <span className="font-bold text-sm">Record Member Payment & Issue Receipt</span>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleFormSubmit} className="p-5 sm:p-6 space-y-4 text-xs">
          {error && (
            <div className="bg-rose-50 text-rose-800 p-3 rounded-lg border border-rose-200 font-medium">
              {error}
            </div>
          )}

          {/* Member Selector & Snapshot */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
            <div className="sm:col-span-2">
              <label className="block font-bold text-slate-900 mb-1">Select Member *</label>
              <select
                required
                value={selectedMemberId}
                onChange={(e) => setSelectedMemberId(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white focus:ring-2 focus:ring-emerald-500 outline-none"
              >
                {activeMembers.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.fullName} ({m.memberNumber}) • Arrears: {formatNaira(calcOutstanding(m.expectedBalance, m.paidBalance))}
                  </option>
                ))}
              </select>
            </div>

            <div className="bg-white p-2.5 rounded-lg border border-slate-200 text-right flex flex-col justify-center">
              <span className="text-[10px] uppercase font-bold text-slate-400">Current Arrears</span>
              <span className="text-sm font-bold text-amber-700 font-mono">
                {formatNaira(memberArrears)}
              </span>
              {selectedMember && selectedMember.unallocatedCredit > 0 && (
                <span className="text-[10px] text-sky-600">
                  +{formatNaira(selectedMember.unallocatedCredit)} credit
                </span>
              )}
            </div>
          </div>

          {/* Amount & Method Controls */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-bold text-slate-900 mb-1">
                Payment Amount (Whole ₦) *
              </label>
              <input
                type="number"
                min="1"
                step="1"
                required
                placeholder="e.g. 50000"
                value={amount}
                onChange={(e) => {
                  const val = e.target.value === '' ? '' : Math.max(1, parseInt(e.target.value, 10));
                  setAmount(val);
                  if (typeof val === 'number') {
                    runSmartAutoAllocation(val);
                  }
                }}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 outline-none"
              />
              <span className="text-[10px] text-emerald-700 font-semibold mt-0.5 block">
                {formatNaira(numAmount)}
              </span>
            </div>

            <div>
              <label className="block font-bold text-slate-900 mb-1">Payment Method</label>
              <select
                value={method}
                onChange={(e) => setMethod(e.target.value as PaymentMethod)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white focus:ring-2 focus:ring-emerald-500 outline-none capitalize"
              >
                <option value="bank_transfer">Bank Transfer</option>
                <option value="cash">Cash at Hand</option>
                <option value="pos">POS Terminal</option>
                <option value="cheque">Bank Cheque</option>
                <option value="mobile_money">Mobile Money</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-900 mb-1">Payment Date</label>
              <input
                type="date"
                required
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>
          </div>

          {/* Account Channel & Reference Note */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-900 mb-1">
                Account / Custodian Destination
              </label>
              <input
                type="text"
                placeholder="e.g. First Bank (3089124450) or Cash with Treasurer"
                value={channelDetails}
                onChange={(e) => setChannelDetails(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-900 mb-1">
                Transaction Reference / Evidence Note
              </label>
              <input
                type="text"
                placeholder="e.g. FBN Transfer Ref: TXN882910"
                value={referenceNote}
                onChange={(e) => setReferenceNote(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>
          </div>

          {/* Smart Allocation Breakdown Section */}
          <div className="border border-slate-200 rounded-xl p-3.5 bg-slate-50/50 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-bold text-slate-900 text-xs block">
                  Obligation Allocations & Voluntary Donations
                </span>
                <span className="text-[10px] text-slate-500">
                  Allocate received funds across specific dues, projects, or free-will donations.
                </span>
              </div>
              <button
                type="button"
                onClick={() => runSmartAutoAllocation(numAmount)}
                className="flex items-center space-x-1 text-emerald-700 bg-emerald-100/70 hover:bg-emerald-200 px-2.5 py-1 rounded-md text-[11px] font-semibold transition cursor-pointer"
              >
                <Sparkles className="w-3 h-3" />
                <span>Auto-Allocate</span>
              </button>
            </div>

            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {activeContributions
                .slice()
                .sort((a, b) => {
                  if (!selectedMember) return 0;
                  const aApp = isObligationApplicableToMember(a, selectedMember);
                  const bApp = isObligationApplicableToMember(b, selectedMember);
                  if (aApp && !bApp) return -1;
                  if (!aApp && bApp) return 1;
                  return 0;
                })
                .map((contrib) => {
                const isDonation = contrib.type === 'donation';
                const isApplicable = selectedMember
                  ? isObligationApplicableToMember(contrib, selectedMember)
                  : true;
                const st = selectedMember
                  ? getMemberContributionStatus(selectedMember, contrib, currentOrgPayments)
                  : { expected: 0, paid: 0, outstanding: 0, isApplicable: true };

                const currentAlloc = allocations[contrib.id] || 0;

                return (
                  <div
                    key={contrib.id}
                    className={`p-2 bg-white rounded-lg border flex items-center justify-between gap-3 text-xs ${
                      !isApplicable && !isDonation ? 'border-slate-200 bg-slate-50/50' : 'border-slate-200'
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-1.5 truncate">
                        <span className="font-semibold text-slate-900 truncate">
                          {contrib.name}
                        </span>
                        <span
                          className={`text-[9px] uppercase font-bold px-1.5 py-0.2 rounded shrink-0 ${
                            isDonation
                              ? 'bg-purple-100 text-purple-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {contrib.type}
                        </span>
                        {!isApplicable && !isDonation && (
                          <span className="text-[9px] font-medium px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 border border-slate-200 shrink-0">
                            Exempt / Not Targeted
                          </span>
                        )}
                        {isApplicable && contrib.targetType && contrib.targetType !== 'all' && (
                          <span className="text-[9px] font-medium px-1.5 py-0.2 rounded bg-indigo-50 text-indigo-700 border border-indigo-200 shrink-0">
                            Targeted
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {isDonation
                          ? 'Voluntary generosity (no compulsory debt)'
                          : !isApplicable
                          ? 'Not assigned to this member • Optional payment'
                          : `Assigned: ${formatNaira(st.expected)} • Remaining: ${formatNaira(st.outstanding)}`}
                      </div>
                    </div>

                    <div className="w-32 shrink-0">
                      <div className="relative">
                        <span className="absolute left-2 top-1.5 text-slate-400 font-mono text-[11px]">
                          ₦
                        </span>
                        <input
                          type="number"
                          min="0"
                          step="1"
                          placeholder="0"
                          value={currentAlloc === 0 ? '' : currentAlloc}
                          onChange={(e) =>
                            handleAllocationChange(
                              contrib.id,
                              parseInt(e.target.value || '0', 10)
                            )
                          }
                          className="w-full pl-6 pr-2 py-1 border border-slate-300 rounded text-xs font-mono text-right focus:ring-1 focus:ring-emerald-500 outline-none"
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Allocation Summary & Unallocated Credit */}
            <div className="pt-2 border-t border-slate-200 grid grid-cols-3 gap-2 text-center text-xs">
              <div className="bg-white p-2 rounded-lg border border-slate-200">
                <span className="text-[10px] text-slate-400 font-bold block">Total Allocated</span>
                <span className="font-bold text-slate-900 font-mono">
                  {formatNaira(totalAllocated)}
                </span>
              </div>

              <div
                className={`p-2 rounded-lg border ${
                  unallocatedCredit > 0
                    ? 'bg-sky-50 border-sky-200 text-sky-900'
                    : 'bg-white border-slate-200 text-slate-700'
                }`}
              >
                <span className="text-[10px] font-bold block">Unallocated Credit</span>
                <span className="font-bold font-mono">{formatNaira(unallocatedCredit)}</span>
              </div>

              <div className="bg-emerald-50 p-2 rounded-lg border border-emerald-200 text-emerald-900">
                <span className="text-[10px] font-bold block">Projected Arrears</span>
                <span className="font-bold font-mono">{formatNaira(projectedBalanceAfter)}</span>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="pt-2 border-t border-slate-200 flex justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100 font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow transition flex items-center space-x-1.5 cursor-pointer"
            >
              <Receipt className="w-4 h-4" />
              <span>Record & Generate Official Receipt</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
