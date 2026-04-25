export const expenseCategories = [
  "IA",
  "Domínio",
  "Hospedagem",
  "Ferramentas",
  "Outros"
] as const;

export const projectStatuses = [
  "ideia",
  "em andamento",
  "aguardando cliente",
  "finalizado",
  "cancelado"
] as const;

export const projectServiceTypes = [
  "site",
  "landing page",
  "manutenção",
  "sistema",
  "design",
  "automação",
  "outro"
] as const;

export const homeRevenueFrequencies = ["mensal", "semanal", "unico"] as const;

export const homeAccountCategories = [
  "Moradia",
  "Água",
  "Luz",
  "Internet",
  "Mercado",
  "Cartão",
  "Saúde",
  "Transporte",
  "Eletrônicos",
  "Outros"
] as const;

export const homeAccountTypes = ["fixa", "avulsa", "parcelada"] as const;
export const homeAccountStatuses = ["ativa", "quitada"] as const;
export const homePaymentStatuses = ["pendente", "pago", "atrasado"] as const;

export type ExpenseCategory = (typeof expenseCategories)[number];
export type ProjectStatus = (typeof projectStatuses)[number];
export type ProjectServiceType = (typeof projectServiceTypes)[number];
export type HomeRevenueFrequency = (typeof homeRevenueFrequencies)[number];
export type HomeAccountCategory = (typeof homeAccountCategories)[number];
export type HomeAccountType = (typeof homeAccountTypes)[number];
export type HomeAccountStatus = (typeof homeAccountStatuses)[number];
export type HomePaymentStatus = (typeof homePaymentStatuses)[number];

export type Expense = {
  id: string;
  title: string;
  value: number;
  category: ExpenseCategory;
  date: string;
  notes: string;
  created_at: string;
  updated_at: string;
};

export type TimeEntry = {
  id: string;
  project: string;
  hours: number;
  date: string;
  description: string;
  created_at: string;
  updated_at: string;
};

export type Project = {
  id: string;
  name: string;
  status: ProjectStatus;
  estimated_value: number;
  client?: string;
  service_type?: ProjectServiceType;
  start_date?: string;
  delivery_date?: string;
  notes?: string;
  description?: string;
  created_at: string;
  updated_at: string;
};

export type AiUsageEntry = {
  id: string;
  tool: string;
  purpose: string;
  time_used: number;
  cost_estimated: number;
  date: string;
  notes: string;
  created_at: string;
  updated_at: string;
};

export type HomeRevenue = {
  id: string;
  name: string;
  value: number;
  received_date: string;
  recurring: boolean;
  frequency: HomeRevenueFrequency;
  notes: string;
  created_at: string;
  updated_at: string;
};

export type HomeAccount = {
  id: string;
  name: string;
  category: HomeAccountCategory;
  total_value: number;
  type: HomeAccountType;
  start_date: string;
  due_day: number;
  installment_count: number;
  recurring: boolean;
  status: HomeAccountStatus;
  notes: string;
  created_at: string;
  updated_at: string;
};

export type HomeInstallment = {
  id: string;
  account_id: string;
  installment_number: number;
  installment_total: number;
  value: number;
  reference_month: string;
  due_date: string;
  status: HomePaymentStatus;
  created_at: string;
  updated_at: string;
};

export type HomeAccountOccurrence = {
  id: string;
  account_id: string;
  reference_month: string;
  due_date: string;
  status: HomePaymentStatus;
  value: number;
  created_at: string;
  updated_at: string;
};

export type AppData = {
  expenses: Expense[];
  timeEntries: TimeEntry[];
  projects: Project[];
  aiUsages: AiUsageEntry[];
  homeRevenues: HomeRevenue[];
  homeAccounts: HomeAccount[];
  homeInstallments: HomeInstallment[];
  homeAccountOccurrences: HomeAccountOccurrence[];
};

export type ExpenseInput = Omit<Expense, "id" | "created_at" | "updated_at">;
export type TimeEntryInput = Omit<TimeEntry, "id" | "created_at" | "updated_at">;
export type ProjectInput = Omit<Project, "id" | "created_at" | "updated_at">;
export type AiUsageInput = Omit<AiUsageEntry, "id" | "created_at" | "updated_at">;
export type HomeRevenueInput = Omit<HomeRevenue, "id" | "created_at" | "updated_at">;
export type HomeAccountInput = Omit<HomeAccount, "id" | "created_at" | "updated_at">;

export type RecentEntry = {
  id: string;
  type: "Gasto" | "Tempo" | "Projeto" | "Uso de IA";
  title: string;
  subtitle: string;
  date: string;
  amountLabel: string;
};
