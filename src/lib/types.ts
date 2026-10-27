export type Role = 'admin' | 'assignee' | 'leader';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatar: string;
  isActive: boolean;
  phone: string;
  title: string;
  department: string;
  twoFactorEnabled?: boolean;
}

export type ProjectStatus = 'active' | 'completed' | 'paused';
export type ProjectCategory = 'technology' | 'education' | 'research' | 'facilities' | 'event';

export type WorkflowStepId = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

export interface WorkflowStep {
  step: WorkflowStepId;
  name: string;
  shortName: string;
  description: string;
  badgeClass: string;
  color: string;
}

export const WORKFLOW_9_STEPS: WorkflowStep[] = [
  {
    step: 1,
    name: 'Bước 1: Phê duyệt chủ trương đầu tư',
    shortName: 'B1: Chủ trương',
    description: 'Lập tờ trình đề xuất, xác định phạm vi công việc, mục tiêu, nhu cầu và dự kiến kinh phí.',
    badgeClass: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-300 dark:border-slate-700',
    color: '#64748B',
  },
  {
    step: 2,
    name: 'Bước 2: Hoàn thiện hồ sơ thiết kế & dự toán',
    shortName: 'B2: Thiết kế & Dự toán',
    description: 'Khảo sát hiện trạng mặt bằng, hoàn thiện/thẩm tra bản vẽ thiết kế và lập dự toán chi phí.',
    badgeClass: 'bg-sky-50 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300 border-sky-300 dark:border-sky-700',
    color: '#0284C7',
  },
  {
    step: 3,
    name: 'Bước 3: Tổ chức lựa chọn nhà thầu',
    shortName: 'B3: Chọn nhà thầu',
    description: 'Tiếp nhận báo giá, so sánh phương án kỹ thuật và đơn giá, lập tờ trình chọn nhà thầu.',
    badgeClass: 'bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border-purple-300 dark:border-purple-700',
    color: '#9333EA',
  },
  {
    step: 4,
    name: 'Bước 4: Thương thảo và ký kết hợp đồng',
    shortName: 'B4: Ký kết HĐ',
    description: 'Thương thảo điều khoản tạm ứng, nghiệm thu, thanh toán, bảo hành 5% và ký hợp đồng chính thức.',
    badgeClass: 'bg-amber-50 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-300 dark:border-amber-700',
    color: '#D97706',
  },
  {
    step: 5,
    name: 'Bước 5: Lập và phê duyệt kế hoạch triển khai',
    shortName: 'B5: Kế hoạch triển khai',
    description: 'Duyệt tiến độ tổng thể, biện pháp thi công, ATLĐ, VSMT và thủ tục chi tạm ứng đợt 1.',
    badgeClass: 'bg-orange-50 text-orange-700 dark:bg-orange-950/60 dark:text-orange-300 border-orange-300 dark:border-orange-700',
    color: '#EA580C',
  },
  {
    step: 6,
    name: 'Bước 6: Tổ chức thi công & giám sát hiện trường',
    shortName: 'B6: Thi công & Giám sát',
    description: 'Bàn giao mặt bằng, thi công hiện trường/xưởng, giám sát chất lượng, CO/CQ và khối lượng phát sinh.',
    badgeClass: 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border-rose-300 dark:border-rose-700',
    color: '#E11D48',
  },
  {
    step: 7,
    name: 'Bước 7: Quản lý hồ sơ và nhật ký thi công',
    shortName: 'B7: Nhật ký thi công',
    description: 'Ghi nhật ký hàng ngày (nhân lực, thời tiết), lưu trữ ảnh/video mốc, lập hồ sơ và bản vẽ hoàn công.',
    badgeClass: 'bg-teal-50 text-teal-700 dark:bg-teal-950/60 dark:text-teal-300 border-teal-300 dark:border-teal-700',
    color: '#0D9488',
  },
  {
    step: 8,
    name: 'Bước 8: Nghiệm thu hoàn thành gói thầu',
    shortName: 'B8: Nghiệm thu gói thầu',
    description: 'Tổ chức kiểm tra thực tế hiện trường, nghiệm thu công việc/hạng mục, khắc phục khiếm khuyết.',
    badgeClass: 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border-blue-300 dark:border-blue-700',
    color: '#2563EB',
  },
  {
    step: 9,
    name: 'Bước 9: Quyết toán và bảo hành công trình',
    shortName: 'B9: Quyết toán & Bảo hành',
    description: 'Đối chiếu khối lượng thực tế, hóa đơn VAT, chứng thư bảo lãnh 5% và theo dõi nghĩa vụ bảo hành (12-36 tháng).',
    badgeClass: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700',
    color: '#10B981',
  },
];

export interface Contract {
  id: string;
  contractNumber: string; // ví dụ: "08/2026/HĐTC/PXU-TBGROUP"
  contractorName: string; // "Công ty Cổ phần TBGroup"
  contractValue: number;  // Giá trị hợp đồng (VNĐ)
  vatRate: number;        // VAT (8 hoặc 10%)
  advancePaymentRate?: number; // % tạm ứng
  warrantyRate?: number;       // % bảo hành (5%)
  warrantyMonths?: number;     // 12 - 60 tháng
  signDate?: string;
  startDate?: string;
  endDate?: string;
  scopeDescription?: string;
}

export type MilestonePaymentStatus = 'paid' | 'pending' | 'overdue';

export interface PaymentMilestone {
  id: string;
  projectId: string;
  installmentNumber: number; // 1, 2, 3, 4...
  title: string;             // Ví dụ: Đợt 1: Tạm ứng khởi công & định vị tim mốc
  amount: number;            // 720000000
  percentage: number;        // 30 (%)
  dueDate: string;           // YYYY-MM-DD
  paidDate?: string;         // YYYY-MM-DD
  status: MilestonePaymentStatus;
  note?: string;
  description?: string;
  proofFile?: string;        // Ví dụ: UNC_VCB_Dot1.pdf
  receiptUrl?: string;
}

export interface LeaderEvaluation {
  rating: 'excellent' | 'good' | 'needs_improvement';
  comment: string;
  evaluatedBy: string;
  evaluatedAt: string;
}

export interface ProjectDirective {
  content: string;
  authorId: string;
  authorName: string;
  authorTitle: string;
  createdAt: string;
}

export interface Project {
  id: string;
  code: string;
  name: string;
  description: string;
  location: string;
  category: ProjectCategory;
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  status: ProjectStatus;
  workflowStep: WorkflowStepId; // 1 đến 9 theo Quy trình chuẩn PXU
  campus?: 'cs2' | 'tranphu' | 'all';
  contracts?: Contract[]; // Hợp đồng thi công đã ký kết
  completedTasksList?: string[]; // [Đã triển khai / Hoàn thành]
  pendingTasksList?: string[];   // [Cần triển khai tiếp theo / Việc còn lại]
  redAlerts?: string[];          // Cảnh báo đỏ nóng (sơn ngoài T1, khe nhiệt, cửa xingfa...)
  technicalNotes?: string;       // Ghi chú kỹ thuật & khối lượng
  leaderIds: string[]; // Leaders who have access
  memberIds: string[]; // Assignees / collaborators
  managerId: string;   // Admin (Thầy Trần Quốc Vương)
  organization: string; // Unit or partner in charge
  contractor?: string;  // Đơn vị phối hợp chính
  budget: string;
  budgetTotal?: number; // Số tiền dạng số để tính toán (ví dụ: 1452313908)
  paymentMilestones?: PaymentMilestone[];
  coverGradient: string;
  directive?: ProjectDirective;
  evaluation?: LeaderEvaluation;
  createdAt: string;
  isDeleted?: boolean;
}

export interface ProjectMember {
  id: string;
  projectId: string;
  userId: string;
  roleTitle: string;
  canView: boolean;
  joinedAt: string;
}

export type TaskStatus = 'todo' | 'in_progress' | 'submitted' | 'approved' | 'returned';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
}

export type IncidentSeverity = 'low' | 'medium' | 'high' | 'critical';
export type IncidentStatus = 'open' | 'resolving' | 'resolved';

export interface TaskIncident {
  id: string;
  taskId: string;
  title: string;
  description: string;
  type: 'weather' | 'material' | 'technical' | 'site' | 'other';
  severity: IncidentSeverity;
  status: IncidentStatus;
  reportedBy: string;
  reportedAt: string;
  resolvedAt?: string;
  solution?: string;
}

export interface Task {
  id: string;
  projectId: string;
  title: string;
  description: string;
  assigneeId: string;
  status: TaskStatus;
  progress: number; // 0 - 100
  startDate: string; // YYYY-MM-DD
  dueDate: string;   // YYYY-MM-DD
  priority: TaskPriority;
  subtasks?: Subtask[];
  incidents?: TaskIncident[];
  returnReason?: string;
  approvedAt?: string;
  approvedBy?: string;
  isDeleted?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Attachment {
  id: string;
  taskId?: string;
  projectId?: string;
  type: 'image' | 'video';
  url: string; // inline SVG or simulated media data
  name: string;
  size: number; // in bytes
  duration?: number; // seconds
  caption?: string;
  uploadedBy: string;
  createdAt: string;
}

export interface TaskUpdate {
  id: string;
  taskId: string;
  authorId: string;
  note: string;
  progress: number;
  attachments: Attachment[];
  createdAt: string;
}

export interface Message {
  id: string;
  projectId: string;
  taskId?: string;
  senderId: string;
  content: string;
  createdAt: string;
}

export type NotificationType =
  | 'task_assigned'
  | 'task_submitted'
  | 'task_approved'
  | 'task_returned'
  | 'task_updated'
  | 'project_access'
  | 'project_directive'
  | 'chat_message';

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  link?: string;
  read: boolean;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  target: string;
  details: string;
  timestamp: string;
}

export interface TaskStatusConfig {
  label: string;
  badgeClass: string;
  color: string;
  bgLight: string;
  borderClass: string;
  description: string;
}

export const TASK_STATUS_CONFIG: Record<TaskStatus, TaskStatusConfig> = {
  todo: {
    label: 'Mới giao',
    badgeClass: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-300 dark:border-slate-700',
    color: '#64748B',
    bgLight: 'rgba(100, 116, 139, 0.1)',
    borderClass: 'border-l-slate-400',
    description: 'Nhiệm vụ mới được giao, chưa triển khai',
  },
  in_progress: {
    label: 'Đang làm',
    badgeClass: 'bg-amber-50 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-300 dark:border-amber-700',
    color: '#D97706',
    bgLight: 'rgba(217, 119, 6, 0.1)',
    borderClass: 'border-l-amber-500',
    description: 'Đang tích cực triển khai thực hiện',
  },
  submitted: {
    label: 'Chờ duyệt',
    badgeClass: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border-indigo-300 dark:border-indigo-700',
    color: '#6366F1',
    bgLight: 'rgba(99, 102, 241, 0.1)',
    borderClass: 'border-l-indigo-500',
    description: 'Đã hoàn thành 100% kèm minh chứng kết quả, đợi nghiệm thu',
  },
  approved: {
    label: 'Đã nghiệm thu',
    badgeClass: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700',
    color: '#10B981',
    bgLight: 'rgba(16, 185, 129, 0.1)',
    borderClass: 'border-l-emerald-500',
    description: 'Chủ trì dự án đã thẩm định và nghiệm thu đạt chất lượng',
  },
  returned: {
    label: 'Cần sửa đổi',
    badgeClass: 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border-rose-300 dark:border-rose-700',
    color: '#EF4444',
    bgLight: 'rgba(239, 68, 68, 0.1)',
    borderClass: 'border-l-rose-500',
    description: 'Chưa đạt chuẩn đầu ra hoặc thiếu minh chứng, cần chỉnh sửa lại',
  },
};

export const CATEGORY_CONFIG: Record<
  ProjectCategory,
  {
    label: string;
    color: string;
    badge: string;
    icon: string;
    bg: string;
    border: string;
  }
> = {
  technology: {
    label: 'Công nghệ & Chuyển đổi số',
    color: '#0284C7',
    badge: 'bg-sky-50 text-sky-700 border-sky-300 dark:bg-sky-950/50 dark:text-sky-300 dark:border-sky-800',
    icon: 'Laptop',
    bg: 'bg-sky-500/10',
    border: 'border-sky-500/30',
  },
  education: {
    label: 'Đào tạo & Kiểm định',
    color: '#10B981',
    badge: 'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800',
    icon: 'GraduationCap',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/30',
  },
  research: {
    label: 'Nghiên cứu Khoa học',
    color: '#8B5CF6',
    badge: 'bg-purple-50 text-purple-700 border-purple-300 dark:bg-purple-950/50 dark:text-purple-300 dark:border-purple-800',
    icon: 'FlaskConical',
    bg: 'bg-purple-500/10',
    border: 'border-purple-500/30',
  },
  facilities: {
    label: 'Cơ sở vật chất & Thiết bị',
    color: '#F59E0B',
    badge: 'bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800',
    icon: 'Building2',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/30',
  },
  event: {
    label: 'Hội thảo & Sự kiện',
    color: '#EC4899',
    badge: 'bg-pink-50 text-pink-700 border-pink-300 dark:bg-pink-950/50 dark:text-pink-300 dark:border-pink-800',
    icon: 'Calendar',
    bg: 'bg-rose-500/10',
    border: 'border-rose-500/30',
  },
};

export const INCIDENT_SEVERITY_CONFIG: Record<
  IncidentSeverity,
  { label: string; badge: string; badgeClass: string; color: string }
> = {
  low: {
    label: 'Nhẹ (Không ảnh hưởng tiến độ)',
    badge: 'bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300',
    badgeClass: 'bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300',
    color: '#64748B',
  },
  medium: {
    label: 'Trung bình (Cần theo dõi)',
    badge: 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300',
    badgeClass: 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300',
    color: '#F59E0B',
  },
  high: {
    label: 'Nghiêm trọng (Chậm tiến độ)',
    badge: 'bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-950/60 dark:text-orange-300',
    badgeClass: 'bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-950/60 dark:text-orange-300',
    color: '#EA580C',
  },
  critical: {
    label: 'Rất khẩn cấp (Tạm dừng thi công)',
    badge: 'bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950/60 dark:text-rose-300',
    badgeClass: 'bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950/60 dark:text-rose-300',
    color: '#E11D48',
  },
};

export const INCIDENT_STATUS_CONFIG: Record<
  IncidentStatus,
  { label: string; badge: string; badgeClass: string; color: string }
> = {
  open: {
    label: 'Mới phát sinh',
    badge: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/50 dark:text-rose-300',
    badgeClass: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/50 dark:text-rose-300',
    color: '#EF4444',
  },
  resolving: {
    label: 'Đang xử lý khắc phục',
    badge: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300',
    badgeClass: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300',
    color: '#F59E0B',
  },
  resolved: {
    label: 'Đã xử lý xong',
    badge: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300',
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300',
    color: '#10B981',
  },
};

