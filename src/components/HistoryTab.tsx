import { useState } from 'react';
import { AlertCircle, CheckCircle2, Pencil, Trash2 } from 'lucide-react';
import type { CycleSummary, HistoryItem, PeriodLog } from '../types/period';
import { EmptyHistoryIllustration } from './Illustrations';

interface HistoryTabProps {
  historyItems: HistoryItem[];
  summary: CycleSummary;
  onEditLog: (log: PeriodLog) => void;
  onDeleteLog: (logId: string) => Promise<void>;
}

export function HistoryTab({
  historyItems,
  summary,
  onEditLog,
  onDeleteLog,
}: HistoryTabProps) {
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleConfirmDelete = async (logId: string) => {
    setDeletingId(logId);
    try {
      await onDeleteLog(logId);
      setConfirmDeleteId(null);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Overview Metrics (2-Column Summary Cards) */}
      <section aria-label="Cycle averages" className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-white/90 backdrop-blur-md border border-white/90 p-4 sm:p-5 shadow-[0_10px_28px_-12px_rgba(244,63,94,0.22)]">
          <p className="text-xs font-medium text-[#6E676B]">Average Period Duration</p>
          <p className="mt-1.5 text-2xl font-bold tracking-tight tabular-nums bg-gradient-to-r from-[#F43F5E] to-[#EC4899] bg-clip-text text-transparent">
            {summary.avgDuration} Days
          </p>
        </div>

        <div className="rounded-2xl bg-white/90 backdrop-blur-md border border-white/90 p-4 sm:p-5 shadow-[0_10px_28px_-12px_rgba(168,85,247,0.22)]">
          <p className="text-xs font-medium text-[#6E676B]">Average Cycle Length</p>
          <p className="mt-1.5 text-2xl font-bold tracking-tight tabular-nums bg-gradient-to-r from-[#EC4899] to-[#A855F7] bg-clip-text text-transparent">
            {summary.avgCycleLength} Days
          </p>
        </div>
      </section>

      {/* Monthly Period History List */}
      <section aria-label="Monthly period history" className="space-y-3">
        <div className="flex items-center justify-between px-1 pt-1">
          <h2 className="text-sm font-bold text-[#2D2A2E]">Period History</h2>
          <span className="text-xs font-medium text-[#6E676B] tabular-nums">
            {historyItems.length} {historyItems.length === 1 ? 'entry' : 'entries'}
          </span>
        </div>

        {historyItems.length === 0 ? (
          <div className="rounded-2xl bg-white/90 backdrop-blur-md border border-white/90 p-7 text-center shadow-[0_12px_32px_-14px_rgba(168,85,247,0.16)]">
            <EmptyHistoryIllustration />
            <p className="mt-3 text-base font-semibold text-[#2D2A2E]">No period logs yet</p>
            <p className="mt-1 text-xs leading-relaxed text-[#6E676B]">
              Switch to the Calendar tab to log your first period and watch your cycle insights grow.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {historyItems.map((item) => {
              const isConfirming = confirmDeleteId === item.log.id;
              const isDeleting = deletingId === item.log.id;

              return (
                <article
                  key={item.log.id}
                  className="rounded-2xl bg-white/90 backdrop-blur-md border border-white/90 p-4 sm:p-5 shadow-[0_10px_26px_-14px_rgba(236,72,153,0.18)]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="text-sm font-semibold text-[#2D2A2E] leading-snug">
                        {item.monthLabel}{' '}
                        <span className="text-[#D946EF]/60 font-normal" aria-hidden="true">
                          •
                        </span>{' '}
                        <span className="font-medium text-[#4D474B]">{item.dateRangeLabel}</span>
                      </h3>

                      <div className="mt-2 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-[#6E676B]">
                        {item.cycleLengthDays !== null ? (
                          <>
                            <span className="tabular-nums">
                              Cycle length: {item.cycleLengthDays} days
                            </span>
                            {item.cycleStatus && (
                              <>
                                <span aria-hidden="true">·</span>
                                <span
                                  className={`inline-flex items-center gap-1 font-semibold ${
                                    item.cycleStatus === 'Normal'
                                      ? 'text-[#059669]'
                                      : 'text-[#D97706]'
                                  }`}
                                >
                                  {item.cycleStatus === 'Normal' ? (
                                    <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                                  ) : (
                                    <AlertCircle className="h-3.5 w-3.5" aria-hidden="true" />
                                  )}
                                  <span>{item.cycleStatus}</span>
                                </span>
                              </>
                            )}
                          </>
                        ) : (
                          <span>Baseline cycle entry</span>
                        )}
                      </div>
                    </div>

                    {/* Period Duration Highlight */}
                    <div className="shrink-0 rounded-xl bg-gradient-to-r from-[#FCE7F3] to-[#F5F3FF] border border-[#FBCFE8]/70 px-3 py-1.5 text-xs font-semibold tabular-nums text-[#BE185D] whitespace-nowrap">
                      {item.durationDays !== null
                        ? `${item.durationDays} ${item.durationDays === 1 ? 'day' : 'days'}`
                        : 'Ongoing'}
                    </div>
                  </div>

                  {/* Card Actions */}
                  <div className="mt-3.5 pt-3 border-t border-[#FCE7F3] flex items-center justify-end gap-2">
                    {!isConfirming ? (
                      <>
                        <button
                          type="button"
                          onClick={() => onEditLog(item.log)}
                          className="min-h-[40px] inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium text-[#6E676B] transition-all duration-150 hover:bg-[#FDF2F8] hover:text-[#BE185D] active:scale-[0.96] whitespace-nowrap"
                        >
                          <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                          <span>Edit</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteId(item.log.id)}
                          className="min-h-[40px] inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium text-[#DC2626] transition-all duration-150 hover:bg-[#FEF2F2] active:scale-[0.96] whitespace-nowrap"
                        >
                          <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                          <span>Delete</span>
                        </button>
                      </>
                    ) : (
                      <div className="flex w-full items-center justify-between gap-2">
                        <span className="text-xs font-medium text-[#991B1B]">
                          Delete this period log?
                        </span>
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            disabled={isDeleting}
                            onClick={() => setConfirmDeleteId(null)}
                            className="min-h-[38px] rounded-lg border border-[#E6DEDB] bg-white px-3 py-1.5 text-xs font-medium text-[#2D2A2E] active:scale-[0.96] transition-transform duration-150"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            disabled={isDeleting}
                            onClick={() => void handleConfirmDelete(item.log.id)}
                            className="min-h-[38px] rounded-lg bg-[#DC2626] px-3 py-1.5 text-xs font-semibold text-white active:scale-[0.96] transition-transform duration-150"
                          >
                            {isDeleting ? 'Deleting...' : 'Delete'}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
