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
  Image as ImageIcon,
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
  MessageSquare,
} from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
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

// 3 Core PRM Executive Streams
type ProjectTab = 'tasks' | 'financial' | 'media';

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

  const initialTabParam = searchParams.get('tab');
  const initialTaskId = searchParams.get('taskId');

  // Normalize tab param to 3 Clean PRM tabs
  const getResolvedTab = (tab: string | null): ProjectTab => {
    if (!tab) return 'tasks';
    if (tab === 'financial') return 'financial';
    if (tab === 'gallery' || tab === 'chat' || tab === 'members' || tab === 'media' || tab === 'activity') {
      return 'media';
    }
    return 'tasks';
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

  // Unauthorized view
  if (!project || !hasAccess) {
    return (
      <AppShell>
        <div className="py-20 flex flex-col items-center justify-center text-center px-4 max-w-lg mx-auto">
          <div className="w-16 h-16 rounded-3xl bg-rose-500/10 text-rose-500 border border-rose-500/30 flex items-center justify-center mb-4">
            <Lock className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            Bạn không có quyền xem gói thầu này
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
            Tài khoản hiện tại ({currentUser.name} - {currentUser.title}) chưa được cấp quyền truy cập hồ sơ gói thầu này.
          </p>
          <div className="mt-6 flex items-center gap-3">
            <Link
              href="/projects"
              className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Về danh sách gói thầu
            </Link>
          </div>
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
        {/* EXECUTIVE PRM HEADER - TỔNG QUAN TINH GỌN, SẠCH SẼ        */}
        {/* ========================================================= */}
        <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <Link
                href="/projects"
                title="Quay lại danh sách gói thầu"
                className="mt-1 p-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
              </Link>

              <div>
                {/* Meta Badges */}
                <div className="flex flex-wrap items-center gap-2 mb-1.5">
                  <span className="font-mono text-xs font-bold px-2.5 py-0.5 rounded-lg bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30">
                    {project.code}
                  </span>
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-lg bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/20">
                    {project.campus === 'tranphu' ? '176 Trần Phú' : 'Cơ sở 2 - An Tây'}
                  </span>
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-lg bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                    Bước {currentStepNum}: {currentStepObj.shortName}
                  </span>
                  {catConfig && (
                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded border ${catConfig.badge}`}>
                      {catConfig.label}
                    </span>
                  )}
                </div>

                <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight leading-snug">
                  {project.name}
                </h1>

                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 dark:text-slate-400 mt-2 font-medium">
                  <span className="flex items-center gap-1.5">
                    <Briefcase className="w-3.5 h-3.5 text-amber-500" />
                    Đơn vị thi công: <strong className="text-slate-800 dark:text-slate-200">{project.contractor || project.organization}</strong>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-amber-500" />
                    {project.location}
                  </span>
                  <span className="flex items-center gap-1.5 font-mono">
                    <Calendar className="w-3.5 h-3.5 text-amber-500" />
                    {formatDateVN(project.startDate)} → {formatDateVN(project.endDate)}
                  </span>
                </div>
              </div>
            </div>

            {/* Role-Based Primary Action Button */}
            <div className="flex items-center gap-2.5 shrink-0 self-start lg:self-center">
              {/* Thầy Kiệt (Assignee): Quick Report button */}
              {isAssignee && inProgressTask && (
                <button
                  onClick={() => setUpdateTask(inProgressTask)}
                  className="px-4 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 transition-all flex items-center gap-2 cursor-pointer"
                >
                  <Camera className="w-4 h-4 stroke-[2.5]" />
                  <span>+ Báo cáo hiện trường</span>
                </button>
              )}

              {/* Thầy Vương (Admin): New Task */}
              {isAdmin && (
                <Link
                  href={`/tasks/new?projectId=${project.id}`}
                  className="px-4 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 transition-all flex items-center gap-2"
                >
                  <PlusCircle className="w-4 h-4 stroke-[2.5]" />
                  <span>+ Giao mục tiêu mới</span>
                </Link>
              )}

              {/* Lãnh đạo (Leader): Fast Directive Button */}
              {isLeader && (
                <button
                  onClick={() => setActiveTab('media')}
                  className="px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/20 transition-all flex items-center gap-2 cursor-pointer"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Gửi chỉ đạo Lãnh đạo</span>
                </button>
              )}
            </div>
          </div>

          {/* Golden Metrics Summary Strip (Dành cho Lãnh đạo nhìn nhanh con số) */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60">
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">Tiến độ tổng thể</span>
              <div className="flex items-center gap-2 mt-0.5">
                <span className={`font-mono text-base font-black ${progress === 100 ? 'text-emerald-600' : 'text-amber-500'}`}>
                  {progress}%
                </span>
                <span className="text-[11px] text-slate-500 font-normal">
                  ({projectTasks.filter((t) => t.status === 'approved').length}/{projectTasks.length} nhiệm vụ)
                </span>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60">
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">Kinh phí dự toán</span>
              <div className="font-mono text-base font-black text-slate-900 dark:text-white mt-0.5">
                {formatCurrencyVN(totalBudget)}
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60">
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 uppercase font-semibold block">Đã thanh toán</span>
              <div className="font-mono text-base font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
                {formatCurrencyVN(paidAmount)} ({paidPercent}%)
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60">
              <span className="text-[10px] text-amber-600 dark:text-amber-400 uppercase font-semibold block">Còn lại cần nộp</span>
              <div className="font-mono text-base font-black text-amber-600 dark:text-amber-400 mt-0.5">
                {formatCurrencyVN(remainingAmount)}
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* 3 CLEAN PRM TABS NAVIGATION                               */}
        {/* ========================================================= */}
        <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800">
          <button
            onClick={() => setActiveTab('tasks')}
            className={`px-5 py-3 rounded-t-2xl font-bold text-xs sm:text-sm transition-all flex items-center gap-2.5 border-b-2 ${
              activeTab === 'tasks'
                ? 'border-amber-500 text-amber-600 dark:text-amber-400 bg-amber-500/10'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <LayoutGrid className="w-4 h-4" />
            <span>1. Tiến độ & Công việc</span>
            <span className="text-[11px] px-2 py-0.5 rounded-full font-mono font-bold bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
              {projectTasks.length} việc
            </span>
          </button>

          <button
            onClick={() => setActiveTab('financial')}
            className={`px-5 py-3 rounded-t-2xl font-bold text-xs sm:text-sm transition-all flex items-center gap-2.5 border-b-2 ${
              activeTab === 'financial'
                ? 'border-amber-500 text-amber-600 dark:text-amber-400 bg-amber-500/10'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <DollarSign className="w-4 h-4" />
            <span>2. Hợp đồng & Dòng tiền</span>
            <span className="text-[11px] px-2 py-0.5 rounded-full font-mono font-bold bg-emerald-500/20 text-emerald-700 dark:text-emerald-400">
              {paidPercent}% nộp
            </span>
          </button>

          <button
            onClick={() => setActiveTab('media')}
            className={`px-5 py-3 rounded-t-2xl font-bold text-xs sm:text-sm transition-all flex items-center gap-2.5 border-b-2 ${
              activeTab === 'media'
                ? 'border-amber-500 text-amber-600 dark:text-amber-400 bg-amber-500/10'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <ImageIcon className="w-4 h-4" />
            <span>3. Hiện trường & Chỉ đạo</span>
            {project.directive && (
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            )}
          </button>
        </div>

        {/* ========================================================= */}
        {/* TRỤ CỘT 1: TIẾN ĐỘ & NHIỆM VỤ THỰC ĐỊA                     */}
        {/* ========================================================= */}
        {activeTab === 'tasks' && (
          <div className="space-y-6">
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

            {/* Tasks Management & View Modes */}
            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white">
                    Hạng mục Nhiệm vụ & Báo cáo kỹ thuật ({projectTasks.length})
                  </h3>
                  <p className="text-xs text-slate-400">
                    Phê duyệt bởi Thầy Trần Quốc Vương • Thực hiện bởi Đội kỹ thuật hiện trường
                  </p>
                </div>

                {/* View Switcher: List vs Kanban vs Gantt */}
                <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs">
                  <button
                    onClick={() => setTaskViewMode('list')}
                    className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-colors ${
                      taskViewMode === 'list'
                        ? 'bg-white dark:bg-slate-700 text-amber-500 shadow-xs font-bold'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <List className="w-3.5 h-3.5" />
                    Danh sách
                  </button>

                  <button
                    onClick={() => setTaskViewMode('kanban')}
                    className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-colors ${
                      taskViewMode === 'kanban'
                        ? 'bg-white dark:bg-slate-700 text-amber-500 shadow-xs font-bold'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <LayoutGrid className="w-3.5 h-3.5" />
                    Bảng Kanban
                  </button>

                  <button
                    onClick={() => setTaskViewMode('timeline')}
                    className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-colors ${
                      taskViewMode === 'timeline'
                        ? 'bg-white dark:bg-slate-700 text-amber-500 shadow-xs font-bold'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <CalendarRange className="w-3.5 h-3.5" />
                    Gantt
                  </button>
                </div>
              </div>

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
            </div>

            {/* Incidents & Field Obstacles Integrated Section */}
            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center font-bold">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                      <span>Nhật trình Sự cố & Trở ngại thi công ({projectIncidents.length})</span>
                      {unresolvedIncidents.length > 0 && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-600 dark:text-rose-400 font-bold font-mono">
                          {unresolvedIncidents.length} cần xử lý
                        </span>
                      )}
                    </h3>
                    <p className="text-xs text-slate-400">
                      Thời tiết mưa bão, chậm vật tư, vướng mặt bằng và biện pháp khắc phục
                    </p>
                  </div>
                </div>

                {/* Filter */}
                <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs">
                  {(
                    [
                      { id: 'all', label: 'Tất cả' },
                      { id: 'open', label: 'Mới' },
                      { id: 'resolving', label: 'Đang xử lý' },
                      { id: 'resolved', label: 'Đã giải quyết' },
                    ] as const
                  ).map((f) => (
                    <button
                      key={f.id}
                      onClick={() => setIncidentFilter(f.id)}
                      className={`px-2.5 py-1 rounded-lg font-semibold transition-colors ${
                        incidentFilter === f.id
                          ? 'bg-white dark:bg-slate-700 text-amber-500 shadow-xs font-bold'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              {filteredIncidents.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                  Hiện trường không có trở ngại nào trong danh mục này.
                </div>
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
                            ? 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700'
                            : inc.severity === 'critical' || inc.severity === 'high'
                            ? 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-300 dark:border-rose-900/60'
                            : 'bg-amber-50/40 dark:bg-amber-950/20 border-amber-300/60 dark:border-amber-900/40'
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
                            <span className="text-[10px] text-slate-400 font-mono">
                              {formatDateVN(inc.reportedAt)}
                            </span>
                          </div>

                          <h4 className="font-bold text-slate-900 dark:text-slate-100 text-xs">
                            {inc.title}
                          </h4>
                          <p className="text-slate-600 dark:text-slate-300 text-[11px] mt-1 leading-relaxed">
                            {inc.description}
                          </p>

                          {inc.solution && (
                            <div className="mt-2.5 p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-[11px] text-emerald-800 dark:text-emerald-300">
                              <strong className="block font-semibold">Phương án xử lý:</strong>
                              {inc.solution}
                            </div>
                          )}
                        </div>

                        {!isResolved && (isAdmin || isAssignee) && (
                          <div className="mt-3 pt-2.5 border-t border-slate-200 dark:border-slate-700/60 flex justify-end">
                            <button
                              onClick={() => handleResolveIncident(inc.taskId, inc.id)}
                              className="px-3 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] flex items-center gap-1 shadow-xs"
                            >
                              <Check className="w-3 h-3 stroke-[3]" />
                              Đánh dấu đã xử lý xong
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TRỤ CỘT 2: HỢP ĐỒNG & DÒNG TIỀN KINH PHÍ                   */}
        {/* ========================================================= */}
        {activeTab === 'financial' && (
          <div className="space-y-6">
            {/* 4 Golden Financial Metrics */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
                <div className="flex items-center justify-between text-slate-400 mb-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider">Tổng kinh phí gói thầu</span>
                  <DollarSign className="w-4 h-4 text-amber-500" />
                </div>
                <div className="font-mono text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                  {formatCurrencyVN(totalBudget)}
                </div>
                <p className="text-[11px] text-slate-400 mt-1">Dự toán phê duyệt theo hợp đồng</p>
              </div>

              <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
                <div className="flex items-center justify-between text-emerald-500 mb-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider">Đã giải ngân / Đã nộp</span>
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                </div>
                <div className="font-mono text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400">
                  {formatCurrencyVN(paidAmount)}
                </div>
                <div className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1 font-semibold">
                  Đạt {paidPercent}% ({paidMilestones.length}/{milestones.length} đợt)
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
                <div className="flex items-center justify-between text-amber-500 mb-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider">Còn lại cần nộp</span>
                  <CreditCard className="w-4 h-4 text-amber-500" />
                </div>
                <div className="font-mono text-xl sm:text-2xl font-black text-amber-600 dark:text-amber-400">
                  {formatCurrencyVN(remainingAmount)}
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  {100 - paidPercent}% ngân sách còn lại
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
                <div className="flex items-center justify-between text-indigo-500 mb-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider">Đợt nộp kế tiếp</span>
                  <Clock className="w-4 h-4 text-indigo-500" />
                </div>
                <div className="font-bold text-sm text-slate-900 dark:text-white truncate">
                  {nextMilestone ? nextMilestone.title : 'Đã thanh toán 100%'}
                </div>
                <p className="text-[11px] text-slate-400 mt-1 font-mono">
                  {nextMilestone ? `Hạn: ${formatDateVN(nextMilestone.dueDate)}` : 'Hoàn tất giải ngân'}
                </p>
              </div>
            </div>

            {/* Official Contracts & Contractor Card */}
            <ProjectContractsCard
              contracts={project.contracts}
              technicalNotes={project.technicalNotes}
            />

            {/* Milestones Stepper Visual Track */}
            {milestones.length > 0 && (
              <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                      Phân kỳ các đợt nộp tiền ({milestones.length} đợt)
                    </h3>
                    <p className="text-xs text-slate-400">
                      Gắn liền với nghiệm thu kỹ thuật và cam kết bảo hành 5%
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
                  {milestones.map((m, idx) => {
                    const isPaid = m.status === 'paid';
                    const isOverdue = m.status === 'overdue';

                    return (
                      <div
                        key={m.id}
                        className={`p-4 rounded-2xl border transition-all ${
                          isPaid
                            ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800'
                            : isOverdue
                            ? 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-300 dark:border-rose-800'
                            : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                            Đợt {idx + 1} ({m.percentage}%)
                          </span>
                          {isPaid ? (
                            <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                              Đã nộp
                            </span>
                          ) : isOverdue ? (
                            <span className="flex items-center gap-1 text-[11px] font-bold text-rose-600">
                              <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
                              Quá hạn
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-[11px] font-bold text-amber-500">
                              <Clock className="w-3.5 h-3.5 text-amber-500" />
                              Chưa nộp
                            </span>
                          )}
                        </div>

                        <div className="font-mono font-black text-slate-900 dark:text-white text-sm">
                          {formatCurrencyVN(m.amount)}
                        </div>

                        <h4 className="font-bold text-xs text-slate-800 dark:text-slate-200 mt-1 line-clamp-1">
                          {m.title}
                        </h4>

                        <div className="text-[10px] text-slate-400 mt-2 font-mono flex items-center justify-between">
                          <span>Hạn: {formatDateVN(m.dueDate)}</span>
                          {m.paidDate && (
                            <span className="text-emerald-600 font-semibold">
                              Nộp: {formatDateVN(m.paidDate)}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Milestones Detailed Table with Admin Confirmation Action */}
            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                    Bảng kiểm soát thanh toán & Chứng từ giải ngân
                  </h3>
                  <p className="text-xs text-slate-400">
                    Chủ trì dự án (Thầy Trần Quốc Vương) đối soát hồ sơ và xác nhận nộp tiền
                  </p>
                </div>
              </div>

              <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 uppercase tracking-wider font-semibold">
                      <tr>
                        <th className="py-3 px-4">Đợt nộp & Tên mốc</th>
                        <th className="py-3 px-4">Tỷ lệ</th>
                        <th className="py-3 px-4">Số tiền (VNĐ)</th>
                        <th className="py-3 px-4">Điều kiện nghiệm thu</th>
                        <th className="py-3 px-4">Hạn nộp</th>
                        <th className="py-3 px-4">Ngày nộp</th>
                        <th className="py-3 px-4">Trạng thái</th>
                        <th className="py-3 px-4 text-right">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {milestones.map((m) => {
                        const isPaid = m.status === 'paid';
                        const isOverdue = m.status === 'overdue';

                        return (
                          <tr
                            key={m.id}
                            className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                          >
                            <td className="py-3 px-4 font-bold text-slate-900 dark:text-slate-100">
                              <div className="flex items-center gap-2">
                                <Receipt className="w-4 h-4 text-amber-500 shrink-0" />
                                <div>
                                  <div>{m.title}</div>
                                  {(m.receiptUrl || m.proofFile) && (
                                    <span className="text-[10px] text-indigo-500 font-normal hover:underline">
                                      Biên lai: {m.receiptUrl || m.proofFile}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </td>

                            <td className="py-3 px-4 font-mono font-bold text-slate-600 dark:text-slate-300">
                              {m.percentage}%
                            </td>

                            <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-slate-100 whitespace-nowrap">
                              {formatCurrencyVN(m.amount)}
                            </td>

                            <td className="py-3 px-4 text-slate-500 dark:text-slate-400 max-w-xs">
                              {m.description || m.note}
                            </td>

                            <td className="py-3 px-4 font-mono text-slate-600 dark:text-slate-400 whitespace-nowrap">
                              {formatDateVN(m.dueDate)}
                            </td>

                            <td className="py-3 px-4 font-mono text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                              {m.paidDate ? formatDateVN(m.paidDate) : '—'}
                            </td>

                            <td className="py-3 px-4 whitespace-nowrap">
                              {isPaid ? (
                                <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center gap-1 w-fit">
                                  <Check className="w-3 h-3 stroke-[3]" />
                                  Đã nộp
                                </span>
                              ) : isOverdue ? (
                                <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/20 flex items-center gap-1 w-fit">
                                  <AlertTriangle className="w-3 h-3" />
                                  Quá hạn
                                </span>
                              ) : (
                                <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20 flex items-center gap-1 w-fit">
                                  <Clock className="w-3 h-3" />
                                  Chưa nộp
                                </span>
                              )}
                            </td>

                            <td className="py-3 px-4 text-right whitespace-nowrap">
                              {isAdmin && !isPaid ? (
                                <button
                                  onClick={() => handleConfirmMilestonePayment(m.id, m.title)}
                                  className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-xs transition-all inline-flex items-center gap-1.5 cursor-pointer"
                                >
                                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                                  Xác nhận đã nộp
                                </button>
                              ) : isPaid ? (
                                <span className="text-[11px] text-slate-400 italic">
                                  Đã đối soát đạt
                                </span>
                              ) : (
                                <span className="text-[11px] text-slate-400 italic">
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
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TRỤ CỘT 3: HIỆN TRƯỜNG & CHỈ ĐẠO LÃNH ĐẠO                 */}
        {/* ========================================================= */}
        {activeTab === 'media' && (
          <div className="space-y-6">
            {/* Leadership Directive & Evaluation Panel */}
            <div className="p-5 sm:p-6 rounded-3xl bg-linear-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/30 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center font-bold">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-slate-100">
                      Ý kiến Định hướng & Chỉ đạo của Ban Giám hiệu
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      TS. Hoàng Nhật Dũng & ThS. Nguyễn Du Tuấn trực tiếp theo dõi và chỉ đạo
                    </p>
                  </div>
                </div>

                {/* Leader Evaluation Badge if evaluated */}
                {project.evaluation && (
                  <div className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs">
                    <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                    <div className="text-xs">
                      <span className="font-bold text-slate-900 dark:text-white">
                        Xếp loại:{' '}
                        {project.evaluation.rating === 'excellent'
                          ? 'Xuất sắc'
                          : project.evaluation.rating === 'good'
                          ? 'Đạt yêu cầu'
                          : 'Cần tối ưu'}
                      </span>
                      <span className="text-[10px] text-slate-400 block">
                        Đánh giá bởi {project.evaluation.evaluatedBy}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Directive Display */}
              {project.directive && (
                <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs shadow-xs">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-bold text-amber-600 dark:text-amber-400">
                      {project.directive.authorName} ({project.directive.authorTitle})
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {formatDateTimeVN(project.directive.createdAt)}
                    </span>
                  </div>
                  <p className="text-slate-700 dark:text-slate-300 italic leading-relaxed text-sm">
                    &ldquo;{project.directive.content}&rdquo;
                  </p>
                </div>
              )}

              {/* Evaluation comment if any */}
              {project.evaluation?.comment && (
                <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-900 dark:text-emerald-200">
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
                      className="flex-1 px-4 py-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-amber-500 shadow-xs"
                    />
                    <button
                      type="submit"
                      className="px-4 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-xs flex items-center gap-1.5 shrink-0 cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" />
                      Gửi chỉ đạo
                    </button>
                  </form>

                  <div>
                    {!showEvalForm ? (
                      <button
                        type="button"
                        onClick={() => setShowEvalForm(true)}
                        className="text-xs font-semibold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1"
                      >
                        <Star className="w-3.5 h-3.5" />
                        {project.evaluation ? 'Đánh giá lại gói thầu' : 'Chấm điểm / Đánh giá xếp loại gói thầu này'}
                      </button>
                    ) : (
                      <form
                        onSubmit={handleSubmitEvaluation}
                        className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 space-y-3 text-xs shadow-xs"
                      >
                        <div className="font-bold text-slate-800 dark:text-slate-200">
                          Đánh giá chất lượng thực hiện gói thầu:
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          {(['excellent', 'good', 'needs_improvement'] as const).map((r) => (
                            <button
                              key={r}
                              type="button"
                              onClick={() => setEvalRating(r)}
                              className={`py-2 px-3 rounded-xl font-bold transition-all border ${
                                evalRating === r
                                  ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-xs'
                                  : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                              }`}
                            >
                              {r === 'excellent' ? 'Xuất sắc' : r === 'good' ? 'Đạt yêu cầu' : 'Cần tối ưu'}
                            </button>
                          ))}
                        </div>
                        <textarea
                          rows={2}
                          value={evalComment}
                          onChange={(e) => setEvalComment(e.target.value)}
                          placeholder="Nhập nhận xét hoặc lưu ý chuyên môn của Ban Giám hiệu..."
                          className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-xs"
                        />
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setShowEvalForm(false)}
                            className="px-3 py-1.5 text-slate-500 hover:text-slate-700 text-xs cursor-pointer"
                          >
                            Hủy
                          </button>
                          <button
                            type="submit"
                            className="px-4 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs cursor-pointer"
                          >
                            Lưu đánh giá
                          </button>
                        </div>
                      </form>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Field Proof Gallery (Videos 10 mins & Photos) */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white">
                    Minh chứng Hiện trường (Video 10 phút & Ảnh nghiệm thu)
                  </h3>
                  <p className="text-xs text-slate-400">
                    Bằng chứng thực địa phục vụ công tác giám sát của Lãnh đạo và thanh quyết toán
                  </p>
                </div>
              </div>

              <ProjectGallery projectId={project.id} tasks={projectTasks} />
            </div>

            {/* Project Chat & Team Communication */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-amber-500" />
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                      Kênh Trao đổi Nội bộ Gói thầu
                    </h3>
                  </div>
                  <ProjectChat projectId={project.id} />
                </div>
              </div>

              <div>
                <ProjectMembers project={project} isReadOnly={isLeader} />
              </div>
            </div>
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
