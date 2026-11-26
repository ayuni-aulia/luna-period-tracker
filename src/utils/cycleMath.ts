import type {
  CalendarCell,
  CycleSummary,
  HistoryItem,
  PeriodLog,
  PredictedRange,
} from '../types/period';

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const SHORT_MONTH_NAMES = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

export function isValidDateStr(value: string): boolean {
  if (!DATE_PATTERN.test(value)) return false;
  const [y, m, d] = value.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  return dt.getFullYear() === y && dt.getMonth() === m - 1 && dt.getDate() === d;
}

export function parseDateStr(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function formatDateStr(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function getTodayDateStr(): string {
  return formatDateStr(new Date());
}

export function addDays(dateStr: string, days: number): string {
  const dt = parseDateStr(dateStr);
  dt.setDate(dt.getDate() + days);
  return formatDateStr(dt);
}

export function diffDays(fromStr: string, toStr: string): number {
  const from = parseDateStr(fromStr);
  const to = parseDateStr(toStr);
  const utcFrom = Date.UTC(from.getFullYear(), from.getMonth(), from.getDate());
  const utcTo = Date.UTC(to.getFullYear(), to.getMonth(), to.getDate());
  return Math.round((utcTo - utcFrom) / 86400000);
}

export function formatShortDate(dateStr: string): string {
  const dt = parseDateStr(dateStr);
  return `${SHORT_MONTH_NAMES[dt.getMonth()]} ${dt.getDate()}`;
}

export function formatFullDate(dateStr: string): string {
  const dt = parseDateStr(dateStr);
  return `${SHORT_MONTH_NAMES[dt.getMonth()]} ${dt.getDate()}, ${dt.getFullYear()}`;
}

export function formatMonthYear(dateStr: string): string {
  const dt = parseDateStr(dateStr);
  return `${MONTH_NAMES[dt.getMonth()]} ${dt.getFullYear()}`;
}

export function formatYearMonthTitle(year: number, monthIndex: number): string {
  return `${MONTH_NAMES[monthIndex]} ${year}`;
}

export function sortLogsAscending(logs: PeriodLog[]): PeriodLog[] {
  return [...logs].sort((a, b) => a.start_date.localeCompare(b.start_date));
}

export function sortLogsDescending(logs: PeriodLog[]): PeriodLog[] {
  return [...logs].sort((a, b) => b.start_date.localeCompare(a.start_date));
}

export function findLogForDate(logs: PeriodLog[], dateStr: string, todayStr: string): PeriodLog | null {
  const sortedDesc = sortLogsDescending(logs);
  for (const log of sortedDesc) {
    if (log.end_date) {
      if (dateStr >= log.start_date && dateStr <= log.end_date) {
        return log;
      }
    } else {
      // Ongoing log: highlight from start_date through todayStr (or start_date if future)
      const effectiveEnd = todayStr >= log.start_date ? todayStr : log.start_date;
      if (dateStr >= log.start_date && dateStr <= effectiveEnd) {
        return log;
      }
    }
  }
  return null;
}

export function computeCycleSummary(
  logs: PeriodLog[],
  defaultCycleLength = 28,
  defaultPeriodDuration = 5,
  todayStr = getTodayDateStr()
): CycleSummary {
  const sortedAsc = sortLogsAscending(logs);

  // Calculate average period duration from completed logs
  const completedDurations = sortedAsc
    .filter((l) => l.end_date !== null && l.end_date >= l.start_date)
    .map((l) => diffDays(l.start_date, l.end_date as string) + 1)
    .filter((d) => d >= 1 && d <= 20);

  const avgDuration =
    completedDurations.length > 0
      ? Math.round(completedDurations.reduce((sum, d) => sum + d, 0) / completedDurations.length)
      : defaultPeriodDuration;

  // Calculate average cycle length from consecutive start_date gaps
  const cycleGaps: number[] = [];
  for (let i = 1; i < sortedAsc.length; i++) {
    const gap = diffDays(sortedAsc[i - 1].start_date, sortedAsc[i].start_date);
    if (gap > 0) {
      cycleGaps.push(gap);
    }
  }

  const avgCycleLength =
    cycleGaps.length > 0
      ? Math.round(cycleGaps.reduce((sum, g) => sum + g, 0) / cycleGaps.length)
      : defaultCycleLength;

  // Find active ongoing period (end_date === null)
  const sortedDesc = sortLogsDescending(logs);
  const activeOngoingLog = sortedDesc.find((l) => l.end_date === null) ?? null;

  if (sortedAsc.length === 0) {
    return {
      statusKind: 'empty',
      primaryTitle: 'No cycles logged',
      subtitle: 'Tap any date or log your period start to begin tracking.',
      isLate: false,
      activeOngoingLog: null,
      avgDuration,
      avgCycleLength,
      predictedRanges: [],
    };
  }

  // Generate predicted ranges for upcoming cycles (next 6 cycles)
  const latestLog = sortedDesc[0];
  const predictedRanges: PredictedRange[] = [];
  for (let cycleIndex = 1; cycleIndex <= 6; cycleIndex++) {
    const pStart = addDays(latestLog.start_date, avgCycleLength * cycleIndex);
    const pEnd = addDays(pStart, Math.max(1, avgDuration) - 1);
    predictedRanges.push({ start: pStart, end: pEnd });
  }

  // Determine today's status
  const todayLog = findLogForDate(sortedDesc, todayStr, todayStr);
  if (todayLog) {
    const dayNum = diffDays(todayLog.start_date, todayStr) + 1;
    return {
      statusKind: 'period',
      primaryTitle: `Period Day ${dayNum}`,
      subtitle: `Started on ${formatShortDate(todayLog.start_date)}`,
      isLate: false,
      activeOngoingLog,
      avgDuration,
      avgCycleLength,
      predictedRanges,
    };
  }

  // Find the most recent period starting on or before todayStr
  const pastOrCurrentLogs = sortedDesc.filter((l) => l.start_date <= todayStr);
  const referenceLog = pastOrCurrentLogs[0] ?? sortedDesc[0];
  const cycleDay = Math.max(1, diffDays(referenceLog.start_date, todayStr) + 1);
  const nextExpectedStart = addDays(referenceLog.start_date, avgCycleLength);
  const daysUntil = diffDays(todayStr, nextExpectedStart);

  if (daysUntil > 0) {
    return {
      statusKind: 'cycle',
      primaryTitle: `Cycle Day ${cycleDay}`,
      subtitle: `Next period expected in ${daysUntil} ${daysUntil === 1 ? 'day' : 'days'} · ${formatShortDate(nextExpectedStart)}`,
      isLate: false,
      activeOngoingLog,
      avgDuration,
      avgCycleLength,
      predictedRanges,
    };
  }

  if (daysUntil === 0) {
    return {
      statusKind: 'cycle',
      primaryTitle: `Cycle Day ${cycleDay}`,
      subtitle: `Next period expected today · ${formatShortDate(nextExpectedStart)}`,
      isLate: false,
      activeOngoingLog,
      avgDuration,
      avgCycleLength,
      predictedRanges,
    };
  }

  const daysLate = Math.abs(daysUntil);
  return {
    statusKind: 'cycle',
    primaryTitle: `Cycle Day ${cycleDay}`,
    subtitle: `Period is ${daysLate} ${daysLate === 1 ? 'day' : 'days'} late`,
    isLate: true,
    activeOngoingLog,
    avgDuration,
    avgCycleLength,
    predictedRanges,
  };
}

export function computeHistoryItems(logs: PeriodLog[]): HistoryItem[] {
  const sortedAsc = sortLogsAscending(logs);
  const itemsAsc: HistoryItem[] = sortedAsc.map((log, index) => {
    const durationDays =
      log.end_date && log.end_date >= log.start_date
        ? diffDays(log.start_date, log.end_date) + 1
        : null;

    let cycleLengthDays: number | null = null;
    let cycleStatus: 'Normal' | 'Irregular' | null = null;

    if (index > 0) {
      const gap = diffDays(sortedAsc[index - 1].start_date, log.start_date);
      if (gap > 0) {
        cycleLengthDays = gap;
        cycleStatus = gap >= 21 && gap <= 35 ? 'Normal' : 'Irregular';
      }
    }

    const monthLabel = formatMonthYear(log.start_date);
    const startShort = formatShortDate(log.start_date);
    const endShort = log.end_date ? formatShortDate(log.end_date) : 'Ongoing';

    return {
      log,
      monthLabel,
      dateRangeLabel: `${startShort} – ${endShort}`,
      durationDays,
      cycleLengthDays,
      cycleStatus,
    };
  });

  return itemsAsc.reverse();
}

export function getMonthGrid(
  year: number,
  monthIndex: number,
  logs: PeriodLog[],
  predictedRanges: PredictedRange[],
  todayStr = getTodayDateStr()
): CalendarCell[] {
  const firstDayOfMonth = new Date(year, monthIndex, 1);
  const startWeekday = firstDayOfMonth.getDay(); // 0 = Sun
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const totalCells = Math.ceil((startWeekday + daysInMonth) / 7) * 7;

  const gridStart = new Date(year, monthIndex, 1 - startWeekday);
  const cells: CalendarCell[] = [];

  for (let i = 0; i < totalCells; i++) {
    const cellDate = new Date(
      gridStart.getFullYear(),
      gridStart.getMonth(),
      gridStart.getDate() + i
    );
    const dateStr = formatDateStr(cellDate);
    const inCurrentMonth = cellDate.getMonth() === monthIndex;
    const isToday = dateStr === todayStr;

    const matchingLog = findLogForDate(logs, dateStr, todayStr);
    const isLoggedPeriod = matchingLog !== null;
    const isPredictedPeriod =
      !isLoggedPeriod &&
      predictedRanges.some((range) => dateStr >= range.start && dateStr <= range.end);

    cells.push({
      dateStr,
      dayNumber: cellDate.getDate(),
      inCurrentMonth,
      isToday,
      isLoggedPeriod,
      isPredictedPeriod,
      matchingLog,
    });
  }

  return cells;
}
