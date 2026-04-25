import clsx from "clsx";

type StatCardProps = {
  label: string;
  value: string;
  helper: string;
  tone?: "default" | "blue" | "green" | "amber";
};

const tones = {
  default: "border-slate-700 bg-slate-900/88",
  blue: "border-blue-900/40 bg-slate-900/88",
  green: "border-emerald-900/40 bg-slate-900/88",
  amber: "border-amber-900/40 bg-slate-900/88"
};

const accent = {
  default: "bg-slate-500/70",
  blue: "bg-blue-500/80",
  green: "bg-emerald-500/80",
  amber: "bg-amber-400/80"
};

export function StatCard({ label, value, helper, tone = "default" }: StatCardProps) {
  return (
    <article
      className={clsx(
        "rounded-[28px] border p-5 shadow-[0_4px_12px_rgba(0,0,0,0.12)] sm:p-6",
        tones[tone]
      )}
    >
      <div className={clsx("mb-4 h-1.5 w-16 rounded-full", accent[tone])} />
      <p className="text-sm font-medium text-slate-400">{label}</p>
      <strong className="mt-3 block text-3xl font-semibold text-slate-50">{value}</strong>
      <p className="mt-3 text-sm leading-6 text-slate-400">{helper}</p>
    </article>
  );
}
