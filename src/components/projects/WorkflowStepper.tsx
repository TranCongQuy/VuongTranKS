'use client';

import React from 'react';
import { WORKFLOW_9_STEPS, WorkflowStepId } from '@/lib/types';
import { Check, HelpCircle } from 'lucide-react';
import { toast } from 'sonner';
import { ProgressBar } from '@/components/ui/cards';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { cn } from '@/lib/utils';

interface WorkflowStepperProps {
  currentStep: WorkflowStepId;
  secondaryStep?: WorkflowStepId;
  onStepChange?: (step: WorkflowStepId) => void;
  canEdit?: boolean;
}

export function WorkflowStepper({
  currentStep,
  secondaryStep,
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
    <section className="card p-5 sm:p-6 space-y-5">
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="eyebrow">Quy trình 9 bước quản lý gói thầu PXU</span>
            {canEdit && (
              <span className="text-[11px] text-ink-soft dark:text-slate-400 italic">
                Bấm vào bước để cập nhật
              </span>
            )}
          </div>
          <h2 className="text-base sm:text-lg font-extrabold text-ink dark:text-white mt-1.5">
            Bước {currentStep}: <span className="text-indigo-600 dark:text-indigo-300">{currentStepObj.name.replace(/^Bước \d+:\s*/, '')}</span>
            {secondaryStep != null && (
              <span className="ml-2 text-xs font-bold text-amber-600 dark:text-amber-400">(kiêm Bước {secondaryStep})</span>
            )}
          </h2>
        </div>
        <StatusBadge tone="navy" className="shrink-0 self-start">
          {currentStep}/9 bước · {Math.round((currentStep / 9) * 100)}%
        </StatusBadge>
      </div>

      <ProgressBar value={(currentStep / 9) * 100} tone="gradient" h="h-1.5" />

      {/* Stepper: thin connector line, node states pine / gold-ring navy / slate */}
      <div className="overflow-x-auto pb-1">
        <div className="flex items-start min-w-max px-1 pt-1">
          {WORKFLOW_9_STEPS.map((s, idx) => {
            const isCompleted = s.step < currentStep;
            const isCurrent = s.step === currentStep;
            const isSecondary = secondaryStep != null && s.step === secondaryStep;

            return (
              <React.Fragment key={s.step}>
                <button
                  type="button"
                  onClick={() => handleStepClick(s.step)}
                  title={`${s.name}\n${s.description}`}
                  className={cn(
                    'group flex flex-col items-center gap-2 w-[86px] shrink-0 bg-transparent border-none p-0',
                    canEdit ? 'cursor-pointer' : 'cursor-default'
                  )}
                >
                  <span
                    className={cn(
                      'w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold font-tabular transition-all',
                      isCurrent
                        ? 'bg-indigo-600 text-white ring-[3px] ring-indigo-300 dark:ring-indigo-500/40 ring-offset-2 ring-offset-white dark:ring-offset-night-card shadow-md shadow-indigo-500/30'
                        : isSecondary
                          ? 'bg-amber-500 text-white ring-[3px] ring-amber-300 dark:ring-amber-500/40 ring-offset-2 ring-offset-white dark:ring-offset-night-card'
                          : isCompleted
                          ? 'bg-pine-600 text-white'
                          : 'bg-slate-200/80 text-slate-500 dark:bg-slate-700/60 dark:text-slate-400 group-hover:bg-slate-300/70'
                    )}
                  >
                    {isCompleted ? <Check className="w-4 h-4" /> : s.step}
                  </span>
                  <span
                    className={cn(
                      'text-[11px] leading-tight text-center line-clamp-2',
                      isCurrent
                        ? 'font-extrabold text-indigo-600 dark:text-white'
                        : isCompleted
                          ? 'font-semibold text-pine-700 dark:text-pine-500'
                          : 'font-medium text-ink-soft dark:text-slate-400'
                    )}
                  >
                    {s.shortName}
                  </span>
                </button>

                {idx < WORKFLOW_9_STEPS.length - 1 && (
                  <span
                    aria-hidden
                    className={cn(
                      'h-px flex-1 min-w-4 mt-[18px]',
                      s.step < currentStep ? 'bg-pine-500' : 'bg-line dark:bg-night-line'
                    )}
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Step Description Box */}
      <div className="p-4 rounded-2xl bg-[#F8FAFC] dark:bg-night-line/40 border border-line dark:border-night-line text-[13px] text-ink-soft dark:text-slate-300 flex items-start gap-2.5">
        <HelpCircle className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <span className="font-bold text-ink dark:text-white">
            Nội dung trọng tâm Bước {currentStep}:
          </span>
          <p className="text-xs text-ink-soft dark:text-slate-400 leading-relaxed">
            {currentStepObj.description}
          </p>
        </div>
      </div>
    </section>
  );
}
