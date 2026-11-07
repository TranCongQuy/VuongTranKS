/**
 * ============================================================================
 * SELECTORS TIẾN ĐỘ — NGUỒN SỰ THẬT DUY NHẤT (Đợt nâng cấp nghiệp vụ)
 * ============================================================================
 * Trước đây tiến độ bị tính ở nhiều nơi theo nhiều cách khác nhau:
 *  - store.calculateProjectProgress: trung bình cộng % task (mọi task nặng
 *    như nhau, bất kể khối lượng việc lớn/nhỏ);
 *  - dashboard: tiến độ tổng = trung bình cộng % các gói thầu (gói 165 triệu
 *    nặng bằng gói 1,5 tỷ — sai về mặt quản trị).
 *
 * Từ nay TOÀN BỘ giao diện chỉ được lấy tiến độ qua 2 selector trong file này:
 *  1) selectProjectProgress(state, projectId) — % của 1 gói thầu, SUY RA từ
 *     task (không còn đọc bất kỳ field % lưu cứng nào của gói).
 *  2) selectOverallProgress(state, projects) — % tổng toàn trường, TRỌNG SỐ
 *     THEO GIÁ TRỊ HỢP ĐỒNG của từng gói.
 *
 * Quy tắc tính % của 1 gói (selectProjectProgress):
 *  - Chỉ xét các task thuộc gói và chưa bị xoá.
 *  - Task đã nghiệm thu (status = 'approved') tính 100; các task còn lại dùng
 *    % tiến độ do giám sát báo cáo (task.progress).
 *  - Mỗi task được gán TRỌNG SỐ = số subtask/checklist item của nó (task
 *    không có subtask thì trọng số = 1) — task càng nhiều đầu việc con thì
 *    càng ảnh hưởng lớn tới % của gói.
 *  - Gói chưa có toàn bộ task được nghiệm thu thì % bị chặn ở 99 (chỉ khi mọi
 *    task đều approved mới đạt tròn 100).
 *  - Gói KHÔNG có task nào: fallback = % hoàn thành checklist của gói
 *    (completedTasksList / (completedTasksList + pendingTasksList)); nếu gói
 *    cũng không có checklist thì = 0 (coi như "chưa khởi động").
 * ============================================================================
 */

import type { Contract, Project, Task } from './types';

/** Phần state tối thiểu mà các selector tiến độ cần (trích từ store). */
export interface ProgressStateSlice {
  projects: Project[];
  tasks: Task[];
}

/**
 * Giá trị hợp đồng của 1 gói — dùng làm trọng số cho tiến độ tổng.
 * Ưu tiên tổng giá trị các hợp đồng đã ký (contracts[].contractValue);
 * gói chưa ký hợp đồng thì dùng kinh phí dự toán (budgetTotal).
 */
export function getProjectContractValue(project: Project): number {
  if (project.contracts && project.contracts.length > 0) {
    return project.contracts.reduce((sum, c) => sum + (c.contractValue || 0), 0);
  }
  return project.budgetTotal ?? 0;
}

/** Trọng số của 1 task = số subtask/checklist item (tối thiểu 1). */
function taskWeight(task: Task): number {
  const count = task.subtasks?.length ?? 0;
  return count > 0 ? count : 1;
}

/**
 * Lõi tính % gói từ danh sách task đã lọc, với hàm lấy "giá trị đóng góp"
 * của từng task. Dùng chung cho tiến độ hiện tại và tiến độ nghiệm thu luỹ kế.
 */
function weightedTaskProgress(
  projectTasks: Task[],
  valueOf: (task: Task) => number
): number {
  const totalWeight = projectTasks.reduce((sum, t) => sum + taskWeight(t), 0);
  if (totalWeight === 0) return 0;
  const weighted = projectTasks.reduce(
    (sum, t) => sum + Math.min(100, Math.max(0, valueOf(t))) * taskWeight(t),
    0
  );
  const allApproved = projectTasks.every((t) => t.status === 'approved');
  const rounded = Math.round(weighted / totalWeight);
  // Chưa nghiệm thu toàn bộ thì không bao giờ hiển thị tròn 100%
  return allApproved ? Math.min(rounded, 100) : Math.min(rounded, 99);
}

/**
 * % tiến độ của 1 gói thầu — SUY RA hoàn toàn từ task của gói.
 * Xem khối quy tắc ở đầu file.
 */
export function selectProjectProgress(
  state: ProgressStateSlice,
  projectId: string
): number {
  const projectTasks = state.tasks.filter(
    (t) => t.projectId === projectId && !t.isDeleted
  );

  if (projectTasks.length === 0) {
    // Fallback: % hoàn thành checklist của gói (nếu có)
    const project = state.projects.find((p) => p.id === projectId);
    const done = project?.completedTasksList?.length ?? 0;
    const pending = project?.pendingTasksList?.length ?? 0;
    if (done + pending > 0) {
      return Math.round((done / (done + pending)) * 100);
    }
    return 0;
  }

  return weightedTaskProgress(projectTasks, (t) =>
    t.status === 'approved' ? 100 : t.progress
  );
}

/**
 * % khối lượng ĐÃ NGHIỆM THU của 1 gói tính tới 1 thời điểm (luỹ kế theo
 * tháng, phục vụ biểu đồ vùng ở dashboard). Task chỉ được tính 100 khi đã
 * approved và approvedAt <= mốc thời gian; mọi task còn lại tính 0 — tức đây
 * là phần khối lượng đã được nghiệm thu chính thức, không phải % báo cáo.
 */
export function selectProjectAcceptedProgress(
  state: ProgressStateSlice,
  projectId: string,
  until: Date
): number {
  const projectTasks = state.tasks.filter(
    (t) => t.projectId === projectId && !t.isDeleted
  );
  if (projectTasks.length === 0) return 0;
  const totalWeight = projectTasks.reduce((sum, t) => sum + taskWeight(t), 0);
  if (totalWeight === 0) return 0;
  const weighted = projectTasks.reduce((sum, t) => {
    const approvedInTime =
      t.status === 'approved' &&
      t.approvedAt &&
      new Date(t.approvedAt).getTime() <= until.getTime();
    return sum + (approvedInTime ? 100 : 0) * taskWeight(t);
  }, 0);
  return Math.round(weighted / totalWeight);
}

/**
 * % tiến độ TỔNG toàn trường — trung bình TRỌNG SỐ THEO GIÁ TRỊ HỢP ĐỒNG:
 *   overall = Σ(%gói_i × giá trị_i) / Σ(giá trị_i)
 * Gói giá trị lớn (ví dụ sân thể thao 2,5 tỷ) ảnh hưởng tương xứng tới con số
 * tổng, thay cho trung bình cộng cơ học trước đây.
 * Nếu tổng giá trị = 0 (không gói nào có kinh phí) thì lùi về trung bình cộng.
 */
export function selectOverallProgress(
  state: ProgressStateSlice,
  projects: Project[]
): number {
  const active = projects.filter((p) => !p.isDeleted);
  if (active.length === 0) return 0;

  const totalValue = active.reduce((sum, p) => sum + getProjectContractValue(p), 0);
  if (totalValue <= 0) {
    const avg =
      active.reduce((sum, p) => sum + selectProjectProgress(state, p.id), 0) /
      active.length;
    return Math.round(avg);
  }

  const weighted = active.reduce(
    (sum, p) => sum + selectProjectProgress(state, p.id) * getProjectContractValue(p),
    0
  );
  return Math.round(weighted / totalValue);
}

/**
 * % tiến độ theo THỜI GIAN đã trôi qua của các gói (đường "kế hoạch" cho biểu
 * đồ vùng), cũng trọng số theo giá trị hợp đồng để nhất quán với đường thực tế.
 */
export function selectWeightedTimeProgress(
  state: ProgressStateSlice,
  projects: Project[],
  at: Date
): number {
  const active = projects.filter((p) => !p.isDeleted);
  if (active.length === 0) return 0;
  const totalValue = active.reduce((sum, p) => sum + getProjectContractValue(p), 0);

  const fractionOf = (p: Project) => {
    const start = new Date(p.startDate).getTime();
    const end = new Date(p.endDate).getTime();
    if (end <= start) return at.getTime() >= end ? 1 : 0;
    return Math.min(1, Math.max(0, (at.getTime() - start) / (end - start)));
  };

  if (totalValue <= 0) {
    return Math.round(
      (active.reduce((sum, p) => sum + fractionOf(p), 0) / active.length) * 100
    );
  }
  const weighted = active.reduce(
    (sum, p) => sum + fractionOf(p) * getProjectContractValue(p),
    0
  );
  return Math.round((weighted / totalValue) * 100);
}

/* ============================================================================
 * TỰ TÍNH TIỀN HỢP ĐỒNG (Phần IV-c) + SELECTOR CẢNH BÁO (Phần IV-d)
 * Số tiền milestone hiển thị ưu tiên suy ra từ % × giá trị HĐ của gói khi
 * milestone gắn với 1 HĐ duy nhất / % khớp; hàm dưới là nguồn tính duy nhất.
 * ==========================================================================*/

export function calcAmountFromRate(contractValue: number, ratePercent: number): number {
  if (!contractValue || !ratePercent) return 0;
  return Math.round((contractValue * ratePercent) / 100);
}

export function deriveContractAmounts(contract: Contract) {
  const advance = contract.advancePaymentRate ? calcAmountFromRate(contract.contractValue, contract.advancePaymentRate) : 0;
  const warrantyRate = contract.warrantyRate ?? 5;
  const warranty = calcAmountFromRate(contract.contractValue, warrantyRate);
  return { advance, warranty, warrantyRate, vatRate: contract.vatRate };
}

/** Số tiền hiển thị của 1 milestone: nếu % > 0 và gói có tổng giá trị HĐ/budget, suy ra từ % (làm tròn) khi lệch với amount lưu cứng quá 1.000₫ thì ưu tiên số suy ra cho các mốc chưa thanh toán; mốc đã paid giữ amount lịch sử. */
export function deriveMilestoneAmount(project: Project, milestone: { percentage: number; amount: number; status: string }): number {
  if (milestone.status === 'paid') return milestone.amount;
  if (milestone.percentage > 0) {
    const base = getProjectContractValue(project);
    if (base > 0) {
      const derived = calcAmountFromRate(base, milestone.percentage);
      // Với gói nhiều HĐ (CT45), % của milestone gộp không suy ra trực tiếp từ tổng — chỉ ưu tiên suy ra khi gần khớp hoặc milestone đơn HĐ.
      const contractsCount = project.contracts?.length ?? 0;
      if (contractsCount === 1) return derived;
      if (Math.abs(derived - milestone.amount) <= 1000) return derived;
    }
  }
  return milestone.amount;
}

export type AlertKind = 'contract-expiry' | 'milestone-overdue' | 'overdue-task' | 'incident' | 'red-alert' | 'guarantee-missing' | 'handover-overdue';
export type AlertSeverity = 'critical' | 'high' | 'medium' | 'low';
export interface ProjectAlert {
  id: string;
  projectId: string;
  projectCode: string;
  projectName: string;
  kind: AlertKind;
  severity: AlertSeverity;
  text: string;
  href: string;
}

const SEV_ORDER: Record<AlertSeverity, number> = { critical: 0, high: 1, medium: 2, low: 3 };
function startOfDay(d: Date) { const x = new Date(d); x.setHours(0,0,0,0); return x; }

export function selectProjectAlerts(
  state: ProgressStateSlice,
  project: Project,
  today: Date = new Date()
): ProjectAlert[] {
  const alerts: ProjectAlert[] = [];
  const t0 = startOfDay(today).getTime();
  const href = `/projects/${project.id}`;
  const base = { projectId: project.id, projectCode: project.code, projectName: project.name, href };
  (project.redAlerts || []).forEach((text, i) => alerts.push({ ...base, id: `${project.id}-red-${i}`, kind: 'red-alert', severity: 'high', text }));
  state.tasks.filter((tk) => tk.projectId === project.id && !tk.isDeleted).forEach((tk) => {
    if (tk.status !== 'approved' && tk.status !== 'submitted') {
      const due = startOfDay(new Date(tk.dueDate)).getTime();
      if (due < t0) alerts.push({ ...base, id: `${project.id}-overdue-${tk.id}`, kind: 'overdue-task', severity: 'high', text: `Task quá hạn: "${tk.title}" (hạn ${tk.dueDate})` });
    }
    (tk.incidents || []).filter((inc) => inc.status !== 'resolved' && (inc.severity === 'critical' || inc.severity === 'high')).forEach((inc) => {
      alerts.push({ ...base, id: `${project.id}-inc-${inc.id}`, kind: 'incident', severity: inc.severity === 'critical' ? 'critical' : 'high', text: `Sự cố ${inc.severity === 'critical' ? 'rất khẩn cấp' : 'nghiêm trọng'}: "${inc.title}"` });
    });
  });
  (project.paymentMilestones || []).filter((m) => m.status !== 'paid').forEach((m) => {
    const due = startOfDay(new Date(m.dueDate)).getTime();
    if (due < t0) alerts.push({ ...base, id: `${project.id}-ms-${m.id}`, kind: 'milestone-overdue', severity: 'medium', text: `Mốc thanh toán quá hạn: "${m.title}" (hạn ${m.dueDate})` });
  });
  const expiryDates = new Set<string>();
  (project.contracts || []).forEach((c) => { if (c.endDate) expiryDates.add(c.endDate); });
  if (project.endDate) expiryDates.add(project.endDate);
  expiryDates.forEach((d) => {
    const diff = Math.round((startOfDay(new Date(d)).getTime() - t0) / 86400000);
    if (diff < 0) alerts.push({ ...base, id: `${project.id}-expiry-${d}`, kind: 'contract-expiry', severity: 'critical', text: `Hợp đồng/hạn gói đã qua hạn ${d} (${Math.abs(diff)} ngày)` });
    else if (diff <= 7) alerts.push({ ...base, id: `${project.id}-expiry-${d}`, kind: 'contract-expiry', severity: 'critical', text: diff === 0 ? `Hôm nay là hạn chót hợp đồng (${d})` : `Hợp đồng sắp hết hạn ${d} (còn ${diff} ngày)` });
  });
  // Bàn giao mặt bằng / bắt đầu triển khai đã tới hạn mà HĐ CHƯA ký kết:
  // suy ra hoàn toàn từ dữ liệu — contract.startDate đã tới/quá hôm nay,
  // chưa ghi nhận ngày ký (signDate; Contract không có trường status) và
  // gói vẫn ở bước ≤4 (B4 chính là bước thương thảo & ký kết hợp đồng).
  (project.contracts || []).forEach((c) => {
    if (!c.startDate) return;
    const start = startOfDay(new Date(c.startDate)).getTime();
    if (start > t0) return;
    const contractUnsigned = !c.signDate && project.workflowStep <= 4;
    if (!contractUnsigned) return;
    const [y, m, d] = c.startDate.split('-');
    const dateVN = `${d}/${m}/${y}`;
    alerts.push({
      ...base,
      id: `${project.id}-handover-${c.id}`,
      kind: 'handover-overdue',
      severity: 'high',
      text:
        start < t0
          ? `Mốc bàn giao mặt bằng ${dateVN} đã qua — hợp đồng chưa ký kết`
          : `Mốc bàn giao mặt bằng ${dateVN} là hôm nay — hợp đồng chưa ký kết`,
    });
  });
  (project.contracts || []).forEach((c) => {
    if (!c.performanceGuaranteeExpiry && !c.warrantyGuaranteeExpiry) {
      alerts.push({ ...base, id: `${project.id}-guarantee-${c.id}`, kind: 'guarantee-missing', severity: 'low', text: `Chưa ghi nhận hạn bảo lãnh thực hiện/bảo hành cho HĐ ${c.contractNumber} trong hồ sơ` });
    }
  });
  return alerts.sort((a, b) => SEV_ORDER[a.severity] - SEV_ORDER[b.severity]);
}

export function selectAllAlerts(
  state: ProgressStateSlice,
  projects: Project[],
  today: Date = new Date()
): ProjectAlert[] {
  return projects.filter((p) => !p.isDeleted).flatMap((p) => selectProjectAlerts(state, p, today))
    .sort((a, b) => SEV_ORDER[a.severity] - SEV_ORDER[b.severity]);
}
