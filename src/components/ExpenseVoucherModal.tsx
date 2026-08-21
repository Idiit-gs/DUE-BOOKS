import React, { useState } from 'react';
import { Expense } from '../types';
import { useDuesBook } from '../context/DuesBookContext';
import { formatNaira, formatDate, formatDateTime, numberToWordsNaira } from '../utils/formatters';
import { printDocumentElement } from '../utils/printUtility';
import { OfficialLetterhead, DualSignatory } from './OfficialLetterhead';
import { openWhatsAppWithMessage } from '../utils/whatsapp';
import {
  X,
  Printer,
  Share2,
  Check,
  Building,
  Receipt,
  AlertTriangle,
  ArrowDownRight,
  Landmark,
  Wallet,
} from 'lucide-react';

interface ExpenseVoucherModalProps {
  expense: Expense;
  onClose: () => void;
}

export const ExpenseVoucherModal: React.FC<ExpenseVoucherModalProps> = ({ expense, onClose }) => {
  const { currentOrg } = useDuesBook();
  const [copied, setCopied] = useState(false);

  const handlePrint = () => {
    printDocumentElement(
      'printable-expense-voucher',
      `Voucher-${expense.id}-${currentOrg?.code || 'DUES'}`
    );
  };

  const handleWhatsApp = () => {
    const lines = [
      `*${currentOrg?.name.toUpperCase() || 'DUES BOOK'}*`,
      `_OFFICIAL EXPENDITURE / DISBURSEMENT VOUCHER_`,
      `----------------------------------------`,
      `*Voucher ID:* PV-${expense.id.toUpperCase().substring(0, 10)}`,
      `*Date:* ${formatDate(expense.date)}`,
      `*Payee / Beneficiary:* ${expense.paidTo}`,
      `*Purpose / Description:* ${expense.title}`,
      `*Category:* ${expense.category.replace('_', ' ').toUpperCase()}`,
      `*Disbursement Amount:* ${formatNaira(expense.amount)}`,
      `*Amount in Words:* ${numberToWordsNaira(expense.amount)}`,
      `*Disbursement Source:* [${expense.paidFromType.toUpperCase()}] ${expense.custodianOrBankName}`,
      `*Approved By:* ${expense.approvedBy}`,
      expense.receiptRef ? `*Reference Note:* ${expense.receiptRef}` : '',
      `----------------------------------------`,
      `Verified Treasury Document. Every naira has a history.`,
    ].filter(Boolean);

    openWhatsAppWithMessage(lines.join('\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-auto animate-in zoom-in-95 duration-150">
        {/* Top Control Bar (Hidden on print) */}
        <div className="bg-slate-900 text-white px-5 py-3.5 flex items-center justify-between print:hidden">
          <div className="flex items-center space-x-2">
            <Receipt className="w-5 h-5 text-emerald-400" />
            <span className="font-bold text-sm">Official Payment Voucher</span>
            <span className="font-mono text-xs bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-slate-700">
              PV-{expense.id.substring(0, 8)}
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleWhatsApp}
              className="flex items-center space-x-1.5 bg-emerald-700 hover:bg-emerald-600 text-white text-xs px-3 py-1.5 rounded-lg border border-emerald-600 transition cursor-pointer font-medium"
              title="Share Voucher on WhatsApp"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-200" /> : <Share2 className="w-3.5 h-3.5" />}
              <span>{copied ? 'Opening...' : 'WhatsApp'}</span>
            </button>

            <button
              onClick={handlePrint}
              className="flex items-center space-x-1.5 bg-slate-800 hover:bg-slate-700 text-slate-100 text-xs px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer border border-slate-700"
              title="Print or Save as PDF"
            >
              <Printer className="w-3.5 h-3.5 text-emerald-400" />
              <span>Print / PDF</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Voucher Body */}
        <div className="p-6 sm:p-8 space-y-6 print:p-0 print:space-y-4 text-slate-900 bg-white" id="printable-expense-voucher">
          {/* Official Letterhead Header with Logo & Org Details */}
          <OfficialLetterhead
            organization={currentOrg}
            documentType="voucher"
            documentTitle="Official Expenditure & Payment Voucher"
            documentNumber={`PV-${expense.id.toUpperCase().substring(0, 10)}`}
            documentDate={formatDate(expense.date)}
            subtitle="Treasury Disbursement Instrument"
          />

          {/* Payee & Disbursement Overview */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Paid To (Payee)</span>
              <span className="font-bold text-slate-900 text-sm">{expense.paidTo}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Category</span>
              <span className="font-semibold text-slate-800 capitalize">
                {expense.category.replace('_', ' ')}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Paid From Source</span>
              <span className="font-semibold text-slate-800">
                <span className="uppercase text-[10px] text-slate-500">[{expense.paidFromType}]</span> {expense.custodianOrBankName}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Authorization</span>
              <span className="font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full inline-block text-[10px]">
                {expense.approvedBy}
              </span>
            </div>
          </div>

          {/* Amount Box */}
          <div className="p-4 rounded-xl border border-rose-200 bg-rose-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-rose-800">
                Amount Disbursed (Whole Naira)
              </span>
              <div className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-rose-900">
                {formatNaira(expense.amount)}
              </div>
            </div>

            <div className="text-left sm:text-right max-w-sm">
              <span className="text-[10px] font-bold uppercase text-slate-500 block">Amount in Words</span>
              <span className="text-xs font-semibold text-slate-800 italic">
                {numberToWordsNaira(expense.amount)}
              </span>
            </div>
          </div>

          {/* Description & Purpose Box */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1.5">
            <span className="text-[10px] text-slate-400 uppercase font-bold block">Purpose & Particulars of Expenditure</span>
            <p className="font-semibold text-slate-900 leading-relaxed text-sm">{expense.title}</p>
            {expense.receiptRef && (
              <div className="text-[11px] text-slate-600 pt-1 border-t border-slate-200 font-mono">
                Supporting Reference / Invoice: <span className="font-bold text-slate-800">{expense.receiptRef}</span>
              </div>
            )}
          </div>

          {/* Dual Executive Certification Signatures */}
          <DualSignatory
            organization={currentOrg}
            primaryOfficerName={currentOrg?.branding?.signatoryName || "Financial Secretary"}
            primaryOfficerRole="Financial Secretary / Disbursing Officer"
            secondaryOfficerName={expense.approvedBy || "Treasurer / President"}
            secondaryOfficerRole="Executive Approving Authority"
            dateSigned={formatDate(expense.date)}
            authCode={`VOUCH-${currentOrg?.code || 'DUES'}-${expense.id.substring(0, 6)}`}
            notes="Valid expenditure voucher. Disbursed in accordance with organization constitution and treasury bylaws."
          />
        </div>
      </div>
    </div>
  );
};
