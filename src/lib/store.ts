import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import {
  User,
  Project,
  Task,
  TaskStatus,
  TaskUpdate,
  Attachment,
  Message,
  Notification,
  AuditLog,
  LeaderEvaluation,
  PaymentMilestone,
  TaskIncident,
  IncidentStatus,
  WorkflowStepId,
} from './types';
import {
  INITIAL_USERS,
  INITIAL_PROJECTS,
  INITIAL_TASKS,
  INITIAL_UPDATES,
  INITIAL_ATTACHMENTS,
  INITIAL_MESSAGES,
  INITIAL_NOTIFICATIONS,
  INITIAL_AUDIT_LOGS,
} from './mock-data';

interface ConstructionStoreState {
  currentUser: User;
  users: User[];
  projects: Project[];
  tasks: Task[];
  taskUpdates: TaskUpdate[];
  attachments: Attachment[];
  messages: Message[];
  notifications: Notification[];
  auditLogs: AuditLog[];
  theme: 'light' | 'dark';
  isTwoFactorSimulated: boolean;

  // Role & User
  setCurrentUser: (userIdOrUser: string | User) => void;
  setTheme: (theme: 'light' | 'dark') => void;
  toggleTheme: () => void;
  toggleTwoFactor: (enabled: boolean) => void;
  updateUserStatus: (userId: string, isActive: boolean) => void;
  addUser: (userData: Omit<User, 'id' | 'avatar'> & { avatar?: string }) => void;
  updateUser: (userId: string, data: Partial<User>) => void;
  resetDemoData: () => void;

  // Projects
  getVisibleProjects: () => Project[];
  canUserAccessProject: (userId: string, projectId: string) => boolean;
  getProjectById: (projectId: string) => Project | undefined;
  calculateProjectProgress: (projectId: string) => number;
  addProject: (data: Omit<Project, 'id' | 'createdAt'>) => string;
  updateProject: (projectId: string, data: Partial<Project>) => void;
  deleteProject: (projectId: string) => void;
  toggleLeaderAccess: (projectId: string, leaderId: string, canView: boolean) => void;
  addLeaderDirective: (projectId: string, content: string) => void;
  evaluateProject: (projectId: string, evaluation: LeaderEvaluation) => void;
  updateProjectWorkflowStep: (projectId: string, step: WorkflowStepId) => void;
  toggleProjectChecklistTask: (projectId: string, taskTitle: string, isCompleted: boolean) => void;

  // Tasks
  getProjectTasks: (projectId: string) => Task[];
  getUserTasks: (userId: string) => Task[];
  getOverdueTasks: () => Task[];
  getPendingApprovalTasks: () => Task[];
  addTask: (data: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => string;
  updateTask: (taskId: string, data: Partial<Task>) => void;
  deleteTask: (taskId: string) => void;
  updateTaskProgress: (
    taskId: string,
    params: { note: string; progress: number; attachments?: Attachment[] }
  ) => void;
  approveTask: (taskId: string) => void;
  returnTask: (taskId: string, reason: string) => void;
  moveTaskStatus: (taskId: string, newStatus: TaskStatus) => boolean;
  toggleSubtask: (taskId: string, subtaskId: string) => void;

  // Incidents
  addIncident: (
    taskId: string,
    incident: Omit<TaskIncident, 'id' | 'taskId' | 'reportedAt'>
  ) => void;
  updateIncidentStatus: (
    taskId: string,
    incidentId: string,
    status: IncidentStatus,
    solution?: string
  ) => void;
  getProjectIncidents: (projectId: string) => TaskIncident[];

  // Financial / Payment Milestones
  markMilestonePaid: (projectId: string, milestoneId: string) => void;
  getProjectMilestones: (projectId: string) => PaymentMilestone[];

  // Attachments
  addAttachment: (attachment: Attachment) => void;
  getProjectAttachments: (projectId: string) => Attachment[];

  // Messages & Chat
  sendMessage: (projectId: string, content: string, taskId?: string) => void;
  getProjectMessages: (projectId: string) => Message[];

  // Notifications & Logs
  markNotificationAsRead: (notificationId: string) => void;
  markAllNotificationsAsRead: () => void;
  addNotification: (data: Omit<Notification, 'id' | 'createdAt' | 'read'>) => void;
  addAuditLog: (action: string, target: string, details: string) => void;
}

export const useConstructionStore = create<ConstructionStoreState>()(
  persist(
    (set, get) => ({
      currentUser: INITIAL_USERS[0], // Default: Thầy Trần Quốc Vương (Admin)
      users: INITIAL_USERS,
      projects: INITIAL_PROJECTS,
      tasks: INITIAL_TASKS,
      taskUpdates: INITIAL_UPDATES,
      attachments: INITIAL_ATTACHMENTS,
      messages: INITIAL_MESSAGES,
      notifications: INITIAL_NOTIFICATIONS,
      auditLogs: INITIAL_AUDIT_LOGS,
      theme: 'light',
      isTwoFactorSimulated: true,

      setCurrentUser: (userIdOrUser) => {
        const { users } = get();
        let target: User | undefined;
        if (typeof userIdOrUser === 'string') {
          target = users.find((u) => u.id === userIdOrUser);
        } else {
          target = userIdOrUser;
        }
        if (target) {
          set({ currentUser: target });
        }
      },

      setTheme: (theme) => set({ theme }),
      toggleTheme: () => {
        const next = get().theme === 'light' ? 'dark' : 'light';
        set({ theme: next });
      },

      toggleTwoFactor: (enabled) => set({ isTwoFactorSimulated: enabled }),

      updateUserStatus: (userId, isActive) => {
        const { users, currentUser } = get();
        const updatedUsers = users.map((u) => (u.id === userId ? { ...u, isActive } : u));
        
        let newCurrent = currentUser;
        if (currentUser.id === userId) {
          newCurrent = { ...currentUser, isActive };
        }

        const targetUser = users.find((u) => u.id === userId);
        const action = isActive ? 'Mở khóa tài khoản' : 'Khóa tài khoản';
        get().addAuditLog(action, `Người dùng: ${targetUser?.name || userId}`, `Trạng thái: ${isActive ? 'Hoạt động' : 'Đã khóa'}`);

        set({ users: updatedUsers, currentUser: newCurrent });
      },

      addUser: (userData) => {
        const newId = `usr-${Date.now()}`;
        const initials = userData.name
          .split(' ')
          .map((n) => n[0])
          .slice(-2)
          .join('')
          .toUpperCase();

        const newUser: User = {
          ...userData,
          id: newId,
          avatar: initials || 'PX',
        };

        set((state) => ({ users: [...state.users, newUser] }));
        get().addAuditLog(
          'Thêm người dùng mới',
          `Người dùng: ${newUser.name}`,
          `Vai trò: ${newUser.role}, Email: ${newUser.email}`
        );
      },

      updateUser: (userId, data) => {
        set((state) => {
          const updatedUsers = state.users.map((u) => (u.id === userId ? { ...u, ...data } : u));
          let updatedCurrent = state.currentUser;
          if (state.currentUser.id === userId) {
            updatedCurrent = { ...state.currentUser, ...data };
          }
          return { users: updatedUsers, currentUser: updatedCurrent };
        });
        get().addAuditLog('Cập nhật người dùng', `ID: ${userId}`, `Cập nhật thông tin tài khoản`);
      },

      resetDemoData: () => {
        set({
          currentUser: INITIAL_USERS[0],
          users: INITIAL_USERS,
          projects: INITIAL_PROJECTS,
          tasks: INITIAL_TASKS,
          taskUpdates: INITIAL_UPDATES,
          attachments: INITIAL_ATTACHMENTS,
          messages: INITIAL_MESSAGES,
          notifications: INITIAL_NOTIFICATIONS,
          auditLogs: INITIAL_AUDIT_LOGS,
          isTwoFactorSimulated: true,
        });
      },

      getVisibleProjects: () => {
        const { currentUser, projects } = get();
        if (!currentUser) return [];

        const activeProjects = projects.filter((p) => !p.isDeleted);
        if (currentUser.role === 'admin') {
          return activeProjects;
        }

        if (currentUser.role === 'leader') {
          return activeProjects.filter((p) => p.leaderIds.includes(currentUser.id));
        }

        if (currentUser.role === 'assignee') {
          return activeProjects.filter((p) => p.memberIds.includes(currentUser.id));
        }

        return [];
      },

      canUserAccessProject: (userId, projectId) => {
        const { users, projects } = get();
        const user = users.find((u) => u.id === userId);
        const project = projects.find((p) => p.id === projectId && !p.isDeleted);

        if (!user || !project) return false;
        if (user.role === 'admin') return true;
        if (user.role === 'leader') return project.leaderIds.includes(user.id);
        if (user.role === 'assignee') return project.memberIds.includes(user.id);

        return false;
      },

      getProjectById: (projectId) => {
        return get().projects.find((p) => p.id === projectId && !p.isDeleted);
      },

      calculateProjectProgress: (projectId) => {
        const projectTasks = get().tasks.filter((t) => t.projectId === projectId && !t.isDeleted);
        if (projectTasks.length === 0) return 0;

        const allApproved = projectTasks.every((t) => t.status === 'approved');
        
        const sum = projectTasks.reduce((acc, t) => {
          if (t.status === 'approved') {
            return acc + 100;
          }
          // Non-approved tasks are capped at 99% in project calculation
          const effectiveProgress = Math.min(t.progress, 99);
          return acc + effectiveProgress;
        }, 0);

        const average = sum / projectTasks.length;
        if (allApproved) {
          return 100;
        }
        // Cap overall project progress at 99% until ALL tasks are approved
        return Math.min(Math.round(average), 99);
      },

      addProject: (data) => {
        const newId = `proj-${Date.now()}`;
        const newProject: Project = {
          ...data,
          id: newId,
          createdAt: new Date().toISOString(),
        };

        set((state) => ({ projects: [newProject, ...state.projects] }));

        get().addAuditLog(
          'Tạo dự án mới',
          `Công trình: ${newProject.name}`,
          `Mã: ${newProject.code}, Địa điểm: ${newProject.location}`
        );

        // Notify leaders granted
        newProject.leaderIds.forEach((lId) => {
          get().addNotification({
            userId: lId,
            title: 'Được cấp quyền dự án mới',
            message: `Bạn được phân quyền theo dõi công trình "${newProject.name}".`,
            type: 'project_access',
            link: `/projects/${newId}`,
          });
        });

        return newId;
      },

      updateProject: (projectId, data) => {
        set((state) => ({
          projects: state.projects.map((p) => (p.id === projectId ? { ...p, ...data } : p)),
        }));
        get().addAuditLog('Cập nhật dự án', `ID: ${projectId}`, 'Cập nhật thông tin công trình');
      },

      deleteProject: (projectId) => {
        const project = get().projects.find((p) => p.id === projectId);
        set((state) => ({
          projects: state.projects.map((p) => (p.id === projectId ? { ...p, isDeleted: true } : p)),
        }));
        get().addAuditLog('Xóa dự án (mềm)', `Công trình: ${project?.name || projectId}`, 'Đã chuyển vào thùng rác');
      },

      toggleLeaderAccess: (projectId, leaderId, canView) => {
        const project = get().projects.find((p) => p.id === projectId);
        const leader = get().users.find((u) => u.id === leaderId);
        if (!project) return;

        let newLeaderIds = [...project.leaderIds];
        if (canView) {
          if (!newLeaderIds.includes(leaderId)) {
            newLeaderIds.push(leaderId);
            // Notify leader
            get().addNotification({
              userId: leaderId,
              title: 'Cấp quyền theo dõi dự án',
              message: `Bạn đã được cấp quyền theo dõi công trình "${project.name}".`,
              type: 'project_access',
              link: `/projects/${projectId}`,
            });
          }
        } else {
          newLeaderIds = newLeaderIds.filter((id) => id !== leaderId);
        }

        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === projectId ? { ...p, leaderIds: newLeaderIds } : p
          ),
        }));

        get().addAuditLog(
          canView ? 'Cấp quyền xem' : 'Thu hồi quyền xem',
          `Dự án: ${project.name}`,
          `${canView ? 'Cấp cho' : 'Thu hồi của'}: ${leader?.name || leaderId}`
        );
      },

      addLeaderDirective: (projectId, content) => {
        const { currentUser, projects } = get();
        const project = projects.find((p) => p.id === projectId);
        if (!project) return;

        const directive = {
          content,
          authorId: currentUser.id,
          authorName: currentUser.name,
          authorTitle: currentUser.title,
          createdAt: new Date().toISOString(),
        };

        set((state) => ({
          projects: state.projects.map((p) => (p.id === projectId ? { ...p, directive } : p)),
        }));

        // Notify Project Manager (Admin)
        get().addNotification({
          userId: project.managerId,
          title: 'Ý kiến chỉ đạo mới từ Lãnh đạo',
          message: `${currentUser.name} đã chỉ đạo: "${content}"`,
          type: 'project_directive',
          link: `/projects/${projectId}`,
        });

        get().addAuditLog(
          'Chỉ đạo của Lãnh đạo',
          `Dự án: ${project.name}`,
          `Nội dung: ${content.substring(0, 100)}`
        );
      },

      evaluateProject: (projectId, evaluation) => {
        const { projects } = get();
        const project = projects.find((p) => p.id === projectId);
        if (!project) return;

        set((state) => ({
          projects: state.projects.map((p) => (p.id === projectId ? { ...p, evaluation } : p)),
        }));

        const ratingLabels = {
          excellent: 'Xuất sắc',
          good: 'Đạt yêu cầu',
          needs_improvement: 'Cần tối ưu thêm',
        };

        get().addNotification({
          userId: project.managerId,
          title: 'Đánh giá dự án từ Lãnh đạo',
          message: `${evaluation.evaluatedBy} đã đánh giá: ${ratingLabels[evaluation.rating]}`,
          type: 'project_directive',
          link: `/projects/${projectId}`,
        });

        get().addAuditLog(
          'Đánh giá dự án',
          `Dự án: ${project.name}`,
          `Xếp loại: ${ratingLabels[evaluation.rating]} - ${evaluation.comment}`
        );
      },

      updateProjectWorkflowStep: (projectId, step) => {
        const project = get().projects.find((p) => p.id === projectId);
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === projectId ? { ...p, workflowStep: step } : p
          ),
        }));
        get().addAuditLog(
          'Cập nhật Quy trình 9 Bước',
          `Gói thầu: ${project ? project.name : projectId}`,
          `Chuyển tiến trình sang Bước ${step}`
        );
      },

      toggleProjectChecklistTask: (projectId, taskTitle, isCompleted) => {
        set((state) => ({
          projects: state.projects.map((p) => {
            if (p.id !== projectId) return p;
            const completed = p.completedTasksList || [];
            const pending = p.pendingTasksList || [];

            if (isCompleted) {
              return {
                ...p,
                pendingTasksList: pending.filter((t) => t !== taskTitle),
                completedTasksList: [...completed, taskTitle],
              };
            } else {
              return {
                ...p,
                completedTasksList: completed.filter((t) => t !== taskTitle),
                pendingTasksList: [...pending, taskTitle],
              };
            }
          }),
        }));
      },

      getProjectTasks: (projectId) => {
        return get().tasks.filter((t) => t.projectId === projectId && !t.isDeleted);
      },

      getUserTasks: (userId) => {
        return get().tasks.filter((t) => t.assigneeId === userId && !t.isDeleted);
      },

      getOverdueTasks: () => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        return get().tasks.filter((t) => {
          if (t.isDeleted || t.status === 'approved') return false;
          const due = new Date(t.dueDate);
          due.setHours(0, 0, 0, 0);
          return due < today;
        });
      },

      getPendingApprovalTasks: () => {
        return get().tasks.filter((t) => t.status === 'submitted' && !t.isDeleted);
      },

      addTask: (data) => {
        const newId = `task-${Date.now()}`;
        const now = new Date().toISOString();
        const newTask: Task = {
          ...data,
          id: newId,
          createdAt: now,
          updatedAt: now,
        };

        set((state) => ({ tasks: [newTask, ...state.tasks] }));

        const project = get().projects.find((p) => p.id === data.projectId);
        const assignee = get().users.find((u) => u.id === data.assigneeId);

        // Notify Assignee
        if (data.assigneeId) {
          get().addNotification({
            userId: data.assigneeId,
            title: 'Nhiệm vụ mới được giao',
            message: `Bạn được giao nhiệm vụ "${newTask.title}" tại ${project?.name || 'dự án'}. Hạn chót: ${newTask.dueDate}.`,
            type: 'task_assigned',
            link: `/my-tasks?taskId=${newId}`,
          });
        }

        get().addAuditLog(
          'Giao nhiệm vụ',
          `Nhiệm vụ: ${newTask.title}`,
          `Giao cho: ${assignee?.name || 'Kỹ sư'}, Dự án: ${project?.name || ''}`
        );

        return newId;
      },

      updateTask: (taskId, data) => {
        const now = new Date().toISOString();
        set((state) => ({
          tasks: state.tasks.map((t) => (t.id === taskId ? { ...t, ...data, updatedAt: now } : t)),
        }));
        get().addAuditLog('Cập nhật nhiệm vụ', `ID: ${taskId}`, 'Sửa đổi thông tin nhiệm vụ');
      },

      deleteTask: (taskId) => {
        const task = get().tasks.find((t) => t.id === taskId);
        set((state) => ({
          tasks: state.tasks.map((t) => (t.id === taskId ? { ...t, isDeleted: true } : t)),
        }));
        get().addAuditLog('Xóa nhiệm vụ', `Nhiệm vụ: ${task?.title || taskId}`, 'Đã xóa mềm nhiệm vụ');
      },

      updateTaskProgress: (taskId, { note, progress, attachments = [] }) => {
        const { tasks, currentUser } = get();
        const targetTask = tasks.find((t) => t.id === taskId);
        if (!targetTask) return;

        // If progress is 100%, status turns to 'submitted' (Chờ duyệt)
        const nextStatus: TaskStatus = progress === 100 ? 'submitted' : 'in_progress';
        const now = new Date().toISOString();

        const newUpdate: TaskUpdate = {
          id: `upd-${Date.now()}`,
          taskId,
          authorId: currentUser.id,
          note,
          progress,
          attachments,
          createdAt: now,
        };

        // Attach new attachments to attachments pool
        const newAttachments = attachments.map((a) => ({
          ...a,
          taskId,
          projectId: targetTask.projectId,
          uploadedBy: currentUser.id,
          createdAt: now,
        }));

        set((state) => ({
          tasks: state.tasks.map((t) =>
            t.id === taskId
              ? {
                  ...t,
                  progress,
                  status: nextStatus,
                  returnReason: nextStatus === 'submitted' ? undefined : t.returnReason,
                  updatedAt: now,
                }
              : t
          ),
          taskUpdates: [newUpdate, ...state.taskUpdates],
          attachments: [...newAttachments, ...state.attachments],
        }));

        const project = get().projects.find((p) => p.id === targetTask.projectId);

        // Notify Admin
        const adminUser = get().users.find((u) => u.role === 'admin');
        if (adminUser) {
          if (progress === 100) {
            get().addNotification({
              userId: adminUser.id,
              title: 'Nhiệm vụ gửi chờ duyệt (100%)',
              message: `${currentUser.name} đã báo cáo 100% nhiệm vụ "${targetTask.title}" tại ${project?.name || ''}.`,
              type: 'task_submitted',
              link: `/projects/${targetTask.projectId}?tab=tasks&taskId=${taskId}`,
            });
          } else {
            get().addNotification({
              userId: adminUser.id,
              title: 'Cập nhật tiến độ nhiệm vụ',
              message: `${currentUser.name} cập nhật ${progress}% cho nhiệm vụ "${targetTask.title}".`,
              type: 'task_updated',
              link: `/projects/${targetTask.projectId}?tab=tasks&taskId=${taskId}`,
            });
          }
        }

        get().addAuditLog(
          progress === 100 ? 'Báo cáo hoàn thành (100%)' : `Cập nhật tiến độ (${progress}%)`,
          `Nhiệm vụ: ${targetTask.title}`,
          `Ghi chú: ${note.substring(0, 80)}${note.length > 80 ? '...' : ''}`
        );
      },

      approveTask: (taskId) => {
        const { tasks, currentUser } = get();
        const task = tasks.find((t) => t.id === taskId);
        if (!task) return;

        const now = new Date().toISOString();

        set((state) => ({
          tasks: state.tasks.map((t) =>
            t.id === taskId
              ? {
                  ...t,
                  status: 'approved',
                  progress: 100,
                  approvedAt: now,
                  approvedBy: currentUser.id,
                  returnReason: undefined,
                  updatedAt: now,
                }
              : t
          ),
        }));

        const project = get().projects.find((p) => p.id === task.projectId);

        // Notify Assignee
        get().addNotification({
          userId: task.assigneeId,
          title: 'Nhiệm vụ đã được duyệt nghiệm thu',
          message: `Chỉ huy trưởng đã duyệt đạt nhiệm vụ "${task.title}".`,
          type: 'task_approved',
          link: `/my-tasks?taskId=${taskId}`,
        });

        // Notify Leaders
        if (project) {
          project.leaderIds.forEach((lId) => {
            get().addNotification({
              userId: lId,
              title: 'Nghiệm thu hoàn thành nhiệm vụ',
              message: `Nhiệm vụ "${task.title}" tại ${project.name} đã được nghiệm thu đạt chuẩn.`,
              type: 'task_approved',
              link: `/projects/${task.projectId}`,
            });
          });
        }

        get().addAuditLog(
          'Duyệt nghiệm thu',
          `Nhiệm vụ: ${task.title}`,
          `Người duyệt: ${currentUser.name}, Trạng thái: Đạt 100% nghiệm thu`
        );
      },

      returnTask: (taskId, reason) => {
        const { tasks } = get();
        const task = tasks.find((t) => t.id === taskId);
        if (!task) return;

        const now = new Date().toISOString();

        set((state) => ({
          tasks: state.tasks.map((t) =>
            t.id === taskId
              ? {
                  ...t,
                  status: 'returned',
                  returnReason: reason,
                  updatedAt: now,
                }
              : t
          ),
        }));

        // Notify Assignee
        get().addNotification({
          userId: task.assigneeId,
          title: 'Nhiệm vụ cần làm lại',
          message: `Chỉ huy trưởng yêu cầu làm lại "${task.title}". Lý do: ${reason}`,
          type: 'task_returned',
          link: `/my-tasks?taskId=${taskId}`,
        });

        get().addAuditLog(
          'Trả lại nhiệm vụ',
          `Nhiệm vụ: ${task.title}`,
          `Lý do: ${reason}`
        );
      },

      moveTaskStatus: (taskId, newStatus) => {
        const { tasks, currentUser } = get();
        const task = tasks.find((t) => t.id === taskId);
        if (!task) return false;

        const oldStatus = task.status;
        if (oldStatus === newStatus) return true;

        // Transition validation rules:
        // - todo -> in_progress (OK)
        // - in_progress -> submitted (OK)
        // - submitted -> approved (Admin only)
        // - submitted -> returned (Admin only)
        // - returned -> in_progress (Assignee / Admin)
        // - approved -> locked (cannot move)

        if (oldStatus === 'approved') {
          return false; // Approved tasks are locked!
        }

        if (newStatus === 'approved' || newStatus === 'returned') {
          if (currentUser.role !== 'admin') {
            return false; // Only admin can approve or return
          }
        }

        if (newStatus === 'approved') {
          get().approveTask(taskId);
          return true;
        }

        if (newStatus === 'returned') {
          get().returnTask(taskId, 'Yêu cầu kiểm tra và chỉnh sửa lại theo biên bản');
          return true;
        }

        const now = new Date().toISOString();
        let newProgress = task.progress;
        if (newStatus === 'submitted') {
          newProgress = 100;
        } else if (newStatus === 'todo') {
          newProgress = 0;
        } else if (newStatus === 'in_progress' && task.progress === 0) {
          newProgress = 25;
        }

        set((state) => ({
          tasks: state.tasks.map((t) =>
            t.id === taskId
              ? {
                  ...t,
                  status: newStatus,
                  progress: newProgress,
                  updatedAt: now,
                }
              : t
          ),
        }));

        get().addAuditLog(
          'Chuyển trạng thái nhiệm vụ',
          `Nhiệm vụ: ${task.title}`,
          `Từ "${oldStatus}" sang "${newStatus}"`
        );

        return true;
      },

      toggleSubtask: (taskId, subtaskId) => {
        set((state) => ({
          tasks: state.tasks.map((t) => {
            if (t.id !== taskId || !t.subtasks) return t;
            const updatedSubtasks = t.subtasks.map((st) =>
              st.id === subtaskId ? { ...st, completed: !st.completed } : st
            );
            return {
              ...t,
              subtasks: updatedSubtasks,
              updatedAt: new Date().toISOString(),
            };
          }),
        }));
      },

      addIncident: (taskId, incidentData) => {
        const { tasks, currentUser, projects } = get();
        const targetTask = tasks.find((t) => t.id === taskId);
        if (!targetTask) return;

        const project = projects.find((p) => p.id === targetTask.projectId);
        const newIncident: TaskIncident = {
          ...incidentData,
          id: `inc-${Date.now()}`,
          taskId,
          reportedAt: new Date().toISOString(),
        };

        const currentIncidents = targetTask.incidents || [];
        const updatedTask: Task = {
          ...targetTask,
          incidents: [newIncident, ...currentIncidents],
          updatedAt: new Date().toISOString(),
        };

        set((state) => ({
          tasks: state.tasks.map((t) => (t.id === taskId ? updatedTask : t)),
        }));

        if (project) {
          // Notify Project Manager (Thầy Vương)
          get().addNotification({
            userId: project.managerId,
            title: `Phát sinh hiện trường mới [${incidentData.severity.toUpperCase()}]`,
            message: `${currentUser.name} báo cáo: "${incidentData.title}" tại nhiệm vụ "${targetTask.title}".`,
            type: 'task_submitted',
            link: `/projects/${project.id}?tab=tasks&taskId=${taskId}`,
          });

          // Also notify Leaders
          project.leaderIds.forEach((lId) => {
            get().addNotification({
              userId: lId,
              title: `Phát sinh thi công cần lưu ý`,
              message: `Dự án "${project.name}" ghi nhận phát sinh: ${incidentData.title}`,
              type: 'task_submitted',
              link: `/projects/${project.id}`,
            });
          });
        }

        get().addAuditLog(
          'Báo cáo phát sinh',
          `Nhiệm vụ: ${targetTask.title}`,
          `Phát sinh: ${incidentData.title} (${incidentData.severity})`
        );
      },

      updateIncidentStatus: (taskId, incidentId, status, solution) => {
        set((state) => ({
          tasks: state.tasks.map((t) => {
            if (t.id !== taskId || !t.incidents) return t;
            return {
              ...t,
              incidents: t.incidents.map((inc) =>
                inc.id === incidentId
                  ? {
                      ...inc,
                      status,
                      solution: solution || inc.solution,
                      resolvedAt: status === 'resolved' ? new Date().toISOString() : inc.resolvedAt,
                    }
                  : inc
              ),
              updatedAt: new Date().toISOString(),
            };
          }),
        }));

        get().addAuditLog('Cập nhật xử lý phát sinh', `ID: ${incidentId}`, `Trạng thái: ${status}`);
      },

      getProjectIncidents: (projectId) => {
        const projectTasks = get().getProjectTasks(projectId);
        const incidents: TaskIncident[] = [];
        projectTasks.forEach((t) => {
          if (t.incidents && t.incidents.length > 0) {
            incidents.push(...t.incidents);
          }
        });
        return incidents.sort(
          (a, b) => new Date(b.reportedAt).getTime() - new Date(a.reportedAt).getTime()
        );
      },

      markMilestonePaid: (projectId, milestoneId) => {
        const { projects, currentUser } = get();
        const project = projects.find((p) => p.id === projectId);
        if (!project || !project.paymentMilestones) return;

        const targetMilestone = project.paymentMilestones.find((m) => m.id === milestoneId);
        const now = new Date().toISOString().split('T')[0];

        const updatedMilestones = project.paymentMilestones.map((m) =>
          m.id === milestoneId ? { ...m, status: 'paid' as const, paidDate: now } : m
        );

        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === projectId ? { ...p, paymentMilestones: updatedMilestones } : p
          ),
        }));

        // Notify Leaders
        project.leaderIds.forEach((lId) => {
          get().addNotification({
            userId: lId,
            title: 'Giải ngân kinh phí đợt mới',
            message: `Dự án "${project.name}" đã thanh toán xong: ${targetMilestone?.title || 'Đợt nộp'}.`,
            type: 'task_approved',
            link: `/projects/${projectId}?tab=financial`,
          });
        });

        get().addAuditLog(
          'Xác nhận nộp tiền đợt',
          `Dự án: ${project.name}`,
          `Xác nhận thanh toán ${targetMilestone?.title || milestoneId} bởi ${currentUser.name}`
        );
      },

      getProjectMilestones: (projectId) => {
        const project = get().projects.find((p) => p.id === projectId);
        return project?.paymentMilestones || [];
      },

      addAttachment: (attachment) => {
        set((state) => ({ attachments: [attachment, ...state.attachments] }));
      },

      getProjectAttachments: (projectId) => {
        return get().attachments.filter((a) => a.projectId === projectId);
      },

      sendMessage: (projectId, content, taskId) => {
        const { currentUser } = get();
        const newMessage: Message = {
          id: `msg-${Date.now()}`,
          projectId,
          taskId,
          senderId: currentUser.id,
          content,
          createdAt: new Date().toISOString(),
        };

        set((state) => ({ messages: [...state.messages, newMessage] }));
      },

      getProjectMessages: (projectId) => {
        return get().messages.filter((m) => m.projectId === projectId);
      },

      markNotificationAsRead: (notificationId) => {
        set((state) => ({
          notifications: state.notifications.map((n) =>
            n.id === notificationId ? { ...n, read: true } : n
          ),
        }));
      },

      markAllNotificationsAsRead: () => {
        const { currentUser } = get();
        set((state) => ({
          notifications: state.notifications.map((n) =>
            n.userId === currentUser.id ? { ...n, read: true } : n
          ),
        }));
      },

      addNotification: (data) => {
        const newNotif: Notification = {
          ...data,
          id: `notif-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          read: false,
          createdAt: new Date().toISOString(),
        };
        set((state) => ({ notifications: [newNotif, ...state.notifications] }));
      },

      addAuditLog: (action, target, details) => {
        const { currentUser } = get();
        const newLog: AuditLog = {
          id: `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          userId: currentUser?.id || 'system',
          userName: currentUser?.name || 'Hệ thống',
          action,
          target,
          details,
          timestamp: new Date().toISOString(),
        };
        set((state) => ({ auditLogs: [newLog, ...state.auditLogs] }));
      },
    }),
    {
      name: 'pxu_taskmaster_store_v6',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        currentUser: state.currentUser,
        users: state.users,
        projects: state.projects,
        tasks: state.tasks,
        taskUpdates: state.taskUpdates,
        attachments: state.attachments,
        messages: state.messages,
        notifications: state.notifications,
        auditLogs: state.auditLogs,
        theme: state.theme,
        isTwoFactorSimulated: state.isTwoFactorSimulated,
      }),
    }
  )
);
