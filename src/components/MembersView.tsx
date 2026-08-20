import React, { useState } from 'react';
import { useDuesBook } from '../context/DuesBookContext';
import { Member, Payment } from '../types';
import { formatNaira, formatDate } from '../utils/formatters';
import { calcOutstanding } from '../utils/financial';
import { MemberStatementModal } from './MemberStatementModal';
import {
  Users,
  Search,
  UserPlus,
  Filter,
  Receipt,
  FileText,
  CreditCard,
  Trash2,
  RotateCcw,
  Edit2,
  X,
  CheckCircle2,
  AlertCircle,
  Shield,
  Info,
} from 'lucide-react';

interface MembersViewProps {
  onOpenRecordPayment: (memberId?: string) => void;
  onViewReceipt: (payment: Payment) => void;
}

export const MembersView: React.FC<MembersViewProps> = ({
  onOpenRecordPayment,
  onViewReceipt,
}) => {
  const {
    currentOrg,
    currentOrgMembers,
    currentOrgContributions,
    addMember,
    updateMember,
    safeDeleteMember,
    restoreMember,
    canMutate,
  } = useDuesBook();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all_active' | 'archived' | 'all' | 'good' | 'owing'>('all_active');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [selectedStatementMember, setSelectedStatementMember] = useState<Member | null>(null);

  // Add Member Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [fullName, setFullName] = useState('');
  const [memberNumber, setMemberNumber] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [category, setCategory] = useState<Member['category']>('regular');
  const [notes, setNotes] = useState('');
  const [formError, setFormError] = useState('');

  // Edit Member Modal State
  const [editingMember, setEditingMember] = useState<Member | null>(null);

  // Safe delete alert state
  const [deleteNotice, setDeleteNotice] = useState<string | null>(null);

  // Active compulsory dues for current org
  const activeCompulsoryDues = currentOrgContributions.filter(
    (c) => c.status === 'active' && c.type !== 'donation'
  );
  const totalAssignedDues = activeCompulsoryDues.reduce((sum, c) => sum + (c.amount || 0), 0);

  // Status counts
  const activeMembersCount = currentOrgMembers.filter((m) => m.status === 'active').length;
  const archivedMembersCount = currentOrgMembers.filter((m) => m.status === 'archived').length;
  const goodStandingCount = currentOrgMembers.filter(
    (m) => m.status === 'active' && m.expectedBalance <= m.paidBalance
  ).length;
  const owingArrearsCount = currentOrgMembers.filter(
    (m) => m.status === 'active' && m.expectedBalance > m.paidBalance
  ).length;

  // Filter members with real-time text input and status toggle
  const filteredMembers = currentOrgMembers.filter((m) => {
    // Real-time Text search (name, ID number, phone, email, category)
    const q = searchQuery.trim().toLowerCase();
    if (q) {
      const matchesSearch =
        m.fullName.toLowerCase().includes(q) ||
        m.memberNumber.toLowerCase().includes(q) ||
        (m.phone && m.phone.toLowerCase().includes(q)) ||
        (m.email && m.email.toLowerCase().includes(q)) ||
        (m.category && m.category.toLowerCase().includes(q)) ||
        (m.notes && m.notes.toLowerCase().includes(q));

      if (!matchesSearch) return false;
    }

    // Category filter
    if (categoryFilter !== 'all' && m.category !== categoryFilter) {
      return false;
    }

    // Status filter dropdown & tabs
    const arrears = calcOutstanding(m.expectedBalance, m.paidBalance);
    if (statusFilter === 'archived') return m.status === 'archived';
    if (statusFilter === 'all') return true; // all active & archived
    if (statusFilter === 'all_active') return m.status === 'active';
    if (statusFilter === 'good') return m.status === 'active' && arrears === 0;
    if (statusFilter === 'owing') return m.status === 'active' && arrears > 0;

    return true;
  });

  const handleOpenAddModal = () => {
    // Suggest next member number
    const code = currentOrg?.code || 'MEM';
    const nextSeq = String(currentOrgMembers.length + 1).padStart(3, '0');
    setMemberNumber(`${code}-${nextSeq}`);
    setFullName('');
    setPhone('');
    setEmail('');
    setCategory('regular');
    setNotes('');
    setFormError('');
    setIsAddModalOpen(true);
  };

  const handleSaveAddMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      setFormError('Member full name is required.');
      return;
    }
    if (!memberNumber.trim()) {
      setFormError('Member identification number is required.');
      return;
    }

    addMember({
      fullName: fullName.trim(),
      memberNumber: memberNumber.trim().toUpperCase(),
      phone: phone.trim(),
      email: email.trim() || undefined,
      category,
      joinDate: new Date().toISOString().split('T')[0],
      status: 'active',
      notes: notes.trim() || undefined,
    });

    setIsAddModalOpen(false);
  };

  const handleSaveEditMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMember) return;
    updateMember(editingMember.id, {
      fullName: editingMember.fullName.trim(),
      phone: editingMember.phone.trim(),
      email: editingMember.email?.trim() || undefined,
      category: editingMember.category,
      notes: editingMember.notes?.trim() || undefined,
    });
    setEditingMember(null);
  };

  const handleDeleteMember = (member: Member) => {
    const res = safeDeleteMember(member.id);
    setDeleteNotice(res.message);
    setTimeout(() => setDeleteNotice(null), 5000);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 flex items-center space-x-2">
            <Users className="w-6 h-6 text-emerald-700" />
            <span>Members Directory</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Roster, obligations, payment histories, and official statements of account.
          </p>
        </div>

        {canMutate && (
          <button
            id="add-member-btn"
            onClick={handleOpenAddModal}
            className="flex items-center space-x-1.5 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg text-xs font-semibold shadow transition cursor-pointer self-start sm:self-auto"
          >
            <UserPlus className="w-4 h-4" />
            <span>Enroll New Member</span>
          </button>
        )}
      </div>

      {/* Notice Banner if safe delete/archive occurred */}
      {deleteNotice && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 px-4 py-3 rounded-lg text-xs flex items-center justify-between animate-in slide-in-from-top-2">
          <div className="flex items-center space-x-2">
            <Info className="w-4 h-4 text-emerald-700 shrink-0" />
            <span>{deleteNotice}</span>
          </div>
          <button
            onClick={() => setDeleteNotice(null)}
            className="text-emerald-800 hover:text-emerald-950 font-bold"
          >
            ×
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
          {/* Real-time Text Search Input */}
          <div className="relative flex-1 min-w-[260px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
            <input
              id="member-search-input"
              type="text"
              placeholder="Filter by name or identifier (e.g. MEM-001, Chief Emeka, phone)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:bg-white outline-none transition"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-700 p-0.5 rounded transition cursor-pointer"
                title="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filter Dropdowns Container */}
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-2">
            {/* Status Filter Dropdown */}
            <div className="flex items-center space-x-1.5 w-full sm:w-auto">
              <label htmlFor="member-status-dropdown" className="text-xs font-medium text-slate-500 whitespace-nowrap flex items-center space-x-1">
                <Filter className="w-3.5 h-3.5 text-slate-400" />
                <span>Status:</span>
              </label>
              <select
                id="member-status-dropdown"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="flex-1 sm:flex-initial px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none cursor-pointer"
              >
                <option value="all_active">Active Members ({activeMembersCount})</option>
                <option value="archived">Archived Members ({archivedMembersCount})</option>
                <option value="all">All Records (Active & Archived) ({currentOrgMembers.length})</option>
                <option value="good">Good Standing / Cleared ({goodStandingCount})</option>
                <option value="owing">Owing Arrears ({owingArrearsCount})</option>
              </select>
            </div>

            {/* Category Filter Dropdown */}
            <div className="flex items-center space-x-1.5 w-full sm:w-auto">
              <label htmlFor="member-category-filter" className="text-xs font-medium text-slate-500 whitespace-nowrap">
                Category:
              </label>
              <select
                id="member-category-filter"
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="flex-1 sm:flex-initial px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none cursor-pointer"
              >
                <option value="all">All Categories</option>
                <option value="regular">Regular Member</option>
                <option value="executive">Executive Officer</option>
                <option value="elder">Elder / Patron</option>
                <option value="honorary">Honorary Member</option>
                <option value="youth">Youth Wing</option>
              </select>
            </div>
          </div>
        </div>

        {/* Quick Tabs & Summary Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs">
          {/* Quick status tabs */}
          <div className="flex items-center space-x-1 overflow-x-auto py-0.5">
            <button
              id="filter-active-tab-btn"
              type="button"
              onClick={() => setStatusFilter('all_active')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition cursor-pointer ${
                statusFilter === 'all_active'
                  ? 'bg-slate-900 text-white font-semibold shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Active ({activeMembersCount})
            </button>
            <button
              id="filter-good-tab-btn"
              type="button"
              onClick={() => setStatusFilter('good')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition cursor-pointer ${
                statusFilter === 'good'
                  ? 'bg-emerald-700 text-white font-semibold shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Good Standing ({goodStandingCount})
            </button>
            <button
              id="filter-owing-tab-btn"
              type="button"
              onClick={() => setStatusFilter('owing')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition cursor-pointer ${
                statusFilter === 'owing'
                  ? 'bg-amber-600 text-white font-semibold shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Owing Arrears ({owingArrearsCount})
            </button>
            <button
              id="filter-archived-tab-btn"
              type="button"
              onClick={() => setStatusFilter('archived')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition cursor-pointer ${
                statusFilter === 'archived'
                  ? 'bg-slate-600 text-white font-semibold shadow-xs'
                  : 'text-slate-500 hover:bg-slate-100'
              }`}
            >
              Archived ({archivedMembersCount})
            </button>
          </div>

          {/* Result counter & Clear filters */}
          <div className="flex items-center space-x-2 text-[11px] text-slate-500">
            <span>
              Showing <strong className="text-slate-900 font-semibold">{filteredMembers.length}</strong> of{' '}
              {currentOrgMembers.length} members
            </span>
            {(searchQuery.trim() !== '' || statusFilter !== 'all_active' || categoryFilter !== 'all') && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setStatusFilter('all_active');
                  setCategoryFilter('all');
                }}
                className="text-emerald-700 hover:text-emerald-900 font-medium hover:underline cursor-pointer"
              >
                Reset filters
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Members Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Member</th>
                <th className="py-3 px-3">Contact</th>
                <th className="py-3 px-3">Category</th>
                <th className="py-3 px-3 text-right">Assigned Dues</th>
                <th className="py-3 px-3 text-right">Applied Paid</th>
                <th className="py-3 px-3 text-right">Arrears</th>
                <th className="py-3 px-3 text-center">Standing</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredMembers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 px-4">
                    <div className="flex flex-col items-center justify-center space-y-2 text-slate-400">
                      <Search className="w-8 h-8 text-slate-300 stroke-[1.5]" />
                      <div className="font-semibold text-slate-700 text-xs">
                        {searchQuery
                          ? `No members found matching "${searchQuery}"`
                          : 'No members match the selected filter criteria.'}
                      </div>
                      <p className="text-[11px] text-slate-400 max-w-sm">
                        Try adjusting your search query, status dropdown, or category filter to view members.
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setSearchQuery('');
                          setStatusFilter('all_active');
                          setCategoryFilter('all');
                        }}
                        className="mt-2 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition cursor-pointer"
                      >
                        Reset All Filters
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredMembers.map((member) => {
                  const arrears = calcOutstanding(member.expectedBalance, member.paidBalance);
                  const isCleared = arrears === 0;
                  const isArchived = member.status === 'archived';

                  return (
                    <tr
                      key={member.id}
                      className={`hover:bg-slate-50/70 transition ${
                        isArchived ? 'opacity-60 bg-slate-50' : ''
                      }`}
                    >
                      {/* Member Name & ID */}
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-2.5">
                          <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-700 font-bold flex items-center justify-center text-[11px] shrink-0">
                            {member.fullName
                              .split(' ')
                              .map((n) => n[0])
                              .join('')
                              .substring(0, 2)}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-900">{member.fullName}</div>
                            <div className="font-mono text-[10px] text-slate-500">
                              {member.memberNumber}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Contact */}
                      <td className="py-3 px-3 text-slate-600">
                        <div>{member.phone || '—'}</div>
                        <div className="text-[10px] text-slate-400">{member.email || ''}</div>
                      </td>

                      {/* Category */}
                      <td className="py-3 px-3">
                        <span className="capitalize text-slate-700 font-medium px-2 py-0.5 rounded bg-slate-100 text-[11px]">
                          {member.category}
                        </span>
                      </td>

                      {/* Assigned Expected */}
                      <td className="py-3 px-3 text-right font-mono font-medium text-slate-700">
                        {formatNaira(member.expectedBalance)}
                      </td>

                      {/* Paid */}
                      <td className="py-3 px-3 text-right font-mono font-semibold text-emerald-700">
                        {formatNaira(member.paidBalance)}
                      </td>

                      {/* Arrears */}
                      <td
                        className={`py-3 px-3 text-right font-mono font-bold ${
                          arrears > 0 ? 'text-amber-700' : 'text-slate-400'
                        }`}
                      >
                        {formatNaira(arrears)}
                        {member.unallocatedCredit > 0 && (
                          <div className="text-[9px] text-sky-600 font-normal">
                            +{formatNaira(member.unallocatedCredit)} credit
                          </div>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-3 text-center">
                        {isArchived ? (
                          <span className="text-[10px] uppercase font-bold bg-slate-200 text-slate-700 px-2 py-0.5 rounded">
                            ARCHIVED
                          </span>
                        ) : isCleared ? (
                          <span className="text-[10px] uppercase font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded flex items-center justify-center space-x-1">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>CLEARED</span>
                          </span>
                        ) : (
                          <span className="text-[10px] uppercase font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded">
                            OWING
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end space-x-1.5">
                          {/* Pay Shortcut */}
                          {canMutate && !isArchived && (
                            <button
                              onClick={() => onOpenRecordPayment(member.id)}
                              className="p-1.5 rounded-md hover:bg-emerald-50 text-emerald-700 transition cursor-pointer"
                              title="Record Payment"
                            >
                              <CreditCard className="w-4 h-4" />
                            </button>
                          )}

                          {/* Statement Modal Opener */}
                          <button
                            onClick={() => setSelectedStatementMember(member)}
                            className="p-1.5 rounded-md hover:bg-slate-100 text-slate-700 transition cursor-pointer"
                            title="View / Print Member Statement of Account"
                          >
                            <FileText className="w-4 h-4 text-emerald-800" />
                          </button>

                          {/* Edit Profile */}
                          {canMutate && !isArchived && (
                            <button
                              onClick={() => setEditingMember(member)}
                              className="p-1.5 rounded-md hover:bg-slate-100 text-slate-600 transition cursor-pointer"
                              title="Edit Member Profile"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* Safe Delete / Archive */}
                          {canMutate && !isArchived && (
                            <button
                              onClick={() => handleDeleteMember(member)}
                              className="p-1.5 rounded-md hover:bg-rose-50 text-rose-600 transition cursor-pointer"
                              title="Delete / Archive Member"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* Restore */}
                          {canMutate && isArchived && (
                            <button
                              onClick={() => restoreMember(member.id)}
                              className="p-1.5 rounded-md hover:bg-slate-200 text-slate-700 transition cursor-pointer"
                              title="Restore to Active Roster"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Member Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md rounded-xl shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="bg-slate-900 text-white px-5 py-3.5 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <UserPlus className="w-4 h-4 text-emerald-400" />
                <span className="font-bold text-sm">Enroll New Member</span>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveAddMember} className="p-5 space-y-4 text-xs">
              {formError && (
                <div className="bg-rose-50 text-rose-700 p-2.5 rounded-lg border border-rose-200">
                  {formError}
                </div>
              )}

              {/* Automatic Assigned Obligations Notice */}
              <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-lg text-emerald-900">
                <div className="font-bold flex items-center space-x-1 text-emerald-800">
                  <Shield className="w-3.5 h-3.5" />
                  <span>Automatic Obligations Assignment</span>
                </div>
                <div className="text-[11px] text-emerald-800 mt-1">
                  Active compulsory dues ({formatNaira(totalAssignedDues)}) will automatically be assigned to this new member&apos;s expected balance upon enrollment.
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Full Name (with titles) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Chief Emeka Okoro"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Member Number *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. EAPU-007"
                    value={memberNumber}
                    onChange={(e) => setMemberNumber(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Member Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white focus:ring-2 focus:ring-emerald-500 outline-none capitalize"
                  >
                    <option value="regular">Regular</option>
                    <option value="executive">Executive</option>
                    <option value="elder">Elder</option>
                    <option value="youth">Youth</option>
                    <option value="honorary">Honorary</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Phone Number</label>
                  <input
                    type="tel"
                    placeholder="e.g. +234 803 123 4567"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Email Address</label>
                  <input
                    type="email"
                    placeholder="optional"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Notes / Remarks</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Admitted during August General Meeting"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-3 py-2 rounded-lg text-slate-600 hover:bg-slate-100 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold shadow transition"
                >
                  Save & Assign Dues
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Member Modal */}
      {editingMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md rounded-xl shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="bg-slate-900 text-white px-5 py-3.5 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Edit2 className="w-4 h-4 text-emerald-400" />
                <span className="font-bold text-sm">Edit Member Details</span>
              </div>
              <button
                onClick={() => setEditingMember(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEditMember} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={editingMember.fullName}
                  onChange={(e) =>
                    setEditingMember({ ...editingMember, fullName: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Category</label>
                  <select
                    value={editingMember.category}
                    onChange={(e) =>
                      setEditingMember({ ...editingMember, category: e.target.value as any })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white focus:ring-2 focus:ring-emerald-500 outline-none capitalize"
                  >
                    <option value="regular">Regular</option>
                    <option value="executive">Executive</option>
                    <option value="elder">Elder</option>
                    <option value="youth">Youth</option>
                    <option value="honorary">Honorary</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Phone</label>
                  <input
                    type="tel"
                    value={editingMember.phone}
                    onChange={(e) =>
                      setEditingMember({ ...editingMember, phone: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Email</label>
                <input
                  type="email"
                  value={editingMember.email || ''}
                  onChange={(e) =>
                    setEditingMember({ ...editingMember, email: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Notes</label>
                <textarea
                  rows={2}
                  value={editingMember.notes || ''}
                  onChange={(e) =>
                    setEditingMember({ ...editingMember, notes: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setEditingMember(null)}
                  className="px-3 py-2 rounded-lg text-slate-600 hover:bg-slate-100 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold shadow transition"
                >
                  Update Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Member Statement Modal */}
      {selectedStatementMember && (
        <MemberStatementModal
          member={selectedStatementMember}
          onClose={() => setSelectedStatementMember(null)}
          onViewReceipt={onViewReceipt}
        />
      )}
    </div>
  );
};
