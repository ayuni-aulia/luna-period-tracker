export interface PeriodLog {
  id: string;
  user_id: string;
  start_date: string; // YYYY-MM-DD
  end_date: string | null; // YYYY-MM-DD | null
  created_at?: unknown;
  updated_at?: unknown;
}

export interface UserProfile {
  uid: string;
  email: string;
  defaultCycleLength: number;
  defaultPeriodDuration: number;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface HistoryItem {
  log: PeriodLog;
  monthLabel: string;
  dateRangeLabel: string;
  durationDays: number | null;
  cycleLengthDays: number | null;
  cycleStatus: 'Normal' | 'Irregular' | null;
}

export interface PredictedRange {
  start: string;
  end: string;
}

export interface CycleSummary {
  statusKind: 'period' | 'cycle' | 'empty';
  primaryTitle: string;
  subtitle: string;
  isLate: boolean;
  activeOngoingLog: PeriodLog | null;
  avgDuration: number;
  avgCycleLength: number;
  predictedRanges: PredictedRange[];
}

export interface CalendarCell {
  dateStr: string;
  dayNumber: number;
  inCurrentMonth: boolean;
  isToday: boolean;
  isLoggedPeriod: boolean;
  isPredictedPeriod: boolean;
  matchingLog: PeriodLog | null;
}
