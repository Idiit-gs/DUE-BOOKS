import React, { useState } from 'react';
import { useDuesBook } from '../context/DuesBookContext';
import { formatNaira, formatDate } from '../utils/formatters';
import {
  calcCollectionRate,
  calcOutstanding,
  calcTotalCompulsoryAssigned,
  calcTotalConfirmedInflow,
  calcTotalExpenses,
  calcContributionExpected,
  calcContributionReceived,
} from '../utils/financial';
import { printDocumentElement } from '../utils/printUtility';
import {
  FileSpreadsheet,
  Printer,
  Download,
  Share2,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  Building,
  DollarSign,
  Users,
  Coins,
  ArrowDownRight,
  Filter,
} from 'lucide-react';

export const ReportsView: React.FC = () => {
  const {
    currentOrg,
    currentOrgMembers,
    currentOrgContributions,
    currentOrgPayments,
    currentOrgExpenses,
  } = useDuesBook();

  const [activeReportTab, setActiveReportTab] = useState<
    'obligations' | 'defaulters' | 'income_expense' | 'member_roster'
  >('obligations');

  const activeMembers = currentOrgMembers.filter((m) => m.status === 'active');
  const activeMembersCount = activeMembers.length;

  const totalExpected = calcTotalCompulsoryAssigned(activeMembers);
  const totalInflows = calcTotalConfirmedInflow(currentOrgPayments);
  const totalExpenses = calcTotalExpenses(currentOrgExpenses);
  const netTreasury = Math.max(0, totalInflows - totalExpenses);

  // Defaulters list (members with arrears > 0)
  const defaulters = activeMembers
    .filter((m) => calcOutstanding(m.expectedBalance, m.paidBalance) > 0)
    .sort(
      (a, b) =>
        calcOutstanding(b.expectedBalance, b.paidBalance) -
        calcOutstanding(a.expectedBalance, a.paidBalance)
    );

  const totalArrearsOwing = defaulters.reduce(
    (sum, m) => sum + calcOutstanding(m.expectedBalance, m.paidBalance),
    0
  );

  const handlePrint = () => {
    const reportTitle = `${currentOrg?.name || 'Dues Book'} - ${
      activeReportTab === 'obligations'
        ? 'Obligations Schedule'
        : activeReportTab === 'defaulters'
        ? 'Defaulters Schedule'
        : activeReportTab === 'income_expense'
        ? 'Income & Expenditure'
        : 'Member Ledger'
    }`;
    printDocumentElement('printable-report', reportTitle);
  };

  const handleExportCSV = () => {
    let csvContent = 'data:text/csv;charset=utf-8,';

    if (activeReportTab === 'defaulters') {
      csvContent += 'Member Number,Full Name,Category,Phone,Email,Expected (NGN),Paid (NGN),Arrears Outstanding (NGN)\n';
      defaulters.forEach((m) => {
        const arr = calcOutstanding(m.expectedBalance, m.paidBalance);
        csvContent += `"${m.memberNumber}","${m.fullName}","${m.category}","${m.phone}","${m.email || ''}",${m.expectedBalance},${m.paidBalance},${arr}\n`;
      });
    } else if (activeReportTab === 'obligations') {
      csvContent += 'Obligation Name,Type,Frequency,Assigned Per Member (NGN),Total Target Expected (NGN),Total Collected (NGN),Collection Rate (%)\n';
      currentOrgContributions.forEach((c) => {
        const exp = calcContributionExpected(c, activeMembers);
        const rec = calcContributionReceived(c.id, currentOrgPayments);
        const rate = c.type === 'donation' ? 100 : calcCollectionRate(exp, rec);
        csvContent += `"${c.name}","${c.type}","${c.frequency}",${c.amount},${exp},${rec},${rate}%\n`;
      });
    } else if (activeReportTab === 'income_expense') {
      csvContent += 'Category,Type,Amount (NGN)\n';
      csvContent += `"Total Confirmed Receipts / Inflows","INCOME",${totalInflows}\n`;
      csvContent += `"Total Disbursed Expenditures","EXPENSE",${totalExpenses}\n`;
      csvContent += `"Net Surplus Treasury Position","SURPLUS",${netTreasury}\n\n`;
      csvContent += 'Expenditure Breakdown:\n';
      csvContent += 'Date,Title,Category,Beneficiary,Source,Amount (NGN)\n';
      currentOrgExpenses.forEach((e) => {
        csvContent += `"${e.date}","${e.title}","${e.category}","${e.paidTo}","${e.custodianOrBankName}",${e.amount}\n`;
      });
    } else {
      csvContent += 'Member Number,Full Name,Category,Status,Expected (NGN),Paid (NGN),Balance Outstanding (NGN)\n';
      activeMembers.forEach((m) => {
        const arr = calcOutstanding(m.expectedBalance, m.paidBalance);
        csvContent += `"${m.memberNumber}","${m.fullName}","${m.category}","${m.status}",${m.expectedBalance},${m.paidBalance},${arr}\n`;
      });
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `${currentOrg?.code || 'dues'}_${activeReportTab}_report_${new Date().toISOString().split('T')[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 flex items-center space-x-2">
            <FileSpreadsheet className="w-6 h-6 text-emerald-700" />
            <span>Financial Statements & Reports</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Authoritative executive reports, arrears debtor schedules, and cash flow accounts.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleExportCSV}
            className="flex items-center space-x-1.5 bg-slate-800 hover:bg-slate-700 text-slate-100 px-3 py-2 rounded-lg text-xs font-semibold shadow transition cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center space-x-1.5 bg-emerald-600 hover:bg-emerald-500 text-white px-3.5 py-2 rounded-lg text-xs font-semibold shadow transition cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* Report Navigation Tabs (Hidden on print) */}
      <div className="bg-white p-2 rounded-xl border border-slate-200 shadow-xs flex items-center space-x-1 overflow-x-auto print:hidden">
        <button
          onClick={() => setActiveReportTab('obligations')}
          className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center space-x-1.5 ${
            activeReportTab === 'obligations'
              ? 'bg-slate-900 text-white'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Coins className="w-4 h-4" />
          <span>Obligations & Levies Collection</span>
        </button>

        <button
          onClick={() => setActiveReportTab('defaulters')}
          className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center space-x-1.5 ${
            activeReportTab === 'defaulters'
              ? 'bg-amber-700 text-white'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <AlertTriangle className="w-4 h-4" />
          <span>Defaulters & Arrears Schedule ({defaulters.length})</span>
        </button>

        <button
          onClick={() => setActiveReportTab('income_expense')}
          className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center space-x-1.5 ${
            activeReportTab === 'income_expense'
              ? 'bg-emerald-700 text-white'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>Income & Expenditure Account</span>
        </button>

        <button
          onClick={() => setActiveReportTab('member_roster')}
          className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center space-x-1.5 ${
            activeReportTab === 'member_roster'
              ? 'bg-blue-700 text-white'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Full Member Ledger Roster</span>
        </button>
      </div>

      {/* Printable Report Canvas */}
      <div id="printable-report" className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6 print:border-none print:shadow-none print:p-0">
        {/* Printable Executive Letterhead */}
        <div className="border-b-2 border-slate-900 pb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-widest text-emerald-700">
              Executive Financial Statement
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 mt-0.5">
              {currentOrg?.name}
            </h1>
            <p className="text-xs text-slate-500 italic mt-0.5">&ldquo;{currentOrg?.motto}&rdquo;</p>
          </div>

          <div className="text-left sm:text-right text-xs">
            <div className="font-bold text-slate-900 uppercase">
              {activeReportTab === 'obligations' && 'Dues & Levies Collection Schedule'}
              {activeReportTab === 'defaulters' && 'Outstanding Arrears & Defaulters List'}
              {activeReportTab === 'income_expense' && 'Statement of Income & Expenditure'}
              {activeReportTab === 'member_roster' && 'Master Member Standing Ledger'}
            </div>
            <div className="text-slate-500">
              As of: {formatDate(new Date().toISOString().split('T')[0])}
            </div>
            <div className="text-[11px] text-slate-400">Version 7.0 Authoritative Record</div>
          </div>
        </div>

        {/* 1. Obligations & Levies Report Tab */}
        {activeReportTab === 'obligations' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">
                  Total Active Members
                </span>
                <span className="text-xl font-bold text-slate-900 font-mono">
                  {activeMembersCount} Members
                </span>
              </div>
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">
                  Total Compulsory Target
                </span>
                <span className="text-xl font-bold text-slate-900 font-mono">
                  {formatNaira(totalExpected)}
                </span>
              </div>
              <div className="p-3.5 bg-emerald-50 rounded-xl border border-emerald-200">
                <span className="text-[10px] text-emerald-800 uppercase font-bold block">
                  Total Confirmed Collected
                </span>
                <span className="text-xl font-bold text-emerald-800 font-mono">
                  {formatNaira(totalInflows)}
                </span>
              </div>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
              <table className="w-full text-left">
                <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">Obligation Title</th>
                    <th className="py-2.5 px-3">Category</th>
                    <th className="py-2.5 px-3 text-right">Per Member</th>
                    <th className="py-2.5 px-3 text-right">Total Target</th>
                    <th className="py-2.5 px-3 text-right">Total Collected</th>
                    <th className="py-2.5 px-3 text-right">Performance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {currentOrgContributions.map((c) => {
                    const isDonation = c.type === 'donation';
                    const exp = calcContributionExpected(c, activeMembers);
                    const rec = calcContributionReceived(c.id, currentOrgPayments);
                    const rate = isDonation ? 100 : calcCollectionRate(exp, rec);

                    return (
                      <tr key={c.id} className="hover:bg-slate-50">
                        <td className="py-2.5 px-3 font-semibold text-slate-900">{c.name}</td>
                        <td className="py-2.5 px-3">
                          <span className="capitalize text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                            {c.type}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-slate-700">
                          {isDonation ? 'Free-will' : formatNaira(c.amount)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-slate-700">
                          {isDonation ? 'Voluntary' : formatNaira(exp)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-700">
                          {formatNaira(rec)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-semibold text-slate-900">
                          {isDonation ? 'N/A' : `${rate}%`}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 2. Defaulters & Arrears Schedule Tab */}
        {activeReportTab === 'defaulters' && (
          <div className="space-y-4">
            <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div>
                <span className="text-[10px] uppercase font-bold text-amber-800">
                  Total Outstanding Member Arrears
                </span>
                <div className="text-2xl font-bold text-amber-900 font-mono mt-0.5">
                  {formatNaira(totalArrearsOwing)}
                </div>
                <div className="text-amber-700 text-[11px] mt-0.5">
                  {defaulters.length} out of {activeMembersCount} active members are currently owing.
                </div>
              </div>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
              <table className="w-full text-left">
                <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">Member</th>
                    <th className="py-2.5 px-3">Contact Phone</th>
                    <th className="py-2.5 px-3 text-right">Expected Dues</th>
                    <th className="py-2.5 px-3 text-right">Amount Paid</th>
                    <th className="py-2.5 px-3 text-right">Arrears Debt</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {defaulters.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-slate-400">
                        Splendid! No members are owing arrears. All accounts in good standing.
                      </td>
                    </tr>
                  ) : (
                    defaulters.map((m) => {
                      const arr = calcOutstanding(m.expectedBalance, m.paidBalance);
                      return (
                        <tr key={m.id} className="hover:bg-slate-50">
                          <td className="py-2.5 px-3">
                            <div className="font-semibold text-slate-900">{m.fullName}</div>
                            <div className="text-[10px] font-mono text-slate-400">
                              {m.memberNumber} • {m.category}
                            </div>
                          </td>
                          <td className="py-2.5 px-3 text-slate-600">{m.phone || '—'}</td>
                          <td className="py-2.5 px-3 text-right font-mono text-slate-600">
                            {formatNaira(m.expectedBalance)}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-semibold text-emerald-700">
                            {formatNaira(m.paidBalance)}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-amber-700">
                            {formatNaira(arr)}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 3. Income & Expenditure Statement Tab */}
        {activeReportTab === 'income_expense' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3.5 bg-emerald-50 rounded-xl border border-emerald-200">
                <span className="text-[10px] uppercase font-bold text-emerald-800 block">
                  Total Income / Receipts
                </span>
                <span className="text-xl font-bold text-emerald-800 font-mono">
                  {formatNaira(totalInflows)}
                </span>
              </div>

              <div className="p-3.5 bg-rose-50 rounded-xl border border-rose-200">
                <span className="text-[10px] uppercase font-bold text-rose-800 block">
                  Total Expenditures
                </span>
                <span className="text-xl font-bold text-rose-800 font-mono">
                  {formatNaira(totalExpenses)}
                </span>
              </div>

              <div className="p-3.5 bg-sky-50 rounded-xl border border-sky-200">
                <span className="text-[10px] uppercase font-bold text-sky-800 block">
                  Net Surplus Reserve
                </span>
                <span className="text-xl font-bold text-slate-900 font-mono">
                  {formatNaira(netTreasury)}
                </span>
              </div>
            </div>

            <div className="pt-2">
              <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider mb-2">
                Itemized Expenditures
              </h3>
              <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
                <table className="w-full text-left">
                  <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3">Item / Description</th>
                      <th className="py-2.5 px-3">Category</th>
                      <th className="py-2.5 px-3">Disbursed From</th>
                      <th className="py-2.5 px-3 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {currentOrgExpenses.map((exp) => (
                      <tr key={exp.id} className="hover:bg-slate-50">
                        <td className="py-2 px-3 text-slate-600">{formatDate(exp.date)}</td>
                        <td className="py-2 px-3">
                          <div className="font-semibold text-slate-900">{exp.title}</div>
                          <div className="text-[10px] text-slate-400">Paid to: {exp.paidTo}</div>
                        </td>
                        <td className="py-2 px-3 capitalize text-[10px] font-medium text-slate-600">
                          {exp.category.replace('_', ' ')}
                        </td>
                        <td className="py-2 px-3 text-slate-600 text-[11px]">
                          [{exp.paidFromType}] {exp.custodianOrBankName}
                        </td>
                        <td className="py-2 px-3 text-right font-mono font-bold text-rose-700">
                          {formatNaira(exp.amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* 4. Full Member Ledger Roster Tab */}
        {activeReportTab === 'member_roster' && (
          <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
            <table className="w-full text-left">
              <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">No.</th>
                  <th className="py-2.5 px-3">Member Name</th>
                  <th className="py-2.5 px-3">Category</th>
                  <th className="py-2.5 px-3 text-right">Expected Dues</th>
                  <th className="py-2.5 px-3 text-right">Paid Dues</th>
                  <th className="py-2.5 px-3 text-right">Arrears</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {activeMembers.map((m) => {
                  const arr = calcOutstanding(m.expectedBalance, m.paidBalance);
                  return (
                    <tr key={m.id} className="hover:bg-slate-50">
                      <td className="py-2 px-3 font-mono text-slate-500">{m.memberNumber}</td>
                      <td className="py-2 px-3 font-semibold text-slate-900">{m.fullName}</td>
                      <td className="py-2 px-3 capitalize text-slate-600">{m.category}</td>
                      <td className="py-2 px-3 text-right font-mono text-slate-600">
                        {formatNaira(m.expectedBalance)}
                      </td>
                      <td className="py-2 px-3 text-right font-mono font-semibold text-emerald-700">
                        {formatNaira(m.paidBalance)}
                      </td>
                      <td
                        className={`py-2 px-3 text-right font-mono font-bold ${
                          arr > 0 ? 'text-amber-700' : 'text-slate-400'
                        }`}
                      >
                        {formatNaira(arr)}
                      </td>
                      <td className="py-2 px-3 text-center">
                        <span
                          className={`text-[9px] uppercase font-bold px-1.5 py-0.2 rounded ${
                            arr === 0
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {arr === 0 ? 'CLEARED' : 'OWING'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Authentication Signature Stamp */}
        <div className="pt-6 border-t border-slate-200 grid grid-cols-2 gap-4 text-xs">
          <div>
            <div className="text-[10px] text-slate-400 uppercase font-bold">Certified Correct By:</div>
            <div className="font-semibold text-slate-900 mt-3">_______________________________</div>
            <div className="text-[11px] text-slate-500">Treasurer / Financial Secretary</div>
          </div>

          <div className="text-right">
            <div className="text-[10px] text-slate-400 uppercase font-bold">Approved By:</div>
            <div className="font-semibold text-slate-900 mt-3">_______________________________</div>
            <div className="text-[11px] text-slate-500">President / General Secretary</div>
          </div>
        </div>
      </div>
    </div>
  );
};
