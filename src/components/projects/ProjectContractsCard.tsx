'use client';

import React, { useState } from 'react';
import { Contract } from '@/lib/types';
import { formatCurrencyVN, formatDateVN } from '@/lib/utils';
import { calcAmountFromRate, deriveContractAmounts } from '@/lib/selectors';
import { useConstructionStore } from '@/lib/store';
import { FileText, ShieldCheck, Building2, Calendar, Percent, PlusCircle } from 'lucide-react';
import { SectionCard } from '@/components/ui/cards';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { toast } from 'sonner';

interface ProjectContractsCardProps {
  contracts?: Contract[];
  technicalNotes?: string;
  /** Khi có projectId + canManage (Admin), hiện form thêm mốc thanh toán tự tính theo % HĐ. */
  projectId?: string;
  canManage?: boolean;
}

const MILESTONE_TYPES = [
  { value: 'tam-ung', label: 'Tạm ứng' },
  { value: 'tien-do', label: 'Thanh toán theo tiến độ' },
  { value: 'bao-hanh', label: 'Giữ bảo hành' },
  { value: 'khac', label: 'Khác' },
] as const;

export function ProjectContractsCard({ contracts = [], technicalNotes, projectId, canManage }: ProjectContractsCardProps) {
  const addPaymentMilestone = useConstructionStore((s) => s.addPaymentMilestone);
  const [showMilestoneForm, setShowMilestoneForm] = useState(false);
  const [msContractId, setMsContractId] = useState('');
  const [msTitle, setMsTitle] = useState('');
  const [msType, setMsType] = useState<string>('tien-do');
  const [msPct, setMsPct] = useState('');
  const [msDueDate, setMsDueDate] = useState('');

  const selectedContract =
    contracts.find((c) => c.id === msContractId) || contracts[0];
  const pctNum = parseFloat(msPct.replace(',', '.')) || 0;
  const computedAmount = selectedContract ? calcAmountFromRate(selectedContract.contractValue, pctNum) : 0;

  const handleMilestoneTypeChange = (value: string) => {
    setMsType(value);
    const ctr = selectedContract;
    if (!ctr) return;
    if (value === 'tam-ung') setMsPct(String(ctr.advancePaymentRate || 30));
    if (value === 'bao-hanh') setMsPct(String(ctr.warrantyRate || 5));
  };

  const handleSubmitMilestone = (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectId || !selectedContract) return;
    if (!(pctNum > 0) || pctNum > 100) {
      toast.error('Vui lòng nhập tỷ lệ % hợp lệ (lớn hơn 0, tối đa 100).');
      return;
    }
    const typeLabel = MILESTONE_TYPES.find((t) => t.value === msType)?.label || 'Khác';
    const title = msTitle.trim() || typeLabel;
    const fallbackDate = new Date();
    fallbackDate.setDate(fallbackDate.getDate() + 30);
    const fallbackDue = selectedContract.endDate || fallbackDate.toISOString().split('T')[0];
    addPaymentMilestone(projectId, {
      title,
      percentage: pctNum,
      amount: computedAmount,
      dueDate: msDueDate || fallbackDue,
      note: `Loại: ${typeLabel} · HĐ ${selectedContract.contractNumber} · VAT ${selectedContract.vatRate}% (đã gồm trong giá trị HĐ)`,
    });
    toast.success(`Đã thêm mốc "${title}" — ${formatCurrencyVN(computedAmount)}`);
    setMsTitle('');
    setMsPct('');
    setMsDueDate('');
    setShowMilestoneForm(false);
  };

  if (!contracts || contracts.length === 0) {
    return (
      <SectionCard
        title="Hồ sơ Hợp đồng & Căn cứ Pháp lý"
        subtitle="Hợp đồng thi công và cam kết nhà thầu"
      >
        <p className="text-[13px] text-ink-soft dark:text-slate-400 italic leading-relaxed">
          Chưa ký hợp đồng chính thức (Đang ở giai đoạn lập chủ trương / khảo sát thiết kế hoặc tổ chức lựa chọn nhà thầu chào giá).
        </p>
        {technicalNotes && (
          <div className="mt-3 p-3.5 rounded-2xl bg-[#F8FAFC] dark:bg-night-line/40 border border-line dark:border-night-line text-xs text-ink-soft dark:text-slate-300 leading-relaxed">
            <strong className="text-ink dark:text-white">Ghi chú kỹ thuật:</strong> {technicalNotes}
          </div>
        )}
      </SectionCard>
    );
  }

  return (
    <SectionCard
      title="Hợp đồng Thi công & Cam kết Nhà thầu"
      subtitle="Căn cứ pháp lý, điều khoản tạm ứng, thuế VAT và nghĩa vụ bảo hành"
      action={<StatusBadge tone="gold">{contracts.length} hợp đồng</StatusBadge>}
      pad={false}
    >
      <ul className="divide-y divide-line dark:divide-night-line">
        {contracts.map((ctr) => (
          <li key={ctr.id} className="px-5 py-4">
            <div className="flex items-start gap-3.5">
              <span className="w-10 h-10 rounded-xl bg-gold-100 text-gold-600 dark:bg-gold-500/15 dark:text-gold-400 flex items-center justify-center shrink-0">
                <FileText className="w-5 h-5" />
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <span className="inline-block font-tabular text-[11px] font-bold px-2 py-0.5 rounded-md bg-indigo-600 text-white">
                      {ctr.contractNumber}
                    </span>
                    <h4 className="font-bold text-ink dark:text-white text-sm mt-1.5 flex items-center gap-1.5">
                      <Building2 className="w-4 h-4 text-gold-600 dark:text-gold-400 shrink-0" />
                      <span className="truncate">{ctr.contractorName}</span>
                    </h4>
                  </div>
                  <div className="text-left sm:text-right shrink-0">
                    <div className="text-[11px] text-ink-soft dark:text-slate-400">Giá trị hợp đồng</div>
                    <div className="font-tabular font-extrabold text-base text-gold-600 dark:text-gold-400">
                      {formatCurrencyVN(ctr.contractValue)}
                    </div>
                  </div>
                </div>

                {/* Terms and warranty row */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] mt-3">
                  <div className="p-2.5 rounded-xl bg-[#F8FAFC] dark:bg-night-line/40 border border-line dark:border-night-line">
                    <span className="text-ink-soft dark:text-slate-400 block text-[10px] mb-0.5">Thuế VAT</span>
                    <span className="font-bold text-ink dark:text-slate-200 flex items-center gap-1">
                      <Percent className="w-3 h-3 text-gold-600 dark:text-gold-400" />
                      {ctr.vatRate}%
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-[#F8FAFC] dark:bg-night-line/40 border border-line dark:border-night-line">
                    <span className="text-ink-soft dark:text-slate-400 block text-[10px] mb-0.5">Tạm ứng HĐ</span>
                    <span className="font-bold text-ink dark:text-slate-200">
                      {ctr.advancePaymentRate || 30}% giá trị
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-[#F8FAFC] dark:bg-night-line/40 border border-line dark:border-night-line">
                    <span className="text-ink-soft dark:text-slate-400 block text-[10px] mb-0.5">Giữ lại bảo hành</span>
                    <span className="font-bold text-pine-700 dark:text-pine-500 flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3" />
                      {ctr.warrantyRate || 5}%
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-[#F8FAFC] dark:bg-night-line/40 border border-line dark:border-night-line">
                    <span className="text-ink-soft dark:text-slate-400 block text-[10px] mb-0.5">Thời hạn bảo hành</span>
                    <span className="font-bold text-ink dark:text-slate-200 flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-ink-soft dark:text-slate-400" />
                      {ctr.warrantyMonths || 12} tháng
                    </span>
                  </div>
                </div>

                {(() => { const d = deriveContractAmounts(ctr); return (
                  <p className="text-[11px] text-ink-soft dark:text-slate-400 mt-2">
                    Tự tính từ giá trị HĐ: Tạm ứng {ctr.advancePaymentRate || 30}% = <strong className="text-ink dark:text-slate-200">{formatCurrencyVN(d.advance)}</strong>
                    {' · '}Giữ bảo hành {d.warrantyRate}% = <strong className="text-ink dark:text-slate-200">{formatCurrencyVN(d.warranty)}</strong>
                    {' · '}VAT {d.vatRate}% {(ctr.contractNumber.includes('ĐLP') || ctr.contractNumber.includes('PXU-TC')) ? '(đã gồm trong giá trị HĐ theo hồ sơ)' : '(theo điều khoản HĐ)'}
                    {(ctr.startDate || ctr.endDate) ? ` · Hiệu lực: ${ctr.startDate ? formatDateVN(ctr.startDate) : '—'} → ${ctr.endDate ? formatDateVN(ctr.endDate) : '—'}` : ''}
                  </p> ); })()}
                {ctr.warrantyNote && (
                  <p className="text-[11px] font-semibold text-pine-700 dark:text-pine-500 mt-1">Bảo hành: {ctr.warrantyNote}</p>
                )}
                {ctr.scopeDescription && (
                  <p className="text-xs text-ink-soft dark:text-slate-300 bg-[#F8FAFC] dark:bg-night-line/30 p-3 rounded-xl border border-line dark:border-night-line leading-relaxed mt-3">
                    <strong className="text-ink dark:text-white">Phạm vi công việc:</strong> {ctr.scopeDescription}
                  </p>
                )}
              </div>
            </div>
          </li>
        ))}
      </ul>

      {canManage && projectId && (
        <div className="mx-5 mb-5">
          <span
            role="button"
            tabIndex={0}
            onClick={() => setShowMilestoneForm((v) => !v)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setShowMilestoneForm((v) => !v);
              }
            }}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-300 hover:underline cursor-pointer"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            {showMilestoneForm ? 'Ẩn form thêm mốc thanh toán' : 'Thêm mốc thanh toán (tự tính theo % HĐ)'}
          </span>

          {showMilestoneForm && selectedContract && (
            <form
              onSubmit={handleSubmitMilestone}
              className="mt-3 p-4 rounded-2xl bg-[#F8FAFC] dark:bg-night-line/40 border border-line dark:border-night-line space-y-3"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {contracts.length > 1 ? (
                  <div>
                    <label className="lbl">Hợp đồng áp dụng</label>
                    <select
                      value={selectedContract.id}
                      onChange={(e) => setMsContractId(e.target.value)}
                      className="input"
                    >
                      {contracts.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.contractNumber} — {formatCurrencyVN(c.contractValue)}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div>
                    <label className="lbl">Hợp đồng áp dụng</label>
                    <p className="text-xs font-semibold text-ink dark:text-slate-200 pt-2">
                      {selectedContract.contractNumber} — {formatCurrencyVN(selectedContract.contractValue)}
                    </p>
                  </div>
                )}
                <div>
                  <label className="lbl">Loại mốc</label>
                  <select value={msType} onChange={(e) => handleMilestoneTypeChange(e.target.value)} className="input">
                    {MILESTONE_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="lbl">Tên mốc</label>
                  <input
                    type="text"
                    value={msTitle}
                    onChange={(e) => setMsTitle(e.target.value)}
                    placeholder="Vd: Đợt 2: Thanh toán khi đạt 50% khối lượng"
                    className="input"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="lbl">Tỷ lệ % của HĐ</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.5"
                      value={msPct}
                      onChange={(e) => setMsPct(e.target.value)}
                      placeholder="30"
                      className="input"
                      required
                    />
                  </div>
                  <div>
                    <label className="lbl">Ngày hạn (tuỳ chọn)</label>
                    <input type="date" value={msDueDate} onChange={(e) => setMsDueDate(e.target.value)} className="input" />
                  </div>
                </div>
              </div>
              <p className="text-xs text-ink-soft dark:text-slate-400">
                Số tiền tự tính: <strong className="text-ink dark:text-white font-mono">{formatCurrencyVN(computedAmount)}</strong>
                {' '}= {pctNum || 0}% × {formatCurrencyVN(selectedContract.contractValue)}
                {' · '}VAT {selectedContract.vatRate}% (đã gồm trong giá trị HĐ theo hồ sơ)
              </p>
              <div className="flex justify-end">
                <button type="submit" className="btn-primary">
                  Lưu mốc thanh toán
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {technicalNotes && (
        <div className="mx-5 mb-5 p-3.5 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200/60 dark:border-indigo-500/25 text-xs text-ink-soft dark:text-slate-300 leading-relaxed">
          <strong className="text-ink dark:text-white">Ghi chú kỹ thuật &amp; Khối lượng chi tiết:</strong> {technicalNotes}
        </div>
      )}
    </SectionCard>
  );
}
