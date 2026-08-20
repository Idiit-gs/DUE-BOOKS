import React, { useState } from 'react';
import { useDuesBook } from '../context/DuesBookContext';
import { Expense, ExpenseCategory, BankAccount, Custodian } from '../types';
import { formatNaira, formatDate } from '../utils/formatters';
import { calcTotalConfirmedInflow, calcTotalExpenses } from '../utils/financial';
import {
  Landmark,
  Wallet,
  Plus,
  ArrowDownRight,
  UserCheck,
  Building2,
  Trash2,
  X,
  FileSpreadsheet,
  CheckCircle2,
  Search,
  Filter,
  DollarSign,
} from 'lucide-react';

interface TreasuryViewProps {
  onOpenAddExpense: () => void;
}

export const TreasuryView: React.FC<TreasuryViewProps> = ({ onOpenAddExpense }) => {
  const {
    currentOrg,
    currentOrgPayments,
    currentOrgExpenses,
    addExpense,
    deleteExpense,
    addBankAccount,
    addCustodian,
    canMutate,
  } = useDuesBook();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Add Bank Account Modal
  const [isAddBankModalOpen, setIsAddBankModalOpen] = useState(false);
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');

  // Add Custodian Modal
  const [isAddCustModalOpen, setIsAddCustModalOpen] = useState(false);
  const [custName, setCustName] = useState('');
  const [custRole, setCustRole] = useState('');
  const [custPhone, setCustPhone] = useState('');

  // Expenses calculations
  const totalInflows = calcTotalConfirmedInflow(currentOrgPayments);
  const totalExpenses = calcTotalExpenses(currentOrgExpenses);
  const netBalance = Math.max(0, totalInflows - totalExpenses);

  // Cash vs Bank expenses breakdown
  const cashExpenses = currentOrgExpenses
    .filter((e) => e.paidFromType === 'cash')
    .reduce((sum, e) => sum + (e.amount || 0), 0);

  const bankExpenses = currentOrgExpenses
    .filter((e) => e.paidFromType === 'bank')
    .reduce((sum, e) => sum + (e.amount || 0), 0);

  // Filtered expenses
  const filteredExpenses = currentOrgExpenses.filter((e) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      e.title.toLowerCase().includes(q) ||
      e.paidTo.toLowerCase().includes(q) ||
      e.custodianOrBankName.toLowerCase().includes(q) ||
      (e.receiptRef && e.receiptRef.toLowerCase().includes(q));

    if (!matchesSearch) return false;
    if (selectedCategory !== 'all' && e.category !== selectedCategory) return false;

    return true;
  });

  const handleSaveBank = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bankName.trim() || !accountNumber.trim()) return;
    addBankAccount({
      bankName: bankName.trim(),
      accountNumber: accountNumber.trim(),
      accountName: accountName.trim() || `${currentOrg?.name} Account`,
      initialBalance: 0,
    });
    setIsAddBankModalOpen(false);
    setBankName('');
    setAccountNumber('');
    setAccountName('');
  };

  const handleSaveCustodian = (e: React.FormEvent) => {
    e.preventDefault();
    if (!custName.trim() || !custRole.trim()) return;
    addCustodian({
      name: custName.trim(),
      role: custRole.trim(),
      phone: custPhone.trim() || undefined,
    });
    setIsAddCustModalOpen(false);
    setCustName('');
    setCustRole('');
    setCustPhone('');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 flex items-center space-x-2">
            <Landmark className="w-6 h-6 text-emerald-700" />
            <span>Treasury, Cash & Bank Book</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Authoritative tracking of cash at hand with officers, money in bank accounts, and expenditures.
          </p>
        </div>

        {canMutate && (
          <div className="flex items-center space-x-2">
            <button
              onClick={onOpenAddExpense}
              className="flex items-center space-x-1.5 bg-rose-700 hover:bg-rose-600 text-white px-3.5 py-2 rounded-lg text-xs font-semibold shadow transition cursor-pointer"
            >
              <ArrowDownRight className="w-4 h-4" />
              <span>Log Expenditure</span>
            </button>
          </div>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Inflows */}
        <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
              Total Inflows (Confirmed)
            </span>
            <span className="p-1.5 bg-emerald-50 text-emerald-700 rounded-md">
              <CheckCircle2 className="w-4 h-4" />
            </span>
          </div>
          <div className="text-xl sm:text-2xl font-bold text-emerald-700 font-mono mt-2">
            {formatNaira(totalInflows)}
          </div>
          <div className="text-[11px] text-emerald-600 mt-0.5 font-medium">
            From verified member receipts
          </div>
        </div>

        {/* Total Expenditures */}
        <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
              Total Disbursed Expenses
            </span>
            <span className="p-1.5 bg-rose-50 text-rose-700 rounded-md">
              <ArrowDownRight className="w-4 h-4" />
            </span>
          </div>
          <div className="text-xl sm:text-2xl font-bold text-rose-700 font-mono mt-2">
            {formatNaira(totalExpenses)}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            Cash: {formatNaira(cashExpenses)} • Bank: {formatNaira(bankExpenses)}
          </div>
        </div>

        {/* Net Treasury Balance */}
        <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
              Net Treasury Position
            </span>
            <span className="p-1.5 bg-sky-50 text-sky-700 rounded-md">
              <Wallet className="w-4 h-4" />
            </span>
          </div>
          <div className="text-xl sm:text-2xl font-bold text-slate-900 font-mono mt-2">
            {formatNaira(netBalance)}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            Surplus available across cash & bank holdings
          </div>
        </div>
      </div>

      {/* Custody Breakdown Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Money in the Bank */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-900 flex items-center space-x-2">
                <Landmark className="w-4 h-4 text-emerald-700" />
                <span>Money in the Bank</span>
              </h2>
              <p className="text-xs text-slate-500">Official institutional depository accounts.</p>
            </div>
            {canMutate && (
              <button
                onClick={() => setIsAddBankModalOpen(true)}
                className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center space-x-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Bank</span>
              </button>
            )}
          </div>

          <div className="space-y-2.5">
            {(currentOrg?.bankAccounts || []).map((b) => (
              <div
                key={b.id}
                className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between text-xs"
              >
                <div>
                  <div className="font-bold text-slate-900">{b.bankName}</div>
                  <div className="font-mono text-slate-600 font-medium">{b.accountNumber}</div>
                  <div className="text-[10px] text-slate-400">{b.accountName}</div>
                </div>
                <span className="text-[11px] font-bold bg-slate-100 text-slate-700 px-2.5 py-1 rounded">
                  Active Account
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Cash at Hand & Custodians */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-900 flex items-center space-x-2">
                <UserCheck className="w-4 h-4 text-emerald-700" />
                <span>Cash at Hand & Custodians</span>
              </h2>
              <p className="text-xs text-slate-500">
                Designated officers holding operational cash balances.
              </p>
            </div>
            {canMutate && (
              <button
                onClick={() => setIsAddCustModalOpen(true)}
                className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center space-x-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Custodian</span>
              </button>
            )}
          </div>

          <div className="space-y-2.5">
            {(currentOrg?.custodians || []).map((c) => (
              <div
                key={c.id}
                className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between text-xs"
              >
                <div>
                  <div className="font-bold text-slate-900">{c.name}</div>
                  <div className="text-slate-600 font-medium">{c.role}</div>
                  {c.phone && <div className="text-[10px] text-slate-400">{c.phone}</div>}
                </div>
                <span className="text-[11px] font-bold bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded border border-emerald-200">
                  Authorized Custodian
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Expenditures Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-900 text-sm">Expenditures & Outflows Log</h3>
            <p className="text-xs text-slate-500">
              Complete history of verified association expenses.
            </p>
          </div>

          <div className="flex items-center space-x-2 w-full sm:w-auto">
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search expenses..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs bg-white text-slate-700 capitalize outline-none"
            >
              <option value="all">All Categories</option>
              <option value="meeting_refreshment">Meeting Refreshment</option>
              <option value="venue_rental">Venue Rental</option>
              <option value="welfare_support">Welfare Support</option>
              <option value="project_execution">Project Execution</option>
              <option value="printing_stationery">Printing & Stationery</option>
              <option value="bank_charges">Bank Charges</option>
              <option value="honorarium">Honorarium</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-3">Title / Purpose</th>
                <th className="py-3 px-3">Category</th>
                <th className="py-3 px-3">Beneficiary / Vendor</th>
                <th className="py-3 px-3">Paid From</th>
                <th className="py-3 px-3 text-right">Amount</th>
                <th className="py-3 px-3">Approved By</th>
                {canMutate && <th className="py-3 px-4 text-right">Action</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-slate-400 text-xs">
                    No expenditure records found.
                  </td>
                </tr>
              ) : (
                filteredExpenses.map((exp) => (
                  <tr key={exp.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4 text-slate-600">{formatDate(exp.date)}</td>
                    <td className="py-3 px-3">
                      <div className="font-semibold text-slate-900">{exp.title}</div>
                      {exp.receiptRef && (
                        <div className="text-[10px] font-mono text-slate-400">
                          Ref: {exp.receiptRef}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-3">
                      <span className="capitalize text-[11px] font-medium px-2 py-0.5 bg-slate-100 rounded text-slate-700">
                        {exp.category.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-800 font-medium">{exp.paidTo}</td>
                    <td className="py-3 px-3 text-slate-600">
                      <span className="capitalize font-semibold text-slate-800 text-[11px]">
                        [{exp.paidFromType}]
                      </span>{' '}
                      {exp.custodianOrBankName}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-rose-700">
                      {formatNaira(exp.amount)}
                    </td>
                    <td className="py-3 px-3 text-slate-500">{exp.approvedBy}</td>
                    {canMutate && (
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => deleteExpense(exp.id)}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded transition cursor-pointer"
                          title="Delete Expense Entry"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Bank Modal */}
      {isAddBankModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md rounded-xl shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="bg-slate-900 text-white px-5 py-3.5 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Building2 className="w-4 h-4 text-emerald-400" />
                <span className="font-bold text-sm">Add Organization Bank Account</span>
              </div>
              <button
                onClick={() => setIsAddBankModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveBank} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Bank Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. First Bank of Nigeria"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Account Number (NUBAN) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 3089124450"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Account Name</label>
                <input
                  type="text"
                  placeholder="e.g. Apex Union Main Account"
                  value={accountName}
                  onChange={(e) => setAccountName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsAddBankModalOpen(false)}
                  className="px-3 py-2 rounded-lg text-slate-600 hover:bg-slate-100 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold shadow transition"
                >
                  Save Bank Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Custodian Modal */}
      {isAddCustModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md rounded-xl shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="bg-slate-900 text-white px-5 py-3.5 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <UserCheck className="w-4 h-4 text-emerald-400" />
                <span className="font-bold text-sm">Add Cash Custodian Officer</span>
              </div>
              <button
                onClick={() => setIsAddCustModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveCustodian} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Custodian Name (Officer) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Engr. Peter Orazulike"
                  value={custName}
                  onChange={(e) => setCustName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Role / Responsibility *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. President / Petty Cash Custodian"
                  value={custRole}
                  onChange={(e) => setCustRole(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Phone Contact</label>
                <input
                  type="tel"
                  placeholder="e.g. +234 803 123 4567"
                  value={custPhone}
                  onChange={(e) => setCustPhone(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsAddCustModalOpen(false)}
                  className="px-3 py-2 rounded-lg text-slate-600 hover:bg-slate-100 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold shadow transition"
                >
                  Authorize Custodian
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
