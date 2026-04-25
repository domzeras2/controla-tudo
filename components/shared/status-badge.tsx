import clsx from "clsx";

export function StatusBadge({ value }: { value: string }) {
  const tone =
    value === "finalizado"
      ? "bg-emerald-950 text-emerald-300"
      : value === "em andamento"
        ? "bg-blue-950 text-blue-300"
        : value === "aguardando cliente"
          ? "bg-amber-950 text-amber-300"
          : value === "cancelado"
            ? "bg-rose-950 text-rose-300"
            : "bg-slate-800 text-slate-300";

  return (
    <span className={clsx("inline-flex rounded-full px-3 py-1 text-xs font-semibold capitalize", tone)}>
      {value}
    </span>
  );
}
