"use client";

import { useState } from "react";
import { SourceIndicator } from "@/components/shared/source-indicator";
import { useAppData } from "@/hooks/use-app-data";
import { formatCurrency, formatHours } from "@/lib/format";

export function DashboardPage() {
  const { metrics, loading, error, migrateLocalDataToSupabase } = useAppData();
  const [migrationMessage, setMigrationMessage] = useState<string | null>(null);
  const [migrationLoading, setMigrationLoading] = useState(false);

  const cards = [
    {
      label: "Total recebido/ganho",
      value: formatCurrency(metrics.totalReceived),
      helper: "Soma dos projetos finalizados.",
      tone: "green" as const
    },
    {
      label: "Total gasto",
      value: formatCurrency(metrics.totalSpent),
      helper: "Despesas registradas no sistema.",
      tone: "red" as const
    },
    {
      label: "Lucro/saldo",
      value: formatCurrency(metrics.totalProfit),
      helper: "Recebido menos gastos e custo com IA.",
      tone: metrics.totalProfit >= 0 ? ("green" as const) : ("red" as const)
    },
    {
      label: "Projetos ativos",
      value: String(metrics.totalActiveProjects),
      helper: "Em andamento ou aguardando cliente.",
      tone: "blue" as const
    },
    {
      label: "Projetos finalizados",
      value: String(metrics.totalFinishedProjects),
      helper: "Projetos concluídos no histórico.",
      tone: "green" as const
    },
    {
      label: "Tempo total investido",
      value: formatHours(metrics.totalTimeInvested),
      helper: "Horas registradas em todos os projetos.",
      tone: "default" as const
    },
    {
      label: "Custo com IA",
      value: formatCurrency(metrics.totalAiCost),
      helper: "Somatório de custo das ferramentas de IA.",
      tone: "blue" as const
    }
  ];

  const tones = {
    blue: "border-blue-900/40 bg-slate-900/88 text-blue-300",
    green: "border-emerald-900/40 bg-slate-900/88 text-emerald-300",
    red: "border-rose-900/40 bg-slate-900/88 text-rose-300",
    amber: "border-amber-900/40 bg-slate-900/88 text-amber-300",
    default: "border-slate-700 bg-slate-900/88 text-slate-100"
  };

  function accentTone(tone: keyof typeof tones) {
    if (tone === "green") return "bg-emerald-500/80";
    if (tone === "red") return "bg-rose-500/80";
    if (tone === "blue") return "bg-blue-500/80";
    if (tone === "amber") return "bg-amber-400/80";
    return "bg-slate-500/70";
  }

  async function handleMigration() {
    setMigrationLoading(true);
    setMigrationMessage(null);

    try {
      const result = await migrateLocalDataToSupabase();
      setMigrationMessage(result.message);
    } catch (migrationError) {
      setMigrationMessage(
        migrationError instanceof Error
          ? migrationError.message
          : "Nao foi possivel migrar os dados locais."
      );
    } finally {
      setMigrationLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[32px] border border-slate-800 bg-[linear-gradient(135deg,rgba(30,41,59,0.9),rgba(15,23,42,0.96))] p-6 shadow-[0_10px_26px_rgba(2,6,23,0.22)]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-brand-500">
              Dashboard
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-50 sm:text-4xl">
              Controle financeiro e produtividade em um só lugar
            </h2>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-400 sm:text-base">
              Veja receita, gastos, lucro, serviços e tempo investido com leitura rápida e visual moderno.
            </p>
          </div>
          <div className="shrink-0">
            <SourceIndicator />
          </div>
        </div>
        <div className="mt-5 flex flex-col gap-3 border-t border-slate-800/80 pt-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              Migracao
            </p>
            <p className="mt-1 text-sm text-slate-400">
              Envia os dados atuais do localStorage para a nuvem sem apagar o backup local.
            </p>
          </div>
          <div className="flex flex-col items-start gap-2 sm:items-end">
            <button
              type="button"
              onClick={() => void handleMigration()}
              disabled={migrationLoading}
              className="inline-flex items-center rounded-full border border-blue-500/30 bg-blue-500/10 px-4 py-2 text-sm font-medium text-blue-200 transition hover:bg-blue-500/20 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {migrationLoading ? "Migrando..." : "Migrar dados locais para nuvem"}
            </button>
            {migrationMessage ? (
              <p className="text-xs text-slate-400">{migrationMessage}</p>
            ) : null}
          </div>
        </div>
      </section>

      {error ? (
        <div className="rounded-3xl border border-rose-900 bg-rose-950/50 p-4 text-sm text-rose-300">
          {error}
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <article
            key={card.label}
            className={`rounded-[28px] border p-5 shadow-[0_4px_12px_rgba(0,0,0,0.12)] sm:p-6 ${
              tones[card.tone]
            }`}
          >
            <div className={`mb-4 h-1.5 w-16 rounded-full ${accentTone(card.tone)}`} />
            <div className="flex items-start justify-between gap-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                {card.label}
              </p>
            </div>
            <strong className="mt-4 block text-3xl font-semibold tracking-tight text-slate-50">
              {loading ? "..." : card.value}
            </strong>
            <p className="mt-3 text-sm leading-6 text-slate-400">{card.helper}</p>
          </article>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <article className="rounded-[28px] border border-slate-700 bg-slate-900/84 p-5 shadow-[0_4px_12px_rgba(0,0,0,0.1)]">
          <p className="text-sm font-medium text-slate-400">Valor total dos serviços</p>
          <strong className="text-3xl font-semibold text-slate-50">
            {loading ? "..." : formatCurrency(metrics.totalServicesValue)}
          </strong>
          <p className="mt-2 text-sm leading-6 text-slate-500">Somatório de todos os projetos cadastrados.</p>
        </article>
        <article className="rounded-[28px] border border-slate-700 bg-slate-900/84 p-5 shadow-[0_4px_12px_rgba(0,0,0,0.1)]">
          <p className="text-sm font-medium text-slate-400">Serviços ativos</p>
          <strong className="text-3xl font-semibold text-slate-50">
            {loading ? "..." : String(metrics.totalActiveProjects)}
          </strong>
          <p className="mt-2 text-sm leading-6 text-slate-500">Projetos em andamento e aguardando cliente.</p>
        </article>
        <article className="rounded-[28px] border border-amber-900/40 bg-slate-900/84 p-5 shadow-[0_4px_12px_rgba(0,0,0,0.1)]">
          <p className="text-sm font-medium text-amber-300">Previsão de receita</p>
          <strong className="text-3xl font-semibold text-slate-50">
            {loading ? "..." : formatCurrency(metrics.forecastRevenue)}
          </strong>
          <p className="mt-2 text-sm leading-6 text-slate-500">Receita potencial de projetos ainda não finalizados.</p>
        </article>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.3fr)_minmax(320px,0.7fr)]">
        <section className="rounded-[28px] border border-slate-700 bg-slate-900/84 p-5 shadow-[0_4px_12px_rgba(0,0,0,0.1)] sm:p-6">
          <div className="mb-5">
            <h3 className="text-lg font-semibold text-slate-50">Lançamentos mais recentes</h3>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              Entradas recentes dos módulos de gastos, tempo, projetos e uso de IA.
            </p>
          </div>
          {metrics.recentEntries.length ? (
            <div className="grid gap-3">
              {metrics.recentEntries.map((item) => (
                <article
                  key={item.id}
                  className="rounded-[24px] border border-slate-700 bg-[#172033] px-4 py-4 shadow-[0_4px_12px_rgba(0,0,0,0.08)] transition hover:bg-white/[0.03]"
                >
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <span className="inline-flex rounded-full border border-slate-700 bg-slate-900/80 px-3 py-1 text-xs font-semibold text-slate-300">
                        {item.type}
                      </span>
                      <p className="mt-3 font-semibold text-slate-50">{item.title}</p>
                      <p className="mt-1 text-xs leading-5 text-slate-400">{item.subtitle}</p>
                    </div>
                    <div className="text-left lg:text-right">
                      <p className="text-base font-semibold text-slate-100">{item.amountLabel}</p>
                      <p className="mt-1 text-xs text-slate-400">
                        {new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium" }).format(
                          new Date(item.date)
                        )}
                      </p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="rounded-3xl border border-dashed border-slate-700 bg-[#172033] px-4 py-10 text-center text-sm text-slate-400">
              Ainda não existem lançamentos para mostrar.
            </div>
          )}
        </section>

        <section className="rounded-[28px] border border-slate-700 bg-slate-900/84 p-5 shadow-[0_4px_12px_rgba(0,0,0,0.1)] sm:p-6">
          <div className="mb-5">
            <h3 className="text-lg font-semibold text-slate-50">Resumo por categoria</h3>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              Distribuição dos gastos cadastrados por categoria.
            </p>
          </div>
          <div className="grid gap-3">
            {metrics.categorySummary.length ? (
              metrics.categorySummary.map((item) => (
                <div
                  key={item.category}
                  className="flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-950/70 px-4 py-4"
                >
                  <div>
                    <p className="font-semibold text-slate-100">{item.category}</p>
                    <p className="mt-1 text-xs text-slate-500">Categoria de gasto</p>
                  </div>
                  <strong className="text-base text-rose-400">{formatCurrency(item.total)}</strong>
                </div>
              ))
            ) : (
              <div className="rounded-3xl border border-dashed border-slate-700 bg-slate-950/60 px-4 py-10 text-center text-sm text-slate-500">
                Nenhum gasto lançado ainda.
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
