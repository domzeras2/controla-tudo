"use client";

import type { FormEvent } from "react";
import { useMemo, useState } from "react";
import { ActionButton } from "@/components/shared/action-button";
import { DarkFormModal } from "@/components/shared/dark-form-modal";
import {
  DarkSelectField,
  DarkTextareaField,
  DarkTextField
} from "@/components/shared/dark-form-field";
import { useAppData } from "@/hooks/use-app-data";
import { formatCurrency, formatDate, formatDecimalInput, parseDecimalInput } from "@/lib/format";
import { expenseCategories, Expense } from "@/lib/types";

const initialForm = {
  title: "",
  value: "0",
  category: "IA",
  date: new Date().toISOString().slice(0, 10),
  notes: ""
};

export function ExpensesPage() {
  const { data, loading, createExpense, updateExpense, deleteExpense } = useAppData();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editing, setEditing] = useState<Expense | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const total = useMemo(
    () => data.expenses.reduce((sum, item) => sum + item.value, 0),
    [data.expenses]
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const parsedValue = parseDecimalInput(form.get("value"));

    const payload = {
      title: String(form.get("title") || ""),
      value: parsedValue ?? 0,
      category: String(form.get("category") || "Outros") as Expense["category"],
      date: String(form.get("date") || ""),
      notes: String(form.get("notes") || "")
    };

    if (parsedValue === null || parsedValue <= 0) {
      setFeedback("Informe um valor válido com até 2 casas decimais.");
      return;
    }

    try {
      setSubmitting(true);
      setFeedback(null);

      if (editing) {
        await updateExpense(editing.id, payload);
        setFeedback("Gasto atualizado com sucesso.");
      } else {
        await createExpense(payload);
        setFeedback("Gasto criado com sucesso.");
      }

      setOpen(false);
      setEditing(null);
    } catch (err) {
      setFeedback(err instanceof Error ? err.message : "Não foi possível salvar o gasto.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm("Deseja mesmo excluir este gasto?")) return;
    await deleteExpense(id);
    setFeedback("Gasto removido com sucesso.");
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[32px] border border-slate-800 bg-[linear-gradient(135deg,rgba(30,41,59,0.9),rgba(15,23,42,0.96))] p-6 shadow-[0_10px_26px_rgba(2,6,23,0.22)]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-rose-400">Financeiro</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-50 sm:text-4xl">
              Controle de gastos
            </h2>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-400 sm:text-base">
              Cadastre despesas da operação e mantenha uma visão clara do que está saindo do caixa.
            </p>
          </div>
          <ActionButton
            onClick={() => {
              setEditing(null);
              setOpen(true);
            }}
          >
            Novo gasto
          </ActionButton>
        </div>
      </section>

      {feedback ? (
        <div className="rounded-3xl border border-slate-700 bg-slate-900/84 px-4 py-3 text-sm text-slate-300 shadow-[0_4px_12px_rgba(0,0,0,0.08)]">
          {feedback}
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-3">
        <article className="rounded-[28px] border border-rose-900/40 bg-slate-900/84 p-5 shadow-[0_4px_12px_rgba(0,0,0,0.1)]">
          <p className="text-sm font-medium text-rose-300">Total registrado</p>
          <strong className="mt-3 block text-3xl font-semibold text-slate-50">{formatCurrency(total)}</strong>
          <p className="mt-2 text-sm leading-6 text-slate-500">Soma de todos os gastos lançados.</p>
        </article>
        <article className="rounded-[28px] border border-slate-700 bg-slate-900/84 p-5 shadow-[0_4px_12px_rgba(0,0,0,0.1)]">
          <p className="text-sm font-medium text-slate-400">Categorias disponíveis</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {expenseCategories.map((category) => (
              <span
                key={category}
                className="rounded-full border border-slate-700 bg-slate-950/70 px-3 py-1 text-sm font-medium text-slate-300"
              >
                {category}
              </span>
            ))}
          </div>
        </article>
        <article className="rounded-[28px] border border-slate-700 bg-slate-900/84 p-5 shadow-[0_4px_12px_rgba(0,0,0,0.1)]">
          <p className="text-sm font-medium text-slate-400">Modo de uso</p>
          <p className="mt-3 text-sm leading-6 text-slate-500">
            Registre cada despesa assim que ela acontecer para manter o dashboard confiável.
          </p>
        </article>
      </div>

      <section className="rounded-[28px] border border-slate-700 bg-slate-900/84 p-5 shadow-[0_4px_12px_rgba(0,0,0,0.1)] sm:p-6">
        <div className="mb-5">
          <h3 className="text-lg font-semibold text-slate-50">Lista de gastos</h3>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            Histórico de despesas com ações visíveis e leitura rápida.
          </p>
        </div>

        {data.expenses.length ? (
          <div className="grid gap-3">
            {data.expenses.map((item) => (
              <article
                key={item.id}
                className="rounded-[24px] border border-slate-700 bg-slate-950/66 px-4 py-4 shadow-[0_4px_12px_rgba(0,0,0,0.08)] transition hover:bg-[rgba(255,255,255,0.03)]"
              >
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <p className="font-semibold text-slate-50">{item.title}</p>
                    <p className="mt-1 text-xs text-slate-500">{item.notes || "Sem observações."}</p>
                  </div>
                  <div className="text-left lg:text-right">
                    <p className="text-lg font-semibold text-rose-400">{formatCurrency(item.value)}</p>
                    <p className="mt-1 text-xs text-slate-500">{formatDate(item.date)}</p>
                  </div>
                </div>

                <div className="mt-4 flex flex-col gap-3 border-t border-slate-700 pt-4 sm:flex-row sm:items-center sm:justify-between">
                  <span className="inline-flex w-fit rounded-full border border-slate-700 bg-slate-900 px-3 py-1 text-xs font-semibold text-slate-300">
                    {item.category}
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
            {loading ? "Carregando gastos..." : "Nenhum gasto cadastrado ainda."}
          </div>
        )}
      </section>

      <DarkFormModal
        open={open}
        title={editing ? "Editar gasto" : "Novo gasto"}
        description="Preencha os campos abaixo para salvar o lançamento."
        onClose={() => {
          setOpen(false);
          setEditing(null);
        }}
        onSubmit={handleSubmit}
        submitLabel={editing ? "Salvar alterações" : "Criar gasto"}
        submitting={submitting}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <DarkTextField
            label="Título"
            name="title"
            required
            defaultValue={editing?.title ?? initialForm.title}
            placeholder="Ex: Assinatura de IA"
          />
          <DarkTextField
            label="Valor"
            name="value"
            type="text"
            required
            defaultValue={editing ? formatDecimalInput(editing.value) : initialForm.value}
            inputMode="decimal"
            autoComplete="off"
            pattern="^[0-9.,\\s]+$"
            placeholder="0,00"
          />
          <DarkSelectField
            label="Categoria"
            name="category"
            required
            defaultValue={editing?.category ?? initialForm.category}
            options={expenseCategories.map((category) => ({ value: category, label: category }))}
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
              placeholder="Informações adicionais sobre o gasto"
            />
          </div>
        </div>
      </DarkFormModal>
    </div>
  );
}
