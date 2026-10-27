'use client';

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  FolderGit2,
  Calendar,
  MapPin,
  LayoutGrid,
  List,
  CalendarRange,
  Image as ImageIcon,
  MessageSquare,
  Users,
  History,
  PlusCircle,
  Eye,
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
  ChevronRight,
} from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { CircularProgress } from '@/components/ui/CircularProgress';
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
} from '@/lib/types';
import { formatDateVN, formatDateTimeVN, formatCurrencyVN } from '@/lib/utils';
import { toast } from 'sonner';

type ProjectTab =
  | 'overview'
  | 'tasks'
  | 'financial'
  | 'incidents'
  | 'gallery'
  | 'chat'
  | 'members'
  | 'activity';

export default function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const projectId = resolvedParams.id;
  const searchParams = useSearchParams();

  const currentUser = useConstructionStore((s) => s.currentUser);
  const canUserAccessProject = useConstructionStore((s) => s.canUserAccessProject);
  const getProjectById = useConstructionStore((s) => s.getProjectById);
  const calculateProjectProgress = useConstructionStore((s) => s.calculateProjectProgress);
  const getProjectTasks = useConstructionStore((s) => s.getProjectTasks);
  const auditLogs = useConstructionStore((s) => s.auditLogs);
  const addLeaderDirective = useConstructionStore((s) => s.addLeaderDirective);
  const evaluateProject = useConstructionStore((s) => s.evaluateProject);
  const markMilestonePaid = useConstructionStore((s) => s.markMilestonePaid);
  const updateIncidentStatus = useConstructionStore((s) => s.updateIncidentStatus);
  const getProjectIncidents = useConstructionStore((s) => s.getProjectIncidents);
  const updateProjectWorkflowStep = useConstructionStore((s) => s.updateProjectWorkflowStep);
  const toggleProjectChecklistTask = useConstructionStore((s) => s.toggleProjectChecklistTask);

  const initialTabParam = searchParams.get('tab');
  const initialTaskId = searchParams.get('taskId');

  const validTabs: ProjectTab[] = [
    'overview',
    'tasks',
    'financial',
    'incidents',
    'gallery',
    'chat',
    'members',
    'activity',
  ];

  const [activeTab, setActiveTab] = useState<ProjectTab>(
    initialTabParam && validTabs.includes(initialTabParam as ProjectTab)
      ? (initialTabParam as ProjectTab)
      : 'overview'
  );

  const [taskViewMode, setTaskViewMode] = useState<'kanban' | 'list' | 'timeline'>('kanban');
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

  // Check if initialTaskId exists and open it
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

  // Unauthorized screen (Test scenario 7)
  if (!project || !hasAccess) {
    return (
      <AppShell>
        <div className="py-20 flex flex-col items-center justify-center text-center px-4 max-w-lg mx-auto">
          <div className="w-16 h-16 rounded-3xl bg-rose-500/10 text-rose-500 border border-rose-500/30 flex items-center justify-center mb-4">
            <Lock className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            Bạn không có quyền xem dự án này
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
            Tài khoản hiện tại ({currentUser.name} - {currentUser.title}) chưa được phân quyền truy cập hồ sơ và mục tiêu của dự án này.
          </p>
          <div className="mt-6 flex items-center gap-3">
            <Link
              href="/projects"
              className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Về danh sách dự án của bạn
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
  const projectLogs = auditLogs.filter(
    (l) => l.target.includes(project.name) || l.details.includes(project.name)
  );
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

  const handleSubmitDirective = (e: React.FormEvent) => {
    e.preventDefault();
    if (!directiveInput.trim()) return;

    addLeaderDirective(project.id, directiveInput.trim());
    toast.success('Đã gửi ý kiến chỉ đạo tới Chủ trì dự án!');
    setDirectiveInput('');
  };

  const handleSubmitEvaluation = (e: React.FormEvent) => {
    e.preventDefault();
    const evaluation: LeaderEvaluation = {
      rating: evalRating,
      comment:
        evalComment.trim() ||
        (evalRating === 'excellent'
          ? 'Dự án bám sát tiến độ và đạt chuẩn chất lượng cao.'
          : 'Tiến độ cơ bản đạt yêu cầu, cần đẩy nhanh khâu hoàn thiện hồ sơ.'),
      evaluatedBy: currentUser.name,
      evaluatedAt: new Date().toISOString(),
    };

    evaluateProject(project.id, evaluation);
    toast.success('Đã lưu kết quả đánh giá của Lãnh đạo!');
    setShowEvalForm(false);
  };

  const handleConfirmMilestonePayment = (milestoneId: string, title: string) => {
    if (!isAdmin) {
      toast.error('Chỉ Chủ trì dự án (Thầy Trần Quốc Vương) có quyền xác nhận nộp kinh phí.');
      return;
    }
    markMilestonePaid(project.id, milestoneId);
    toast.success(`Đã xác nhận nộp tiền thành công cho: "${title}"`, {
      description: 'Hệ thống đã cập nhật số dư giải ngân và gửi thông báo tới Ban Lãnh đạo.',
    });
  };

  const handleResolveIncident = (taskId: string, incidentId: string) => {
    updateIncidentStatus(
      taskId,
      incidentId,
      'resolved',
      'Đã hoàn thành xử lý triệt để tại hiện trường theo chỉ đạo của Chủ trì dự án.'
    );
    toast.success('Đã cập nhật trạng thái phát sinh thành: Đã giải quyết');
  };

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header Breadcrumb & Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/projects"
              className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-amber-500 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-amber-500/15 text-amber-600 dark:text-amber-400">
                  {project.code}
                </span>
                {catConfig && (
                  <span
                    className={`text-[11px] font-semibold px-2 py-0.5 rounded border ${catConfig.badge}`}
                  >
                    {catConfig.label}
                  </span>
                )}
                {isLeader && (
                  <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-semibold border border-emerald-500/30 flex items-center gap-1">
                    <Eye className="w-3 h-3" />
                    Chế độ Lãnh đạo: Chỉ đạo & Đánh giá
                  </span>
                )}
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                {project.name}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!isLeader && isAdmin && (
              <Link
                href={`/tasks/new?projectId=${project.id}`}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 transition-all flex items-center gap-1.5"
              >
                <PlusCircle className="w-4 h-4" />
                Giao mục tiêu mới
              </Link>
            )}
          </div>
        </div>

        {/* 9-Step Standard Workflow Stepper */}
        <WorkflowStepper
          currentStep={project.workflowStep || 1}
          onStepChange={(step) => updateProjectWorkflowStep(project.id, step)}
          canEdit={isAdmin}
        />

        {/* Tab Navigation */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-slate-200 dark:border-slate-800 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2.5 rounded-t-xl transition-all flex items-center gap-2 border-b-2 whitespace-nowrap ${
              activeTab === 'overview'
                ? 'border-amber-500 text-amber-500 font-bold bg-amber-500/5'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <FolderGit2 className="w-4 h-4" />
            Tổng quan
          </button>

          <button
            onClick={() => setActiveTab('tasks')}
            className={`px-4 py-2.5 rounded-t-xl transition-all flex items-center gap-2 border-b-2 whitespace-nowrap ${
              activeTab === 'tasks'
                ? 'border-amber-500 text-amber-500 font-bold bg-amber-500/5'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <LayoutGrid className="w-4 h-4" />
            Mục tiêu & Nhiệm vụ ({projectTasks.length})
          </button>

          <button
            onClick={() => setActiveTab('financial')}
            className={`px-4 py-2.5 rounded-t-xl transition-all flex items-center gap-2 border-b-2 whitespace-nowrap ${
              activeTab === 'financial'
                ? 'border-amber-500 text-amber-500 font-bold bg-amber-500/5'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <DollarSign className="w-4 h-4" />
            <span>Kinh phí & Các đợt nộp</span>
            {milestones.length > 0 && (
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-mono font-bold">
                {paidMilestones.length}/{milestones.length} đợt ({paidPercent}%)
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('incidents')}
            className={`px-4 py-2.5 rounded-t-xl transition-all flex items-center gap-2 border-b-2 whitespace-nowrap ${
              activeTab === 'incidents'
                ? 'border-amber-500 text-amber-500 font-bold bg-amber-500/5'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <AlertTriangle className="w-4 h-4" />
            <span>Phát sinh & Trở ngại</span>
            {projectIncidents.length > 0 && (
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                  unresolvedIncidents.length > 0
                    ? 'bg-rose-500/20 text-rose-600 dark:text-rose-400 animate-pulse'
                    : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                }`}
              >
                {unresolvedIncidents.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('gallery')}
            className={`px-4 py-2.5 rounded-t-xl transition-all flex items-center gap-2 border-b-2 whitespace-nowrap ${
              activeTab === 'gallery'
                ? 'border-amber-500 text-amber-500 font-bold bg-amber-500/5'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <ImageIcon className="w-4 h-4" />
            Thư viện minh chứng
          </button>

          <button
            onClick={() => setActiveTab('chat')}
            className={`px-4 py-2.5 rounded-t-xl transition-all flex items-center gap-2 border-b-2 whitespace-nowrap ${
              activeTab === 'chat'
                ? 'border-amber-500 text-amber-500 font-bold bg-amber-500/5'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            Kênh trao đổi dự án
          </button>

          <button
            onClick={() => setActiveTab('members')}
            className={`px-4 py-2.5 rounded-t-xl transition-all flex items-center gap-2 border-b-2 whitespace-nowrap ${
              activeTab === 'members'
                ? 'border-amber-500 text-amber-500 font-bold bg-amber-500/5'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Users className="w-4 h-4" />
            Thành viên & Phân quyền
          </button>

          <button
            onClick={() => setActiveTab('activity')}
            className={`px-4 py-2.5 rounded-t-xl transition-all flex items-center gap-2 border-b-2 whitespace-nowrap ${
              activeTab === 'activity'
                ? 'border-amber-500 text-amber-500 font-bold bg-amber-500/5'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <History className="w-4 h-4" />
            Nhật ký tiến độ
          </button>
        </div>

        {/* Tab (a): TỔNG QUAN DỰ ÁN */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
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

            {/* Official Contracts & Contractor Card */}
            <ProjectContractsCard
              contracts={project.contracts}
              technicalNotes={project.technicalNotes}
            />
            {/* Leadership Directive & Evaluation Highlight */}
            {(project.directive || isLeader || project.evaluation) && (
              <div className="p-5 rounded-3xl bg-linear-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/30 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-bold">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                        Chỉ đạo & Đánh giá từ Lãnh đạo
                      </h3>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        Ý kiến định hướng của Ban Giám hiệu / Hội đồng giám sát
                      </p>
                    </div>
                  </div>

                  {/* Leader Evaluation Badge if evaluated */}
                  {project.evaluation && (
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
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
                          Bởi {project.evaluation.evaluatedBy}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Directive Display */}
                {project.directive && (
                  <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs">
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
                    <strong className="block font-semibold mb-0.5">Nhận xét chi tiết:</strong>
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
                        placeholder="Nhập ý kiến chỉ đạo mới cho Chủ trì dự án..."
                        className="flex-1 px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-amber-500"
                      />
                      <button
                        type="submit"
                        className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-sm flex items-center gap-1.5 shrink-0"
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
                          {project.evaluation ? 'Đánh giá lại dự án' : 'Chấm điểm / Đánh giá dự án này'}
                        </button>
                      ) : (
                        <form
                          onSubmit={handleSubmitEvaluation}
                          className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 space-y-3 text-xs"
                        >
                          <div className="font-bold text-slate-800 dark:text-slate-200">
                            Đánh giá chất lượng thực hiện dự án:
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
                            placeholder="Nhập nhận xét hoặc lưu ý chuyên môn của Lãnh đạo..."
                            className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-xs"
                          />
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => setShowEvalForm(false)}
                              className="px-3 py-1.5 text-slate-500 hover:text-slate-700 text-xs"
                            >
                              Hủy
                            </button>
                            <button
                              type="submit"
                              className="px-4 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs"
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
            )}

            {/* Top Grid: Circular gauge & high-level stats */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left col: Circular gauge & high-level stats */}
              <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col items-center justify-center text-center">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">
                  Tiến độ hoàn thành mục tiêu
                </span>
                <CircularProgress
                  value={progress}
                  size={160}
                  strokeWidth={14}
                  color={progress === 100 ? '#10B981' : '#F59E0B'}
                  label={progress === 100 ? 'HOÀN THÀNH' : 'TIẾN ĐỘ'}
                  sublabel={
                    progress === 100
                      ? 'Tất cả nhiệm vụ đã duyệt'
                      : 'Nhiệm vụ chưa duyệt tối đa 99%'
                  }
                />
                <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 w-full grid grid-cols-3 gap-2 text-center text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Tổng mục tiêu</span>
                    <strong className="font-mono text-sm">{projectTasks.length}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-emerald-500 block">Đã duyệt</span>
                    <strong className="font-mono text-sm text-emerald-600">
                      {projectTasks.filter((t) => t.status === 'approved').length}
                    </strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-indigo-500 block">Chờ duyệt</span>
                    <strong className="font-mono text-sm text-indigo-600">
                      {projectTasks.filter((t) => t.status === 'submitted').length}
                    </strong>
                  </div>
                </div>
              </div>

              {/* Right col: Technical specifications & Contractor */}
              <div className="lg:col-span-2 p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
                    Thông tin Kế hoạch & Mục tiêu
                  </h3>
                  {catConfig && (
                    <span
                      className={`text-xs font-semibold px-2.5 py-1 rounded-xl border ${catConfig.badge}`}
                    >
                      {catConfig.label}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  {project.description}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 text-xs">
                  <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold flex items-center gap-1">
                      <Briefcase className="w-3 h-3 text-amber-500" /> Đơn vị chủ trì / Phối hợp
                    </span>
                    <div className="font-semibold text-slate-800 dark:text-slate-200 mt-1">
                      {project.organization || project.contractor}
                    </div>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-amber-500" /> Nền tảng / Địa điểm triển khai
                    </span>
                    <div className="font-semibold text-slate-800 dark:text-slate-200 mt-1">
                      {project.location}
                    </div>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-amber-500" /> Thời gian thực hiện
                    </span>
                    <div className="font-semibold text-slate-800 dark:text-slate-200 mt-1">
                      {formatDateVN(project.startDate)} → {formatDateVN(project.endDate)}
                    </div>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold flex items-center gap-1">
                      <DollarSign className="w-3 h-3 text-amber-500" /> Kinh phí dự toán
                    </span>
                    <div className="font-mono font-bold text-slate-800 dark:text-slate-200 mt-1">
                      {project.budget}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Middle Grid: Financial Milestones & Active Incidents Highlight */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Financial Progress Widget */}
              <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-bold">
                        <CreditCard className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                          Kinh phí & Các đợt nộp tiền
                        </h3>
                        <p className="text-[11px] text-slate-400">
                          Tiến độ giải ngân theo từng đợt thực hiện
                        </p>
                      </div>
                    </div>
                    <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                      Đã nộp {paidPercent}%
                    </span>
                  </div>

                  {/* Numbers Bar */}
                  <div className="grid grid-cols-3 gap-2 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 text-xs mt-3">
                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase font-medium">Tổng kinh phí</span>
                      <strong className="font-mono font-bold text-slate-900 dark:text-white text-xs sm:text-sm">
                        {formatCurrencyVN(totalBudget)}
                      </strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-emerald-500 block uppercase font-medium">Đã thanh toán</span>
                      <strong className="font-mono font-bold text-emerald-600 dark:text-emerald-400 text-xs sm:text-sm">
                        {formatCurrencyVN(paidAmount)}
                      </strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-amber-500 block uppercase font-medium">Còn lại</span>
                      <strong className="font-mono font-bold text-amber-600 dark:text-amber-400 text-xs sm:text-sm">
                        {formatCurrencyVN(remainingAmount)}
                      </strong>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="mt-3">
                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                        style={{ width: `${paidPercent}%` }}
                      />
                    </div>
                  </div>

                  {/* Next milestone reminder */}
                  {nextMilestone ? (
                    <div className="mt-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-amber-500 shrink-0" />
                        <div>
                          <span className="font-bold text-slate-900 dark:text-slate-100 block">
                            Đợt kế tiếp: {nextMilestone.title} ({formatCurrencyVN(nextMilestone.amount)})
                          </span>
                          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                            Hạn nộp: {formatDateVN(nextMilestone.dueDate)}
                          </span>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-700 dark:text-amber-300">
                        {nextMilestone.status === 'overdue' ? 'Quá hạn' : 'Chưa nộp'}
                      </span>
                    </div>
                  ) : (
                    <div className="mt-4 p-3 rounded-xl bg-emerald-500/10 text-xs text-emerald-600 font-bold flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      Tất cả các đợt kinh phí đã được thanh toán 100%!
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                  <button
                    onClick={() => setActiveTab('financial')}
                    className="text-xs font-bold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1"
                  >
                    Xem chi tiết các đợt nộp & chứng từ
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Incidents & Field Obstacles Widget */}
              <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center font-bold">
                        <AlertTriangle className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                          Mục phát sinh & Trở ngại hiện trường
                        </h3>
                        <p className="text-[11px] text-slate-400">
                          Báo cáo sự cố thời tiết, vật tư, chậm tiến độ
                        </p>
                      </div>
                    </div>
                    <span
                      className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                        unresolvedIncidents.length > 0
                          ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400'
                          : 'bg-emerald-500/15 text-emerald-600'
                      }`}
                    >
                      {unresolvedIncidents.length > 0
                        ? `${unresolvedIncidents.length} trở ngại cần xử lý`
                        : 'Không có trở ngại'}
                    </span>
                  </div>

                  {projectIncidents.length === 0 ? (
                    <div className="py-8 text-center text-xs text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                      Hiện trường thi công suôn sẻ, chưa ghi nhận phát sinh nào.
                    </div>
                  ) : (
                    <div className="space-y-2.5 mt-3">
                      {projectIncidents.slice(0, 3).map((inc) => {
                        const sev = INCIDENT_SEVERITY_CONFIG[inc.severity];
                        const st = INCIDENT_STATUS_CONFIG[inc.status];
                        return (
                          <div
                            key={inc.id}
                            className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 text-xs flex items-start justify-between gap-3"
                          >
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                                <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded border ${sev.badgeClass}`}>
                                  {sev.label}
                                </span>
                                <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded border ${st.badgeClass}`}>
                                  {st.label}
                                </span>
                                <span className="text-[10px] text-slate-400 font-mono">
                                  {formatDateVN(inc.reportedAt)}
                                </span>
                              </div>
                              <h4 className="font-bold text-slate-900 dark:text-slate-100 truncate">
                                {inc.title}
                              </h4>
                              <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                                {inc.description}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                  <button
                    onClick={() => setActiveTab('incidents')}
                    className="text-xs font-bold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1"
                  >
                    Xem toàn bộ phát sinh & giải pháp xử lý
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab (b): MỤC TIÊU & NHIỆM VỤ (TASKS) with 3 view types */}
        {activeTab === 'tasks' && (
          <div className="space-y-4">
            {/* View Switcher Bar */}
            <div className="flex items-center justify-between p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Kiểu hiển thị nhiệm vụ:
              </span>

              <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs">
                <button
                  onClick={() => setTaskViewMode('kanban')}
                  className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-colors ${
                    taskViewMode === 'kanban'
                      ? 'bg-white dark:bg-slate-700 text-amber-500 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  Bảng Kanban
                </button>

                <button
                  onClick={() => setTaskViewMode('list')}
                  className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-colors ${
                    taskViewMode === 'list'
                      ? 'bg-white dark:bg-slate-700 text-amber-500 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <List className="w-3.5 h-3.5" />
                  Danh sách
                </button>

                <button
                  onClick={() => setTaskViewMode('timeline')}
                  className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-colors ${
                    taskViewMode === 'timeline'
                      ? 'bg-white dark:bg-slate-700 text-amber-500 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <CalendarRange className="w-3.5 h-3.5" />
                  Sơ đồ Gantt
                </button>
              </div>
            </div>

            {/* View container */}
            {taskViewMode === 'kanban' && (
              <TaskKanbanView
                tasks={projectTasks}
                isReadOnly={isLeader}
                onSelectTask={(t) => setInspectTask(t)}
                onOpenApproval={(t) => setApprovalTask(t)}
                onOpenUpdate={(t) => setUpdateTask(t)}
              />
            )}

            {taskViewMode === 'list' && (
              <TaskListView
                tasks={projectTasks}
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
        )}

        {/* Tab (c): KINH PHÍ & CÁC ĐỢT NỘP (FINANCIAL) */}
        {activeTab === 'financial' && (
          <div className="space-y-6">
            {/* KPI 4 Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
                <div className="flex items-center justify-between text-slate-400 mb-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider">Tổng kinh phí dự án</span>
                  <DollarSign className="w-4 h-4 text-amber-500" />
                </div>
                <div className="font-mono text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                  {formatCurrencyVN(totalBudget)}
                </div>
                <p className="text-[11px] text-slate-400 mt-1">Căn cứ dự toán đã phê duyệt</p>
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
                  Đạt {paidPercent}% tổng mức đầu tư ({paidMilestones.length}/{milestones.length} đợt)
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
                  <span className="text-[11px] font-bold uppercase tracking-wider">Đợt nộp tiếp theo</span>
                  <Clock className="w-4 h-4 text-indigo-500" />
                </div>
                <div className="font-bold text-sm text-slate-900 dark:text-white truncate">
                  {nextMilestone ? nextMilestone.title : 'Đã hoàn tất nộp'}
                </div>
                <p className="text-[11px] text-slate-400 mt-1 font-mono">
                  {nextMilestone ? `Hạn: ${formatDateVN(nextMilestone.dueDate)}` : '100% hoàn thành'}
                </p>
              </div>
            </div>

            {/* Visual Milestones Stepper Track */}
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                    Lộ trình các đợt nộp kinh phí ({milestones.length} đợt)
                  </h3>
                  <p className="text-xs text-slate-400">
                    Mỗi đợt gắn liền với mốc nghiệm thu kỹ thuật và thời hạn quy định trong hợp đồng
                  </p>
                </div>
                {isLeader && (
                  <span className="text-[11px] px-2.5 py-1 rounded-xl bg-emerald-500/10 text-emerald-600 font-semibold border border-emerald-500/20">
                    Lãnh đạo kiểm tra & giám sát tài chính
                  </span>
                )}
              </div>

              {/* Steps Progress */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
                {milestones.map((m, idx) => {
                  const isPaid = m.status === 'paid';
                  const isOverdue = m.status === 'overdue';
                  return (
                    <div
                      key={m.id}
                      className={`p-4 rounded-2xl border transition-all relative ${
                        isPaid
                          ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800'
                          : isOverdue
                          ? 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-300 dark:border-rose-800'
                          : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                          Đợt {idx + 1} ({m.percentage}%)
                        </span>
                        {isPaid ? (
                          <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                            Đã nộp
                          </span>
                        ) : isOverdue ? (
                          <span className="flex items-center gap-1 text-[11px] font-bold text-rose-600">
                            <AlertTriangle className="w-4 h-4 text-rose-500" />
                            Quá hạn
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-[11px] font-bold text-amber-500">
                            <Clock className="w-4 h-4 text-amber-500" />
                            Chưa nộp
                          </span>
                        )}
                      </div>

                      <div className="font-mono font-black text-slate-900 dark:text-white text-base">
                        {formatCurrencyVN(m.amount)}
                      </div>

                      <h4 className="font-bold text-xs text-slate-800 dark:text-slate-200 mt-1 line-clamp-1">
                        {m.title}
                      </h4>

                      <div className="text-[10px] text-slate-400 mt-2 font-mono flex items-center justify-between">
                        <span>Hạn nộp: {formatDateVN(m.dueDate)}</span>
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

            {/* Milestones Detailed Table */}
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                    Bảng chi tiết các đợt nộp tiền & Hồ sơ giải ngân
                  </h3>
                  <p className="text-xs text-slate-400">
                    Quản trị viên (Thầy Trần Quốc Vương) có quyền xác nhận nộp tiền sau khi đối soát biên lai
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
                            <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-slate-100">
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

                            <td className="py-3.5 px-4 font-mono font-bold text-slate-600 dark:text-slate-300">
                              {m.percentage}%
                            </td>

                            <td className="py-3.5 px-4 font-mono font-bold text-slate-900 dark:text-slate-100 whitespace-nowrap">
                              {formatCurrencyVN(m.amount)}
                            </td>

                            <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400 max-w-xs">
                              {m.description || m.note}
                            </td>

                            <td className="py-3.5 px-4 font-mono text-slate-600 dark:text-slate-400 whitespace-nowrap">
                              {formatDateVN(m.dueDate)}
                            </td>

                            <td className="py-3.5 px-4 font-mono text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                              {m.paidDate ? formatDateVN(m.paidDate) : '—'}
                            </td>

                            <td className="py-3.5 px-4 whitespace-nowrap">
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

                            <td className="py-3.5 px-4 text-right whitespace-nowrap">
                              {isAdmin && !isPaid ? (
                                <button
                                  onClick={() => handleConfirmMilestonePayment(m.id, m.title)}
                                  className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-xs transition-all inline-flex items-center gap-1.5"
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

        {/* Tab (d): MỤC PHÁT SINH & TRỞ NGẠI HIỆN TRƯỜNG (INCIDENTS) */}
        {activeTab === 'incidents' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
                  Danh sách Phát sinh & Trở ngại thi công ({projectIncidents.length} mục)
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Ghi nhận các trở ngại về thời tiết mưa ngập, chậm tiến độ giao vật tư, sự cố mặt bằng và phương án xử lý
                </p>
              </div>

              {/* Incident Filter Buttons */}
              <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs">
                {(
                  [
                    { id: 'all', label: 'Tất cả' },
                    { id: 'open', label: 'Mới báo cáo' },
                    { id: 'resolving', label: 'Đang xử lý' },
                    { id: 'resolved', label: 'Đã giải quyết' },
                  ] as const
                ).map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setIncidentFilter(f.id)}
                    className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
                      incidentFilter === f.id
                        ? 'bg-white dark:bg-slate-700 text-amber-500 shadow-xs'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {filteredIncidents.length === 0 ? (
              <div className="py-16 text-center rounded-3xl border border-dashed border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 p-8">
                <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3 opacity-80" />
                <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
                  Không có phát sinh nào trong danh mục này
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Mọi hạng mục công việc đang vận hành an toàn và kiểm soát tốt.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredIncidents.map((inc) => {
                  const targetTask = projectTasks.find((t) => t.id === inc.taskId);
                  const sev = INCIDENT_SEVERITY_CONFIG[inc.severity];
                  const st = INCIDENT_STATUS_CONFIG[inc.status];
                  const isResolved = inc.status === 'resolved';

                  return (
                    <div
                      key={inc.id}
                      className={`p-5 rounded-3xl border transition-all shadow-xs flex flex-col justify-between ${
                        isResolved
                          ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                          : inc.severity === 'critical' || inc.severity === 'high'
                          ? 'bg-rose-50/30 dark:bg-rose-950/20 border-rose-300 dark:border-rose-900/60'
                          : 'bg-white dark:bg-slate-900 border-amber-300/60 dark:border-amber-900/40'
                      }`}
                    >
                      <div>
                        {/* Header Badges */}
                        <div className="flex items-center justify-between mb-2.5 flex-wrap gap-2">
                          <div className="flex items-center gap-1.5">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${sev.badgeClass}`}>
                              {sev.label}
                            </span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${st.badgeClass}`}>
                              {st.label}
                            </span>
                          </div>

                          <span className="text-[10px] text-slate-400 font-mono">
                            {formatDateTimeVN(inc.reportedAt)}
                          </span>
                        </div>

                        {/* Title & Task Context */}
                        <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100 leading-snug">
                          {inc.title}
                        </h4>

                        {targetTask && (
                          <div className="text-[11px] text-amber-600 dark:text-amber-400 font-semibold mt-1">
                            Phát sinh trong: {targetTask.title}
                          </div>
                        )}

                        {/* Description */}
                        <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 leading-relaxed bg-slate-50 dark:bg-slate-800/50 p-3 rounded-2xl border border-slate-200 dark:border-slate-800">
                          {inc.description}
                        </p>

                        {/* Solution Section */}
                        {inc.solution && (
                          <div className="mt-3 p-3 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 text-xs">
                            <strong className="block font-bold text-emerald-700 dark:text-emerald-300 mb-0.5">
                              Phương án xử lý / Khắc phục:
                            </strong>
                            <p className="text-slate-700 dark:text-slate-300">{inc.solution}</p>
                          </div>
                        )}

                        <div className="text-[10px] text-slate-400 mt-3">
                          Người báo cáo: <span className="font-semibold text-slate-600 dark:text-slate-300">{inc.reportedBy}</span>
                          {inc.resolvedAt && (
                            <span className="ml-2 text-emerald-600">
                              • Đã xử lý lúc {formatDateVN(inc.resolvedAt)}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                        {targetTask && (
                          <button
                            onClick={() => setInspectTask(targetTask)}
                            className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
                          >
                            Xem chi tiết nhiệm vụ →
                          </button>
                        )}

                        {!isResolved && (isAdmin || currentUser.name.includes('Kiệt')) && (
                          <button
                            onClick={() => handleResolveIncident(inc.taskId, inc.id)}
                            className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-xs transition-all flex items-center gap-1.5 ml-auto"
                          >
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                            Đánh dấu đã giải quyết
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Tab (e): THƯ VIỆN MINH CHỨNG */}
        {activeTab === 'gallery' && (
          <ProjectGallery projectId={project.id} tasks={projectTasks} />
        )}

        {/* Tab (f): KÊNH CHAT DỰ ÁN */}
        {activeTab === 'chat' && <ProjectChat projectId={project.id} />}

        {/* Tab (g): THÀNH VIÊN & QUYỀN XEM */}
        {activeTab === 'members' && (
          <ProjectMembers project={project} isReadOnly={isLeader} />
        )}

        {/* Tab (h): NHẬT KÝ TIẾN ĐỘ DỰ ÁN */}
        {activeTab === 'activity' && (
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
            <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 mb-4">
              Dòng thời gian thay đổi & Nhật ký dự án
            </h3>
            <div className="space-y-4">
              {projectLogs.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  Chưa có nhật ký hoạt động riêng cho dự án này.
                </div>
              ) : (
                projectLogs.map((log) => (
                  <div key={log.id} className="flex items-start gap-3 text-xs">
                    <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-500 font-bold flex items-center justify-center shrink-0">
                      {log.userName[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900 dark:text-slate-100">
                          {log.userName}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400">
                          {formatDateTimeVN(log.timestamp)}
                        </span>
                      </div>
                      <div className="text-slate-600 dark:text-slate-300 mt-0.5">
                        <span className="font-semibold text-amber-600">{log.action}: </span>
                        {log.target}
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">{log.details}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Inspection Modal */}
        {inspectTask && (
          <TaskDetailModal
            task={inspectTask}
            onClose={() => setInspectTask(null)}
            onOpenApproval={(t) => setApprovalTask(t)}
            onOpenUpdate={(t) => setUpdateTask(t)}
          />
        )}

        {/* Approval Modal */}
        {approvalTask && (
          <TaskApprovalModal
            task={approvalTask}
            onClose={() => setApprovalTask(null)}
          />
        )}

        {/* Update Modal */}
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
