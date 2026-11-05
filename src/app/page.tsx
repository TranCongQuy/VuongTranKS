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
  ShieldCheck,
  UserCheck,
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
  Receipt,
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
      <div className="py-10 text-center text-xs text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
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
      <div className="py-10 text-center text-xs text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
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
        <Bar dataKey="progress" fill="#F59E0B" radius={[6, 6, 0, 0]} maxBarSize={44} />
      </BarChart>
    </ResponsiveContainer>
  );
}

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
        <div className="space-y-6 sm:space-y-8">
          {/* Executive Header Banner */}
          <div className="relative overflow-hidden rounded-3xl bg-linear-to-r from-emerald-500/10 via-white to-emerald-500/5 dark:from-[#0B132B] dark:via-[#1C2541] dark:to-[#0F172A] text-slate-900 dark:text-white p-6 sm:p-8 shadow-xs border border-emerald-500/30 dark:border-slate-800">
            <div className="safety-stripe absolute inset-0 opacity-15 pointer-events-none" />
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5">
                    <Eye className="w-4 h-4" />
                    Chế độ Giám sát Cấp cao • Ban Lãnh đạo
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[11px] font-mono border border-slate-200 dark:border-slate-700">
                    Được phân quyền: {visibleProjects.length} dự án
                  </span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                  Bảng Chỉ số Điều hành Dự án • {currentUser.name}
                </h1>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1 max-w-2xl leading-relaxed">
                  Tổng hợp số liệu tiến độ thi công, phân kỳ dòng tiền kinh phí và các trở ngại hiện trường theo thời gian thực.
                </p>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <Link
                  href="/reports"
                  className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 transition-all flex items-center gap-2"
                >
                  <FileText className="w-4 h-4" />
                  Báo cáo & Xuất PDF
                </Link>
                <Link
                  href="/projects"
                  className="px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-white font-semibold text-xs border border-slate-200 dark:border-slate-700 transition-colors flex items-center gap-1.5 shadow-xs"
                >
                  <span>Xem {visibleProjects.length} dự án</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>

          {/* 4 CON SỐ VÀNG CHO LÃNH ĐẠO (BIG NUMBERS ONLY - NO WALLS OF TEXT) */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: 'easeOut' }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6"
          >
            {/* KPI 1: TỔNG KINH PHÍ GIÁM SÁT */}
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider">
                  Tổng Kinh phí Giám sát
                </span>
                <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center font-bold">
                  <DollarSign className="w-5 h-5" />
                </div>
              </div>
              <div className="font-mono text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-2">
                {formatCurrencyVN(totalBudgetVisible)}
              </div>
              <div className="mt-2 text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <span className="font-bold text-amber-600 dark:text-amber-400">
                  {visibleProjects.length} dự án
                </span>
                <span>thuộc phạm vi phê duyệt của Lãnh đạo</span>
              </div>
            </div>

            {/* KPI 2: ĐÃ GIẢI NGÂN / NỘP */}
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group">
              <div className="flex items-center justify-between text-emerald-500 mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider">
                  Đã giải ngân / Đã nộp
                </span>
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-bold">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
              </div>
              <div className="font-mono text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400 mt-2">
                {formatCurrencyVN(totalPaidVisible)}
              </div>
              <div className="mt-2 flex items-center justify-between text-[11px]">
                <span className="font-bold text-emerald-600">Đạt {totalPaidPercent}% tổng ngân sách</span>
                <span className="text-slate-400">Còn {formatCurrencyVN(remainingBudgetVisible)}</span>
              </div>
              <div className="mt-2 w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all duration-700 ease-out"
                  style={{ width: mounted ? `${totalPaidPercent}%` : '0%' }}
                />
              </div>
            </div>

            {/* KPI 3: TIẾN ĐỘ THI CÔNG TRUNG BÌNH */}
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider">
                  Tiến độ Thi công Trung bình
                </span>
                <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center font-bold">
                  <TrendingUp className="w-5 h-5" />
                </div>
              </div>
              <div className="font-mono text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-2">
                {animAvgProgress}%
              </div>
              <div className="mt-2 text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-2">
                <span className="font-semibold text-emerald-600">
                  {statusCounts.approved} đạt nghiệm thu
                </span>
                <span>•</span>
                <span className="text-amber-600 font-semibold">{statusCounts.in_progress} đang làm</span>
              </div>
            </div>

            {/* KPI 4: RỦI RO & SỰ CỐ HIỆN TRƯỜNG */}
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group">
              <div className="flex items-center justify-between text-rose-500 mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider">
                  Trở ngại & Sự cố Hiện trường
                </span>
                <div className="w-9 h-9 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center font-bold">
                  <AlertTriangle className="w-5 h-5" />
                </div>
              </div>
              <div className="font-mono text-2xl sm:text-3xl font-black text-rose-600 mt-2">
                {animIncidents} sự cố
              </div>
              <div className="mt-2 text-[11px] font-medium text-rose-500 flex items-center gap-1">
                {unresolvedIncidents.length > 0 ? (
                  <>
                    <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                    Cần theo dõi biện pháp khắc phục
                  </>
                ) : (
                  <span className="text-emerald-600 font-semibold">Tất cả đều trong tầm kiểm soát</span>
                )}
              </div>
            </div>
          </motion.div>

          {/* BIỂU ĐỒ LÃNH ĐẠO: TIẾN ĐỘ DỰ ÁN ĐƯỢC CẤP & PHÂN BỐ TRẠNG THÁI */}
          <motion.div {...fadeUp} className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            <div className="lg:col-span-3 p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
              <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
                Tiến độ các dự án được cấp quyền (%)
              </h3>
              <p className="text-xs text-slate-400 mb-2">
                Tính từ nghiệm thu thực tế của từng dự án thuộc phạm vi giám sát của bạn
              </p>
              <ProjectProgressBars data={projectProgressData} />
            </div>
            <div className="lg:col-span-2 p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
              <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
                Phân bố trạng thái nhiệm vụ
              </h3>
              <p className="text-xs text-slate-400 mb-2">
                {visibleTasks.length} nhiệm vụ thuộc {visibleProjects.length} dự án được cấp
              </p>
              <StatusDonut data={statusChartData} total={visibleTasks.length} />
            </div>
          </motion.div>

          {/* KHỐI 1: BẢNG SỐ LIỆU THEO DÕI CÁC ĐỢT NỘP TIỀN (FINANCIAL MILESTONES COCKPIT) */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Receipt className="w-5 h-5 text-amber-500" />
                  Bảng Theo dõi Phân kỳ Kinh phí & Các đợt nộp tiền
                </h3>
                <p className="text-xs text-slate-400">
                  Đối soát dòng tiền thực tế theo từng đợt của các dự án được Lãnh đạo giám sát
                </p>
              </div>
              <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                Đã thu nộp {formatCurrencyVN(totalPaidVisible)} / {formatCurrencyVN(totalBudgetVisible)}
              </span>
            </div>

            <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 uppercase tracking-wider font-semibold">
                    <tr>
                      <th className="py-3 px-4">Dự án</th>
                      <th className="py-3 px-4">Đợt nộp & Hạng mục</th>
                      <th className="py-3 px-4 text-center">Tỷ lệ</th>
                      <th className="py-3 px-4">Số tiền (VNĐ)</th>
                      <th className="py-3 px-4">Hạn nộp</th>
                      <th className="py-3 px-4">Ngày nộp</th>
                      <th className="py-3 px-4 text-right">Trạng thái nộp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {visibleProjects.flatMap((proj) =>
                      (proj.paymentMilestones || []).map((m) => {
                        const isPaid = m.status === 'paid';
                        const isOverdue = m.status === 'overdue';
                        return (
                          <tr
                            key={m.id}
                            className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                          >
                            <td className="py-3 px-4 font-mono font-bold text-amber-600 dark:text-amber-400 whitespace-nowrap">
                              {proj.code}
                            </td>
                            <td className="py-3 px-4 font-bold text-slate-900 dark:text-slate-100 max-w-xs">
                              <div>{m.title}</div>
                              <div className="text-[10px] text-slate-400 line-clamp-1 font-normal">
                                {m.description || m.note}
                              </div>
                            </td>
                            <td className="py-3 px-4 text-center font-mono font-bold text-slate-600 dark:text-slate-300">
                              {m.percentage}%
                            </td>
                            <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-white whitespace-nowrap">
                              {formatCurrencyVN(m.amount)}
                            </td>
                            <td className="py-3 px-4 font-mono text-slate-600 dark:text-slate-400 whitespace-nowrap">
                              {formatDateVN(m.dueDate)}
                            </td>
                            <td className="py-3 px-4 font-mono text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                              {m.paidDate ? formatDateVN(m.paidDate) : '—'}
                            </td>
                            <td className="py-3 px-4 text-right whitespace-nowrap">
                              {isPaid ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                                  <Check className="w-3 h-3 stroke-[3]" />
                                  ĐÃ NỘP
                                </span>
                              ) : isOverdue ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                                  <AlertTriangle className="w-3 h-3" />
                                  QUÁ HẠN
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                                  <Clock className="w-3 h-3" />
                                  SẮP ĐẾN HẠN
                                </span>
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

          {/* KHỐI 2: THẺ DỰ ÁN TRỌNG ĐIỂM (CON SỐ TIẾN ĐỘ & KINH PHÍ CỰC TO) */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
                  Tiến độ & Chỉ số Từng Dự án Giám sát ({visibleProjects.length} dự án)
                </h3>
                <p className="text-xs text-slate-400">
                  Bạn chỉ thấy các dự án được Admin cấp quyền giám sát — hiện tại gồm{' '}
                  {visibleProjects.length} dự án
                  {visibleProjects.length > 0
                    ? `: ${visibleProjects.map((p) => p.code).join(', ')}`
                    : ''}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                  <div
                    key={proj.id}
                    className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between space-y-5"
                  >
                    <div>
                      {/* Top Code & Badges */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-amber-500/15 text-amber-600 dark:text-amber-400">
                            {proj.code}
                          </span>
                          {catConfig && (
                            <span className={`text-[11px] font-semibold px-2 py-0.5 rounded border ${catConfig.badge}`}>
                              {catConfig.label}
                            </span>
                          )}
                        </div>

                        {openProjIncidents.length > 0 ? (
                          <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-rose-500/15 text-rose-600 dark:text-rose-400 flex items-center gap-1 border border-rose-500/20">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            {openProjIncidents.length} sự cố hiện trường
                          </span>
                        ) : (
                          <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            An toàn kỹ thuật
                          </span>
                        )}
                      </div>

                      <h3 className="text-lg font-black text-slate-900 dark:text-white leading-tight">
                        {proj.name}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                        {proj.description}
                      </p>

                      {/* Numbers Bar (Tiền & Tiến độ cực to) */}
                      <div className="grid grid-cols-3 gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 mt-4 text-xs">
                        <div className="flex items-center gap-3">
                          <CircularProgress
                            value={projProgress}
                            size={48}
                            strokeWidth={5}
                            color={projProgress === 100 ? '#10B981' : '#F59E0B'}
                            label=""
                          />
                          <div>
                            <span className="text-[10px] text-slate-400 uppercase font-semibold block">Tiến độ</span>
                            <div className="font-mono text-lg font-black text-amber-500">
                              {projProgress}%
                            </div>
                            <span className="text-[10px] text-slate-400">
                              {projTasks.filter((t) => t.status === 'approved').length}/{projTasks.length} duyệt
                            </span>
                          </div>
                        </div>

                        <div>
                          <span className="text-[10px] text-emerald-500 uppercase font-semibold block">Đã nộp kinh phí</span>
                          <div className="font-mono text-base font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
                            {formatCurrencyVN(pPaid)}
                          </div>
                          <span className="text-[10px] text-emerald-600 font-semibold">
                            {pPercent}% tổng mức
                          </span>
                        </div>

                        <div>
                          <span className="text-[10px] text-slate-400 uppercase font-semibold block">Tổng dự toán</span>
                          <div className="font-mono text-base font-black text-slate-900 dark:text-white mt-0.5">
                            {formatCurrencyVN(pBudget)}
                          </div>
                          <span className="text-[10px] text-slate-400">
                            {pMilestones.length} đợt phân kỳ
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Bottom Actions */}
                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                      <span className="text-xs text-slate-400">
                        Chủ trì:{' '}
                        <strong className="text-slate-700 dark:text-slate-300">
                          {users.find((u) => u.id === proj.managerId)?.name || '—'}
                        </strong>
                      </span>
                      <Link
                        href={`/projects/${proj.id}`}
                        className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white dark:bg-amber-500 dark:hover:bg-amber-400 dark:text-slate-950 font-bold text-xs transition-all flex items-center gap-1.5 shadow-sm"
                      >
                        <span>Vào xem chi tiết dự án</span>
                        <ChevronRight className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* KHỐI 3: CÔNG CỤ CHỈ ĐẠO TRỰC TIẾP CỦA LÃNH ĐẠO */}
          <div className="p-6 rounded-3xl bg-linear-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/30 shadow-xs space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-bold">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                  Gửi Ý kiến Chỉ đạo Nhanh từ Lãnh đạo
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Thông báo chỉ đạo sẽ được gửi tức thì đến Chủ trì dự án và các cộng sự phụ trách
                </p>
              </div>
            </div>

            <form onSubmit={handleSendQuickDirective} className="flex flex-col sm:flex-row gap-3 pt-1">
              <select
                value={effectiveDirectiveProjectId}
                onChange={(e) => setSelectedDirectiveProjectId(e.target.value)}
                className="px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-amber-500"
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
                className="flex-1 px-4 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-amber-500"
              />

              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md shadow-amber-500/20 flex items-center justify-center gap-2 shrink-0"
              >
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
      <div className="space-y-6 sm:space-y-8">
        {/* Welcome Executive Banner */}
        <div className="relative overflow-hidden rounded-3xl bg-linear-to-r from-amber-500/10 via-white to-amber-500/5 dark:from-[#0F172A] dark:via-[#1E293B] dark:to-[#0B132B] text-slate-900 dark:text-white p-6 sm:p-8 shadow-xs border border-amber-500/30 dark:border-slate-800">
          <div className="safety-stripe absolute inset-0 opacity-15 pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-500/30 text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5">
                  {currentUser.role === 'admin' && <ShieldCheck className="w-3.5 h-3.5" />}
                  {currentUser.role === 'assignee' && <UserCheck className="w-3.5 h-3.5" />}
                  <span>{currentUser.title}</span>
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                Xin chào, {currentUser.name}!
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1 max-w-2xl leading-relaxed">
                {currentUser.role === 'admin' &&
                  'Bảng điều hành tổng thể: giao việc cho cộng sự, xác nhận các đợt nộp tiền kinh phí và thẩm định chất lượng thi công.'}
                {currentUser.role === 'assignee' &&
                  'Sổ tay kỹ sư hiện trường: báo cáo tiến độ các dự án được phân công, gửi minh chứng thực địa và báo cáo trở ngại phát sinh.'}
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              {currentUser.role === 'admin' && (
                <Link
                  href="/tasks/new"
                  className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 transition-all flex items-center gap-2"
                >
                  <PlusCircle className="w-4 h-4" />
                  Giao việc mới
                </Link>
              )}
              {currentUser.role === 'assignee' && (
                <Link
                  href="/my-tasks"
                  className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 transition-all flex items-center gap-2"
                >
                  <CheckSquare className="w-4 h-4" />
                  Việc của tôi ({visibleTasks.filter((t) => t.assigneeId === currentUser.id).length})
                </Link>
              )}
              <Link
                href="/projects"
                className="px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-800 dark:bg-slate-800/80 dark:hover:bg-slate-700 dark:text-slate-200 text-xs font-semibold border border-slate-200 dark:border-slate-700 transition-colors flex items-center gap-1.5 shadow-xs"
              >
                <span>Tất cả kế hoạch</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>

        {/* Leadership Directive Notification Banner if any */}
        {projectsWithDirectives.length > 0 && (
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-slate-800 dark:text-slate-100 flex items-start gap-3 shadow-xs">
            <Quote className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0 text-xs">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 text-[10px]">
                  Ý kiến chỉ đạo trọng tâm từ Lãnh đạo
                </span>
                <span className="font-mono text-slate-400 text-[10px]">
                  • {projectsWithDirectives[0].code}
                </span>
              </div>
              <p className="italic text-slate-700 dark:text-slate-200 leading-relaxed font-medium">
                &ldquo;{projectsWithDirectives[0].directive?.content}&rdquo;
              </p>
              <div className="text-[10px] text-slate-400 mt-1">
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
            className="p-6 rounded-3xl bg-white dark:bg-slate-900 border-2 border-amber-500/40 shadow-sm space-y-4"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="font-black text-lg text-slate-900 dark:text-white">
                  Việc của tôi hôm nay
                </h2>
                <p className="text-xs text-slate-400">
                  Các nhiệm vụ được giao cho {currentUser.name}, ưu tiên việc sắp tới hạn và quá hạn
                </p>
              </div>
              <Link
                href="/my-tasks"
                className="px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm shadow-lg shadow-amber-500/25 transition-all flex items-center justify-center gap-2 shrink-0"
              >
                <Send className="w-4 h-4" />
                Báo cáo tiến độ
              </Link>
            </div>

            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
                <div className="font-mono text-2xl font-black text-slate-900 dark:text-white">
                  {animMyTasks}
                </div>
                <div className="text-[10px] uppercase font-semibold text-slate-400">
                  Việc được giao
                </div>
              </div>
              <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800/50">
                <div className="font-mono text-2xl font-black text-rose-600">{animMyOverdue}</div>
                <div className="text-[10px] uppercase font-semibold text-rose-400">
                  Quá hạn của tôi
                </div>
              </div>
              <div className="p-3 rounded-2xl bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-800/50">
                <div className="font-mono text-2xl font-black text-indigo-600">
                  {animMySubmitted}
                </div>
                <div className="text-[10px] uppercase font-semibold text-indigo-400">
                  Đang chờ duyệt
                </div>
              </div>
            </div>

            {myUpcomingTasks.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-2">
                Bạn chưa có nhiệm vụ nào đang mở. Khi được giao việc mới, nhiệm vụ sẽ hiện tại đây.
              </p>
            ) : (
              <div className="space-y-2">
                {myUpcomingTasks.map((t) => {
                  const proj = visibleProjects.find((p) => p.id === t.projectId);
                  const overdue = isOverdueTask(t);
                  return (
                    <Link
                      key={t.id}
                      href={`/projects/${t.projectId}?tab=tasks&taskId=${t.id}`}
                      className="flex items-center justify-between gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 hover:border-amber-400/60 transition-colors"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold">
                            {proj?.code || 'DỰ ÁN'}
                          </span>
                          <span className="text-[11px] font-semibold text-slate-500">
                            {TASK_STATUS_CONFIG[t.status].label} • {t.progress}%
                          </span>
                        </div>
                        <div className="font-bold text-sm text-slate-900 dark:text-slate-100 truncate mt-0.5">
                          {t.title}
                        </div>
                      </div>
                      <span
                        className={`text-[11px] font-bold whitespace-nowrap flex items-center gap-1 ${
                          overdue ? 'text-rose-600' : 'text-slate-500'
                        }`}
                      >
                        <Calendar className="w-3.5 h-3.5" />
                        {overdue ? 'Quá hạn: ' : 'Hạn: '}
                        {formatDateVN(t.dueDate)}
                      </span>
                    </Link>
                  );
                })}
              </div>
            )}
          </motion.section>
        )}

        {/* 4 Primary Metric Cards */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: 'easeOut', delay: 0.05 }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6"
        >
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Dự án mục tiêu
              </span>
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
                <Layers className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-3xl font-black font-tabular text-slate-900 dark:text-white">
                {animProjects}
              </span>
              <span className="text-xs text-slate-400 ml-1.5">chương trình</span>
            </div>
            <div className="mt-2 text-[11px] text-slate-500 flex items-center gap-1">
              <span className="text-emerald-600 font-semibold">{activeProjectsPercent}%</span>
              <span>
                đang triển khai ({activeProjectsCount}/{visibleProjects.length} dự án)
              </span>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Nhiệm vụ chờ duyệt
              </span>
              <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
                <FileCheck className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-3xl font-black font-tabular text-slate-900 dark:text-white">
                {animPending}
              </span>
              <span className="text-xs text-slate-400 ml-1.5">đã nộp kết quả</span>
            </div>
            <div className="mt-2 text-[11px] text-indigo-600 dark:text-indigo-400 font-medium">
              Chờ Chủ trì dự án nghiệm thu
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Hạng mục trễ hạn
              </span>
              <div className="w-9 h-9 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-3xl font-black font-tabular text-rose-600">
                {animOverdue}
              </span>
              <span className="text-xs text-slate-400 ml-1.5">cần đôn đốc</span>
            </div>
            <div className="mt-2 text-[11px] text-rose-500 font-medium">
              Cần nhắc nhở cộng sự phụ trách
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Tiến độ tổng thể
              </span>
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                <TrendingUp className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-3xl font-black font-tabular text-slate-900 dark:text-white">
                {animAvgProgress}%
              </span>
            </div>
            <div className="mt-2 text-[11px] text-slate-500">
              Chỉ đạt 100% khi tất cả đã nghiệm thu
            </div>
          </div>
        </motion.div>

        {/* BIỂU ĐỒ TỔNG QUAN: TIẾN ĐỘ TỪNG DỰ ÁN & PHÂN BỐ TRẠNG THÁI NHIỆM VỤ */}
        <motion.div {...fadeUp} className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div className="lg:col-span-3 p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
            <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
              Tiến độ theo từng dự án (%)
            </h3>
            <p className="text-xs text-slate-400 mb-2">
              Tiến độ nghiệm thu thực tế của {visibleProjects.length} dự án trong phạm vi hiển thị
            </p>
            <ProjectProgressBars data={projectProgressData} />
          </div>
          <div className="lg:col-span-2 p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
            <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
              Phân bố trạng thái nhiệm vụ
            </h3>
            <p className="text-xs text-slate-400 mb-2">
              Tổng {visibleTasks.length} nhiệm vụ thuộc các dự án đang hiển thị
            </p>
            <StatusDonut data={statusChartData} total={visibleTasks.length} />
          </div>
        </motion.div>

        {/* Dual Section: Financial Overview & Field Incidents Monitoring */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Card 1: Tiến độ nộp kinh phí dự án */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                    <DollarSign className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
                      Tiến độ Kinh phí & Các đợt nộp tiền
                    </h3>
                    <p className="text-xs text-slate-400">
                      Theo dõi tiến độ giải ngân theo hợp đồng thi công
                    </p>
                  </div>
                </div>
                <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                  Đã nộp {totalPaidPercent}%
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">Tổng kinh phí</span>
                  <div className="font-mono font-bold text-slate-900 dark:text-white text-sm sm:text-base mt-0.5">
                    {formatCurrencyVN(totalBudgetVisible)}
                  </div>
                </div>
                <div>
                  <span className="text-[10px] text-emerald-500 uppercase font-semibold block">Đã thanh toán</span>
                  <div className="font-mono font-bold text-emerald-600 dark:text-emerald-400 text-sm sm:text-base mt-0.5">
                    {formatCurrencyVN(totalPaidVisible)}
                  </div>
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <span className="text-[10px] text-amber-500 uppercase font-semibold block">Còn lại</span>
                  <div className="font-mono font-bold text-amber-600 dark:text-amber-400 text-sm sm:text-base mt-0.5">
                    {formatCurrencyVN(remainingBudgetVisible)}
                  </div>
                </div>
              </div>

            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <Link
                href={
                  visibleProjects[0]
                    ? `/projects/${visibleProjects[0].id}?tab=financial`
                    : '/projects'
                }
                className="text-xs font-bold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1"
              >
                Chi tiết giải ngân các đợt nộp
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Card 2: Báo cáo phát sinh & trở ngại hiện trường */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
                      Phát sinh & Trở ngại hiện trường
                    </h3>
                    <p className="text-xs text-slate-400">
                      Thời tiết mưa bão, chậm bàn giao vật tư, mặt bằng
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
                    ? `${unresolvedIncidents.length} cần theo dõi`
                    : 'An toàn'}
                </span>
              </div>

              {allVisibleIncidents.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
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
                        className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 text-xs"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-1.5">
                            <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded border ${sev.badgeClass}`}>
                              {sev.label}
                            </span>
                            <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded border ${st.badgeClass}`}>
                              {st.label}
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {formatDateVN(inc.reportedAt)}
                          </span>
                        </div>
                        <h4 className="font-bold text-slate-900 dark:text-slate-100 truncate">
                          {inc.title}
                        </h4>
                        <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                          {inc.solution || inc.description}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <Link
                href={
                  allVisibleIncidents[0]
                    ? `/projects/${tasks.find((t) => t.id === allVisibleIncidents[0].taskId)?.projectId || visibleProjects[0]?.id || ''}?tab=incidents`
                    : '/projects'
                }
                className="text-xs font-bold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1"
              >
                Xem toàn bộ trở ngại & giải pháp
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>

        {/* Action List: Cần nghiệm thu ngay (Pending Review) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
                    Cần thẩm định & Nghiệm thu ({pendingTasks.length})
                  </h3>
                  <p className="text-xs text-slate-400">
                    Các hạng mục đã hoàn thành 100% kèm video/ảnh minh chứng đang chờ phê duyệt
                  </p>
                </div>
              </div>
            </div>

            {pendingTasks.length === 0 ? (
              <div className="py-10 text-center rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                <CheckSquare className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-80" />
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Tất cả các báo cáo nhiệm vụ đều đã được xử lý nghiệm thu!
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">Không còn đầu việc nào tồn đọng</p>
              </div>
            ) : (
              <div className="space-y-3">
                {pendingTasks.map((t) => {
                  const proj = visibleProjects.find((p) => p.id === t.projectId);
                  return (
                    <div
                      key={t.id}
                      className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-indigo-400/50 transition-colors"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-bold">
                            {proj?.code || 'DỰ ÁN'}
                          </span>
                          <span className="text-xs text-slate-400 flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            Hạn: {formatDateVN(t.dueDate)}
                          </span>
                        </div>
                        <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100 truncate">
                          {t.title}
                        </h4>
                        <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">
                          {t.description}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {currentUser.role === 'admin' ? (
                          <button
                            onClick={() => setSelectedApprovalTask(t)}
                            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-600/20 transition-all flex items-center gap-1.5"
                          >
                            <ShieldCheck className="w-4 h-4" />
                            Thẩm định & Duyệt
                          </button>
                        ) : (
                          <Link
                            href={`/projects/${t.projectId}?tab=tasks&taskId=${t.id}`}
                            className="px-3.5 py-2 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-medium hover:bg-slate-300 transition-colors"
                          >
                            Xem chi tiết
                          </Link>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Activity Stream */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
                  Dòng hoạt động gần nhất
                </h3>
                {currentUser.role === 'admin' && (
                  <Link
                    href="/audit-logs"
                    className="text-xs text-amber-600 dark:text-amber-400 font-semibold hover:underline"
                  >
                    Xem nhật ký
                  </Link>
                )}
              </div>

              <div className="space-y-4">
                {auditLogs.slice(0, 5).map((log) => (
                  <div key={log.id} className="flex items-start gap-3 text-xs">
                    <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                      {log.userName
                        .split(' ')
                        .map((n) => n[0])
                        .slice(-2)
                        .join('')}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-slate-900 dark:text-slate-200 font-semibold truncate">
                        {log.userName}
                      </div>
                      <div className="text-slate-500 dark:text-slate-400 text-[11px]">
                        <span className="font-medium text-amber-600 dark:text-amber-400">
                          {log.action}:{' '}
                        </span>
                        <span className="truncate">{log.target}</span>
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5 font-mono">
                        {formatDateTimeVN(log.timestamp)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400">
              Minh bạch và đồng bộ thời gian thực theo chuẩn quản trị mục tiêu.
            </div>
          </div>
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
