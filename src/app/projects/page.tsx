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
  ArrowRight,
  AlertTriangle,
  X,
  Trash2,
  CheckCircle2,
  Kanban,
  FileSpreadsheet,
  Building2,
  Clock,
  ChevronRight,
} from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { useConstructionStore } from '@/lib/store';
import {
  ProjectStatus,
  ProjectCategory,
  WORKFLOW_9_STEPS,
  WorkflowStepId,
} from '@/lib/types';
import { formatCurrencyVN } from '@/lib/utils';
import { createCoverSvg } from '@/lib/mock-images';
import { toast } from 'sonner';

export default function ProjectsPage() {
  const router = useRouter();
  const currentUser = useConstructionStore((s) => s.currentUser);
  const getVisibleProjects = useConstructionStore((s) => s.getVisibleProjects);
  const calculateProjectProgress = useConstructionStore((s) => s.calculateProjectProgress);
  const addProject = useConstructionStore((s) => s.addProject);
  const deleteProject = useConstructionStore((s) => s.deleteProject);

  const [viewMode, setViewMode] = useState<'grid' | 'kanban' | 'contracts' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [campusFilter, setCampusFilter] = useState<'all' | 'cs2' | 'tranphu'>('all');
  const [stepFilter, setStepFilter] = useState<number | 'all'>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);

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
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                Đại học Phú Xuân • Quy trình 9 Bước
              </span>
              {currentUser.role === 'leader' && (
                <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-semibold border border-emerald-500/30">
                  Phân quyền Lãnh đạo Giám sát
                </span>
              )}
            </div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              16 Gói thầu Cải tạo & Sửa chữa Campus
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Báo cáo phân rã đầu mục công việc, theo dõi tiến độ thực tế và kiểm soát dòng tiền hợp đồng thi công
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            {currentUser.role === 'admin' && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 transition-all flex items-center gap-2 cursor-pointer"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                Tạo gói thầu mới
              </button>
            )}
          </div>
        </div>

        {/* View Mode Switcher & Campus Filter Bar */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          {/* 4 View Modes */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0">
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
                viewMode === 'grid'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
              <span>Lưới 16 Gói thầu ({filteredProjects.length})</span>
            </button>

            <button
              onClick={() => setViewMode('kanban')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
                viewMode === 'kanban'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Kanban className="w-4 h-4" />
              <span>Kanban 9 Bước</span>
            </button>

            <button
              onClick={() => setViewMode('contracts')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
                viewMode === 'contracts'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Đối soát Hợp đồng ({signedProjects.length})</span>
            </button>

            <button
              onClick={() => setViewMode('list')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
                viewMode === 'list'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <List className="w-4 h-4" />
              <span>Danh sách</span>
            </button>
          </div>

          {/* Campus Filter */}
          <div className="flex items-center gap-2 self-start lg:self-auto text-xs shrink-0">
            <span className="text-slate-400 font-medium">Cơ sở:</span>
            <button
              onClick={() => setCampusFilter('all')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-colors ${
                campusFilter === 'all'
                  ? 'bg-slate-900 text-white dark:bg-amber-500 dark:text-slate-950'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
              }`}
            >
              Tất cả
            </button>
            <button
              onClick={() => setCampusFilter('cs2')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-colors ${
                campusFilter === 'cs2'
                  ? 'bg-slate-900 text-white dark:bg-amber-500 dark:text-slate-950'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
              }`}
            >
              Cơ sở 2 (15 gói)
            </button>
            <button
              onClick={() => setCampusFilter('tranphu')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-colors ${
                campusFilter === 'tranphu'
                  ? 'bg-slate-900 text-white dark:bg-amber-500 dark:text-slate-950'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
              }`}
            >
              176 Trần Phú (1 gói)
            </button>
          </div>
        </div>

        {/* Search & Quick Step Filter */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm theo tên hạng mục, nhà thầu (TBGroup, PNB Home, Toàn Cầu...), mã gói thầu..."
              className="w-full pl-9 pr-3 py-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-amber-500 shadow-xs"
            />
          </div>

          {/* Workflow Step Quick Filter */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs shrink-0">
            <button
              onClick={() => setStepFilter('all')}
              className={`px-3 py-2 rounded-xl font-bold whitespace-nowrap transition-colors ${
                stepFilter === 'all'
                  ? 'bg-slate-900 text-white dark:bg-amber-500 dark:text-slate-950'
                  : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
              }`}
            >
              Tất cả 9 bước
            </button>
            {WORKFLOW_9_STEPS.map((s) => (
              <button
                key={s.step}
                onClick={() => setStepFilter(stepFilter === s.step ? 'all' : s.step)}
                className={`px-2.5 py-2 rounded-xl whitespace-nowrap font-semibold border transition-all ${
                  stepFilter === s.step
                    ? 'bg-amber-500 text-slate-950 border-amber-500 font-bold shadow-xs'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-400'
                }`}
              >
                <span>{s.shortName}</span>
              </button>
            ))}
          </div>
        </div>

        {/* ======================================================== */}
        {/* VIEW 1: GRID VIEW (16 GÓI THẦU CẢI TẠO PXU)               */}
        {/* ======================================================== */}
        {viewMode === 'grid' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
            {filteredProjects.map((p) => {
              const progress = calculateProjectProgress(p.id);
              const stepObj =
                WORKFLOW_9_STEPS.find((s) => s.step === (p.workflowStep || 1)) || WORKFLOW_9_STEPS[0];
              const completedCount = p.completedTasksList?.length || 0;
              const pendingCount = p.pendingTasksList?.length || 0;
              const redAlertsCount = p.redAlerts?.length || 0;

              return (
                <div
                  key={p.id}
                  className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col group"
                >
                  {/* Card Cover */}
                  <div className="relative h-44 w-full bg-slate-900 overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={p.coverGradient}
                      alt={p.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />

                    {/* Top Badges */}
                    <div className="absolute top-3.5 left-3.5 flex flex-wrap items-center gap-1.5 max-w-[75%]">
                      <span className="px-2.5 py-1 rounded-lg bg-black/70 backdrop-blur-md text-white text-xs font-mono font-bold border border-white/20">
                        {p.code}
                      </span>
                      <span
                        className="px-2.5 py-1 rounded-lg text-xs font-bold backdrop-blur-md bg-amber-500 text-slate-950 border border-amber-400 shadow-sm"
                      >
                        Bước {stepObj.step}: {stepObj.shortName}
                      </span>
                    </div>

                    {/* Progress Badge */}
                    <div className="absolute top-3.5 right-3.5">
                      <div className="px-3 py-1.5 rounded-xl bg-slate-900/90 backdrop-blur-md border border-slate-700 text-white flex items-center gap-2 shadow-lg">
                        <div
                          className="w-2.5 h-2.5 rounded-full"
                          style={{
                            backgroundColor: progress === 100 ? '#10B981' : '#F59E0B',
                          }}
                        />
                        <span className="font-tabular font-extrabold text-sm">{progress}%</span>
                      </div>
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                    <div>
                      <h3 className="font-bold text-base text-slate-900 dark:text-slate-100 group-hover:text-amber-500 transition-colors line-clamp-1">
                        {p.name}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                        {p.description}
                      </p>

                      {/* Red Alert Pill if any */}
                      {redAlertsCount > 0 && (
                        <div className="mt-3 p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 animate-bounce" />
                          <span className="font-semibold line-clamp-1">
                            {p.redAlerts?.[0]}
                          </span>
                        </div>
                      )}

                      {/* Contractor and Budget Details */}
                      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 space-y-2 text-xs text-slate-500 dark:text-slate-400">
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-1.5">
                            <Building2 className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                            <strong className="text-slate-800 dark:text-slate-200 truncate">
                              {p.contractor || 'Chưa ký HĐ'}
                            </strong>
                          </span>
                          <span className="font-mono text-slate-900 dark:text-amber-400 font-bold">
                            {p.budget}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">{p.location}</span>
                        </div>
                      </div>
                    </div>

                    {/* Work Breakdown Counts & Action Button */}
                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                      <div className="flex items-center gap-2.5 text-xs">
                        <span className="flex items-center gap-1 text-emerald-600 font-medium">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          {completedCount} đã làm
                        </span>
                        <span className="text-slate-300 dark:text-slate-700">•</span>
                        <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-medium">
                          <Clock className="w-3.5 h-3.5" />
                          {pendingCount} việc còn lại
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {currentUser.role === 'admin' && (
                          <button
                            onClick={() => handleDelete(p.id, p.name)}
                            title="Xóa gói thầu"
                            className="p-2 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <Link
                          href={`/projects/${p.id}`}
                          className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white dark:bg-amber-500 dark:hover:bg-amber-400 dark:text-slate-950 text-xs font-bold transition-all flex items-center gap-1"
                        >
                          <span>Chi tiết</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
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
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-900 dark:text-amber-200 flex items-center justify-between">
              <span className="flex items-center gap-2 font-medium">
                <Kanban className="w-4 h-4 text-amber-600" />
                <span>
                  Bảng điều hướng quy trình 9 bước chuẩn hóa của Trường Đại học Phú Xuân.
                  Hiển thị vị trí thực tế của toàn bộ 16 gói thầu.
                </span>
              </span>
              <span className="text-[11px] font-bold">16 gói thầu</span>
            </div>

            <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin">
              {projectsByStep.map((col) => (
                <div
                  key={col.step}
                  className="w-80 shrink-0 rounded-3xl bg-slate-100/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 p-4 flex flex-col justify-between max-h-[750px]"
                >
                  {/* Column Header */}
                  <div>
                    <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 mb-3">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-6 h-6 rounded-lg text-white font-mono font-bold text-xs flex items-center justify-center"
                          style={{ backgroundColor: col.color }}
                        >
                          {col.step}
                        </div>
                        <h3 className="font-bold text-xs text-slate-900 dark:text-slate-100 truncate max-w-[170px]" title={col.name}>
                          {col.shortName}
                        </h3>
                      </div>
                      <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                        {col.projects.length}
                      </span>
                    </div>

                    {/* Column Project Cards */}
                    <div className="space-y-3 overflow-y-auto max-h-[620px] pr-1">
                      {col.projects.length === 0 ? (
                        <div className="py-8 text-center text-[11px] text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl bg-white/50 dark:bg-slate-900/50">
                          Chưa có gói thầu ở bước này
                        </div>
                      ) : (
                        col.projects.map((p) => {
                          const progress = calculateProjectProgress(p.id);
                          return (
                            <Link
                              key={p.id}
                              href={`/projects/${p.id}`}
                              className="block p-3.5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs hover:border-amber-400 hover:shadow-md transition-all group"
                            >
                              <div className="flex items-center justify-between mb-1.5">
                                <span className="font-mono text-[10px] font-bold px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300">
                                  {p.code}
                                </span>
                                <span className="font-tabular font-bold text-xs text-amber-600 dark:text-amber-400">
                                  {progress}%
                                </span>
                              </div>

                              <h4 className="font-bold text-xs text-slate-900 dark:text-slate-100 group-hover:text-amber-500 transition-colors line-clamp-2 leading-snug">
                                {p.name}
                              </h4>

                              {p.contractor && p.contractor !== 'Chưa chọn nhà thầu' && (
                                <div className="mt-2 text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1 truncate">
                                  <Building2 className="w-3 h-3 text-amber-500 shrink-0" />
                                  <span className="truncate">{p.contractor}</span>
                                </div>
                              )}

                              <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-[11px]">
                                <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
                                  {p.budget}
                                </span>
                                <span className="text-[10px] text-slate-400 group-hover:text-amber-500 flex items-center gap-0.5 font-semibold">
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
              <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
                <span className="text-xs text-slate-400 font-medium">Tổng giá trị hợp đồng đã ký:</span>
                <div className="font-tabular font-black text-xl text-amber-600 dark:text-amber-400 mt-1">
                  {formatCurrencyVN(totalSignedValue)}
                </div>
                <span className="text-[11px] text-slate-500 mt-0.5 block">5 hợp đồng thi công chính thức</span>
              </div>

              <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
                <span className="text-xs text-slate-400 font-medium">Tổng tạm ứng đợt 1 đã giải ngân:</span>
                <div className="font-tabular font-black text-xl text-emerald-600 mt-1">
                  {formatCurrencyVN(1265549000)}
                </div>
                <span className="text-[11px] text-slate-500 mt-0.5 block">30% - 40% giá trị hợp đồng</span>
              </div>

              <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
                <span className="text-xs text-slate-400 font-medium">Kinh phí giữ lại bảo hành (5%):</span>
                <div className="font-tabular font-black text-xl text-slate-800 dark:text-slate-200 mt-1">
                  {formatCurrencyVN(Math.round(totalSignedValue * 0.05))}
                </div>
                <span className="text-[11px] text-slate-500 mt-0.5 block">Bảo hành từ 12 đến 60 tháng</span>
              </div>
            </div>

            {/* Contracts Table */}
            <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
              <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100">
                    Bảng Đối soát Hợp đồng & Cam kết Pháp lý Nhà thầu
                  </h3>
                  <p className="text-xs text-slate-400">
                    Chi tiết các hợp đồng số 08/2026, 18/2026, 09/2026, 10/2026, 22102026
                  </p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 font-bold">
                      <th className="py-3 px-4">Số Hợp đồng</th>
                      <th className="py-3 px-4">Hạng mục công việc</th>
                      <th className="py-3 px-4">Nhà thầu thi công</th>
                      <th className="py-3 px-4 text-right">Giá trị HĐ (VNĐ)</th>
                      <th className="py-3 px-4 text-center">VAT</th>
                      <th className="py-3 px-4 text-center">Tạm ứng</th>
                      <th className="py-3 px-4 text-center">Bảo hành 5%</th>
                      <th className="py-3 px-4 text-center">Chi tiết</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {signedProjects.flatMap((p) =>
                      (p.contracts || []).map((ctr) => (
                        <tr
                          key={ctr.id}
                          className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                        >
                          <td className="py-3.5 px-4 font-mono font-bold text-amber-600 dark:text-amber-400 whitespace-nowrap">
                            {ctr.contractNumber}
                          </td>
                          <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-slate-100 max-w-xs truncate">
                            {p.name}
                          </td>
                          <td className="py-3.5 px-4 font-semibold text-slate-800 dark:text-slate-200 whitespace-nowrap">
                            {ctr.contractorName}
                          </td>
                          <td className="py-3.5 px-4 text-right font-mono font-extrabold text-slate-900 dark:text-white whitespace-nowrap">
                            {formatCurrencyVN(ctr.contractValue)}
                          </td>
                          <td className="py-3.5 px-4 text-center font-mono text-slate-600 dark:text-slate-400">
                            {ctr.vatRate}%
                          </td>
                          <td className="py-3.5 px-4 text-center font-mono text-emerald-600 font-bold">
                            {ctr.advancePaymentRate || 30}%
                          </td>
                          <td className="py-3.5 px-4 text-center font-mono text-slate-600 dark:text-slate-400">
                            {ctr.warrantyMonths || 12} tháng
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <Link
                              href={`/projects/${p.id}`}
                              className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-amber-500 hover:text-slate-950 font-bold text-[11px] transition-colors inline-block"
                            >
                              Xem
                            </Link>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* VIEW 4: LIST VIEW (DANH SÁCH TÓM TẮT)                     */}
        {/* ======================================================== */}
        {viewMode === 'list' && (
          <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs divide-y divide-slate-100 dark:divide-slate-800">
            {filteredProjects.map((p) => {
              const progress = calculateProjectProgress(p.id);
              const stepObj =
                WORKFLOW_9_STEPS.find((s) => s.step === (p.workflowStep || 1)) || WORKFLOW_9_STEPS[0];

              return (
                <div
                  key={p.id}
                  className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        {p.code}
                      </span>
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                        Bước {stepObj.step}: {stepObj.shortName}
                      </span>
                      <span className="text-xs text-slate-400 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-amber-500" />
                        {p.location}
                      </span>
                    </div>
                    <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-slate-100 truncate">
                      {p.name}
                    </h3>
                  </div>

                  <div className="flex items-center gap-6 shrink-0">
                    <div className="text-right">
                      <div className="font-mono font-bold text-xs text-amber-600 dark:text-amber-400">
                        {p.budget}
                      </div>
                      <div className="font-tabular font-bold text-sm text-slate-800 dark:text-slate-200">
                        Tiến độ: {progress}%
                      </div>
                    </div>

                    <Link
                      href={`/projects/${p.id}`}
                      className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-amber-500 hover:text-slate-950 font-bold text-xs transition-colors flex items-center gap-1"
                    >
                      <span>Xem</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Modal Tạo gói thầu mới */}
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
            <div className="relative w-full max-w-lg rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl animate-in zoom-in-95">
              <button
                onClick={() => setShowCreateModal(false)}
                className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <h3 className="text-lg font-black text-slate-900 dark:text-white mb-1">
                Tạo Gói thầu Cải tạo Mới
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                Điền thông tin hạng mục công trình theo quy chuẩn 9 bước của Đại học Phú Xuân
              </p>

              <form onSubmit={handleCreateProject} className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Mã gói thầu (Ví dụ: PXU-2026-CT45)
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Tên hạng mục công việc
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ví dụ: Cải tạo tầng 4-5 & Chống thấm mái"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Cơ sở thực hiện
                    </label>
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
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                    >
                      <option value="cs2">Cơ sở 2</option>
                      <option value="tranphu">Cơ sở 176 Trần Phú</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Bước quy trình ban đầu
                    </label>
                    <select
                      value={formData.workflowStep}
                      onChange={(e) =>
                        setFormData({ ...formData, workflowStep: Number(e.target.value) as WorkflowStepId })
                      }
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
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
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Dự toán / Kinh phí thực hiện (VNĐ)
                  </label>
                  <input
                    type="text"
                    value={formData.budget}
                    onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Mô tả phạm vi công việc
                  </label>
                  <textarea
                    rows={2}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold shadow-md shadow-amber-500/20"
                  >
                    Tạo gói thầu
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
