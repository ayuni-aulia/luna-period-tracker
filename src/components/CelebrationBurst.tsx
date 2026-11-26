import type { CSSProperties } from 'react';

interface CelebrationBurstProps {
  triggerKey: number;
  message: string | null;
}

const PARTICLES = [
  { tx: '-110px', ty: '-130px', rot: '-210deg', color: '#F43F5E', size: 8, delay: '0ms' },
  { tx: '-70px', ty: '-160px', rot: '180deg', color: '#EC4899', size: 9, delay: '30ms' },
  { tx: '-30px', ty: '-145px', rot: '-160deg', color: '#A855F7', size: 7, delay: '60ms' },
  { tx: '15px', ty: '-170px', rot: '220deg', color: '#FF8E6E', size: 9, delay: '20ms' },
  { tx: '60px', ty: '-150px', rot: '-240deg', color: '#FACC15', size: 7, delay: '50ms' },
  { tx: '105px', ty: '-125px', rot: '190deg', color: '#F43F5E', size: 8, delay: '40ms' },
  { tx: '-90px', ty: '-95px', rot: '150deg', color: '#FACC15', size: 6, delay: '80ms' },
  { tx: '88px', ty: '-90px', rot: '-140deg', color: '#EC4899', size: 7, delay: '70ms' },
  { tx: '-48px', ty: '-115px', rot: '260deg', color: '#FF5E7E', size: 6, delay: '90ms' },
  { tx: '44px', ty: '-118px', rot: '-190deg', color: '#A855F7', size: 8, delay: '60ms' },
  { tx: '-12px', ty: '-110px', rot: '130deg', color: '#FB7185', size: 6, delay: '100ms' },
  { tx: '122px', ty: '-105px', rot: '240deg', color: '#FF8E6E', size: 7, delay: '55ms' },
];

export function CelebrationBurst({ triggerKey, message }: CelebrationBurstProps) {
  if (triggerKey === 0 || !message) return null;

  return (
    <div
      key={triggerKey}
      className="pointer-events-none fixed inset-0 z-50 flex items-end justify-center pb-28"
      aria-live="polite"
    >
      <div className="relative flex flex-col items-center">
        {/* Confetti petals */}
        {PARTICLES.map((p, idx) => (
          <span
            key={idx}
            className="animate-luna-confetti absolute bottom-6 rounded-full"
            style={
              {
                width: `${p.size}px`,
                height: `${Math.round(p.size * 1.4)}px`,
                backgroundColor: p.color,
                animationDelay: p.delay,
                '--tx': p.tx,
                '--ty': p.ty,
                '--rot': p.rot,
              } as CSSProperties
            }
          />
        ))}

        {/* Gentle floating confirmation toast */}
        <div className="rounded-2xl bg-gradient-to-r from-[#F43F5E] to-[#EC4899] px-4 py-2.5 text-xs font-semibold text-white shadow-[0_10px_28px_-6px_rgba(236,72,153,0.55)]">
          {message}
        </div>
      </div>
    </div>
  );
}
