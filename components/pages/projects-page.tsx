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
import {
  formatCurrency,
  formatDate,
  formatDecimalInput,
  parseDecimalInput,
  toTitleCase
} from "@/lib/format";
import {
  Project,
  projectServiceTypes,
  projectStatuses,
  ProjectStatus
} from "@/lib/types";

const initialForm = {
  name: "",
  client: "",
  service_type: "site",
  status: "ideia",
  estimated_value: "0",
  start_date: new Date().toISOString().slice(0, 10),
  delivery_date: "",
  notes: ""
};

function projectStatusTone(status: ProjectStatus) {
  if (status === "finalizado") return "bg-emerald-950 text-emerald-300";
  if (status === "em andamento") return "bg-blue-950 text-blue-300";
  if (status === "aguardando cliente") return "bg-amber-950 text-amber-300";
  if (status === "cancelado") return "bg-rose-950 text-rose-300";
  return "bg-slate-800 text-slate-300";
}

function ProjectStatusBadge({ status }: { status: ProjectStatus }) {
  return (
    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${projectStatusTone(status)}`}>
      {toTitleCase(status)}
    </span>
  );
}

function toProjectInput(project: Project, overrides: Partial<Project> = {}) {
  return {
    name: overrides.name ?? project.name,
    client: overrides.client ?? project.client ?? "",
    service_type: overrides.service_type ?? project.service_type ?? "outro",
    status: overrides.status ?? project.status,
    estimated_value: overrides.estimated_value ?? project.estimated_value,
    start_date: overrides.start_date ?? project.start_date ?? "",
    delivery_date: overrides.delivery_date ?? project.delivery_date ?? "",
    notes: overrides.notes ?? project.notes ?? project.description ?? "",
    description: overrides.description ?? overrides.notes ?? project.notes ?? project.description ?? ""
  };
}

export function ProjectsPage() {
  const { data, loading, createProject, updateProject, deleteProject } = useAppData();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editing, setEditing] = useState<Project | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const summary = useMemo(
    () => ({
      totalValue: data.projects.reduce((sum, item) => sum + item.estimated_value, 0),
      active: data.projects.filter(
        (item) => item.status === "em andamento" || item.status === "aguardando cliente"
      ).length,
      finished: data.projects.filter((item) => item.status === "finalizado").length
    }),
    [data.projects]
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const parsedEstimatedValue = parseDecimalInput(form.get("estimated_value"));

    const payload = {
      name: String(form.get("name") || "").trim(),
      client: String(form.get("client") || "").trim(),
      service_type: String(form.get("service_type") || "outro") as Project["service_type"],
      status: String(form.get("status") || "ideia") as Project["status"],
      estimated_value: parsedEstimatedValue ?? 0,
      start_date: String(form.get("start_date") || ""),
      delivery_date: String(form.get("delivery_date") || ""),
      notes: String(form.get("notes") || "").trim(),
      description: String(form.get("notes") || "").trim()
    };

    if (!payload.name) {
      setFeedback("Informe o nome do serviço/projeto.");
      return;
    }

    if (parsedEstimatedValue === null || parsedEstimatedValue <= 0) {
      setFeedback("Informe um valor válido com até 2 casas decimais.");
      return;
    }

    try {
      setSubmitting(true);
      setFeedback(null);

      if (editing) {
        await updateProject(editing.id, payload);
        setFeedback("Projeto atualizado com sucesso.");
      } else {
        await createProject(payload);
        setFeedback("Projeto criado com sucesso.");
      }

      setOpen(false);
      setEditing(null);
    } catch (err) {
      setFeedback(err instanceof Error ? err.message : "Não foi possível salvar o projeto.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm("Deseja mesmo excluir este projeto?")) return;
    await deleteProject(id);
    setFeedback("Projeto removido com sucesso.");
  }

  async function handleStatusChange(project: Project, status: ProjectStatus) {
    await updateProject(project.id, toProjectInput(project, { status }));
    setFeedback(`Status atualizado para ${status}.`);
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[32px] border border-slate-800 bg-[linear-gradient(135deg,rgba(30,41,59,0.9),rgba(15,23,42,0.96))] p-6 shadow-[0_10px_26px_rgba(2,6,23,0.22)]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-brand-500">
              Serviços
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-50 sm:text-4xl">
              Gestão visual de projetos e entregas
            </h2>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-400 sm:text-base">
              Organize clientes, prazos, valores e status em um painel com cara de app moderno.
            </p>
          </div>
          <ActionButton
            onClick={() => {
              setEditing(null);
              setOpen(true);
            }}
          >
            Novo serviço
          </ActionButton>
        </div>
      </section>

      {feedback ? (
        <div className="rounded-3xl border border-slate-700 bg-slate-900/84 px-4 py-3 text-sm text-slate-300 shadow-[0_4px_12px_rgba(0,0,0,0.08)]">
          {feedback}
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-3">
        <article className="rounded-[28px] border border-slate-700 bg-slate-900/84 p-5 shadow-[0_4px_12px_rgba(0,0,0,0.1)]">
          <p className="text-sm font-medium text-slate-400">Valor total dos serviços</p>
          <strong className="mt-3 block text-3xl font-semibold text-slate-50">{formatCurrency(summary.totalValue)}</strong>
          <p className="mt-2 text-sm leading-6 text-slate-500">Somatório de valor dos serviços cadastrados.</p>
        </article>
        <article className="rounded-[28px] border border-blue-900/40 bg-slate-900/84 p-5 shadow-[0_4px_12px_rgba(0,0,0,0.1)]">
          <p className="text-sm font-medium text-blue-300">Serviços ativos</p>
          <strong className="mt-3 block text-3xl font-semibold text-slate-50">{summary.active}</strong>
          <p className="mt-2 text-sm leading-6 text-slate-500">Em andamento ou aguardando cliente.</p>
        </article>
        <article className="rounded-[28px] border border-emerald-900/40 bg-slate-900/84 p-5 shadow-[0_4px_12px_rgba(0,0,0,0.1)]">
          <p className="text-sm font-medium text-emerald-300">Serviços finalizados</p>
          <strong className="mt-3 block text-3xl font-semibold text-slate-50">{summary.finished}</strong>
          <p className="mt-2 text-sm leading-6 text-slate-500">Projetos concluídos no sistema.</p>
        </article>
      </div>

      <section className="rounded-[28px] border border-slate-700 bg-slate-900/84 p-5 shadow-[0_4px_12px_rgba(0,0,0,0.1)] sm:p-6">
        <div className="mb-5">
          <h3 className="text-lg font-semibold text-slate-50">Lista de serviços</h3>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            Ações visíveis para editar, excluir e alterar o status de cada projeto.
          </p>
        </div>
        {data.projects.length ? (
          <div className="grid gap-4">
            {data.projects.map((project) => (
              <article
                key={project.id}
                className="rounded-[24px] border border-slate-700 bg-slate-950/66 p-4 shadow-[0_4px_12px_rgba(0,0,0,0.08)] sm:p-5"
              >
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <p className="font-semibold text-slate-50">{project.name}</p>
                      <p className="mt-1 text-xs text-slate-500">
                        {project.client || "Cliente não informado"}
                      </p>
                    </div>
                    <ProjectStatusBadge status={project.status} />
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
                    <div className="rounded-2xl border border-slate-700 bg-slate-900/72 px-4 py-3">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                        Tipo de serviço
                      </p>
                      <p className="mt-2 text-sm font-medium text-slate-200">
                        {toTitleCase(project.service_type || "outro")}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-slate-700 bg-slate-900/72 px-4 py-3">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                        Valor
                      </p>
                      <p className="mt-2 text-sm font-semibold text-slate-50">
                        {formatCurrency(project.estimated_value)}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-slate-700 bg-slate-900/72 px-4 py-3">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                        Início
                      </p>
                      <p className="mt-2 text-sm font-medium text-slate-200">
                        {project.start_date ? formatDate(project.start_date) : "-"}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-slate-700 bg-slate-900/72 px-4 py-3">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                        Entrega
                      </p>
                      <p className="mt-2 text-sm font-medium text-slate-200">
                        {project.delivery_date ? formatDate(project.delivery_date) : "-"}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-slate-700 bg-slate-900/72 px-4 py-3">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                        Observações
                      </p>
                      <p className="mt-2 text-sm text-slate-300">
                        {project.notes || project.description || "Sem observações."}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 border-t border-slate-700 pt-4 lg:flex-row lg:items-center lg:justify-between">
                    <label className="grid gap-2 lg:min-w-[240px]">
                      <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                        Alterar status
                      </span>
                      <select
                        value={project.status}
                        onChange={(event) =>
                          void handleStatusChange(project, event.target.value as ProjectStatus)
                        }
                        className="min-h-11 rounded-2xl border border-slate-700 bg-slate-900 px-4 text-sm text-slate-100 outline-none transition focus:border-brand-500"
                      >
                        {projectStatuses.map((status) => (
                          <option key={status} value={status}>
                            {toTitleCase(status)}
                          </option>
                        ))}
                      </select>
                    </label>

                    <div className="flex flex-wrap gap-2">
                      <ActionButton
                        variant="secondary"
                        className="border-slate-700 bg-[#172033] text-slate-100 hover:bg-white/[0.03]"
                        onClick={() => {
                          setEditing(project);
                          setOpen(true);
                        }}
                      >
                        Editar
                      </ActionButton>
                      <ActionButton variant="danger" onClick={() => void handleDelete(project.id)}>
                        Excluir
                      </ActionButton>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="rounded-3xl border border-dashed border-slate-700 bg-slate-950/60 px-4 py-10 text-center text-sm text-slate-500">
            {loading ? "Carregando projetos..." : "Nenhum projeto cadastrado ainda."}
          </div>
        )}
      </section>

      <DarkFormModal
        open={open}
        title={editing ? "Editar serviço" : "Novo serviço"}
        description="Cadastre o serviço com cliente, tipo, status, valor e prazos para acompanhar a operação."
        onClose={() => {
          setOpen(false);
          setEditing(null);
        }}
        onSubmit={handleSubmit}
        submitLabel={editing ? "Salvar alterações" : "Criar serviço"}
        submitting={submitting}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <DarkTextField
            label="Nome"
            name="name"
            required
            defaultValue={editing?.name ?? initialForm.name}
            placeholder="Ex: Landing page da clínica"
          />
          <DarkTextField
            label="Cliente"
            name="client"
            defaultValue={editing?.client ?? initialForm.client}
            placeholder="Nome do cliente"
          />
          <DarkSelectField
            label="Tipo de serviço"
            name="service_type"
            required
            defaultValue={editing?.service_type ?? initialForm.service_type}
            options={projectServiceTypes.map((type) => ({
              value: type,
              label: toTitleCase(type)
            }))}
          />
          <DarkSelectField
            label="Status"
            name="status"
            required
            defaultValue={editing?.status ?? initialForm.status}
            options={projectStatuses.map((status) => ({
              value: status,
              label: toTitleCase(status)
            }))}
          />
          <DarkTextField
            label="Valor"
            name="estimated_value"
            type="text"
            required
            defaultValue={editing ? formatDecimalInput(editing.estimated_value) : initialForm.estimated_value}
            inputMode="decimal"
            autoComplete="off"
            pattern="^[0-9.,\\s]+$"
            placeholder="0,00"
          />
          <DarkTextField
            label="Data de início"
            name="start_date"
            type="date"
            defaultValue={editing?.start_date ?? initialForm.start_date}
          />
          <DarkTextField
            label="Data de entrega"
            name="delivery_date"
            type="date"
            defaultValue={editing?.delivery_date ?? initialForm.delivery_date}
          />
          <div className="sm:col-span-2">
            <DarkTextareaField
              label="Observações"
              name="notes"
              defaultValue={editing?.notes ?? editing?.description ?? initialForm.notes}
              placeholder="Escopo, observações e alinhamentos do serviço"
            />
          </div>
        </div>
      </DarkFormModal>
    </div>
  );
}
