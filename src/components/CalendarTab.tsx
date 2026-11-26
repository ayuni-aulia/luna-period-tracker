import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import type { CalendarCell, CycleSummary, PeriodLog } from '../types/period';
import {
  diffDays,
  formatYearMonthTitle,
  getMonthGrid,
  getTodayDateStr,
  parseDateStr,
} from '../utils/cycleMath';
import { HeroCycleIllustration } from './Illustrations';

interface CalendarTabProps {
  logs: PeriodLog[];
  summary: CycleSummary;
  pulseKey: number;
  onSelectDate: (cell: CalendarCell) => void;
  onPrimaryAction: () => void;
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function CalendarTab({
  logs,
  summary,
  pulseKey,
  onSelectDate,
  onPrimaryAction,
}: CalendarTabProps) {
  const todayStr = getTodayDateStr();
  const todayDate = useMemo(() => parseDateStr(todayStr), [todayStr]);

  const [viewYear, setViewYear] = useState(todayDate.getFullYear());
  const [viewMonth, setViewMonth] = useState(todayDate.getMonth());
  const [monthDirection, setMonthDirection] = useState<1 | -1>(1);

  const isCurrentMonthView =
    viewYear === todayDate.getFullYear() && viewMonth === todayDate.getMonth();

  const cells = useMemo(
    () => getMonthGrid(viewYear, viewMonth, logs, summary.predictedRanges, todayStr),
    [viewYear, viewMonth, logs, summary.predictedRanges, todayStr]
  );

  const goPrevMonth = () => {
    setMonthDirection(-1);
    if (viewMonth === 0) {
      setViewYear((y) => y - 1);
      setViewMonth(11);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const goNextMonth = () => {
    setMonthDirection(1);
    if (viewMonth === 11) {
      setViewYear((y) => y + 1);
      setViewMonth(0);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const jumpToToday = () => {
    const targetTotal = todayDate.getFullYear() * 12 + todayDate.getMonth();
    const currentTotal = viewYear * 12 + viewMonth;
    setMonthDirection(targetTotal >= currentTotal ? 1 : -1);
    setViewYear(todayDate.getFullYear());
    setViewMonth(todayDate.getMonth());
  };

  const hasOngoing = summary.activeOngoingLog !== null;
  const monthKey = `${viewYear}-${viewMonth}`;

  return (
    <div className="space-y-4">
      {/* Top Status Hero Card */}
      <section
        aria-label="Current cycle status"
        className="relative overflow-hidden rounded-2xl p-5 text-white shadow-[0_16px_36px_-10px_rgba(244,63,94,0.46)]"
        style={{
          background: 'linear-gradient(135deg, #FF5E7E 0%, #FF8E6E 50%, #A855F7 100%)',
        }}
      >
        {pulseKey > 0 && (
          <span
            key={pulseKey}
            className="animate-luna-pulse-ring pointer-events-none absolute inset-0 rounded-2xl border-2 border-white/80"
            aria-hidden="true"
          />
        )}

        {/* Subtle luminous orb accent inside hero */}
        <div
          className="pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full bg-white/15 blur-2xl"
          aria-hidden="true"
        />

        <div className="relative flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-semibold text-white/85">
              {summary.statusKind === 'period'
                ? 'Active Period'
                : summary.statusKind === 'cycle'
                  ? 'Current Cycle'
                  : 'Cycle Status'}
            </p>
            <h2 className="mt-1 text-3xl font-bold tracking-tight tabular-nums text-white text-balance drop-shadow-xs">
              {summary.primaryTitle}
            </h2>
            <p className="mt-1.5 text-sm font-medium leading-snug text-white/95">
              {summary.subtitle}
            </p>
          </div>

          <HeroCycleIllustration statusKind={summary.statusKind} />
        </div>
      </section>

      {/* Interactive Monthly Calendar */}
      <section
        aria-label="Monthly calendar"
        className="rounded-2xl bg-white/90 backdrop-blur-md border border-white/90 p-4 sm:p-5 shadow-[0_12px_32px_-14px_rgba(168,85,247,0.18)]"
      >
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-base font-bold tracking-tight text-[#2D2A2E] truncate">
            {formatYearMonthTitle(viewYear, viewMonth)}
          </h3>

          <div className="flex items-center gap-1 shrink-0">
            {!isCurrentMonthView && (
              <button
                type="button"
                onClick={jumpToToday}
                className="min-h-[40px] rounded-xl bg-gradient-to-r from-[#FFF0F5] to-[#F5F3FF] border border-[#FBCFE8] px-3 py-1.5 text-xs font-semibold text-[#BE185D] transition-transform duration-150 hover:brightness-98 active:scale-[0.96] whitespace-nowrap shrink-0"
              >
                Today
              </button>
            )}

            <button
              type="button"
              onClick={goPrevMonth}
              aria-label="Previous month"
              className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-[#6E676B] transition-all duration-150 hover:bg-[#FDF2F8] hover:text-[#BE185D] active:scale-[0.94]"
            >
              <ChevronLeft className="h-5 w-5" aria-hidden="true" />
            </button>

            <button
              type="button"
              onClick={goNextMonth}
              aria-label="Next month"
              className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-[#6E676B] transition-all duration-150 hover:bg-[#FDF2F8] hover:text-[#BE185D] active:scale-[0.94]"
            >
              <ChevronRight className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* Weekday Headers */}
        <div className="mt-4 grid grid-cols-7 gap-1 text-center">
          {WEEKDAYS.map((day) => (
            <div key={day} className="py-1 text-xs font-semibold text-[#9A9296]">
              {day}
            </div>
          ))}
        </div>

        {/* Animated Month Grid */}
        <div className="mt-1 overflow-hidden">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={monthKey}
              initial={{ opacity: 0, x: monthDirection * 18 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: monthDirection * -18 }}
              transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
              className="grid grid-cols-7 gap-1.5 p-0.5"
            >
              {cells.map((cell) => {
                const isPeriod = cell.isLoggedPeriod;
                const isPredicted = cell.isPredictedPeriod;
                const isToday = cell.isToday;

                let stateClasses =
                  'rounded-full text-[#2D2A2E] hover:bg-[#FDF2F8] hover:text-[#BE185D]';
                if (!cell.inCurrentMonth && !isPeriod && !isPredicted) {
                  stateClasses = 'rounded-full text-[#C4BCBF] hover:bg-[#FDF2F8]/60';
                }
                if (isPredicted) {
                  stateClasses =
                    'rounded-full bg-gradient-to-br from-[#FDF2F8] to-[#F5F3FF] border-2 border-dashed border-[#EC4899]/80 text-[#9D174D] font-semibold hover:brightness-97';
                  if (!cell.inCurrentMonth) {
                    stateClasses += ' opacity-70';
                  }
                }
                if (isPeriod) {
                  stateClasses =
                    'rounded-full bg-gradient-to-br from-[#F43F5E] to-[#EC4899] text-white font-semibold shadow-[0_6px_14px_-3px_rgba(244,63,94,0.48)] hover:brightness-105';
                  if (!cell.inCurrentMonth) {
                    stateClasses += ' opacity-85';
                  }
                }

                const todayRingClasses = isToday
                  ? isPeriod
                    ? 'ring-2 ring-[#2D2A2E] ring-offset-2 ring-offset-white'
                    : 'ring-2 ring-[#A855F7] ring-inset font-bold'
                  : '';

                const ariaStatus = isPeriod
                  ? ', logged period day'
                  : isPredicted
                    ? ', predicted period day'
                    : '';

                return (
                  <button
                    key={cell.dateStr}
                    type="button"
                    onClick={() => onSelectDate(cell)}
                    aria-label={`${cell.dateStr}${isToday ? ', today' : ''}${ariaStatus}`}
                    className={`min-h-[44px] w-full flex items-center justify-center text-sm tabular-nums transition-all duration-150 active:scale-[0.92] ${stateClasses} ${todayRingClasses}`}
                  >
                    {cell.dayNumber}
                  </button>
                );
              })}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Minimal Unboxed Legend */}
        <div className="mt-4 pt-3.5 border-t border-[#FCE7F3] flex flex-wrap items-center justify-between gap-3 text-xs text-[#6E676B]">
          <div className="flex items-center gap-4 flex-wrap">
            <span className="inline-flex items-center gap-1.5">
              <span
                className="h-3 w-3 rounded-full bg-gradient-to-br from-[#F43F5E] to-[#EC4899] shadow-xs"
                aria-hidden="true"
              />
              <span>Logged</span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span
                className="h-3 w-3 rounded-full bg-gradient-to-br from-[#FDF2F8] to-[#F5F3FF] border border-dashed border-[#EC4899]"
                aria-hidden="true"
              />
              <span>Predicted</span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span
                className="h-3 w-3 rounded-full ring-2 ring-[#A855F7] ring-inset"
                aria-hidden="true"
              />
              <span>Today</span>
            </span>
          </div>
          <span className="text-[#9A9296]">Tap any date to log</span>
        </div>
      </section>

      {/* Primary Action CTA below calendar */}
      <button
        type="button"
        onClick={onPrimaryAction}
        className={`min-h-[50px] w-full rounded-2xl px-5 py-3.5 text-sm font-semibold text-white transition-all duration-150 hover:brightness-105 active:scale-[0.96] flex items-center justify-center gap-2 whitespace-nowrap ${
          hasOngoing
            ? 'bg-gradient-to-r from-[#EC4899] to-[#A855F7] shadow-[0_12px_26px_-6px_rgba(168,85,247,0.48)]'
            : 'bg-gradient-to-r from-[#F43F5E] to-[#EC4899] shadow-[0_12px_26px_-6px_rgba(236,72,153,0.52)]'
        }`}
      >
        <span>{hasOngoing ? 'End Current Period' : 'Log Period Start'}</span>
        {hasOngoing && summary.activeOngoingLog && (
          <span className="text-xs font-normal text-white/90 tabular-nums">
            (Day {Math.max(1, diffDays(summary.activeOngoingLog.start_date, todayStr) + 1)})
          </span>
        )}
      </button>
    </div>
  );
}
