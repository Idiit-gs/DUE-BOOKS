import React, { useState } from 'react';
import { useDuesBook } from '../context/DuesBookContext';
import { ExpenseCategory } from '../types';
import { formatNaira } from '../utils/formatters';
import { ArrowDownRight, X, DollarSign } from 'lucide-react';

interface AddExpenseModalProps {
  onClose: () => void;
}

export const AddExpenseModal: React.FC<AddExpenseModalProps> = ({ onClose }) => {
  const { currentOrg, addExpense } = useDuesBook();

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<ExpenseCategory>('meeting_refreshment');
  const [amount, setAmount] = useState<number | ''>(15000);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [paidTo, setPaidTo] = useState('');
  const [paidFromType, setPaidFromType] = useState<'cash' | 'bank'>('cash');
  const [custodianOrBankName, setCustodianOrBankName] = useState(
    currentOrg?.custodians?.[0]
      ? currentOrg.custodians[0].name
      : currentOrg?.bankAccounts?.[0]
      ? currentOrg.bankAccounts[0].bankName
      : 'Cash with Treasurer'
  );
  const [approvedBy, setApprovedBy] = useState('Executive Committee');
  const [receiptRef, setReceiptRef] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');

  const handlePaidFromTypeChange = (type: 'cash' | 'bank') => {
    setPaidFromType(type);
    if (type === 'cash') {
      setCustodianOrBankName(
        currentOrg?.custodians[0]?.name || 'Treasurer (Petty Cash)'
      );
    } else {
      setCustodianOrBankName(
        currentOrg?.bankAccounts[0]?.bankName || 'First Bank Main Account'
      );
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Title / Purpose is required.');
      return;
    }
    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setError('Please enter a valid whole-naira amount greater than zero.');
      return;
    }
    if (!paidTo.trim()) {
      setError('Beneficiary / Vendor name is required.');
      return;
    }

    addExpense({
      title: title.trim(),
      category,
      amount: numAmount,
      date,
      paidTo: paidTo.trim(),
      paidFromType,
      custodianOrBankName: custodianOrBankName.trim(),
      approvedBy: approvedBy.trim(),
      receiptRef: receiptRef.trim() || undefined,
      description: description.trim() || undefined,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-150">
        <div className="bg-rose-950 text-rose-100 px-5 py-3.5 flex items-center justify-between border-b border-rose-800">
          <div className="flex items-center space-x-2">
            <ArrowDownRight className="w-5 h-5 text-rose-400" />
            <span className="font-bold text-sm">Log Association Expenditure</span>
          </div>
          <button
            onClick={onClose}
            className="text-rose-300 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          {error && (
            <div className="bg-rose-50 text-rose-800 p-2.5 rounded-lg border border-rose-200">
              {error}
            </div>
          )}

          <div>
            <label className="block font-bold text-slate-900 mb-1">
              Expense Title / Purpose *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Monthly General Meeting Refreshment & Drinks"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-rose-500 outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-900 mb-1">Expense Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white focus:ring-2 focus:ring-rose-500 outline-none capitalize"
              >
                <option value="meeting_refreshment">Meeting Refreshment</option>
                <option value="venue_rental">Venue Rental</option>
                <option value="welfare_support">Welfare Support</option>
                <option value="project_execution">Project Execution</option>
                <option value="printing_stationery">Printing & Stationery</option>
                <option value="bank_charges">Bank Charges</option>
                <option value="legal_admin">Legal & Secretarial</option>
                <option value="honorarium">Honorarium / Stipend</option>
                <option value="transport_logistics">Transport & Logistics</option>
                <option value="other">Other Outflow</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-900 mb-1">
                Amount (Whole ₦) *
              </label>
              <input
                type="number"
                min="1"
                step="1"
                required
                placeholder="e.g. 25000"
                value={amount}
                onChange={(e) =>
                  setAmount(e.target.value === '' ? '' : Math.max(1, parseInt(e.target.value, 10)))
                }
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono font-bold focus:ring-2 focus:ring-rose-500 outline-none"
              />
              <span className="text-[10px] text-rose-700 font-semibold block mt-0.5">
                {formatNaira(typeof amount === 'number' ? amount : 0)}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-900 mb-1">
                Beneficiary / Vendor Paid *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Madam Joy Catering Services"
                value={paidTo}
                onChange={(e) => setPaidTo(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-rose-500 outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-900 mb-1">Disbursement Date</label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-rose-500 outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200">
            <div>
              <label className="block font-bold text-slate-900 mb-1">Disbursed From</label>
              <div className="flex space-x-3 mt-1.5">
                <label className="flex items-center space-x-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="paidFromType"
                    checked={paidFromType === 'cash'}
                    onChange={() => handlePaidFromTypeChange('cash')}
                    className="text-rose-600 focus:ring-rose-500"
                  />
                  <span>Cash Custodian</span>
                </label>
                <label className="flex items-center space-x-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="paidFromType"
                    checked={paidFromType === 'bank'}
                    onChange={() => handlePaidFromTypeChange('bank')}
                    className="text-rose-600 focus:ring-rose-500"
                  />
                  <span>Bank Account</span>
                </label>
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-900 mb-1">
                {paidFromType === 'cash' ? 'Custodian Officer' : 'Bank Source'}
              </label>
              {paidFromType === 'cash' ? (
                <select
                  value={custodianOrBankName}
                  onChange={(e) => setCustodianOrBankName(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-xs bg-white focus:ring-1 focus:ring-rose-500 outline-none"
                >
                  {currentOrg?.custodians.map((c) => (
                    <option key={c.id} value={c.name}>
                      {c.name} ({c.role})
                    </option>
                  ))}
                </select>
              ) : (
                <select
                  value={custodianOrBankName}
                  onChange={(e) => setCustodianOrBankName(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-xs bg-white focus:ring-1 focus:ring-rose-500 outline-none"
                >
                  {currentOrg?.bankAccounts.map((b) => (
                    <option key={b.id} value={b.bankName}>
                      {b.bankName} ({b.accountNumber})
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-900 mb-1">Approval Authority</label>
              <input
                type="text"
                placeholder="e.g. Executive Committee / AGM"
                value={approvedBy}
                onChange={(e) => setApprovedBy(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-rose-500 outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-900 mb-1">
                Voucher / Receipt Reference
              </label>
              <input
                type="text"
                placeholder="e.g. VOU-2026-081"
                value={receiptRef}
                onChange={(e) => setReceiptRef(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-rose-500 outline-none font-mono"
              />
            </div>
          </div>

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
              className="px-5 py-2 rounded-lg bg-rose-700 hover:bg-rose-600 text-white font-bold shadow transition cursor-pointer"
            >
              Log Expenditure
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
