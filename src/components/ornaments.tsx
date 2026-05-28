type SvgProps = React.SVGProps<SVGSVGElement>;

export function SoundWave({ className, ...rest }: SvgProps) {
  return (
    <svg
      viewBox="0 0 400 40"
      className={className}
      aria-hidden
      {...rest}
    >
      <path
        d="M0 20 Q 16 4, 32 20 T 64 20 T 96 20 T 128 20 T 160 20 T 192 20 T 224 20 T 256 20 T 288 20 T 320 20 T 352 20 T 384 20 T 400 20"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function GridGlobe({ className, ...rest }: SvgProps) {
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden {...rest}>
      <circle
        cx="50"
        cy="50"
        r="42"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.2"
      />
      {/* longitudes (ellipses with varying rx) */}
      {[8, 20, 32, 42].map((rx, i) => (
        <ellipse
          key={`lon-${i}`}
          cx="50"
          cy="50"
          rx={rx}
          ry="42"
          fill="none"
          stroke="currentColor"
          strokeWidth="1"
          opacity={0.7}
        />
      ))}
      {/* latitudes */}
      {[10, 22, 34, 42].map((ry, i) => (
        <ellipse
          key={`lat-${i}`}
          cx="50"
          cy="50"
          rx="42"
          ry={ry}
          fill="none"
          stroke="currentColor"
          strokeWidth="1"
          opacity={0.7}
        />
      ))}
    </svg>
  );
}

export function StampBurst({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`relative inline-flex items-center justify-center ${className ?? ''}`}>
      {/* radial ticks */}
      <svg
        viewBox="0 0 200 80"
        className="absolute inset-0 h-full w-full text-pink"
        aria-hidden
      >
        {/* horizontal hairlines on both sides */}
        <line x1="0" y1="40" x2="55" y2="40" stroke="currentColor" strokeWidth="1" />
        <line x1="145" y1="40" x2="200" y2="40" stroke="currentColor" strokeWidth="1" />
        {/* radiating ticks around oval */}
        {Array.from({ length: 24 }).map((_, i) => {
          const angle = (i / 24) * Math.PI * 2;
          const r1 = 36;
          const r2 = 40;
          const cx = 100;
          const cy = 40;
          const rx = 1.4;
          const ry = 1;
          const x1 = cx + Math.cos(angle) * r1 * rx;
          const y1 = cy + Math.sin(angle) * r1 * ry;
          const x2 = cx + Math.cos(angle) * r2 * rx;
          const y2 = cy + Math.sin(angle) * r2 * ry;
          return (
            <line
              key={i}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke="currentColor"
              strokeWidth="1"
              opacity={0.55}
            />
          );
        })}
        {/* oval body */}
        <ellipse
          cx="100"
          cy="40"
          rx="44"
          ry="28"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.4"
        />
      </svg>
      <div className="font-display relative z-10 px-6 text-center text-xs leading-tight text-pink sm:text-sm">
        {children}
      </div>
    </div>
  );
}

export function MinusPlusWaveBar({ className }: { className?: string }) {
  return (
    <div
      className={`pink-frame relative flex items-center justify-between px-4 py-3 ${className ?? ''}`}
    >
      <span className="font-display text-2xl leading-none text-pink">−</span>
      <SoundWave className="mx-4 h-6 flex-1 text-pink" />
      <span className="font-display text-2xl leading-none text-pink">+</span>
    </div>
  );
}

export function CodeBrackets({ children }: { children: React.ReactNode }) {
  return (
    <span className="font-mono text-pink">
      <span className="mr-2 opacity-80">{'{'}</span>
      {children}
      <span className="ml-2 opacity-80">{'}'}</span>
    </span>
  );
}
