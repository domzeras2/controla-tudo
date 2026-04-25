import { mockData } from "@/lib/mock-data";
import { getSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabase";
import {
  AiUsageEntry,
  AiUsageInput,
  AppData,
  Expense,
  ExpenseInput,
  HomeAccount,
  HomeAccountInput,
  HomeAccountOccurrence,
  HomeInstallment,
  HomePaymentStatus,
  HomeRevenue,
  HomeRevenueInput,
  Project,
  ProjectInput,
  TimeEntry,
  TimeEntryInput
} from "@/lib/types";

const STORAGE_KEY = "painel-controle-ia-data";

function cloneSeed() {
  return JSON.parse(JSON.stringify(mockData)) as AppData;
}

function sortByDateDesc<T extends { date?: string; updated_at?: string; created_at: string }>(
  items: T[]
) {
  return [...items].sort((a, b) => {
    const left = a.date ?? a.updated_at ?? a.created_at;
    const right = b.date ?? b.updated_at ?? b.created_at;
    return +new Date(right) - +new Date(left);
  });
}

function createId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

function stamp<T>(payload: T) {
  const now = new Date().toISOString();
  return {
    ...payload,
    created_at: now,
    updated_at: now
  };
}

function touch<T extends { updated_at: string }>(payload: T) {
  return {
    ...payload,
    updated_at: new Date().toISOString()
  };
}

function toIsoDate(value: Date) {
  return value.toISOString().slice(0, 10);
}

function startOfDay(value: Date) {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date;
}

function buildDueDate(year: number, monthIndex: number, dueDay: number) {
  const lastDay = new Date(year, monthIndex + 1, 0).getDate();
  const safeDay = Math.min(Math.max(dueDay, 1), lastDay);
  return new Date(year, monthIndex, safeDay);
}

function normalizePaymentStatus(status: HomePaymentStatus, dueDate: string) {
  if (status === "pago") return "pago" as const;
  return new Date(dueDate) < startOfDay(new Date()) ? "atrasado" : "pendente";
}

function buildInstallments(account: HomeAccount, existingInstallments: HomeInstallment[] = []) {
  if (account.type !== "parcelada") return [] as HomeInstallment[];

  const count = Math.max(account.installment_count, 1);
  const baseValue = Number((account.total_value / count).toFixed(2));
  const totalRounded = Number((baseValue * count).toFixed(2));
  const diff = Number((account.total_value - totalRounded).toFixed(2));
  const start = new Date(account.start_date);

  return Array.from({ length: count }).map((_, index) => {
    const dueDate = buildDueDate(start.getFullYear(), start.getMonth() + index, account.due_day);
    const value = index === count - 1 ? Number((baseValue + diff).toFixed(2)) : baseValue;
    const now = new Date().toISOString();
    const existing = existingInstallments.find((item) => item.installment_number === index + 1);

    return {
      id: existing?.id ?? createId("inst"),
      account_id: account.id,
      installment_number: index + 1,
      installment_total: count,
      value,
      reference_month: toIsoDate(dueDate).slice(0, 7),
      due_date: toIsoDate(dueDate),
      status: normalizePaymentStatus(
        account.status === "quitada" ? "pago" : existing?.status ?? "pendente",
        toIsoDate(dueDate)
      ),
      created_at: existing?.created_at ?? now,
      updated_at: now
    } satisfies HomeInstallment;
  });
}

function syncOccurrences(
  accounts: HomeAccount[],
  occurrences: HomeAccountOccurrence[]
) {
  const now = new Date();
  const synced: HomeAccountOccurrence[] = [];

  for (const account of accounts) {
    const related = occurrences.filter((item) => item.account_id === account.id);

    if (account.type === "fixa") {
      const start = new Date(account.start_date);
      const monthCursor = new Date(start.getFullYear(), start.getMonth(), 1);
      const lastMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      while (monthCursor <= lastMonth) {
        const referenceMonth = `${monthCursor.getFullYear()}-${String(monthCursor.getMonth() + 1).padStart(2, "0")}`;
        const dueDate = toIsoDate(
          buildDueDate(monthCursor.getFullYear(), monthCursor.getMonth(), account.due_day)
        );
        const existing = related.find((item) => item.reference_month === referenceMonth);
        const base = existing ?? {
          id: createId("occ"),
          account_id: account.id,
          reference_month: referenceMonth,
          due_date: dueDate,
          status: "pendente" as HomePaymentStatus,
          value: account.total_value,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        synced.push({
          ...base,
          due_date: dueDate,
          value: account.total_value,
          status: normalizePaymentStatus(base.status, dueDate)
        });

        monthCursor.setMonth(monthCursor.getMonth() + 1);
      }
    }

    if (account.type === "avulsa") {
      const dueDate = toIsoDate(
        buildDueDate(
          new Date(account.start_date).getFullYear(),
          new Date(account.start_date).getMonth(),
          account.due_day
        )
      );
      const referenceMonth = dueDate.slice(0, 7);
      const existing = related[0];
      const base = existing ?? {
        id: createId("occ"),
        account_id: account.id,
        reference_month: referenceMonth,
        due_date: dueDate,
        status: "pendente" as HomePaymentStatus,
        value: account.total_value,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      synced.push({
        ...base,
        due_date: dueDate,
        reference_month: referenceMonth,
        value: account.total_value,
        status: normalizePaymentStatus(base.status, dueDate)
      });
    }
  }

  return sortByDateDesc(synced);
}

function normalizeData(data: AppData): AppData {
  const normalizedOccurrences = syncOccurrences(data.homeAccounts, data.homeAccountOccurrences).map<HomeAccountOccurrence>((item) => ({
    ...item,
    status: normalizePaymentStatus(item.status, item.due_date)
  }));

  const normalizedInstallments = data.homeInstallments
    .filter((item) => data.homeAccounts.some((account) => account.id === item.account_id))
    .map<HomeInstallment>((item) => ({
      ...item,
      status: normalizePaymentStatus(item.status, item.due_date)
    }));

  return {
    ...data,
    homeInstallments: sortByDateDesc(normalizedInstallments),
    homeAccountOccurrences: normalizedOccurrences
  };
}

function readLocalData(): AppData {
  if (typeof window === "undefined") {
    return normalizeData(cloneSeed());
  }

  const stored = window.localStorage.getItem(STORAGE_KEY);

  if (!stored) {
    const seed = normalizeData(cloneSeed());
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
    return seed;
  }

  const parsed = JSON.parse(stored) as Partial<AppData>;
  const seed = cloneSeed();
  const normalized = normalizeData({
    expenses: parsed.expenses ?? seed.expenses,
    timeEntries: parsed.timeEntries ?? seed.timeEntries,
    projects: parsed.projects ?? seed.projects,
    aiUsages: parsed.aiUsages ?? seed.aiUsages,
    homeRevenues: parsed.homeRevenues ?? seed.homeRevenues,
    homeAccounts: parsed.homeAccounts ?? seed.homeAccounts,
    homeInstallments: parsed.homeInstallments ?? seed.homeInstallments,
    homeAccountOccurrences: parsed.homeAccountOccurrences ?? seed.homeAccountOccurrences
  });

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
  return normalized;
}

function writeLocalData(data: AppData) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(normalizeData(data)));
}

async function getSupabaseData(): Promise<AppData> {
  const client = getSupabaseBrowserClient();

  if (!client) {
    return readLocalData();
  }

  const [expenses, timeEntries, projects, aiUsages] = await Promise.all([
    client.from("expenses").select("*").order("date", { ascending: false }),
    client.from("time_entries").select("*").order("date", { ascending: false }),
    client.from("projects").select("*").order("updated_at", { ascending: false }),
    client.from("ai_usage_entries").select("*").order("date", { ascending: false })
  ]);

  if (expenses.error) throw expenses.error;
  if (timeEntries.error) throw timeEntries.error;
  if (projects.error) throw projects.error;
  if (aiUsages.error) throw aiUsages.error;

  const localData = readLocalData();

  return {
    expenses: expenses.data as Expense[],
    timeEntries: timeEntries.data as TimeEntry[],
    projects: projects.data as Project[],
    aiUsages: aiUsages.data as AiUsageEntry[],
    homeRevenues: sortByDateDesc(localData.homeRevenues),
    homeAccounts: sortByDateDesc(localData.homeAccounts),
    homeInstallments: sortByDateDesc(localData.homeInstallments),
    homeAccountOccurrences: sortByDateDesc(localData.homeAccountOccurrences)
  };
}

export async function loadAppData() {
  if (isSupabaseConfigured()) {
    return getSupabaseData();
  }

  const data = readLocalData();

  return {
    expenses: sortByDateDesc(data.expenses),
    timeEntries: sortByDateDesc(data.timeEntries),
    projects: sortByDateDesc(data.projects),
    aiUsages: sortByDateDesc(data.aiUsages),
    homeRevenues: sortByDateDesc(data.homeRevenues),
    homeAccounts: sortByDateDesc(data.homeAccounts),
    homeInstallments: sortByDateDesc(data.homeInstallments),
    homeAccountOccurrences: sortByDateDesc(data.homeAccountOccurrences)
  };
}

export async function createExpense(input: ExpenseInput) {
  if (isSupabaseConfigured()) {
    const client = getSupabaseBrowserClient();
    const response = await client!.from("expenses").insert(input).select("*").single();
    if (response.error) throw response.error;
    return response.data as Expense;
  }

  const data = readLocalData();
  const created = stamp({
    id: createId("exp"),
    ...input
  });

  data.expenses = sortByDateDesc([created, ...data.expenses]);
  writeLocalData(data);
  return created as Expense;
}

export async function updateExpense(id: string, input: ExpenseInput) {
  if (isSupabaseConfigured()) {
    const client = getSupabaseBrowserClient();
    const response = await client!
      .from("expenses")
      .update(input)
      .eq("id", id)
      .select("*")
      .single();
    if (response.error) throw response.error;
    return response.data as Expense;
  }

  const data = readLocalData();
  const previous = data.expenses.find((item) => item.id === id);
  if (!previous) throw new Error("Gasto não encontrado.");

  const updated = touch({
    ...previous,
    ...input
  });

  data.expenses = sortByDateDesc(data.expenses.map((item) => (item.id === id ? updated : item)));
  writeLocalData(data);
  return updated;
}

export async function deleteExpense(id: string) {
  if (isSupabaseConfigured()) {
    const client = getSupabaseBrowserClient();
    const response = await client!.from("expenses").delete().eq("id", id);
    if (response.error) throw response.error;
    return;
  }

  const data = readLocalData();
  data.expenses = data.expenses.filter((item) => item.id !== id);
  writeLocalData(data);
}

export async function createTimeEntry(input: TimeEntryInput) {
  if (isSupabaseConfigured()) {
    const client = getSupabaseBrowserClient();
    const response = await client!.from("time_entries").insert(input).select("*").single();
    if (response.error) throw response.error;
    return response.data as TimeEntry;
  }

  const data = readLocalData();
  const created = stamp({
    id: createId("time"),
    ...input
  });

  data.timeEntries = sortByDateDesc([created, ...data.timeEntries]);
  writeLocalData(data);
  return created as TimeEntry;
}

export async function updateTimeEntry(id: string, input: TimeEntryInput) {
  if (isSupabaseConfigured()) {
    const client = getSupabaseBrowserClient();
    const response = await client!
      .from("time_entries")
      .update(input)
      .eq("id", id)
      .select("*")
      .single();
    if (response.error) throw response.error;
    return response.data as TimeEntry;
  }

  const data = readLocalData();
  const previous = data.timeEntries.find((item) => item.id === id);
  if (!previous) throw new Error("Registro de tempo não encontrado.");

  const updated = touch({
    ...previous,
    ...input
  });

  data.timeEntries = sortByDateDesc(
    data.timeEntries.map((item) => (item.id === id ? updated : item))
  );
  writeLocalData(data);
  return updated;
}

export async function deleteTimeEntry(id: string) {
  if (isSupabaseConfigured()) {
    const client = getSupabaseBrowserClient();
    const response = await client!.from("time_entries").delete().eq("id", id);
    if (response.error) throw response.error;
    return;
  }

  const data = readLocalData();
  data.timeEntries = data.timeEntries.filter((item) => item.id !== id);
  writeLocalData(data);
}

export async function createProject(input: ProjectInput) {
  if (isSupabaseConfigured()) {
    const client = getSupabaseBrowserClient();
    const response = await client!.from("projects").insert(input).select("*").single();
    if (response.error) throw response.error;
    return response.data as Project;
  }

  const data = readLocalData();
  const created = stamp({
    id: createId("proj"),
    ...input
  });

  data.projects = sortByDateDesc([created, ...data.projects]);
  writeLocalData(data);
  return created as Project;
}

export async function updateProject(id: string, input: ProjectInput) {
  if (isSupabaseConfigured()) {
    const client = getSupabaseBrowserClient();
    const response = await client!.from("projects").update(input).eq("id", id).select("*").single();
    if (response.error) throw response.error;
    return response.data as Project;
  }

  const data = readLocalData();
  const previous = data.projects.find((item) => item.id === id);
  if (!previous) throw new Error("Projeto não encontrado.");

  const updated = touch({
    ...previous,
    ...input
  });

  data.projects = sortByDateDesc(data.projects.map((item) => (item.id === id ? updated : item)));
  writeLocalData(data);
  return updated;
}

export async function deleteProject(id: string) {
  if (isSupabaseConfigured()) {
    const client = getSupabaseBrowserClient();
    const response = await client!.from("projects").delete().eq("id", id);
    if (response.error) throw response.error;
    return;
  }

  const data = readLocalData();
  data.projects = data.projects.filter((item) => item.id !== id);
  writeLocalData(data);
}

export async function createAiUsage(input: AiUsageInput) {
  if (isSupabaseConfigured()) {
    const client = getSupabaseBrowserClient();
    const response = await client!.from("ai_usage_entries").insert(input).select("*").single();
    if (response.error) throw response.error;
    return response.data as AiUsageEntry;
  }

  const data = readLocalData();
  const created = stamp({
    id: createId("ai"),
    ...input
  });

  data.aiUsages = sortByDateDesc([created, ...data.aiUsages]);
  writeLocalData(data);
  return created as AiUsageEntry;
}

export async function updateAiUsage(id: string, input: AiUsageInput) {
  if (isSupabaseConfigured()) {
    const client = getSupabaseBrowserClient();
    const response = await client!
      .from("ai_usage_entries")
      .update(input)
      .eq("id", id)
      .select("*")
      .single();
    if (response.error) throw response.error;
    return response.data as AiUsageEntry;
  }

  const data = readLocalData();
  const previous = data.aiUsages.find((item) => item.id === id);
  if (!previous) throw new Error("Registro de uso de IA não encontrado.");

  const updated = touch({
    ...previous,
    ...input
  });

  data.aiUsages = sortByDateDesc(data.aiUsages.map((item) => (item.id === id ? updated : item)));
  writeLocalData(data);
  return updated;
}

export async function deleteAiUsage(id: string) {
  if (isSupabaseConfigured()) {
    const client = getSupabaseBrowserClient();
    const response = await client!.from("ai_usage_entries").delete().eq("id", id);
    if (response.error) throw response.error;
    return;
  }

  const data = readLocalData();
  data.aiUsages = data.aiUsages.filter((item) => item.id !== id);
  writeLocalData(data);
}

export async function createHomeRevenue(input: HomeRevenueInput) {
  const data = readLocalData();
  const created = stamp({
    id: createId("rev"),
    ...input
  });

  data.homeRevenues = sortByDateDesc([created, ...data.homeRevenues]);
  writeLocalData(data);
  return created as HomeRevenue;
}

export async function updateHomeRevenue(id: string, input: HomeRevenueInput) {
  const data = readLocalData();
  const previous = data.homeRevenues.find((item) => item.id === id);
  if (!previous) throw new Error("Receita não encontrada.");

  const updated = touch({
    ...previous,
    ...input
  });

  data.homeRevenues = sortByDateDesc(
    data.homeRevenues.map((item) => (item.id === id ? updated : item))
  );
  writeLocalData(data);
  return updated;
}

export async function deleteHomeRevenue(id: string) {
  const data = readLocalData();
  data.homeRevenues = data.homeRevenues.filter((item) => item.id !== id);
  writeLocalData(data);
}

export async function createHomeAccount(input: HomeAccountInput) {
  const data = readLocalData();
  const created = stamp({
    id: createId("acc"),
    ...input
  });
  const installments = buildInstallments(created);

  data.homeAccounts = sortByDateDesc([created, ...data.homeAccounts]);
  data.homeInstallments = sortByDateDesc([...installments, ...data.homeInstallments]);
  writeLocalData(data);
  return created as HomeAccount;
}

export async function updateHomeAccount(id: string, input: HomeAccountInput) {
  const data = readLocalData();
  const previous = data.homeAccounts.find((item) => item.id === id);
  if (!previous) throw new Error("Conta não encontrada.");

  const updated = touch({
    ...previous,
    ...input
  });
  const installments = buildInstallments(
    updated,
    data.homeInstallments.filter((item) => item.account_id === id)
  );

  data.homeAccounts = sortByDateDesc(
    data.homeAccounts.map((item) => (item.id === id ? updated : item))
  );
  data.homeInstallments = sortByDateDesc([
    ...data.homeInstallments.filter((item) => item.account_id !== id),
    ...installments
  ]);
  writeLocalData(data);
  return updated;
}

export async function deleteHomeAccount(id: string) {
  const data = readLocalData();
  data.homeAccounts = data.homeAccounts.filter((item) => item.id !== id);
  data.homeInstallments = data.homeInstallments.filter((item) => item.account_id !== id);
  data.homeAccountOccurrences = data.homeAccountOccurrences.filter((item) => item.account_id !== id);
  writeLocalData(data);
}

export async function updateHomeInstallmentStatus(id: string, status: HomePaymentStatus) {
  const data = readLocalData();
  data.homeInstallments = data.homeInstallments.map((item) =>
    item.id === id ? touch({ ...item, status }) : item
  );
  writeLocalData(data);
}

export async function updateHomeAccountOccurrenceStatus(id: string, status: HomePaymentStatus) {
  const data = readLocalData();
  data.homeAccountOccurrences = data.homeAccountOccurrences.map((item) =>
    item.id === id ? touch({ ...item, status }) : item
  );
  writeLocalData(data);
}
