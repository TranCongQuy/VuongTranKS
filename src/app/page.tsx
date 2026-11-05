'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'motion/react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ChartTooltip,
  PieChart,
  Pie,
  Cell,
  Legend as ChartLegend,
} from 'recharts';
import {
  Layers,
  CheckSquare,
  AlertTriangle,
  Clock,
  TrendingUp,
  ArrowRight,
  Eye,
  PlusCircle,
  FileCheck,
  Calendar,
  Quote,
  DollarSign,
  CheckCircle2,
  ChevronRight,
  Send,
  Sparkles,
  Check,
  FileText,
} from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { CircularProgress } from '@/components/ui/CircularProgress';
import { TaskApprovalModal } from '@/components/tasks/TaskApprovalModal';
import { TaskUpdateModal } from '@/components/tasks/TaskUpdateModal';
import { useConstructionStore } from '@/lib/store';
import {
  Task,
  CATEGORY_CONFIG,
  TASK_STATUS_CONFIG,
  INCIDENT_SEVERITY_CONFIG,
  INCIDENT_STATUS_CONFIG,
} from '@/lib/types';
import { formatDateVN, formatDateTimeVN, formatCurrencyVN } from '@/lib/utils';
import { toast } from 'sonner';
import { PageHeader } from '@/components/ui/PageHeader';
import { SectionCard, StatCard, ProgressBar, Avatar, EmptyState } from '@/components/ui/cards';
import { StatusBadge, type BadgeTone } from '@/components/ui/StatusBadge';

// Đếm số động (ease-out, ~600ms) cho các KPI số nguyên chính
function useAnimatedNumber(target: number, duration = 600): number {
  const [value, setValue] = useState(0);
  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setValue(Math.round(target * eased));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return value;
}

const fadeUp = {
  initial: { opacity: 0, y: 16 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-40px' },
  transition: { duration: 0.45, ease: 'easeOut' as const },
};

interface StatusSlice {
  name: string;
  value: number;
  color: string;
}

function StatusDonut({ data, total }: { data: StatusSlice[]; total: number }) {
  if (total === 0 || data.length === 0) {
    return (
      <div className="py-10 text-center text-xs text-ink-soft dark:text-slate-400 border border-dashed border-line dark:border-night-line rounded-2xl">
        Chưa có nhiệm vụ nào trong phạm vi hiển thị.
      </div>
    );
  }
  return (
    <ResponsiveContainer width="100%" height={260}>
      <PieChart>
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          innerRadius={62}
          outerRadius={92}
          paddingAngle={2}
          strokeWidth={0}
        >
          {data.map((d) => (
            <Cell key={d.name} fill={d.color} />
          ))}
        </Pie>
        <ChartTooltip formatter={(v) => [`${v} nhiệm vụ`, '']} />
        <ChartLegend wrapperStyle={{ fontSize: 11 }} />
      </PieChart>
    </ResponsiveContainer>
  );
}

function ProjectProgressBars({
  data,
}: {
  data: { code: string; name: string; progress: number }[];
}) {
  if (data.length === 0) {
    return (
      <div className="py-10 text-center text-xs text-ink-soft dark:text-slate-400 border border-dashed border-line dark:border-night-line rounded-2xl">
        Chưa có dự án nào trong phạm vi hiển thị.
      </div>
    );
  }
  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} margin={{ top: 8, right: 12, left: -18, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
        <XAxis dataKey="code" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
        <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
        <ChartTooltip
          formatter={(v) => [`${v}%`, 'Tiến độ']}
          labelFormatter={(_, payload) =>
            payload && payload[0] ? String(payload[0].payload.name) : ''
          }
        />
        <Bar dataKey="progress" fill="#0E7C5B" radius={[6, 6, 0, 0]} maxBarSize={44} />
      </BarChart>
    </ResponsiveContainer>
  );
}

const SEVERITY_TONE: Record<string, BadgeTone> = {
  low: 'slate',
  medium: 'gold',
  high: 'rose',
  critical: 'rose',
};
const INCIDENT_STATUS_TONE: Record<string, BadgeTone> = {
  open: 'rose',
  resolving: 'gold',
  resolved: 'pine',
};

export default function DashboardPage() {
  const [selectedApprovalTask, setSelectedApprovalTask] = useState<Task | null>(null);
  const [selectedUpdateTask, setSelectedUpdateTask] = useState<Task | null>(null);

  const currentUser = useConstructionStore((s) => s.currentUser);
  const getVisibleProjects = useConstructionStore((s) => s.getVisibleProjects);
  const calculateProjectProgress = useConstructionStore((s) => s.calculateProjectProgress);
  const tasks = useConstructionStore((s) => s.tasks);
  const getOverdueTasks = useConstructionStore((s) => s.getOverdueTasks);
  const getPendingApprovalTasks = useConstructionStore((s) => s.getPendingApprovalTasks);
  const getUserTasks = useConstructionStore((s) => s.getUserTasks);
  const users = useConstructionStore((s) => s.users);
  const auditLogs = useConstructionStore((s) => s.auditLogs);
  const addLeaderDirective = useConstructionStore((s) => s.addLeaderDirective);

  const visibleProjects = getVisibleProjects();
  const overdueTasks = getOverdueTasks();
  const pendingTasks = getPendingApprovalTasks();

  // Financial statistics across visible projects
  const totalBudgetVisible = visibleProjects.reduce((sum, p) => {
    if (p.budgetTotal) return sum + p.budgetTotal;
    if (p.paymentMilestones && p.paymentMilestones.length > 0) {
      return sum + p.paymentMilestones.reduce((ms, m) => ms + m.amount, 0);
    }
    return sum;
  }, 0);

  const totalPaidVisible = visibleProjects.reduce((sum, p) => {
    if (p.paymentMilestones && p.paymentMilestones.length > 0) {
      return (
        sum +
        p.paymentMilestones
          .filter((m) => m.status === 'paid')
          .reduce((ms, m) => ms + m.amount, 0)
      );
    }
    return sum;
  }, 0);

  const remainingBudgetVisible = Math.max(0, totalBudgetVisible - totalPaidVisible);
  const totalPaidPercent =
    totalBudgetVisible > 0 ? Math.round((totalPaidVisible / totalBudgetVisible) * 100) : 0;

  // Incidents statistics across visible projects
  const visibleProjectIds = new Set(visibleProjects.map((p) => p.id));
  const allVisibleIncidents = tasks
    .filter(
      (t) => visibleProjectIds.has(t.projectId) && !t.isDeleted && t.incidents && t.incidents.length > 0
    )
    .flatMap((t) => t.incidents || []);
  const unresolvedIncidents = allVisibleIncidents.filter((i) => i.status !== 'resolved');

  // Calculate average progress across visible projects
  const avgProgress =
    visibleProjects.length > 0
      ? Math.round(
          visibleProjects.reduce((acc, p) => acc + calculateProjectProgress(p.id), 0) /
            visibleProjects.length
        )
      : 0;

  // Visible tasks & status breakdown
  const visibleTasks = tasks.filter((t) => visibleProjectIds.has(t.projectId) && !t.isDeleted);
  const statusCounts = {
    todo: visibleTasks.filter((t) => t.status === 'todo').length,
    in_progress: visibleTasks.filter((t) => t.status === 'in_progress').length,
    submitted: visibleTasks.filter((t) => t.status === 'submitted').length,
    approved: visibleTasks.filter((t) => t.status === 'approved').length,
    returned: visibleTasks.filter((t) => t.status === 'returned').length,
  };

  // Projects that have active leadership directives
  const projectsWithDirectives = visibleProjects.filter((p) => p.directive);

  // Dữ liệu biểu đồ (toàn bộ truy từ store)
  const projectProgressData = visibleProjects.map((p) => ({
    code: p.code,
    name: p.name,
    progress: calculateProjectProgress(p.id),
  }));
  const statusChartData: StatusSlice[] = (
    Object.keys(statusCounts) as (keyof typeof statusCounts)[]
  )
    .map((key) => ({
      name: TASK_STATUS_CONFIG[key].label,
      value: statusCounts[key],
      color: TASK_STATUS_CONFIG[key].color,
    }))
    .filter((d) => d.value > 0);
  const activeProjectsCount = visibleProjects.filter((p) => p.status === 'active').length;
  const activeProjectsPercent =
    visibleProjects.length > 0
      ? Math.round((activeProjectsCount / visibleProjects.length) * 100)
      : 0;

  // Việc của chính user hiện tại (dùng cho view Giám sát/assignee)
  const myTasks = getUserTasks(currentUser.id);
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const isOverdueTask = (t: Task) => {
    if (t.status === 'approved' || t.status === 'submitted') return false;
    const due = new Date(t.dueDate);
    due.setHours(0, 0, 0, 0);
    return due < todayStart;
  };
  const myOverdueTasks = myTasks.filter(isOverdueTask);
  const mySubmittedTasks = myTasks.filter((t) => t.status === 'submitted');
  const myUpcomingTasks = [...myTasks]
    .filter((t) => t.status !== 'approved')
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
    .slice(0, 5);

  // Số KPI đếm động + trạng thái mount cho thanh tiến độ
  const animProjects = useAnimatedNumber(visibleProjects.length);
  const animPending = useAnimatedNumber(pendingTasks.length);
  const animOverdue = useAnimatedNumber(overdueTasks.length);
  const animAvgProgress = useAnimatedNumber(avgProgress);
  const animIncidents = useAnimatedNumber(unresolvedIncidents.length);
  const animMyTasks = useAnimatedNumber(myTasks.length);
  const animMyOverdue = useAnimatedNumber(myOverdueTasks.length);
  const animMySubmitted = useAnimatedNumber(mySubmittedTasks.length);
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const raf = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  // Quick directive state for leaders
  const [selectedDirectiveProjectId, setSelectedDirectiveProjectId] = useState(
    visibleProjects[0]?.id || ''
  );
  const [quickDirectiveText, setQuickDirectiveText] = useState('');
  // Fallback: nếu dự án đang chọn không còn thuộc phạm vi được cấp quyền thì dùng dự án đầu tiên
  const effectiveDirectiveProjectId = visibleProjects.some(
    (p) => p.id === selectedDirectiveProjectId
  )
    ? selectedDirectiveProjectId
    : visibleProjects[0]?.id || '';

  const handleSendQuickDirective = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickDirectiveText.trim() || !effectiveDirectiveProjectId) return;
    addLeaderDirective(effectiveDirectiveProjectId, quickDirectiveText.trim());
    toast.success('Đã gửi ý kiến chỉ đạo trực tiếp đến Chủ trì dự án & Kỹ sư!');
    setQuickDirectiveText('');
  };

  // ==========================================
  // VIEW 1: DÀNH RIÊNG CHO LÃNH ĐẠO (LEADER)
  // TẬP TRUNG 100% VÀO SỐ LIỆU TÀI CHÍNH, TIẾN ĐỘ, RỦI RO
  // ==========================================
  if (currentUser.role === 'leader') {
    return (
      <AppShell>
        <div className="space-y-6">
          <PageHeader
            eyebrow="Ban Lãnh đạo • Giám sát cấp cao"
            title={`Bảng Chỉ số Điều hành Dự án • ${currentUser.name}`}
            description="Tổng hợp số liệu tiến độ thi công, phân kỳ dòng tiền kinh phí và các trở ngại hiện trường theo thời gian thực."
          >
            <Link href="/reports" className="btn-ghost">
              <FileText className="w-4 h-4" />
              Báo cáo &amp; Xuất PDF
            </Link>
            <Link href="/projects" className="btn-quiet">
              <span>Xem {visibleProjects.length} dự án</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </PageHeader>

          <div className="flex items-center gap-2 flex-wrap -mt-2">
            <StatusBadge tone="pine" dot>
              <Eye className="w-3.5 h-3.5" />
              Chế độ Giám sát Cấp cao • Ban Lãnh đạo
            </StatusBadge>
            <StatusBadge tone="slate">Được phân quyền: {visibleProjects.length} dự án</StatusBadge>
          </div>

          {/* 4 CON SỐ VÀNG CHO LÃNH ĐẠO */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: 'easeOut' }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5"
          >
            <StatCard
              label="Tổng Kinh phí Giám sát"
              value={formatCurrencyVN(totalBudgetVisible)}
              sub={`${visibleProjects.length} dự án thuộc phạm vi phê duyệt của Lãnh đạo`}
              icon={<DollarSign className="w-5 h-5" />}
              tone="gold"
            />
            <div className="card p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="text-[11px] font-bold uppercase tracking-[0.08em] text-ink-soft dark:text-slate-400">
                  Đã giải ngân / Đã nộp
                </div>
                <span className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 bg-pine-100 text-pine-700 dark:bg-pine-600/15 dark:text-pine-500">
                  <CheckCircle2 className="w-5 h-5" />
                </span>
              </div>
              <div className="text-[28px] leading-none font-extrabold font-tabular text-pine-600 dark:text-pine-500 mt-2">
                {formatCurrencyVN(totalPaidVisible)}
              </div>
              <div className="text-xs text-ink-soft dark:text-slate-400 mt-2">
                Đạt {totalPaidPercent}% tổng ngân sách • Còn {formatCurrencyVN(remainingBudgetVisible)}
              </div>
              <ProgressBar value={mounted ? totalPaidPercent : 0} tone="pine" className="mt-3" />
            </div>
            <StatCard
              label="Tiến độ Thi công Trung bình"
              value={`${animAvgProgress}%`}
              sub={`${statusCounts.approved} đạt nghiệm thu • ${statusCounts.in_progress} đang làm`}
              icon={<TrendingUp className="w-5 h-5" />}
              tone="navy"
            />
            <StatCard
              label="Trở ngại & Sự cố Hiện trường"
              value={`${animIncidents} sự cố`}
              sub={
                unresolvedIncidents.length > 0
                  ? 'Cần theo dõi biện pháp khắc phục'
                  : 'Tất cả đều trong tầm kiểm soát'
              }
              icon={<AlertTriangle className="w-5 h-5" />}
              tone="rose"
            />
          </motion.div>

          {/* BIỂU ĐỒ LÃNH ĐẠO */}
          <motion.div {...fadeUp} className="grid grid-cols-1 lg:grid-cols-5 gap-5">
            <SectionCard
              className="lg:col-span-3"
              title="Tiến độ các dự án được cấp quyền (%)"
              subtitle="Tính từ nghiệm thu thực tế của từng dự án thuộc phạm vi giám sát của bạn"
            >
              <ProjectProgressBars data={projectProgressData} />
            </SectionCard>
            <SectionCard
              className="lg:col-span-2"
              title="Phân bố trạng thái nhiệm vụ"
              subtitle={`${visibleTasks.length} nhiệm vụ thuộc ${visibleProjects.length} dự án được cấp`}
            >
              <StatusDonut data={statusChartData} total={visibleTasks.length} />
            </SectionCard>
          </motion.div>

          {/* BẢNG PHÂN KỲ KINH PHÍ */}
          <SectionCard
            title="Bảng Theo dõi Phân kỳ Kinh phí & Các đợt nộp tiền"
            subtitle="Đối soát dòng tiền thực tế theo từng đợt của các dự án được Lãnh đạo giám sát"
            action={
              <StatusBadge tone="pine">
                Đã thu nộp {formatCurrencyVN(totalPaidVisible)} / {formatCurrencyVN(totalBudgetVisible)}
              </StatusBadge>
            }
            pad={false}
          >
            <div className="overflow-x-auto">
              <table className="table-base">
                <thead>
                  <tr>
                    <th>Dự án</th>
                    <th>Đợt nộp &amp; Hạng mục</th>
                    <th className="!text-center">Tỷ lệ</th>
                    <th>Số tiền (VNĐ)</th>
                    <th>Hạn nộp</th>
                    <th>Ngày nộp</th>
                    <th className="!text-right">Trạng thái nộp</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleProjects.flatMap((proj) =>
                    (proj.paymentMilestones || []).map((m) => {
                      const isPaid = m.status === 'paid';
                      const isOverdue = m.status === 'overdue';
                      return (
                        <tr key={m.id}>
                          <td className="font-mono font-bold text-gold-600 whitespace-nowrap">{proj.code}</td>
                          <td className="font-bold text-ink dark:text-white max-w-xs">
                            <div>{m.title}</div>
                            <div className="text-[11px] text-ink-soft dark:text-slate-400 line-clamp-1 font-normal">
                              {m.description || m.note}
                            </div>
                          </td>
                          <td className="text-center font-mono font-bold text-ink-soft dark:text-slate-300">{m.percentage}%</td>
                          <td className="font-mono font-bold text-ink dark:text-white whitespace-nowrap">
                            {formatCurrencyVN(m.amount)}
                          </td>
                          <td className="font-mono text-ink-soft dark:text-slate-400 whitespace-nowrap">
                            {formatDateVN(m.dueDate)}
                          </td>
                          <td className="font-mono text-pine-600 whitespace-nowrap">
                            {m.paidDate ? formatDateVN(m.paidDate) : '—'}
                          </td>
                          <td className="text-right whitespace-nowrap">
                            {isPaid ? (
                              <StatusBadge tone="pine">
                                <Check className="w-3 h-3 stroke-[3]" />
                                ĐÃ NỘP
                              </StatusBadge>
                            ) : isOverdue ? (
                              <StatusBadge tone="rose">
                                <AlertTriangle className="w-3 h-3" />
                                QUÁ HẠN
                              </StatusBadge>
                            ) : (
                              <StatusBadge tone="gold">
                                <Clock className="w-3 h-3" />
                                SẮP ĐẾN HẠN
                              </StatusBadge>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </SectionCard>

          {/* THẺ DỰ ÁN TRỌNG ĐIỂM */}
          <div className="space-y-4">
            <div>
              <h3 className="font-bold text-[15px] text-ink dark:text-white">
                Tiến độ &amp; Chỉ số Từng Dự án Giám sát ({visibleProjects.length} dự án)
              </h3>
              <p className="text-xs text-ink-soft dark:text-slate-400 mt-0.5">
                Bạn chỉ thấy các dự án được Admin cấp quyền giám sát — hiện tại gồm{' '}
                {visibleProjects.length} dự án
                {visibleProjects.length > 0
                  ? `: ${visibleProjects.map((p) => p.code).join(', ')}`
                  : ''}
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {visibleProjects.map((proj) => {
                const projProgress = calculateProjectProgress(proj.id);
                const projTasks = tasks.filter((t) => t.projectId === proj.id && !t.isDeleted);
                const projIncidents = projTasks.flatMap((t) => t.incidents || []);
                const openProjIncidents = projIncidents.filter((i) => i.status !== 'resolved');
                const catConfig = proj.category ? CATEGORY_CONFIG[proj.category] : null;

                const pMilestones = proj.paymentMilestones || [];
                const pBudget =
                  proj.budgetTotal ||
                  (pMilestones.length > 0 ? pMilestones.reduce((s, m) => s + m.amount, 0) : 0);
                const pPaid = pMilestones
                  .filter((m) => m.status === 'paid')
                  .reduce((s, m) => s + m.amount, 0);
                const pPercent = pBudget > 0 ? Math.round((pPaid / pBudget) * 100) : 0;

                return (
                  <div key={proj.id} className="card p-5 sm:p-6 flex flex-col justify-between gap-5">
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-3 flex-wrap">
                        <div className="flex items-center gap-2">
                          <StatusBadge tone="gold">{proj.code}</StatusBadge>
                          {catConfig && <StatusBadge tone="navy">{catConfig.label}</StatusBadge>}
                        </div>
                        {openProjIncidents.length > 0 ? (
                          <StatusBadge tone="rose">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            {openProjIncidents.length} sự cố hiện trường
                          </StatusBadge>
                        ) : (
                          <StatusBadge tone="pine">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            An toàn kỹ thuật
                          </StatusBadge>
                        )}
                      </div>

                      <h3 className="text-lg font-extrabold text-ink dark:text-white leading-tight">
                        {proj.name}
                      </h3>
                      <p className="text-xs text-ink-soft dark:text-slate-400 mt-1 line-clamp-2">
                        {proj.description}
                      </p>

                      <div className="grid grid-cols-3 gap-3 p-4 rounded-2xl bg-cream dark:bg-night-line/40 border border-line dark:border-night-line mt-4 text-xs">
                        <div className="flex items-center gap-3">
                          <CircularProgress
                            value={projProgress}
                            size={48}
                            strokeWidth={5}
                            color={projProgress === 100 ? '#10B981' : '#C9A227'}
                            label=""
                          />
                          <div>
                            <span className="text-[10px] text-ink-soft uppercase font-semibold block">Tiến độ</span>
                            <div className="font-mono text-lg font-black text-gold-600">{projProgress}%</div>
                            <span className="text-[10px] text-ink-soft">
                              {projTasks.filter((t) => t.status === 'approved').length}/{projTasks.length} duyệt
                            </span>
                          </div>
                        </div>

                        <div>
                          <span className="text-[10px] text-pine-600 uppercase font-semibold block">Đã nộp kinh phí</span>
                          <div className="font-mono text-base font-black text-pine-600 mt-0.5">
                            {formatCurrencyVN(pPaid)}
                          </div>
                          <span className="text-[10px] text-pine-600 font-semibold">{pPercent}% tổng mức</span>
                        </div>

                        <div>
                          <span className="text-[10px] text-ink-soft uppercase font-semibold block">Tổng dự toán</span>
                          <div className="font-mono text-base font-black text-ink dark:text-white mt-0.5">
                            {formatCurrencyVN(pBudget)}
                          </div>
                          <span className="text-[10px] text-ink-soft">{pMilestones.length} đợt phân kỳ</span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-line dark:border-night-line flex items-center justify-between gap-3">
                      <span className="text-xs text-ink-soft dark:text-slate-400">
                        Chủ trì:{' '}
                        <strong className="text-ink dark:text-slate-200">
                          {users.find((u) => u.id === proj.managerId)?.name || '—'}
                        </strong>
                      </span>
                      <Link href={`/projects/${proj.id}`} className="btn-ghost !py-2 text-xs">
                        <span>Vào xem chi tiết dự án</span>
                        <ChevronRight className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* CHỈ ĐẠO TRỰC TIẾP CỦA LÃNH ĐẠO */}
          <div className="card p-5 sm:p-6 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gold-500 text-navy-950 flex items-center justify-center shrink-0">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-ink dark:text-white">
                  Gửi Ý kiến Chỉ đạo Nhanh từ Lãnh đạo
                </h3>
                <p className="text-[11px] text-ink-soft dark:text-slate-400">
                  Thông báo chỉ đạo sẽ được gửi tức thì đến Chủ trì dự án và các cộng sự phụ trách
                </p>
              </div>
            </div>

            <form onSubmit={handleSendQuickDirective} className="flex flex-col sm:flex-row gap-3 pt-1">
              <select
                value={effectiveDirectiveProjectId}
                onChange={(e) => setSelectedDirectiveProjectId(e.target.value)}
                className="input sm:w-72 shrink-0"
              >
                {visibleProjects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.code} - {p.name}
                  </option>
                ))}
              </select>

              <input
                type="text"
                value={quickDirectiveText}
                onChange={(e) => setQuickDirectiveText(e.target.value)}
                placeholder="Nhập nội dung chỉ đạo (ví dụ: Đôn đốc khâu lu lèn và thoát nước trước đợt mưa...)..."
                className="input flex-1"
              />

              <button type="submit" className="btn-primary shrink-0">
                <Send className="w-3.5 h-3.5" />
                <span>Gửi chỉ đạo</span>
              </button>
            </form>
          </div>
        </div>
      </AppShell>
    );
  }

  // ==========================================
  // VIEW 2: DÀNH CHO ADMIN (THẦY TRẦN QUỐC VƯƠNG)
  // HOẶC KỸ SƯ HIỆN TRƯỜNG (THẦY TUẤN KIỆT)
  // ==========================================
  return (
    <AppShell>
      <div className="space-y-6">
        <PageHeader
          eyebrow={currentUser.title}
          title={`Xin chào, ${currentUser.name}!`}
          description={
            currentUser.role === 'admin'
              ? 'Bảng điều hành tổng thể: giao việc cho cộng sự, xác nhận các đợt nộp tiền kinh phí và thẩm định chất lượng thi công.'
              : 'Sổ tay kỹ sư hiện trường: báo cáo tiến độ các dự án được phân công, gửi minh chứng thực địa và báo cáo trở ngại phát sinh.'
          }
        >
          {currentUser.role === 'admin' && (
            <Link href="/tasks/new" className="btn-primary">
              <PlusCircle className="w-4 h-4" />
              Giao việc mới
            </Link>
          )}
          {currentUser.role === 'assignee' && (
            <Link href="/my-tasks" className="btn-primary">
              <CheckSquare className="w-4 h-4" />
              Việc của tôi ({visibleTasks.filter((t) => t.assigneeId === currentUser.id).length})
            </Link>
          )}
          <Link href="/projects" className="btn-ghost">
            <span>Tất cả kế hoạch</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </PageHeader>

        {/* Leadership Directive Notification Banner if any */}
        {projectsWithDirectives.length > 0 && (
          <div className="card p-4 !border-gold-500/40 bg-gold-100/25 dark:bg-gold-500/5 flex items-start gap-3">
            <Quote className="w-5 h-5 text-gold-600 shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0 text-xs">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-bold uppercase tracking-wider text-gold-600 text-[10px]">
                  Ý kiến chỉ đạo trọng tâm từ Lãnh đạo
                </span>
                <span className="font-mono text-ink-soft text-[10px]">
                  • {projectsWithDirectives[0].code}
                </span>
              </div>
              <p className="italic text-ink dark:text-slate-200 leading-relaxed font-medium">
                &ldquo;{projectsWithDirectives[0].directive?.content}&rdquo;
              </p>
              <div className="text-[10px] text-ink-soft mt-1">
                — {projectsWithDirectives[0].directive?.authorName} (
                {projectsWithDirectives[0].directive?.authorTitle})
              </div>
            </div>
          </div>
        )}

        {/* VIỆC CỦA TÔI HÔM NAY — ưu tiên cho Giám sát/Kỹ sư hiện trường (assignee) */}
        {currentUser.role === 'assignee' && (
          <motion.section
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: 'easeOut' }}
          >
            <SectionCard
              title="Việc của tôi hôm nay"
              subtitle={`Các nhiệm vụ được giao cho ${currentUser.name}, ưu tiên việc sắp tới hạn và quá hạn`}
              action={
                <Link href="/my-tasks" className="btn-ghost !py-2 text-xs">
                  <Send className="w-3.5 h-3.5" />
                  Báo cáo tiến độ
                </Link>
              }
            >
              <div className="grid grid-cols-3 gap-3 text-center mb-4">
                <div className="p-3 rounded-2xl bg-cream dark:bg-night-line/40 border border-line dark:border-night-line">
                  <div className="font-mono text-2xl font-black text-ink dark:text-white">{animMyTasks}</div>
                  <div className="text-[10px] uppercase font-semibold text-ink-soft">Việc được giao</div>
                </div>
                <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/25">
                  <div className="font-mono text-2xl font-black text-rose-600">{animMyOverdue}</div>
                  <div className="text-[10px] uppercase font-semibold text-rose-500">Quá hạn của tôi</div>
                </div>
                <div className="p-3 rounded-2xl bg-violet-50 dark:bg-violet-500/10 border border-violet-200 dark:border-violet-500/25">
                  <div className="font-mono text-2xl font-black text-violet-600">{animMySubmitted}</div>
                  <div className="text-[10px] uppercase font-semibold text-violet-500">Đang chờ duyệt</div>
                </div>
              </div>

              {myUpcomingTasks.length === 0 ? (
                <p className="text-xs text-ink-soft dark:text-slate-400 text-center py-2">
                  Bạn chưa có nhiệm vụ nào đang mở. Khi được giao việc mới, nhiệm vụ sẽ hiện tại đây.
                </p>
              ) : (
                <div className="divide-y divide-line dark:divide-night-line border border-line dark:border-night-line rounded-2xl overflow-hidden">
                  {myUpcomingTasks.map((t) => {
                    const proj = visibleProjects.find((p) => p.id === t.projectId);
                    const overdue = isOverdueTask(t);
                    return (
                      <Link
                        key={t.id}
                        href={`/projects/${t.projectId}?tab=tasks&taskId=${t.id}`}
                        className="flex items-center justify-between gap-3 px-3.5 py-3 bg-white dark:bg-night-card hover:bg-cream/70 dark:hover:bg-night-line/40 transition-colors"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <StatusBadge tone="gold">{proj?.code || 'DỰ ÁN'}</StatusBadge>
                            <span className="text-[11px] font-semibold text-ink-soft dark:text-slate-400">
                              {TASK_STATUS_CONFIG[t.status].label} • {t.progress}%
                            </span>
                          </div>
                          <div className="font-bold text-sm text-ink dark:text-white truncate mt-1">
                            {t.title}
                          </div>
                        </div>
                        {overdue ? (
                          <StatusBadge tone="rose">
                            <Calendar className="w-3.5 h-3.5" />
                            Quá hạn: {formatDateVN(t.dueDate)}
                          </StatusBadge>
                        ) : (
                          <span className="text-[11px] font-bold whitespace-nowrap flex items-center gap-1 text-ink-soft dark:text-slate-400">
                            <Calendar className="w-3.5 h-3.5" />
                            Hạn: {formatDateVN(t.dueDate)}
                          </span>
                        )}
                      </Link>
                    );
                  })}
                </div>
              )}
            </SectionCard>
          </motion.section>
        )}

        {/* 4 Primary Metric Cards */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: 'easeOut', delay: 0.05 }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5"
        >
          <StatCard
            label="Dự án mục tiêu"
            value={animProjects}
            sub={`Chương trình • ${activeProjectsPercent}% đang triển khai (${activeProjectsCount}/${visibleProjects.length} dự án)`}
            icon={<Layers className="w-5 h-5" />}
            tone="gold"
          />
          <StatCard
            label="Nhiệm vụ chờ duyệt"
            value={animPending}
            sub="Đã nộp kết quả • Chờ Chủ trì dự án nghiệm thu"
            icon={<FileCheck className="w-5 h-5" />}
            tone="navy"
          />
          <StatCard
            label="Hạng mục trễ hạn"
            value={animOverdue}
            sub="Cần đôn đốc • Cần nhắc nhở cộng sự phụ trách"
            icon={<AlertTriangle className="w-5 h-5" />}
            tone="rose"
          />
          <StatCard
            label="Tiến độ tổng thể"
            value={`${animAvgProgress}%`}
            sub="Chỉ đạt 100% khi tất cả đã nghiệm thu"
            icon={<TrendingUp className="w-5 h-5" />}
            tone="pine"
          />
        </motion.div>

        {/* BIỂU ĐỒ TỔNG QUAN */}
        <motion.div {...fadeUp} className="grid grid-cols-1 lg:grid-cols-5 gap-5">
          <SectionCard
            className="lg:col-span-3"
            title="Tiến độ theo từng dự án (%)"
            subtitle={`Tiến độ nghiệm thu thực tế của ${visibleProjects.length} dự án trong phạm vi hiển thị`}
          >
            <ProjectProgressBars data={projectProgressData} />
          </SectionCard>
          <SectionCard
            className="lg:col-span-2"
            title="Phân bố trạng thái nhiệm vụ"
            subtitle={`Tổng ${visibleTasks.length} nhiệm vụ thuộc các dự án đang hiển thị`}
          >
            <StatusDonut data={statusChartData} total={visibleTasks.length} />
          </SectionCard>
        </motion.div>

        {/* Kinh phí & Trở ngại hiện trường */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <SectionCard
            title="Tiến độ Kinh phí & Các đợt nộp tiền"
            subtitle="Theo dõi tiến độ giải ngân theo hợp đồng thi công"
            action={<StatusBadge tone="pine">Đã nộp {totalPaidPercent}%</StatusBadge>}
          >
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-4 rounded-2xl bg-cream dark:bg-night-line/40 border border-line dark:border-night-line text-xs">
              <div>
                <span className="text-[10px] text-ink-soft uppercase font-semibold block">Tổng kinh phí</span>
                <div className="font-mono font-bold text-ink dark:text-white text-sm sm:text-base mt-0.5">
                  {formatCurrencyVN(totalBudgetVisible)}
                </div>
              </div>
              <div>
                <span className="text-[10px] text-pine-600 uppercase font-semibold block">Đã thanh toán</span>
                <div className="font-mono font-bold text-pine-600 text-sm sm:text-base mt-0.5">
                  {formatCurrencyVN(totalPaidVisible)}
                </div>
              </div>
              <div className="col-span-2 sm:col-span-1">
                <span className="text-[10px] text-gold-600 uppercase font-semibold block">Còn lại</span>
                <div className="font-mono font-bold text-gold-600 text-sm sm:text-base mt-0.5">
                  {formatCurrencyVN(remainingBudgetVisible)}
                </div>
              </div>
            </div>
            <div className="mt-4 flex justify-end">
              <Link
                href={
                  visibleProjects[0]
                    ? `/projects/${visibleProjects[0].id}?tab=financial`
                    : '/projects'
                }
                className="btn-quiet"
              >
                Chi tiết giải ngân các đợt nộp
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </SectionCard>

          <SectionCard
            title="Phát sinh & Trở ngại hiện trường"
            subtitle="Thời tiết mưa bão, chậm bàn giao vật tư, mặt bằng"
            action={
              unresolvedIncidents.length > 0 ? (
                <StatusBadge tone="rose">{unresolvedIncidents.length} cần theo dõi</StatusBadge>
              ) : (
                <StatusBadge tone="pine">An toàn</StatusBadge>
              )
            }
          >
            {allVisibleIncidents.length === 0 ? (
              <div className="py-8 text-center text-xs text-ink-soft dark:text-slate-400 border border-dashed border-line dark:border-night-line rounded-2xl">
                Hiện trường không có trở ngại kỹ thuật hay thời tiết nào.
              </div>
            ) : (
              <div className="space-y-2.5">
                {allVisibleIncidents.slice(0, 2).map((inc) => {
                  const sev = INCIDENT_SEVERITY_CONFIG[inc.severity];
                  const st = INCIDENT_STATUS_CONFIG[inc.status];
                  return (
                    <div
                      key={inc.id}
                      className="p-3 rounded-2xl bg-cream dark:bg-night-line/40 border border-line dark:border-night-line text-xs"
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <StatusBadge tone={SEVERITY_TONE[inc.severity]}>{sev.label}</StatusBadge>
                          <StatusBadge tone={INCIDENT_STATUS_TONE[inc.status]}>{st.label}</StatusBadge>
                        </div>
                        <span className="text-[10px] text-ink-soft font-mono">
                          {formatDateVN(inc.reportedAt)}
                        </span>
                      </div>
                      <h4 className="font-bold text-ink dark:text-white truncate">{inc.title}</h4>
                      <p className="text-[11px] text-ink-soft dark:text-slate-400 line-clamp-1 mt-0.5">
                        {inc.solution || inc.description}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
            <div className="mt-4 flex justify-end">
              <Link
                href={
                  allVisibleIncidents[0]
                    ? `/projects/${tasks.find((t) => t.id === allVisibleIncidents[0].taskId)?.projectId || visibleProjects[0]?.id || ''}?tab=incidents`
                    : '/projects'
                }
                className="btn-quiet"
              >
                Xem toàn bộ trở ngại &amp; giải pháp
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </SectionCard>
        </div>

        {/* Cần nghiệm thu + Dòng hoạt động */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <SectionCard
            className="lg:col-span-2"
            title={`Cần thẩm định & Nghiệm thu (${pendingTasks.length})`}
            subtitle="Các hạng mục đã hoàn thành 100% kèm video/ảnh minh chứng đang chờ phê duyệt"
          >
            {pendingTasks.length === 0 ? (
              <EmptyState
                icon={<CheckSquare className="w-7 h-7" />}
                title="Tất cả các báo cáo nhiệm vụ đều đã được xử lý nghiệm thu!"
                description="Không còn đầu việc nào tồn đọng"
              />
            ) : (
              <div className="divide-y divide-line dark:divide-night-line border border-line dark:border-night-line rounded-2xl overflow-hidden">
                {pendingTasks.map((t) => {
                  const proj = visibleProjects.find((p) => p.id === t.projectId);
                  const rowInner = (
                    <>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <StatusBadge tone="violet">{proj?.code || 'DỰ ÁN'}</StatusBadge>
                          <span className="text-xs text-ink-soft dark:text-slate-400 flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            Hạn: {formatDateVN(t.dueDate)}
                          </span>
                        </div>
                        <h4 className="font-bold text-sm text-ink dark:text-white truncate">{t.title}</h4>
                        <p className="text-xs text-ink-soft dark:text-slate-400 line-clamp-1 mt-0.5">
                          {t.description}
                        </p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-ink-soft/60 shrink-0" />
                    </>
                  );
                  const rowClass =
                    'flex items-center justify-between gap-3 px-4 py-3.5 bg-white dark:bg-night-card hover:bg-cream/70 dark:hover:bg-night-line/40 transition-colors cursor-pointer';
                  return currentUser.role === 'admin' ? (
                    <div key={t.id} onClick={() => setSelectedApprovalTask(t)} className={rowClass}>
                      {rowInner}
                    </div>
                  ) : (
                    <Link
                      key={t.id}
                      href={`/projects/${t.projectId}?tab=tasks&taskId=${t.id}`}
                      className={rowClass}
                    >
                      {rowInner}
                    </Link>
                  );
                })}
              </div>
            )}
          </SectionCard>

          <SectionCard
            title="Dòng hoạt động gần nhất"
            action={
              currentUser.role === 'admin' ? (
                <Link href="/audit-logs" className="btn-quiet">
                  Xem nhật ký
                </Link>
              ) : undefined
            }
          >
            <div className="space-y-4">
              {auditLogs.slice(0, 5).map((log) => (
                <div key={log.id} className="flex items-start gap-3 text-xs">
                  <Avatar
                    size="sm"
                    text={log.userName
                      .split(' ')
                      .map((n) => n[0])
                      .slice(-2)
                      .join('')}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-ink dark:text-slate-200 font-semibold truncate">{log.userName}</div>
                    <div className="text-ink-soft dark:text-slate-400 text-[11px]">
                      <span className="font-medium text-gold-600">{log.action}: </span>
                      <span className="truncate">{log.target}</span>
                    </div>
                    <div className="text-[10px] text-ink-soft mt-0.5 font-mono">
                      {formatDateTimeVN(log.timestamp)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-3 border-t border-line dark:border-night-line text-[11px] text-ink-soft dark:text-slate-400">
              Minh bạch và đồng bộ thời gian thực theo chuẩn quản trị mục tiêu.
            </div>
          </SectionCard>
        </div>

        {/* Modal for Task Review & Approval */}
        {selectedApprovalTask && (
          <TaskApprovalModal
            task={selectedApprovalTask}
            onClose={() => setSelectedApprovalTask(null)}
          />
        )}

        {/* Modal for Task Update */}
        {selectedUpdateTask && (
          <TaskUpdateModal
            task={selectedUpdateTask}
            onClose={() => setSelectedUpdateTask(null)}
          />
        )}
      </div>
    </AppShell>
  );
}
