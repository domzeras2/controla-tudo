"use client";

import type { FormEvent } from "react";
import { useMemo, useState } from "react";
import { ActionButton } from "@/components/shared/action-button";
import { FormModal } from "@/components/shared/form-modal";
import { HomeFinanceCalendar } from "@/components/pages/home-finance-calendar";
import { CheckboxField, SelectField, TextareaField, TextField } from "@/components/shared/form-field";
import { PageHeader } from "@/components/shared/page-header";
import { ResponsiveTable } from "@/components/shared/responsive-table";
import { SectionCard } from "@/components/shared/section-card";
import { StatCard } from "@/components/shared/stat-card";
import {
  buildHomeFinanceMetrics,
  buildHomePayables,
  resolvePaymentStatus
} from "@/lib/dashboard";
import { useAppData } from "@/hooks/use-app-data";
import {
  formatDecimalInput,
  formatCurrency,
  formatDate,
  formatMonthReference,
  formatMonthYearLabel,
  parseDecimalInput,
  toTitleCase
} from "@/lib/format";
import {
  homeAccountCategories,
  homeAccountStatuses,
  homeAccountTypes,
  homeRevenueFrequencies,
  HomeAccount,
  HomePaymentStatus,
  HomeRevenue
} from "@/lib/types";

const initialRevenueForm = {
  name: "",
  value: "0",
  received_date: new Date().toISOString().slice(0, 10),
  recurring: false,
  frequency: "mensal",
  notes: ""
};

const initialAccountForm = {
  name: "",
  category: "Outros",
  total_value: "0",
  type: "fixa",
  start_date: new Date().toISOString().slice(0, 10),
  due_day: String(new Date().getDate()),
  installment_count: "2",
  status: "ativa",
  notes: ""
};

type AccountRow = {
  id: string;
  account: HomeAccount;
  currentItem?: ReturnType<typeof buildHomePayables>[number];
};

function statusTone(status: HomePaymentStatus) {
  if (status === "pago") return "border border-emerald-900/40 bg-emerald-950/60 text-emerald-300";
  if (status === "atrasado") return "border border-rose-900/40 bg-rose-950/60 text-rose-300";
  return "border border-amber-900/40 bg-amber-950/60 text-amber-300";
}

function PaymentStatusBadge({ status }: { status: HomePaymentStatus }) {
  return (
    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusTone(status)}`}>
      {toTitleCase(status)}
    </span>
  );
}

function normalizeMonth(value: Date) {
  return new Date(value.getFullYear(), value.getMonth(), 1);
}

function addMonth(value: Date, amount: number) {
  return new Date(value.getFullYear(), value.getMonth() + amount, 1);
}

export function HomeFinancesPage() {
  const {
    data,
    loading,
    createHomeRevenue,
    updateHomeRevenue,
    deleteHomeRevenue,
    createHomeAccount,
    updateHomeAccount,
    deleteHomeAccount,
    updateHomeInstallmentStatus,
    updateHomeAccountOccurrenceStatus
  } = useAppData();

  const [feedback, setFeedback] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState(() => normalizeMonth(new Date()));
  const [statusFilter, setStatusFilter] = useState("todos");
  const [typeFilter, setTypeFilter] = useState("todos");
  const [categoryFilter, setCategoryFilter] = useState("todas");
  const [search, setSearch] = useState("");

  const [revenueOpen, setRevenueOpen] = useState(false);
  const [revenueSubmitting, setRevenueSubmitting] = useState(false);
  const [editingRevenue, setEditingRevenue] = useState<HomeRevenue | null>(null);

  const [accountOpen, setAccountOpen] = useState(false);
  const [accountSubmitting, setAccountSubmitting] = useState(false);
  const [editingAccount, setEditingAccount] = useState<HomeAccount | null>(null);
  const [accountType, setAccountType] = useState<HomeAccount["type"]>("fixa");
  const [expandedAccountId, setExpandedAccountId] = useState<string | null>(null);

  const selectedReferenceMonth = `${selectedMonth.getFullYear()}-${String(selectedMonth.getMonth() + 1).padStart(2, "0")}`;
  const homeMetrics = useMemo(
    () => buildHomeFinanceMetrics(data, selectedMonth),
    [data, selectedMonth]
  );

  const monthPayables = useMemo(
    () =>
      buildHomePayables(
        data.homeAccounts,
        data.homeAccountOccurrences,
        data.homeInstallments,
        selectedMonth
      ).filter((item) => item.referenceMonth === selectedReferenceMonth),
    [data.homeAccounts, data.homeAccountOccurrences, data.homeInstallments, selectedMonth, selectedReferenceMonth]
  );

  const accountRows = useMemo(() => {
    const baseRows = data.homeAccounts
      .map<AccountRow | null>((account) => {
        const related = monthPayables.filter((item) => item.accountId === account.id);
        if (!related.length) return null;

        const currentItem =
          account.type === "parcelada"
            ? related.find((item) => item.status !== "pago") ?? related[0]
            : related[0];

        return { id: account.id, account, currentItem };
      })
      .filter(Boolean) as AccountRow[];

    return baseRows.filter(({ account, currentItem }) => {
      const matchesStatus =
        statusFilter === "todos" ? true : currentItem?.status === statusFilter;
      const matchesType = typeFilter === "todos" ? true : account.type === typeFilter;
      const matchesCategory =
        categoryFilter === "todas" ? true : account.category === categoryFilter;
      const searchValue = search.trim().toLowerCase();
      const matchesSearch = searchValue ? account.name.toLowerCase().includes(searchValue) : true;

      return matchesStatus && matchesType && matchesCategory && matchesSearch;
    });
  }, [categoryFilter, data.homeAccounts, monthPayables, search, statusFilter, typeFilter]);

  const expandedInstallments = useMemo(
    () =>
      data.homeInstallments
        .filter(
          (item) =>
            item.account_id === expandedAccountId && item.reference_month === selectedReferenceMonth
        )
        .map((item): typeof item => ({
          ...item,
          status: resolvePaymentStatus(item.status, item.due_date)
        })),
    [data.homeInstallments, expandedAccountId, selectedReferenceMonth]
  );

  const cards = useMemo(
    () => [
      {
        label: "Receita total do mês",
        value: formatCurrency(homeMetrics.totalHomeRevenueMonth),
        helper: `Receitas consideradas em ${formatMonthYearLabel(selectedMonth)}.`,
        tone: "blue" as const
      },
      {
        label: "Despesa total do mês",
        value: formatCurrency(homeMetrics.totalHomeExpenseMonth),
        helper: "Soma de contas fixas, avulsas e parcelas do mês selecionado.",
        tone: "default" as const
      },
      {
        label: "Saldo previsto",
        value: formatCurrency(homeMetrics.totalHomeBalanceForecast),
        helper:
          homeMetrics.totalHomeBalanceForecast >= 0
            ? "O mês fecha positivo com os dados atuais."
            : "Atenção: o mês fecha negativo com os dados atuais.",
        tone: homeMetrics.totalHomeBalanceForecast >= 0 ? ("green" as const) : ("amber" as const)
      },
      {
        label: "Total já pago no mês",
        value: formatCurrency(homeMetrics.totalHomePaidMonth),
        helper: "Itens pagos dentro do mês selecionado.",
        tone: "green" as const
      },
      {
        label: "Total ainda pendente",
        value: formatCurrency(homeMetrics.totalHomePendingMonth),
        helper: "Itens pendentes e atrasados do mês selecionado.",
        tone: "amber" as const
      },
      {
        label: "Saldo realizado até agora",
        value: formatCurrency(homeMetrics.totalHomeBalanceRealized),
        helper: "Receitas recebidas até hoje menos despesas pagas até hoje.",
        tone: homeMetrics.totalHomeBalanceRealized >= 0 ? ("blue" as const) : ("amber" as const)
      },
      {
        label: "Total a pagar no mês",
        value: formatCurrency(homeMetrics.totalHomePayMonth),
        helper: "Somente itens em aberto do mês selecionado.",
        tone: "amber" as const
      },
      {
        label: "Total a pagar na semana",
        value: formatCurrency(homeMetrics.totalHomePayWeek),
        helper: "Somente itens pendentes nos próximos 7 dias.",
        tone: "green" as const
      },
      {
        label: "Próximos vencimentos",
        value: `${homeMetrics.upcomingHomeDueEntries.length} itens`,
        helper: "Itens não pagos, priorizando o contexto do mês selecionado.",
        tone: "default" as const
      }
    ],
    [homeMetrics, selectedMonth]
  );

  const summaryTone =
    homeMetrics.totalHomeBalanceForecast >= 0
      ? "border-emerald-900/40 bg-emerald-950/20 text-emerald-100"
      : "border-rose-900/40 bg-rose-950/20 text-rose-100";

  async function handleRevenueSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const recurring = form.get("recurring") === "on";
    const parsedValue = parseDecimalInput(form.get("value"));

    const payload = {
      name: String(form.get("name") || "").trim(),
      value: parsedValue ?? 0,
      received_date: String(form.get("received_date") || ""),
      recurring,
      frequency: String(form.get("frequency") || "mensal") as HomeRevenue["frequency"],
      notes: String(form.get("notes") || "").trim()
    };

    if (!payload.name) {
      setFeedback("Informe o nome da receita.");
      return;
    }

    if (parsedValue === null || payload.value <= 0) {
      setFeedback("Informe um valor válido com até 2 casas decimais.");
      return;
    }

    try {
      setRevenueSubmitting(true);
      setFeedback(null);

      if (editingRevenue) {
        await updateHomeRevenue(editingRevenue.id, payload);
        setFeedback("Receita atualizada com sucesso.");
      } else {
        await createHomeRevenue(payload);
        setFeedback("Receita adicionada com sucesso.");
      }

      setRevenueOpen(false);
      setEditingRevenue(null);
    } catch (err) {
      setFeedback(err instanceof Error ? err.message : "Não foi possível salvar a receita.");
    } finally {
      setRevenueSubmitting(false);
    }
  }

  async function handleAccountSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const type = String(form.get("type") || "fixa") as HomeAccount["type"];
    const installmentCount =
      type === "parcelada" ? Number(form.get("installment_count") || 0) : 1;
    const parsedTotalValue = parseDecimalInput(form.get("total_value"));

    const payload = {
      name: String(form.get("name") || "").trim(),
      category: String(form.get("category") || "Outros") as HomeAccount["category"],
      total_value: parsedTotalValue ?? 0,
      type,
      start_date: String(form.get("start_date") || ""),
      due_day: Number(form.get("due_day") || 1),
      installment_count: installmentCount,
      recurring: type === "fixa",
      status: String(form.get("status") || "ativa") as HomeAccount["status"],
      notes: String(form.get("notes") || "").trim()
    };

    if (!payload.name) {
      setFeedback("Informe o nome da conta.");
      return;
    }

    if (parsedTotalValue === null || payload.total_value <= 0) {
      setFeedback("Informe um valor total válido com até 2 casas decimais.");
      return;
    }

    if (payload.due_day < 1 || payload.due_day > 31) {
      setFeedback("Informe um dia de vencimento entre 1 e 31.");
      return;
    }

    if (type === "parcelada" && installmentCount < 2) {
      setFeedback("Contas parceladas precisam ter pelo menos 2 parcelas.");
      return;
    }

    try {
      setAccountSubmitting(true);
      setFeedback(null);

      if (editingAccount) {
        await updateHomeAccount(editingAccount.id, payload);
        setFeedback("Conta atualizada com sucesso.");
      } else {
        await createHomeAccount(payload);
        setFeedback("Conta adicionada com sucesso.");
      }

      setAccountOpen(false);
      setEditingAccount(null);
      setAccountType("fixa");
    } catch (err) {
      setFeedback(err instanceof Error ? err.message : "Não foi possível salvar a conta.");
    } finally {
      setAccountSubmitting(false);
    }
  }

  async function handleDeleteRevenue(id: string) {
    if (!window.confirm("Deseja mesmo excluir esta receita?")) return;
    await deleteHomeRevenue(id);
    setFeedback("Receita removida com sucesso.");
  }

  async function handleDeleteAccount(id: string) {
    if (!window.confirm("Deseja mesmo excluir esta conta?")) return;
    await deleteHomeAccount(id);
    if (expandedAccountId === id) setExpandedAccountId(null);
    setFeedback("Conta removida com sucesso.");
  }

  async function handleOccurrenceStatusToggle(id: string, currentStatus: HomePaymentStatus) {
    const nextStatus = currentStatus === "pago" ? "pendente" : "pago";
    await updateHomeAccountOccurrenceStatus(id, nextStatus);
    setFeedback(`Conta marcada como ${nextStatus}.`);
  }

  async function handleInstallmentStatusToggle(id: string, currentStatus: HomePaymentStatus) {
    const nextStatus = currentStatus === "pago" ? "pendente" : "pago";
    await updateHomeInstallmentStatus(id, nextStatus);
    setFeedback(`Parcela marcada como ${nextStatus}.`);
  }

  async function handleCalendarItemToggle(item: ReturnType<typeof buildHomePayables>[number]) {
    if (item.source === "installment") {
      await handleInstallmentStatusToggle(item.id, item.status);
      return;
    }

    await handleOccurrenceStatusToggle(item.id, item.status);
  }

  function clearFilters() {
    setStatusFilter("todos");
    setTypeFilter("todos");
    setCategoryFilter("todas");
    setSearch("");
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Novo módulo"
        title="Finanças da Casa"
        description="Organize a renda da casa, acompanhe contas e tenha uma visão clara do que precisa ser pago por semana e por mês."
      />

      {feedback ? (
        <div className="rounded-3xl border border-slate-700 bg-slate-900/84 px-4 py-3 text-sm text-slate-300 shadow-[0_4px_12px_rgba(0,0,0,0.08)]">
          {feedback}
        </div>
      ) : null}

      <div className="flex flex-col gap-3 rounded-[28px] border border-slate-700 bg-slate-900/84 p-5 shadow-[0_4px_12px_rgba(0,0,0,0.1)] sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-50">Mês em foco</p>
          <p className="mt-1 text-sm text-slate-400">
            Navegue entre os meses para visualizar receitas, contas e parcelas do período.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <ActionButton variant="secondary" onClick={() => setSelectedMonth((value) => addMonth(value, -1))}>
            Mês anterior
          </ActionButton>
          <div className="rounded-2xl border border-slate-700 bg-[#172033] px-4 py-2 text-sm font-semibold text-slate-100">
            {formatMonthYearLabel(selectedMonth)}
          </div>
          <ActionButton variant="secondary" onClick={() => setSelectedMonth(normalizeMonth(new Date()))}>
            Mês atual
          </ActionButton>
          <ActionButton variant="secondary" onClick={() => setSelectedMonth((value) => addMonth(value, 1))}>
            Próximo mês
          </ActionButton>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {cards.map((card) => (
          <StatCard
            key={card.label}
            label={card.label}
            value={card.value}
            helper={card.helper}
            tone={card.tone}
          />
        ))}
      </div>

      <div className={`rounded-[28px] border px-5 py-4 shadow-[0_4px_12px_rgba(0,0,0,0.1)] ${summaryTone}`}>
        <p className="text-sm font-semibold">Resumo do mês</p>
        <p className="mt-2 text-sm leading-6">
          Neste mês entram {formatCurrency(homeMetrics.totalHomeRevenueMonth)} e saem{" "}
          {formatCurrency(homeMetrics.totalHomeExpenseMonth)}. O saldo previsto é de{" "}
          <span className="font-semibold">{formatCurrency(homeMetrics.totalHomeBalanceForecast)}</span>.
        </p>
        <p className="mt-2 text-sm leading-6 opacity-90">
          Até agora, foram pagos {formatCurrency(homeMetrics.totalHomePaidMonth)} e ainda restam{" "}
          {formatCurrency(homeMetrics.totalHomePendingMonth)} em aberto.
        </p>
      </div>

      <HomeFinanceCalendar
        month={selectedMonth}
        items={monthPayables}
        onToggleStatus={handleCalendarItemToggle}
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.08fr)_minmax(0,1.12fr)]">
        <SectionCard
          title="Receitas"
          description="Cadastre salários, extras e demais entradas para ter uma visão real da receita da casa."
        >
          <div className="space-y-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-50">Entradas cadastradas</p>
                <p className="mt-1 text-sm leading-6 text-slate-400">
                  Receitas recorrentes mensais entram automaticamente no total do mês.
                </p>
              </div>
              <ActionButton
                onClick={() => {
                  setEditingRevenue(null);
                  setRevenueOpen(true);
                }}
              >
                Adicionar receita
              </ActionButton>
            </div>

            <ResponsiveTable
              items={data.homeRevenues}
              emptyMessage={loading ? "Carregando receitas..." : "Nenhuma receita cadastrada ainda."}
              columns={[
                {
                  key: "nome",
                  header: "Nome",
                  render: (item) => (
                    <div>
                      <p className="font-semibold text-slate-50">{item.name}</p>
                      <p className="mt-1 text-xs text-slate-400">{item.notes || "Sem observações."}</p>
                    </div>
                  )
                },
                {
                  key: "valor",
                  header: "Valor",
                  render: (item) => (
                    <span className="font-semibold text-slate-50">{formatCurrency(item.value)}</span>
                  )
                },
                {
                  key: "data",
                  header: "Data",
                  render: (item) => formatDate(item.received_date)
                },
                {
                  key: "recorrente",
                  header: "Recorrente",
                  render: (item) => (
                    <div>
                      <span className="font-medium text-slate-200">{item.recurring ? "Sim" : "Não"}</span>
                      <p className="mt-1 text-xs text-slate-400">{toTitleCase(item.frequency)}</p>
                    </div>
                  )
                },
                {
                  key: "acoes",
                  header: "Ações",
                  className: "min-w-[220px]",
                  render: (item) => (
                    <div className="flex flex-wrap gap-2">
                      <ActionButton
                        variant="secondary"
                        onClick={() => {
                          setEditingRevenue(item);
                          setRevenueOpen(true);
                        }}
                      >
                        Editar
                      </ActionButton>
                      <ActionButton variant="danger" onClick={() => void handleDeleteRevenue(item.id)}>
                        Excluir
                      </ActionButton>
                    </div>
                  )
                }
              ]}
            />
          </div>
        </SectionCard>

        <SectionCard
          title="Contas e Parcelas"
          description="Controle contas fixas, despesas avulsas e compras parceladas com filtros práticos por mês, status e categoria."
        >
          <div className="space-y-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-50">Contas cadastradas</p>
                <p className="mt-1 text-sm leading-6 text-slate-400">
                  A lista abaixo considera o mês selecionado e todos os filtros ativos.
                </p>
              </div>
              <ActionButton
                onClick={() => {
                  setEditingAccount(null);
                  setAccountType("fixa");
                  setAccountOpen(true);
                }}
              >
                Adicionar conta
              </ActionButton>
            </div>

            <div className="rounded-[24px] border border-slate-700 bg-[#172033] p-4 sm:p-5">
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <label className="grid gap-2">
                  <span className="text-sm font-medium text-slate-200">Status</span>
                  <select
                    value={statusFilter}
                    onChange={(event) => setStatusFilter(event.target.value)}
                    className="min-h-12 rounded-2xl border border-slate-700 bg-slate-900 px-4 text-slate-100 outline-none transition focus:border-brand-500"
                  >
                    <option value="todos">Todos</option>
                    <option value="pendente">Pendente</option>
                    <option value="pago">Pago</option>
                    <option value="atrasado">Atrasado</option>
                  </select>
                </label>

                <label className="grid gap-2">
                  <span className="text-sm font-medium text-slate-200">Tipo</span>
                  <select
                    value={typeFilter}
                    onChange={(event) => setTypeFilter(event.target.value)}
                    className="min-h-12 rounded-2xl border border-slate-700 bg-slate-900 px-4 text-slate-100 outline-none transition focus:border-brand-500"
                  >
                    <option value="todos">Todos</option>
                    {homeAccountTypes.map((type) => (
                      <option key={type} value={type}>
                        {toTitleCase(type)}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="grid gap-2">
                  <span className="text-sm font-medium text-slate-200">Categoria</span>
                  <select
                    value={categoryFilter}
                    onChange={(event) => setCategoryFilter(event.target.value)}
                    className="min-h-12 rounded-2xl border border-slate-700 bg-slate-900 px-4 text-slate-100 outline-none transition focus:border-brand-500"
                  >
                    <option value="todas">Todas</option>
                    {homeAccountCategories.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="grid gap-2">
                  <span className="text-sm font-medium text-slate-200">Busca por nome</span>
                  <input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Buscar conta..."
                    className="min-h-12 rounded-2xl border border-slate-700 bg-slate-900 px-4 text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-brand-500"
                  />
                </label>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-2">
                <ActionButton variant="secondary" onClick={clearFilters}>
                  Limpar filtros
                </ActionButton>
                <span className="text-sm text-slate-400">
                  {accountRows.length} item(ns) encontrado(s) em {formatMonthYearLabel(selectedMonth)}.
                </span>
              </div>
            </div>

            {accountRows.length ? (
              <div className="grid gap-4">
                {accountRows.map(({ account, currentItem }) => (
                  <article
                    key={account.id}
                    className="rounded-[24px] border border-slate-700 bg-[#172033] p-4 shadow-[0_4px_12px_rgba(0,0,0,0.08)] sm:p-5"
                  >
                    <div className="flex flex-col gap-4">
                      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                        <div>
                          <p className="font-semibold text-slate-50">{account.name}</p>
                          <p className="mt-1 text-xs text-slate-400">
                            {account.notes || "Sem observações."}
                          </p>
                        </div>
                        <div>
                          {currentItem ? <PaymentStatusBadge status={currentItem.status} /> : <span>-</span>}
                        </div>
                      </div>

                      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                        <div className="rounded-2xl border border-slate-700 bg-slate-900/72 px-4 py-3">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                            Categoria
                          </p>
                          <p className="mt-2 text-sm font-medium text-slate-200">{account.category}</p>
                        </div>
                        <div className="rounded-2xl border border-slate-700 bg-slate-900/72 px-4 py-3">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                            Tipo
                          </p>
                          <p className="mt-2 text-sm font-medium text-slate-200">
                            {toTitleCase(account.type)}
                          </p>
                          {account.type === "parcelada" ? (
                            <p className="mt-1 text-xs text-slate-400">
                              {account.installment_count} parcela(s)
                            </p>
                          ) : null}
                        </div>
                        <div className="rounded-2xl border border-slate-700 bg-slate-900/72 px-4 py-3">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                            Valor
                          </p>
                          <p className="mt-2 text-sm font-semibold text-slate-50">
                            {formatCurrency(currentItem?.amount ?? account.total_value)}
                          </p>
                          {account.type === "parcelada" ? (
                            <p className="mt-1 text-xs text-slate-400">
                              Valor total {formatCurrency(account.total_value)}
                            </p>
                          ) : null}
                        </div>
                        <div className="rounded-2xl border border-slate-700 bg-slate-900/72 px-4 py-3">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                            Vencimento
                          </p>
                          <p className="mt-2 text-sm font-medium text-slate-200">
                            {currentItem ? formatDate(currentItem.dueDate) : `Dia ${account.due_day}`}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2 border-t border-slate-700 pt-4">
                        {account.type !== "parcelada" && currentItem ? (
                          <ActionButton
                            variant="secondary"
                            onClick={() => void handleOccurrenceStatusToggle(currentItem.id, currentItem.status)}
                          >
                            {currentItem.status === "pago" ? "Marcar pendente" : "Marcar pago"}
                          </ActionButton>
                        ) : null}
                        {account.type === "parcelada" ? (
                          <ActionButton
                            variant="secondary"
                            onClick={() =>
                              setExpandedAccountId((current) => (current === account.id ? null : account.id))
                            }
                          >
                            {expandedAccountId === account.id ? "Ocultar parcelas" : "Ver parcelas"}
                          </ActionButton>
                        ) : null}
                        <ActionButton
                          variant="secondary"
                          onClick={() => {
                            setEditingAccount(account);
                            setAccountType(account.type);
                            setAccountOpen(true);
                          }}
                        >
                          Editar
                        </ActionButton>
                        <ActionButton variant="danger" onClick={() => void handleDeleteAccount(account.id)}>
                          Excluir
                        </ActionButton>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="rounded-3xl border border-dashed border-slate-700 bg-[#172033] px-4 py-10 text-center text-sm text-slate-400">
                {loading ? "Carregando contas..." : "Nenhuma conta encontrada para esse mês/filtro."}
              </div>
            )}

            {expandedAccountId ? (
              <div className="rounded-[24px] border border-slate-700 bg-[#172033] p-4 sm:p-5">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-50">Parcelas da conta</p>
                    <p className="mt-1 text-sm text-slate-400">
                      Visualize e altere o status de cada parcela individualmente.
                    </p>
                  </div>
                  <ActionButton variant="secondary" onClick={() => setExpandedAccountId(null)}>
                    Fechar
                  </ActionButton>
                </div>

                <ResponsiveTable
                  items={expandedInstallments}
                  emptyMessage="Nenhuma parcela encontrada para esta conta."
                  columns={[
                    {
                      key: "parcela",
                      header: "Parcela",
                      render: (item) => (
                        <div>
                          <p className="font-semibold text-slate-50">
                            {item.installment_number}/{item.installment_total}
                          </p>
                          <p className="mt-1 text-xs text-slate-400">
                            {formatMonthReference(item.reference_month)}
                          </p>
                        </div>
                      )
                    },
                    {
                      key: "vencimento",
                      header: "Vencimento",
                      render: (item) => formatDate(item.due_date)
                    },
                    {
                      key: "valor",
                      header: "Valor",
                      render: (item) => formatCurrency(item.value)
                    },
                    {
                      key: "status",
                      header: "Status",
                      render: (item) => (
                        <PaymentStatusBadge status={resolvePaymentStatus(item.status, item.due_date)} />
                      )
                    },
                    {
                      key: "acoes",
                      header: "Ações",
                      className: "min-w-[180px]",
                      render: (item) => (
                        <ActionButton
                          variant="secondary"
                          onClick={() =>
                            void handleInstallmentStatusToggle(
                              item.id,
                              resolvePaymentStatus(item.status, item.due_date)
                            )
                          }
                        >
                          {resolvePaymentStatus(item.status, item.due_date) === "pago"
                            ? "Marcar pendente"
                            : "Marcar pago"}
                        </ActionButton>
                      )
                    }
                  ]}
                />
              </div>
            ) : null}
          </div>
        </SectionCard>
      </div>

      <FormModal
        open={revenueOpen}
        title={editingRevenue ? "Editar receita" : "Adicionar receita"}
        description="Cadastre as entradas de dinheiro da casa e marque as receitas fixas para compor o total mensal."
        onClose={() => {
          setRevenueOpen(false);
          setEditingRevenue(null);
        }}
        onSubmit={handleRevenueSubmit}
        submitLabel={editingRevenue ? "Salvar alterações" : "Salvar receita"}
        submitting={revenueSubmitting}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField
            label="Nome"
            name="name"
            required
            defaultValue={editingRevenue?.name ?? initialRevenueForm.name}
            placeholder="Ex: Salário Gabriel"
          />
          <TextField
            label="Valor"
            name="value"
            type="text"
            required
            defaultValue={editingRevenue ? formatDecimalInput(editingRevenue.value) : initialRevenueForm.value}
            inputMode="decimal"
            autoComplete="off"
            pattern="^[0-9.,\\s]+$"
            placeholder="0,00"
          />
          <TextField
            label="Data de recebimento"
            name="received_date"
            type="date"
            required
            defaultValue={editingRevenue?.received_date ?? initialRevenueForm.received_date}
          />
          <SelectField
            label="Frequência"
            name="frequency"
            required
            defaultValue={editingRevenue?.frequency ?? initialRevenueForm.frequency}
            options={homeRevenueFrequencies.map((frequency) => ({
              value: frequency,
              label: toTitleCase(frequency)
            }))}
          />
          <div className="sm:col-span-2">
            <CheckboxField
              name="recurring"
              label="Receita recorrente"
              defaultChecked={editingRevenue?.recurring ?? initialRevenueForm.recurring}
              helper="Se marcada como mensal, ela entra automaticamente no cálculo da receita do mês."
            />
          </div>
          <div className="sm:col-span-2">
            <TextareaField
              label="Observações"
              name="notes"
              defaultValue={editingRevenue?.notes ?? initialRevenueForm.notes}
              placeholder="Informações adicionais sobre essa receita"
            />
          </div>
        </div>
      </FormModal>

      <FormModal
        open={accountOpen}
        title={editingAccount ? "Editar conta" : "Adicionar conta"}
        description="Cadastre contas fixas, avulsas e parceladas. Contas parceladas geram parcelas automaticamente."
        onClose={() => {
          setAccountOpen(false);
          setEditingAccount(null);
          setAccountType("fixa");
        }}
        onSubmit={handleAccountSubmit}
        submitLabel={editingAccount ? "Salvar alterações" : "Salvar conta"}
        submitting={accountSubmitting}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField
            label="Nome"
            name="name"
            required
            defaultValue={editingAccount?.name ?? initialAccountForm.name}
            placeholder="Ex: Conta de luz"
          />
          <SelectField
            label="Categoria"
            name="category"
            required
            defaultValue={editingAccount?.category ?? initialAccountForm.category}
            options={homeAccountCategories.map((category) => ({
              value: category,
              label: category
            }))}
          />
          <TextField
            label="Valor total"
            name="total_value"
            type="text"
            required
            defaultValue={editingAccount ? formatDecimalInput(editingAccount.total_value) : initialAccountForm.total_value}
            inputMode="decimal"
            autoComplete="off"
            pattern="^[0-9.,\\s]+$"
            placeholder="0,00"
          />
          <SelectField
            label="Tipo"
            name="type"
            required
            defaultValue={editingAccount?.type ?? initialAccountForm.type}
            onChange={(event) => setAccountType(event.target.value as HomeAccount["type"])}
            options={homeAccountTypes.map((type) => ({
              value: type,
              label: toTitleCase(type)
            }))}
          />
          <TextField
            label="Data de início"
            name="start_date"
            type="date"
            required
            defaultValue={editingAccount?.start_date ?? initialAccountForm.start_date}
          />
          <TextField
            label="Dia de vencimento"
            name="due_day"
            type="number"
            required
            defaultValue={editingAccount?.due_day ?? initialAccountForm.due_day}
            placeholder="1 a 31"
          />
          {accountType === "parcelada" ? (
            <TextField
              label="Quantidade de parcelas"
              name="installment_count"
              type="number"
              required
              defaultValue={editingAccount?.installment_count ?? initialAccountForm.installment_count}
              placeholder="Ex: 3"
            />
          ) : null}
          <SelectField
            label="Status"
            name="status"
            required
            defaultValue={editingAccount?.status ?? initialAccountForm.status}
            options={homeAccountStatuses.map((status) => ({
              value: status,
              label: toTitleCase(status)
            }))}
          />
          <div className="sm:col-span-2">
            <TextareaField
              label="Observações"
              name="notes"
              defaultValue={editingAccount?.notes ?? initialAccountForm.notes}
              placeholder="Informações adicionais sobre a conta"
            />
          </div>
        </div>
      </FormModal>
    </div>
  );
}
