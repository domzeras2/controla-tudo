import type { ReactNode } from "react";
import clsx from "clsx";

export type TableColumn<T> = {
  key: string;
  header: string;
  className?: string;
  render: (item: T) => ReactNode;
};

type ResponsiveTableProps<T extends { id: string }> = {
  items: T[];
  columns: TableColumn<T>[];
  emptyMessage: string;
};

export function ResponsiveTable<T extends { id: string }>({
  items,
  columns,
  emptyMessage
}: ResponsiveTableProps<T>) {
  if (!items.length) {
    return (
      <div className="rounded-3xl border border-dashed border-slate-700 bg-[#172033] px-4 py-10 text-center text-sm text-slate-400">
        {emptyMessage}
      </div>
    );
  }

  return (
    <>
      <div className="hidden overflow-x-auto pb-2 lg:block">
        <table className="w-full min-w-max border-separate border-spacing-y-3">
          <thead>
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={clsx(
                    "whitespace-nowrap px-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-400",
                    column.className
                  )}
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} className="rounded-2xl bg-[#172033]">
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className={clsx("rounded-2xl px-4 py-4 align-top text-sm text-slate-200", column.className)}
                  >
                    {column.render(item)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid gap-4 lg:hidden">
        {items.map((item) => (
          <article key={item.id} className="rounded-3xl border border-slate-700 bg-[#172033] p-4">
            <div className="grid gap-3">
              {columns.map((column) => (
                <div key={column.key} className="grid gap-1">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                    {column.header}
                  </span>
                  <div className={clsx("text-sm text-slate-200", column.className)}>
                    {column.render(item)}
                  </div>
                </div>
              ))}
            </div>
          </article>
        ))}
      </div>
    </>
  );
}
