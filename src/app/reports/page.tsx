'use client';

import React, { useState } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { PageHeader } from '@/components/ui/PageHeader';
import { RowMenu } from '@/components/ui/RowMenu';
import { useConstructionStore } from '@/lib/store';
import { Printer, Sparkles } from 'lucide-react';
import { formatDateVN, formatCurrencyVN } from '@/lib/utils';
import { TASK_STATUS_CONFIG, CATEGORY_CONFIG, INCIDENT_SEVERITY_CONFIG, INCIDENT_STATUS_CONFIG } from '@/lib/types';

const INCIDENT_TYPE_LABELS: Record<string, string> = {
  weather: 'thời tiết',
  material: 'vật tư',
  technical: 'kỹ thuật',
  site: 'mặt bằng',
  other: 'phát sinh khác',
};

export default function ReportsPage() {
  const getVisibleProjects = useConstructionStore((s) => s.getVisibleProjects);
  const tasks = useConstructionStore((s) => s.tasks);
  const users = useConstructionStore((s) => s.users);
  const calculateProjectProgress = useConstructionStore((s) => s.calculateProjectProgress);
  const currentUser = useConstructionStore((s) => s.currentUser);
  const getProjectIncidents = useConstructionStore((s) => s.getProjectIncidents);

  const visibleProjects = getVisibleProjects();
  const [selectedProjectId, setSelectedProjectId] = useState<string>(visibleProjects[0]?.id || '');

  // Ensure selectedProjectId is within user's allowed projects
  const activeSelectedId = visibleProjects.some((p) => p.id === selectedProjectId)
    ? selectedProjectId
    : visibleProjects[0]?.id || '';

  const project = visibleProjects.find((p) => p.id === activeSelectedId);
  const projectTasks = tasks.filter((t) => t.projectId === project?.id && !t.isDeleted);
  const progress = project ? calculateProjectProgress(project.id) : 0;
  const catConfig = project?.category ? CATEGORY_CONFIG[project.category] : null;

  const milestones = project?.paymentMilestones || [];
  const projectIncidents = project ? getProjectIncidents(project.id) : [];

  // ===== Số liệu tự sinh cho mục IV (toàn bộ tính từ dữ liệu thật của dự án đang chọn) =====
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const overdueProjectTasks = projectTasks.filter((t) => {
    if (t.status === 'submitted' || t.status === 'approved') return false;
    const due = new Date(t.dueDate);
    due.setHours(0, 0, 0, 0);
    return due < todayStart;
  });
  const openProjectIncidents = projectIncidents.filter(
    (i) => i.status === 'open' || i.status === 'resolving'
  );
  const mainOpenIncidentType = (() => {
    if (openProjectIncidents.length === 0) return null;
    const counts = new Map<string, number>();
    openProjectIncidents.forEach((i) => counts.set(i.type, (counts.get(i.type) || 0) + 1));
    const topType = [...counts.entries()].sort((a, b) => b[1] - a[1])[0][0];
    return INCIDENT_TYPE_LABELS[topType] || topType;
  })();
  const paidMilestones = milestones.filter((m) => m.status === 'paid');
  const paidMilestonePercent =
    milestones.length > 0 ? Math.round((paidMilestones.length / milestones.length) * 100) : 0;
  const approvedTaskCount = projectTasks.filter((t) => t.status === 'approved').length;
  const allTasksApproved =
    projectTasks.length > 0 && projectTasks.every((t) => t.status === 'approved');
  const hasIssues = overdueProjectTasks.length > 0 || openProjectIncidents.length > 0;

  // Người ký động: cộng sự = assignee đầu tiên trong memberIds của dự án; chủ trì = managerId (admin)
  const leadAssignee = project
    ? project.memberIds
        .map((id) => users.find((u) => u.id === id))
        .find((u) => u?.role === 'assignee') || users.find((u) => u.role === 'assignee')
    : undefined;
  const projectManager = project
    ? users.find((u) => u.id === project.managerId) || users.find((u) => u.role === 'admin')
    : undefined;

  const handlePrint = () => {
    window.print();
  };

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Screen Toolbar (hidden in print) */}
        <div className="no-print">
          <PageHeader
            eyebrow="Báo cáo & Đánh giá"
            title="Báo cáo Tiến độ Kế hoạch & Kinh phí Dự án"
            description="Xuất biên bản tổng hợp tiến độ, phân kỳ kinh phí và xử lý phát sinh để trình Ban Giám hiệu và Hội đồng Lãnh đạo"
          >
            <div className="w-64 max-w-full">
              <select
                value={activeSelectedId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                aria-label="Chọn kế hoạch để xuất báo cáo"
                className="input font-semibold"
              >
                {visibleProjects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.code} - {p.name}
                  </option>
                ))}
              </select>
            </div>
            <RowMenu
              label="Xuất báo cáo"
              items={[
                {
                  label: 'In / Xuất PDF',
                  icon: <Printer className="w-4 h-4" />,
                  onClick: handlePrint,
                },
              ]}
            />
          </PageHeader>
        </div>

        {/* Printable Document Sheet */}
        {!project ? (
          <div className="card py-20 text-center max-w-md mx-auto p-8">
            <h2 className="text-lg font-bold text-ink dark:text-slate-200">
              Không có dự án nào khả dụng
            </h2>
            <p className="text-xs text-ink-soft mt-1">
              Tài khoản hiện tại ({currentUser.name}) chưa được cấp quyền giám sát dự án nào để xuất báo cáo.
            </p>
          </div>
        ) : (
          <div className="card bg-white text-slate-900 p-6 sm:p-10 print-card max-w-4xl mx-auto">
            {/* Header Form / Quốc hiệu & Tiêu ngữ */}
            <div className="flex flex-col sm:flex-row justify-between items-start border-b-2 border-slate-900 pb-6 mb-6 gap-4">
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  TRƯỜNG ĐẠI HỌC PHÚ XUÂN (PXU)
                </div>
                <div className="text-sm font-black uppercase text-slate-900">
                  BAN CHỦ TRÌ DỰ ÁN & QUẢN TRỊ MỤC TIÊU
                </div>
                <div className="text-xs text-slate-500 mt-1 font-mono">
                  Số: {project.code}/BC-PXU
                </div>
              </div>

              <div className="text-right sm:text-right">
                <div className="text-xs font-bold uppercase">
                  CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
                </div>
                <div className="text-xs font-bold underline mt-0.5">
                  Độc lập - Tự do - Hạnh phúc
                </div>
                <div className="text-[11px] text-slate-500 italic mt-2">
                  Huế, ngày {new Date().getDate()} tháng {new Date().getMonth() + 1} năm{' '}
                  {new Date().getFullYear()}
                </div>
              </div>
            </div>

            {/* Document Title */}
            <div className="text-center my-6">
              <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-slate-900">
                BÁO CÁO TIẾN ĐỘ THỰC HIỆN, KINH PHÍ & XỬ LÝ PHÁT SINH
              </h2>
              <p className="text-sm font-bold text-indigo-600 mt-1">
                Kế hoạch: {project.name}
              </p>
              <div className="flex items-center justify-center gap-2 mt-1">
                <span className="text-xs text-slate-500 font-mono">
                  Mã dự án: {project.code}
                </span>
                {catConfig && (
                  <span className="text-[11px] px-2 py-0.5 rounded bg-slate-100 font-semibold text-slate-700 border border-slate-300">
                    Lĩnh vực: {catConfig.label}
                  </span>
                )}
              </div>
            </div>

            {/* Summary Information Table */}
            <div className="mb-6 rounded-xl border border-slate-300 overflow-hidden text-xs">
              <div className="grid grid-cols-2 sm:grid-cols-4 bg-slate-50 divide-x divide-slate-300 border-b border-slate-300 p-3 font-semibold text-slate-600">
                <div>Đơn vị chủ trì / Phối hợp</div>
                <div>Kinh phí dự toán</div>
                <div>Thời gian thực hiện</div>
                <div>Tiến độ tổng thể</div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-slate-300 p-3 font-bold text-slate-900">
                <div>{project.organization || project.contractor}</div>
                <div className="font-mono">{project.budget}</div>
                <div className="font-mono">
                  {formatDateVN(project.startDate)} - {formatDateVN(project.endDate)}
                </div>
                <div className="text-indigo-600 font-mono text-base">{progress}%</div>
              </div>
            </div>

            {/* Directive snippet if exists */}
            {project.directive && (
              <div className="mb-6 p-4 rounded-xl border border-indigo-300/60 bg-indigo-50 text-xs">
                <div className="font-bold text-indigo-600 flex items-center gap-1.5 mb-1">
                  <Sparkles className="w-3.5 h-3.5" />
                  Ý kiến chỉ đạo của Lãnh đạo ({project.directive.authorName} - {project.directive.authorTitle}):
                </div>
                <p className="italic text-slate-800">&ldquo;{project.directive.content}&rdquo;</p>
              </div>
            )}

            {/* Section I: Tasks Detail Table */}
            <div className="mb-6">
              <h3 className="font-bold text-xs uppercase tracking-wider mb-2 text-slate-700">
                I. Danh mục chi tiết các mục tiêu & sản phẩm bàn giao ({projectTasks.length} nhiệm vụ)
              </h3>
              <div className="border border-slate-300 rounded-xl overflow-hidden">
                <table className="table-base">
                  <thead className="bg-slate-100 border-b border-slate-300 text-slate-700 font-bold uppercase text-[10px]">
                    <tr>
                      <th className="py-2.5 px-3 w-10 text-center">STT</th>
                      <th className="py-2.5 px-3">Nhiệm vụ & Sản phẩm đầu ra</th>
                      <th className="py-2.5 px-3">Cộng sự phụ trách</th>
                      <th className="py-2.5 px-3">Hạn chót</th>
                      <th className="py-2.5 px-3 text-center">Tiến độ (%)</th>
                      <th className="py-2.5 px-3 text-right">Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {projectTasks.map((t, idx) => {
                      const assignee = users.find((u) => u.id === t.assigneeId);
                      return (
                        <tr key={t.id} className="hover:bg-slate-50">
                          <td className="py-2 px-3 text-center font-mono text-slate-500">
                            {idx + 1}
                          </td>
                          <td className="py-2 px-3">
                            <div className="font-bold text-slate-900">{t.title}</div>
                            <div className="text-[10px] text-slate-500 line-clamp-1">
                              {t.description}
                            </div>
                          </td>
                          <td className="py-2 px-3 text-slate-700">{assignee?.name}</td>
                          <td className="py-2 px-3 font-mono">{formatDateVN(t.dueDate)}</td>
                          <td className="py-2 px-3 text-center font-mono font-bold">
                            {t.progress}%
                          </td>
                          <td className="py-2 px-3 text-right font-semibold">
                            {TASK_STATUS_CONFIG[t.status].label}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Section II: Payment Milestones Table */}
            {milestones.length > 0 && (
              <div className="mb-6">
                <h3 className="font-bold text-xs uppercase tracking-wider mb-2 text-slate-700">
                  II. Tiến độ giải ngân kinh phí theo các đợt ({milestones.length} đợt)
                </h3>
                <div className="border border-slate-300 rounded-xl overflow-hidden">
                  <table className="table-base">
                    <thead className="bg-slate-100 border-b border-slate-300 text-slate-700 font-bold uppercase text-[10px]">
                      <tr>
                        <th className="py-2.5 px-3">Đợt nộp & Nội dung chi</th>
                        <th className="py-2.5 px-3 text-center">Tỷ lệ</th>
                        <th className="py-2.5 px-3">Số tiền (VNĐ)</th>
                        <th className="py-2.5 px-3">Hạn nộp</th>
                        <th className="py-2.5 px-3">Ngày nộp</th>
                        <th className="py-2.5 px-3 text-right">Trạng thái</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {milestones.map((m) => {
                        const isPaid = m.status === 'paid';
                        const isOverdue = m.status === 'overdue';
                        return (
                          <tr key={m.id} className="hover:bg-slate-50">
                            <td className="py-2 px-3">
                              <div className="font-bold text-slate-900">{m.title}</div>
                              <div className="text-[10px] text-slate-500 line-clamp-1">
                                {m.description || m.note}
                              </div>
                            </td>
                            <td className="py-2 px-3 text-center font-mono font-bold">
                              {m.percentage}%
                            </td>
                            <td className="py-2 px-3 font-mono font-bold text-slate-900 whitespace-nowrap">
                              {formatCurrencyVN(m.amount)}
                            </td>
                            <td className="py-2 px-3 font-mono text-slate-600">
                              {formatDateVN(m.dueDate)}
                            </td>
                            <td className="py-2 px-3 font-mono text-emerald-600">
                              {m.paidDate ? formatDateVN(m.paidDate) : '—'}
                            </td>
                            <td className="py-2 px-3 text-right font-semibold">
                              {isPaid ? (
                                <span className="text-emerald-600 font-bold">Đã nộp</span>
                              ) : isOverdue ? (
                                <span className="text-rose-600 font-bold">Quá hạn</span>
                              ) : (
                                <span className="text-amber-600 font-bold">Chưa nộp</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Section III: Incidents Summary Table */}
            {projectIncidents.length > 0 && (
              <div className="mb-6">
                <h3 className="font-bold text-xs uppercase tracking-wider mb-2 text-slate-700">
                  III. Tổng hợp các mục phát sinh & Trở ngại hiện trường ({projectIncidents.length} mục)
                </h3>
                <div className="border border-slate-300 rounded-xl overflow-hidden">
                  <table className="table-base">
                    <thead className="bg-slate-100 border-b border-slate-300 text-slate-700 font-bold uppercase text-[10px]">
                      <tr>
                        <th className="py-2.5 px-3">Nội dung phát sinh & Nguyên nhân</th>
                        <th className="py-2.5 px-3">Mức độ</th>
                        <th className="py-2.5 px-3">Phương án khắc phục đã triển khai</th>
                        <th className="py-2.5 px-3">Người báo cáo</th>
                        <th className="py-2.5 px-3 text-right">Trạng thái</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {projectIncidents.map((inc) => {
                        const sev = INCIDENT_SEVERITY_CONFIG[inc.severity];
                        const st = INCIDENT_STATUS_CONFIG[inc.status];
                        return (
                          <tr key={inc.id} className="hover:bg-slate-50">
                            <td className="py-2 px-3">
                              <div className="font-bold text-slate-900">{inc.title}</div>
                              <div className="text-[10px] text-slate-500 line-clamp-1">{inc.description}</div>
                            </td>
                            <td className="py-2 px-3 font-semibold whitespace-nowrap">
                              {sev.label}
                            </td>
                            <td className="py-2 px-3 text-slate-700">
                              {inc.solution || 'Đang theo dõi xử lý'}
                            </td>
                            <td className="py-2 px-3 text-slate-600 whitespace-nowrap">
                              {users.find((u) => u.id === inc.reportedBy)?.name ?? inc.reportedBy}
                            </td>
                            <td className="py-2 px-3 text-right font-semibold whitespace-nowrap">
                              {st.label}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Section IV: Technical Evaluation Notes */}
            <div className="mb-8 p-4 rounded-xl border border-slate-300 bg-slate-50 text-xs space-y-1">
              <strong className="block font-bold uppercase text-[11px] text-slate-700">
                IV. Đánh giá tiến độ & Kết luận của Chủ trì dự án:
              </strong>
              <p className="text-slate-700 leading-relaxed">
                - Tiến độ tổng thể của dự án hiện đạt {progress}%: {approvedTaskCount}/
                {projectTasks.length} nhiệm vụ đã được nghiệm thu
                {milestones.length > 0
                  ? `; kinh phí đã thanh toán ${paidMilestones.length}/${milestones.length} đợt phân kỳ (${paidMilestonePercent}%).`
                  : '; dự án chưa có phân kỳ thanh toán nào được ghi nhận.'}
              </p>
              {overdueProjectTasks.length > 0 && (
                <p className="text-slate-700 leading-relaxed">
                  - Hiện còn {overdueProjectTasks.length} nhiệm vụ đã quá hạn chưa hoàn thành (
                  {overdueProjectTasks
                    .slice(0, 3)
                    .map((t) => `“${t.title}” — hạn ${formatDateVN(t.dueDate)}`)
                    .join('; ')}
                  {overdueProjectTasks.length > 3 ? '; …' : ''}). Yêu cầu cộng sự phụ trách đôn
                  đốc xử lý dứt điểm và báo cáo lại Chủ trì dự án.
                </p>
              )}
              {openProjectIncidents.length > 0 && (
                <p className="text-slate-700 leading-relaxed">
                  - Đang có {openProjectIncidents.length} sự cố chưa xử lý xong
                  {mainOpenIncidentType ? `, chủ yếu thuộc nhóm ${mainOpenIncidentType}` : ''}.
                  Yêu cầu tiếp tục theo dõi biện pháp khắc phục cho tới khi đóng toàn bộ sự cố.
                </p>
              )}
              <p className="text-slate-700 leading-relaxed">
                {hasIssues
                  ? '- Kết luận: Dự án chưa đạt trạng thái hoàn thành toàn diện do còn tồn tại nêu trên; chỉ nghiệm thu toàn bộ khi mọi nhiệm vụ quá hạn được xử lý và các sự cố đang mở được đóng.'
                  : `- Kết luận: Dự án không còn nhiệm vụ quá hạn và không còn sự cố đang mở${
                      allTasksApproved
                        ? '; toàn bộ nhiệm vụ đã nghiệm thu đạt, đủ điều kiện đóng dự án.'
                        : '; tiến độ đang được kiểm soát, tiếp tục triển khai các nhiệm vụ còn lại theo kế hoạch.'
                    }`}
              </p>
            </div>

            {/* Official Signatures Block */}
            <div className="grid grid-cols-3 gap-6 pt-6 text-center text-xs">
              <div>
                <div className="font-bold uppercase text-slate-800">NGƯỜI LẬP BIỂU</div>
                <div className="text-[10px] text-slate-400 italic mt-0.5">(Ký và ghi rõ họ tên)</div>
                <div className="h-16 flex items-center justify-center font-serif text-slate-400 italic text-sm">
                  ........................
                </div>
                <div className="font-bold text-slate-900">{currentUser.name}</div>
              </div>

              <div>
                <div className="font-bold uppercase text-slate-800">CỘNG SỰ PHỤ TRÁCH</div>
                <div className="text-[10px] text-slate-400 italic mt-0.5">(Ký và ghi rõ họ tên)</div>
                <div className="h-16 flex items-center justify-center font-serif text-slate-400 italic text-sm">
                  ........................
                </div>
                <div className="font-bold text-slate-900">{leadAssignee?.name || '—'}</div>
              </div>

              <div>
                <div className="font-bold uppercase text-slate-800">CHỦ TRÌ DỰ ÁN DUYỆT</div>
                <div className="text-[10px] text-slate-400 italic mt-0.5">(Ký, xác nhận kết quả)</div>
                {allTasksApproved ? (
                  <div className="h-16 flex items-center justify-center font-serif text-pine-700 italic font-bold text-base">
                    [ĐÃ DUYỆT ĐẠT]
                  </div>
                ) : (
                  <div className="h-16 flex items-center justify-center font-serif text-rose-700 italic font-bold text-base">
                    [CHƯA NGHIỆM THU TOÀN BỘ]
                  </div>
                )}
                <div className="font-bold text-slate-900">{projectManager?.name || '—'}</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
