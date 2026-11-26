export function BackgroundBlobs() {
  return (
    <div
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
      aria-hidden="true"
    >
      <div
        className="animate-luna-float-slow absolute -top-24 -left-20 h-80 w-80 rounded-full opacity-45 blur-3xl"
        style={{
          background: 'radial-gradient(circle, rgba(255, 94, 126, 0.28) 0%, rgba(255, 142, 110, 0) 72%)',
        }}
      />
      <div
        className="animate-luna-float-slow absolute top-1/3 -right-24 h-96 w-96 rounded-full opacity-45 blur-3xl"
        style={{
          animationDelay: '-4s',
          background: 'radial-gradient(circle, rgba(168, 85, 247, 0.22) 0%, rgba(236, 72, 153, 0) 72%)',
        }}
      />
      <div
        className="animate-luna-float-slow absolute -bottom-24 left-1/4 h-80 w-80 rounded-full opacity-40 blur-3xl"
        style={{
          animationDelay: '-8s',
          background: 'radial-gradient(circle, rgba(255, 142, 110, 0.24) 0%, rgba(253, 242, 248, 0) 72%)',
        }}
      />
    </div>
  );
}

export function LotusEmblem({ className = 'h-6 w-6' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M16 5C13.5 9.2 12.5 13 12.5 16.5C12.5 19.6 14 22 16 23.5C18 22 19.5 19.6 19.5 16.5C19.5 13 18.5 9.2 16 5Z"
        fill="currentColor"
        fillOpacity="0.95"
      />
      <path
        d="M11.6 22.8C9.2 21.8 7.4 19.5 6.8 16.3C6.3 13.7 7 11 8.5 8.8C10.5 10.6 12 13.2 12.6 16.2C13 18.5 12.6 20.9 11.6 22.8Z"
        fill="currentColor"
        fillOpacity="0.65"
      />
      <path
        d="M20.4 22.8C22.8 21.8 24.6 19.5 25.2 16.3C25.7 13.7 25 11 23.5 8.8C21.5 10.6 20 13.2 19.4 16.2C19 18.5 19.4 20.9 20.4 22.8Z"
        fill="currentColor"
        fillOpacity="0.65"
      />
      <path
        d="M16 25C11.5 25 7.7 23.2 5.2 20.4C7.5 19.9 10 20.4 12.2 21.8C13.6 22.7 14.9 23.8 16 25Z"
        fill="currentColor"
        fillOpacity="0.45"
      />
      <path
        d="M16 25C20.5 25 24.3 23.2 26.8 20.4C24.5 19.9 22 20.4 19.8 21.8C18.4 22.7 17.1 23.8 16 25Z"
        fill="currentColor"
        fillOpacity="0.45"
      />
    </svg>
  );
}

export function HeroCycleIllustration({
  statusKind,
}: {
  statusKind: 'period' | 'cycle' | 'empty';
}) {
  return (
    <div className="relative h-24 w-24 shrink-0 select-none" aria-hidden="true">
      <svg
        viewBox="0 0 112 112"
        fill="none"
        className="h-full w-full overflow-visible"
      >
        {/* Soft glowing halo */}
        <circle
          cx="56"
          cy="56"
          r="40"
          fill="white"
          fillOpacity="0.14"
          className="animate-luna-breathe"
        />
        <circle
          cx="56"
          cy="56"
          r="29"
          stroke="white"
          strokeOpacity="0.24"
          strokeWidth="1.2"
          strokeDasharray="3 4"
        />

        {statusKind === 'period' ? (
          /* Blooming Lotus & Crescent Glow for Active Period */
          <g className="animate-luna-float">
            <path
              d="M56 26C51 34 49 41.5 49 48.5C49 55 52 59.5 56 62.5C60 59.5 63 55 63 48.5C63 41.5 61 34 56 26Z"
              fill="white"
              fillOpacity="0.95"
            />
            <path
              d="M47 61C41 58.5 36.8 53 35.5 45.5C34.5 39.8 36 34 39.5 29C44 33 47.4 39 48.7 45.5C49.6 50.5 48.9 56.2 47 61Z"
              fill="white"
              fillOpacity="0.72"
            />
            <path
              d="M65 61C71 58.5 75.2 53 76.5 45.5C77.5 39.8 76 34 72.5 29C68 33 64.6 39 63.3 45.5C62.4 50.5 63.1 56.2 65 61Z"
              fill="white"
              fillOpacity="0.72"
            />
            <path
              d="M56 66C45.5 66 36.2 61.8 30 54.8C35.8 53.5 41.8 54.8 47 58C50.4 60.2 53.3 63 56 66Z"
              fill="white"
              fillOpacity="0.52"
            />
            <path
              d="M56 66C66.5 66 75.8 61.8 82 54.8C76.2 53.5 70.2 54.8 65 58C61.6 60.2 58.7 63 56 66Z"
              fill="white"
              fillOpacity="0.52"
            />
            {/* Delicate droplet pearl */}
            <circle cx="56" cy="74" r="3" fill="#FEF08A" fillOpacity="0.95" />
          </g>
        ) : (
          /* Floating Crescent Moon & Petals for Cycle Phase */
          <g className="animate-luna-float">
            <path
              d="M64.5 29C53.2 29.8 44.5 39.2 44.5 50.6C44.5 62.6 54.2 72.3 66.2 72.3C71.5 72.3 76.3 70.4 80.1 67.3C71.2 68.1 63.4 61.1 63.4 51.8C63.4 44.4 68.3 38.2 75 36.2C72 31.8 68.4 29 64.5 29Z"
              fill="white"
              fillOpacity="0.95"
            />
            {/* Small blooming flower tucked by crescent */}
            <g transform="translate(34, 58)">
              <circle cx="8" cy="4" r="3.4" fill="white" fillOpacity="0.78" />
              <circle cx="12" cy="8" r="3.4" fill="white" fillOpacity="0.78" />
              <circle cx="8" cy="12" r="3.4" fill="white" fillOpacity="0.78" />
              <circle cx="4" cy="8" r="3.4" fill="white" fillOpacity="0.78" />
              <circle cx="8" cy="8" r="2.4" fill="#FEF08A" />
            </g>
          </g>
        )}

        {/* Twinkling Sparkles & Stars */}
        <g className="animate-luna-twinkle">
          <path
            d="M27 30L28.5 34L32.5 35.5L28.5 37L27 41L25.5 37L21.5 35.5L25.5 34L27 30Z"
            fill="#FEF08A"
          />
        </g>
        <g className="animate-luna-twinkle" style={{ animationDelay: '-1.2s' }}>
          <path
            d="M87 30L88.1 33.1L91.2 34.2L88.1 35.3L87 38.4L85.9 35.3L82.8 34.2L85.9 33.1L87 30Z"
            fill="white"
            fillOpacity="0.95"
          />
        </g>
        <g className="animate-luna-twinkle" style={{ animationDelay: '-2.1s' }}>
          <circle cx="84" cy="78" r="2.2" fill="#FEF08A" fillOpacity="0.9" />
          <circle cx="29" cy="79" r="1.8" fill="white" fillOpacity="0.85" />
        </g>
      </svg>
    </div>
  );
}

export function EmptyHistoryIllustration() {
  return (
    <div className="mx-auto w-36 h-32 select-none" aria-hidden="true">
      <svg viewBox="0 0 160 132" fill="none" className="h-full w-full overflow-visible">
        {/* Soft pastel backdrop */}
        <ellipse cx="80" cy="70" rx="58" ry="46" fill="#FDF2F8" />
        <circle cx="32" cy="36" r="14" fill="#F5F3FF" />
        <circle cx="132" cy="88" r="12" fill="#FFF7ED" />

        {/* Cute calendar card */}
        <g className="animate-luna-float">
          <rect
            x="38"
            y="28"
            width="76"
            height="72"
            rx="14"
            fill="white"
            stroke="#FBCFE8"
            strokeWidth="2"
          />
          <path
            d="M38 42C38 34.268 44.268 28 52 28H100C107.732 28 114 34.268 114 42V49H38V42Z"
            fill="url(#calHeaderGrad)"
          />
          {/* Calendar rings */}
          <rect x="55" y="21" width="5" height="13" rx="2.5" fill="#F43F5E" />
          <rect x="92" y="21" width="5" height="13" rx="2.5" fill="#EC4899" />

          {/* Calendar dots */}
          <circle cx="55" cy="63" r="3.5" fill="#FDECEF" />
          <circle cx="70" cy="63" r="3.5" fill="#FDECEF" />
          <circle cx="85" cy="63" r="3.5" fill="#F43F5E" />
          <circle cx="99" cy="63" r="3.5" fill="#EC4899" />

          <circle cx="55" cy="79" r="3.5" fill="#F5F3FF" />
          <circle cx="70" cy="79" r="3.5" fill="#FDECEF" />
          <circle cx="85" cy="79" r="3.5" fill="#FDECEF" />
          <circle cx="99" cy="79" r="3.5" fill="#F5F3FF" />
        </g>

        {/* Blooming flower beside calendar */}
        <g transform="translate(104, 68)" className="animate-luna-breathe">
          <path
            d="M16 28V40"
            stroke="#34D399"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <path
            d="M16 36C12 34 10 31 10 28C13 28 15 30 16 33Z"
            fill="#6EE7B7"
          />
          <circle cx="16" cy="11" r="6" fill="#F43F5E" />
          <circle cx="23" cy="16" r="6" fill="#EC4899" />
          <circle cx="19" cy="24" r="6" fill="#A855F7" fillOpacity="0.85" />
          <circle cx="11" cy="23" r="6" fill="#FB7185" />
          <circle cx="9" cy="15" r="6" fill="#FF8E6E" />
          <circle cx="16" cy="17" r="4.5" fill="#FEF08A" />
        </g>

        {/* Sparkles */}
        <path
          d="M27 64L28.5 68L32.5 69.5L28.5 71L27 75L25.5 71L21.5 69.5L25.5 68L27 64Z"
          fill="#EC4899"
          className="animate-luna-twinkle"
        />
        <path
          d="M128 32L129.2 35.2L132.4 36.4L129.2 37.6L128 40.8L126.8 37.6L123.6 36.4L126.8 35.2L128 32Z"
          fill="#A855F7"
          className="animate-luna-twinkle"
          style={{ animationDelay: '-1.5s' }}
        />

        <defs>
          <linearGradient id="calHeaderGrad" x1="38" y1="28" x2="114" y2="49" gradientUnits="userSpaceOnUse">
            <stop stopColor="#FF5E7E" />
            <stop offset="0.55" stopColor="#FF8E6E" />
            <stop offset="1" stopColor="#A855F7" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}
