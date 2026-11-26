import { useState, type FormEvent } from 'react';
import { Loader2 } from 'lucide-react';
import { addDays, getTodayDateStr } from '../utils/cycleMath';
import { LotusEmblem } from './Illustrations';

interface OnboardingCardProps {
  onComplete: (params: {
    startDate: string;
    endDate: string;
    durationDays: number;
    cycleLengthDays: number;
  }) => Promise<void>;
}

export function OnboardingCard({ onComplete }: OnboardingCardProps) {
  const todayStr = getTodayDateStr();
  const [startDate, setStartDate] = useState(() => addDays(todayStr, -14));
  const [durationDays, setDurationDays] = useState(5);
  const [cycleLengthDays, setCycleLengthDays] = useState(28);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!startDate) {
      setErrorMsg('Please select when your last period started.');
      return;
    }
    if (startDate > todayStr) {
      setErrorMsg('Start date cannot be in the future.');
      return;
    }
    if (durationDays < 1 || durationDays > 15) {
      setErrorMsg('Period duration should be between 1 and 15 days.');
      return;
    }
    if (cycleLengthDays < 15 || cycleLengthDays > 60) {
      setErrorMsg('Average cycle length should be between 15 and 60 days.');
      return;
    }

    const calculatedEnd = addDays(startDate, durationDays - 1);
    const clampedEnd = calculatedEnd > todayStr ? todayStr : calculatedEnd;

    setSaving(true);
    try {
      await onComplete({
        startDate,
        endDate: clampedEnd,
        durationDays,
        cycleLengthDays,
      });
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Unable to save your initial cycle.');
      setSaving(false);
    }
  };

  return (
    <div className="rounded-2xl bg-white/92 backdrop-blur-md border border-white/90 p-6 shadow-[0_14px_36px_-14px_rgba(236,72,153,0.22)]">
      <div
        className="flex h-12 w-12 items-center justify-center rounded-2xl text-white shadow-[0_8px_20px_-6px_rgba(236,72,153,0.5)]"
        style={{
          background: 'linear-gradient(135deg, #FF5E7E 0%, #FF8E6E 50%, #A855F7 100%)',
        }}
      >
        <LotusEmblem className="h-6 w-6" />
      </div>

      <h2 className="mt-4 text-xl font-bold tracking-tight text-[#2D2A2E]">
        Set up your cycle
      </h2>
      <p className="mt-1.5 text-sm leading-relaxed text-[#6E676B]">
        Answer three quick questions so your calendar can show your current cycle day and next
        prediction right away.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-5">
        <div>
          <label htmlFor="onboard-start" className="block text-sm font-medium text-[#2D2A2E]">
            When did your last period start?
          </label>
          <input
            id="onboard-start"
            type="date"
            max={todayStr}
            required
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="mt-1.5 w-full min-h-[44px] rounded-xl border border-[#FBCFE8] bg-white px-3.5 py-2.5 text-sm text-[#2D2A2E] focus:border-[#EC4899] focus:outline-none"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="onboard-duration" className="block text-sm font-medium text-[#2D2A2E]">
              How many days did it last?
            </label>
            <div className="relative mt-1.5">
              <input
                id="onboard-duration"
                type="number"
                min={1}
                max={15}
                required
                value={durationDays}
                onChange={(e) => setDurationDays(Number(e.target.value))}
                className="w-full min-h-[44px] rounded-xl border border-[#FBCFE8] bg-white pl-3.5 pr-14 py-2.5 text-sm tabular-nums text-[#2D2A2E] focus:border-[#EC4899] focus:outline-none"
              />
              <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-[#6E676B]">
                days
              </span>
            </div>
          </div>

          <div>
            <label htmlFor="onboard-cycle" className="block text-sm font-medium text-[#2D2A2E]">
              Average cycle length?
            </label>
            <div className="relative mt-1.5">
              <input
                id="onboard-cycle"
                type="number"
                min={15}
                max={60}
                required
                value={cycleLengthDays}
                onChange={(e) => setCycleLengthDays(Number(e.target.value))}
                className="w-full min-h-[44px] rounded-xl border border-[#FBCFE8] bg-white pl-3.5 pr-14 py-2.5 text-sm tabular-nums text-[#2D2A2E] focus:border-[#EC4899] focus:outline-none"
              />
              <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-[#6E676B]">
                days
              </span>
            </div>
          </div>
        </div>

        {errorMsg && (
          <div
            role="alert"
            className="rounded-xl bg-[#FEF2F2] border border-[#FECACA] px-3.5 py-2.5 text-sm text-[#991B1B]"
          >
            {errorMsg}
          </div>
        )}

        <button
          type="submit"
          disabled={saving}
          className="min-h-[48px] w-full rounded-xl bg-gradient-to-r from-[#F43F5E] to-[#EC4899] px-4 py-3 text-sm font-semibold text-white shadow-[0_8px_22px_-6px_rgba(236,72,153,0.52)] transition-all duration-150 hover:brightness-105 active:scale-[0.96] disabled:opacity-60 flex items-center justify-center gap-2 whitespace-nowrap"
        >
          {saving && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
          <span>Save &amp; View Calendar</span>
        </button>
      </form>
    </div>
  );
}
