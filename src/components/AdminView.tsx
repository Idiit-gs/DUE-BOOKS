import React, { useState } from 'react';
import { useDuesBook } from '../context/DuesBookContext';
import { UserRole, AuditEvent } from '../types';
import { formatDateTime, formatDate } from '../utils/formatters';
import {
  ShieldCheck,
  History,
  Users,
  Building,
  KeyRound,
  Download,
  RotateCcw,
  Plus,
  Search,
  CheckCircle2,
  AlertTriangle,
  FileJson,
  X,
  Lock,
  Trash2,
  Database,
  Flame,
  AlertCircle,
  Loader2,
  Check,
} from 'lucide-react';

export const AdminView: React.FC = () => {
  const {
    currentOrg,
    currentOrgId,
    currentOrgMemberships,
    currentOrgMembers,
    currentOrgContributions,
    currentOrgPayments,
    currentOrgExpenses,
    auditEvents,
    effectiveRole,
    canManageOfficers,
    addOfficer,
    updateOfficerRole,
    removeOfficer,
    updateOrganization,
    clearAllData,
    purgeOrganizationData,
  } = useDuesBook();

  const [activeTab, setActiveTab] = useState<'audit' | 'officers' | 'settings'>('audit');
  const [searchAudit, setSearchAudit] = useState('');
  const [filterAction, setFilterAction] = useState<string>('all');

  // Add Officer State
  const [isAddOfficerModalOpen, setIsAddOfficerModalOpen] = useState(false);
  const [officerName, setOfficerName] = useState('');
  const [officerEmail, setOfficerEmail] = useState('');
  const [officerRole, setOfficerRole] = useState<UserRole>('treasurer');
  const [officerPhone, setOfficerPhone] = useState('');
  const [officerTitle, setOfficerTitle] = useState('');

  // Org Settings State
  const [orgName, setOrgName] = useState(currentOrg?.name || '');
  const [orgMotto, setOrgMotto] = useState(currentOrg?.motto || '');
  const [orgCode, setOrgCode] = useState(currentOrg?.code || '');
  const [orgType, setOrgType] = useState(currentOrg?.type || 'association');
  const [settingsSuccess, setSettingsSuccess] = useState('');

  // Purge Test Data State
  const [isPurgeModalOpen, setIsPurgeModalOpen] = useState(false);
  const [purgeConfirmText, setPurgeConfirmText] = useState('');
  const [isPurging, setIsPurging] = useState(false);
  const [purgeResult, setPurgeResult] = useState<{ success?: boolean; message?: string } | null>(null);

  const filteredAuditEvents = (auditEvents || []).filter((ev) => {
    const q = searchAudit.toLowerCase();
    const matchesSearch =
      ev.action.toLowerCase().includes(q) ||
      ev.actorName.toLowerCase().includes(q) ||
      ev.details.toLowerCase().includes(q) ||
      (ev.reason && ev.reason.toLowerCase().includes(q)) ||
      ev.entityType.toLowerCase().includes(q);

    if (!matchesSearch) return false;
    if (filterAction !== 'all' && ev.action !== filterAction) return false;

    return true;
  });

  const handleSaveOfficer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!officerName.trim() || !officerEmail.trim()) return;

    addOfficer({
      userName: officerName.trim(),
      userEmail: officerEmail.trim(),
      role: officerRole,
    });

    setIsAddOfficerModalOpen(false);
    setOfficerName('');
    setOfficerEmail('');
    setOfficerPhone('');
    setOfficerTitle('');
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    updateOrganization(currentOrgId, {
      name: orgName.trim(),
      motto: orgMotto.trim(),
      code: orgCode.trim().toUpperCase(),
      type: orgType as any,
    });
    setSettingsSuccess('Organization details updated successfully.');
    setTimeout(() => setSettingsSuccess(''), 4000);
  };

  const handleExportFullBackup = () => {
    const backupData = {
      version: '7.0',
      exportedAt: new Date().toISOString(),
      organization: currentOrg,
      officers: currentOrgMemberships,
      members: currentOrgMembers,
      contributions: currentOrgContributions,
      payments: currentOrgPayments,
      expenses: currentOrgExpenses,
      auditEvents,
    };

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(backupData, null, 2));
    const dlAnchorElem = document.createElement('a');
    dlAnchorElem.setAttribute('href', dataStr);
    dlAnchorElem.setAttribute(
      'download',
      `duesbook_v7_backup_${currentOrg?.code || 'org'}_${new Date().toISOString().split('T')[0]}.json`
    );
    dlAnchorElem.click();
  };

  const handleOpenPurgeModal = () => {
    setPurgeConfirmText('');
    setPurgeResult(null);
    setIsPurgeModalOpen(true);
  };

  const handleExecutePurge = async () => {
    const expectedConfirm = currentOrg?.code ? currentOrg.code.toUpperCase() : 'CLEAR';
    if (purgeConfirmText.trim().toUpperCase() !== expectedConfirm && purgeConfirmText.trim().toUpperCase() !== 'CLEAR') {
      return;
    }

    setIsPurging(true);
    setPurgeResult(null);

    const res = await purgeOrganizationData(currentOrgId);
    setIsPurging(false);

    if (res.success) {
      setPurgeResult({
        success: true,
        message: res.message,
      });
      setTimeout(() => {
        setIsPurgeModalOpen(false);
      }, 2000);
    } else {
      setPurgeResult({
        success: false,
        message: res.message,
      });
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 flex items-center space-x-2">
            <ShieldCheck className="w-6 h-6 text-emerald-700" />
            <span>Administration & System Controls</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Immutable audit logs, role-based officer permissions, and organizational governance.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleExportFullBackup}
            className="flex items-center space-x-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-2 rounded-lg text-xs font-semibold shadow transition cursor-pointer"
          >
            <FileJson className="w-3.5 h-3.5" />
            <span>JSON Backup</span>
          </button>
        </div>
      </div>

      {/* Admin Nav Tabs */}
      <div className="bg-white p-2 rounded-xl border border-slate-200 shadow-xs flex items-center space-x-1 overflow-x-auto">
        <button
          onClick={() => setActiveTab('audit')}
          className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center space-x-1.5 ${
            activeTab === 'audit'
              ? 'bg-slate-900 text-white'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <History className="w-4 h-4" />
          <span>Immutable Audit Trail ({auditEvents?.length || 0})</span>
        </button>

        <button
          onClick={() => setActiveTab('officers')}
          className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center space-x-1.5 ${
            activeTab === 'officers'
              ? 'bg-slate-900 text-white'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <KeyRound className="w-4 h-4" />
          <span>Officers & Role Governance ({currentOrgMemberships?.length || 0})</span>
        </button>

        <button
          onClick={() => setActiveTab('settings')}
          className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center space-x-1.5 ${
            activeTab === 'settings'
              ? 'bg-slate-900 text-white'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Building className="w-4 h-4" />
          <span>Organization Profile & Settings</span>
        </button>
      </div>

      {/* Tab 1: Immutable Audit Trail */}
      {activeTab === 'audit' && (
        <div className="space-y-4">
          {/* Audit Search Bar */}
          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search audit trail by actor, reason, entity..."
                value={searchAudit}
                onChange={(e) => setSearchAudit(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            <div className="flex items-center space-x-2 w-full sm:w-auto">
              <select
                value={filterAction}
                onChange={(e) => setFilterAction(e.target.value)}
                className="px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs bg-white text-slate-700 outline-none"
              >
                <option value="all">All Actions</option>
                <option value="PAYMENT_RECORDED">Payment Recorded</option>
                <option value="PAYMENT_REVERSED">Payment Reversed</option>
                <option value="MEMBER_CREATED">Member Created</option>
                <option value="CONTRIBUTION_CREATED">Obligation Created</option>
                <option value="EXPENSE_RECORDED">Expense Recorded</option>
                <option value="OFFICER_ADDED">Officer Added</option>
              </select>
            </div>
          </div>

          {/* Audit Events List */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Timestamp</th>
                    <th className="py-3 px-3">Action Type</th>
                    <th className="py-3 px-3">Actor / Officer</th>
                    <th className="py-3 px-3">Details</th>
                    <th className="py-3 px-3">Compulsory Reason</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredAuditEvents.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-400 text-xs">
                        No audit events match your search query.
                      </td>
                    </tr>
                  ) : (
                    filteredAuditEvents.map((ev) => {
                      const isRev = ev.action === 'PAYMENT_REVERSED';
                      const isPay = ev.action === 'PAYMENT_RECORDED';

                      return (
                        <tr
                          key={ev.id}
                          className={`hover:bg-slate-50 ${isRev ? 'bg-rose-50/40' : ''}`}
                        >
                          <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                            {formatDateTime(ev.timestamp)}
                          </td>
                          <td className="py-3 px-3">
                            <span
                              className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                                isRev
                                  ? 'bg-rose-100 text-rose-800'
                                  : isPay
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-slate-100 text-slate-700'
                              }`}
                            >
                              {ev.action}
                            </span>
                          </td>
                          <td className="py-3 px-3">
                            <div className="font-semibold text-slate-900">{ev.actorName}</div>
                            <div className="text-[10px] text-slate-400 font-mono">
                              {ev.actorEmail}
                            </div>
                          </td>
                          <td className="py-3 px-3 text-slate-800 font-medium">{ev.details}</td>
                          <td className="py-3 px-3 text-slate-600">
                            {ev.reason ? (
                              <span className="font-medium text-rose-800 italic">
                                &ldquo;{ev.reason}&rdquo;
                              </span>
                            ) : (
                              '—'
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Officers & RBAC */}
      {activeTab === 'officers' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Role-Based Access Governance</h3>
              <p className="text-xs text-slate-500">
                Admins have full authority; Treasurers can record receipts and expenses; Viewers have read-only access.
              </p>
            </div>

            {canManageOfficers && (
              <button
                onClick={() => setIsAddOfficerModalOpen(true)}
                className="flex items-center space-x-1.5 bg-emerald-600 hover:bg-emerald-500 text-white px-3.5 py-2 rounded-lg text-xs font-semibold shadow transition cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add Officer</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {(currentOrgMemberships || []).map((officer) => (
              <div
                key={officer.id}
                className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-bold text-slate-900">{officer.userName}</h4>
                    <div className="text-xs text-slate-500 font-mono">{officer.userEmail}</div>
                  </div>

                  <span
                    className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                      officer.role === 'admin'
                        ? 'bg-purple-100 text-purple-800 border border-purple-200'
                        : officer.role === 'treasurer'
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {officer.role}
                  </span>
                </div>

                {canManageOfficers && (
                  <div className="flex items-center space-x-2 pt-2 border-t border-slate-100">
                    <label className="text-[10px] text-slate-500 font-medium">Role:</label>
                    <select
                      value={officer.role}
                      onChange={(e) => updateOfficerRole(officer.id, e.target.value as UserRole)}
                      className="text-[11px] px-2 py-0.5 border border-slate-200 rounded bg-slate-50 outline-none"
                    >
                      <option value="admin">Admin</option>
                      <option value="treasurer">Treasurer</option>
                      <option value="viewer">Viewer</option>
                    </select>
                  </div>
                )}

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                  <span>Joined: {formatDate(officer.addedAt)}</span>
                  <span className="font-semibold text-emerald-700 flex items-center space-x-1">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Authorized</span>
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Settings & Organization Profile */}
      {activeTab === 'settings' && (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-6 max-w-2xl">
          <div>
            <h3 className="font-bold text-slate-900 text-base">Organization Profile & Brand</h3>
            <p className="text-xs text-slate-500">
              Details configured here appear on all official statements, printable receipts, and financial schedules.
            </p>
          </div>

          {settingsSuccess && (
            <div className="bg-emerald-50 text-emerald-900 p-3 rounded-lg text-xs font-semibold border border-emerald-300">
              {settingsSuccess}
            </div>
          )}

          <form onSubmit={handleSaveSettings} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-slate-900 mb-1">
                Full Legal / Registered Organization Name *
              </label>
              <input
                type="text"
                required
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-900 mb-1">Organization Code / Prefix *</label>
                <input
                  type="text"
                  required
                  value={orgCode}
                  onChange={(e) => setOrgCode(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono uppercase focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-900 mb-1">Motto / Tagline</label>
                <input
                  type="text"
                  value={orgMotto}
                  onChange={(e) => setOrgMotto(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs italic focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-900 mb-1">Organization Classification</label>
              <select
                value={orgType}
                onChange={(e) => setOrgType(e.target.value as any)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white focus:ring-2 focus:ring-emerald-500 outline-none capitalize"
              >
                <option value="association">Socio-Cultural / Town Association</option>
                <option value="club">Social Club / Fraternity</option>
                <option value="alumni">Old Students / Alumni Association</option>
                <option value="church">Religious Group / Fellowship</option>
                <option value="community">Landlords / Community Association</option>
                <option value="cooperative">Cooperative / Thrift Society</option>
              </select>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg shadow transition cursor-pointer"
              >
                Save Organization Profile
              </button>
            </div>
          </form>

          {/* Cloud Database Purge Utility */}
          <div className="pt-6 border-t border-slate-200">
            <div className="flex items-center space-x-2">
              <span className="p-1.5 rounded-md bg-rose-100 text-rose-700">
                <Database className="w-4 h-4" />
              </span>
              <div>
                <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                  Purge Test & Demo Collections from Firestore
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Safely erase transactional test records (members, dues configs, payments, expenses) from cloud Firestore while preserving your organization structure, banking details, and authorized officer roles.
                </p>
              </div>
            </div>

            {/* Current counts pill summary */}
            <div className="mt-3 p-3 bg-slate-50 rounded-lg border border-slate-200 flex flex-wrap gap-3 items-center text-xs">
              <div className="flex items-center space-x-1.5">
                <span className="font-semibold text-slate-600">Active Records:</span>
              </div>
              <span className="px-2 py-0.5 bg-white border border-slate-200 rounded font-mono text-slate-800">
                {currentOrgMembers.length} Members
              </span>
              <span className="px-2 py-0.5 bg-white border border-slate-200 rounded font-mono text-slate-800">
                {currentOrgContributions.length} Dues & Levies
              </span>
              <span className="px-2 py-0.5 bg-white border border-slate-200 rounded font-mono text-slate-800">
                {currentOrgPayments.length} Payments & Receipts
              </span>
              <span className="px-2 py-0.5 bg-white border border-slate-200 rounded font-mono text-slate-800">
                {currentOrgExpenses.length} Expense Vouchers
              </span>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-3">
              <button
                type="button"
                id="open-purge-modal-btn"
                onClick={handleOpenPurgeModal}
                disabled={effectiveRole !== 'admin'}
                className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-lg text-xs font-bold transition shadow-xs cursor-pointer ${
                  effectiveRole === 'admin'
                    ? 'bg-rose-600 hover:bg-rose-700 text-white'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                }`}
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Purge Test / Demo Data...</span>
              </button>

              <button
                type="button"
                onClick={handleExportFullBackup}
                className="flex items-center space-x-1.5 px-3 py-2 border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-lg text-xs font-semibold transition cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Pre-Purge JSON Snapshot</span>
              </button>
            </div>
            {effectiveRole !== 'admin' && (
              <p className="text-[11px] text-amber-700 mt-1.5">
                * Only administrators with the "admin" role have permission to clear organization test data.
              </p>
            )}
          </div>

          {/* Clear App Cache */}
          <div className="pt-6 border-t border-slate-200">
            <h4 className="font-bold text-slate-900 text-xs uppercase text-slate-500 tracking-wider">
              Local Cache & Synchronization
            </h4>
            <p className="text-xs text-slate-500 mt-1">
              Clear local cached state to force a clean re-synchronization directly from the Firestore Cloud Database.
            </p>
            <button
              onClick={() => {
                if (window.confirm('Clear local cache and refresh data from the cloud?')) {
                  clearAllData();
                }
              }}
              className="mt-3 flex items-center space-x-1.5 px-3 py-2 border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-lg text-xs font-semibold transition cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Clear Local Cache</span>
            </button>
          </div>
        </div>
      )}

      {/* Purge Test Data Confirmation Modal */}
      {isPurgeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs">
          <div className="bg-white w-full max-w-lg rounded-xl shadow-2xl border border-rose-200 overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="bg-rose-700 text-white px-5 py-4 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-5 h-5 text-rose-200" />
                <span className="font-bold text-sm">Purge Test & Demo Collections</span>
              </div>
              <button
                onClick={() => {
                  if (!isPurging) setIsPurgeModalOpen(false);
                }}
                disabled={isPurging}
                className="text-rose-200 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-900 leading-relaxed">
                <p className="font-semibold text-rose-950 mb-1">
                  You are about to permanently clear operational collections for:
                </p>
                <p className="font-bold text-sm text-rose-900">
                  {currentOrg?.name} ({currentOrg?.code || 'ORG'})
                </p>
              </div>

              {/* What is deleted vs preserved breakdown */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 bg-red-50/70 border border-red-200 rounded-lg space-y-1.5">
                  <div className="font-bold text-rose-800 flex items-center space-x-1">
                    <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                    <span>Deleted from Cloud ({currentOrgMembers.length + currentOrgContributions.length + currentOrgPayments.length + currentOrgExpenses.length} records):</span>
                  </div>
                  <ul className="list-disc list-inside text-slate-700 space-y-0.5 text-[11px]">
                    <li>{currentOrgMembers.length} Registered Members</li>
                    <li>{currentOrgContributions.length} Dues & Levies</li>
                    <li>{currentOrgPayments.length} Payment Receipts</li>
                    <li>{currentOrgExpenses.length} Expense Vouchers</li>
                  </ul>
                </div>

                <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-lg space-y-1.5">
                  <div className="font-bold text-emerald-800 flex items-center space-x-1">
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Preserved Intact:</span>
                  </div>
                  <ul className="list-disc list-inside text-slate-700 space-y-0.5 text-[11px]">
                    <li>Organization Metadata</li>
                    <li>Bank & Custodian Setup</li>
                    <li>Officer Roles ({currentOrgMemberships.length})</li>
                    <li>Active User Accounts</li>
                  </ul>
                </div>
              </div>

              {/* Pre-purge safety recommendation */}
              <div className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
                <span className="text-slate-600">Want a safety copy before proceeding?</span>
                <button
                  type="button"
                  onClick={handleExportFullBackup}
                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-white rounded text-[11px] font-semibold transition flex items-center space-x-1"
                >
                  <Download className="w-3 h-3" />
                  <span>Download Backup</span>
                </button>
              </div>

              {/* Confirmation input challenge */}
              <div className="space-y-1.5 pt-1">
                <label className="block font-semibold text-slate-800">
                  Type <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-rose-700 font-bold">{currentOrg?.code || 'CLEAR'}</span> or <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-rose-700 font-bold">CLEAR</span> to confirm:
                </label>
                <input
                  type="text"
                  id="purge-confirmation-input"
                  value={purgeConfirmText}
                  onChange={(e) => setPurgeConfirmText(e.target.value)}
                  placeholder={`Type "${currentOrg?.code || 'CLEAR'}" to confirm`}
                  disabled={isPurging}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono uppercase focus:ring-2 focus:ring-rose-500 outline-none"
                />
              </div>

              {/* Feedback messages */}
              {purgeResult && (
                <div
                  className={`p-3 rounded-lg border flex items-center space-x-2 text-xs ${
                    purgeResult.success
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                      : 'bg-rose-50 border-rose-300 text-rose-900'
                  }`}
                >
                  {purgeResult.success ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  )}
                  <span>{purgeResult.message}</span>
                </div>
              )}

              <div className="pt-3 border-t border-slate-200 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsPurgeModalOpen(false)}
                  disabled={isPurging}
                  className="px-3.5 py-2 rounded-lg text-slate-600 hover:bg-slate-100 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  id="confirm-purge-execute-btn"
                  onClick={handleExecutePurge}
                  disabled={
                    isPurging ||
                    (purgeConfirmText.trim().toUpperCase() !== (currentOrg?.code || 'CLEAR').toUpperCase() &&
                      purgeConfirmText.trim().toUpperCase() !== 'CLEAR')
                  }
                  className={`px-4 py-2 rounded-lg font-bold shadow transition flex items-center space-x-1.5 ${
                    !isPurging &&
                    (purgeConfirmText.trim().toUpperCase() === (currentOrg?.code || 'CLEAR').toUpperCase() ||
                      purgeConfirmText.trim().toUpperCase() === 'CLEAR')
                      ? 'bg-rose-600 hover:bg-rose-700 text-white cursor-pointer'
                      : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  {isPurging ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Purging Cloud Records...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Permanently Clear Data</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Officer Modal */}
      {isAddOfficerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md rounded-xl shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="bg-slate-900 text-white px-5 py-3.5 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <KeyRound className="w-4 h-4 text-emerald-400" />
                <span className="font-bold text-sm">Add New Officer</span>
              </div>
              <button
                onClick={() => setIsAddOfficerModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveOfficer} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Officer Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Barr. Nnamdi Azikiwe"
                  value={officerName}
                  onChange={(e) => setOfficerName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Email Address *</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. nnamdi@association.org"
                  value={officerEmail}
                  onChange={(e) => setOfficerEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">System Role</label>
                  <select
                    value={officerRole}
                    onChange={(e) => setOfficerRole(e.target.value as UserRole)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white focus:ring-2 focus:ring-emerald-500 outline-none capitalize"
                  >
                    <option value="treasurer">Treasurer</option>
                    <option value="admin">Administrator</option>
                    <option value="viewer">Viewer (Auditor)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Executive Title</label>
                  <input
                    type="text"
                    placeholder="e.g. Financial Secretary"
                    value={officerTitle}
                    onChange={(e) => setOfficerTitle(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Phone Number</label>
                <input
                  type="tel"
                  placeholder="e.g. +234 803 123 4567"
                  value={officerPhone}
                  onChange={(e) => setOfficerPhone(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsAddOfficerModalOpen(false)}
                  className="px-3 py-2 rounded-lg text-slate-600 hover:bg-slate-100 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold shadow transition"
                >
                  Authorize Officer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
