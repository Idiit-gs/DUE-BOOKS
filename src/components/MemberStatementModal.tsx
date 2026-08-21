import React, { useState } from 'react';
import { Member, Payment, Contribution } from '../types';
import { useDuesBook } from '../context/DuesBookContext';
import { formatNaira, formatDate, formatDateTime } from '../utils/formatters';
import { calcOutstanding, getMemberContributionStatus } from '../utils/financial';
import { printDocumentElement } from '../utils/printUtility';
import { openWhatsAppWithMessage } from '../utils/whatsapp';
import { OfficialLetterhead, DualSignatory } from './OfficialLetterhead';
import {
  X,
  Printer,
  Share2,
  Check,
  Building,
  Receipt,
  AlertCircle,
  CheckCircle2,
  Calendar,
  Phone,
  Mail,
  User,
} from 'lucide-react';

interface MemberStatementModalProps {
  member: Member;
  onClose: () => void;
  onViewReceipt: (payment: Payment) => void;
}

export const MemberStatementModal: React.FC<MemberStatementModalProps> = ({
  member,
  onClose,
  onViewReceipt,
}) => {
  const { currentOrg, currentOrgPayments, currentOrgContributions } = useDuesBook();
  const [copied, setCopied] = useState(false);

  // Filter member's payments
  const memberPayments = currentOrgPayments
    .filter((p) => p.memberId === member.id)
    .sort((a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime());

  const confirmedPayments = memberPayments.filter((p) => p.status === 'confirmed');
  const reversedPayments = memberPayments.filter((p) => p.status === 'reversed');

  const arrears = calcOutstanding(member.expectedBalance, member.paidBalance);
  const isCleared = arrears === 0;

  // Active contributions for this org
  const activeContributions = currentOrgContributions.filter((c) => c.status === 'active');

  // Print statement
  const handlePrint = () => {
    printDocumentElement(
      'printable-statement',
      `Statement-${member.memberNumber}-${currentOrg?.code || 'DUES'}`
    );
  };

  // WhatsApp text format
  const handleWhatsApp = () => {
    const lines = [
      `*${currentOrg?.name.toUpperCase() || 'DUES BOOK'}*`,
      `_OFFICIAL MEMBER STATEMENT OF ACCOUNT_`,
      `----------------------------------------`,
      `*Member:* ${member.fullName} (${member.memberNumber})`,
      `*Date Issued:* ${formatDate(new Date().toISOString())}`,
      `----------------------------------------`,
      `*Assigned Obligations:* ${formatNaira(member.expectedBalance)}`,
      `*Total Paid & Applied:* ${formatNaira(member.paidBalance)}`,
      `*Outstanding Balance:* ${formatNaira(arrears)}`,
      member.unallocatedCredit > 0
        ? `*Unallocated Credit:* ${formatNaira(member.unallocatedCredit)}`
        : '',
      `*Standing Status:* ${isCleared ? 'CLEARED / GOOD STANDING' : 'OUTSTANDING ARREARS'}`,
      `----------------------------------------`,
      `*Recent Receipts:*`,
      ...confirmedPayments.slice(0, 3).map(
        (p) => `• ${p.receiptNumber}: ${formatNaira(p.amount)} (${formatDate(p.paymentDate)})`
      ),
      `----------------------------------------`,
      `Every naira has a history. Thank you for your continued commitment.`,
    ].filter(Boolean);

    const fullMessage = lines.join('\n');
    openWhatsAppWithMessage(fullMessage, member.phone);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-auto animate-in zoom-in-95 duration-150">
        {/* Top Control Bar (Hidden on print) */}
        <div className="bg-slate-900 text-white px-5 py-3.5 flex items-center justify-between print:hidden">
          <div className="flex items-center space-x-2">
            <Receipt className="w-5 h-5 text-emerald-400" />
            <span className="font-bold text-sm">Official Member Statement</span>
            <span className="font-mono text-xs bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-slate-700">
              {member.memberNumber}
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleWhatsApp}
              className="flex items-center space-x-1.5 bg-emerald-700 hover:bg-emerald-600 text-white text-xs px-3 py-1.5 rounded-lg border border-emerald-600 transition cursor-pointer font-medium"
              title="Open Statement in WhatsApp"
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

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Statement Document Body */}
        <div className="p-6 sm:p-8 space-y-6 print:p-0 print:space-y-4 text-slate-900 bg-white" id="printable-statement">
          {/* Official Letterhead Header with Logo & Org Details */}
          <OfficialLetterhead
            organization={currentOrg}
            documentType="statement"
            documentTitle="Official Member Statement of Account"
            documentNumber={`STMT-${member.memberNumber}`}
            documentDate={formatDate(new Date().toISOString())}
            subtitle="Authoritative Member Audit Trail"
          />

          {/* Member Profile Snapshot */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Member Name</span>
              <span className="font-bold text-slate-900 text-sm">{member.fullName}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Member Number</span>
              <span className="font-mono font-bold text-slate-800">{member.memberNumber}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Category & Status</span>
              <span className="font-semibold text-slate-800 capitalize">
                {member.category} • {member.status}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Contact Phone</span>
              <span className="font-semibold text-slate-800">{member.phone || '—'}</span>
            </div>
          </div>

          {/* Financial Summary Card */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-slate-100/70 p-3 rounded-lg border border-slate-200">
              <div className="text-[10px] font-bold text-slate-500 uppercase">Assigned Obligations</div>
              <div className="text-base sm:text-lg font-bold text-slate-900 mt-1">
                {formatNaira(member.expectedBalance)}
              </div>
            </div>

            <div className="bg-emerald-50 p-3 rounded-lg border border-emerald-200">
              <div className="text-[10px] font-bold text-emerald-700 uppercase">Total Applied Paid</div>
              <div className="text-base sm:text-lg font-bold text-emerald-800 mt-1">
                {formatNaira(member.paidBalance)}
              </div>
            </div>

            <div className={`p-3 rounded-lg border ${isCleared ? 'bg-emerald-50/50 border-emerald-200' : 'bg-amber-50 border-amber-200'}`}>
              <div className={`text-[10px] font-bold uppercase ${isCleared ? 'text-emerald-700' : 'text-amber-700'}`}>
                Outstanding Arrears
              </div>
              <div className={`text-base sm:text-lg font-bold mt-1 ${isCleared ? 'text-emerald-800' : 'text-amber-800'}`}>
                {formatNaira(arrears)}
              </div>
            </div>

            <div className="bg-sky-50 p-3 rounded-lg border border-sky-200">
              <div className="text-[10px] font-bold text-sky-700 uppercase">Retained Credit</div>
              <div className="text-base sm:text-lg font-bold text-sky-800 mt-1">
                {formatNaira(member.unallocatedCredit)}
              </div>
            </div>
          </div>

          {/* Breakdown by Obligation / Contribution */}
          <div>
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2 flex items-center space-x-1.5">
              <span>Obligations Breakdown & Standing</span>
            </h3>
            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-2 px-3">Contribution / Purpose</th>
                    <th className="py-2 px-3">Type</th>
                    <th className="py-2 px-3 text-right">Assigned</th>
                    <th className="py-2 px-3 text-right">Paid</th>
                    <th className="py-2 px-3 text-right">Balance</th>
                    <th className="py-2 px-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {activeContributions.map((contrib) => {
                    const st = getMemberContributionStatus(member, contrib, currentOrgPayments);
                    return (
                      <tr key={contrib.id} className="hover:bg-slate-50/50">
                        <td className="py-2.5 px-3 font-medium text-slate-900">{contrib.name}</td>
                        <td className="py-2.5 px-3 uppercase text-[10px] text-slate-500">{contrib.type}</td>
                        <td className="py-2.5 px-3 text-right font-mono">
                          {contrib.type === 'donation' ? 'Voluntary' : formatNaira(st.expected)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-semibold text-emerald-700">
                          {formatNaira(st.paid)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-semibold text-slate-900">
                          {contrib.type === 'donation'
                            ? '—'
                            : st.status === 'exempt'
                            ? '₦0'
                            : formatNaira(st.outstanding)}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              st.status === 'cleared'
                                ? 'bg-emerald-100 text-emerald-800'
                                : st.status === 'donated'
                                ? 'bg-purple-100 text-purple-800'
                                : st.status === 'partial'
                                ? 'bg-amber-100 text-amber-800'
                                : st.status === 'exempt'
                                ? 'bg-slate-100 text-slate-600'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {st.status === 'exempt' ? 'EXEMPT / N/A' : st.status.toUpperCase()}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Chronological Payment Receipts History */}
          <div>
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
              Payment & Receipt History ({memberPayments.length} records)
            </h3>
            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-2 px-3">Date</th>
                    <th className="py-2 px-3">Receipt No.</th>
                    <th className="py-2 px-3">Method & Channel</th>
                    <th className="py-2 px-3 text-right">Amount</th>
                    <th className="py-2 px-3 text-center">Status</th>
                    <th className="py-2 px-3 text-right print:hidden">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {memberPayments.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-4 text-center text-slate-400 italic">
                        No payment records registered for this member yet.
                      </td>
                    </tr>
                  ) : (
                    memberPayments.map((p) => {
                      const isRev = p.status === 'reversed';
                      return (
                        <tr key={p.id} className={isRev ? 'bg-rose-50/30' : 'hover:bg-slate-50/50'}>
                          <td className="py-2.5 px-3 text-slate-600">{formatDate(p.paymentDate)}</td>
                          <td className="py-2.5 px-3 font-mono font-semibold text-slate-800">
                            {p.receiptNumber}
                          </td>
                          <td className="py-2.5 px-3 text-slate-600 capitalize">
                            {p.method.replace('_', ' ')}
                            {p.referenceNote ? ` • ${p.referenceNote}` : ''}
                          </td>
                          <td
                            className={`py-2.5 px-3 text-right font-mono font-bold ${
                              isRev ? 'text-slate-400 line-through' : 'text-slate-900'
                            }`}
                          >
                            {formatNaira(p.amount)}
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                isRev
                                  ? 'bg-rose-100 text-rose-800 border border-rose-300'
                                  : 'bg-emerald-100 text-emerald-800'
                              }`}
                            >
                              {p.status.toUpperCase()}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-right print:hidden">
                            <button
                              onClick={() => onViewReceipt(p)}
                              className="text-emerald-700 hover:text-emerald-900 font-semibold underline text-[11px] cursor-pointer"
                            >
                              Inspect Receipt
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Official Dual Signatory Certification with Financial Secretary & Executive Seal */}
          <DualSignatory
            organization={currentOrg}
            primaryOfficerName={currentOrg?.branding?.signatoryName || "Financial Secretary"}
            primaryOfficerRole={currentOrg?.branding?.signatoryTitle || "Authorized Financial Secretary"}
            secondaryOfficerName="Treasurer / President"
            secondaryOfficerRole="Executive General Secretary"
            dateSigned={formatDate(new Date().toISOString())}
            authCode={`STMT-${currentOrg?.code || 'DUES'}-${member.memberNumber}`}
            notes="Official financial standing certified by the Secretariat. All entries verified against ledger entries."
          />
        </div>
      </div>
    </div>
  );
};
