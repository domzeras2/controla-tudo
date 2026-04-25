"use client";

import type { FormEvent } from "react";
import { useMemo, useState } from "react";
import { ActionButton } from "@/components/shared/action-button";
import { DarkFormModal } from "@/components/shared/dark-form-modal";
import { DarkTextareaField, DarkTextField } from "@/components/shared/dark-form-field";
import { useAppData } from "@/hooks/use-app-data";
import { formatDate, formatHours } from "@/lib/format";
import { TimeEntry } from "@/lib/types";

const initialForm = {
  project: "",
  hours: "1",
  date: new Date().toISOString().slice(0, 10),
  description: ""
};

export function TimePage() {
  const { data, loading, createTimeEntry, updateTimeEntry, deleteTimeEntry } = useAppData();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editing, setEditing] = useState<TimeEntry | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const totalHours = useMemo(
    () => data.timeEntries.reduce((sum, item) => sum + item.hours, 0),
    [data.timeEntries]
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);

    const payload = {
      project: String(form.get("project") || ""),
      hours: Number(form.get("hours") || 0),
      date: String(form.get("date") || ""),
      description: String(form.get("description") || "")
    };

    try {
      setSubmitting(true);
      setFeedback(null);

      if (editing) {
        await updateTimeEntry(editing.id, payload);
        setFeedback("Registro de tempo atualizado com sucesso.");
      } else {
        await createTimeEntry(payload);
        setFeedback("Registro de tempo criado com sucesso.");
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
    if (!window.confirm("Deseja mesmo excluir este lançamento de tempo?")) return;
    await deleteTimeEntry(id);
    setFeedback("Registro removido com sucesso.");
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[32px] border border-slate-800 bg-[linear-gradient(135deg,rgba(30,41,59,0.9),rgba(15,23,42,0.96))] p-6 shadow-[0_10px_26px_rgba(2,6,23,0.22)]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-blue-400">Produtividade</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-50 sm:text-4xl">
              Controle de tempo
            </h2>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-400 sm:text-base">
              Registre horas por projeto para entender seu esforço real e organizar melhor sua operação.
            </p>
          </div>
          <ActionButton
            onClick={() => {
              setEditing(null);
              setOpen(true);
            }}
          >
            Novo registro
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
          <p className="text-sm font-medium text-blue-300">Horas acumuladas</p>
          <strong className="mt-3 block text-3xl font-semibold text-slate-50">{formatHours(totalHours)}</strong>
          <p className="mt-2 text-sm leading-6 text-slate-500">Total de horas lançadas no sistema.</p>
        </article>
        <article className="rounded-[28px] border border-slate-700 bg-slate-900/84 p-5 shadow-[0_4px_12px_rgba(0,0,0,0.1)]">
          <p className="text-sm font-medium text-slate-400">Projetos com horas</p>
          <strong className="mt-3 block text-3xl font-semibold text-slate-50">
            {new Set(data.timeEntries.map((item) => item.project)).size}
          </strong>
          <p className="mt-2 text-sm leading-6 text-slate-500">Quantidade distinta de projetos lançados.</p>
        </article>
        <article className="rounded-[28px] border border-slate-700 bg-slate-900/84 p-5 shadow-[0_4px_12px_rgba(0,0,0,0.1)]">
          <p className="text-sm font-medium text-slate-400">Uso recomendado</p>
          <p className="mt-3 text-sm leading-6 text-slate-500">
            Registre sessões assim que encerrar cada bloco para manter o histórico confiável.
          </p>
        </article>
      </div>

      <section className="rounded-[28px] border border-slate-700 bg-slate-900/84 p-5 shadow-[0_4px_12px_rgba(0,0,0,0.1)] sm:p-6">
        <div className="mb-5">
          <h3 className="text-lg font-semibold text-slate-50">Histórico de tempo</h3>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            Registros por projeto com ações visíveis e leitura clara.
          </p>
        </div>

        {data.timeEntries.length ? (
          <div className="grid gap-3">
            {data.timeEntries.map((item) => (
              <article
                key={item.id}
                className="rounded-[24px] border border-slate-700 bg-slate-950/66 px-4 py-4 shadow-[0_4px_12px_rgba(0,0,0,0.08)] transition hover:bg-[rgba(255,255,255,0.03)]"
              >
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <p className="font-semibold text-slate-50">{item.project}</p>
                    <p className="mt-1 text-xs text-slate-500">{item.description || "Sem descrição."}</p>
                  </div>
                  <div className="text-left lg:text-right">
                    <p className="text-lg font-semibold text-blue-300">{formatHours(item.hours)}</p>
                    <p className="mt-1 text-xs text-slate-500">{formatDate(item.date)}</p>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap justify-end gap-2 border-t border-slate-700 pt-4">
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
              </article>
            ))}
          </div>
        ) : (
          <div className="rounded-3xl border border-dashed border-slate-700 bg-slate-950/60 px-4 py-10 text-center text-sm text-slate-500">
            {loading ? "Carregando registros..." : "Nenhum registro de tempo ainda."}
          </div>
        )}
      </section>

      <DarkFormModal
        open={open}
        title={editing ? "Editar lançamento de tempo" : "Novo lançamento de tempo"}
        description="Preencha as horas investidas e vincule ao projeto correspondente."
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
            label="Projeto"
            name="project"
            required
            defaultValue={editing?.project ?? initialForm.project}
            placeholder="Nome do projeto"
          />
          <DarkTextField
            label="Horas"
            name="hours"
            type="number"
            required
            defaultValue={editing?.hours ?? initialForm.hours}
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
              label="Descrição"
              name="description"
              defaultValue={editing?.description ?? initialForm.description}
              placeholder="Descreva o que foi feito"
            />
          </div>
        </div>
      </DarkFormModal>
    </div>
  );
}
