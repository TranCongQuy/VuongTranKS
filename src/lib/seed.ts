/**
 * ============================================================================
 * CƠ CHẾ NÂNG CẤP DỮ LIỆU MẪU (seedVersion) — Đợt nâng cấp nghiệp vụ
 * ============================================================================
 * Vấn đề: dữ liệu demo nằm trong localStorage của trình duyệt người dùng
 * (thầy đã mở bản live). Khi bộ dữ liệu mẫu trong code thay đổi, trình duyệt
 * cũ vẫn giữ bộ mẫu cũ — cần cơ chế tự nâng cấp có điều kiện:
 *
 *  - Mỗi bộ dữ liệu mẫu có 1 phiên bản: CURRENT_SEED_VERSION.
 *  - Khi app nạp dữ liệu đã lưu (persist migrate / rehydrate):
 *      + Nếu seedVersion đã lưu < CURRENT_SEED_VERSION VÀ toàn bộ id của
 *        project/task đang lưu đều thuộc tập id MẪU (chưa có dữ liệu nào do
 *        người dùng tự tạo) → tự động thay phần dữ liệu mẫu động
 *        (projects, tasks, taskUpdates, attachments, messages) bằng bộ mẫu
 *        mới. Giữ nguyên: users, phiên đăng nhập, theme, cài đặt,
 *        notifications, auditLogs.
 *      + Nếu đã xuất hiện id lạ (dữ liệu tự tạo: project id dạng
 *        "proj-<timestamp>", task id dạng "task-<timestamp>") → TUYỆT ĐỐI
 *        không tự thay; người dùng chủ động bấm nút "Nạp lại dữ liệu mẫu
 *        mới" trong Cài đặt → Công cụ demo (store.reloadSampleData).
 *  - Id mẫu có dạng cố định: project "pkg-<số>", task "task-<số gói>-<số>".
 * ============================================================================
 */

import {
  INITIAL_PROJECTS,
  INITIAL_TASKS,
  INITIAL_UPDATES,
  INITIAL_ATTACHMENTS,
  INITIAL_MESSAGES,
} from './mock-data';
import type { Project, Task, TaskUpdate, Attachment, Message } from './types';

/** Phiên bản bộ dữ liệu mẫu hiện tại. Tăng số này mỗi khi thay đổi mock-data. */
export const CURRENT_SEED_VERSION = 2;

const SAMPLE_PROJECT_ID = /^pkg-\d+$/;
const SAMPLE_TASK_ID = /^task-\d+-\d+$/;

/**
 * Kiểm tra dữ liệu đang lưu có "thuần mẫu" hay không: mọi project/task đều
 * mang id mẫu → người dùng chưa tự tạo dữ liệu riêng, an toàn để tự nâng cấp.
 */
export function hasOnlySampleData(
  projects: Pick<Project, 'id'>[] | undefined,
  tasks: Pick<Task, 'id'>[] | undefined
): boolean {
  if (!projects || !tasks) return false;
  return (
    projects.every((p) => SAMPLE_PROJECT_ID.test(p.id)) &&
    tasks.every((t) => SAMPLE_TASK_ID.test(t.id))
  );
}

/** Phần dữ liệu động thuộc về bộ mẫu (được thay khi nâng cấp seed). */
export interface SampleDataSlice {
  projects: Project[];
  tasks: Task[];
  taskUpdates: TaskUpdate[];
  attachments: Attachment[];
  messages: Message[];
}

/** Bộ dữ liệu mẫu mới nhất lấy từ mock-data. */
export function buildSampleSlice(): SampleDataSlice {
  return {
    projects: INITIAL_PROJECTS,
    tasks: INITIAL_TASKS,
    taskUpdates: INITIAL_UPDATES,
    attachments: INITIAL_ATTACHMENTS,
    messages: INITIAL_MESSAGES,
  };
}
