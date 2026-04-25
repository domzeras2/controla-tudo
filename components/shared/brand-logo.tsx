import clsx from "clsx";

export function BrandLogo({
  compact = false,
  className
}: {
  compact?: boolean;
  className?: string;
}) {
  return (
    <div className={clsx("flex items-center gap-3", className)}>
      <div className="relative flex h-11 w-11 items-center justify-center rounded-2xl border border-brand-500/40 bg-slate-900 shadow-[0_12px_30px_rgba(59,130,246,0.18)]">
        <svg viewBox="0 0 48 48" className="h-7 w-7" aria-hidden="true">
          <rect x="8" y="24" width="6" height="12" rx="2" fill="#3b82f6" />
          <rect x="18" y="18" width="6" height="18" rx="2" fill="#60a5fa" />
          <rect x="28" y="12" width="6" height="24" rx="2" fill="#93c5fd" />
          <path
            d="M10 17l10-6 7 4 10-9"
            fill="none"
            stroke="#22c55e"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="3"
          />
          <path
            d="M33 6h8v8"
            fill="none"
            stroke="#22c55e"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="3"
          />
        </svg>
      </div>

      {!compact ? (
        <div>
          <p className="text-lg font-semibold tracking-tight text-slate-50">Controla Tudo</p>
          <p className="text-xs uppercase tracking-[0.24em] text-slate-400">
            Financeiro e produtividade
          </p>
        </div>
      ) : null}
    </div>
  );
}
