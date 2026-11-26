import { useCallback, useEffect, useMemo, useState } from 'react';
import { onAuthStateChanged, signOut, type User } from 'firebase/auth';
import { CalendarDays, Clock, LogOut } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { AuthScreen } from './components/AuthScreen';
import { CalendarTab } from './components/CalendarTab';
import { CelebrationBurst } from './components/CelebrationBurst';
import { DateActionSheet, type SheetContext } from './components/DateActionSheet';
import { ErrorBoundary } from './components/ErrorBoundary';
import { HistoryTab } from './components/HistoryTab';
import { BackgroundBlobs, LotusEmblem } from './components/Illustrations';
import { OnboardingCard } from './components/OnboardingCard';
import { auth } from './lib/firebase';
import {
  createPeriodLog,
  deletePeriodLog,
  subscribePeriodLogs,
  subscribeUserProfile,
  updatePeriodLog,
  upsertUserProfile,
} from './services/periodService';
import type { CalendarCell, PeriodLog, UserProfile } from './types/period';
import {
  computeCycleSummary,
  computeHistoryItems,
  diffDays,
  getTodayDateStr,
} from './utils/cycleMath';

type ActiveTab = 'calendar' | 'history';

function PeriodTrackerApp() {
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [emailVerifiedTick, setEmailVerifiedTick] = useState(0);

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [logs, setLogs] = useState<PeriodLog[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [fatalError, setFatalError] = useState<Error | null>(null);

  const [activeTab, setActiveTab] = useState<ActiveTab>('calendar');
  const [sheetContext, setSheetContext] = useState<SheetContext | null>(null);

  const [celebrationKey, setCelebrationKey] = useState(0);
  const [celebrationMsg, setCelebrationMsg] = useState<string | null>(null);

  if (fatalError) {
    throw fatalError;
  }

  const triggerCelebration = useCallback((message: string) => {
    setCelebrationMsg(message);
    setCelebrationKey((k) => k + 1);
  }, []);

  useEffect(() => {
    if (celebrationKey === 0) return;
    const timer = window.setTimeout(() => {
      setCelebrationMsg(null);
    }, 1800);
    return () => window.clearTimeout(timer);
  }, [celebrationKey]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setAuthReady(true);
      if (!firebaseUser) {
        setProfile(null);
        setLogs([]);
        setDataLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  const isVerifiedAuth = Boolean(user && user.emailVerified);

  useEffect(() => {
    if (!user || !user.emailVerified) {
      return;
    }

    setDataLoading(true);
    let profileLoaded = false;
    let logsLoaded = false;

    const checkReady = () => {
      if (profileLoaded && logsLoaded) {
        setDataLoading(false);
      }
    };

    const unsubProfile = subscribeUserProfile(
      user.uid,
      (nextProfile) => {
        setProfile(nextProfile);
        profileLoaded = true;
        checkReady();
      },
      (err) => {
        setFatalError(err);
      }
    );

    const unsubLogs = subscribePeriodLogs(
      user.uid,
      (nextLogs) => {
        setLogs(nextLogs);
        logsLoaded = true;
        checkReady();
      },
      (err) => {
        setFatalError(err);
      }
    );

    return () => {
      unsubProfile();
      unsubLogs();
    };
  }, [user, emailVerifiedTick]);

  const handleRefreshVerification = useCallback(async () => {
    if (!auth.currentUser) return;
    await auth.currentUser.reload();
    setUser(auth.currentUser);
    setEmailVerifiedTick((t) => t + 1);
  }, []);

  const todayStr = getTodayDateStr();

  const summary = useMemo(
    () =>
      computeCycleSummary(
        logs,
        profile?.defaultCycleLength ?? 28,
        profile?.defaultPeriodDuration ?? 5,
        todayStr
      ),
    [logs, profile, todayStr]
  );

  const historyItems = useMemo(() => computeHistoryItems(logs), [logs]);

  const handleOnboardingComplete = async (params: {
    startDate: string;
    endDate: string;
    durationDays: number;
    cycleLengthDays: number;
  }) => {
    if (!user) return;
    await upsertUserProfile(
      user.uid,
      user.email ?? 'user@example.com',
      params.cycleLengthDays,
      params.durationDays,
      profile !== null
    );
    await createPeriodLog(user.uid, params.startDate, params.endDate);
    triggerCelebration('Cycle setup saved!');
  };

  const findRecentClosableLog = useCallback(
    (selectedDate: string): PeriodLog | null => {
      for (const log of logs) {
        if (log.start_date <= selectedDate) {
          const gap = diffDays(log.start_date, selectedDate);
          if (gap >= 0 && gap <= 14) {
            return log;
          }
        }
      }
      return null;
    },
    [logs]
  );

  const handleSelectDate = (cell: CalendarCell) => {
    setSheetContext({
      mode: 'date',
      selectedDate: cell.dateStr,
      targetLog: cell.matchingLog,
      ongoingLog: summary.activeOngoingLog,
      recentClosableLog: cell.matchingLog ? null : findRecentClosableLog(cell.dateStr),
    });
  };

  const handlePrimaryCalendarAction = () => {
    if (summary.activeOngoingLog) {
      setSheetContext({
        mode: 'end-current',
        selectedDate: todayStr,
        targetLog: summary.activeOngoingLog,
        ongoingLog: summary.activeOngoingLog,
        recentClosableLog: null,
      });
    } else {
      setSheetContext({
        mode: 'log-start',
        selectedDate: todayStr,
        targetLog: null,
        ongoingLog: null,
        recentClosableLog: null,
      });
    }
  };

  const handleEditLog = (log: PeriodLog) => {
    setSheetContext({
      mode: 'edit',
      selectedDate: log.start_date,
      targetLog: log,
      ongoingLog: summary.activeOngoingLog,
      recentClosableLog: null,
    });
  };

  const handleCreateLog = async (startDate: string, endDate: string | null) => {
    if (!user) return;
    await createPeriodLog(user.uid, startDate, endDate);
    triggerCelebration(endDate ? 'Period logged!' : 'Period start logged!');
  };

  const handleUpdateLog = async (logId: string, startDate: string, endDate: string | null) => {
    const existing = logs.find((l) => l.id === logId);
    const wasOngoing = existing?.end_date === null;
    await updatePeriodLog(logId, startDate, endDate);
    if (wasOngoing && endDate !== null) {
      triggerCelebration('Period completed!');
    }
  };

  const handleDeleteLog = async (logId: string) => {
    await deletePeriodLog(logId);
  };

  if (!authReady) {
    return (
      <div className="relative min-h-screen flex items-center justify-center p-6">
        <BackgroundBlobs />
        <div className="w-full max-w-[480px] space-y-4">
          <div className="h-28 rounded-2xl bg-white/80 border border-white animate-pulse" />
          <div className="h-80 rounded-2xl bg-white/80 border border-white animate-pulse" />
        </div>
      </div>
    );
  }

  if (!user || !isVerifiedAuth) {
    return (
      <AuthScreen
        unverifiedUser={user && !user.emailVerified ? user : null}
        onUserVerified={handleRefreshVerification}
      />
    );
  }

  const showOnboarding = !dataLoading && logs.length === 0;

  return (
    <div className="relative min-h-screen text-[#2D2A2E] flex flex-col items-center">
      <BackgroundBlobs />

      {/* Compact Sticky Top Header (52px) */}
      <header className="sticky top-0 z-30 w-full bg-white/65 backdrop-blur-md border-b border-white/80">
        <div className="mx-auto flex h-[52px] w-full max-w-[480px] items-center justify-between px-4">
          <div className="flex items-center gap-2 whitespace-nowrap shrink-0">
            <span
              className="flex h-7 w-7 items-center justify-center rounded-lg text-white shadow-[0_4px_12px_-3px_rgba(236,72,153,0.45)]"
              style={{
                background: 'linear-gradient(135deg, #FF5E7E 0%, #EC4899 65%, #A855F7 100%)',
              }}
              aria-hidden="true"
            >
              <LotusEmblem className="h-4 w-4" />
            </span>
            <span className="text-lg font-bold tracking-tight text-[#2D2A2E]">Luna</span>
          </div>

          <button
            type="button"
            onClick={() => void signOut(auth)}
            className="min-h-[40px] inline-flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-xs font-medium text-[#6E676B] transition-all duration-150 hover:bg-white/80 hover:text-[#BE185D] active:scale-[0.96] whitespace-nowrap shrink-0"
          >
            <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Log out</span>
          </button>
        </div>
      </header>

      {/* Main Single-Column Content */}
      <main className="w-full max-w-[480px] flex-1 px-4 pt-4 pb-24">
        {dataLoading ? (
          <div className="space-y-4" aria-busy="true" aria-label="Loading cycle data">
            <div className="h-32 rounded-2xl bg-white/80 border border-white animate-pulse" />
            <div className="h-80 rounded-2xl bg-white/80 border border-white animate-pulse" />
          </div>
        ) : showOnboarding ? (
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
          >
            <OnboardingCard onComplete={handleOnboardingComplete} />
          </motion.div>
        ) : (
          <AnimatePresence mode="wait" initial={false}>
            {activeTab === 'calendar' ? (
              <motion.div
                key="tab-calendar"
                initial={{ opacity: 0, y: 10, scale: 0.985 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.985 }}
                transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              >
                <CalendarTab
                  logs={logs}
                  summary={summary}
                  pulseKey={celebrationKey}
                  onSelectDate={handleSelectDate}
                  onPrimaryAction={handlePrimaryCalendarAction}
                />
              </motion.div>
            ) : (
              <motion.div
                key="tab-history"
                initial={{ opacity: 0, y: 10, scale: 0.985 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.985 }}
                transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              >
                <HistoryTab
                  historyItems={historyItems}
                  summary={summary}
                  onEditLog={handleEditLog}
                  onDeleteLog={handleDeleteLog}
                />
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </main>

      {/* Compact Bottom Navigation Bar (60px) */}
      {!showOnboarding && (
        <nav
          aria-label="Primary navigation"
          className="fixed bottom-0 left-0 right-0 z-40 bg-white/85 backdrop-blur-md border-t border-white/90 shadow-[0_-8px_24px_-12px_rgba(168,85,247,0.14)]"
        >
          <div className="mx-auto grid h-[60px] w-full max-w-[480px] grid-cols-2 px-3 py-1.5 gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('calendar')}
              aria-current={activeTab === 'calendar' ? 'page' : undefined}
              className={`flex items-center justify-center gap-2 rounded-xl text-xs font-semibold transition-all duration-150 active:scale-[0.96] whitespace-nowrap ${
                activeTab === 'calendar'
                  ? 'bg-gradient-to-r from-[#F43F5E] to-[#EC4899] text-white shadow-[0_6px_16px_-4px_rgba(236,72,153,0.5)]'
                  : 'text-[#6E676B] hover:bg-[#FDF2F8]/70 hover:text-[#BE185D]'
              }`}
            >
              <CalendarDays
                className="h-4 w-4"
                strokeWidth={activeTab === 'calendar' ? 2.25 : 1.85}
                aria-hidden="true"
              />
              <span>Calendar</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('history')}
              aria-current={activeTab === 'history' ? 'page' : undefined}
              className={`flex items-center justify-center gap-2 rounded-xl text-xs font-semibold transition-all duration-150 active:scale-[0.96] whitespace-nowrap ${
                activeTab === 'history'
                  ? 'bg-gradient-to-r from-[#F43F5E] to-[#EC4899] text-white shadow-[0_6px_16px_-4px_rgba(236,72,153,0.5)]'
                  : 'text-[#6E676B] hover:bg-[#FDF2F8]/70 hover:text-[#BE185D]'
              }`}
            >
              <Clock
                className="h-4 w-4"
                strokeWidth={activeTab === 'history' ? 2.25 : 1.85}
                aria-hidden="true"
              />
              <span>History</span>
            </button>
          </div>
        </nav>
      )}

      {/* Celebratory Confetti & Toast */}
      <CelebrationBurst triggerKey={celebrationKey} message={celebrationMsg} />

      {/* Minimal Bottom Sheet / Modal for Date Logging & Editing */}
      <DateActionSheet
        context={sheetContext}
        onClose={() => setSheetContext(null)}
        onCreateLog={handleCreateLog}
        onUpdateLog={handleUpdateLog}
        onDeleteLog={handleDeleteLog}
      />
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <PeriodTrackerApp />
    </ErrorBoundary>
  );
}
