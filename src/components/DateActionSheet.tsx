import { useEffect, useState, type FormEvent } from 'react';
import { Loader2, Trash2, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import type { PeriodLog } from '../types/period';
import { formatFullDate, formatShortDate, getTodayDateStr } from '../utils/cycleMath';

export interface SheetContext {
  mode: 'date' | 'edit' | 'log-start' | 'end-current';
  selectedDate: string;
  targetLog: PeriodLog | null;
  ongoingLog: PeriodLog | null;
  recentClosableLog: PeriodLog | null;
}

interface DateActionSheetProps {
  context: SheetContext | null;
  onClose: () => void;
  onCreateLog: (startDate: string, endDate: string | null) => Promise<void>;
  onUpdateLog: (logId: string, startDate: string, endDate: string | null) => Promise<void>;
  onDeleteLog: (logId: string) => Promise<void>;
}

export function DateActionSheet({
  context,
  onClose,
  onCreateLog,
  onUpdateLog,
  onDeleteLog,
}: DateActionSheetProps) {
  const todayStr = getTodayDateStr();
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isOngoing, setIsOngoing] = useState(true);
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [busy, setBusy] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!context) return;
    setErrorMsg(null);
    setConfirmingDelete(false);
    setBusy(false);

    if (context.mode === 'edit' && context.targetLog) {
      setStartDate(context.targetLog.start_date);
      setEndDate(context.targetLog.end_date ?? todayStr);
      setIsOngoing(context.targetLog.end_date === null);
      setShowCustomForm(true);
    } else if (context.mode === 'end-current' && context.ongoingLog) {
      setStartDate(context.ongoingLog.start_date);
      setEndDate(
        context.selectedDate >= context.ongoingLog.start_date ? context.selectedDate : todayStr
      );
      setIsOngoing(false);
      setShowCustomForm(true);
    } else if (context.mode === 'log-start') {
      setStartDate(context.selectedDate);
      setEndDate(context.selectedDate);
      setIsOngoing(true);
      setShowCustomForm(true);
    } else if (context.targetLog) {
      setStartDate(context.targetLog.start_date);
      setEndDate(context.targetLog.end_date ?? context.selectedDate);
      setIsOngoing(context.targetLog.end_date === null);
      setShowCustomForm(false);
    } else {
      setStartDate(context.selectedDate);
      setEndDate(context.selectedDate);
      setIsOngoing(true);
      setShowCustomForm(false);
    }
  }, [context, todayStr]);

  const editingLog =
    context?.mode === 'end-current' ? context.ongoingLog : context?.targetLog ?? null;

  const handleQuickStartPeriod = async () => {
    if (!context) return;
    setErrorMsg(null);
    setBusy(true);
    try {
      await onCreateLog(context.selectedDate, null);
      onClose();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to log period start.');
      setBusy(false);
    }
  };

  const handleQuickEndPeriod = async (logToEnd: PeriodLog) => {
    if (!context) return;
    if (context.selectedDate < logToEnd.start_date) {
      setErrorMsg('End date cannot be earlier than the period start date.');
      return;
    }
    setErrorMsg(null);
    setBusy(true);
    try {
      await onUpdateLog(logToEnd.id, logToEnd.start_date, context.selectedDate);
      onClose();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to end period.');
      setBusy(false);
    }
  };

  const handleSaveForm = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!startDate) {
      setErrorMsg('Please select a start date.');
      return;
    }

    const finalEnd = isOngoing ? null : endDate;
    if (finalEnd !== null && finalEnd < startDate) {
      setErrorMsg('End date must be on or after the start date.');
      return;
    }

    setBusy(true);
    try {
      if (editingLog) {
        await onUpdateLog(editingLog.id, startDate, finalEnd);
      } else {
        await onCreateLog(startDate, finalEnd);
      }
      onClose();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Unable to save period entry.');
      setBusy(false);
    }
  };

  const handleDelete = async () => {
    if (!editingLog) return;
    setErrorMsg(null);
    setBusy(true);
    try {
      await onDeleteLog(editingLog.id);
      onClose();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Unable to delete entry.');
      setBusy(false);
    }
  };

  const closableLog =
    context && context.ongoingLog && context.selectedDate >= context.ongoingLog.start_date
      ? context.ongoingLog
      : context?.recentClosableLog ?? null;

  return (
    <AnimatePresence>
      {context && (
        <motion.div
          key="date-sheet-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-[#2D2A2E]/35 backdrop-blur-xs"
          onClick={onClose}
          role="dialog"
          aria-modal="true"
          aria-labelledby="sheet-title"
        >
          <motion.div
            key="date-sheet-panel"
            initial={{ opacity: 0, y: 28, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.97 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="w-full max-w-[480px] rounded-t-3xl sm:rounded-2xl bg-white border border-[#FCE7F3] p-5 sm:p-6 shadow-[0_24px_54px_-12px_rgba(236,72,153,0.28)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-[#FBCFE8] sm:hidden" />

            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 id="sheet-title" className="text-lg font-bold tracking-tight text-[#2D2A2E]">
                  {context.mode === 'edit'
                    ? 'Edit Period Entry'
                    : context.mode === 'end-current'
                      ? 'End Current Period'
                      : context.mode === 'log-start'
                        ? 'Log Period Start'
                        : formatFullDate(context.selectedDate)}
                </h3>
                <p className="mt-0.5 text-xs text-[#6E676B]">
                  {editingLog
                    ? `Logged: ${formatShortDate(editingLog.start_date)} – ${
                        editingLog.end_date ? formatShortDate(editingLog.end_date) : 'Ongoing'
                      }`
                    : 'Choose an action for this date'}
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close drawer"
                className="min-h-[44px] min-w-[44px] -mr-2 -mt-1 flex items-center justify-center rounded-xl text-[#6E676B] transition-all duration-150 hover:bg-[#FDF2F8] hover:text-[#BE185D] active:scale-[0.94]"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>

            {errorMsg && (
              <div
                role="alert"
                className="mt-4 rounded-xl bg-[#FEF2F2] border border-[#FECACA] px-3.5 py-2.5 text-sm text-[#991B1B]"
              >
                {errorMsg}
              </div>
            )}

            {!showCustomForm && (
              <div className="mt-5 space-y-2.5">
                {editingLog ? (
                  <>
                    {!editingLog.end_date && context.selectedDate >= editingLog.start_date && (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => void handleQuickEndPeriod(editingLog)}
                        className="min-h-[48px] w-full rounded-xl bg-gradient-to-r from-[#F43F5E] to-[#EC4899] px-4 py-3 text-sm font-semibold text-white shadow-[0_8px_22px_-6px_rgba(236,72,153,0.5)] transition-all duration-150 hover:brightness-105 active:scale-[0.96] disabled:opacity-60 whitespace-nowrap"
                      >
                        End Period on {formatShortDate(context.selectedDate)}
                      </button>
                    )}

                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => setShowCustomForm(true)}
                      className="min-h-[48px] w-full rounded-xl border border-[#FBCFE8] bg-[#FFF0F5]/60 px-4 py-3 text-sm font-medium text-[#2D2A2E] transition-all duration-150 hover:bg-[#FDF2F8] active:scale-[0.96] whitespace-nowrap"
                    >
                      Edit Start &amp; End Dates
                    </button>

                    {!confirmingDelete ? (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => setConfirmingDelete(true)}
                        className="min-h-[44px] w-full rounded-xl px-4 py-2.5 text-sm font-medium text-[#DC2626] transition-all duration-150 hover:bg-[#FEF2F2] active:scale-[0.96] flex items-center justify-center gap-2 whitespace-nowrap"
                      >
                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                        <span>Delete Entry</span>
                      </button>
                    ) : (
                      <div className="rounded-xl bg-[#FEF2F2] border border-[#FECACA] p-3">
                        <p className="text-xs font-medium text-[#991B1B]">
                          Remove this period log permanently?
                        </p>
                        <div className="mt-2.5 grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => setConfirmingDelete(false)}
                            className="min-h-[44px] rounded-lg bg-white border border-[#E6DEDB] px-3 py-2 text-xs font-medium text-[#2D2A2E] active:scale-[0.96] transition-transform duration-150"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => void handleDelete()}
                            className="min-h-[44px] rounded-lg bg-[#DC2626] px-3 py-2 text-xs font-semibold text-white flex items-center justify-center gap-1.5 active:scale-[0.96] transition-transform duration-150"
                          >
                            {busy && <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />}
                            <span>Confirm Delete</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => void handleQuickStartPeriod()}
                      className="min-h-[48px] w-full rounded-xl bg-gradient-to-r from-[#F43F5E] to-[#EC4899] px-4 py-3 text-sm font-semibold text-white shadow-[0_8px_22px_-6px_rgba(236,72,153,0.5)] transition-all duration-150 hover:brightness-105 active:scale-[0.96] disabled:opacity-60 flex items-center justify-center gap-2 whitespace-nowrap"
                    >
                      {busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
                      <span>Start Period</span>
                    </button>

                    {closableLog && (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => void handleQuickEndPeriod(closableLog)}
                        className="min-h-[48px] w-full rounded-xl border border-[#EC4899] bg-gradient-to-r from-[#FDF2F8] to-[#F5F3FF] px-4 py-3 text-sm font-semibold text-[#BE185D] transition-all duration-150 hover:brightness-97 active:scale-[0.96] disabled:opacity-60 whitespace-nowrap"
                      >
                        End Period ({formatShortDate(closableLog.start_date)} –{' '}
                        {formatShortDate(context.selectedDate)})
                      </button>
                    )}

                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => setShowCustomForm(true)}
                      className="min-h-[44px] w-full rounded-xl border border-[#FBCFE8] bg-white px-4 py-2.5 text-sm font-medium text-[#2D2A2E] transition-all duration-150 hover:bg-[#FDF2F8] active:scale-[0.96] whitespace-nowrap"
                    >
                      Enter Custom Date Range
                    </button>
                  </>
                )}
              </div>
            )}

            {showCustomForm && (
              <form onSubmit={handleSaveForm} className="mt-5 space-y-4">
                <div>
                  <label htmlFor="sheet-start-date" className="block text-sm font-medium text-[#2D2A2E]">
                    Start Date
                  </label>
                  <input
                    id="sheet-start-date"
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="mt-1.5 w-full min-h-[44px] rounded-xl border border-[#FBCFE8] bg-white px-3.5 py-2.5 text-sm text-[#2D2A2E] focus:border-[#EC4899] focus:outline-none"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between gap-2">
                    <label htmlFor="sheet-end-date" className="block text-sm font-medium text-[#2D2A2E]">
                      End Date
                    </label>
                    <label className="inline-flex min-h-[36px] items-center gap-2 text-xs font-medium text-[#6E676B] cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isOngoing}
                        onChange={(e) => setIsOngoing(e.target.checked)}
                        className="h-4 w-4 rounded border-[#D6CECB] accent-[#EC4899]"
                      />
                      <span>Still ongoing</span>
                    </label>
                  </div>

                  {!isOngoing && (
                    <input
                      id="sheet-end-date"
                      type="date"
                      min={startDate}
                      required
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="mt-1.5 w-full min-h-[44px] rounded-xl border border-[#FBCFE8] bg-white px-3.5 py-2.5 text-sm text-[#2D2A2E] focus:border-[#EC4899] focus:outline-none"
                    />
                  )}
                </div>

                <div className="pt-1 flex flex-col gap-2">
                  <button
                    type="submit"
                    disabled={busy}
                    className="min-h-[48px] w-full rounded-xl bg-gradient-to-r from-[#F43F5E] to-[#EC4899] px-4 py-3 text-sm font-semibold text-white shadow-[0_8px_22px_-6px_rgba(236,72,153,0.5)] transition-all duration-150 hover:brightness-105 active:scale-[0.96] disabled:opacity-60 flex items-center justify-center gap-2 whitespace-nowrap"
                  >
                    {busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
                    <span>{editingLog ? 'Save Changes' : 'Save Period Log'}</span>
                  </button>

                  {editingLog && !confirmingDelete && (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => setConfirmingDelete(true)}
                      className="min-h-[44px] w-full rounded-xl px-4 py-2.5 text-sm font-medium text-[#DC2626] transition-all duration-150 hover:bg-[#FEF2F2] active:scale-[0.96] flex items-center justify-center gap-2 whitespace-nowrap"
                    >
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                      <span>Delete Entry</span>
                    </button>
                  )}

                  {editingLog && confirmingDelete && (
                    <div className="rounded-xl bg-[#FEF2F2] border border-[#FECACA] p-3">
                      <p className="text-xs font-medium text-[#991B1B]">
                        Remove this period log permanently?
                      </p>
                      <div className="mt-2.5 grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => setConfirmingDelete(false)}
                          className="min-h-[44px] rounded-lg bg-white border border-[#E6DEDB] px-3 py-2 text-xs font-medium text-[#2D2A2E] active:scale-[0.96] transition-transform duration-150"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => void handleDelete()}
                          className="min-h-[44px] rounded-lg bg-[#DC2626] px-3 py-2 text-xs font-semibold text-white flex items-center justify-center gap-1.5 active:scale-[0.96] transition-transform duration-150"
                        >
                          {busy && <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />}
                          <span>Confirm Delete</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </form>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
