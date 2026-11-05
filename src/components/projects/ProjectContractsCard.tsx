'use client';

import React from 'react';
import { Contract } from '@/lib/types';
import { formatCurrencyVN } from '@/lib/utils';
import { FileText, ShieldCheck, Building2, Calendar, Percent } from 'lucide-react';
import { SectionCard } from '@/components/ui/cards';
import { StatusBadge } from '@/components/ui/StatusBadge';

interface ProjectContractsCardProps {
  contracts?: Contract[];
  technicalNotes?: string;
}

export function ProjectContractsCard({ contracts = [], technicalNotes }: ProjectContractsCardProps) {
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

      {technicalNotes && (
        <div className="mx-5 mb-5 p-3.5 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200/60 dark:border-indigo-500/25 text-xs text-ink-soft dark:text-slate-300 leading-relaxed">
          <strong className="text-ink dark:text-white">Ghi chú kỹ thuật &amp; Khối lượng chi tiết:</strong> {technicalNotes}
        </div>
      )}
    </SectionCard>
  );
}
