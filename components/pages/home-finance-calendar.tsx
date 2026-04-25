"use client";

import { useEffect, useMemo, useState } from "react";
import { ActionButton } from "@/components/shared/action-button";
import { SectionCard } from "@/components/shared/section-card";
import type { HomePayableEntry } from "@/lib/dashboard";
import { formatCurrency, formatDate, formatMonthYearLabel, toTitleCase } from "@/lib/format";
import type { HomePaymentStatus } from "@/lib/types";

type HomeFinanceCalendarProps = {
  month: Date;
  items: HomePayableEntry[];
  onToggleStatus: (item: HomePayableEntry) => void | Promise<void>;
};

const weekDays = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sab", "Dom"];

function normalizeDay(value: Date) {
  const next = new Date(value);
  next.setHours(0, 0, 0, 0);
  return next;
}

function sameDay(left: Date, right: Date) {
  return left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate();
}

function statusDotTone(status: HomePaymentStatus) {
  if (status === "pago") return "bg-emerald-500";
  if (status === "atrasado") return "bg-rose-500";
  return "bg-amber-500";
}

function statusBadgeTone(status: HomePaymentStatus) {
  if (status === "pago") return "border border-emerald-900/40 bg-emerald-950/60 text-emerald-300";
  if (status === "atrasado") return "border border-rose-900/40 bg-rose-950/60 text-rose-300";
  return "border border-amber-900/40 bg-amber-950/60 text-amber-300";
}

function dayCardTone(statuses: HomePaymentStatus[]) {
  if (statuses.includes("atrasado")) {
    return "border-rose-900/40 bg-rose-950/20";
  }

  if (statuses.includes("pendente")) {
    return "border-amber-900/40 bg-amber-950/20";
  }

  if (statuses.includes("pago")) {
    return "border-emerald-900/40 bg-emerald-950/20";
  }

  return "border-slate-700 bg-[#172033]";
}

export function HomeFinanceCalendar({
  month,
  items,
  onToggleStatus
}: HomeFinanceCalendarProps) {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const itemsByDay = useMemo(() => {
    const grouped = new Map<string, HomePayableEntry[]>();

    items.forEach((item) => {
      const key = item.dueDate;
      const current = grouped.get(key) ?? [];
      current.push(item);
      grouped.set(key, current);
    });

    return grouped;
  }, [items]);

  useEffect(() => {
    const today = normalizeDay(new Date());
    const isCurrentMonth =
      today.getFullYear() === month.getFullYear() && today.getMonth() === month.getMonth();
    const currentMonthItems = [...items].sort((a, b) => +new Date(a.dueDate) - +new Date(b.dueDate));

    if (isCurrentMonth) {
      const todayKey = today.toISOString().slice(0, 10);
      if (itemsByDay.has(todayKey)) {
        setSelectedDate(today);
        return;
      }
    }

    if (currentMonthItems.length) {
      setSelectedDate(normalizeDay(new Date(currentMonthItems[0].dueDate)));
      return;
    }

    setSelectedDate(null);
  }, [items, itemsByDay, month]);

  const calendarDays = useMemo(() => {
    const firstDay = new Date(month.getFullYear(), month.getMonth(), 1);
    const lastDay = new Date(month.getFullYear(), month.getMonth() + 1, 0);
    const leadingEmpty = (firstDay.getDay() + 6) % 7;
    const totalDays = lastDay.getDate();

    return [
      ...Array.from({ length: leadingEmpty }, (_, index) => ({ key: `empty-start-${index}`, date: null })),
      ...Array.from({ length: totalDays }, (_, index) => {
        const date = new Date(month.getFullYear(), month.getMonth(), index + 1);
        return {
          key: date.toISOString(),
          date
        };
      })
    ];
  }, [month]);

  const selectedItems = useMemo(() => {
    if (!selectedDate) return [];
    const key = selectedDate.toISOString().slice(0, 10);
    return (itemsByDay.get(key) ?? []).sort((a, b) => +new Date(a.dueDate) - +new Date(b.dueDate));
  }, [itemsByDay, selectedDate]);

  return (
    <SectionCard
      title="Calendário de Vencimentos"
      description={`Acompanhe visualmente os vencimentos de ${formatMonthYearLabel(month)} e clique em um dia para ver os detalhes.`}
    >
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.9fr)]">
        <div className="overflow-x-auto">
          <div className="min-w-[720px]">
            <div className="mb-3 grid grid-cols-7 gap-2 text-center text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
              {weekDays.map((day) => (
                <div key={day} className="rounded-2xl border border-slate-700 bg-[#172033] px-2 py-3">
                  {day}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-2">
              {calendarDays.map((entry) => {
                if (!entry.date) {
                  return (
                    <div
                      key={entry.key}
                      className="min-h-28 rounded-[24px] border border-transparent bg-transparent"
                    />
                  );
                }

                const key = entry.date.toISOString().slice(0, 10);
                const dayItems = itemsByDay.get(key) ?? [];
                const dayStatuses = [...new Set(dayItems.map((item) => item.status))];
                const isSelected = selectedDate ? sameDay(entry.date, selectedDate) : false;
                const isToday = sameDay(entry.date, normalizeDay(new Date()));

                return (
                  <button
                    key={entry.key}
                    type="button"
                    onClick={() => setSelectedDate(entry.date)}
                    className={`min-h-28 rounded-[24px] border p-3 text-left transition hover:bg-white/[0.03] ${
                      dayCardTone(dayStatuses)
                    } ${isSelected ? "ring-2 ring-brand-500 ring-offset-2 ring-offset-slate-950" : ""}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-slate-100">{entry.date.getDate()}</span>
                        {isToday ? (
                          <span className="rounded-full bg-slate-900 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-white">
                            Hoje
                          </span>
                        ) : null}
                      </div>
                      {dayItems.length ? (
                        <span className="rounded-full border border-slate-700 bg-slate-900/80 px-2 py-1 text-[11px] font-semibold text-slate-300">
                          {dayItems.length}
                        </span>
                      ) : null}
                    </div>

                    {dayItems.length ? (
                      <>
                        <div className="mt-4 flex flex-wrap gap-1.5">
                          {dayStatuses.map((status) => (
                            <span
                              key={status}
                              className={`h-2.5 w-2.5 rounded-full ${statusDotTone(status)}`}
                              title={status}
                            />
                          ))}
                        </div>
                        <p className="mt-4 line-clamp-2 text-xs leading-5 text-slate-300">
                          {dayItems[0].title}
                          {dayItems.length > 1 ? ` e mais ${dayItems.length - 1}` : ""}
                        </p>
                      </>
                    ) : (
                      <p className="mt-10 text-xs text-slate-500">Sem vencimentos</p>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="rounded-[28px] border border-slate-700 bg-[#172033] p-5 sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-slate-50">
                {selectedDate ? `Detalhes de ${formatDate(selectedDate.toISOString())}` : "Detalhes do dia"}
              </p>
              <p className="mt-1 text-sm text-slate-400">
                Veja o que vence no dia e atualize o status rapidamente.
              </p>
            </div>
            {selectedDate ? (
              <ActionButton variant="secondary" onClick={() => setSelectedDate(null)}>
                Limpar dia
              </ActionButton>
            ) : null}
          </div>

          <div className="mt-5 grid gap-3">
            {selectedItems.length ? (
              selectedItems.map((item) => (
                <div
                  key={item.id}
                  className="rounded-[24px] border border-slate-700 bg-slate-900/72 px-4 py-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-slate-50">{item.title}</p>
                      <p className="mt-1 text-xs text-slate-400">
                        {item.category} | {toTitleCase(item.type)}
                      </p>
                    </div>
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusBadgeTone(item.status)}`}
                    >
                      {toTitleCase(item.status)}
                    </span>
                  </div>

                  <div className="mt-4 grid gap-2 text-sm text-slate-300">
                    <div className="flex items-center justify-between gap-3">
                      <span>Vencimento</span>
                      <span className="font-medium text-slate-100">{formatDate(item.dueDate)}</span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span>Valor</span>
                      <span className="font-semibold text-slate-50">{formatCurrency(item.amount)}</span>
                    </div>
                  </div>

                  <div className="mt-4">
                    <ActionButton variant="secondary" onClick={() => void onToggleStatus(item)}>
                      {item.status === "pago" ? "Marcar pendente" : "Marcar pago"}
                    </ActionButton>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-[24px] border border-dashed border-slate-700 bg-slate-900/72 px-4 py-8 text-sm text-slate-400">
                Selecione um dia com vencimento para ver os detalhes aqui.
              </div>
            )}
          </div>
        </div>
      </div>
    </SectionCard>
  );
}
