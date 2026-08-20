import React, { useState } from 'react';
import { useDuesBook } from '../context/DuesBookContext';
import { Contribution, ContributionType, Member, MemberCategory, ObligationTargetType } from '../types';
import { formatNaira, formatDate } from '../utils/formatters';
import {
  calcContributionExpected,
  calcContributionReceived,
  calcCollectionRate,
  getMemberContributionStatus,
  getApplicableMembers,
  isObligationApplicableToMember,
} from '../utils/financial';
import {
  Coins,
  Plus,
  Trash2,
  RotateCcw,
  Users,
  Info,
  X,
  Search,
  CheckSquare,
  Square,
  UserCheck,
  Tag,
  Target,
  HeartHandshake,
} from 'lucide-react';

interface ContributionsViewProps {
  onOpenRecordPayment: (memberId?: string) => void;
}

const CATEGORY_OPTIONS: { label: string; value: MemberCategory; color: string }[] = [
  { label: 'Regular Member', value: 'regular', color: 'bg-slate-100 text-slate-800' },
  { label: 'Executive Officer', value: 'executive', color: 'bg-indigo-100 text-indigo-800' },
  { label: 'Elder / Patron', value: 'elder', color: 'bg-amber-100 text-amber-800' },
  { label: 'Honorary Member', value: 'honorary', color: 'bg-emerald-100 text-emerald-800' },
  { label: 'Youth Wing', value: 'youth', color: 'bg-cyan-100 text-cyan-800' },
];

export const ContributionsView: React.FC<ContributionsViewProps> = ({
  onOpenRecordPayment,
}) => {
  const {
    currentOrgContributions,
    currentOrgMembers,
    currentOrgPayments,
    addContribution,
    safeDeleteContribution,
    restoreContribution,
    canMutate,
  } = useDuesBook();

  const [filterType, setFilterType] = useState<'all' | 'dues' | 'levy' | 'donation' | 'archived'>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedContribution, setSelectedContribution] = useState<Contribution | null>(null);
  const [rosterFilter, setRosterFilter] = useState<'all' | 'applicable'>('applicable');
  const [rosterSearch, setRosterSearch] = useState('');
  const [notice, setNotice] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [type, setType] = useState<ContributionType>('dues');
  const [amount, setAmount] = useState<number | ''>(50000);
  const [frequency, setFrequency] = useState<Contribution['frequency']>('annual');
  const [dueDate, setDueDate] = useState('');
  const [description, setDescription] = useState('');
  const [targetType, setTargetType] = useState<ObligationTargetType>('all');
  const [targetCategories, setTargetCategories] = useState<MemberCategory[]>(['regular', 'executive']);
  const [targetMemberIds, setTargetMemberIds] = useState<string[]>([]);
  const [memberSearchQuery, setMemberSearchQuery] = useState('');
  const [formError, setFormError] = useState('');

  const activeMembers = currentOrgMembers.filter((m) => m.status === 'active');

  const filteredContributions = currentOrgContributions.filter((c) => {
    if (filterType === 'archived') return c.status === 'archived';
    if (c.status === 'archived') return false;
    if (filterType === 'all') return true;
    if (filterType === 'dues') return c.type === 'dues' || c.type === 'recurring';
    return c.type === filterType;
  });

  const handleOpenAddModal = () => {
    setName('');
    setType('dues');
    setAmount(50000);
    setFrequency('annual');
    setDueDate('');
    setDescription('');
    setTargetType('all');
    setTargetCategories(['regular', 'executive']);
    setTargetMemberIds([]);
    setMemberSearchQuery('');
    setFormError('');
    setIsAddModalOpen(true);
  };

  const handleToggleCategory = (cat: MemberCategory) => {
    setTargetCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

  const handleToggleMember = (memberId: string) => {
    setTargetMemberIds((prev) =>
      prev.includes(memberId) ? prev.filter((id) => id !== memberId) : [...prev, memberId]
    );
  };

  const handleSelectAllMembers = () => {
    setTargetMemberIds(activeMembers.map((m) => m.id));
  };

  const handleDeselectAllMembers = () => {
    setTargetMemberIds([]);
  };

  // Compute how many members this newly drafted obligation would apply to
  const getDraftApplicableMembersCount = () => {
    if (targetType === 'all') return activeMembers.length;
    if (targetType === 'category') {
      return activeMembers.filter((m) => targetCategories.includes(m.category)).length;
    }
    if (targetType === 'members') {
      return targetMemberIds.length;
    }
    return activeMembers.length;
  };

  const handleSaveContribution = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setFormError('Contribution name is required.');
      return;
    }

    const isDonation = type === 'donation';
    const numAmount = isDonation ? 0 : Number(amount);

    if (!isDonation && (isNaN(numAmount) || numAmount <= 0)) {
      setFormError('Please enter a valid whole-naira amount greater than zero.');
      return;
    }

    if (targetType === 'category' && targetCategories.length === 0) {
      setFormError('Please select at least one member category for this obligation.');
      return;
    }

    if (targetType === 'members' && targetMemberIds.length === 0) {
      setFormError('Please select at least one member for this targeted obligation.');
      return;
    }

    addContribution({
      name: name.trim(),
      type,
      amount: numAmount,
      frequency,
      dueDate: dueDate || undefined,
      description: description.trim() || undefined,
      targetType,
      targetCategories: targetType === 'category' ? targetCategories : undefined,
      targetMemberIds: targetType === 'members' ? targetMemberIds : undefined,
    });

    setIsAddModalOpen(false);
  };

  const handleDeleteContribution = (c: Contribution) => {
    const res = safeDeleteContribution(c.id);
    setNotice(res.message);
    setTimeout(() => setNotice(null), 5000);
  };

  const getTargetBadge = (contrib: Contribution) => {
    const isDonation = contrib.type === 'donation';
    if (isDonation) {
      return { label: 'Open to All (Voluntary)', class: 'bg-purple-50 text-purple-700 border-purple-200' };
    }
    if (contrib.targetType === 'category') {
      const cats = contrib.targetCategories || [];
      const label = cats.length > 0 ? `Group: ${cats.join(', ')}` : 'Category';
      const count = getApplicableMembers(contrib, activeMembers).length;
      return {
        label: `${label} (${count} members)`,
        class: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      };
    }
    if (contrib.targetType === 'members') {
      const count = contrib.targetMemberIds?.length || 0;
      return {
        label: `Targeted: ${count} Selected Member${count === 1 ? '' : 's'}`,
        class: 'bg-amber-50 text-amber-800 border-amber-200',
      };
    }
    return {
      label: `All Active Members (${activeMembers.length})`,
      class: 'bg-slate-100 text-slate-700 border-slate-200',
    };
  };

  // Filtered members for Add Modal member selection
  const filteredModalMembers = activeMembers.filter(
    (m) =>
      m.fullName.toLowerCase().includes(memberSearchQuery.toLowerCase()) ||
      m.memberNumber.toLowerCase().includes(memberSearchQuery.toLowerCase()) ||
      m.category.toLowerCase().includes(memberSearchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 flex items-center space-x-2">
            <Coins className="w-6 h-6 text-emerald-700" />
            <span>Dues, Levies & Targeted Obligations</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Define organization-wide dues, group/category levies, member-specific assessments, and voluntary funds.
          </p>
        </div>

        {canMutate && (
          <button
            id="create-contribution-btn"
            onClick={handleOpenAddModal}
            className="flex items-center space-x-1.5 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg text-xs font-semibold shadow transition cursor-pointer self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Obligation</span>
          </button>
        )}
      </div>

      {notice && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 px-4 py-3 rounded-lg text-xs flex items-center justify-between animate-in slide-in-from-top-2">
          <div className="flex items-center space-x-2">
            <Info className="w-4 h-4 text-emerald-700 shrink-0" />
            <span>{notice}</span>
          </div>
          <button onClick={() => setNotice(null)} className="text-emerald-800 font-bold">
            ×
          </button>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs flex items-center space-x-1 overflow-x-auto">
        <button
          onClick={() => setFilterType('all')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
            filterType === 'all'
              ? 'bg-slate-900 text-white font-semibold'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          All Active ({currentOrgContributions.filter((c) => c.status === 'active').length})
        </button>
        <button
          onClick={() => setFilterType('dues')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
            filterType === 'dues'
              ? 'bg-emerald-700 text-white font-semibold'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Dues & Recurring
        </button>
        <button
          onClick={() => setFilterType('levy')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
            filterType === 'levy'
              ? 'bg-blue-700 text-white font-semibold'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Project Levies
        </button>
        <button
          onClick={() => setFilterType('donation')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
            filterType === 'donation'
              ? 'bg-purple-700 text-white font-semibold'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Free-Will Donations
        </button>
        <button
          onClick={() => setFilterType('archived')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
            filterType === 'archived'
              ? 'bg-slate-600 text-white font-semibold'
              : 'text-slate-500 hover:bg-slate-100'
          }`}
        >
          Archived ({currentOrgContributions.filter((c) => c.status === 'archived').length})
        </button>
      </div>

      {/* Contributions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredContributions.length === 0 ? (
          <div className="col-span-2 text-center py-12 bg-white rounded-xl border border-slate-200 text-slate-400 text-xs">
            No obligations found under this category.
          </div>
        ) : (
          filteredContributions.map((contrib) => {
            const isDonation = contrib.type === 'donation';
            const isArchived = contrib.status === 'archived';
            const expected = calcContributionExpected(contrib, activeMembers);
            const received = calcContributionReceived(contrib.id, currentOrgPayments);
            const rate = isDonation ? 100 : calcCollectionRate(expected, received);
            const targetBadge = getTargetBadge(contrib);
            const applicableCount = getApplicableMembers(contrib, activeMembers).length;

            return (
              <div
                key={contrib.id}
                className={`bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between transition hover:border-slate-300 ${
                  isArchived ? 'opacity-65 bg-slate-50' : ''
                }`}
              >
                <div>
                  {/* Top Badges & Actions */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span
                        className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${
                          isDonation
                            ? 'bg-purple-100 text-purple-800'
                            : contrib.type === 'levy'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {contrib.type}
                      </span>
                      <span className="text-[11px] text-slate-500 capitalize">
                        {contrib.frequency}
                      </span>
                      <span
                        className={`text-[10px] font-medium px-2 py-0.5 rounded-md border ${targetBadge.class}`}
                      >
                        {targetBadge.label}
                      </span>
                      {isArchived && (
                        <span className="text-[10px] uppercase font-bold bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded">
                          ARCHIVED
                        </span>
                      )}
                    </div>

                    <div className="flex items-center space-x-1 shrink-0">
                      {/* Breakdown inspect */}
                      <button
                        onClick={() => setSelectedContribution(contrib)}
                        className="p-1 text-slate-500 hover:text-slate-900 rounded hover:bg-slate-100 transition cursor-pointer"
                        title="View Contributor Breakdown"
                      >
                        <Users className="w-4 h-4" />
                      </button>

                      {/* Delete / Archive */}
                      {canMutate && !isArchived && (
                        <button
                          onClick={() => handleDeleteContribution(contrib)}
                          className="p-1 text-rose-500 hover:text-rose-700 rounded hover:bg-rose-50 transition cursor-pointer"
                          title="Safe Delete / Archive Obligation"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}

                      {/* Restore */}
                      {canMutate && isArchived && (
                        <button
                          onClick={() => restoreContribution(contrib.id)}
                          className="p-1 text-slate-600 hover:text-slate-900 rounded hover:bg-slate-200 transition cursor-pointer"
                          title="Restore to Active List"
                        >
                          <RotateCcw className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Title & Description */}
                  <h3 className="font-bold text-slate-900 text-sm sm:text-base mt-2.5">
                    {contrib.name}
                  </h3>
                  {contrib.description && (
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                      {contrib.description}
                    </p>
                  )}

                  {/* Rate & Metric Figures */}
                  <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-slate-400 text-[10px] uppercase font-bold block">
                        {isDonation ? 'Voluntary Target' : 'Assigned Per Member'}
                      </span>
                      <span className="font-bold text-slate-900 text-sm">
                        {isDonation ? 'Free-will' : formatNaira(contrib.amount)}
                      </span>
                      {!isDonation && (
                        <span className="text-[10px] text-slate-500 block">
                          Applies to {applicableCount} member{applicableCount === 1 ? '' : 's'}
                        </span>
                      )}
                    </div>

                    <div className="text-right">
                      <span className="text-slate-400 text-[10px] uppercase font-bold block">
                        Total Collected (Confirmed)
                      </span>
                      <span className="font-bold text-emerald-700 text-sm font-mono">
                        {formatNaira(received)}
                      </span>
                      {!isDonation && (
                        <span className="text-[10px] text-slate-500 block">
                          Target: {formatNaira(expected)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Progress bar */}
                  {!isDonation && (
                    <div className="mt-3">
                      <div className="flex justify-between text-[11px] text-slate-500 mb-1">
                        <span>Expected Pool: {formatNaira(expected)}</span>
                        <span className="font-semibold text-slate-700">{rate}% Cleared</span>
                      </div>
                      <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            rate >= 100
                              ? 'bg-emerald-500'
                              : rate >= 50
                              ? 'bg-emerald-600'
                              : 'bg-amber-500'
                          }`}
                          style={{ width: `${rate}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {isDonation && (
                    <div className="mt-3 p-2 bg-purple-50 rounded-lg text-[11px] text-purple-800 flex items-center space-x-1.5 border border-purple-200">
                      <HeartHandshake className="w-4 h-4 text-purple-600 shrink-0" />
                      <span>Voluntary Fund: Does not increment members&apos; compulsory arrears.</span>
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                  <span>Due: {contrib.dueDate ? formatDate(contrib.dueDate) : 'Open'}</span>
                  <button
                    onClick={() => setSelectedContribution(contrib)}
                    className="text-emerald-700 font-semibold hover:underline cursor-pointer"
                  >
                    View Status Roster →
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Create / Assign Obligation Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-auto animate-in zoom-in-95 duration-150 flex flex-col max-h-[92vh]">
            <div className="bg-slate-900 text-white px-5 py-3.5 flex items-center justify-between shrink-0">
              <div className="flex items-center space-x-2">
                <Coins className="w-4 h-4 text-emerald-400" />
                <span className="font-bold text-sm">Create New Obligation or Assessment</span>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveContribution} className="p-5 space-y-4 text-xs overflow-y-auto flex-1">
              {formError && (
                <div className="bg-rose-50 text-rose-700 p-2.5 rounded-lg border border-rose-200 font-medium">
                  {formError}
                </div>
              )}

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Obligation Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Executive Quarterly Levy or AGM Hall Refurbishment"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Category Type</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as ContributionType)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white focus:ring-2 focus:ring-emerald-500 outline-none capitalize"
                  >
                    <option value="dues">Regular Dues</option>
                    <option value="levy">Special Levy</option>
                    <option value="recurring">Recurring Fund</option>
                    <option value="donation">Free-Will Donation</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Frequency</label>
                  <select
                    value={frequency}
                    onChange={(e) => setFrequency(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white focus:ring-2 focus:ring-emerald-500 outline-none capitalize"
                  >
                    <option value="one_off">One-Off</option>
                    <option value="monthly">Monthly</option>
                    <option value="quarterly">Quarterly</option>
                    <option value="annual">Annual</option>
                  </select>
                </div>
              </div>

              {type !== 'donation' ? (
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Whole Naira Amount per Member (₦) *
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
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
              ) : (
                <div className="bg-purple-50 p-3 rounded-lg border border-purple-200 text-purple-900 text-[11px]">
                  <div className="font-bold flex items-center space-x-1">
                    <HeartHandshake className="w-3.5 h-3.5" />
                    <span>Free-Will Donation Policy</span>
                  </div>
                  <div className="mt-1">
                    Voluntary donation: ₦0 compulsory obligation, will not increase arrears. Members can donate any amount.
                  </div>
                </div>
              )}

              {/* TARGETING & SCOPE SECTION */}
              <div className="pt-2 border-t border-slate-200">
                <label className="block font-semibold text-slate-800 mb-1.5 flex items-center space-x-1.5">
                  <Target className="w-4 h-4 text-emerald-600" />
                  <span>Applicable Target Audience</span>
                </label>
                <p className="text-[11px] text-slate-500 mb-2.5">
                  Choose who this obligation applies to. Only selected members will have their expected balance updated.
                </p>

                <div className="grid grid-cols-3 gap-2 mb-3">
                  <button
                    type="button"
                    onClick={() => setTargetType('all')}
                    className={`p-2 rounded-lg border text-left transition flex flex-col justify-between ${
                      targetType === 'all'
                        ? 'border-emerald-600 bg-emerald-50/60 text-emerald-950 font-semibold shadow-xs'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="text-xs">All Members</span>
                      <Users className="w-3.5 h-3.5 text-slate-400" />
                    </div>
                    <span className="text-[10px] text-slate-500 font-normal mt-1">
                      {activeMembers.length} active roster
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTargetType('category')}
                    className={`p-2 rounded-lg border text-left transition flex flex-col justify-between ${
                      targetType === 'category'
                        ? 'border-emerald-600 bg-emerald-50/60 text-emerald-950 font-semibold shadow-xs'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="text-xs">By Category</span>
                      <Tag className="w-3.5 h-3.5 text-slate-400" />
                    </div>
                    <span className="text-[10px] text-slate-500 font-normal mt-1">
                      Group / Ranks
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTargetType('members')}
                    className={`p-2 rounded-lg border text-left transition flex flex-col justify-between ${
                      targetType === 'members'
                        ? 'border-emerald-600 bg-emerald-50/60 text-emerald-950 font-semibold shadow-xs'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="text-xs">Select Members</span>
                      <UserCheck className="w-3.5 h-3.5 text-slate-400" />
                    </div>
                    <span className="text-[10px] text-slate-500 font-normal mt-1">
                      Individual picker
                    </span>
                  </button>
                </div>

                {/* Sub-selector for Categories */}
                {targetType === 'category' && (
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-2 animate-in fade-in duration-150">
                    <div className="font-semibold text-slate-700 text-[11px]">
                      Select Member Categories:
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {CATEGORY_OPTIONS.map((cat) => {
                        const count = activeMembers.filter((m) => m.category === cat.value).length;
                        const isChecked = targetCategories.includes(cat.value);
                        return (
                          <label
                            key={cat.value}
                            className={`flex items-center space-x-2 p-2 rounded-md border cursor-pointer transition ${
                              isChecked
                                ? 'bg-white border-emerald-500 text-slate-900 shadow-xs'
                                : 'bg-white/60 border-slate-200 text-slate-600 hover:bg-white'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => handleToggleCategory(cat.value)}
                              className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                            />
                            <span className="flex-1 font-medium">{cat.label}</span>
                            <span className="text-[10px] font-mono text-slate-400">
                              ({count})
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Sub-selector for Specific Members */}
                {targetType === 'members' && (
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-2.5 animate-in fade-in duration-150">
                    <div className="flex items-center justify-between gap-2">
                      <div className="font-semibold text-slate-700 text-[11px]">
                        Choose Members ({targetMemberIds.length} selected):
                      </div>
                      <div className="flex items-center space-x-2 text-[10px]">
                        <button
                          type="button"
                          onClick={handleSelectAllMembers}
                          className="text-emerald-700 hover:underline font-semibold flex items-center space-x-1"
                        >
                          <CheckSquare className="w-3 h-3" />
                          <span>Select All</span>
                        </button>
                        <span className="text-slate-300">|</span>
                        <button
                          type="button"
                          onClick={handleDeselectAllMembers}
                          className="text-slate-500 hover:underline flex items-center space-x-1"
                        >
                          <Square className="w-3 h-3" />
                          <span>Clear</span>
                        </button>
                      </div>
                    </div>

                    <div className="relative">
                      <Search className="w-3.5 h-3.5 absolute left-2.5 top-2 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Search member name or number..."
                        value={memberSearchQuery}
                        onChange={(e) => setMemberSearchQuery(e.target.value)}
                        className="w-full pl-8 pr-3 py-1.5 border border-slate-300 rounded-md text-xs bg-white focus:ring-1 focus:ring-emerald-500 outline-none"
                      />
                    </div>

                    <div className="max-h-40 overflow-y-auto space-y-1 bg-white p-1.5 rounded-md border border-slate-200 divide-y divide-slate-100">
                      {filteredModalMembers.length === 0 ? (
                        <div className="py-4 text-center text-slate-400 text-[11px]">
                          No members match your search.
                        </div>
                      ) : (
                        filteredModalMembers.map((m) => {
                          const isChecked = targetMemberIds.includes(m.id);
                          return (
                            <label
                              key={m.id}
                              className={`flex items-center justify-between p-1.5 rounded hover:bg-slate-50 cursor-pointer ${
                                isChecked ? 'bg-emerald-50/50' : ''
                              }`}
                            >
                              <div className="flex items-center space-x-2 min-w-0">
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => handleToggleMember(m.id)}
                                  className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                                />
                                <div className="truncate">
                                  <div className="font-semibold text-slate-900 truncate">
                                    {m.fullName}
                                  </div>
                                  <div className="text-[10px] text-slate-400 font-mono">
                                    {m.memberNumber} • {m.category}
                                  </div>
                                </div>
                              </div>
                            </label>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}

                {/* Live summary pill */}
                {type !== 'donation' && (
                  <div className="mt-2 text-[11px] text-emerald-900 bg-emerald-50/80 p-2.5 rounded-lg border border-emerald-200">
                    <span className="font-semibold">Expected Impact: </span>
                    Will assign {formatNaira(typeof amount === 'number' ? amount : 0)} to{' '}
                    <span className="font-bold">{getDraftApplicableMembersCount()} members</span>{' '}
                    (Target Expected Total:{' '}
                    <span className="font-bold font-mono">
                      {formatNaira(
                        (typeof amount === 'number' ? amount : 0) * getDraftApplicableMembersCount()
                      )}
                    </span>
                    ).
                  </div>
                )}
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Due Date</label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Description / Purpose</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Approved at the AGM for hall refurbishment or executive committee support"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end space-x-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-3 py-2 rounded-lg text-slate-600 hover:bg-slate-100 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold shadow transition cursor-pointer"
                >
                  Create & Distribute Obligation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Contributor Breakdown Drawer / Modal */}
      {selectedContribution && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-xs">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-150">
            <div className="bg-slate-900 text-white px-5 py-3.5 flex items-center justify-between shrink-0">
              <div>
                <div className="text-[10px] text-emerald-400 uppercase font-semibold">
                  Obligation Status Roster
                </div>
                <h3 className="font-bold text-sm sm:text-base flex items-center space-x-2">
                  <span>{selectedContribution.name}</span>
                </h3>
              </div>
              <button
                onClick={() => {
                  setSelectedContribution(null);
                  setRosterSearch('');
                }}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 bg-slate-50 border-b border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs shrink-0">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Type & Scope</span>
                <span className="font-semibold text-slate-900 capitalize">
                  {selectedContribution.type}
                </span>
                <span className="text-[10px] text-slate-500 block">
                  {selectedContribution.targetType === 'category'
                    ? `Group (${selectedContribution.targetCategories?.join(', ')})`
                    : selectedContribution.targetType === 'members'
                    ? `Targeted (${selectedContribution.targetMemberIds?.length} members)`
                    : 'All Active Members'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Assigned</span>
                <span className="font-bold text-slate-900 font-mono">
                  {selectedContribution.type === 'donation'
                    ? 'Free-Will'
                    : formatNaira(selectedContribution.amount)}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Total Target Expected</span>
                <span className="font-bold text-slate-900 font-mono">
                  {selectedContribution.type === 'donation'
                    ? 'Voluntary'
                    : formatNaira(calcContributionExpected(selectedContribution, activeMembers))}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Total Collected</span>
                <span className="font-bold text-emerald-700 font-mono">
                  {formatNaira(calcContributionReceived(selectedContribution.id, currentOrgPayments))}
                </span>
              </div>
            </div>

            {/* Roster Filter & Search Controls */}
            <div className="p-3 border-b border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 bg-white shrink-0">
              <div className="flex items-center space-x-1 text-xs">
                <button
                  onClick={() => setRosterFilter('applicable')}
                  className={`px-2.5 py-1 rounded-md font-medium text-[11px] ${
                    rosterFilter === 'applicable'
                      ? 'bg-slate-900 text-white font-semibold'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  Assigned Members Only ({getApplicableMembers(selectedContribution, activeMembers).length})
                </button>
                <button
                  onClick={() => setRosterFilter('all')}
                  className={`px-2.5 py-1 rounded-md font-medium text-[11px] ${
                    rosterFilter === 'all'
                      ? 'bg-slate-900 text-white font-semibold'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  All Roster ({activeMembers.length})
                </button>
              </div>

              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search in roster..."
                  value={rosterSearch}
                  onChange={(e) => setRosterSearch(e.target.value)}
                  className="pl-8 pr-3 py-1 border border-slate-200 rounded-md text-xs focus:ring-1 focus:ring-emerald-500 outline-none w-full sm:w-48"
                />
              </div>
            </div>

            <div className="p-4 overflow-y-auto flex-1">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200 sticky top-0">
                  <tr>
                    <th className="py-2 px-3">Member</th>
                    <th className="py-2 px-3 text-right">Expected</th>
                    <th className="py-2 px-3 text-right">Paid</th>
                    <th className="py-2 px-3 text-right">Balance</th>
                    <th className="py-2 px-3 text-center">Status</th>
                    {canMutate && <th className="py-2 px-3 text-right">Action</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {activeMembers
                    .filter((member) => {
                      if (rosterFilter === 'applicable') {
                        return (
                          isObligationApplicableToMember(selectedContribution, member) ||
                          calcContributionReceived(selectedContribution.id, currentOrgPayments.filter((p) => p.memberId === member.id)) > 0
                        );
                      }
                      return true;
                    })
                    .filter(
                      (member) =>
                        member.fullName.toLowerCase().includes(rosterSearch.toLowerCase()) ||
                        member.memberNumber.toLowerCase().includes(rosterSearch.toLowerCase())
                    )
                    .map((member) => {
                      const st = getMemberContributionStatus(
                        member,
                        selectedContribution,
                        currentOrgPayments
                      );
                      const isApplicable = isObligationApplicableToMember(selectedContribution, member);

                      return (
                        <tr key={member.id} className="hover:bg-slate-50">
                          <td className="py-2.5 px-3">
                            <div className="flex items-center space-x-1.5">
                              <span className="font-semibold text-slate-900">{member.fullName}</span>
                              {!isApplicable && (
                                <span className="text-[9px] px-1 py-0.2 rounded bg-slate-100 text-slate-500">
                                  Exempt
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] font-mono text-slate-400">
                              {member.memberNumber} • {member.category}
                            </div>
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono text-slate-600">
                            {selectedContribution.type === 'donation'
                              ? 'Voluntary'
                              : !isApplicable
                              ? 'Exempt (₦0)'
                              : formatNaira(st.expected)}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-semibold text-emerald-700">
                            {formatNaira(st.paid)}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                            {selectedContribution.type === 'donation'
                              ? '—'
                              : !isApplicable
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
                              {st.status.toUpperCase()}
                            </span>
                          </td>
                          {canMutate && (
                            <td className="py-2.5 px-3 text-right">
                              {st.outstanding > 0 ? (
                                <button
                                  onClick={() => {
                                    setSelectedContribution(null);
                                    onOpenRecordPayment(member.id);
                                  }}
                                  className="text-emerald-700 hover:text-emerald-900 font-semibold text-[11px]"
                                >
                                  Record Pay
                                </button>
                              ) : (
                                <button
                                  onClick={() => {
                                    setSelectedContribution(null);
                                    onOpenRecordPayment(member.id);
                                  }}
                                  className="text-slate-400 hover:text-slate-700 font-medium text-[10px]"
                                >
                                  + Payment
                                </button>
                              )}
                            </td>
                          )}
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>

            <div className="p-3 bg-slate-100 border-t border-slate-200 flex justify-end shrink-0">
              <button
                onClick={() => {
                  setSelectedContribution(null);
                  setRosterSearch('');
                }}
                className="px-4 py-1.5 bg-slate-800 text-white rounded-lg text-xs font-semibold hover:bg-slate-700 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
