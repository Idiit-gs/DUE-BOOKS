import React, { useState } from 'react';
import { Payment } from '../types';
import { useDuesBook } from '../context/DuesBookContext';
import {
  formatNaira,
  formatDate,
  formatDateTime,
  numberToWordsNaira,
} from '../utils/formatters';
import { printDocumentElement } from '../utils/printUtility';
import { openWhatsAppWithMessage } from '../utils/whatsapp';
import {
  X,
  Printer,
  Share2,
  Check,
  Building,
  Receipt,
  RotateCcw,
  ShieldCheck,
  AlertTriangle,
  CreditCard,
  User,
  Calendar,
  ExternalLink,
} from 'lucide-react';

interface ReceiptModalProps {
  payment: Payment;
  onClose: () => void;
  onOpenReverseModal: (payment: Payment) => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  payment,
  onClose,
  onOpenReverseModal,
}) => {
  const { currentOrg, currentOrgMembers, canMutate, effectiveRole } = useDuesBook();
  const [copied, setCopied] = useState(false);

  const member = currentOrgMembers.find((m) => m.id === payment.memberId);
  const isReversed = payment.status === 'reversed';
  const canReverse = canMutate && !isReversed && (effectiveRole === 'admin' || effectiveRole === 'treasurer');

  const handlePrint = () => {
    printDocumentElement(
      'printable-receipt',
      `Receipt-${payment.receiptNumber}-${currentOrg?.code || 'DUES'}`
    );
  };

  const handleWhatsApp = () => {
    const lines = [
      `*${currentOrg?.name.toUpperCase() || 'DUES BOOK'}*`,
      `_OFFICIAL DIGITAL PAYMENT RECEIPT_`,
      `----------------------------------------`,
      `*Receipt No:* ${payment.receiptNumber}`,
      `*Status:* ${isReversed ? 'REVERSED / VOID' : 'CONFIRMED'}`,
      `*Member:* ${payment.memberName} (${payment.memberNumber})`,
      `*Amount Paid:* ${formatNaira(payment.amount)}`,
      `*Amount in Words:* ${numberToWordsNaira(payment.amount)}`,
      `*Date:* ${formatDate(payment.paymentDate)}`,
      `*Method:* ${payment.method.replace('_', ' ').toUpperCase()}`,
      payment.referenceNote ? `*Reference:* ${payment.referenceNote}` : '',
      payment.channelDetails ? `*Channel:* ${payment.channelDetails}` : '',
      `----------------------------------------`,
      `*Allocations Breakdown:*`,
      ...payment.allocations.map(
        (a) => `• ${a.contributionName}: ${formatNaira(a.amount)} (${a.contributionType})`
      ),
      payment.unallocatedCredit > 0
        ? `• Unallocated Credit Retained: ${formatNaira(payment.unallocatedCredit)}`
        : '',
      `----------------------------------------`,
      `*Balance Before:* ${formatNaira(payment.balanceBefore)}`,
      `*Balance After:* ${formatNaira(payment.balanceAfter)}`,
      `*Recorded By:* ${payment.recordedByName}`,
      isReversed ? `*Reversal Reason:* ${payment.reversalReason}` : '',
      `----------------------------------------`,
      `Every naira has a history. Dues Book v7.0`,
    ].filter(Boolean);

    const fullMessage = lines.join('\n');
    openWhatsAppWithMessage(fullMessage, member?.phone);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-auto animate-in zoom-in-95 duration-150">
        {/* Top Actions Control Bar (Hidden on print) */}
        <div className="bg-slate-900 text-white px-5 py-3.5 flex items-center justify-between print:hidden">
          <div className="flex items-center space-x-2">
            <Receipt className="w-5 h-5 text-emerald-400" />
            <span className="font-bold text-sm">Official Traceable Receipt</span>
            <span className="font-mono text-xs bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-slate-700">
              {payment.receiptNumber}
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleWhatsApp}
              className="flex items-center space-x-1.5 bg-emerald-700 hover:bg-emerald-600 text-white text-xs px-3 py-1.5 rounded-lg border border-emerald-600 transition cursor-pointer font-medium"
              title="Open receipt in WhatsApp"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-200" /> : <Share2 className="w-3.5 h-3.5" />}
              <span>{copied ? 'Opening WhatsApp...' : 'Send to WhatsApp'}</span>
            </button>

            <button
              onClick={handlePrint}
              className="flex items-center space-x-1.5 bg-slate-800 hover:bg-slate-700 text-slate-100 text-xs px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer border border-slate-700"
              title="Print or Save as PDF"
            >
              <Printer className="w-3.5 h-3.5 text-emerald-400" />
              <span>Print / PDF</span>
            </button>

            {canReverse && (
              <button
                onClick={() => {
                  onClose();
                  onOpenReverseModal(payment);
                }}
                className="flex items-center space-x-1.5 bg-rose-900/80 hover:bg-rose-800 text-rose-200 text-xs px-3 py-1.5 rounded-lg border border-rose-700 transition cursor-pointer"
                title="Reverse this confirmed payment with required reason"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reverse</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Official Receipt Body */}
        <div
          className="p-6 sm:p-8 space-y-6 text-slate-900 bg-white relative print:p-0 print:space-y-4"
          id="printable-receipt"
        >
          {/* Watermark for Reversed */}
          {isReversed && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-15">
              <span className="text-7xl sm:text-9xl font-black text-rose-600 border-8 border-rose-600 p-6 sm:p-12 rotate-[-25deg] uppercase">
                REVERSED
              </span>
            </div>
          )}

          {/* Reversal Banner if reversed */}
          {isReversed && (
            <div className="bg-rose-50 border-2 border-rose-300 text-rose-900 p-4 rounded-xl text-xs space-y-1">
              <div className="font-bold flex items-center space-x-1.5 text-rose-800 text-sm">
                <AlertTriangle className="w-4 h-4 text-rose-700 shrink-0" />
                <span>PAYMENT REVERSED / AUDITED VOID</span>
              </div>
              <div>
                <span className="font-semibold">Compulsory Reason:</span> {payment.reversalReason}
              </div>
              <div className="text-[11px] text-rose-700 pt-1">
                Reversed by {payment.reversedByName} ({payment.reversedByEmail}) on{' '}
                {formatDateTime(payment.reversedAt)}. Member balance adjusted safely.
              </div>
            </div>
          )}

          {/* Header */}
          <div className="border-b-2 border-slate-900 pb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="text-[11px] font-bold uppercase tracking-widest text-emerald-700">
                Official Digital Receipt of Payment
              </div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 mt-0.5">
                {currentOrg?.name}
              </h1>
              <p className="text-xs text-slate-500 italic mt-0.5">&ldquo;{currentOrg?.motto}&rdquo;</p>
            </div>

            <div className="text-left sm:text-right text-xs">
              <div className="font-mono text-sm font-bold text-slate-900">{payment.receiptNumber}</div>
              <div className="text-slate-500 font-medium">Date: {formatDate(payment.paymentDate)}</div>
              <div className="text-[11px] text-slate-400">Org Code: {currentOrg?.code}</div>
            </div>
          </div>

          {/* Member & Transaction Meta */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Received From</span>
              <span className="font-bold text-slate-900 text-sm">{payment.memberName}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Member Number</span>
              <span className="font-mono font-bold text-slate-800">{payment.memberNumber}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Payment Method</span>
              <span className="font-semibold text-slate-800 capitalize">
                {payment.method.replace('_', ' ')}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Status</span>
              <span
                className={`font-bold uppercase text-[10px] px-2 py-0.5 rounded-full inline-block mt-0.5 ${
                  isReversed
                    ? 'bg-rose-100 text-rose-800 border border-rose-300'
                    : 'bg-emerald-100 text-emerald-800'
                }`}
              >
                {payment.status}
              </span>
            </div>
          </div>

          {/* Amount Box */}
          <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">
                Amount Received (Whole Naira)
              </span>
              <div
                className={`text-2xl sm:text-3xl font-black font-mono tracking-tight ${
                  isReversed ? 'text-slate-500 line-through' : 'text-emerald-900'
                }`}
              >
                {formatNaira(payment.amount)}
              </div>
            </div>

            <div className="text-left sm:text-right max-w-sm">
              <span className="text-[10px] font-bold uppercase text-slate-500 block">Amount in Words</span>
              <span className="text-xs font-semibold text-slate-800 italic">
                {numberToWordsNaira(payment.amount)}
              </span>
            </div>
          </div>

          {/* Details & Notes */}
          {(payment.referenceNote || payment.channelDetails) && (
            <div className="text-xs bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-1">
              {payment.channelDetails && (
                <div>
                  <span className="text-slate-400 font-medium">Channel / Account:</span>{' '}
                  <span className="font-semibold text-slate-800">{payment.channelDetails}</span>
                </div>
              )}
              {payment.referenceNote && (
                <div>
                  <span className="text-slate-400 font-medium">Reference / Note:</span>{' '}
                  <span className="text-slate-700">{payment.referenceNote}</span>
                </div>
              )}
            </div>
          )}

          {/* Allocation Breakdown Table */}
          <div>
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
              Payment Breakdown & Allocation
            </h3>
            <div className="border border-slate-200 rounded-lg overflow-hidden text-xs">
              <table className="w-full text-left">
                <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-2 px-3">Item / Contribution</th>
                    <th className="py-2 px-3">Type</th>
                    <th className="py-2 px-3 text-right">Allocated Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {payment.allocations.map((alloc, idx) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="py-2 px-3 font-medium text-slate-900">
                        {alloc.contributionName}
                      </td>
                      <td className="py-2 px-3 uppercase text-[10px] text-slate-500">
                        {alloc.contributionType}
                      </td>
                      <td className="py-2 px-3 text-right font-mono font-semibold text-slate-900">
                        {formatNaira(alloc.amount)}
                      </td>
                    </tr>
                  ))}

                  {payment.unallocatedCredit > 0 && (
                    <tr className="bg-sky-50/50">
                      <td className="py-2 px-3 font-semibold text-sky-800" colSpan={2}>
                        Unallocated Credit Retained in Member Account
                      </td>
                      <td className="py-2 px-3 text-right font-mono font-bold text-sky-800">
                        {formatNaira(payment.unallocatedCredit)}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Financial Position Snapshot */}
          <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50 p-3.5 rounded-xl border border-slate-200">
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">
                Member Arrears Before Payment
              </span>
              <span className="font-mono font-bold text-slate-800 text-sm">
                {formatNaira(payment.balanceBefore)}
              </span>
            </div>

            <div className="text-right">
              <span className="text-slate-400 block text-[10px] uppercase font-bold">
                Member Arrears After Payment
              </span>
              <span
                className={`font-mono font-bold text-sm ${
                  payment.balanceAfter === 0 ? 'text-emerald-700' : 'text-amber-700'
                }`}
              >
                {formatNaira(payment.balanceAfter)}
              </span>
            </div>
          </div>

          {/* Traceable Footer */}
          <div className="pt-4 border-t border-slate-200 grid grid-cols-2 gap-4 text-xs">
            <div>
              <div className="text-[10px] text-slate-400 uppercase font-bold">Recorded By</div>
              <div className="font-semibold text-slate-800 mt-1">{payment.recordedByName}</div>
              <div className="text-[11px] text-slate-500">{formatDateTime(payment.recordedAt)}</div>
            </div>

            <div className="text-right">
              <div className="text-[10px] text-slate-400 uppercase font-bold">Authentication Record</div>
              <div className="inline-block p-1.5 rounded border border-dashed border-emerald-600 bg-emerald-50 text-[10px] text-emerald-800 font-mono mt-1">
                AUTH-ID-{payment.id.toUpperCase().substring(0, 12)}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
