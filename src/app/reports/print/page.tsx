'use client';

/**
 * TRANG IN BÁO CÁO TỔNG HỢP A4 — route /reports/print
 * Route chuyên dụng cho in ấn: KHÔNG bọc AppShell (không sidebar/header app),
 * tự đọc dữ liệu thật từ store và render tài liệu A4 hoàn chỉnh.
 * Người dùng bấm "In / Lưu PDF" → hộp thoại in của trình duyệt → Lưu PDF.
 * Mọi con số tiến độ đều qua selector duy nhất (src/lib/selectors.ts).
 */

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Printer } from 'lucide-react';
import { useConstructionStore } from '@/lib/store';
import {
  selectProjectProgress,
  selectOverallProgress,
  getProjectContractValue,
} from '@/lib/selectors';
import { formatDateVN, formatCurrencyVN } from '@/lib/utils';
import { INCIDENT_SEVERITY_CONFIG, INCIDENT_STATUS_CONFIG } from '@/lib/types';

export default function PrintReportPage() {
  const allProjects = useConstructionStore((s) => s.projects);
  const tasks = useConstructionStore((s) => s.tasks);
  const users = useConstructionStore((s) => s.users);
  const getVisibleProjects = useConstructionStore((s) => s.getVisibleProjects);

  const visibleProjects = getVisibleProjects();
  const slice = { projects: allProjects, tasks };
  const today = new Date();
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  // ----- Số liệu tổng hợp (toàn bộ từ dữ liệu thật) -----
  const overall = selectOverallProgress(slice, visibleProjects);
  const rows = visibleProjects.map((p) => {
    const progress = selectProjectProgress(slice, p.id);
    const value = getProjectContractValue(p);
    const milestones = p.paymentMilestones || [];
    const totalMs = milestones.reduce((s, m) => s + m.amount, 0);
    const paidMs = milestones
      .filter((m) => m.status === 'paid')
      .reduce((s, m) => s + m.amount, 0);
    const paidPercent = totalMs > 0 ? Math.round((paidMs / totalMs) * 100) : null;
    const projectTasks = tasks.filter((t) => t.projectId === p.id && !t.isDeleted);
    const hasOverdue = projectTasks.some((t) => {
      if (t.status === 'approved' || t.status === 'submitted') return false;
      const due = new Date(t.dueDate);
      due.setHours(0, 0, 0, 0);
      return due < todayStart;
    });
    const statusLabel =
      p.status === 'completed'
        ? 'Đã hoàn thành'
        : progress <= 0
          ? 'Chưa khởi động'
          : hasOverdue
            ? 'Đang triển khai — có trễ hạn'
            : progress >= 85
              ? 'Sắp hoàn thành'
              : 'Đang triển khai';
    return { project: p, progress, value, paidPercent, statusLabel };
  });

  const totalValue = rows.reduce((s, r) => s + r.value, 0);
  const totalPaid = visibleProjects.reduce(
    (s, p) =>
      s +
      (p.paymentMilestones || [])
        .filter((m) => m.status === 'paid')
        .reduce((ms, m) => ms + m.amount, 0),
    0
  );
  const paidOverallPercent =
    totalValue > 0 ? Math.round((totalPaid / totalValue) * 100) : 0;

  const visibleIds = new Set(visibleProjects.map((p) => p.id));
  const visibleTasks = tasks.filter((t) => visibleIds.has(t.projectId) && !t.isDeleted);
  const pendingApproval = visibleTasks.filter((t) => t.status === 'submitted');
  const overdueTasks = visibleTasks.filter((t) => {
    if (t.status === 'approved' || t.status === 'submitted') return false;
    const due = new Date(t.dueDate);
    due.setHours(0, 0, 0, 0);
    return due < todayStart;
  });
  const openIncidents = visibleTasks
    .flatMap((t) => (t.incidents || []).map((i) => ({ incident: i, task: t })))
    .filter(({ incident }) => incident.status !== 'resolved');
  const severeIncidents = openIncidents.filter(
    ({ incident }) => incident.severity === 'high' || incident.severity === 'critical'
  );
  const notStartedProjects = rows.filter((r) => r.progress <= 0);
  const slowestActive = [...rows]
    .filter((r) => r.progress > 0)
    .sort((a, b) => a.progress - b.progress)[0];

  return (
    <div className="min-h-screen bg-slate-200/70 dark:bg-night py-6 print:min-h-0 print:bg-white print:py-0">
      {/* Thanh công cụ nổi — ẩn khi in (class no-print + button bị ẩn theo CSS in) */}
      <div className="no-print sticky top-4 z-10 mx-auto mb-5 flex w-[820px] max-w-[94vw] items-center justify-between rounded-2xl bg-white px-4 py-3 shadow-lg">
        <Link href="/reports" className="btn-ghost">
          <ArrowLeft className="w-4 h-4" />
          Quay lại Báo cáo
        </Link>
        <span className="hidden sm:inline text-xs font-semibold text-slate-500">
          Bản xem trước A4 — chọn “Lưu PDF” trong hộp thoại in
        </span>
        <button onClick={() => window.print()} className="btn-primary">
          <Printer className="w-4 h-4" />
          In / Lưu PDF
        </button>
      </div>

      {/* ===== TÀI LIỆU A4 (cuộn ngang trong .print-scroll trên màn hình hẹp) ===== */}
      <div className="print-scroll">
      <div className="print-doc mx-auto w-[820px] bg-white px-[18mm] py-[16mm] shadow-xl">
        {/* Đầu văn bản */}
        <div className="flex items-start justify-between gap-6 border-b-2 border-slate-900 pb-4">
          <div>
            <div className="font-bold uppercase tracking-wide">Đại học Phú Xuân</div>
            <div className="font-black uppercase">
              Ban Quản lý Dự án &amp; Cơ sở Vật chất
            </div>
            <div className="mt-1 text-[12px] text-slate-600">
              Số: {String(today.getDate()).padStart(2, '0')}
              {String(today.getMonth() + 1).padStart(2, '0')}/BC-QLDA
            </div>
          </div>
          <div className="text-center">
            <div className="font-bold uppercase">
              Cộng hòa xã hội chủ nghĩa Việt Nam
            </div>
            <div className="font-bold underline underline-offset-4">
              Độc lập - Tự do - Hạnh phúc
            </div>
            <div className="mt-2 text-[12px] italic text-slate-600">
              Huế, ngày {today.getDate()} tháng {today.getMonth() + 1} năm{' '}
              {today.getFullYear()}
            </div>
          </div>
        </div>

        {/* Tiêu đề */}
        <div className="my-6 text-center">
          <h1 className="text-[19px] font-black uppercase leading-snug">
            Báo cáo tiến độ các dự án cải tạo, sửa chữa
          </h1>
          <p className="mt-1 text-[13px] text-slate-600">
            Kỳ báo cáo: đến ngày {formatDateVN(today)} — Phạm vi:{' '}
            {visibleProjects.length} gói thầu thuộc quyền giám sát của người lập
          </p>
        </div>

        {/* Khối tổng hợp */}
        <table className="doc-table doc-keep">
          <tbody>
            <tr>
              <td className="w-1/4 bg-slate-50 font-semibold">
                Tiến độ chung (trọng số theo giá trị hợp đồng)
              </td>
              <td className="w-1/4 text-[16px] font-black">{overall}%</td>
              <td className="w-1/4 bg-slate-50 font-semibold">Tổng kinh phí</td>
              <td className="w-1/4 font-bold">{formatCurrencyVN(totalValue)}</td>
            </tr>
            <tr>
              <td className="bg-slate-50 font-semibold">Đã giải ngân</td>
              <td>
                {formatCurrencyVN(totalPaid)} ({paidOverallPercent}%)
              </td>
              <td className="bg-slate-50 font-semibold">Còn lại</td>
              <td>{formatCurrencyVN(Math.max(0, totalValue - totalPaid))}</td>
            </tr>
            <tr>
              <td className="bg-slate-50 font-semibold">Hồ sơ chờ nghiệm thu</td>
              <td>{pendingApproval.length} nhiệm vụ</td>
              <td className="bg-slate-50 font-semibold">Nhiệm vụ trễ hạn / Sự cố đang mở</td>
              <td>
                {overdueTasks.length} nhiệm vụ / {openIncidents.length} sự cố
              </td>
            </tr>
          </tbody>
        </table>

        {/* Bảng chi tiết 16 gói */}
        <h2 className="doc-section">I. Tiến độ chi tiết từng gói thầu</h2>
        <table className="doc-table" style={{ tableLayout: 'fixed' }}>
          <colgroup>
            <col style={{ width: '4%' }} />
            <col style={{ width: '11%' }} />
            <col style={{ width: '26%' }} />
            <col style={{ width: '14%' }} />
            <col style={{ width: '13%' }} />
            <col style={{ width: '6%' }} />
            <col style={{ width: '7%' }} />
            <col style={{ width: '12%' }} />
            <col style={{ width: '7%' }} />
          </colgroup>
          <thead>
            <tr>
              <th className="text-center">STT</th>
              <th>Mã gói</th>
              <th>Tên gói thầu</th>
              <th>Nhà thầu</th>
              <th>Giá trị HĐ (VNĐ)</th>
              <th className="text-center">Tiến độ</th>
              <th className="text-center">Giải ngân</th>
              <th>Trạng thái</th>
              <th>Hạn hoàn thành</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, idx) => (
              <tr key={r.project.id}>
                <td className="text-center">{idx + 1}</td>
                <td className="font-mono text-[11px]">{r.project.code}</td>
                <td className="font-semibold">{r.project.name}</td>
                <td>{r.project.contractor || '—'}</td>
                <td className="font-mono text-[11px]">
                  {r.value > 0 ? formatCurrencyVN(r.value) : '—'}
                </td>
                <td className="text-center font-black">{r.progress}%</td>
                <td className="text-center">
                  {r.paidPercent === null ? '—' : `${r.paidPercent}%`}
                </td>
                <td>{r.statusLabel}</td>
                <td className="whitespace-nowrap">{formatDateVN(r.project.endDate)}</td>
              </tr>
            ))}
            <tr>
              <td colSpan={4} className="bg-slate-50 text-right font-black uppercase">
                Tổng cộng
              </td>
              <td className="bg-slate-50 font-mono text-[11px] font-black">
                {formatCurrencyVN(totalValue)}
              </td>
              <td className="bg-slate-50 text-center font-black">{overall}%</td>
              <td className="bg-slate-50 text-center font-black">
                {paidOverallPercent}%
              </td>
              <td colSpan={2} className="bg-slate-50" />
            </tr>
          </tbody>
        </table>

        {/* Sự cố đang mở */}
        <h2 className="doc-section">II. Sự cố hiện trường đang mở ({openIncidents.length})</h2>
        {openIncidents.length === 0 ? (
          <p>Hiện không có sự cố nào đang mở trong phạm vi báo cáo.</p>
        ) : (
          <table className="doc-table">
            <thead>
              <tr>
                <th className="w-[34px] text-center">STT</th>
                <th>Sự cố</th>
                <th className="w-[150px]">Gói thầu</th>
                <th className="w-[110px]">Mức độ</th>
                <th className="w-[110px]">Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {openIncidents.map(({ incident, task }, idx) => {
                const proj = visibleProjects.find((p) => p.id === task.projectId);
                return (
                  <tr key={incident.id}>
                    <td className="text-center">{idx + 1}</td>
                    <td>
                      <div className="font-semibold">{incident.title}</div>
                      <div className="text-[11.5px] text-slate-600">
                        {incident.description}
                      </div>
                    </td>
                    <td>{proj?.code}</td>
                    <td>{INCIDENT_SEVERITY_CONFIG[incident.severity].label.split(' (')[0]}</td>
                    <td>{INCIDENT_STATUS_CONFIG[incident.status].label}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}

        {/* Kết luận & kiến nghị — tự sinh từ dữ liệu */}
        <h2 className="doc-section">III. Kết luận &amp; Kiến nghị</h2>
        <div className="space-y-2">
          <p>
            - Tiến độ chung của {visibleProjects.length} gói thầu đạt {overall}% (tính
            trọng số theo giá trị hợp đồng) trên tổng kinh phí{' '}
            {formatCurrencyVN(totalValue)}; đã giải ngân {formatCurrencyVN(totalPaid)} (
            {paidOverallPercent}%).
            {pendingApproval.length > 0
              ? ` Hiện có ${pendingApproval.length} hồ sơ nhiệm vụ đang chờ nghiệm thu (${pendingApproval
                  .slice(0, 3)
                  .map((t) => `“${t.title}”`)
                  .join('; ')}).`
              : ' Hiện không có hồ sơ nào chờ nghiệm thu.'}
          </p>
          {overdueTasks.length > 0 && (
            <p>
              - Còn {overdueTasks.length} nhiệm vụ đã trễ hạn chưa hoàn thành (
              {overdueTasks
                .slice(0, 3)
                .map((t) => `“${t.title}” — hạn ${formatDateVN(t.dueDate)}`)
                .join('; ')}
              ). Yêu cầu giám sát phụ trách đôn đốc nhà thầu xử lý dứt điểm và báo cáo
              lại Ban Quản lý dự án.
            </p>
          )}
          {openIncidents.length > 0 && (
            <p>
              - Đang có {openIncidents.length} sự cố chưa xử lý xong
              {severeIncidents.length > 0
                ? `, trong đó ${severeIncidents.length} sự cố nghiêm trọng/rất khẩn cấp (tiêu biểu: “${severeIncidents[0].incident.title}”)`
                : ''}
              . Kiến nghị ưu tiên phê duyệt phương án khắc phục và theo dõi cho tới khi
              đóng toàn bộ sự cố.
            </p>
          )}
          {notStartedProjects.length > 0 && (
            <p>
              - {notStartedProjects.length} gói chưa khởi động (
              {notStartedProjects.map((r) => r.project.code).join(', ')}). Kiến nghị đẩy
              nhanh thủ tục chủ trương, thiết kế và chọn nhà thầu để tránh dồn tiến độ
              cuối kỳ.
            </p>
          )}
          {slowestActive && (
            <p>
              - Gói đang có tiến độ thấp nhất trong số các gói đã triển khai là{' '}
              {slowestActive.project.code} ({slowestActive.progress}%). Kiến nghị Ban
              Quản lý dự án làm việc trực tiếp với nhà thầu của gói này để rà soát lại
              kế hoạch thi công chi tiết.
            </p>
          )}
          <p>
            - Kết luận:{' '}
            {overdueTasks.length === 0 && openIncidents.length === 0
              ? 'Các gói thầu đang được kiểm soát đúng kế hoạch, không phát sinh trễ hạn hay sự cố mở; đề nghị tiếp tục duy trì nhịp giám sát hiện tại.'
              : 'Tiến độ chung vẫn trong tầm kiểm soát nhưng còn tồn tại trễ hạn/sự cố nêu trên; chỉ nghiệm thu từng gói khi các tồn tại thuộc gói đó được xử lý dứt điểm.'}
          </p>
        </div>

        {/* Khối ký — để trống ký tay */}
        <div className="doc-keep mt-10 grid grid-cols-2 gap-10 text-center">
          <div>
            <div className="font-bold uppercase">Người lập báo cáo</div>
            <div className="text-[11.5px] italic text-slate-500">
              (Ký và ghi rõ họ tên)
            </div>
            <div className="h-24" />
            <div className="border-t border-dotted border-slate-400 pt-1 text-slate-400">
              . . . . . . . . . . . . . . . . . .
            </div>
          </div>
          <div>
            <div className="font-bold uppercase">Trưởng ban QLDA &amp; CSVC</div>
            <div className="text-[11.5px] italic text-slate-500">
              (Ký và ghi rõ họ tên)
            </div>
            <div className="h-24" />
            <div className="border-t border-dotted border-slate-400 pt-1 text-slate-400">
              . . . . . . . . . . . . . . . . . .
            </div>
          </div>
        </div>

        <p className="mt-8 text-[11px] italic text-slate-500">
          Ghi chú: Người lập báo cáo hiện tại —{' '}
          {users.find((u) => u.role === 'admin')?.name || ''} (Chủ trì kế hoạch). Số
          liệu tiến độ được hệ thống suy ra từ báo cáo nghiệm thu của từng nhiệm vụ,
          trọng số theo khối lượng đầu việc; tiến độ chung trọng số theo giá trị hợp
          đồng của từng gói.
        </p>
      </div>
      </div>
    </div>
  );
}
