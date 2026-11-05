'use client';

/**
 * TRANG IN BIÊN BẢN NGHIỆM THU A4 — route /reports/minutes/[taskId]
 * Chỉ áp dụng cho nhiệm vụ đã nghiệm thu (status = 'approved'): nút "In biên
 * bản nghiệm thu" trong modal chi tiết task chỉ hiện với task approved, và
 * route này cũng tự kiểm tra lại — task chưa approved sẽ thấy thông báo thay
 * vì biên bản (không đóng dấu, không kết luận đạt).
 * KHÔNG bọc AppShell; dữ liệu đọc trực tiếp từ store.
 */

import React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, Printer, ShieldAlert } from 'lucide-react';
import { useConstructionStore } from '@/lib/store';
import { formatDateVN, formatDateTimeVN } from '@/lib/utils';

export default function PrintMinutesPage() {
  const params = useParams<{ taskId: string }>();
  const taskId = params?.taskId;

  const tasks = useConstructionStore((s) => s.tasks);
  const projects = useConstructionStore((s) => s.projects);
  const users = useConstructionStore((s) => s.users);
  const attachments = useConstructionStore((s) => s.attachments);
  const taskUpdates = useConstructionStore((s) => s.taskUpdates);

  const task = tasks.find((t) => t.id === taskId && !t.isDeleted);
  const today = new Date();

  // Thanh công cụ dùng chung cho cả 2 trạng thái (ẩn khi in)
  const toolbar = (
    <div className="no-print sticky top-4 z-10 mx-auto mb-5 flex w-[820px] max-w-[94vw] items-center justify-between rounded-2xl bg-white px-4 py-3 shadow-lg">
      <Link href="/projects" className="btn-ghost">
        <ArrowLeft className="w-4 h-4" />
        Quay lại
      </Link>
      <span className="text-xs font-semibold text-slate-500">
        Biên bản nghiệm thu A4 — chọn “Lưu PDF” trong hộp thoại in
      </span>
      <button onClick={() => window.print()} className="btn-primary">
        <Printer className="w-4 h-4" />
        In / Lưu PDF
      </button>
    </div>
  );

  if (!task || task.status !== 'approved') {
    return (
      <div className="min-h-screen bg-slate-200/70 dark:bg-night py-6">
        {toolbar}
        <div className="mx-auto w-[820px] max-w-[94vw] rounded-2xl bg-white p-10 text-center shadow-xl">
          <ShieldAlert className="mx-auto mb-3 h-10 w-10 text-amber-500" />
          <h1 className="text-lg font-extrabold text-slate-900">
            Chưa có biên bản nghiệm thu cho nhiệm vụ này
          </h1>
          <p className="mx-auto mt-2 max-w-md text-sm text-slate-600">
            {!task
              ? 'Không tìm thấy nhiệm vụ tương ứng trong dữ liệu hiện tại.'
              : 'Biên bản nghiệm thu chỉ được lập sau khi Chủ trì dự án đã duyệt nghiệm thu nhiệm vụ. Nhiệm vụ này chưa ở trạng thái "Đã nghiệm thu" nên chưa thể xuất biên bản.'}
          </p>
        </div>
      </div>
    );
  }

  const project = projects.find((p) => p.id === task.projectId);
  const assignee = users.find((u) => u.id === task.assigneeId);
  const approver = users.find((u) => u.id === task.approvedBy);
  const shortCode = (project?.code || '').replace('PXU-2026-', '');
  const minutesNo = `BBNT-${shortCode}/${task.id.replace('task-', '')}`;
  const approvedDate = task.approvedAt ? new Date(task.approvedAt) : null;

  // Minh chứng của task: pool attachments + attachments nhúng trong các
  // lần báo cáo (taskUpdates) — gộp và khử trùng theo id.
  const evidenceMap = new Map<string, { name: string; type: string; caption?: string }>();
  attachments
    .filter((a) => a.taskId === task.id)
    .forEach((a) => evidenceMap.set(a.id, { name: a.name, type: a.type, caption: a.caption }));
  taskUpdates
    .filter((u) => u.taskId === task.id)
    .forEach((u) =>
      (u.attachments || []).forEach((a) =>
        evidenceMap.set(a.id, { name: a.name, type: a.type, caption: a.caption })
      )
    );
  const evidence = [...evidenceMap.values()];

  return (
    <div className="min-h-screen bg-slate-200/70 dark:bg-night py-6 print:min-h-0 print:bg-white print:py-0">
      {toolbar}

      {/* ===== BIÊN BẢN A4 ===== */}
      <div className="print-doc mx-auto w-[820px] max-w-[94vw] bg-white px-[18mm] py-[16mm] shadow-xl">
        <div className="flex items-start justify-between gap-6 border-b-2 border-slate-900 pb-4">
          <div>
            <div className="font-bold uppercase tracking-wide">Đại học Phú Xuân</div>
            <div className="font-black uppercase">
              Ban Quản lý Dự án &amp; Cơ sở Vật chất
            </div>
            <div className="mt-1 text-[12px] text-slate-600">Số: {minutesNo}</div>
          </div>
          <div className="text-center">
            <div className="font-bold uppercase">
              Cộng hòa xã hội chủ nghĩa Việt Nam
            </div>
            <div className="font-bold underline underline-offset-4">
              Độc lập - Tự do - Hạnh phúc
            </div>
            <div className="mt-2 text-[12px] italic text-slate-600">
              Huế, ngày {approvedDate ? approvedDate.getDate() : today.getDate()} tháng{' '}
              {approvedDate ? approvedDate.getMonth() + 1 : today.getMonth() + 1} năm{' '}
              {approvedDate ? approvedDate.getFullYear() : today.getFullYear()}
            </div>
          </div>
        </div>

        <div className="my-6 text-center">
          <h1 className="text-[19px] font-black uppercase leading-snug">
            Biên bản nghiệm thu hoàn thành công việc
          </h1>
          <p className="mt-1 text-[13px] text-slate-600">
            Gói thầu: {project?.name} ({project?.code})
          </p>
        </div>

        <p>
          Hôm nay, vào hồi {approvedDate ? formatDateTimeVN(task.approvedAt) : '—'}, tại{' '}
          {project?.location || 'hiện trường thi công'}, Ban Quản lý Dự án &amp; Cơ sở
          Vật chất — Đại học Phú Xuân tổ chức nghiệm thu công việc sau:
        </p>

        <h2 className="doc-section">I. Nội dung công việc nghiệm thu</h2>
        <table className="doc-table doc-keep">
          <tbody>
            <tr>
              <td className="w-1/4 bg-slate-50 font-semibold">Tên công việc</td>
              <td className="font-bold">{task.title}</td>
            </tr>
            <tr>
              <td className="bg-slate-50 font-semibold">Mô tả khối lượng</td>
              <td>{task.description}</td>
            </tr>
            <tr>
              <td className="bg-slate-50 font-semibold">Thời gian thực hiện</td>
              <td>
                Từ {formatDateVN(task.startDate)} đến {formatDateVN(task.dueDate)} —
                Nghiệm thu ngày {formatDateVN(task.approvedAt)}
              </td>
            </tr>
            <tr>
              <td className="bg-slate-50 font-semibold">Mức độ hoàn thành</td>
              <td className="font-black">100% khối lượng theo yêu cầu</td>
            </tr>
          </tbody>
        </table>

        {task.subtasks && task.subtasks.length > 0 && (
          <>
            <h2 className="doc-section">II. Chi tiết các đầu việc đã hoàn thành</h2>
            <table className="doc-table">
              <thead>
                <tr>
                  <th className="w-[34px] text-center">STT</th>
                  <th>Đầu việc</th>
                  <th className="w-[110px] text-center">Kết quả</th>
                </tr>
              </thead>
              <tbody>
                {task.subtasks.map((st, idx) => (
                  <tr key={st.id}>
                    <td className="text-center">{idx + 1}</td>
                    <td>{st.title}</td>
                    <td className="text-center font-semibold">
                      {st.completed ? '☑ Đạt' : '☐ Chưa đạt'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}

        <h2 className="doc-section">
          {task.subtasks && task.subtasks.length > 0 ? 'III' : 'II'}. Hồ sơ minh chứng
          kèm theo ({evidence.length})
        </h2>
        {evidence.length === 0 ? (
          <p>Không có tệp minh chứng đính kèm trong hệ thống cho công việc này.</p>
        ) : (
          <table className="doc-table">
            <thead>
              <tr>
                <th className="w-[34px] text-center">STT</th>
                <th>Tên tệp minh chứng</th>
                <th className="w-[80px]">Loại</th>
                <th>Ghi chú</th>
              </tr>
            </thead>
            <tbody>
              {evidence.map((e, idx) => (
                <tr key={idx}>
                  <td className="text-center">{idx + 1}</td>
                  <td className="font-mono text-[11.5px]">{e.name}</td>
                  <td>{e.type === 'video' ? 'Video' : 'Hình ảnh'}</td>
                  <td>{e.caption || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        <h2 className="doc-section">
          {task.subtasks && task.subtasks.length > 0 ? 'IV' : 'III'}. Thành phần tham gia
          &amp; Kết luận
        </h2>
        <table className="doc-table doc-keep">
          <tbody>
            <tr>
              <td className="w-1/4 bg-slate-50 font-semibold">Bên giao</td>
              <td>
                Nhà thầu: {project?.contractor || '—'}. Đại diện giám sát báo cáo:{' '}
                <b>{assignee?.name}</b>
                {assignee?.title ? ` — ${assignee.title}` : ''}
              </td>
            </tr>
            <tr>
              <td className="bg-slate-50 font-semibold">Bên nhận</td>
              <td>
                Ban Quản lý Dự án &amp; CSVC — Đại diện nghiệm thu: <b>{approver?.name}</b>
                {approver?.title ? ` — ${approver.title}` : ''}
              </td>
            </tr>
            <tr>
              <td className="bg-slate-50 font-semibold">Kết luận</td>
              <td>
                <b>Đạt — đồng ý nghiệm thu</b> toàn bộ khối lượng công việc nêu trên.
                Chất lượng đạt yêu cầu theo hồ sơ thiết kế và minh chứng kèm theo; kết
                quả nghiệm thu này là căn cứ để thanh toán theo điều khoản hợp đồng của
                gói thầu {project?.code}.
              </td>
            </tr>
          </tbody>
        </table>

        <div className="doc-keep mt-10 grid grid-cols-2 gap-10 text-center">
          <div>
            <div className="font-bold uppercase">Đại diện bên giao</div>
            <div className="text-[11.5px] italic text-slate-500">
              (Ký và ghi rõ họ tên)
            </div>
            <div className="h-24" />
            <div className="font-bold">{assignee?.name}</div>
          </div>
          <div>
            <div className="font-bold uppercase">Đại diện bên nhận</div>
            <div className="text-[11.5px] italic text-slate-500">
              (Ký và ghi rõ họ tên)
            </div>
            <div className="h-24" />
            <div className="font-bold">{approver?.name}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
