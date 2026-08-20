import React, { useState } from 'react';
import { Payment } from '../types';
import { useDuesBook } from '../context/DuesBookContext';
import { formatNaira, formatDate } from '../utils/formatters';
import {
  RotateCcw,
  AlertTriangle,
  X,
  ShieldAlert,
  CheckCircle2,
} from 'lucide-react';

interface ReversePaymentModalProps {
  payment: Payment;
  onClose: () => void;
  onSuccess: (message: string) => void;
}

export const ReversePaymentModal: React.FC<ReversePaymentModalProps> = ({
  payment,
  onClose,
  onSuccess,
}) => {
  const { reversePayment } = useDuesBook();
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const nonDonationAmount = payment.allocations
    .filter((a) => a.contributionType !== 'donation')
    .reduce((sum, a) => sum + (a.amount || 0), 0);

  const handleReverse = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim() || reason.trim().length < 5) {
      setError('A meaningful reversal reason is compulsory (minimum 5 characters).');
      return;
    }

    setIsSubmitting(true);
    const result = reversePayment(payment.id, reason.trim());
    setIsSubmitting(false);

    if (result.success) {
      onSuccess(result.message);
      onClose();
    } else {
      setError(result.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-rose-200 overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-rose-950 text-rose-100 px-5 py-3.5 flex items-center justify-between border-b border-rose-800">
          <div className="flex items-center space-x-2">
            <ShieldAlert className="w-5 h-5 text-rose-400" />
            <span className="font-bold text-sm">Controlled Payment Reversal</span>
          </div>
          <button
            onClick={onClose}
            className="text-rose-300 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleReverse} className="p-6 space-y-4 text-xs">
          {error && (
            <div className="bg-rose-50 text-rose-800 p-3 rounded-lg border border-rose-300 font-medium">
              {error}
            </div>
          )}

          {/* Transaction Metadata Card */}
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold">Receipt ID</span>
                <div className="font-mono font-bold text-slate-900 text-sm">{payment.receiptNumber}</div>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-400 uppercase font-bold">Total Amount</span>
                <div className="font-mono font-bold text-rose-700 text-sm">{formatNaira(payment.amount)}</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200 text-[11px]">
              <div>
                <span className="text-slate-500">Member:</span>{' '}
                <span className="font-semibold text-slate-800">{payment.memberName}</span>
              </div>
              <div className="text-right">
                <span className="text-slate-500">Date:</span>{' '}
                <span className="font-semibold text-slate-800">{formatDate(payment.paymentDate)}</span>
              </div>
            </div>
          </div>

          {/* Audit Rule Warning */}
          <div className="bg-rose-50 p-3.5 rounded-xl border border-rose-200 text-rose-900 space-y-1.5">
            <div className="font-bold flex items-center space-x-1.5 text-rose-800">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>Financial Correction Policy</span>
            </div>
            <ul className="list-disc list-inside text-[11px] text-rose-800 space-y-1">
              <li>
                This payment will be marked as <strong className="uppercase font-mono">Reversed</strong> rather than deleted.
              </li>
              <li>
                <strong>{formatNaira(nonDonationAmount)}</strong> will be safely subtracted from {payment.memberName}&apos;s paid balance.
              </li>
              <li>
                Contribution received totals will automatically exclude this receipt.
              </li>
              <li>
                An immutable audit event with your identity, reversal reason, and timestamp will be permanently logged.
              </li>
            </ul>
          </div>

          {/* Compulsory Reason Input */}
          <div>
            <label className="block font-bold text-slate-900 mb-1">
              Compulsory Reversal Reason *
            </label>
            <textarea
              required
              rows={3}
              placeholder="e.g. Duplicate bank transfer entry. Transfer failed reconciliation with bank statement."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none"
            />
            <span className="text-[10px] text-slate-400 block mt-0.5">
              Explain why this receipt is being reversed. This reason appears on all subsequent receipt inspections and audit exports.
            </span>
          </div>

          {/* Modal Actions */}
          <div className="pt-3 border-t border-slate-200 flex justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 rounded-lg bg-rose-700 hover:bg-rose-600 text-white font-bold shadow transition flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Confirm Reversal</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
