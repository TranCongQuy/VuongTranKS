'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'motion/react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ChartTooltip,
  ComposedChart,
  Area,
  Line,
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
import { RingProgress } from '@/components/ui/RingProgress';
import { Sparkline } from '@/components/ui/Sparkline';
import { TaskApprovalModal } from '@/components/tasks/TaskApprovalModal';
import { TaskUpdateModal } from '@/components/tasks/TaskUpdateModal';
import { useConstructionStore } from '@/lib/store';
import {
  selectOverallProgress,
  selectProjectAcceptedProgress,
  selectWeightedTimeProgress,
  getProjectContractValue,
  selectAllAlerts,
} from '@/lib/selectors';
import {
  Task,
  TASK_STATUS_CONFIG,
} from '@/lib/types';
import { formatDateVN, formatDateTimeVN, formatCurrencyVN } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { PageHeader } from '@/components/ui/PageHeader';
import { SectionCard, StatCard, ProgressBar, Avatar, EmptyState } from '@/components/ui/cards';
import { StatusBadge } from '@/components/ui/StatusBadge';

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

/** Định dạng tiền gọn kiểu Mẫu A: 6.936.941.385 -> "6,94 tỷ". */
function formatTy(v: number): string {
  if (v >= 1_000_000_000) {
    return `${(v / 1_000_000_000).toLocaleString('vi-VN', { maximumFractionDigits: 2 })} tỷ`;
  }
  if (v >= 1_000_000) {
    return `${(v / 1_000_000).toLocaleString('vi-VN', { maximumFractionDigits: 0 })} triệu`;
  }
  return formatCurrencyVN(v);
}

const WEEKDAYS_VI = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];

/* ------------------------------------------------------------------ */
/* Sức khoẻ dự án — suy 100% từ tiến độ thật + task quá hạn + sự cố mở */
/* ------------------------------------------------------------------ */
type HealthKey = 'done' | 'almost' | 'ontrack' | 'attention' | 'notstarted';

const HEALTH_META: Record<
  HealthKey,
  { label: string; ring: string; dot: string; text: string }
> = {
  done: { label: 'Hoàn thành', ring: '#10B981', dot: '#10B981', text: 'text-emerald-600 dark:text-emerald-400' },
  almost: { label: 'Sắp bàn giao', ring: '#10B981', dot: '#10B981', text: 'text-emerald-600 dark:text-emerald-400' },
  ontrack: { label: 'Đang chạy', ring: '#6366F1', dot: '#10B981', text: 'text-emerald-600 dark:text-emerald-400' },
  attention: { label: 'Cần đôn đốc', ring: '#F59E0B', dot: '#F59E0B', text: 'text-amber-600 dark:text-amber-400' },
  notstarted: { label: 'Chưa bắt đầu', ring: '#F43F5E', dot: '#F43F5E', text: 'text-rose-600 dark:text-rose-400' },
};

function healthOf(progress: number, hasOverdue: boolean, hasSevereIncident: boolean): HealthKey {
  if (progress >= 100) return 'done';
  if (progress <= 0) return 'notstarted';
  if (hasOverdue || hasSevereIncident) return 'attention';
  if (progress >= 90) return 'almost';
  return 'ontrack';
}

function ringColorFor(progress: number, health: HealthKey): string {
  if (health === 'ontrack' && progress >= 65) return '#0EA5E9'; // sky — như ô STT 70% của Mẫu A
  return HEALTH_META[health].ring;
}

/** Mã gói ngắn kiểu Mẫu A: 'PXU-2026-CT45' -> 'CT45'. */
function shortCode(code: string): string {
  return code.replace(/^PXU-\d+-/, '');
}

/** Tên rút gọn cho ô sức khoẻ: bỏ động từ mở đầu phổ biến, phần còn lại để CSS cắt. */
function shortProjectName(name: string): string {
  const s = name.replace(/^(Cải tạo|Thi công|Sửa chữa|Xây dựng|Nâng cấp)\s+/i, '');
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/* ------------------------------------------------------------------ */
/* Donut phân bổ nhiệm vụ — SVG thuần, màu khớp chú thích như Mẫu A    */
/* ------------------------------------------------------------------ */
const DONUT_META: { key: string; label: string; color: string }[] = [
  { key: 'in_progress', label: 'Đang làm', color: '#6366F1' },
  { key: 'todo', label: 'Mới giao', color: '#94A3B8' },
  { key: 'approved', label: 'Đã nghiệm thu', color: '#10B981' },
  { key: 'submitted', label: 'Chờ duyệt', color: '#F59E0B' },
  { key: 'returned', label: 'Bị trả lại', color: '#F43F5E' },
];

function TaskDonut({ counts, total }: { counts: Record<string, number>; total: number }) {
  const slices = DONUT_META.map((m) => ({ ...m, value: counts[m.key] || 0 })).filter(
    (s) => s.value > 0
  );
  if (total === 0 || slices.length === 0) {
    return (
      <div className="py-10 text-center text-xs text-ink-soft dark:text-slate-400 border border-dashed border-line dark:border-night-line rounded-2xl">
        Chưa có nhiệm vụ nào trong phạm vi hiển thị.
      </div>
    );
  }
  const R = 46;
  const C = 2 * Math.PI * R;
  // Offset tích luỹ của từng lát cắt (tính thuần, không mutate biến ngoài)
  const arcs = slices.map((s, i) => ({
    ...s,
    frac: s.value / total,
    offsetFrac: slices.slice(0, i).reduce((a, x) => a + x.value / total, 0),
  }));
  return (
    <div className="flex items-center gap-4">
      <div className="relative w-[118px] h-[118px] shrink-0">
        <svg width="118" height="118" viewBox="0 0 118 118" className="-rotate-90">
          <circle cx="59" cy="59" r={R} fill="none" stroke="#EEF1F6" strokeWidth="15" className="dark:stroke-slate-700/60" />
          {arcs.map((s) => {
            const dash = s.frac * C;
            return (
              <circle
                key={s.key}
                cx="59"
                cy="59"
                r={R}
                fill="none"
                stroke={s.color}
                strokeWidth="15"
                strokeDasharray={`${Math.max(0, dash - 2)} ${C - dash + 2}`}
                strokeDashoffset={-s.offsetFrac * C}
                style={{ transition: 'stroke-dasharray 0.7s ease, stroke-dashoffset 0.7s ease' }}
              />
            );
          })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-[19px] font-black font-tabular text-ink dark:text-white leading-none">
            {total}
          </span>
          <span className="text-[9px] font-semibold text-ink-soft dark:text-slate-400 tracking-wide mt-1">
            NHIỆM VỤ
          </span>
        </div>
      </div>
      <div className="flex-1 flex flex-col gap-[7px] text-xs text-ink-soft dark:text-slate-400 font-medium min-w-0">
        {slices.map((s) => (
          <div key={s.key} className="flex items-center gap-2">
            <span className="w-[9px] h-[9px] rounded-[3px] shrink-0" style={{ background: s.color }} />
            <span className="truncate">{s.label}</span>
            <b className="text-ink dark:text-white ml-auto pl-3 font-tabular">{s.value}</b>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Biểu đồ vùng: nghiệm thu luỹ kế theo tháng (dữ liệu thật, xem ghi   */
/* chú trục trong AURORA-REPORT) + đường kế hoạch đứt nét suy từ       */
/* % thời gian đã trôi qua của từng dự án (startDate -> endDate).      */
/* ------------------------------------------------------------------ */
interface MonthPoint {
  name: string;
  actual: number;
  plan: number;
}

function ProgressAreaChart({ data }: { data: MonthPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={210}>
      <ComposedChart data={data} margin={{ top: 8, right: 8, left: -14, bottom: 0 }}>
        <defs>
          <linearGradient id="auroraArea" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#6366F1" stopOpacity={0.28} />
            <stop offset="100%" stopColor="#6366F1" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} stroke="#EEF1F6" />
        <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748B' }} tickLine={false} axisLine={false} />
        <YAxis
          domain={[0, 100]}
          tick={{ fontSize: 11, fill: '#94A3B8' }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v: number) => `${v}%`}
        />
        <ChartTooltip
          formatter={(v, name) => [
            `${v}%`,
            name === 'actual' ? 'Đã nghiệm thu (luỹ kế)' : 'Kế hoạch theo thời gian',
          ]}
        />
        <Area
          type="monotone"
          dataKey="actual"
          stroke="#6366F1"
          strokeWidth={2.6}
          fill="url(#auroraArea)"
          dot={{ r: 3.5, fill: '#fff', stroke: '#6366F1', strokeWidth: 2.2 }}
          activeDot={{ r: 4.5 }}
        />
        <Line
          type="monotone"
          dataKey="plan"
          stroke="#10B981"
          strokeWidth={2}
          strokeDasharray="5 5"
          strokeOpacity={0.65}
          dot={false}
        />
      </ComposedChart>
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
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EEF1F6" />
        <XAxis dataKey="code" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
        <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
        <ChartTooltip
          formatter={(v) => [`${v}%`, 'Tiến độ']}
          labelFormatter={(_, payload) =>
            payload && payload[0] ? String(payload[0].payload.name) : ''
          }
        />
        <Bar dataKey="progress" fill="#6366F1" radius={[6, 6, 0, 0]} maxBarSize={44} />
      </BarChart>
    </ResponsiveContainer>
  );
}

const SEVERITY_SHORT: Record<string, string> = {
  critical: 'Rất cao',
  high: 'Mức cao',
  medium: 'Trung bình',
  low: 'Thấp',
};

export default function DashboardPage() {
  const router = useRouter();
  const [selectedApprovalTask, setSelectedApprovalTask] = useState<Task | null>(null);
  const [selectedUpdateTask, setSelectedUpdateTask] = useState<Task | null>(null);

  const currentUser = useConstructionStore((s) => s.currentUser);
  const getVisibleProjects = useConstructionStore((s) => s.getVisibleProjects);
  const calculateProjectProgress = useConstructionStore((s) => s.calculateProjectProgress);
  const tasks = useConstructionStore((s) => s.tasks);
  const allProjects = useConstructionStore((s) => s.projects);
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

  // Tiến độ TỔNG toàn trường — TRỌNG SỐ THEO GIÁ TRỊ HỢP ĐỒNG qua selector
  // duy nhất (src/lib/selectors.ts). KHÔNG còn trung bình cộng % các gói:
  // gói 2,5 tỷ phải nặng hơn gói 165 triệu trong con số tổng.
  const overallProgress = selectOverallProgress(
    { projects: allProjects, tasks },
    visibleProjects
  );

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

  // Dữ liệu biểu đồ cột cho Lãnh đạo (toàn bộ truy từ store)
  const projectProgressData = visibleProjects.map((p) => ({
    code: p.code,
    name: p.name,
    progress: calculateProjectProgress(p.id),
  }));

  /* ---------------------------------------------------------------- */
  /* DỮ LIỆU TRỰC QUAN AURORA — mọi chuỗi số đều tính thật từ store    */
  /* ---------------------------------------------------------------- */
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const daysLateOf = (t: Task) => {
    const due = new Date(t.dueDate);
    due.setHours(0, 0, 0, 0);
    return Math.max(0, Math.round((todayStart.getTime() - due.getTime()) / 86_400_000));
  };

  const overdueProjectIds = new Set(overdueTasks.map((t) => t.projectId));
  const severeIncidentProjectIds = new Set(
    allVisibleIncidents
      .filter((i) => i.status !== 'resolved' && (i.severity === 'high' || i.severity === 'critical'))
      .map((i) => i.taskId)
      .map((taskId) => tasks.find((t) => t.id === taskId)?.projectId)
      .filter((id): id is string => Boolean(id))
  );

  const healthList = visibleProjects.map((p) => {
    const progress = calculateProjectProgress(p.id);
    const health = healthOf(progress, overdueProjectIds.has(p.id), severeIncidentProjectIds.has(p.id));
    return { project: p, progress, health };
  });
  const healthCounts = {
    onTrack: healthList.filter(
      (h) => h.health === 'ontrack' || h.health === 'almost' || h.health === 'done'
    ).length,
    attention: healthList.filter((h) => h.health === 'attention').length,
    notStarted: healthList.filter((h) => h.health === 'notstarted').length,
  };
  const topEntry = healthList
    .filter((h) => h.progress > 0)
    .sort((a, b) => b.progress - a.progress)[0];
  const zeroEntry = healthList.find((h) => h.health === 'notstarted');
  const mostOverdueTask = [...overdueTasks].sort((a, b) => daysLateOf(b) - daysLateOf(a))[0];
  const mostOverdueProject = mostOverdueTask
    ? visibleProjects.find((p) => p.id === mostOverdueTask.projectId)
    : undefined;
  const projectAlerts = selectAllAlerts({ projects: allProjects, tasks }, visibleProjects);

  // 6 tháng gần nhất (kết thúc ở tháng hiện tại) — khung thời gian cho
  // biểu đồ vùng + sparkline khởi công.
  const now = new Date();
  const monthEnds = Array.from({ length: 6 }, (_, i) => {
    const first = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    const end = new Date(first.getFullYear(), first.getMonth() + 1, 0, 23, 59, 59);
    return { label: `Th ${first.getMonth() + 1}`, end };
  });
  // Biểu đồ vùng: cả 2 đường đều qua selector (selectors.ts) và TRỌNG SỐ
  // THEO GIÁ TRỊ HỢP ĐỒNG để nhất quán với con số tiến độ tổng ở hero.
  //  - Đường liền (actual): % khối lượng ĐÃ NGHIỆM THU luỹ kế tới cuối tháng
  //    (selectProjectAcceptedProgress — chỉ task approved đúng hạn mới tính).
  //  - Đường đứt (plan): % thời gian đã trôi qua của các gói, trọng số HĐ.
  const progressSlice = { projects: allProjects, tasks };
  const areaData: MonthPoint[] = monthEnds.map((m) => {
    const totalValue = visibleProjects.reduce(
      (sum, p) => sum + getProjectContractValue(p),
      0
    );
    const actual =
      totalValue > 0
        ? Math.round(
            visibleProjects.reduce(
              (sum, p) =>
                sum +
                selectProjectAcceptedProgress(progressSlice, p.id, m.end) *
                  getProjectContractValue(p),
              0
            ) / totalValue
          )
        : 0;
    const plan = selectWeightedTimeProgress(progressSlice, visibleProjects, m.end);
    return { name: m.label, actual, plan };
  });

  // Sparkline KPI 1: số dự án đã khởi công luỹ kế theo tháng (từ startDate thật)
  const startedSeries = monthEnds.map(
    (m) => visibleProjects.filter((p) => new Date(p.startDate) <= m.end).length
  );
  const startedThisMonth = visibleProjects.filter((p) => {
    const s = new Date(p.startDate);
    return s.getMonth() === now.getMonth() && s.getFullYear() === now.getFullYear();
  }).length;
  // Sparkline KPI 2: phân bổ nhiệm vụ chờ duyệt theo từng dự án (theo thứ tự danh sách)
  const pendingSeries = visibleProjects.map(
    (p) => visibleTasks.filter((t) => t.projectId === p.id && t.status === 'submitted').length
  );
  const pendingCodes = Array.from(
    new Set(
      pendingTasks
        .map((t) => visibleProjects.find((p) => p.id === t.projectId)?.code)
        .filter((c): c is string => Boolean(c))
    )
  );
  // Sparkline KPI 3: số ngày trễ của từng hạng mục quá hạn (tăng dần); 1 điểm thì thêm mốc 0
  const overdueDays = overdueTasks.map(daysLateOf).sort((a, b) => a - b);
  const overdueSeries = overdueDays.length === 1 ? [0, overdueDays[0]] : overdueDays;

  // Việc của chính user hiện tại (dùng cho view Giám sát/assignee)
  const myTasks = getUserTasks(currentUser.id);
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
  const animAvgProgress = useAnimatedNumber(overallProgress);
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

          {/* 4 CON SỐ CHO LÃNH ĐẠO */}
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
              <div className="text-[26px] leading-none font-black font-tabular text-pine-600 dark:text-pine-500 mt-2">
                {formatCurrencyVN(totalPaidVisible)}
              </div>
              <div className="text-xs text-ink-soft dark:text-slate-400 mt-2">
                Đạt {totalPaidPercent}% tổng ngân sách • Còn {formatCurrencyVN(remainingBudgetVisible)}
              </div>
              <ProgressBar value={mounted ? totalPaidPercent : 0} tone="gradient" className="mt-3" />
            </div>
            <StatCard
              label="Tiến độ Tổng thể (Trọng số Kinh phí)"
              value={`${animAvgProgress}%`}
              sub={`${statusCounts.approved} đạt nghiệm thu • ${statusCounts.in_progress} đang làm`}
              icon={<TrendingUp className="w-5 h-5" />}
              tone="indigo"
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
              title="Phân bổ trạng thái nhiệm vụ"
              subtitle={`${visibleTasks.length} nhiệm vụ thuộc ${visibleProjects.length} dự án được cấp`}
            >
              <div className="py-2">
                <TaskDonut counts={statusCounts} total={visibleTasks.length} />
              </div>
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
                          <td className="font-mono font-bold text-indigo-600 dark:text-indigo-300 whitespace-nowrap">{proj.code}</td>
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

          {/* LƯỚI SỨC KHOẺ DỰ ÁN ĐƯỢC CẤP QUYỀN */}
          <div className="space-y-4">
            <div>
              <h3 className="font-bold text-[15px] text-ink dark:text-white">
                Sức khoẻ các dự án được cấp quyền ({visibleProjects.length} dự án)
              </h3>
              <p className="text-xs text-ink-soft dark:text-slate-400 mt-0.5">
                Bạn chỉ thấy các dự án được Admin cấp quyền giám sát — bấm vào từng ô để xem chi
                tiết, kinh phí và gửi chỉ đạo.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2.5">
              {healthList.map(({ project: proj, progress, health }) => {
                const meta = HEALTH_META[health];
                const projTasks = tasks.filter((t) => t.projectId === proj.id && !t.isDeleted);
                const pMilestones = proj.paymentMilestones || [];
                const pBudget =
                  proj.budgetTotal ||
                  (pMilestones.length > 0 ? pMilestones.reduce((s, m) => s + m.amount, 0) : 0);
                return (
                  <Link
                    key={proj.id}
                    href={`/projects/${proj.id}`}
                    className="card flex items-center gap-3 p-3.5 hover:-translate-y-0.5 hover:shadow-lg transition-all min-w-0"
                  >
                    <RingProgress
                      value={progress}
                      size={52}
                      strokeWidth={5}
                      color={ringColorFor(progress, health)}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="text-[13px] font-bold text-ink dark:text-white truncate">
                        <span className="font-mono">{shortCode(proj.code)}</span>
                        <span className="font-semibold text-ink-soft dark:text-slate-400">
                          {' '}
                          · {shortProjectName(proj.name)}
                        </span>
                      </div>
                      <div className={cn('text-[11px] font-semibold flex items-center gap-1.5 mt-0.5', meta.text)}>
                        <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: meta.dot }} />
                        {meta.label}
                        <span className="text-ink-soft dark:text-slate-400 font-medium">
                          · {projTasks.filter((t) => t.status === 'approved').length}/{projTasks.length} việc đã duyệt
                          {pBudget > 0 ? ` · ${formatTy(pBudget)}` : ''}
                        </span>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-ink-soft/50 shrink-0" />
                  </Link>
                );
              })}
            </div>
          </div>

          {/* CHỈ ĐẠO TRỰC TIẾP CỦA LÃNH ĐẠO */}
          <div className="card p-5 sm:p-6 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-emerald-500 text-white flex items-center justify-center shrink-0 shadow-[0_8px_20px_rgba(99,102,241,0.35)]">
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
  // Bố cục bám sát Mẫu A — Aurora: hero vòng %, KPI có sparkline,
  // biểu đồ vùng + cột phải (chờ duyệt / sự cố / donut), lưới sức khoẻ.
  // ==========================================
  const isAdmin = currentUser.role === 'admin';
  const heroHeadline =
    overallProgress >= 60
      ? 'Tiến độ tổng thể toàn trường đang tăng tốc tốt'
      : overallProgress >= 25
        ? 'Tiến độ tổng thể toàn trường đang đi đúng nhịp'
        : overallProgress > 0
          ? 'Tiến độ tổng thể đang ở giai đoạn tăng tốc ban đầu'
          : 'Các dự án đang chờ khởi động';
  const todayLabel = `${WEEKDAYS_VI[now.getDay()]}, ${formatDateVN(now)}`;

  return (
    <AppShell>
      <div className="space-y-5">
        {/* Header kiểu Mẫu A: eyebrow trường + tiêu đề + ngày, hành động bên phải */}
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="min-w-0">
            <div className="eyebrow">Trường Đại học Phú Xuân</div>
            <h1 className="text-[23px] sm:text-[25px] font-extrabold text-ink dark:text-white tracking-tight mt-1">
              {isAdmin ? 'Tổng quan điều hành' : 'Tổng quan công việc'}
              <em className="not-italic text-ink-soft dark:text-slate-400 font-medium text-[15px] ml-2.5">
                {todayLabel}
              </em>
            </h1>
            <p className="text-[13px] text-ink-soft dark:text-slate-400 mt-1 max-w-2xl">
              {isAdmin
                ? `Xin chào, ${currentUser.name} — giao việc cho cộng sự, xác nhận các đợt nộp tiền kinh phí và thẩm định chất lượng thi công.`
                : `Xin chào, ${currentUser.name} — báo cáo tiến độ các dự án được phân công, gửi minh chứng thực địa và báo cáo trở ngại phát sinh.`}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {isAdmin && (
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
          </div>
        </div>

        {/* Leadership Directive Notification Banner if any */}
        {projectsWithDirectives.length > 0 && (
          <div className="card p-4 !border-indigo-300/50 dark:!border-indigo-500/30 bg-indigo-50/60 dark:bg-indigo-500/5 flex items-start gap-3">
            <Quote className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0 text-xs">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-300 text-[10px]">
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
                <div className="p-3 rounded-2xl bg-[#F8FAFC] dark:bg-night-line/40 border border-line dark:border-night-line">
                  <div className="font-mono text-2xl font-black text-ink dark:text-white">{animMyTasks}</div>
                  <div className="text-[10px] uppercase font-semibold text-ink-soft">Việc được giao</div>
                </div>
                <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/25">
                  <div className="font-mono text-2xl font-black text-rose-600">{animMyOverdue}</div>
                  <div className="text-[10px] uppercase font-semibold text-rose-500">Quá hạn của tôi</div>
                </div>
                <div className="p-3 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/25">
                  <div className="font-mono text-2xl font-black text-indigo-600 dark:text-indigo-300">{animMySubmitted}</div>
                  <div className="text-[10px] uppercase font-semibold text-indigo-500">Đang chờ duyệt</div>
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
                        className="flex items-center justify-between gap-3 px-3.5 py-3 bg-white dark:bg-night-card hover:bg-indigo-50/50 dark:hover:bg-white/5 transition-colors"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <StatusBadge tone="indigo">{proj?.code || 'DỰ ÁN'}</StatusBadge>
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

        {/* ============ HERO — vòng % + câu tổng quan TỰ SINH từ dữ liệu thật ============ */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: 'easeOut' }}
          className="card px-5 py-5 sm:px-[26px] flex flex-col lg:flex-row lg:items-center gap-6"
        >
          <RingProgress value={overallProgress} size={130} strokeWidth={11} label="Hoàn thành" />
          <div className="min-w-0 flex-1">
            <h2 className="text-[19px] font-extrabold text-ink dark:text-white tracking-tight">
              {heroHeadline}
            </h2>
            <p className="text-[13.5px] text-ink-soft dark:text-slate-400 leading-relaxed mt-1.5 max-w-[560px]">
              Tiến độ chung đạt <b className="text-ink dark:text-white">{overallProgress}%</b> (trọng số
              theo giá trị hợp đồng) trên{' '}
              <b className="text-ink dark:text-white">{visibleProjects.length} dự án</b>.{' '}
              {topEntry && (
                <>
                  Gói{' '}
                  <b className="text-ink dark:text-white">
                    {shortCode(topEntry.project.code)} đạt {topEntry.progress}%
                  </b>{' '}
                  — {topEntry.progress >= 95 ? 'chỉ còn bàn giao. ' : 'đang dẫn đầu toàn trường. '}
                </>
              )}
              {zeroEntry && (
                <>
                  Cần chú ý gói{' '}
                  <b className="text-ink dark:text-white">{shortCode(zeroEntry.project.code)} chưa khởi động</b>
                  {overdueTasks.length > 0 ? ' và ' : '.'}
                </>
              )}
              {overdueTasks.length > 0 && mostOverdueProject && (
                <>
                  <b className="text-ink dark:text-white">
                    {overdueTasks.length} hạng mục trễ hạn
                  </b>{' '}
                  tại {shortCode(mostOverdueProject.code)}.
                </>
              )}
              {!zeroEntry && overdueTasks.length === 0 && 'Hiện không có dự án nào chậm nhịp hay trễ hạn.'}
            </p>
            <div className="flex flex-wrap gap-2 mt-3.5">
              <span className="inline-flex items-center gap-1.5 text-[11.5px] font-semibold px-[11px] py-[5px] rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
                <span className="w-[7px] h-[7px] rounded-full bg-emerald-500" />
                {healthCounts.onTrack} dự án đúng tiến độ
              </span>
              <span className="inline-flex items-center gap-1.5 text-[11.5px] font-semibold px-[11px] py-[5px] rounded-full bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300">
                <span className="w-[7px] h-[7px] rounded-full bg-amber-500" />
                {healthCounts.attention} dự án cần đôn đốc
              </span>
              <span className="inline-flex items-center gap-1.5 text-[11.5px] font-semibold px-[11px] py-[5px] rounded-full bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300">
                <span className="w-[7px] h-[7px] rounded-full bg-rose-500" />
                {healthCounts.notStarted} dự án chưa khởi động
              </span>
            </div>
          </div>
          <div className="flex flex-wrap lg:flex-nowrap shrink-0">
            <div className="px-5 py-0.5 border-l border-line dark:border-night-line first:border-l-0 first:pl-0 lg:first:border-l lg:first:pl-5">
              <b className="text-[21px] font-extrabold font-tabular text-ink dark:text-white block leading-tight">
                {formatTy(totalBudgetVisible)}
              </b>
              <span className="text-[11px] text-ink-soft dark:text-slate-400 font-medium">Tổng kinh phí</span>
            </div>
            <div className="px-5 py-0.5 border-l border-line dark:border-night-line">
              <b className="text-[21px] font-extrabold font-tabular text-ink dark:text-white block leading-tight">
                {formatTy(totalPaidVisible)}
              </b>
              <span className="text-[11px] text-ink-soft dark:text-slate-400 font-medium">
                Đã giải ngân · {totalPaidPercent}%
              </span>
            </div>
            <div className="px-5 py-0.5 border-l border-line dark:border-night-line">
              <b className="text-[21px] font-extrabold font-tabular text-ink dark:text-white block leading-tight">
                {visibleTasks.length}
              </b>
              <span className="text-[11px] text-ink-soft dark:text-slate-400 font-medium">
                Nhiệm vụ đang quản lý
              </span>
            </div>
          </div>
        </motion.section>

        {/* ============ KPI — sparkline thật từ store (xem AURORA-REPORT) ============ */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: 'easeOut', delay: 0.05 }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-4"
        >
          <StatCard
            label="Dự án đang triển khai"
            spark={<Sparkline data={startedSeries} color="#6366F1" />}
            value={
              <>
                {animProjects}{' '}
                <small className="text-sm text-slate-400 font-semibold">dự án</small>
              </>
            }
            sub={
              startedThisMonth > 0 ? (
                <>
                  <b className="text-emerald-600 dark:text-emerald-400">+{startedThisMonth}</b> khởi
                  công trong tháng {now.getMonth() + 1}
                </>
              ) : (
                `Chưa có dự án khởi công trong tháng ${now.getMonth() + 1}`
              )
            }
          />
          <StatCard
            label="Nhiệm vụ chờ duyệt"
            spark={<Sparkline data={pendingSeries} color="#F59E0B" />}
            value={
              <>
                {animPending}{' '}
                <small className="text-sm text-slate-400 font-semibold">nhiệm vụ</small>
              </>
            }
            sub={
              pendingTasks.length > 0 ? (
                <>
                  Từ {pendingCodes.slice(0, 2).map(shortCode).join(' và ')}
                  {pendingCodes.length > 2 ? '…' : ''} ·{' '}
                  <b className="text-emerald-600 dark:text-emerald-400">cần xử lý hôm nay</b>
                </>
              ) : (
                'Không có nhiệm vụ chờ duyệt'
              )
            }
          />
          <StatCard
            label="Hạng mục trễ hạn"
            spark={<Sparkline data={overdueSeries} color="#F43F5E" />}
            value={
              <>
                {animOverdue}{' '}
                <small className="text-sm text-slate-400 font-semibold">hạng mục</small>
              </>
            }
            valueClassName={overdueTasks.length > 0 ? '!text-rose-600 dark:!text-rose-400' : undefined}
            sub={
              mostOverdueTask ? (
                <span className="block truncate" title={mostOverdueTask.title}>
                  Trễ{' '}
                  <b className="text-rose-600 dark:text-rose-400">{daysLateOf(mostOverdueTask)} ngày</b>{' '}
                  · {mostOverdueTask.title}
                </span>
              ) : (
                'Không có hạng mục trễ hạn'
              )
            }
          />
          <StatCard
            label="Giải ngân kinh phí"
            value={
              <>
                {totalPaidPercent}
                <small className="text-sm text-slate-400 font-semibold">%</small>
              </>
            }
            sub={
              <>
                {formatTy(totalPaidVisible)} / {formatTy(totalBudgetVisible)} ₫ đã thanh toán
                <ProgressBar
                  value={mounted ? totalPaidPercent : 0}
                  tone="gradient"
                  h="h-1.5"
                  className="mt-2.5"
                />
              </>
            }
          />
        </motion.div>

        {/* ============ LƯỚI CHÍNH: trái = biểu đồ vùng + sức khoẻ; phải = chờ duyệt / sự cố / donut ============ */}
        <div className="grid grid-cols-1 xl:grid-cols-[1.55fr_1fr] gap-5 items-start">
          <div className="space-y-5 min-w-0">
            <motion.div {...fadeUp}>
              <SectionCard
                title="Tiến độ nghiệm thu theo tháng"
                subtitle="Đường liền: % khối lượng đã nghiệm thu (luỹ kế, trọng số kinh phí) · Đường đứt: kế hoạch theo thời gian"
                action={
                  isAdmin ? (
                    <Link href="/reports" className="text-xs font-bold text-indigo-600 dark:text-indigo-300 hover:underline">
                      Xem báo cáo →
                    </Link>
                  ) : (
                    <Link href="/projects" className="text-xs font-bold text-indigo-600 dark:text-indigo-300 hover:underline">
                      Xem dự án →
                    </Link>
                  )
                }
              >
                <ProgressAreaChart data={areaData} />
              </SectionCard>
            </motion.div>

            <motion.div {...fadeUp}>
              <SectionCard
                title={`Sức khoẻ ${visibleProjects.length} dự án`}
                subtitle="Mọi dự án trong phạm vi bạn được xem — bấm vào ô để mở chi tiết"
                action={
                  <Link href="/projects" className="btn-quiet">
                    Tất cả dự án →
                  </Link>
                }
              >
                {healthList.length === 0 ? (
                  <EmptyState
                    icon={<Layers className="w-7 h-7" />}
                    title="Chưa có dự án nào trong phạm vi hiển thị"
                    description="Khi được cấp quyền dự án, ô sức khoẻ sẽ hiện tại đây."
                  />
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2.5">
                    {healthList.map(({ project: p, progress, health }) => {
                      const meta = HEALTH_META[health];
                      return (
                        <Link
                          key={p.id}
                          href={`/projects/${p.id}`}
                          className="flex items-center gap-2.5 p-2.5 rounded-[15px] border border-line dark:border-night-line bg-white/70 dark:bg-white/[0.03] hover:shadow-[0_10px_24px_-12px_rgba(15,23,42,0.25)] hover:-translate-y-px transition-all min-w-0"
                        >
                          <RingProgress
                            value={progress}
                            size={46}
                            strokeWidth={4.5}
                            color={ringColorFor(progress, health)}
                          />
                          <div className="min-w-0">
                            <div className="text-xs font-bold text-ink dark:text-white truncate">
                              <span className="font-mono">{shortCode(p.code)}</span>
                              <span className="font-semibold text-ink-soft dark:text-slate-400">
                                {' '}
                                · {shortProjectName(p.name)}
                              </span>
                            </div>
                            <div
                              className={cn(
                                'text-[10.5px] font-semibold flex items-center gap-1.5 mt-0.5',
                                meta.text
                              )}
                            >
                              <span
                                className="w-1.5 h-1.5 rounded-full shrink-0"
                                style={{ background: meta.dot }}
                              />
                              {meta.label}
                            </div>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </SectionCard>
            </motion.div>
          </div>

          <div className="space-y-5 min-w-0">
            {/* Chờ bạn duyệt — task submitted thật, nút Duyệt là text-link */}
            <motion.div {...fadeUp}>
              <SectionCard
                title="Chờ bạn duyệt"
                action={
                  <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300">
                    {pendingTasks.length} việc
                  </span>
                }
              >
                {pendingTasks.length === 0 ? (
                  <p className="text-xs text-ink-soft dark:text-slate-400 py-2">
                    Không có nhiệm vụ nào đang chờ duyệt. Mọi báo cáo đã được xử lý nghiệm thu.
                  </p>
                ) : (
                  <div>
                    {pendingTasks.slice(0, 3).map((t, idx) => {
                      const proj = visibleProjects.find((p) => p.id === t.projectId);
                      const assigneeName =
                        users.find((u) => u.id === t.assigneeId)?.name || 'Giám sát';
                      const box =
                        idx % 2 === 0
                          ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-300'
                          : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300';
                      return (
                        <div
                          key={t.id}
                          role="button"
                          tabIndex={0}
                          onClick={() => {
                            if (isAdmin) setSelectedApprovalTask(t);
                            else router.push(`/projects/${t.projectId}?tab=tasks&taskId=${t.id}`);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              if (isAdmin) setSelectedApprovalTask(t);
                              else router.push(`/projects/${t.projectId}?tab=tasks&taskId=${t.id}`);
                            }
                          }}
                          className="flex items-center gap-[11px] py-2.5 border-b border-dashed border-line dark:border-night-line last:border-b-0 last:pb-0 first:pt-0 cursor-pointer hover:bg-indigo-50/40 dark:hover:bg-white/[0.03] rounded-lg px-1 -mx-1 transition-colors"
                        >
                          <span className={cn('w-[33px] h-[33px] rounded-[10px] flex items-center justify-center shrink-0', box)}>
                            <CheckCircle2 className="w-4 h-4" />
                          </span>
                          <div className="min-w-0 flex-1">
                            <b className="text-[13px] font-bold text-ink dark:text-white block truncate">
                              {t.title}
                            </b>
                            <span className="text-[11.5px] text-ink-soft dark:text-slate-400 block truncate">
                              {proj ? shortCode(proj.code) : 'DỰ ÁN'} · {assigneeName} báo cáo
                            </span>
                          </div>
                          <span className="shrink-0 text-[10.5px] font-bold px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-300">
                            {isAdmin ? 'Duyệt →' : 'Xem →'}
                          </span>
                        </div>
                      );
                    })}
                    {pendingTasks.length > 3 && (
                      <p className="text-[11px] text-ink-soft dark:text-slate-400 pt-2.5">
                        …và còn {pendingTasks.length - 3} nhiệm vụ khác đang chờ trong các dự án.
                      </p>
                    )}
                  </div>
                )}
              </SectionCard>
            </motion.div>

            {/* Sự cố hiện trường — incidents thật chưa xử lý xong */}
            <motion.div {...fadeUp}>
              <SectionCard
                title="Sự cố hiện trường"
                action={
                  <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300">
                    {unresolvedIncidents.length} đang mở
                  </span>
                }
              >
                {unresolvedIncidents.length === 0 ? (
                  <p className="text-xs text-ink-soft dark:text-slate-400 py-2">
                    Không có sự cố nào đang mở. Hiện trường đang trong tầm kiểm soát.
                  </p>
                ) : (
                  <div>
                    {unresolvedIncidents.slice(0, 3).map((inc) => {
                      const task = tasks.find((t) => t.id === inc.taskId);
                      const proj = task
                        ? visibleProjects.find((p) => p.id === task.projectId)
                        : undefined;
                      const severe = inc.severity === 'high' || inc.severity === 'critical';
                      const box = severe
                        ? 'bg-rose-50 text-rose-500 dark:bg-rose-500/15 dark:text-rose-300'
                        : inc.severity === 'medium'
                          ? 'bg-amber-50 text-amber-600 dark:bg-amber-500/15 dark:text-amber-300'
                          : 'bg-slate-100 text-slate-500 dark:bg-slate-500/15 dark:text-slate-300';
                      const tag = severe
                        ? 'bg-rose-50 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300'
                        : inc.severity === 'medium'
                          ? 'bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300'
                          : 'bg-slate-100 text-slate-600 dark:bg-slate-500/15 dark:text-slate-300';
                      return (
                        <div
                          key={inc.id}
                          className="flex items-center gap-[11px] py-2.5 border-b border-dashed border-line dark:border-night-line last:border-b-0 last:pb-0 first:pt-0"
                        >
                          <span className={cn('w-[33px] h-[33px] rounded-[10px] flex items-center justify-center shrink-0', box)}>
                            <AlertTriangle className="w-4 h-4" />
                          </span>
                          <div className="min-w-0 flex-1">
                            <b className="text-[13px] font-bold text-ink dark:text-white block truncate">
                              {inc.title}
                            </b>
                            <span className="text-[11.5px] text-ink-soft dark:text-slate-400 block truncate">
                              {proj ? shortCode(proj.code) : 'DỰ ÁN'} · {task?.title || ''}
                            </span>
                          </div>
                          <span className={cn('shrink-0 text-[10.5px] font-bold px-2.5 py-1 rounded-full', tag)}>
                            {SEVERITY_SHORT[inc.severity]}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </SectionCard>
            </motion.div>

            {/* Donut phân bổ nhiệm vụ */}
            <motion.div {...fadeUp}>
              <SectionCard
                title={`Phân bổ ${visibleTasks.length} nhiệm vụ`}
                subtitle="Theo trạng thái xử lý hiện tại"
              >
                <TaskDonut counts={statusCounts} total={visibleTasks.length} />
              </SectionCard>
            </motion.div>
          </div>
        </div>

        {/* Cảnh báo tự động — suy ra từ dữ liệu thật qua selectAllAlerts */}
        {isAdmin && projectAlerts.length > 0 && (
          <SectionCard
            title="Cảnh báo"
            subtitle="Tự động suy ra từ task quá hạn, sự cố, mốc thanh toán và hạn hợp đồng"
            action={<span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300">{projectAlerts.length} cảnh báo</span>}
          >
            <ul className="divide-y divide-line dark:divide-night-line">
              {projectAlerts.slice(0, 12).map((a) => (
                <li key={a.id} className="py-2">
                  <Link href={a.href} className="flex items-start gap-2 text-[13px] hover:text-indigo-600 dark:hover:text-indigo-300">
                    <AlertTriangle className={`w-4 h-4 shrink-0 mt-0.5 ${a.severity === 'critical' || a.severity === 'high' ? 'text-rose-500' : a.severity === 'medium' ? 'text-amber-500' : 'text-slate-400'}`} />
                    <span><strong className="font-bold">{a.projectCode}</strong> — {a.text}</span>
                  </Link>
                </li>
              ))}
            </ul>
            {projectAlerts.length > 12 && <p className="text-[11px] text-ink-soft dark:text-slate-400 pt-2">…và còn {projectAlerts.length - 12} cảnh báo khác trong các gói.</p>}
          </SectionCard>
        )}

        {/* Kinh phí & Dòng hoạt động */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">
          <SectionCard
            className="lg:col-span-2"
            title="Tiến độ Kinh phí & Các đợt nộp tiền"
            subtitle="Theo dõi tiến độ giải ngân theo hợp đồng thi công"
            action={<StatusBadge tone="pine">Đã nộp {totalPaidPercent}%</StatusBadge>}
          >
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-4 rounded-2xl bg-[#F8FAFC] dark:bg-night-line/40 border border-line dark:border-night-line text-xs">
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
            title="Dòng hoạt động gần nhất"
            action={
              isAdmin ? (
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
                      <span className="font-medium text-indigo-600 dark:text-indigo-300">{log.action}: </span>
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
