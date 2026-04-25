import type { ReactNode } from "react";
import clsx from "clsx";

export function SectionCard({
  title,
  description,
  children,
  className
}: {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={clsx(
        "rounded-[28px] border border-slate-700 bg-slate-900/84 p-5 shadow-[0_4px_12px_rgba(0,0,0,0.1)] sm:p-6",
        className
      )}
    >
      <div className="mb-5">
        <h3 className="text-lg font-semibold text-slate-50">{title}</h3>
        {description ? <p className="mt-2 text-sm leading-6 text-slate-400">{description}</p> : null}
      </div>
      {children}
    </section>
  );
}
