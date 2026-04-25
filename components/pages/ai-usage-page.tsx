"use client";

import type { FormEvent } from "react";
import { useMemo, useState } from "react";
import { ActionButton } from "@/components/shared/action-button";
import { DarkFormModal } from "@/components/shared/dark-form-modal";
import { DarkTextareaField, DarkTextField } from "@/components/shared/dark-form-field";
import { useAppData } from "@/hooks/use-app-data";
import {
  formatCurrency,
  formatDate,
  formatDecimalInput,
  formatHours,
  parseDecimalInput
} from "@/lib/format";
import { AiUsageEntry } from "@/lib/types";

const initialForm = {
  tool: "",
  purpose: "",
  time_used: "0.5",
  cost_estimated: "0",
  date: new Date().toISOString().slice(0, 10),
  notes: ""
};

export function AiUsagePage() {
  const { data, loading, createAiUsage, updateAiUsage, deleteAiUsage } = useAppData();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editing, setEditing] = useState<AiUsageEntry | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const totals = useMemo(
    () => ({
      hours: data.aiUsages.reduce((sum, item) => sum + item.time_used, 0),
      cost: data.aiUsages.reduce((sum, item) => sum + item.cost_estimated, 0)
    }),
    [data.aiUsages]
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const parsedCostEstimated = parseDecimalInput(form.get("cost_estimated"));

    const payload = {
      tool: String(form.get("tool") || ""),
      purpose: String(form.get("purpose") || ""),
      time_used: Number(form.get("time_used") || 0),
      cost_estimated: parsedCostEstimated ?? 0,
      date: String(form.get("date") || ""),
      notes: String(form.get("notes") || "")
    };

    if (parsedCostEstimated === null || parsedCostEstimated < 0) {
      setFeedback("Informe um custo válido com até 2 casas decimais.");
      return;
    }

    try {
      setSubmitting(true);
      setFeedback(null);

      if (editing) {
        await updateAiUsage(editing.id, payload);
        setFeedback("Registro de uso de IA atualizado com sucesso.");
      } else {
        await createAiUsage(payload);
        setFeedback("Registro de uso de IA criado com sucesso.");
      }

      setOpen(false);
      setEditing(null);
    } catch (err) {
      setFeedback(err instanceof Error ? err.message : "Não foi possível salvar o registro.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm("Deseja mesmo excluir este registro de uso de IA?")) return;
    await deleteAiUsage(id);
    setFeedback("Registro removido com sucesso.");
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[32px] border border-slate-800 bg-[linear-gradient(135deg,rgba(30,41,59,0.9),rgba(15,23,42,0.96))] p-6 shadow-[0_10px_26px_rgba(2,6,23,0.22)]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-blue-400">Ferramentas</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-50 sm:text-4xl">
              Uso de IA
            </h2>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-400 sm:text-base">
              Acompanhe tempo, custo e finalidade das ferramentas de IA com contraste correto e leitura clara.
            </p>
          </div>
          <ActionButton
            onClick={() => {
              setEditing(null);
              setOpen(true);
            }}
          >
            Novo uso
          </ActionButton>
        </div>
      </section>

      {feedback ? (
        <div className="rounded-3xl border border-slate-700 bg-slate-900/84 px-4 py-3 text-sm text-slate-300 shadow-[0_4px_12px_rgba(0,0,0,0.08)]">
          {feedback}
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-3">
        <article className="rounded-[28px] border border-blue-900/40 bg-slate-900/84 p-5 shadow-[0_4px_12px_rgba(0,0,0,0.1)]">
          <p className="text-sm font-medium text-blue-300">Tempo total</p>
          <strong className="mt-3 block text-3xl font-semibold text-slate-50">{formatHours(totals.hours)}</strong>
          <p className="mt-2 text-sm leading-6 text-slate-500">Tempo somado de uso das ferramentas.</p>
        </article>
        <article className="rounded-[28px] border border-blue-900/40 bg-slate-900/84 p-5 shadow-[0_4px_12px_rgba(0,0,0,0.1)]">
          <p className="text-sm font-medium text-blue-300">Custo estimado</p>
          <strong className="mt-3 block text-3xl font-semibold text-slate-50">{formatCurrency(totals.cost)}</strong>
          <p className="mt-2 text-sm leading-6 text-slate-500">Soma de custo lançado para as ferramentas.</p>
        </article>
        <article className="rounded-[28px] border border-slate-700 bg-slate-900/84 p-5 shadow-[0_4px_12px_rgba(0,0,0,0.1)]">
          <p className="text-sm font-medium text-slate-400">Ferramentas diferentes</p>
          <strong className="mt-3 block text-3xl font-semibold text-slate-50">
            {new Set(data.aiUsages.map((item) => item.tool)).size}
          </strong>
          <p className="mt-2 text-sm leading-6 text-slate-500">Quantidade distinta registrada.</p>
        </article>
      </div>

      <section className="rounded-[28px] border border-slate-700 bg-slate-900/84 p-5 shadow-[0_4px_12px_rgba(0,0,0,0.1)] sm:p-6">
        <div className="mb-5">
          <h3 className="text-lg font-semibold text-slate-50">Histórico de uso de IA</h3>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            Registre ferramenta, finalidade, tempo e custo sem perder contraste.
          </p>
        </div>

        {data.aiUsages.length ? (
          <div className="grid gap-3">
            {data.aiUsages.map((item) => (
              <article
                key={item.id}
                className="rounded-[24px] border border-slate-700 bg-slate-950/66 px-4 py-4 shadow-[0_4px_12px_rgba(0,0,0,0.08)] transition hover:bg-[rgba(255,255,255,0.03)]"
              >
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <p className="font-semibold text-slate-50">{item.tool}</p>
                    <p className="mt-1 text-xs text-slate-500">{item.purpose}</p>
                  </div>
                  <div className="text-left lg:text-right">
                    <p className="text-lg font-semibold text-blue-300">{formatCurrency(item.cost_estimated)}</p>
                    <p className="mt-1 text-xs text-slate-500">{formatDate(item.date)}</p>
                  </div>
                </div>

                <div className="mt-4 flex flex-col gap-3 border-t border-slate-700 pt-4 sm:flex-row sm:items-center sm:justify-between">
                  <span className="inline-flex w-fit rounded-full border border-slate-700 bg-slate-900 px-3 py-1 text-xs font-semibold text-slate-300">
                    {formatHours(item.time_used)}
                  </span>
                  <div className="flex flex-wrap gap-2">
                    <ActionButton
                      variant="secondary"
                      className="border-slate-700 bg-[#172033] text-slate-100 hover:bg-white/[0.03]"
                      onClick={() => {
                        setEditing(item);
                        setOpen(true);
                      }}
                    >
                      Editar
                    </ActionButton>
                    <ActionButton variant="danger" onClick={() => void handleDelete(item.id)}>
                      Excluir
                    </ActionButton>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="rounded-3xl border border-dashed border-slate-700 bg-slate-950/60 px-4 py-10 text-center text-sm text-slate-500">
            {loading ? "Carregando registros..." : "Nenhum uso de IA cadastrado ainda."}
          </div>
        )}
      </section>

      <DarkFormModal
        open={open}
        title={editing ? "Editar uso de IA" : "Novo uso de IA"}
        description="Cadastre a ferramenta utilizada e o contexto para acompanhar esforço e custo."
        onClose={() => {
          setOpen(false);
          setEditing(null);
        }}
        onSubmit={handleSubmit}
        submitLabel={editing ? "Salvar alterações" : "Criar registro"}
        submitting={submitting}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <DarkTextField
            label="Ferramenta"
            name="tool"
            required
            defaultValue={editing?.tool ?? initialForm.tool}
            placeholder="Ex: ChatGPT, Codex, Claude"
          />
          <DarkTextField
            label="Finalidade"
            name="purpose"
            required
            defaultValue={editing?.purpose ?? initialForm.purpose}
            placeholder="Ex: prototipação, análise, código"
          />
          <DarkTextField
            label="Tempo usado"
            name="time_used"
            type="number"
            required
            defaultValue={editing?.time_used ?? initialForm.time_used}
            placeholder="0"
          />
          <DarkTextField
            label="Custo estimado"
            name="cost_estimated"
            type="text"
            required
            defaultValue={editing ? formatDecimalInput(editing.cost_estimated) : initialForm.cost_estimated}
            inputMode="decimal"
            autoComplete="off"
            pattern="^[0-9.,\\s]+$"
            placeholder="0"
          />
          <DarkTextField
            label="Data"
            name="date"
            type="date"
            required
            defaultValue={editing?.date ?? initialForm.date}
          />
          <div className="sm:col-span-2">
            <DarkTextareaField
              label="Observações"
              name="notes"
              defaultValue={editing?.notes ?? initialForm.notes}
              placeholder="Informações complementares sobre o uso"
            />
          </div>
        </div>
      </DarkFormModal>
    </div>
  );
}
