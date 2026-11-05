'use client';


import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  Calendar,
  MapPin,
  LayoutGrid,
  List,
  CalendarRange,
  PlusCircle,
  Lock,
  ArrowLeft,
  DollarSign,
  Briefcase,
  Sparkles,
  Send,
  Star,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Check,
  CreditCard,
  Receipt,
  Camera,
  Users,
} from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { SectionCard, StatCard, ProgressBar, Avatar, EmptyState } from '@/components/ui/cards';
import { StatusBadge, type BadgeTone } from '@/components/ui/StatusBadge';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { RowMenu, IconBtn } from '@/components/ui/RowMenu';
import { Switch } from '@/components/ui/Switch';
import { TaskKanbanView } from '@/components/projects/TaskKanbanView';
import { TaskListView } from '@/components/projects/TaskListView';
import { TaskTimelineView } from '@/components/projects/TaskTimelineView';
import { ProjectGallery } from '@/components/projects/ProjectGallery';
import { ProjectChat } from '@/components/projects/ProjectChat';
import { ProjectMembers } from '@/components/projects/ProjectMembers';
import { TaskApprovalModal } from '@/components/tasks/TaskApprovalModal';
import { TaskUpdateModal } from '@/components/tasks/TaskUpdateModal';
import { TaskDetailModal } from '@/components/tasks/TaskDetailModal';
import { WorkflowStepper } from '@/components/projects/WorkflowStepper';
import { WorkBreakdownChecklist } from '@/components/projects/WorkBreakdownChecklist';
import { ProjectContractsCard } from '@/components/projects/ProjectContractsCard';
import { useConstructionStore } from '@/lib/store';
import {
  Task,
  CATEGORY_CONFIG,
  LeaderEvaluation,
  INCIDENT_SEVERITY_CONFIG,
  INCIDENT_STATUS_CONFIG,
  WORKFLOW_9_STEPS,
} from '@/lib/types';
import { formatDateVN, formatDateTimeVN, formatCurrencyVN } from '@/lib/utils';
import { toast } from 'sonner';

// 7 PRM tabs
type ProjectTab = 'overview' | 'tasks' | 'media' | 'incidents' | 'financial' | 'chat' | 'access';

const PROJECT_STATUS_META: Record<string, { label: string; tone: BadgeTone }> = {
  active: { label: 'Đang triển khai', tone: 'pine' },
  completed: { label: 'Đã hoàn thành', tone: 'navy' },
  paused: { label: 'Tạm dừng', tone: 'gold' },
};

export default function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const projectId = resolvedParams.id;
  const searchParams = useSearchParams();

  const currentUser = useConstructionStore((s) => s.currentUser);
  const canUserAccessProject = useConstructionStore((s) => s.canUserAccessProject);
  const getProjectById = useConstructionStore((s) => s.getProjectById);
  const calculateProjectProgress = useConstructionStore((s) => s.calculateProjectProgress);
  const getProjectTasks = useConstructionStore((s) => s.getProjectTasks);
  const addLeaderDirective = useConstructionStore((s) => s.addLeaderDirective);
  const evaluateProject = useConstructionStore((s) => s.evaluateProject);
  const markMilestonePaid = useConstructionStore((s) => s.markMilestonePaid);
  const updateIncidentStatus = useConstructionStore((s) => s.updateIncidentStatus);
  const getProjectIncidents = useConstructionStore((s) => s.getProjectIncidents);
  const updateProjectWorkflowStep = useConstructionStore((s) => s.updateProjectWorkflowStep);
  const toggleProjectChecklistTask = useConstructionStore((s) => s.toggleProjectChecklistTask);
  const allUsers = useConstructionStore((s) => s.users);
  const toggleLeaderAccess = useConstructionStore((s) => s.toggleLeaderAccess);

  const initialTabParam = searchParams.get('tab');
  const initialTaskId = searchParams.get('taskId');

  // Map query param (kể cả param cũ) sang 7 tab mới:
  // tasks->tasks, financial->financial, gallery/media->media, chat->chat,
  // members/activity->access (chỉ admin, còn lại về overview), mặc định -> overview
  const getResolvedTab = (tab: string | null): ProjectTab => {
    if (!tab) return 'overview';
    if (tab === 'tasks') return 'tasks';
    if (tab === 'overview') return 'overview';
    if (tab === 'financial') return 'financial';
    if (tab === 'incidents') return 'incidents';
    if (tab === 'chat') return 'chat';
    if (tab === 'access') return currentUser.role === 'admin' ? 'access' : 'overview';
    if (tab === 'gallery' || tab === 'media') return 'media';
    if (tab === 'members' || tab === 'activity') {
      return currentUser.role === 'admin' ? 'access' : 'overview';
    }
    return 'overview';
  };

  const [activeTab, setActiveTab] = useState<ProjectTab>(getResolvedTab(initialTabParam));
  const [taskViewMode, setTaskViewMode] = useState<'kanban' | 'list' | 'timeline'>('list');
  const [incidentFilter, setIncidentFilter] = useState<'all' | 'open' | 'resolving' | 'resolved'>('all');

  // Leadership directive & evaluation input states
  const [directiveInput, setDirectiveInput] = useState('');
  const [evalComment, setEvalComment] = useState('');
  const [evalRating, setEvalRating] = useState<'excellent' | 'good' | 'needs_improvement'>('excellent');
  const [showEvalForm, setShowEvalForm] = useState(false);

  // Modals state
  const [inspectTask, setInspectTask] = useState<Task | null>(null);
  const [approvalTask, setApprovalTask] = useState<Task | null>(null);
  const [updateTask, setUpdateTask] = useState<Task | null>(null);

  const project = getProjectById(projectId);
  const hasAccess = canUserAccessProject(currentUser.id, projectId);

  // Open initial task if passed via query param
  useEffect(() => {
    if (!initialTaskId || !project) return;
    const timer = setTimeout(() => {
      const target = getProjectTasks(project.id).find((t) => t.id === initialTaskId);
      if (target) {
        if (target.status === 'submitted' && currentUser.role === 'admin') {
          setApprovalTask(target);
        } else {
          setInspectTask(target);
        }
      }
    }, 50);
    return () => clearTimeout(timer);
  }, [initialTaskId, project, currentUser.role, getProjectTasks]);

  // Guard: tab Phân quyền chỉ dành cho admin — role khác bị đưa về Tổng quan
  // (điều chỉnh state ngay trong render theo pattern React khuyến nghị, thay cho useEffect)
  if (activeTab === 'access' && currentUser.role !== 'admin') {
    setActiveTab('overview');
  }

  // Unauthorized view
  if (!project || !hasAccess) {
    return (
      <AppShell>
        <div className="card max-w-lg mx-auto mt-10">
          <EmptyState
            icon={<Lock className="w-7 h-7 text-rose-500" />}
            title="Bạn không có quyền xem gói thầu này"
            description={`Tài khoản hiện tại (${currentUser.name} - ${currentUser.title}) chưa được cấp quyền truy cập hồ sơ gói thầu này.`}
          >
            <Link href="/projects" className="btn-primary">
              <ArrowLeft className="w-4 h-4" />
              Về danh sách gói thầu
            </Link>
          </EmptyState>
        </div>
      </AppShell>
    );
  }

  const projectTasks = getProjectTasks(project.id);
  const progress = calculateProjectProgress(project.id);
  const isLeader = currentUser.role === 'leader';
  const isAdmin = currentUser.role === 'admin';
  const isAssignee = currentUser.role === 'assignee';
  const catConfig = project.category ? CATEGORY_CONFIG[project.category] : null;

  // Lãnh đạo thật của dự án (theo leaderIds) + thành viên tóm tắt cho tab Tổng quan / Phân quyền
  const projectLeaders = (project.leaderIds || [])
    .map((id) => allUsers.find((u) => u.id === id))
    .filter((u): u is NonNullable<typeof u> => Boolean(u));
  const projectLeaderNames = projectLeaders.map((u) => u.name);
  const allLeaders = allUsers.filter((u) => u.role === 'leader');
  const projectMemberNames = (project.memberIds || [])
    .map((id) => allUsers.find((u) => u.id === id))
    .filter((u): u is NonNullable<typeof u> => Boolean(u))
    .map((u) => u.name);

  // Financial milestones calculations
  const milestones = project.paymentMilestones || [];
  const totalBudget =
    project.budgetTotal ||
    (milestones.length > 0 ? milestones.reduce((sum, m) => sum + m.amount, 0) : 0);
  const paidMilestones = milestones.filter((m) => m.status === 'paid');
  const paidAmount = paidMilestones.reduce((sum, m) => sum + m.amount, 0);
  const remainingAmount = Math.max(0, totalBudget - paidAmount);
  const paidPercent = totalBudget > 0 ? Math.round((paidAmount / totalBudget) * 100) : 0;
  const nextMilestone = milestones.find((m) => m.status !== 'paid');

  // Incidents calculations
  const projectIncidents = getProjectIncidents(project.id);
  const unresolvedIncidents = projectIncidents.filter((i) => i.status !== 'resolved');
  const filteredIncidents = projectIncidents.filter((inc) => {
    if (incidentFilter === 'all') return true;
    return inc.status === incidentFilter;
  });

  // Current workflow step details
  const currentStepNum = project.workflowStep || 1;
  const currentStepObj =
    WORKFLOW_9_STEPS.find((s) => s.step === currentStepNum) || WORKFLOW_9_STEPS[0];

  // Primary task for quick update (for Thầy Kiệt)
  const inProgressTask =
    projectTasks.find((t) => t.status === 'in_progress' || t.status === 'todo') || projectTasks[0];

  const handleSubmitDirective = (e: React.FormEvent) => {
    e.preventDefault();
    if (!directiveInput.trim()) return;

    addLeaderDirective(project.id, directiveInput.trim());
    toast.success('Đã gửi ý kiến chỉ đạo tới Thầy Trần Quốc Vương & Đội kỹ sư!');
    setDirectiveInput('');
  };

  const handleSubmitEvaluation = (e: React.FormEvent) => {
    e.preventDefault();
    const evaluation: LeaderEvaluation = {
      rating: evalRating,
      comment:
        evalComment.trim() ||
        (evalRating === 'excellent'
          ? 'Gói thầu triển khai đúng tiêu chuẩn kỹ thuật và tiến độ cam kết.'
          : 'Cần đốc thúc nhà thầu đẩy nhanh khâu hoàn thiện hiện trường và hồ sơ thanh toán.'),
      evaluatedBy: currentUser.name,
      evaluatedAt: new Date().toISOString(),
    };

    evaluateProject(project.id, evaluation);
    toast.success('Đã lưu kết quả đánh giá của Ban Lãnh đạo!');
    setShowEvalForm(false);
  };

  const handleConfirmMilestonePayment = (milestoneId: string, title: string) => {
    if (!isAdmin) {
      toast.error('Chỉ Chủ trì dự án (Thầy Trần Quốc Vương) có quyền xác nhận nộp kinh phí.');
      return;
    }
    markMilestonePaid(project.id, milestoneId);
    toast.success(`Đã xác nhận nộp tiền thành công cho: "${title}"`, {
      description: 'Hệ thống đã cập nhật giải ngân và gửi thông báo tới Ban Lãnh đạo.',
    });
  };

  const handleResolveIncident = (taskId: string, incidentId: string) => {
    updateIncidentStatus(
      taskId,
      incidentId,
      'resolved',
      'Đã hoàn thành xử lý triệt để tại hiện trường theo chỉ đạo của Chủ trì dự án.'
    );
    toast.success('Đã cập nhật trạng thái trở ngại thành: Đã giải quyết');
  };

  return (
    <AppShell>
      <div className="space-y-6">
        {/* ========================================================= */}
        {/* HERO — tổng quan gọn trong 1 card                          */}
        {/* ========================================================= */}
        <div className="card p-5 sm:p-6 space-y-5">
          <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-5">
            <div className="flex items-start gap-3 min-w-0">
              <Link href="/projects" className="mt-0.5 shrink-0">
                <IconBtn label="Quay lại danh sách gói thầu">
                  <ArrowLeft className="w-4.5 h-4.5" />
                </IconBtn>
              </Link>

              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                  <span className="eyebrow">{project.code}</span>
                  {/* Hành động chính theo vai trò — tối đa 1 nút primary cho cả trang.
                      File này không có sửa/xoá dự án trong logic hiện tại nên không thêm RowMenu bịa. */}
                  {isAssignee && inProgressTask && (
                    <button onClick={() => setUpdateTask(inProgressTask)} className="btn-primary">
                      <Camera className="w-4 h-4 stroke-[2.5]" />
                      <span>+ Báo cáo hiện trường</span>
                    </button>
                  )}
                  {isAdmin && (
                    <Link href={`/tasks/new?projectId=${project.id}`} className="btn-primary">
                      <PlusCircle className="w-4 h-4 stroke-[2.5]" />
                      <span>+ Giao mục tiêu mới</span>
                    </Link>
                  )}
                  {isLeader && (
                    <button onClick={() => setActiveTab('overview')} className="btn-ghost">
                      <Sparkles className="w-4 h-4" />
                      <span>Gửi chỉ đạo Lãnh đạo</span>
                    </button>
                  )}
                </div>

                <h1 className="text-[22px] sm:text-[26px] font-extrabold text-ink dark:text-white tracking-tight leading-snug mt-1.5">
                  {project.name}
                </h1>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-ink-soft dark:text-slate-400 mt-2.5 font-medium">
                  <StatusBadge tone={(PROJECT_STATUS_META[project.status] || PROJECT_STATUS_META.active).tone} dot>
                    {(PROJECT_STATUS_META[project.status] || PROJECT_STATUS_META.active).label}
                  </StatusBadge>
                  <StatusBadge tone="sky">
                    {project.campus === 'tranphu' ? '176 Trần Phú' : 'Cơ sở 2 - An Tây'}
                  </StatusBadge>
                  {catConfig && (
                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded border ${catConfig.badge}`}>
                      {catConfig.label}
                    </span>
                  )}
                  <span className="flex items-center gap-1.5">
                    <Briefcase className="w-3.5 h-3.5 text-gold-600" />
                    Đơn vị thi công: <strong className="text-ink dark:text-slate-200">{project.contractor || project.organization}</strong>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-gold-600" />
                    {project.location}
                  </span>
                  <span className="flex items-center gap-1.5 font-mono">
                    <Calendar className="w-3.5 h-3.5 text-gold-600" />
                    {formatDateVN(project.startDate)} → {formatDateVN(project.endDate)}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-gold-600" />
                    Lãnh đạo giám sát:{' '}
                    <strong className="text-ink dark:text-slate-200">
                      {projectLeaderNames.length > 0 ? projectLeaderNames.join(', ') : 'Chưa cấp quyền'}
                    </strong>
                  </span>
                </div>
              </div>
            </div>

            {/* Tiến độ thật — số % lớn + thanh pine + bước workflow hiện tại */}
            <div className="shrink-0 lg:w-56 lg:border-l lg:border-line lg:dark:border-night-line lg:pl-5">
              <div className="flex items-baseline gap-2">
                <span className="font-tabular text-[40px] leading-none font-extrabold text-ink dark:text-white">
                  {progress}
                </span>
                <span className="font-tabular text-lg font-bold text-ink-soft dark:text-slate-400">%</span>
                <span className="text-[11px] text-ink-soft dark:text-slate-400 font-medium">
                  {projectTasks.filter((t) => t.status === 'approved').length}/{projectTasks.length} nhiệm vụ
                </span>
              </div>
              <ProgressBar value={progress} tone="pine" className="mt-2.5" />
              <p className="text-xs font-semibold text-pine-700 dark:text-pine-500 mt-2">
                Đang ở Bước {currentStepNum}: {currentStepObj.shortName}
              </p>
            </div>
          </div>

          {/* Dải số liệu tài chính tóm tắt (tiến độ đã chuyển lên khối % bên phải) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 border-t border-line dark:border-night-line text-xs">
            <div className="p-3 rounded-2xl bg-parchment dark:bg-night-line/40 border border-line dark:border-night-line">
              <span className="text-[10px] text-ink-soft dark:text-slate-400 uppercase font-semibold block">Kinh phí dự toán</span>
              <div className="font-mono text-base font-black text-ink dark:text-white mt-0.5">
                {formatCurrencyVN(totalBudget)}
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-parchment dark:bg-night-line/40 border border-line dark:border-night-line">
              <span className="text-[10px] text-pine-600 dark:text-pine-500 uppercase font-semibold block">Đã thanh toán</span>
              <div className="font-mono text-base font-black text-pine-600 dark:text-pine-500 mt-0.5">
                {formatCurrencyVN(paidAmount)} ({paidPercent}%)
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-parchment dark:bg-night-line/40 border border-line dark:border-night-line">
              <span className="text-[10px] text-gold-600 dark:text-gold-400 uppercase font-semibold block">Còn lại cần nộp</span>
              <div className="font-mono text-base font-black text-gold-600 dark:text-gold-400 mt-0.5">
                {formatCurrencyVN(remainingAmount)}
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* 7 PRM TABS — SegmentedControl variant="tabs"              */}
        {/* ========================================================= */}
        <SegmentedControl<ProjectTab>
          variant="tabs"
          value={activeTab}
          onChange={(v) => setActiveTab(v)}
          options={[
            { value: 'overview', label: 'Tổng quan' },
            { value: 'tasks', label: 'Công việc', count: projectTasks.length },
            { value: 'media', label: 'Báo cáo & Minh chứng' },
            { value: 'incidents', label: 'Sự cố', count: projectIncidents.length },
            { value: 'financial', label: `Dòng tiền (${paidPercent}% nộp)` },
            { value: 'chat', label: 'Trao đổi' },
            ...(isAdmin ? [{ value: 'access' as ProjectTab, label: 'Phân quyền' }] : []),
          ]}
        />

        {/* TAB: TỔNG QUAN */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Mô tả & thông tin hợp đồng / thành viên tóm tắt */}
            <SectionCard title="Tổng quan gói thầu">
              <p className="text-xs sm:text-sm text-ink-soft dark:text-slate-300 leading-relaxed">
                {project.description}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-ink-soft dark:text-slate-400 pt-3 mt-3 border-t border-line dark:border-night-line">
                <span>Đơn vị tổ chức: <strong className="text-ink dark:text-slate-200">{project.organization}</strong></span>
                <span>Nhà thầu: <strong className="text-ink dark:text-slate-200">{project.contractor || 'Chưa chọn nhà thầu'}</strong></span>
                <span>Địa điểm: <strong className="text-ink dark:text-slate-200">{project.location}</strong></span>
                <span>Kinh phí: <strong className="text-ink dark:text-slate-200">{project.budget}</strong></span>
                <span>
                  Lãnh đạo theo dõi:{' '}
                  <strong className="text-ink dark:text-slate-200">
                    {projectLeaderNames.length > 0 ? projectLeaderNames.join(', ') : 'Chưa cấp quyền'}
                  </strong>
                </span>
                <span>
                  Thành viên thực hiện:{' '}
                  <strong className="text-ink dark:text-slate-200">
                    {projectMemberNames.length > 0 ? projectMemberNames.join(', ') : '—'}
                  </strong>
                </span>
              </div>
            </SectionCard>

            {/* 9-Step Standard Workflow Stepper */}
            <WorkflowStepper
              currentStep={currentStepNum}
              onStepChange={(step) => updateProjectWorkflowStep(project.id, step)}
              canEdit={isAdmin}
            />

            {/* Work Breakdown: 2 Columns (Done vs To-do) & Red Alerts */}
            <WorkBreakdownChecklist
              projectId={project.id}
              projectName={project.name}
              completedTasks={project.completedTasksList || []}
              pendingTasks={project.pendingTasksList || []}
              redAlerts={project.redAlerts || []}
              onToggleTask={(taskTitle, isCompleted) =>
                toggleProjectChecklistTask(project.id, taskTitle, isCompleted)
              }
              canEdit={isAdmin || isAssignee}
            />

            {/* Thông tin hợp đồng (tóm tắt) */}
            <ProjectContractsCard contracts={project.contracts} technicalNotes={project.technicalNotes} />

            {/* Leadership Directive & Evaluation Panel */}
            <div className="card p-5 sm:p-6 bg-gold-100/40 dark:bg-gold-500/5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-2xl bg-gold-500 text-navy-950 flex items-center justify-center font-bold">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm sm:text-base text-ink dark:text-slate-100">
                      Ý kiến Định hướng & Chỉ đạo của Ban Giám hiệu
                    </h3>
                    <p className="text-xs text-ink-soft dark:text-slate-400">
                      {projectLeaderNames.length > 0
                        ? `${projectLeaderNames.join(' & ')} trực tiếp theo dõi và chỉ đạo`
                        : 'Ban lãnh đạo được cấp quyền theo dõi và chỉ đạo'}
                    </p>
                  </div>
                </div>

                {/* Leader Evaluation Badge if evaluated */}
                {project.evaluation && (
                  <div className="flex items-center gap-2">
                    <StatusBadge tone="gold">
                      <Star className="w-3.5 h-3.5 fill-current" />
                      Xếp loại:{' '}
                      {project.evaluation.rating === 'excellent'
                        ? 'Xuất sắc'
                        : project.evaluation.rating === 'good'
                        ? 'Đạt yêu cầu'
                        : 'Cần tối ưu'}
                    </StatusBadge>
                    <span className="text-[10px] text-ink-soft dark:text-slate-400">
                      Đánh giá bởi {project.evaluation.evaluatedBy}
                    </span>
                  </div>
                )}
              </div>

              {/* Directive Display */}
              {project.directive && (
                <div className="p-4 rounded-2xl bg-parchment dark:bg-night-card border border-line dark:border-night-line text-xs">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-bold text-gold-600 dark:text-gold-400">
                      {project.directive.authorName} ({project.directive.authorTitle})
                    </span>
                    <span className="text-[10px] text-ink-soft dark:text-slate-400 font-mono">
                      {formatDateTimeVN(project.directive.createdAt)}
                    </span>
                  </div>
                  <p className="text-ink dark:text-slate-300 italic leading-relaxed text-sm">
                    &ldquo;{project.directive.content}&rdquo;
                  </p>
                </div>
              )}

              {/* Evaluation comment if any */}
              {project.evaluation?.comment && (
                <div className="p-3.5 rounded-2xl bg-pine-100/60 dark:bg-pine-600/10 border border-pine-500/25 text-xs text-pine-700 dark:text-pine-500">
                  <strong className="block font-semibold mb-0.5">Nhận xét chuyên môn của Lãnh đạo:</strong>
                  {project.evaluation.comment}
                </div>
              )}

              {/* Leader Actions: Quick Directive Box & Evaluation Form */}
              {isLeader && (
                <div className="pt-2 space-y-3">
                  <form onSubmit={handleSubmitDirective} className="flex gap-2">
                    <input
                      type="text"
                      value={directiveInput}
                      onChange={(e) => setDirectiveInput(e.target.value)}
                      placeholder="Nhập ý kiến chỉ đạo mới cho Thầy Trần Quốc Vương và đội kỹ sư..."
                      className="input flex-1"
                    />
                    <button type="submit" className="btn-primary shrink-0">
                      <Send className="w-3.5 h-3.5" />
                      Gửi chỉ đạo
                    </button>
                  </form>

                  <div>
                    {!showEvalForm ? (
                      <button
                        type="button"
                        onClick={() => setShowEvalForm(true)}
                        className="btn-quiet"
                      >
                        <Star className="w-3.5 h-3.5" />
                        {project.evaluation ? 'Đánh giá lại gói thầu' : 'Chấm điểm / Đánh giá xếp loại gói thầu này'}
                      </button>
                    ) : (
                      <form
                        onSubmit={handleSubmitEvaluation}
                        className="p-4 rounded-2xl bg-parchment dark:bg-night-card border border-line dark:border-night-line space-y-3"
                      >
                        <div className="font-bold text-[13px] text-ink dark:text-slate-200">
                          Đánh giá chất lượng thực hiện gói thầu:
                        </div>
                        <SegmentedControl
                          value={evalRating}
                          onChange={(v) => setEvalRating(v)}
                          options={[
                            { value: 'excellent', label: 'Xuất sắc' },
                            { value: 'good', label: 'Đạt yêu cầu' },
                            { value: 'needs_improvement', label: 'Cần tối ưu' },
                          ]}
                        />
                        <textarea
                          rows={2}
                          value={evalComment}
                          onChange={(e) => setEvalComment(e.target.value)}
                          placeholder="Nhập nhận xét hoặc lưu ý chuyên môn của Ban Giám hiệu..."
                          className="input"
                        />
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setShowEvalForm(false)}
                            className="btn-ghost"
                          >
                            Hủy
                          </button>
                          <button type="submit" className="btn-gold">
                            Lưu đánh giá
                          </button>
                        </div>
                      </form>
                    )}
                  </div>
                </div>
              )}
            </div>

          </div>
        )}

        {/* TAB: CÔNG VIỆC */}
        {activeTab === 'tasks' && (
          <div className="space-y-6">
            {/* Tasks Management & View Modes */}
            <SectionCard
              title={`Hạng mục Nhiệm vụ & Báo cáo kỹ thuật (${projectTasks.length})`}
              subtitle="Phê duyệt bởi Thầy Trần Quốc Vương • Thực hiện bởi Đội kỹ thuật hiện trường"
              action={
                <SegmentedControl
                  size="sm"
                  value={taskViewMode}
                  onChange={(v) => setTaskViewMode(v)}
                  options={[
                    { value: 'list', label: 'Danh sách', icon: <List className="w-3.5 h-3.5" /> },
                    { value: 'kanban', label: 'Bảng Kanban', icon: <LayoutGrid className="w-3.5 h-3.5" /> },
                    { value: 'timeline', label: 'Gantt', icon: <CalendarRange className="w-3.5 h-3.5" /> },
                  ]}
                />
              }
            >
              {/* Task Views Rendering */}
              {taskViewMode === 'list' && (
                <TaskListView
                  tasks={projectTasks}
                  onSelectTask={(t) => setInspectTask(t)}
                  onOpenApproval={(t) => setApprovalTask(t)}
                  onOpenUpdate={(t) => setUpdateTask(t)}
                  isReadOnly={isLeader}
                />
              )}

              {taskViewMode === 'kanban' && (
                <TaskKanbanView
                  tasks={projectTasks}
                  isReadOnly={isLeader}
                  onSelectTask={(t) => setInspectTask(t)}
                  onOpenApproval={(t) => setApprovalTask(t)}
                  onOpenUpdate={(t) => setUpdateTask(t)}
                />
              )}

              {taskViewMode === 'timeline' && (
                <TaskTimelineView
                  tasks={projectTasks}
                  onSelectTask={(t) => setInspectTask(t)}
                />
              )}
            </SectionCard>
          </div>
        )}

        {/* TAB: BÁO CÁO & MINH CHỨNG */}
        {activeTab === 'media' && (
          <div className="space-y-6">
            {/* Field Proof Gallery (Videos 10 mins & Photos) */}
            <SectionCard
              title="Minh chứng Hiện trường (Video 10 phút & Ảnh nghiệm thu)"
              subtitle="Bằng chứng thực địa phục vụ công tác giám sát của Lãnh đạo và thanh quyết toán"
            >
              <ProjectGallery projectId={project.id} tasks={projectTasks} />
            </SectionCard>
          </div>
        )}

        {/* TAB: SỰ CỐ — tổng hợp toàn bộ sự cố của dự án (getProjectIncidents) */}
        {activeTab === 'incidents' && (
          <div className="space-y-6">
            {/* Incidents & Field Obstacles Integrated Section */}
            <SectionCard
              title={`Nhật trình Sự cố & Trở ngại thi công (${projectIncidents.length})`}
              subtitle="Thời tiết mưa bão, chậm vật tư, vướng mặt bằng và biện pháp khắc phục"
              action={
                <div className="flex items-center gap-2">
                  {unresolvedIncidents.length > 0 && (
                    <StatusBadge tone="rose" dot>
                      {unresolvedIncidents.length} cần xử lý
                    </StatusBadge>
                  )}
                  <SegmentedControl
                    size="sm"
                    value={incidentFilter}
                    onChange={(v) => setIncidentFilter(v)}
                    options={[
                      { value: 'all', label: 'Tất cả' },
                      { value: 'open', label: 'Mới' },
                      { value: 'resolving', label: 'Đang xử lý' },
                      { value: 'resolved', label: 'Đã giải quyết' },
                    ]}
                  />
                </div>
              }
            >
              {filteredIncidents.length === 0 ? (
                <EmptyState
                  icon={<AlertTriangle className="w-6 h-6" />}
                  title="Không có trở ngại nào trong danh mục này"
                  description="Hiện trường không có trở ngại nào trong danh mục này."
                />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {filteredIncidents.map((inc) => {
                    const sev = INCIDENT_SEVERITY_CONFIG[inc.severity];
                    const st = INCIDENT_STATUS_CONFIG[inc.status];
                    const isResolved = inc.status === 'resolved';

                    return (
                      <div
                        key={inc.id}
                        className={`p-4 rounded-2xl border text-xs flex flex-col justify-between ${
                          isResolved
                            ? 'bg-parchment dark:bg-night-line/40 border-line dark:border-night-line'
                            : inc.severity === 'critical' || inc.severity === 'high'
                            ? 'bg-rose-50/60 dark:bg-rose-500/5 border-rose-300 dark:border-rose-500/30'
                            : 'bg-gold-100/40 dark:bg-gold-500/5 border-gold-500/30 dark:border-gold-500/25'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-1.5">
                              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${sev.badgeClass}`}>
                                {sev.label}
                              </span>
                              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${st.badgeClass}`}>
                                {st.label}
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              <span className="text-[10px] text-ink-soft dark:text-slate-400 font-mono">
                                {formatDateVN(inc.reportedAt)}
                              </span>
                              {!isResolved && (isAdmin || isAssignee) && (
                                <RowMenu
                                  label="Thao tác sự cố"
                                  items={[
                                    {
                                      label: 'Đánh dấu đã xử lý xong',
                                      icon: <Check className="w-4 h-4" />,
                                      onClick: () => handleResolveIncident(inc.taskId, inc.id),
                                    },
                                  ]}
                                />
                              )}
                            </div>
                          </div>

                          <h4 className="font-bold text-ink dark:text-slate-100 text-xs">
                            {inc.title}
                          </h4>
                          <p className="text-ink-soft dark:text-slate-300 text-[11px] mt-1 leading-relaxed">
                            {inc.description}
                          </p>

                          {inc.solution && (
                            <div className="mt-2.5 p-2 rounded-xl bg-pine-100/60 dark:bg-pine-600/10 border border-pine-500/25 text-[11px] text-pine-700 dark:text-pine-500">
                              <strong className="block font-semibold">Phương án xử lý:</strong>
                              {inc.solution}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </SectionCard>
          </div>
        )}

        {/* ========================================================= */}
        {/* TRỤ CỘT 2: HỢP ĐỒNG & DÒNG TIỀN KINH PHÍ                   */}
        {/* ========================================================= */}
        {activeTab === 'financial' && (
          <div className="space-y-6">
            {/* 4 Golden Financial Metrics */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                label="Tổng kinh phí gói thầu"
                value={formatCurrencyVN(totalBudget)}
                sub="Dự toán phê duyệt theo hợp đồng"
                icon={<DollarSign className="w-4.5 h-4.5" />}
                tone="navy"
              />
              <StatCard
                label="Đã giải ngân / Đã nộp"
                value={formatCurrencyVN(paidAmount)}
                sub={`Đạt ${paidPercent}% (${paidMilestones.length}/${milestones.length} đợt)`}
                icon={<CheckCircle2 className="w-4.5 h-4.5" />}
                tone="pine"
              />
              <StatCard
                label="Còn lại cần nộp"
                value={formatCurrencyVN(remainingAmount)}
                sub={`${100 - paidPercent}% ngân sách còn lại`}
                icon={<CreditCard className="w-4.5 h-4.5" />}
                tone="gold"
              />
              <StatCard
                label="Đợt nộp kế tiếp"
                value={
                  <span className="text-lg leading-snug block truncate">
                    {nextMilestone ? nextMilestone.title : 'Đã thanh toán 100%'}
                  </span>
                }
                sub={nextMilestone ? `Hạn: ${formatDateVN(nextMilestone.dueDate)}` : 'Hoàn tất giải ngân'}
                icon={<Clock className="w-4.5 h-4.5" />}
                tone="slate"
              />
            </div>

            {/* Official Contracts & Contractor Card */}
            <ProjectContractsCard
              contracts={project.contracts}
              technicalNotes={project.technicalNotes}
            />

            {/* Milestones Stepper Visual Track */}
            {milestones.length > 0 && (
              <SectionCard
                title={`Phân kỳ các đợt nộp tiền (${milestones.length} đợt)`}
                subtitle="Gắn liền với nghiệm thu kỹ thuật và cam kết bảo hành 5%"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {milestones.map((m, idx) => {
                    const isPaid = m.status === 'paid';
                    const isOverdue = m.status === 'overdue';

                    return (
                      <div
                        key={m.id}
                        className={`p-4 rounded-2xl border transition-all ${
                          isPaid
                            ? 'bg-pine-100/50 dark:bg-pine-600/10 border-pine-500/40 dark:border-pine-600/40'
                            : isOverdue
                            ? 'bg-rose-50/60 dark:bg-rose-500/5 border-rose-300 dark:border-rose-500/30'
                            : 'bg-parchment dark:bg-night-line/40 border-line dark:border-night-line'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-white dark:bg-night-card text-ink dark:text-slate-300 border border-line dark:border-night-line">
                            Đợt {idx + 1} ({m.percentage}%)
                          </span>
                          {isPaid ? (
                            <StatusBadge tone="pine">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Đã nộp
                            </StatusBadge>
                          ) : isOverdue ? (
                            <StatusBadge tone="rose">
                              <AlertTriangle className="w-3.5 h-3.5" />
                              Quá hạn
                            </StatusBadge>
                          ) : (
                            <StatusBadge tone="gold">
                              <Clock className="w-3.5 h-3.5" />
                              Chưa nộp
                            </StatusBadge>
                          )}
                        </div>

                        <div className="font-mono font-black text-ink dark:text-white text-sm">
                          {formatCurrencyVN(m.amount)}
                        </div>

                        <h4 className="font-bold text-xs text-ink dark:text-slate-200 mt-1 line-clamp-1">
                          {m.title}
                        </h4>

                        <div className="text-[10px] text-ink-soft dark:text-slate-400 mt-2 font-mono flex items-center justify-between">
                          <span>Hạn: {formatDateVN(m.dueDate)}</span>
                          {m.paidDate && (
                            <span className="text-pine-600 font-semibold">
                              Nộp: {formatDateVN(m.paidDate)}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </SectionCard>
            )}

            {/* Milestones Detailed Table with Admin Confirmation Action */}
            <SectionCard
              title="Bảng kiểm soát thanh toán & Chứng từ giải ngân"
              subtitle="Chủ trì dự án (Thầy Trần Quốc Vương) đối soát hồ sơ và xác nhận nộp tiền"
              pad={false}
            >
              <div className="overflow-x-auto">
                <table className="table-base">
                  <thead>
                    <tr>
                      <th>Đợt nộp & Tên mốc</th>
                      <th>Tỷ lệ</th>
                      <th>Số tiền (VNĐ)</th>
                      <th>Điều kiện nghiệm thu</th>
                      <th>Hạn nộp</th>
                      <th>Ngày nộp</th>
                      <th>Trạng thái</th>
                      <th className="text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {milestones.map((m) => {
                      const isPaid = m.status === 'paid';
                      const isOverdue = m.status === 'overdue';

                      return (
                        <tr key={m.id}>
                          <td className="font-bold text-ink dark:text-slate-100">
                            <div className="flex items-center gap-2">
                              <Receipt className="w-4 h-4 text-gold-600 shrink-0" />
                              <div>
                                <div>{m.title}</div>
                                {(m.receiptUrl || m.proofFile) && (
                                  <span className="text-[10px] text-sky-600 dark:text-sky-400 font-normal hover:underline">
                                    Biên lai: {m.receiptUrl || m.proofFile}
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>

                          <td className="font-mono font-bold text-ink-soft dark:text-slate-300">
                            {m.percentage}%
                          </td>

                          <td className="font-mono font-bold text-ink dark:text-slate-100 whitespace-nowrap">
                            {formatCurrencyVN(m.amount)}
                          </td>

                          <td className="text-ink-soft dark:text-slate-400 max-w-xs">
                            {m.description || m.note}
                          </td>

                          <td className="font-mono text-ink-soft dark:text-slate-400 whitespace-nowrap">
                            {formatDateVN(m.dueDate)}
                          </td>

                          <td className="font-mono text-pine-600 dark:text-pine-500 whitespace-nowrap">
                            {m.paidDate ? formatDateVN(m.paidDate) : '—'}
                          </td>

                          <td className="whitespace-nowrap">
                            {isPaid ? (
                              <StatusBadge tone="pine">
                                <Check className="w-3 h-3 stroke-[3]" />
                                Đã nộp
                              </StatusBadge>
                            ) : isOverdue ? (
                              <StatusBadge tone="rose">
                                <AlertTriangle className="w-3 h-3" />
                                Quá hạn
                              </StatusBadge>
                            ) : (
                              <StatusBadge tone="gold">
                                <Clock className="w-3 h-3" />
                                Chưa nộp
                              </StatusBadge>
                            )}
                          </td>

                          <td className="text-right whitespace-nowrap">
                            {isAdmin && !isPaid ? (
                              <RowMenu
                                label="Thao tác đợt nộp"
                                items={[
                                  {
                                    label: 'Xác nhận đã nộp',
                                    icon: <Check className="w-4 h-4" />,
                                    onClick: () => handleConfirmMilestonePayment(m.id, m.title),
                                  },
                                ]}
                              />
                            ) : isPaid ? (
                              <span className="text-[11px] text-ink-soft dark:text-slate-400 italic">
                                Đã đối soát đạt
                              </span>
                            ) : (
                              <span className="text-[11px] text-ink-soft dark:text-slate-400 italic">
                                Chờ Admin duyệt
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </SectionCard>
          </div>
        )}

        {/* TAB: TRAO ĐỔI */}
        {activeTab === 'chat' && (
          <div className="space-y-6">
            <SectionCard title="Kênh Trao đổi Nội bộ Gói thầu">
              <ProjectChat projectId={project.id} />
            </SectionCard>
          </div>
        )}

        {/* TAB: PHÂN QUYỀN — chỉ admin */}
        {activeTab === 'access' && isAdmin && (
          <div className="space-y-6">
            <ProjectMembers project={project} isReadOnly={false} />

            {/* Bảng phân quyền lãnh đạo theo dự án */}
            <SectionCard
              title="Bảng phân quyền lãnh đạo — Dự án này"
              subtitle="Lãnh đạo chỉ xem được dự án được cấp quyền. Bật công tắc để cấp / thu hồi quyền xem dự án này cho từng lãnh đạo."
              pad={false}
            >
              <div className="overflow-x-auto">
                <table className="table-base">
                  <thead>
                    <tr>
                      <th>Lãnh đạo</th>
                      <th>Quyền xem dự án này</th>
                      <th className="text-right">Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allLeaders.map((leader) => {
                      const canView = (project.leaderIds || []).includes(leader.id);
                      return (
                        <tr key={leader.id}>
                          <td>
                            <div className="flex items-center gap-3 min-w-0">
                              <Avatar text={leader.avatar} size="sm" tone="pine" />
                              <div className="min-w-0">
                                <div className="font-bold text-[13px] text-ink dark:text-slate-200 truncate">{leader.name}</div>
                                <div className="text-[11px] text-ink-soft dark:text-slate-400 truncate">{leader.title}</div>
                              </div>
                            </div>
                          </td>
                          <td>
                            <Switch
                              checked={canView}
                              onChange={(v) => toggleLeaderAccess(project.id, leader.id, v)}
                              label={`Được xem dự án này: ${leader.name}`}
                            />
                          </td>
                          <td className="text-right">
                            <StatusBadge tone={canView ? 'pine' : 'slate'} dot>
                              {canView ? 'Được xem dự án này' : 'Không được xem'}
                            </StatusBadge>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {allLeaders.length === 0 && (
                <p className="text-xs text-ink-soft dark:text-slate-400 px-5 pb-5">
                  Chưa có tài khoản lãnh đạo nào trong hệ thống.
                </p>
              )}
            </SectionCard>
          </div>
        )}

        {/* ========================================================= */}
        {/* MODALS - PHỤC VỤ LUỒNG DUYỆT & BÁO CÁO KỸ THUẬT           */}
        {/* ========================================================= */}
        {inspectTask && (
          <TaskDetailModal
            task={inspectTask}
            onClose={() => setInspectTask(null)}
            onOpenApproval={(t) => setApprovalTask(t)}
            onOpenUpdate={(t) => setUpdateTask(t)}
          />
        )}

        {approvalTask && (
          <TaskApprovalModal
            task={approvalTask}
            onClose={() => setApprovalTask(null)}
          />
        )}

        {updateTask && (
          <TaskUpdateModal
            task={updateTask}
            onClose={() => setUpdateTask(null)}
          />
        )}
      </div>
    </AppShell>
  );
}
