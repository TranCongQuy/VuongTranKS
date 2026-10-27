'use client';

import React from 'react';
import { Contract } from '@/lib/types';
import { formatCurrencyVN } from '@/lib/utils';
import { FileText, ShieldCheck, Building2, Calendar, Percent } from 'lucide-react';

interface ProjectContractsCardProps {
  contracts?: Contract[];
  technicalNotes?: string;
}

export function ProjectContractsCard({ contracts = [], technicalNotes }: ProjectContractsCardProps) {
  if (!contracts || contracts.length === 0) {
    return (
      <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs text-xs space-y-2">
        <div className="flex items-center gap-2 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
          <FileText className="w-4 h-4 text-amber-500" />
          <span>Hồ sơ Hợp đồng & Căn cứ Pháp lý:</span>
        </div>
        <p className="text-slate-600 dark:text-slate-400 italic">
          Chưa ký hợp đồng chính thức (Đang ở giai đoạn lập chủ trương / khảo sát thiết kế hoặc tổ chức lựa chọn nhà thầu chào giá).
        </p>
        {technicalNotes && (
          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-300">
            <strong>Ghi chú kỹ thuật:</strong> {technicalNotes}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-600 flex items-center justify-center font-bold">
            <FileText className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100">
              Hợp đồng Thi công & Cam kết Nhà thầu
            </h3>
            <p className="text-[11px] text-slate-400">
              Căn cứ pháp lý, điều khoản tạm ứng, thuế VAT và nghĩa vụ bảo hành
            </p>
          </div>
        </div>
        <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-600 border border-amber-500/30">
          {contracts.length} hợp đồng
        </span>
      </div>

      <div className="space-y-3">
        {contracts.map((ctr) => (
          <div
            key={ctr.id}
            className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 text-xs space-y-3 hover:border-amber-400 transition-colors"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-200 dark:border-slate-700/60">
              <div>
                <span className="font-mono text-xs font-extrabold px-2 py-0.5 rounded bg-slate-900 text-white dark:bg-amber-500 dark:text-slate-950">
                  {ctr.contractNumber}
                </span>
                <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm mt-1 flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-amber-500 shrink-0" />
                  {ctr.contractorName}
                </h4>
              </div>

              <div className="text-left sm:text-right">
                <div className="text-[11px] text-slate-400">Giá trị hợp đồng:</div>
                <div className="font-tabular font-extrabold text-base text-amber-600 dark:text-amber-400">
                  {formatCurrencyVN(ctr.contractValue)}
                </div>
              </div>
            </div>

            {/* Terms and warranty row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
              <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                <span className="text-slate-400 block text-[10px]">Thuế VAT:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                  <Percent className="w-3 h-3 text-amber-500" />
                  {ctr.vatRate}%
                </span>
              </div>

              <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                <span className="text-slate-400 block text-[10px]">Tạm ứng HĐ:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  {ctr.advancePaymentRate || 30}% giá trị
                </span>
              </div>

              <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                <span className="text-slate-400 block text-[10px]">Giữ lại bảo hành:</span>
                <span className="font-bold text-emerald-600 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" />
                  {ctr.warrantyRate || 5}%
                </span>
              </div>

              <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                <span className="text-slate-400 block text-[10px]">Thời hạn bảo hành:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-slate-400" />
                  {ctr.warrantyMonths || 12} tháng
                </span>
              </div>
            </div>

            {/* Scope description */}
            {ctr.scopeDescription && (
              <p className="text-[11px] text-slate-600 dark:text-slate-300 bg-white/70 dark:bg-slate-900/70 p-2.5 rounded-xl border border-slate-200/80 dark:border-slate-700/60 leading-relaxed">
                <strong>Phạm vi công việc:</strong> {ctr.scopeDescription}
              </p>
            )}
          </div>
        ))}
      </div>

      {technicalNotes && (
        <div className="p-3 rounded-2xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-800/40 text-[11px] text-slate-700 dark:text-slate-300">
          <strong>Ghi chú kỹ thuật & Khối lượng chi tiết:</strong> {technicalNotes}
        </div>
      )}
    </div>
  );
}

