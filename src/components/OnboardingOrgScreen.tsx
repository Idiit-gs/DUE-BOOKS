import React, { useState } from 'react';
import { useDuesBook } from '../context/DuesBookContext';
import { Organization } from '../types';
import { Building2, Sparkles, ArrowRight, Shield, CheckCircle2, Landmark, LogOut } from 'lucide-react';

interface OnboardingOrgScreenProps {
  onCompleted?: () => void;
}

export const OnboardingOrgScreen: React.FC<OnboardingOrgScreenProps> = ({ onCompleted }) => {
  const { createOrganization, currentUser, logout } = useDuesBook();

  const [name, setName] = useState('');
  const [type, setType] = useState<Organization['type']>('association');
  const [motto, setMotto] = useState('');
  const [code, setCode] = useState('');
  const [bankName, setBankName] = useState('First Bank of Nigeria');
  const [accountNumber, setAccountNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please enter your organization or group name.');
      return;
    }

    setLoading(true);
    try {
      createOrganization({
        name: name.trim(),
        type,
        motto: motto.trim() || 'Every naira has a history.',
        code: code.trim().toUpperCase() || undefined,
        currency: 'NGN',
      });
      if (onCompleted) {
        onCompleted();
      }
    } catch (err: any) {
      console.error('Failed to create initial org:', err);
      setError(err.message || 'Failed to create organization.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-center items-center px-4 py-10 selection:bg-emerald-500 selection:text-white">
      <div className="max-w-xl w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-emerald-600 shadow-xl shadow-emerald-950/50 mb-3 border border-emerald-500/30">
            <Building2 className="w-8 h-8 text-emerald-100" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            Welcome to Dues Book, {currentUser.name}!
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-md mx-auto">
            Let&apos;s set up your first organization&apos;s digital record book. You will be assigned as the <strong>Administrator</strong>.
          </p>
        </div>

        {/* Wizard Card */}
        <div className="bg-slate-800/90 backdrop-blur-md rounded-2xl border border-slate-700/80 p-6 sm:p-8 shadow-2xl">
          {error && (
            <div className="mb-4 p-3 bg-rose-950/60 border border-rose-800 text-rose-200 text-xs rounded-lg">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">
                Organization / Group Name <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setError('');
                }}
                placeholder="e.g. Umunri Progressive Union, Class of 2005 Alumni, Unity Estate Association"
                className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white placeholder:text-slate-500 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Type of Organization
                </label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as Organization['type'])}
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                >
                  <option value="association">Town Union / Association</option>
                  <option value="club">Social Club / Age Grade</option>
                  <option value="alumni">Alumni / Fellowship Group</option>
                  <option value="church">Church / Religious Group</option>
                  <option value="community">Community / Residents Estate</option>
                  <option value="cooperative">Cooperative / Thrift Society</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Acronym / Code (Optional)
                </label>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="e.g. UPU, UEC, CSA"
                  maxLength={8}
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white uppercase placeholder:text-slate-500 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">
                Motto / Slogan (Optional)
              </label>
              <input
                type="text"
                value={motto}
                onChange={(e) => setMotto(e.target.value)}
                placeholder="e.g. Unity, Integrity, Progress and Transparency"
                className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white placeholder:text-slate-500 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
              />
            </div>

            <div className="p-4 bg-slate-900/70 border border-slate-700/60 rounded-xl space-y-3">
              <div className="flex items-center space-x-2 text-emerald-400 font-semibold">
                <Landmark className="w-4 h-4" />
                <span>Primary Bank Account (Optional)</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Bank Name</label>
                  <input
                    type="text"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    placeholder="e.g. Zenith Bank, GTBank, First Bank"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Account Number</label>
                  <input
                    type="text"
                    maxLength={10}
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, ''))}
                    placeholder="10-digit NUBAN"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white focus:ring-2 focus:ring-emerald-500 outline-none font-mono"
                  />
                </div>
              </div>
            </div>

            <div className="pt-3 flex items-center justify-between">
              <button
                type="button"
                onClick={() => logout?.()}
                className="px-3 py-2 text-slate-400 hover:text-white flex items-center space-x-1.5 cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>

              <button
                type="submit"
                disabled={loading}
                className="py-2.5 px-6 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg transition flex items-center space-x-2 shadow-lg shadow-emerald-950/40 disabled:opacity-50 cursor-pointer"
              >
                {loading ? (
                  <span>Initializing...</span>
                ) : (
                  <>
                    <span>Initialize Digital Record Book</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Benefits */}
        <div className="mt-6 grid grid-cols-3 gap-3 text-center text-[11px] text-slate-400">
          <div className="p-3 bg-slate-800/40 border border-slate-800 rounded-xl">
            <div className="font-semibold text-slate-200">100% Traceable</div>
            <div className="text-[10px]">Official sequential receipt numbers</div>
          </div>
          <div className="p-3 bg-slate-800/40 border border-slate-800 rounded-xl">
            <div className="font-semibold text-slate-200">Cloud Storage</div>
            <div className="text-[10px]">Persistent Firestore sync</div>
          </div>
          <div className="p-3 bg-slate-800/40 border border-slate-800 rounded-xl">
            <div className="font-semibold text-slate-200">Audit Proof</div>
            <div className="text-[10px]">Strict reversal reasons and history</div>
          </div>
        </div>
      </div>
    </div>
  );
};
