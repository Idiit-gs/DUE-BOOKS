import React, { useState } from 'react';
import { useDuesBook } from '../context/DuesBookContext';
import { Organization } from '../types';
import { Building2, X, Plus } from 'lucide-react';

interface CreateOrgModalProps {
  onClose: () => void;
  onSuccess: (org: Organization) => void;
}

export const CreateOrgModal: React.FC<CreateOrgModalProps> = ({ onClose, onSuccess }) => {
  const { createOrganization } = useDuesBook();

  const [name, setName] = useState('');
  const [type, setType] = useState<Organization['type']>('association');
  const [motto, setMotto] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Organization name is required.');
      return;
    }

    const newOrg = createOrganization({
      name: name.trim(),
      type,
      motto: motto.trim() || undefined,
      code: code.trim().toUpperCase() || undefined,
      currency: 'NGN',
    });

    onSuccess(newOrg);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center">
              <Building2 className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold">Start New Organization</h2>
              <p className="text-xs text-slate-400">Create a digital record book for an association or group</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-md transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {error && (
            <div className="p-3 bg-rose-50 text-rose-700 border border-rose-200 rounded-lg font-medium">
              {error}
            </div>
          )}

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Organization Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setError('');
              }}
              placeholder="e.g., Umunri Youth Association, Zenith Estate Club"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Organization Type
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as Organization['type'])}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white"
              >
                <option value="association">Association / Town Union</option>
                <option value="club">Social Club / Age Grade</option>
                <option value="estate">Estate / Residents Group</option>
                <option value="cooperative">Cooperative / Thrift</option>
                <option value="alumni">Alumni / Fellowship</option>
                <option value="other">Other Community</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Acronym / Short Code
              </label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="e.g., UYA, ZEC"
                maxLength={8}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs uppercase focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Motto / Slogan (Optional)
            </label>
            <input
              type="text"
              value={motto}
              onChange={(e) => setMotto(e.target.value)}
              placeholder="e.g., Unity, Progress and Accountability"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
            />
          </div>

          <div className="pt-4 border-t border-slate-200 flex items-center justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-600 hover:text-slate-900 border border-slate-300 rounded-lg font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-semibold flex items-center space-x-1.5 shadow-sm transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Organization</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
