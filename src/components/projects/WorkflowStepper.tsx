'use client';

import React from 'react';
import { WORKFLOW_9_STEPS, WorkflowStepId } from '@/lib/types';
import { CheckCircle2, ChevronRight, HelpCircle } from 'lucide-react';
import { toast } from 'sonner';

interface WorkflowStepperProps {
  currentStep: WorkflowStepId;
  onStepChange?: (step: WorkflowStepId) => void;
  canEdit?: boolean;
}

export function WorkflowStepper({
  currentStep,
  onStepChange,
  canEdit = false,
}: WorkflowStepperProps) {
  const currentStepObj = WORKFLOW_9_STEPS.find((s) => s.step === currentStep) || WORKFLOW_9_STEPS[0];

  const handleStepClick = (stepId: WorkflowStepId) => {
    if (!canEdit) {
      toast.info(`Quy trình: Bước ${stepId} - ${WORKFLOW_9_STEPS[stepId - 1].name}`);
      return;
    }
    if (onStepChange) {
      onStepChange(stepId);
      toast.success(`Đã cập nhật tiến trình gói thầu sang Bước ${stepId}: ${WORKFLOW_9_STEPS[stepId - 1].shortName}`);
    }
  };

  return (
    <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
              Quy trình 9 Bước Quản lý Gói thầu PXU
            </span>
            {canEdit && (
              <span className="text-[10px] text-slate-400 italic">
                (Click vào bước để cập nhật)
              </span>
            )}
          </div>
          <h2 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-slate-100 mt-1 flex items-center gap-2">
            <span>Đang ở Bước {currentStep}:</span>
            <span className="text-amber-600 dark:text-amber-400">{currentStepObj.name}</span>
          </h2>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto text-xs">
          <span className="text-slate-500 dark:text-slate-400">Tiến độ quy trình:</span>
          <span className="font-mono font-bold text-slate-900 dark:text-slate-100 px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800">
            {currentStep}/9 bước ({Math.round((currentStep / 9) * 100)}%)
          </span>
        </div>
      </div>

      {/* Stepper Pills Container with horizontal scroll */}
      <div className="relative">
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
          {WORKFLOW_9_STEPS.map((s) => {
            const isCompleted = s.step < currentStep;
            const isCurrent = s.step === currentStep;

            return (
              <React.Fragment key={s.step}>
                <button
                  type="button"
                  onClick={() => handleStepClick(s.step)}
                  title={`${s.name}\n${s.description}`}
                  className={`group relative flex items-center gap-2 px-3 py-2 rounded-2xl text-xs font-semibold whitespace-nowrap transition-all duration-200 shrink-0 border ${
                    isCurrent
                      ? 'bg-amber-500 text-slate-950 border-amber-400 font-extrabold shadow-md shadow-amber-500/25 ring-2 ring-amber-500/40'
                      : isCompleted
                      ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800/80 hover:border-emerald-500'
                      : 'bg-slate-50 text-slate-500 dark:bg-slate-800/50 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:border-slate-400'
                  } ${canEdit ? 'cursor-pointer hover:scale-102' : 'cursor-default'}`}
                >
                  {/* Step icon / number */}
                  <div
                    className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-mono font-bold shrink-0 ${
                      isCurrent
                        ? 'bg-slate-950 text-amber-400'
                        : isCompleted
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {isCompleted ? <CheckCircle2 className="w-3.5 h-3.5" /> : s.step}
                  </div>

                  {/* Label */}
                  <span className="truncate max-w-[130px]">{s.shortName}</span>
                </button>

                {s.step < 9 && (
                  <ChevronRight
                    className={`w-3.5 h-3.5 shrink-0 transition-colors ${
                      isCompleted
                        ? 'text-emerald-500'
                        : isCurrent
                        ? 'text-amber-500'
                        : 'text-slate-300 dark:text-slate-700'
                    }`}
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Step Description Box */}
      <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300 flex items-start gap-2.5">
        <HelpCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <span className="font-bold text-slate-900 dark:text-slate-100">
            Nội dung trọng tâm Bước {currentStep}:
          </span>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
            {currentStepObj.description}
          </p>
        </div>
      </div>
    </div>
  );
}
