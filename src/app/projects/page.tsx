'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Search,
  Plus,
  LayoutGrid,
  List,
  MapPin,
  Calendar,
  UserRound,
  AlertTriangle,
  Trash2,
  CheckCircle2,
  Kanban,
  FileSpreadsheet,
  Building2,
  Clock,
  ChevronRight,
  Pencil,
} from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { PageHeader } from '@/components/ui/PageHeader';
import { SectionCard, StatCard, ProgressBar } from '@/components/ui/cards';
import { StatusBadge, type BadgeTone } from '@/components/ui/StatusBadge';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { RowMenu } from '@/components/ui/RowMenu';
import { Modal } from '@/components/ui/Modal';
import { useConstructionStore } from '@/lib/store';
import {
  ProjectStatus,
  ProjectCategory,
  WORKFLOW_9_STEPS,
  WorkflowStepId,
} from '@/lib/types';
import { formatCurrencyVN, formatDateVN } from '@/lib/utils';
import { createCoverSvg } from '@/lib/mock-images';
import { toast } from 'sonner';

const PROJECT_STATUS_META: Record<ProjectStatus, { label: string; tone: BadgeTone }> = {
  active: { label: 'Đang triển khai', tone: 'pine' },
  completed: { label: 'Đã hoàn thành', tone: 'navy' },
  paused: { label: 'Tạm dừng', tone: 'gold' },
};

export default function ProjectsPage() {
  const router = useRouter();
  const currentUser = useConstructionStore((s) => s.currentUser);
  const getVisibleProjects = useConstructionStore((s) => s.getVisibleProjects);
  const calculateProjectProgress = useConstructionStore((s) => s.calculateProjectProgress);
  const addProject = useConstructionStore((s) => s.addProject);
  const deleteProject = useConstructionStore((s) => s.deleteProject);
  const updateProject = useConstructionStore((s) => s.updateProject);

  const [viewMode, setViewMode] = useState<'grid' | 'kanban' | 'contracts' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [campusFilter, setCampusFilter] = useState<'all' | 'cs2' | 'tranphu'>('all');
  const [stepFilter, setStepFilter] = useState<number | 'all'>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);

  // New Project Form State
  const [formData, setFormData] = useState({
    code: 'PXU-2026-',
    name: '',
    description: '',
    location: 'Cơ sở 2 - Đại học Phú Xuân',
    category: 'facilities' as ProjectCategory,
    startDate: '2026-10-01',
    endDate: '2026-12-31',
    status: 'active' as ProjectStatus,
    workflowStep: 1 as WorkflowStepId,
    campus: 'cs2' as 'cs2' | 'tranphu',
    organization: 'Ban QLDA & CSVC Phú Xuân',
    contractor: 'Chưa chọn nhà thầu',
    budget: '200.000.000 VNĐ',
    budgetTotal: 200000000,
    leaderIds: ['usr-leader-1'],
    memberIds: ['usr-assignee'],
  });

  const visibleProjects = getVisibleProjects();
  const cs2Count = visibleProjects.filter((p) => p.campus === 'cs2' || !p.campus).length;
  const tranphuCount = visibleProjects.filter((p) => p.campus === 'tranphu').length;

  const filteredProjects = visibleProjects.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.organization && p.organization.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (p.contractor && p.contractor.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCampus =
      campusFilter === 'all' || p.campus === campusFilter || (!p.campus && campusFilter === 'cs2');
    const matchesStep = stepFilter === 'all' || p.workflowStep === stepFilter;
    return matchesSearch && matchesCampus && matchesStep;
  });

  const handleCreateProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.code.trim()) {
      toast.error('Vui lòng điền đầy đủ Mã gói thầu và Tên hạng mục!');
      return;
    }

    if (editingProjectId) {
      updateProject(editingProjectId, {
        code: formData.code,
        name: formData.name,
        description: formData.description,
        location: formData.location,
        category: formData.category,
        startDate: formData.startDate,
        endDate: formData.endDate,
        status: formData.status,
        workflowStep: formData.workflowStep,
        campus: formData.campus,
        organization: formData.organization,
        contractor: formData.contractor,
        budget: formData.budget,
        budgetTotal: formData.budgetTotal,
      });
      toast.success('Đã cập nhật gói thầu!');
      setShowCreateModal(false);
      setEditingProjectId(null);
      return;
    }

    const newId = addProject({
      ...formData,
      managerId: currentUser.id,
      completedTasksList: [],
      pendingTasksList: ['Khảo sát hiện trạng', 'Lập dự toán chi tiết'],
      coverGradient: createCoverSvg(
        formData.name,
        formData.code,
        '#0F172A',
        '#D97706',
        'CẢI TẠO CÔNG TRÌNH'
      ),
    });

    toast.success('Đã khởi tạo gói thầu cải tạo mới!', {
      description: `Mã: ${formData.code} đã được cấp quyền cho lãnh đạo và giao cho kỹ sư.`,
    });

    setShowCreateModal(false);
    router.push(`/projects/${newId}`);
  };

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Bạn có chắc chắn muốn xóa gói thầu "${name}" không?`)) {
      deleteProject(id);
      toast.success('Đã xóa gói thầu!');
    }
  };

  const handleEdit = (proj: (typeof visibleProjects)[number]) => {
    setEditingProjectId(proj.id);
    setFormData({
      code: proj.code,
      name: proj.name,
      description: proj.description || '',
      location: proj.location,
      category: proj.category,
      startDate: proj.startDate,
      endDate: proj.endDate,
      status: proj.status,
      workflowStep: (proj.workflowStep || 1) as WorkflowStepId,
      campus: (proj.campus === 'tranphu' ? 'tranphu' : 'cs2') as 'cs2' | 'tranphu',
      organization: proj.organization || '',
      contractor: proj.contractor || '',
      budget: proj.budget,
      budgetTotal: proj.budgetTotal || 0,
      leaderIds: proj.leaderIds || [],
      memberIds: proj.memberIds || [],
    });
    setShowCreateModal(true);
  };

  // Group projects by 9 workflow steps for Kanban view
  const projectsByStep = WORKFLOW_9_STEPS.map((stepObj) => {
    const stepProjects = filteredProjects.filter((p) => (p.workflowStep || 1) === stepObj.step);
    return {
      ...stepObj,
      projects: stepProjects,
    };
  });

  // Collect all signed contracts for Contracts reconciliation view
  const signedProjects = visibleProjects.filter((p) => p.contracts && p.contracts.length > 0);
  const totalSignedValue = signedProjects.reduce(
    (sum, p) => sum + (p.contracts?.reduce((sub, c) => sub + c.contractValue, 0) || 0),
    0
  );

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Page Header — 1 nút primary duy nhất: Tạo dự án (chỉ admin) */}
        <PageHeader
          eyebrow="Đại học Phú Xuân • Quy trình 9 Bước"
          title={`${filteredProjects.length} / ${visibleProjects.length} Gói thầu Cải tạo & Sửa chữa Campus`}
          description="Báo cáo phân rã đầu mục công việc, theo dõi tiến độ thực tế và kiểm soát dòng tiền hợp đồng thi công"
        >
          {currentUser.role === 'leader' && (
            <StatusBadge tone="pine" dot>
              Phân quyền Lãnh đạo Giám sát
            </StatusBadge>
          )}
          {currentUser.role === 'admin' && (
            <button
              onClick={() => { setEditingProjectId(null); setShowCreateModal(true); }}
              className="btn-primary"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              Tạo gói thầu mới
            </button>
          )}
        </PageHeader>

        {/* View Mode Switcher & Campus Filter Bar */}
        <div className="card flex flex-col lg:flex-row lg:items-center justify-between gap-3 p-3">
          <SegmentedControl
            value={viewMode}
            onChange={(v) => setViewMode(v)}
            options={[
              {
                value: 'grid',
                label: 'Lưới Gói thầu',
                count: filteredProjects.length,
                icon: <LayoutGrid className="w-4 h-4" />,
              },
              { value: 'kanban', label: 'Kanban 9 Bước', icon: <Kanban className="w-4 h-4" /> },
              {
                value: 'contracts',
                label: 'Đối soát Hợp đồng',
                count: signedProjects.length,
                icon: <FileSpreadsheet className="w-4 h-4" />,
              },
              { value: 'list', label: 'Danh sách', icon: <List className="w-4 h-4" /> },
            ]}
          />

          {/* Campus Filter */}
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs text-ink-soft dark:text-slate-400 font-medium">Cơ sở:</span>
            <SegmentedControl
              size="sm"
              value={campusFilter}
              onChange={(v) => setCampusFilter(v)}
              options={[
                { value: 'all', label: 'Tất cả' },
                { value: 'cs2', label: 'Cơ sở 2', count: cs2Count },
                { value: 'tranphu', label: '176 Trần Phú', count: tranphuCount },
              ]}
            />
          </div>
        </div>

        {/* Search & Quick Step Filter — gom trong 1 thanh lọc */}
        <div className="card flex flex-col xl:flex-row xl:items-center gap-3 p-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm theo tên hạng mục, nhà thầu (TBGroup, PNB Home, Toàn Cầu...), mã gói thầu..."
              className="input pl-10"
            />
          </div>

          {/* Workflow Step Quick Filter */}
          <SegmentedControl
            size="sm"
            value={stepFilter === 'all' ? 'all' : String(stepFilter)}
            onChange={(v) => {
              if (v === 'all') {
                setStepFilter('all');
              } else {
                const step = Number(v) as WorkflowStepId;
                setStepFilter(stepFilter === step ? 'all' : step);
              }
            }}
            options={[
              { value: 'all', label: 'Tất cả 9 bước' },
              ...WORKFLOW_9_STEPS.map((s) => ({ value: String(s.step), label: s.shortName })),
            ]}
          />
        </div>

        {/* ======================================================== */}
        {/* VIEW 1: GRID VIEW (16 GÓI THẦU CẢI TẠO PXU)               */}
        {/* ======================================================== */}
        {viewMode === 'grid' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredProjects.map((p) => {
              const progress = calculateProjectProgress(p.id);
              const stepObj =
                WORKFLOW_9_STEPS.find((s) => s.step === (p.workflowStep || 1)) || WORKFLOW_9_STEPS[0];
              const completedCount = p.completedTasksList?.length || 0;
              const pendingCount = p.pendingTasksList?.length || 0;
              const redAlertsCount = p.redAlerts?.length || 0;
              const statusMeta = PROJECT_STATUS_META[p.status] || PROJECT_STATUS_META.active;

              return (
                <div
                  key={p.id}
                  onClick={() => router.push(`/projects/${p.id}`)}
                  className="card overflow-hidden flex flex-col group cursor-pointer hover:-translate-y-0.5 hover:shadow-lg transition-all duration-300"
                >
                  {/* Card Cover — bìa gọn, hành động duy nhất là RowMenu (admin) */}
                  <div className="relative h-32 w-full bg-navy-900 overflow-hidden shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={p.coverGradient}
                      alt={p.name}
                      className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500"
                    />

                    <div className="absolute top-3 left-3">
                      <StatusBadge tone="gold">
                        Bước {stepObj.step}: {stepObj.shortName}
                      </StatusBadge>
                    </div>

                    {currentUser.role === 'admin' && (
                      <div className="absolute top-2.5 right-2.5">
                        <RowMenu
                          dark
                          label="Thao tác gói thầu"
                          items={[
                            {
                              label: 'Sửa',
                              icon: <Pencil className="w-4 h-4" />,
                              onClick: () => handleEdit(p),
                            },
                            {
                              label: 'Xoá',
                              icon: <Trash2 className="w-4 h-4" />,
                              danger: true,
                              onClick: () => handleDelete(p.id, p.name),
                            },
                          ]}
                        />
                      </div>
                    )}
                  </div>

                  {/* Card Body — hàng thông tin */}
                  <div className="p-5 flex-1 flex flex-col gap-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-xs font-bold text-ink-soft dark:text-slate-400">
                        {p.code}
                      </span>
                      <StatusBadge tone={statusMeta.tone} dot>
                        {statusMeta.label}
                      </StatusBadge>
                    </div>

                    <div>
                      <h3 className="font-bold text-[15px] leading-snug text-ink dark:text-slate-100 group-hover:text-pine-600 dark:group-hover:text-pine-500 transition-colors line-clamp-2">
                        {p.name}
                      </h3>
                      <p className="text-xs text-ink-soft dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                        {p.description}
                      </p>
                    </div>

                    {/* Red Alert Pill if any */}
                    {redAlertsCount > 0 && (
                      <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 animate-bounce" />
                        <span className="font-semibold line-clamp-1">
                          {p.redAlerts?.[0]}
                        </span>
                      </div>
                    )}

                    {/* Progress + meta rows */}
                    <div className="mt-auto space-y-2.5 pt-3 border-t border-line dark:border-night-line">
                      <div className="flex items-center gap-3">
                        <ProgressBar value={progress} tone={progress === 100 ? 'pine' : 'gold'} className="flex-1" />
                        <span className="font-tabular font-extrabold text-sm text-ink dark:text-white shrink-0">
                          {progress}%
                        </span>
                      </div>

                      <div className="flex items-center justify-between gap-2 text-xs text-ink-soft dark:text-slate-400">
                        <span className="flex items-center gap-1.5 min-w-0">
                          <UserRound className="w-3.5 h-3.5 text-gold-600 shrink-0" />
                          <span className="truncate font-semibold text-ink dark:text-slate-200">
                            {p.contractor || 'Chưa ký HĐ'}
                          </span>
                        </span>
                        <span className="font-mono font-bold text-ink dark:text-gold-400 shrink-0">
                          {p.budget}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 text-xs text-ink-soft dark:text-slate-400">
                        <Calendar className="w-3.5 h-3.5 shrink-0" />
                        <span>Hạn: {formatDateVN(p.endDate)}</span>
                        <span className="text-line dark:text-night-line">•</span>
                        <MapPin className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">{p.location}</span>
                      </div>

                      <div className="flex items-center gap-2.5 text-xs">
                        <span className="flex items-center gap-1 text-pine-600 dark:text-pine-500 font-medium">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          {completedCount} đã làm
                        </span>
                        <span className="text-line dark:text-night-line">•</span>
                        <span className="flex items-center gap-1 text-gold-600 dark:text-gold-400 font-medium">
                          <Clock className="w-3.5 h-3.5" />
                          {pendingCount} việc còn lại
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ======================================================== */}
        {/* VIEW 2: KANBAN 9 BƯỚC QUẢN LÝ GÓI THẦU                   */}
        {/* ======================================================== */}
        {viewMode === 'kanban' && (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-gold-100/60 dark:bg-gold-500/10 border border-gold-500/25 text-xs text-ink dark:text-gold-100 flex items-center justify-between">
              <span className="flex items-center gap-2 font-medium">
                <Kanban className="w-4 h-4 text-gold-600" />
                <span>
                  Bảng điều hướng quy trình 9 bước chuẩn hóa của Trường Đại học Phú Xuân.
                  Hiển thị vị trí thực tế của toàn bộ {filteredProjects.length} gói thầu.
                </span>
              </span>
              <span className="text-[11px] font-bold shrink-0">{filteredProjects.length} gói thầu</span>
            </div>

            <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin">
              {projectsByStep.map((col) => (
                <div
                  key={col.step}
                  className="w-80 shrink-0 rounded-[20px] bg-cream-deep/50 dark:bg-night-card border border-line dark:border-night-line p-4 flex flex-col justify-between max-h-[750px]"
                >
                  {/* Column Header */}
                  <div>
                    <div className="flex items-center justify-between pb-3 border-b border-line dark:border-night-line mb-3">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-6 h-6 rounded-lg text-white font-mono font-bold text-xs flex items-center justify-center"
                          style={{ backgroundColor: col.color }}
                        >
                          {col.step}
                        </div>
                        <h3 className="font-bold text-xs text-ink dark:text-slate-100 truncate max-w-[170px]" title={col.name}>
                          {col.shortName}
                        </h3>
                      </div>
                      <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-white dark:bg-night-line text-ink dark:text-slate-300 border border-line dark:border-night-line">
                        {col.projects.length}
                      </span>
                    </div>

                    {/* Column Project Cards */}
                    <div className="space-y-3 overflow-y-auto max-h-[620px] pr-1">
                      {col.projects.length === 0 ? (
                        <div className="py-8 text-center text-[11px] text-ink-soft dark:text-slate-400 border border-dashed border-line dark:border-night-line rounded-2xl bg-white/50 dark:bg-night/40">
                          Chưa có gói thầu ở bước này
                        </div>
                      ) : (
                        col.projects.map((p) => {
                          const progress = calculateProjectProgress(p.id);
                          return (
                            <Link
                              key={p.id}
                              href={`/projects/${p.id}`}
                              className="card block p-3.5 hover:border-gold-400 hover:shadow-md transition-all group"
                            >
                              <div className="flex items-center justify-between mb-1.5">
                                <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-cream-deep dark:bg-night-line text-ink dark:text-slate-300">
                                  {p.code}
                                </span>
                                <span className="font-tabular font-bold text-xs text-gold-600 dark:text-gold-400">
                                  {progress}%
                                </span>
                              </div>

                              <h4 className="font-bold text-xs text-ink dark:text-slate-100 group-hover:text-pine-600 dark:group-hover:text-pine-500 transition-colors line-clamp-2 leading-snug">
                                {p.name}
                              </h4>

                              {p.contractor && p.contractor !== 'Chưa chọn nhà thầu' && (
                                <div className="mt-2 text-[10px] text-ink-soft dark:text-slate-400 flex items-center gap-1 truncate">
                                  <Building2 className="w-3 h-3 text-gold-600 shrink-0" />
                                  <span className="truncate">{p.contractor}</span>
                                </div>
                              )}

                              <div className="mt-2.5 pt-2 border-t border-line dark:border-night-line flex items-center justify-between text-[11px]">
                                <span className="font-mono font-bold text-ink dark:text-slate-300">
                                  {p.budget}
                                </span>
                                <span className="text-[10px] text-ink-soft group-hover:text-pine-600 flex items-center gap-0.5 font-semibold">
                                  Xem <ChevronRight className="w-3 h-3" />
                                </span>
                              </div>
                            </Link>
                          );
                        })
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* VIEW 3: ĐỐI SOÁT HỢP ĐỒNG & NHÀ THẦU                     */}
        {/* ======================================================== */}
        {viewMode === 'contracts' && (
          <div className="space-y-6">
            {/* Financial Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <StatCard
                label="Tổng giá trị hợp đồng đã ký"
                value={formatCurrencyVN(totalSignedValue)}
                sub={`${signedProjects.reduce((n, p) => n + (p.contracts?.length || 0), 0)} hợp đồng thi công chính thức`}
                icon={<FileSpreadsheet className="w-4.5 h-4.5" />}
                tone="navy"
              />
              <StatCard
                label="Tổng tạm ứng đợt 1 đã giải ngân"
                value={formatCurrencyVN(1265549000)}
                sub="30% - 40% giá trị hợp đồng"
                icon={<CheckCircle2 className="w-4.5 h-4.5" />}
                tone="pine"
              />
              <StatCard
                label="Kinh phí giữ lại bảo hành (5%)"
                value={formatCurrencyVN(Math.round(totalSignedValue * 0.05))}
                sub="Bảo hành từ 12 đến 60 tháng"
                icon={<Clock className="w-4.5 h-4.5" />}
                tone="gold"
              />
            </div>

            {/* Contracts Table */}
            <SectionCard
              title="Bảng Đối soát Hợp đồng & Cam kết Pháp lý Nhà thầu"
              subtitle="Chi tiết các hợp đồng số 08/2026, 18/2026, 09/2026, 10/2026, 22102026"
              pad={false}
              className="overflow-hidden"
            >
              <div className="overflow-x-auto">
                <table className="table-base">
                  <thead>
                    <tr>
                      <th>Số Hợp đồng</th>
                      <th>Hạng mục công việc</th>
                      <th>Nhà thầu thi công</th>
                      <th className="text-right">Giá trị HĐ (VNĐ)</th>
                      <th className="text-center">VAT</th>
                      <th className="text-center">Tạm ứng</th>
                      <th className="text-center">Bảo hành 5%</th>
                      <th className="text-center">Chi tiết</th>
                    </tr>
                  </thead>
                  <tbody>
                    {signedProjects.flatMap((p) =>
                      (p.contracts || []).map((ctr) => (
                        <tr key={ctr.id}>
                          <td className="font-mono font-bold text-gold-600 dark:text-gold-400 whitespace-nowrap">
                            {ctr.contractNumber}
                          </td>
                          <td className="font-bold text-ink dark:text-slate-100 max-w-xs truncate">
                            {p.name}
                          </td>
                          <td className="font-semibold text-ink dark:text-slate-200 whitespace-nowrap">
                            {ctr.contractorName}
                          </td>
                          <td className="text-right font-mono font-extrabold text-ink dark:text-white whitespace-nowrap">
                            {formatCurrencyVN(ctr.contractValue)}
                          </td>
                          <td className="text-center font-mono text-ink-soft dark:text-slate-400">
                            {ctr.vatRate}%
                          </td>
                          <td className="text-center font-mono text-pine-600 font-bold">
                            {ctr.advancePaymentRate || 30}%
                          </td>
                          <td className="text-center font-mono text-ink-soft dark:text-slate-400">
                            {ctr.warrantyMonths || 12} tháng
                          </td>
                          <td className="text-center">
                            <Link href={`/projects/${p.id}`} className="btn-quiet">
                              Xem
                            </Link>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </SectionCard>
          </div>
        )}

        {/* ======================================================== */}
        {/* VIEW 4: LIST VIEW (DANH SÁCH TÓM TẮT)                     */}
        {/* ======================================================== */}
        {viewMode === 'list' && (
          <div className="card overflow-hidden divide-y divide-line dark:divide-night-line">
            {filteredProjects.map((p) => {
              const progress = calculateProjectProgress(p.id);
              const stepObj =
                WORKFLOW_9_STEPS.find((s) => s.step === (p.workflowStep || 1)) || WORKFLOW_9_STEPS[0];
              const statusMeta = PROJECT_STATUS_META[p.status] || PROJECT_STATUS_META.active;

              return (
                <div
                  key={p.id}
                  className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-cream/60 dark:hover:bg-night-line/40 transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-cream-deep dark:bg-night-line text-ink dark:text-slate-300">
                        {p.code}
                      </span>
                      <StatusBadge tone="gold">
                        Bước {stepObj.step}: {stepObj.shortName}
                      </StatusBadge>
                      <StatusBadge tone={statusMeta.tone} dot>
                        {statusMeta.label}
                      </StatusBadge>
                      <span className="text-xs text-ink-soft dark:text-slate-400 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-gold-600" />
                        {p.location}
                      </span>
                    </div>
                    <h3 className="font-bold text-sm sm:text-base text-ink dark:text-slate-100 truncate">
                      {p.name}
                    </h3>
                  </div>

                  <div className="flex items-center gap-5 shrink-0">
                    <div className="w-36">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono font-bold text-xs text-gold-600 dark:text-gold-400">
                          {p.budget}
                        </span>
                        <span className="font-tabular font-bold text-sm text-ink dark:text-slate-200">
                          {progress}%
                        </span>
                      </div>
                      <ProgressBar value={progress} tone={progress === 100 ? 'pine' : 'gold'} h="h-1.5" className="mt-1.5" />
                    </div>

                    <Link href={`/projects/${p.id}`} className="btn-quiet">
                      <span>Xem</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Modal Tạo / Sửa gói thầu */}
        <Modal
          open={showCreateModal}
          onClose={() => { setShowCreateModal(false); setEditingProjectId(null); }}
          title={editingProjectId ? 'Sửa Gói thầu Cải tạo' : 'Tạo Gói thầu Cải tạo Mới'}
          subtitle="Điền thông tin hạng mục công trình theo quy chuẩn 9 bước của Đại học Phú Xuân"
          size="md"
          footer={
            <>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="btn-ghost"
              >
                Hủy
              </button>
              <button type="submit" form="project-form" className="btn-primary">
                {editingProjectId ? 'Lưu thay đổi' : 'Tạo gói thầu'}
              </button>
            </>
          }
        >
          <form id="project-form" onSubmit={handleCreateProject} className="space-y-4">
            <div>
              <label className="lbl">Mã gói thầu (Ví dụ: PXU-2026-CT45)</label>
              <input
                type="text"
                required
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                className="input"
              />
            </div>

            <div>
              <label className="lbl">Tên hạng mục công việc</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ví dụ: Cải tạo tầng 4-5 & Chống thấm mái"
                className="input"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="lbl">Cơ sở thực hiện</label>
                <select
                  value={formData.campus}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      campus: e.target.value as 'cs2' | 'tranphu',
                      location:
                        e.target.value === 'cs2'
                          ? 'Cơ sở 2 - Đại học Phú Xuân'
                          : 'Cơ sở 176 Trần Phú, TP. Huế',
                    })
                  }
                  className="input"
                >
                  <option value="cs2">Cơ sở 2</option>
                  <option value="tranphu">Cơ sở 176 Trần Phú</option>
                </select>
              </div>

              <div>
                <label className="lbl">Bước quy trình ban đầu</label>
                <select
                  value={formData.workflowStep}
                  onChange={(e) =>
                    setFormData({ ...formData, workflowStep: Number(e.target.value) as WorkflowStepId })
                  }
                  className="input"
                >
                  {WORKFLOW_9_STEPS.map((s) => (
                    <option key={s.step} value={s.step}>
                      Bước {s.step}: {s.shortName}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="lbl">Dự toán / Kinh phí thực hiện (VNĐ)</label>
              <input
                type="text"
                value={formData.budget}
                onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                className="input"
              />
            </div>

            <div>
              <label className="lbl">Mô tả phạm vi công việc</label>
              <textarea
                rows={2}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="input"
              />
            </div>
          </form>
        </Modal>
      </div>
    </AppShell>
  );
}
