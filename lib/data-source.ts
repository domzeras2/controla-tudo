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
const APP_DATA_ROW_ID = "user-1";

type AppDataRow = {
  id: string;
  data: Partial<AppData> | null;
};

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
    expenses: sortByDateDesc(data.expenses),
    timeEntries: sortByDateDesc(data.timeEntries),
    projects: sortByDateDesc(data.projects),
    aiUsages: sortByDateDesc(data.aiUsages),
    homeRevenues: sortByDateDesc(data.homeRevenues),
    homeAccounts: sortByDateDesc(data.homeAccounts),
    homeInstallments: sortByDateDesc(normalizedInstallments),
    homeAccountOccurrences: normalizedOccurrences
  };
}

function mergeWithSeed(data?: Partial<AppData> | null): AppData {
  const seed = cloneSeed();

  return normalizeData({
    expenses: data?.expenses ?? seed.expenses,
    timeEntries: data?.timeEntries ?? seed.timeEntries,
    projects: data?.projects ?? seed.projects,
    aiUsages: data?.aiUsages ?? seed.aiUsages,
    homeRevenues: data?.homeRevenues ?? seed.homeRevenues,
    homeAccounts: data?.homeAccounts ?? seed.homeAccounts,
    homeInstallments: data?.homeInstallments ?? seed.homeInstallments,
    homeAccountOccurrences: data?.homeAccountOccurrences ?? seed.homeAccountOccurrences
  });
}

function getLatestTimestamp(data: AppData) {
  const timestamps = [
    ...data.expenses.flatMap((item) => [item.updated_at, item.created_at]),
    ...data.timeEntries.flatMap((item) => [item.updated_at, item.created_at]),
    ...data.projects.flatMap((item) => [item.updated_at, item.created_at]),
    ...data.aiUsages.flatMap((item) => [item.updated_at, item.created_at]),
    ...data.homeRevenues.flatMap((item) => [item.updated_at, item.created_at]),
    ...data.homeAccounts.flatMap((item) => [item.updated_at, item.created_at]),
    ...data.homeInstallments.flatMap((item) => [item.updated_at, item.created_at]),
    ...data.homeAccountOccurrences.flatMap((item) => [item.updated_at, item.created_at])
  ]
    .filter(Boolean)
    .map((value) => +new Date(value as string));

  return timestamps.length ? Math.max(...timestamps) : 0;
}

function readLocalData(): AppData {
  if (typeof window === "undefined") {
    return mergeWithSeed();
  }

  const stored = window.localStorage.getItem(STORAGE_KEY);

  if (!stored) {
    const seed = mergeWithSeed();
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
    return seed;
  }

  try {
    const parsed = JSON.parse(stored) as Partial<AppData>;
    const normalized = mergeWithSeed(parsed);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
    return normalized;
  } catch (error) {
    console.error("Erro ao ler localStorage, usando dados iniciais:", error);
    const seed = mergeWithSeed();
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
    return seed;
  }
}

function hasStoredLocalData() {
  if (typeof window === "undefined") return false;
  return Boolean(window.localStorage.getItem(STORAGE_KEY));
}

function writeLocalData(data: AppData) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(normalizeData(data)));
}

async function loadSupabaseData() {
  const client = getSupabaseBrowserClient();

  if (!client) return null;

  console.log("Carregando dados do Supabase");

  try {
    const response = await client
      .from("app_data")
      .select("id, data")
      .eq("id", APP_DATA_ROW_ID)
      .maybeSingle<AppDataRow>();

    if (response.error) {
      console.error("Erro ao carregar dados do Supabase:", response.error);
      return null;
    }

    if (!response.data?.data) {
      return null;
    }

    return mergeWithSeed(response.data.data);
  } catch (error) {
    console.error("Erro detalhado ao carregar dados do Supabase:", error);
    return null;
  }
}

async function saveSupabaseData(data: AppData) {
  const client = getSupabaseBrowserClient();

  if (!client) return false;

  try {
    const response = await client
      .from("app_data")
      .upsert(
        {
          id: APP_DATA_ROW_ID,
          data: normalizeData(data)
        },
        {
          onConflict: "id"
        }
      );

    if (response.error) {
      console.error("Erro ao salvar dados no Supabase:", response.error);
      return false;
    }

    console.log("Dados salvos no Supabase");
    return true;
  } catch (error) {
    console.error("Erro detalhado ao salvar dados no Supabase:", error);
    return false;
  }
}

async function persistData(data: AppData) {
  const normalized = normalizeData(data);
  writeLocalData(normalized);

  if (isSupabaseConfigured()) {
    await saveSupabaseData(normalized);
  }

  return normalized;
}

export async function loadAppData() {
  const hadStoredLocalData = hasStoredLocalData();
  const localData = readLocalData();

  if (!isSupabaseConfigured()) {
    return localData;
  }

  const remoteData = await loadSupabaseData();

  if (!remoteData) {
    return localData;
  }

  if (!hadStoredLocalData) {
    writeLocalData(remoteData);
    return remoteData;
  }

  const localVersion = getLatestTimestamp(localData);
  const remoteVersion = getLatestTimestamp(remoteData);
  const chosen = localVersion > remoteVersion ? localData : remoteData;

  writeLocalData(chosen);

  if (chosen === localData && localVersion > remoteVersion) {
    await saveSupabaseData(chosen);
  }

  return chosen;
}

export async function createExpense(input: ExpenseInput) {
  const data = readLocalData();
  const created = stamp({
    id: createId("exp"),
    ...input
  });

  data.expenses = [created as Expense, ...data.expenses];
  await persistData(data);
  return created as Expense;
}

export async function updateExpense(id: string, input: ExpenseInput) {
  const data = readLocalData();
  const previous = data.expenses.find((item) => item.id === id);
  if (!previous) throw new Error("Gasto não encontrado.");

  const updated = touch({
    ...previous,
    ...input
  });

  data.expenses = data.expenses.map((item) => (item.id === id ? updated : item));
  await persistData(data);
  return updated;
}

export async function deleteExpense(id: string) {
  const data = readLocalData();
  data.expenses = data.expenses.filter((item) => item.id !== id);
  await persistData(data);
}

export async function createTimeEntry(input: TimeEntryInput) {
  const data = readLocalData();
  const created = stamp({
    id: createId("time"),
    ...input
  });

  data.timeEntries = [created as TimeEntry, ...data.timeEntries];
  await persistData(data);
  return created as TimeEntry;
}

export async function updateTimeEntry(id: string, input: TimeEntryInput) {
  const data = readLocalData();
  const previous = data.timeEntries.find((item) => item.id === id);
  if (!previous) throw new Error("Registro de tempo não encontrado.");

  const updated = touch({
    ...previous,
    ...input
  });

  data.timeEntries = data.timeEntries.map((item) => (item.id === id ? updated : item));
  await persistData(data);
  return updated;
}

export async function deleteTimeEntry(id: string) {
  const data = readLocalData();
  data.timeEntries = data.timeEntries.filter((item) => item.id !== id);
  await persistData(data);
}

export async function createProject(input: ProjectInput) {
  const data = readLocalData();
  const created = stamp({
    id: createId("proj"),
    ...input
  });

  data.projects = [created as Project, ...data.projects];
  await persistData(data);
  return created as Project;
}

export async function updateProject(id: string, input: ProjectInput) {
  const data = readLocalData();
  const previous = data.projects.find((item) => item.id === id);
  if (!previous) throw new Error("Projeto não encontrado.");

  const updated = touch({
    ...previous,
    ...input
  });

  data.projects = data.projects.map((item) => (item.id === id ? updated : item));
  await persistData(data);
  return updated;
}

export async function deleteProject(id: string) {
  const data = readLocalData();
  data.projects = data.projects.filter((item) => item.id !== id);
  await persistData(data);
}

export async function createAiUsage(input: AiUsageInput) {
  const data = readLocalData();
  const created = stamp({
    id: createId("ai"),
    ...input
  });

  data.aiUsages = [created as AiUsageEntry, ...data.aiUsages];
  await persistData(data);
  return created as AiUsageEntry;
}

export async function updateAiUsage(id: string, input: AiUsageInput) {
  const data = readLocalData();
  const previous = data.aiUsages.find((item) => item.id === id);
  if (!previous) throw new Error("Registro de uso de IA não encontrado.");

  const updated = touch({
    ...previous,
    ...input
  });

  data.aiUsages = data.aiUsages.map((item) => (item.id === id ? updated : item));
  await persistData(data);
  return updated;
}

export async function deleteAiUsage(id: string) {
  const data = readLocalData();
  data.aiUsages = data.aiUsages.filter((item) => item.id !== id);
  await persistData(data);
}

export async function createHomeRevenue(input: HomeRevenueInput) {
  const data = readLocalData();
  const created = stamp({
    id: createId("rev"),
    ...input
  });

  data.homeRevenues = [created as HomeRevenue, ...data.homeRevenues];
  await persistData(data);
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

  data.homeRevenues = data.homeRevenues.map((item) => (item.id === id ? updated : item));
  await persistData(data);
  return updated;
}

export async function deleteHomeRevenue(id: string) {
  const data = readLocalData();
  data.homeRevenues = data.homeRevenues.filter((item) => item.id !== id);
  await persistData(data);
}

export async function createHomeAccount(input: HomeAccountInput) {
  const data = readLocalData();
  const created = stamp({
    id: createId("acc"),
    ...input
  });
  const installments = buildInstallments(created as HomeAccount);

  data.homeAccounts = [created as HomeAccount, ...data.homeAccounts];
  data.homeInstallments = [...installments, ...data.homeInstallments];
  await persistData(data);
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
    updated as HomeAccount,
    data.homeInstallments.filter((item) => item.account_id === id)
  );

  data.homeAccounts = data.homeAccounts.map((item) => (item.id === id ? updated : item));
  data.homeInstallments = [
    ...data.homeInstallments.filter((item) => item.account_id !== id),
    ...installments
  ];
  await persistData(data);
  return updated;
}

export async function deleteHomeAccount(id: string) {
  const data = readLocalData();
  data.homeAccounts = data.homeAccounts.filter((item) => item.id !== id);
  data.homeInstallments = data.homeInstallments.filter((item) => item.account_id !== id);
  data.homeAccountOccurrences = data.homeAccountOccurrences.filter((item) => item.account_id !== id);
  await persistData(data);
}

export async function updateHomeInstallmentStatus(id: string, status: HomePaymentStatus) {
  const data = readLocalData();
  data.homeInstallments = data.homeInstallments.map((item) =>
    item.id === id ? touch({ ...item, status }) : item
  );
  await persistData(data);
}

export async function updateHomeAccountOccurrenceStatus(id: string, status: HomePaymentStatus) {
  const data = readLocalData();
  data.homeAccountOccurrences = data.homeAccountOccurrences.map((item) =>
    item.id === id ? touch({ ...item, status }) : item
  );
  await persistData(data);
}
