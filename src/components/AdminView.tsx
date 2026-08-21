import React, { useState, useEffect } from 'react';
import { useDuesBook } from '../context/DuesBookContext';
import { Role, AuditEvent, Member } from '../types';
import { formatDateTime, formatDate } from '../utils/formatters';
import { auth } from '../lib/firebase';
import { updatePassword, sendPasswordResetEmail } from 'firebase/auth';
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
  AlertCircle,
  Loader2,
  Check,
  Image as ImageIcon,
  Upload,
  UserPlus,
  Mail,
  Phone,
  Sparkles,
  Shield,
  Eye,
  FileText,
  DollarSign,
  Key,
} from 'lucide-react';

const ROLE_DEFINITIONS: {
  role: Role;
  label: string;
  badgeColor: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  {
    role: 'admin',
    label: 'Administrator',
    badgeColor: 'bg-purple-100 text-purple-800 border-purple-200',
    description: 'Full organizational authority, logo/branding, role appointments, and security governance.',
    icon: ShieldCheck,
  },
  {
    role: 'treasurer',
    label: 'Treasurer',
    badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    description: 'Disbursements, bank accounts management, payment entries, and reversals.',
    icon: DollarSign,
  },
  {
    role: 'financial_sec',
    label: 'Financial Secretary',
    badgeColor: 'bg-blue-100 text-blue-800 border-blue-200',
    description: 'Dues schedule generation, levies, payments recording, and member statement accounts.',
    icon: FileText,
  },
  {
    role: 'auditor',
    label: 'Auditor',
    badgeColor: 'bg-amber-100 text-amber-800 border-amber-200',
    description: 'Read-only financial oversight, audit trail inspection, and ledger verification.',
    icon: Eye,
  },
  {
    role: 'secretary',
    label: 'General Secretary',
    badgeColor: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    description: 'Membership directory administration, reminders dispatch, and secretariat correspondence.',
    icon: Users,
  },
  {
    role: 'viewer',
    label: 'Viewer / Member',
    badgeColor: 'bg-slate-100 text-slate-700 border-slate-200',
    description: 'Read-only access to organizational dashboard, schedules, and public accounts.',
    icon: Shield,
  },
];

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
    elevateMemberToOfficer,
    updateOfficerRole,
    removeOfficer,
    updateOrganization,
    updateOrgBranding,
    deleteOrganization,
    clearAllData,
    purgeOrganizationData,
    currentUser,
    firebaseUser,
  } = useDuesBook();

  const [activeTab, setActiveTab] = useState<'audit' | 'officers' | 'settings'>('audit');
  const [searchAudit, setSearchAudit] = useState('');
  const [filterAction, setFilterAction] = useState<string>('all');

  // Add Officer Modal State
  const [isAddOfficerModalOpen, setIsAddOfficerModalOpen] = useState(false);
  const [officerName, setOfficerName] = useState('');
  const [officerEmail, setOfficerEmail] = useState('');
  const [officerRole, setOfficerRole] = useState<Role>('treasurer');
  const [officerPhone, setOfficerPhone] = useState('');
  const [officerTitle, setOfficerTitle] = useState('');

  // Elevate Member to Officer State
  const [isElevateModalOpen, setIsElevateModalOpen] = useState(false);
  const [selectedMemberId, setSelectedMemberId] = useState<string>('');
  const [elevateRole, setElevateRole] = useState<Role>('treasurer');
  const [customElevateEmail, setCustomElevateEmail] = useState<string>('');
  const [memberSearchQuery, setMemberSearchQuery] = useState<string>('');
  const [elevateMessage, setElevateMessage] = useState<{ success: boolean; text: string } | null>(null);

  // Org Settings State
  const [orgName, setOrgName] = useState(currentOrg?.name || '');
  const [orgMotto, setOrgMotto] = useState(currentOrg?.motto || currentOrg?.branding?.motto || '');
  const [orgCode, setOrgCode] = useState(currentOrg?.code || '');
  const [orgType, setOrgType] = useState(currentOrg?.type || 'association');
  const [orgLogoUrl, setOrgLogoUrl] = useState(currentOrg?.branding?.logoUrl || '');
  const [orgAddress, setOrgAddress] = useState(currentOrg?.branding?.contactAddress || '');
  const [orgPhone, setOrgPhone] = useState(currentOrg?.branding?.contactPhone || '');
  const [orgEmail, setOrgEmail] = useState(currentOrg?.branding?.contactEmail || '');
  const [orgWebsite, setOrgWebsite] = useState(currentOrg?.branding?.website || '');
  const [signatoryName, setSignatoryName] = useState(currentOrg?.branding?.signatoryName || '');
  const [signatoryTitle, setSignatoryTitle] = useState(currentOrg?.branding?.signatoryTitle || '');
  const [showLogoNavbar, setShowLogoNavbar] = useState(currentOrg?.branding?.showLogoOnNavbar ?? true);
  const [settingsSuccess, setSettingsSuccess] = useState('');

  // Password Management State
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordFeedback, setPasswordFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Purge Data State
  const [isPurgeModalOpen, setIsPurgeModalOpen] = useState(false);
  const [purgeConfirmText, setPurgeConfirmText] = useState('');
  const [isPurging, setIsPurging] = useState(false);
  const [purgeResult, setPurgeResult] = useState<{ success?: boolean; message?: string } | null>(null);

  // Delete Org State
  const [isDeleteOrgModalOpen, setIsDeleteOrgModalOpen] = useState(false);
  const [deleteOrgConfirmText, setDeleteOrgConfirmText] = useState('');
  const [isDeletingOrg, setIsDeletingOrg] = useState(false);
  const [deleteOrgResult, setDeleteOrgResult] = useState<{ success?: boolean; message?: string } | null>(null);

  // Sync internal state when currentOrg changes
  useEffect(() => {
    if (currentOrg) {
      setOrgName(currentOrg.name || '');
      setOrgMotto(currentOrg.motto || currentOrg.branding?.motto || '');
      setOrgCode(currentOrg.code || '');
      setOrgType(currentOrg.type || 'association');
      setOrgLogoUrl(currentOrg.branding?.logoUrl || '');
      setOrgAddress(currentOrg.branding?.contactAddress || '');
      setOrgPhone(currentOrg.branding?.contactPhone || '');
      setOrgEmail(currentOrg.branding?.contactEmail || '');
      setOrgWebsite(currentOrg.branding?.website || '');
      setSignatoryName(currentOrg.branding?.signatoryName || '');
      setSignatoryTitle(currentOrg.branding?.signatoryTitle || '');
      setShowLogoNavbar(currentOrg.branding?.showLogoOnNavbar ?? true);
    }
  }, [currentOrg]);

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

  const handleExecuteElevateMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMemberId) return;

    const res = elevateMemberToOfficer(selectedMemberId, elevateRole, customElevateEmail);
    if (res.success) {
      setElevateMessage({ success: true, text: res.message });
      setTimeout(() => {
        setIsElevateModalOpen(false);
        setSelectedMemberId('');
        setCustomElevateEmail('');
        setElevateMessage(null);
      }, 1800);
    } else {
      setElevateMessage({ success: false, text: res.message });
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert('Logo image is too large. Please select an image under 2MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        setOrgLogoUrl(result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManageOfficers) return;

    // 1. Update Core Org Properties
    updateOrganization(currentOrgId, {
      name: orgName.trim(),
      motto: orgMotto.trim(),
      code: orgCode.trim().toUpperCase(),
      type: orgType as any,
    });

    // 2. Update Org Branding & Secretariat info
    updateOrgBranding({
      logoUrl: orgLogoUrl.trim(),
      motto: orgMotto.trim(),
      contactAddress: orgAddress.trim(),
      contactPhone: orgPhone.trim(),
      contactEmail: orgEmail.trim(),
      website: orgWebsite.trim(),
      signatoryName: signatoryName.trim(),
      signatoryTitle: signatoryTitle.trim(),
      showLogoOnNavbar: showLogoNavbar,
    });

    setSettingsSuccess('Organization profile, motto, and branding updated successfully.');
    setTimeout(() => setSettingsSuccess(''), 4000);
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordFeedback(null);

    if (newPassword.length < 6) {
      setPasswordFeedback({ type: 'error', text: 'Password must be at least 6 characters long.' });
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordFeedback({ type: 'error', text: 'Passwords do not match.' });
      return;
    }

    setIsChangingPassword(true);

    try {
      if (auth.currentUser) {
        await updatePassword(auth.currentUser, newPassword);
        setPasswordFeedback({ type: 'success', text: 'Password updated successfully!' });
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setPasswordFeedback({
          type: 'error',
          text: 'No active Firebase authentication session found. Please sign in via the login screen.',
        });
      }
    } catch (err: any) {
      if (err?.code === 'auth/requires-recent-login') {
        setPasswordFeedback({
          type: 'error',
          text: 'This operation is sensitive and requires recent authentication. Please sign out and sign in again before changing password.',
        });
      } else {
        setPasswordFeedback({
          type: 'error',
          text: err?.message || 'Failed to update password.',
        });
      }
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleSendResetEmail = async () => {
    setPasswordFeedback(null);
    const targetEmail = auth.currentUser?.email || currentUser?.email;
    if (!targetEmail) {
      setPasswordFeedback({ type: 'error', text: 'No user email address found on file.' });
      return;
    }

    setIsChangingPassword(true);
    try {
      await sendPasswordResetEmail(auth, targetEmail);
      setPasswordFeedback({
        type: 'success',
        text: `Password reset instructions have been sent to ${targetEmail}. Please check your inbox.`,
      });
    } catch (err: any) {
      setPasswordFeedback({
        type: 'error',
        text: err?.message || 'Failed to send password reset email.',
      });
    } finally {
      setIsChangingPassword(false);
    }
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

  const handleOpenDeleteOrgModal = () => {
    setDeleteOrgConfirmText('');
    setDeleteOrgResult(null);
    setIsDeleteOrgModalOpen(true);
  };

  const handleExecuteDeleteOrg = async () => {
    const expectedConfirm = currentOrg?.name || currentOrg?.code || 'DELETE';
    if (
      deleteOrgConfirmText.trim().toLowerCase() !== expectedConfirm.toLowerCase() &&
      deleteOrgConfirmText.trim().toUpperCase() !== (currentOrg?.code || '').toUpperCase() &&
      deleteOrgConfirmText.trim().toUpperCase() !== 'DELETE'
    ) {
      return;
    }

    setIsDeletingOrg(true);
    setDeleteOrgResult(null);

    const res = await deleteOrganization(currentOrgId);
    setIsDeletingOrg(false);

    if (res.success) {
      setDeleteOrgResult({
        success: true,
        message: res.message,
      });
      setTimeout(() => {
        setIsDeleteOrgModalOpen(false);
      }, 2000);
    } else {
      setDeleteOrgResult({
        success: false,
        message: res.message,
      });
    }
  };

  const selectedMember = currentOrgMembers.find((m) => m.id === selectedMemberId);

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
          className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center space-x-1.5 whitespace-nowrap ${
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
          className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center space-x-1.5 whitespace-nowrap ${
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
          className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center space-x-1.5 whitespace-nowrap ${
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
                <option value="ORGANIZATION_UPDATED">Organization Updated</option>
                <option value="ORGANIZATION_DELETED">Organization Deleted</option>
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
                      const isRev = ev.action === 'PAYMENT_REVERSED' || ev.action === 'ORGANIZATION_DELETED';
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
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Role-Based Access Governance</h3>
              <p className="text-xs text-slate-500">
                Grant elevated officer privileges, appoint members as administrators, treasurers, or financial secretaries.
              </p>
            </div>

            {canManageOfficers && (
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setIsElevateModalOpen(true)}
                  className="flex items-center space-x-1.5 bg-purple-600 hover:bg-purple-500 text-white px-3.5 py-2 rounded-lg text-xs font-semibold shadow transition cursor-pointer"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Elevate Member to Officer</span>
                </button>

                <button
                  onClick={() => setIsAddOfficerModalOpen(true)}
                  className="flex items-center space-x-1.5 bg-emerald-600 hover:bg-emerald-500 text-white px-3.5 py-2 rounded-lg text-xs font-semibold shadow transition cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Invite New Officer</span>
                </button>
              </div>
            )}
          </div>

          {/* Role Types Legend */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {ROLE_DEFINITIONS.map((rDef) => {
              const Icon = rDef.icon;
              return (
                <div
                  key={rDef.role}
                  className="p-3 bg-white rounded-lg border border-slate-200 text-xs space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className={`px-2 py-0.5 rounded font-bold uppercase text-[10px] border ${rDef.badgeColor}`}>
                      {rDef.label}
                    </span>
                    <Icon className="w-3.5 h-3.5 text-slate-400" />
                  </div>
                  <p className="text-slate-500 text-[11px] leading-relaxed pt-1">
                    {rDef.description}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Officers List */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {(currentOrgMemberships || []).map((officer) => {
              const rDef = ROLE_DEFINITIONS.find((r) => r.role === officer.role) || ROLE_DEFINITIONS[0];
              const isCurrentUser = officer.userEmail.toLowerCase() === (currentUser?.email || '').toLowerCase();

              return (
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
                      className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${rDef.badgeColor}`}
                    >
                      {rDef.label}
                    </span>
                  </div>

                  {canManageOfficers && (
                    <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                      <div className="flex items-center space-x-2">
                        <label className="text-[10px] text-slate-500 font-medium">Role:</label>
                        <select
                          value={officer.role}
                          onChange={(e) => updateOfficerRole(officer.id, e.target.value as Role)}
                          className="text-[11px] px-2 py-1 border border-slate-200 rounded bg-slate-50 outline-none font-medium"
                        >
                          <option value="admin">Administrator</option>
                          <option value="treasurer">Treasurer</option>
                          <option value="financial_sec">Financial Secretary</option>
                          <option value="auditor">Auditor</option>
                          <option value="secretary">General Secretary</option>
                          <option value="viewer">Viewer (Member)</option>
                        </select>
                      </div>

                      {!isCurrentUser && currentOrgMemberships.length > 1 && (
                        <button
                          onClick={() => {
                            if (window.confirm(`Revoke officer access for ${officer.userName}?`)) {
                              removeOfficer(officer.id);
                            }
                          }}
                          className="text-rose-600 hover:text-rose-800 text-[11px] font-medium p-1 hover:bg-rose-50 rounded"
                          title="Revoke officer privileges"
                        >
                          Revoke
                        </button>
                      )}
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
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 3: Settings & Organization Profile */}
      {activeTab === 'settings' && (
        <div className="space-y-6 max-w-3xl">
          {/* Main Organization Profile Form */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-6">
            <div>
              <h3 className="font-bold text-slate-900 text-base flex items-center space-x-2">
                <Building className="w-5 h-5 text-emerald-700" />
                <span>Organization Profile, Motto & Branding</span>
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Customize your organization&apos;s identity, emblem logo, motto, classification, and official letterhead credentials.
              </p>
            </div>

            {settingsSuccess && (
              <div className="bg-emerald-50 text-emerald-900 p-3 rounded-lg text-xs font-semibold border border-emerald-300 flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{settingsSuccess}</span>
              </div>
            )}

            <form onSubmit={handleSaveSettings} className="space-y-5 text-xs">
              {/* Organization Logo & Emblem Section */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <label className="block font-bold text-slate-900">
                  Organization Logo / Emblem
                </label>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  {/* Logo Preview Avatar */}
                  <div className="w-20 h-20 rounded-2xl bg-white border-2 border-slate-300 flex items-center justify-center overflow-hidden shadow-xs shrink-0">
                    {orgLogoUrl ? (
                      <img
                        src={orgLogoUrl}
                        alt="Organization Logo"
                        className="w-full h-full object-contain"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="text-center p-2 text-slate-400">
                        <ImageIcon className="w-6 h-6 mx-auto mb-1 text-slate-300" />
                        <span className="text-[9px] font-semibold">No Logo</span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2 flex-1 w-full">
                    <div className="flex flex-wrap items-center gap-2">
                      <label className="px-3 py-1.5 bg-white border border-slate-300 rounded-lg font-semibold text-slate-700 hover:bg-slate-100 transition cursor-pointer flex items-center space-x-1.5 shadow-xs">
                        <Upload className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Upload Logo File</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleLogoUpload}
                          className="hidden"
                        />
                      </label>

                      {orgLogoUrl && (
                        <button
                          type="button"
                          onClick={() => setOrgLogoUrl('')}
                          className="px-2.5 py-1.5 bg-rose-50 text-rose-700 border border-rose-200 rounded-lg font-semibold hover:bg-rose-100 transition cursor-pointer"
                        >
                          Remove Logo
                        </button>
                      )}
                    </div>

                    <div className="flex items-center space-x-2">
                      <input
                        type="url"
                        placeholder="Or enter public Logo Image URL (e.g. https://...)"
                        value={orgLogoUrl}
                        onChange={(e) => setOrgLogoUrl(e.target.value)}
                        className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>

                    <label className="flex items-center space-x-2 text-[11px] text-slate-600 pt-1 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={showLogoNavbar}
                        onChange={(e) => setShowLogoNavbar(e.target.checked)}
                        className="rounded text-emerald-600 focus:ring-emerald-500 w-3.5 h-3.5"
                      />
                      <span>Display emblem logo in the top Navigation bar & Official Receipts</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Organization Core Identity */}
              <div>
                <label className="block font-bold text-slate-900 mb-1">
                  Full Legal / Registered Organization Name *
                </label>
                <input
                  type="text"
                  required
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  placeholder="e.g. Ndi Igbo Progressive Union"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 outline-none font-medium"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-900 mb-1">
                    Organization Code / Prefix *
                  </label>
                  <input
                    type="text"
                    required
                    value={orgCode}
                    onChange={(e) => setOrgCode(e.target.value)}
                    placeholder="e.g. NIPU"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono uppercase focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-900 mb-1">
                    Official Motto / Tagline
                  </label>
                  <input
                    type="text"
                    value={orgMotto}
                    onChange={(e) => setOrgMotto(e.target.value)}
                    placeholder="e.g. Unity, Progress & Integrity"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs italic focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-900 mb-1">
                  Organization Classification
                </label>
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

              {/* Secretariat & Letterhead Contacts */}
              <div className="pt-3 border-t border-slate-200 space-y-3">
                <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider text-slate-700">
                  Official Secretariat & Statement Letterhead
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-medium text-slate-700 mb-1">Secretariat Physical Address</label>
                    <input
                      type="text"
                      placeholder="e.g. 12 Union Way, Victoria Island, Lagos"
                      value={orgAddress}
                      onChange={(e) => setOrgAddress(e.target.value)}
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block font-medium text-slate-700 mb-1">Official Inquiries Phone</label>
                    <input
                      type="text"
                      placeholder="e.g. +234 803 000 0000"
                      value={orgPhone}
                      onChange={(e) => setOrgPhone(e.target.value)}
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block font-medium text-slate-700 mb-1">Official Email Address</label>
                    <input
                      type="email"
                      placeholder="e.g. secretariat@union.org"
                      value={orgEmail}
                      onChange={(e) => setOrgEmail(e.target.value)}
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block font-medium text-slate-700 mb-1">Official Website / Portal</label>
                    <input
                      type="text"
                      placeholder="e.g. https://www.union.org"
                      value={orgWebsite}
                      onChange={(e) => setOrgWebsite(e.target.value)}
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div>
                    <label className="block font-medium text-slate-700 mb-1">Authorized Signatory Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Chief Dr. Emeka Okonkwo"
                      value={signatoryName}
                      onChange={(e) => setSignatoryName(e.target.value)}
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block font-medium text-slate-700 mb-1">Signatory Executive Title</label>
                    <input
                      type="text"
                      placeholder="e.g. National Financial Secretary"
                      value={signatoryTitle}
                      onChange={(e) => setSignatoryTitle(e.target.value)}
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-3 flex justify-end">
                <button
                  type="submit"
                  disabled={!canManageOfficers}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg shadow transition cursor-pointer flex items-center space-x-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Save Organization Profile & Branding</span>
                </button>
              </div>
            </form>
          </div>

          {/* Account Security & Password Management */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center space-x-2">
              <span className="p-1.5 rounded-md bg-slate-100 text-slate-700">
                <Key className="w-4 h-4" />
              </span>
              <div>
                <h4 className="font-bold text-slate-900 text-sm">Account Security & Password</h4>
                <p className="text-xs text-slate-500">
                  Update login password or send secure reset instructions to {firebaseUser?.email || currentUser?.email || 'your account'}.
                </p>
              </div>
            </div>

            {passwordFeedback && (
              <div
                className={`p-3 rounded-lg border text-xs flex items-center space-x-2 ${
                  passwordFeedback.type === 'success'
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                    : 'bg-rose-50 border-rose-300 text-rose-900'
                }`}
              >
                {passwordFeedback.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                )}
                <span>{passwordFeedback.text}</span>
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-3 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">New Password</label>
                  <input
                    type="password"
                    placeholder="Minimum 6 characters"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">Confirm New Password</label>
                  <input
                    type="password"
                    placeholder="Re-type new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleSendResetEmail}
                  disabled={isChangingPassword}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium text-xs transition cursor-pointer flex items-center space-x-1"
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>Send Password Reset Email</span>
                </button>

                <button
                  type="submit"
                  disabled={isChangingPassword || !newPassword}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-lg text-xs shadow transition cursor-pointer flex items-center space-x-1.5"
                >
                  {isChangingPassword ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Updating...</span>
                    </>
                  ) : (
                    <>
                      <Lock className="w-3.5 h-3.5" />
                      <span>Update Password</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Danger Zone: Purge Test Data & Delete Organization */}
          <div className="bg-white p-6 rounded-xl border border-rose-200 shadow-xs space-y-6">
            <div>
              <h3 className="font-bold text-rose-900 text-base flex items-center space-x-2">
                <AlertTriangle className="w-5 h-5 text-rose-600" />
                <span>Governance & Organization Danger Zone</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Irreversible actions for database cleansing and organization lifecycle management.
              </p>
            </div>

            {/* Cloud Database Purge Utility */}
            <div className="p-4 bg-rose-50/50 rounded-xl border border-rose-200 space-y-3">
              <div className="flex items-center space-x-2">
                <span className="p-1.5 rounded-md bg-rose-100 text-rose-700">
                  <Database className="w-4 h-4" />
                </span>
                <div>
                  <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                    Purge Operational Test & Demo Collections
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Safely erase transactional test records (members, dues configs, payments, expenses) from cloud Firestore while preserving your organization profile and authorized officer roles.
                  </p>
                </div>
              </div>

              {/* Current counts pill summary */}
              <div className="p-2.5 bg-white rounded-lg border border-rose-100 flex flex-wrap gap-2 items-center text-xs">
                <span className="font-semibold text-slate-600 text-[11px]">Records to be cleared:</span>
                <span className="px-2 py-0.5 bg-slate-50 border border-slate-200 rounded font-mono text-slate-800 text-[11px]">
                  {currentOrgMembers.length} Members
                </span>
                <span className="px-2 py-0.5 bg-slate-50 border border-slate-200 rounded font-mono text-slate-800 text-[11px]">
                  {currentOrgContributions.length} Dues
                </span>
                <span className="px-2 py-0.5 bg-slate-50 border border-slate-200 rounded font-mono text-slate-800 text-[11px]">
                  {currentOrgPayments.length} Payments
                </span>
                <span className="px-2 py-0.5 bg-slate-50 border border-slate-200 rounded font-mono text-slate-800 text-[11px]">
                  {currentOrgExpenses.length} Expenses
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-1">
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
                  <span>Purge Operational Test Data...</span>
                </button>
              </div>
            </div>

            {/* Delete Entire Organization */}
            <div className="p-4 bg-red-100/50 rounded-xl border border-red-300 space-y-3">
              <div className="flex items-center space-x-2">
                <span className="p-1.5 rounded-md bg-red-200 text-red-800">
                  <Building className="w-4 h-4" />
                </span>
                <div>
                  <h4 className="font-bold text-red-950 text-xs uppercase tracking-wider">
                    Permanently Delete Organization
                  </h4>
                  <p className="text-xs text-red-800 mt-0.5">
                    Completely remove <strong>{currentOrg?.name}</strong>, all its rosters, financial ledgers, and officer associations from the system.
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="text-[11px] text-red-700 italic">
                  * Requires administrator confirmation challenge.
                </span>

                <button
                  type="button"
                  onClick={handleOpenDeleteOrgModal}
                  disabled={effectiveRole !== 'admin'}
                  className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-lg text-xs font-bold transition shadow-xs cursor-pointer ${
                    effectiveRole === 'admin'
                      ? 'bg-red-700 hover:bg-red-800 text-white'
                      : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Organization...</span>
                </button>
              </div>
            </div>

            {/* Local Cache Reset */}
            <div className="pt-2 flex items-center justify-between text-xs text-slate-500">
              <span>Need to force fresh sync from Firestore?</span>
              <button
                onClick={() => {
                  if (window.confirm('Clear local cache and refresh data from the cloud?')) {
                    clearAllData();
                  }
                }}
                className="flex items-center space-x-1 px-3 py-1.5 border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-lg text-xs font-semibold transition cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Clear Local Cache</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Elevate Member to Officer Modal */}
      {isElevateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white w-full max-w-lg rounded-xl shadow-2xl border border-purple-200 overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="bg-purple-900 text-white px-5 py-4 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-5 h-5 text-purple-300" />
                <span className="font-bold text-sm">Elevate Existing Member to Officer</span>
              </div>
              <button
                onClick={() => setIsElevateModalOpen(false)}
                className="text-purple-300 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleExecuteElevateMember} className="p-5 space-y-4 text-xs">
              <p className="text-slate-600">
                Select any registered member in <strong>{currentOrg?.name}</strong> to appoint them to an executive governance role.
              </p>

              {/* Search and Select Member */}
              <div className="space-y-1.5">
                <label className="block font-bold text-slate-800">1. Select Member from Directory *</label>
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search by member name or number..."
                    value={memberSearchQuery}
                    onChange={(e) => setMemberSearchQuery(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 border border-slate-300 rounded-lg text-xs outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div className="max-h-40 overflow-y-auto border border-slate-200 rounded-lg divide-y divide-slate-100 mt-1">
                  {currentOrgMembers
                    .filter((m) => !m.isArchived)
                    .filter(
                      (m) =>
                        m.fullName.toLowerCase().includes(memberSearchQuery.toLowerCase()) ||
                        m.memberNumber.toLowerCase().includes(memberSearchQuery.toLowerCase())
                    )
                    .map((m) => {
                      const isSelected = selectedMemberId === m.id;
                      return (
                        <div
                          key={m.id}
                          onClick={() => {
                            setSelectedMemberId(m.id);
                            if (m.email) setCustomElevateEmail(m.email);
                          }}
                          className={`p-2.5 flex items-center justify-between cursor-pointer transition ${
                            isSelected
                              ? 'bg-purple-50 text-purple-900 font-semibold'
                              : 'hover:bg-slate-50 text-slate-700'
                          }`}
                        >
                          <div>
                            <div className="font-semibold text-slate-900">{m.fullName}</div>
                            <div className="text-[10px] text-slate-400 font-mono">
                              {m.memberNumber} • {m.category} {m.email && `• ${m.email}`}
                            </div>
                          </div>
                          {isSelected && <Check className="w-4 h-4 text-purple-600" />}
                        </div>
                      );
                    })}
                </div>
              </div>

              {/* Login Email Address */}
              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  2. Login Email Address *
                </label>
                <input
                  type="email"
                  required
                  placeholder="Officer's login email (e.g. member@org.org)"
                  value={customElevateEmail}
                  onChange={(e) => setCustomElevateEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs outline-none focus:ring-2 focus:ring-purple-500"
                />
                <span className="text-[10px] text-slate-500">
                  This email is used to authenticate and grant officer permissions.
                </span>
              </div>

              {/* Target Role */}
              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  3. Executive Role & Category *
                </label>
                <select
                  value={elevateRole}
                  onChange={(e) => setElevateRole(e.target.value as Role)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white outline-none focus:ring-2 focus:ring-purple-500 font-medium"
                >
                  <option value="admin">Administrator (Full Access)</option>
                  <option value="treasurer">Treasurer (Disbursements & Banking)</option>
                  <option value="financial_sec">Financial Secretary (Dues & Receipts)</option>
                  <option value="auditor">Auditor (Inspection & Ledgers)</option>
                  <option value="secretary">General Secretary (Roster & Communications)</option>
                  <option value="viewer">Viewer (Read-Only)</option>
                </select>
              </div>

              {elevateMessage && (
                <div
                  className={`p-3 rounded-lg border text-xs flex items-center space-x-2 ${
                    elevateMessage.success
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                      : 'bg-rose-50 border-rose-300 text-rose-900'
                  }`}
                >
                  {elevateMessage.success ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  )}
                  <span>{elevateMessage.text}</span>
                </div>
              )}

              <div className="pt-3 border-t border-slate-200 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsElevateModalOpen(false)}
                  className="px-3 py-2 rounded-lg text-slate-600 hover:bg-slate-100 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!selectedMemberId || !customElevateEmail.trim()}
                  className={`px-4 py-2 rounded-lg font-bold shadow transition flex items-center space-x-1.5 ${
                    selectedMemberId && customElevateEmail.trim()
                      ? 'bg-purple-600 hover:bg-purple-700 text-white cursor-pointer'
                      : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Appoint Officer</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add New Officer Modal */}
      {isAddOfficerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md rounded-xl shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="bg-slate-900 text-white px-5 py-3.5 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <KeyRound className="w-4 h-4 text-emerald-400" />
                <span className="font-bold text-sm">Add New Officer / Admin</span>
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
                <label className="block font-semibold text-slate-700 mb-1">Officer Full Name *</label>
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
                <label className="block font-semibold text-slate-700 mb-1">Login Email Address *</label>
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
                  <label className="block font-semibold text-slate-700 mb-1">System Role Category</label>
                  <select
                    value={officerRole}
                    onChange={(e) => setOfficerRole(e.target.value as Role)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white focus:ring-2 focus:ring-emerald-500 outline-none font-medium"
                  >
                    <option value="admin">Administrator</option>
                    <option value="treasurer">Treasurer</option>
                    <option value="financial_sec">Financial Secretary</option>
                    <option value="auditor">Auditor</option>
                    <option value="secretary">General Secretary</option>
                    <option value="viewer">Viewer (Member)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Executive Title</label>
                  <input
                    type="text"
                    placeholder="e.g. Vice President"
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

              {/* Breakdown */}
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
                    <li>Organization Profile & Logo</li>
                    <li>Bank & Custodian Setup</li>
                    <li>Officer Roles ({currentOrgMemberships.length})</li>
                    <li>Active User Accounts</li>
                  </ul>
                </div>
              </div>

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

      {/* Delete Entire Organization Confirmation Modal */}
      {isDeleteOrgModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
          <div className="bg-white w-full max-w-lg rounded-xl shadow-2xl border border-red-400 overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="bg-red-800 text-white px-5 py-4 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-5 h-5 text-red-300" />
                <span className="font-bold text-sm">Delete Organization Completely</span>
              </div>
              <button
                onClick={() => {
                  if (!isDeletingOrg) setIsDeleteOrgModalOpen(false);
                }}
                disabled={isDeletingOrg}
                className="text-red-300 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-900 leading-relaxed">
                <p className="font-bold text-red-950 mb-1">
                  WARNING: This action is permanent and completely irreversible!
                </p>
                <p className="text-red-900">
                  Deleting <strong>{currentOrg?.name}</strong> will destroy the entire organization, all member rosters, dues obligations, payments, bank records, and audit events.
                </p>
              </div>

              <div className="space-y-1.5 pt-1">
                <label className="block font-semibold text-slate-800">
                  Type <span className="font-bold text-red-700 bg-red-50 px-1.5 py-0.5 rounded">{currentOrg?.name}</span> or <span className="font-bold text-red-700 bg-red-50 px-1.5 py-0.5 rounded">{currentOrg?.code || 'DELETE'}</span> to confirm:
                </label>
                <input
                  type="text"
                  value={deleteOrgConfirmText}
                  onChange={(e) => setDeleteOrgConfirmText(e.target.value)}
                  placeholder={`Type "${currentOrg?.name}" to confirm`}
                  disabled={isDeletingOrg}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-red-500 outline-none"
                />
              </div>

              {deleteOrgResult && (
                <div
                  className={`p-3 rounded-lg border flex items-center space-x-2 text-xs ${
                    deleteOrgResult.success
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                      : 'bg-rose-50 border-rose-300 text-rose-900'
                  }`}
                >
                  {deleteOrgResult.success ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  )}
                  <span>{deleteOrgResult.message}</span>
                </div>
              )}

              <div className="pt-3 border-t border-slate-200 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsDeleteOrgModalOpen(false)}
                  disabled={isDeletingOrg}
                  className="px-3.5 py-2 rounded-lg text-slate-600 hover:bg-slate-100 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleExecuteDeleteOrg}
                  disabled={
                    isDeletingOrg ||
                    (deleteOrgConfirmText.trim().toLowerCase() !== (currentOrg?.name || '').toLowerCase() &&
                      deleteOrgConfirmText.trim().toUpperCase() !== (currentOrg?.code || '').toUpperCase() &&
                      deleteOrgConfirmText.trim().toUpperCase() !== 'DELETE')
                  }
                  className={`px-4 py-2 rounded-lg font-bold shadow transition flex items-center space-x-1.5 ${
                    !isDeletingOrg &&
                    (deleteOrgConfirmText.trim().toLowerCase() === (currentOrg?.name || '').toLowerCase() ||
                      deleteOrgConfirmText.trim().toUpperCase() === (currentOrg?.code || '').toUpperCase() ||
                      deleteOrgConfirmText.trim().toUpperCase() === 'DELETE')
                      ? 'bg-red-700 hover:bg-red-800 text-white cursor-pointer'
                      : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  {isDeletingOrg ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Deleting Organization...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Permanently Delete Organization</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
