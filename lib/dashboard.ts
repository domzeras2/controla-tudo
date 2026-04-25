import {
  AppData,
  HomeAccount,
  HomeAccountOccurrence,
  HomeInstallment,
  HomePaymentStatus,
  HomeRevenue,
  RecentEntry
} from "@/lib/types";

export type HomePayableEntry = {
  id: string;
  accountId: string;
  title: string;
  category: string;
  type: "fixa" | "avulsa" | "parcelada";
  amount: number;
  dueDate: string;
  referenceMonth: string;
  status: HomePaymentStatus;
  source: "occurrence" | "installment";
};

function startOfDay(value: Date) {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date;
}

function endOfDay(value: Date) {
  const date = new Date(value);
  date.setHours(23, 59, 59, 999);
  return date;
}

export function isSameMonth(dateValue: string, compare = new Date()) {
  const date = new Date(dateValue);
  return date.getMonth() === compare.getMonth() && date.getFullYear() === compare.getFullYear();
}

export function resolvePaymentStatus(status: HomePaymentStatus, dueDate: string, compare = new Date()) {
  if (status === "pago") return "pago" as const;

  const due = endOfDay(new Date(dueDate));
  const now = startOfDay(compare);

  return due < now ? "atrasado" : "pendente";
}

export function calculateHomeRevenueForMonth(
  revenues: HomeRevenue[],
  compare = new Date()
) {
  return revenues.reduce((sum, item) => {
    const includeRecurringMonthly = item.recurring && item.frequency === "mensal";
    const includeByDate = isSameMonth(item.received_date, compare);
    return includeRecurringMonthly || includeByDate ? sum + item.value : sum;
  }, 0);
}

function isSameReferenceMonth(referenceMonth: string, compare = new Date()) {
  const compareMonth = `${compare.getFullYear()}-${String(compare.getMonth() + 1).padStart(2, "0")}`;
  return referenceMonth === compareMonth;
}

export function buildHomePayables(
  accounts: HomeAccount[],
  occurrences: HomeAccountOccurrence[],
  installments: HomeInstallment[],
  compare = new Date()
) {
  const fixedAndOneOff = occurrences
    .map<HomePayableEntry | null>((occurrence) => {
      const account = accounts.find((item) => item.id === occurrence.account_id);
      if (!account) return null;

      return {
        id: occurrence.id,
        accountId: account.id,
        title: account.name,
        category: account.category,
        type: account.type,
        amount: occurrence.value,
        dueDate: occurrence.due_date,
        referenceMonth: occurrence.reference_month,
        status: resolvePaymentStatus(occurrence.status, occurrence.due_date, compare),
        source: "occurrence"
      };
    })
    .filter(Boolean) as HomePayableEntry[];

  const installmentEntries = installments
    .map<HomePayableEntry | null>((installment) => {
      const account = accounts.find((item) => item.id === installment.account_id);
      if (!account) return null;

      return {
        id: installment.id,
        accountId: account.id,
        title: account.name,
        category: account.category,
        type: "parcelada",
        amount: installment.value,
        dueDate: installment.due_date,
        referenceMonth: installment.reference_month,
        status: resolvePaymentStatus(installment.status, installment.due_date, compare),
        source: "installment"
      };
    })
    .filter(Boolean) as HomePayableEntry[];

  return [...fixedAndOneOff, ...installmentEntries].sort(
    (a, b) => +new Date(a.dueDate) - +new Date(b.dueDate)
  );
}

function calculateHomePaymentsMetrics(
  accounts: HomeAccount[],
  occurrences: HomeAccountOccurrence[],
  installments: HomeInstallment[],
  compare = new Date()
) {
  const payables = buildHomePayables(accounts, occurrences, installments, compare);
  const onlyOpenItems = payables.filter((item) => item.status !== "pago");
  const now = startOfDay(compare);
  const weekLimit = endOfDay(new Date(compare.getFullYear(), compare.getMonth(), compare.getDate() + 7));

  const totalPayMonth = onlyOpenItems
    .filter((item) => isSameMonth(item.dueDate, compare))
    .reduce((sum, item) => sum + item.amount, 0);

  const totalPayWeek = onlyOpenItems
    .filter((item) => {
      const dueDate = new Date(item.dueDate);
      return dueDate >= now && dueDate <= weekLimit;
    })
    .reduce((sum, item) => sum + item.amount, 0);

  const upcomingDueEntries = onlyOpenItems.slice(0, 5);

  return {
    totalPayMonth,
    totalPayWeek,
    upcomingDueEntries
  };
}

export function buildHomeFinanceMetrics(data: AppData, compare = new Date()) {
  const payables = buildHomePayables(
    data.homeAccounts,
    data.homeAccountOccurrences,
    data.homeInstallments,
    compare
  );
  const monthItems = payables.filter((item) => isSameReferenceMonth(item.referenceMonth, compare));
  const paidItems = monthItems.filter((item) => item.status === "pago");
  const onlyOpenItems = monthItems.filter((item) => item.status !== "pago");
  const now = startOfDay(new Date());
  const weekLimit = endOfDay(new Date(now.getFullYear(), now.getMonth(), now.getDate() + 7));
  const totalRevenueMonth = calculateHomeRevenueForMonth(data.homeRevenues, compare);
  const totalExpenseMonth = monthItems.reduce((sum, item) => sum + item.amount, 0);
  const totalPaidMonth = paidItems.reduce((sum, item) => sum + item.amount, 0);
  const totalPendingMonth = onlyOpenItems.reduce((sum, item) => sum + item.amount, 0);
  const totalRevenueRealized = data.homeRevenues.reduce((sum, item) => {
    const includeRecurringMonthly = item.recurring && item.frequency === "mensal";
    const receivedDate = new Date(item.received_date);
    const includeReceivedThisMonth =
      isSameMonth(item.received_date, compare) && receivedDate <= endOfDay(now);

    return includeRecurringMonthly || includeReceivedThisMonth ? sum + item.value : sum;
  }, 0);

  return {
    totalHomeRevenueMonth: totalRevenueMonth,
    totalHomeExpenseMonth: totalExpenseMonth,
    totalHomePaidMonth: totalPaidMonth,
    totalHomePendingMonth: totalPendingMonth,
    totalHomeBalanceForecast: totalRevenueMonth - totalExpenseMonth,
    totalHomeBalanceRealized: totalRevenueRealized - totalPaidMonth,
    totalHomePayMonth: totalPendingMonth,
    totalHomePayWeek: payables
      .filter((item) => item.status !== "pago")
      .filter((item) => {
        const dueDate = new Date(item.dueDate);
        return dueDate >= now && dueDate <= weekLimit;
      })
      .reduce((sum, item) => sum + item.amount, 0),
    upcomingHomeDueEntries: payables
      .filter((item) => item.status !== "pago")
      .filter((item) =>
        isSameReferenceMonth(item.referenceMonth, compare) || new Date(item.dueDate) >= now
      )
      .sort((a, b) => +new Date(a.dueDate) - +new Date(b.dueDate))
      .slice(0, 5)
  };
}

export function buildDashboardMetrics(data: AppData) {
  const totalSpentMonth = data.expenses
    .filter((item) => isSameMonth(item.date))
    .reduce((sum, item) => sum + item.value, 0);

  const totalHoursMonth = data.timeEntries
    .filter((item) => isSameMonth(item.date))
    .reduce((sum, item) => sum + item.hours, 0);

  const totalEstimatedRevenue = data.projects.reduce(
    (sum, item) => sum + item.estimated_value,
    0
  );
  const totalSpent = data.expenses.reduce((sum, item) => sum + item.value, 0);
  const totalAiCost = data.aiUsages.reduce((sum, item) => sum + item.cost_estimated, 0);
  const totalTimeInvested = data.timeEntries.reduce((sum, item) => sum + item.hours, 0);
  const activeProjects = data.projects.filter(
    (item) => item.status === "em andamento" || item.status === "aguardando cliente"
  );
  const finishedProjects = data.projects.filter((item) => item.status === "finalizado");
  const forecastRevenue = data.projects
    .filter((item) => item.status !== "finalizado" && item.status !== "cancelado")
    .reduce((sum, item) => sum + item.estimated_value, 0);
  const totalReceived = finishedProjects.reduce((sum, item) => sum + item.estimated_value, 0);
  const totalProfit = totalReceived - totalSpent - totalAiCost;

  const expenseSummary = data.expenses.reduce<Record<string, number>>((acc, item) => {
    acc[item.category] = (acc[item.category] || 0) + item.value;
    return acc;
  }, {});

  const homePayments = buildHomeFinanceMetrics(data);

  const recentEntries: RecentEntry[] = [
    ...data.expenses.map((item) => ({
      id: item.id,
      type: "Gasto" as const,
      title: item.title,
      subtitle: item.category,
      date: item.date,
      amountLabel: item.value.toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL"
      })
    })),
    ...data.timeEntries.map((item) => ({
      id: item.id,
      type: "Tempo" as const,
      title: item.project,
      subtitle: item.description,
      date: item.date,
      amountLabel: `${item.hours} h`
    })),
    ...data.projects.map((item) => ({
      id: item.id,
      type: "Projeto" as const,
      title: item.name,
      subtitle: item.client ? `${item.client} • ${item.status}` : item.status,
      date: item.updated_at,
      amountLabel: item.estimated_value.toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL"
      })
    })),
    ...data.aiUsages.map((item) => ({
      id: item.id,
      type: "Uso de IA" as const,
      title: item.tool,
      subtitle: item.purpose,
      date: item.date,
      amountLabel: `${item.time_used} h`
    }))
  ]
    .sort((a, b) => +new Date(b.date) - +new Date(a.date))
    .slice(0, 8);

  const categorySummary = Object.entries(expenseSummary)
    .map(([category, total]) => ({ category, total }))
    .sort((a, b) => b.total - a.total);

  return {
    totalSpentMonth,
    totalHoursMonth,
    totalProjects: data.projects.length,
    totalEstimatedRevenue,
    totalReceived,
    totalSpent,
    totalProfit,
    totalAiCost,
    totalTimeInvested,
    totalActiveProjects: activeProjects.length,
    totalFinishedProjects: finishedProjects.length,
    totalServicesValue: totalEstimatedRevenue,
    forecastRevenue,
    totalHomeRevenueMonth: homePayments.totalHomeRevenueMonth,
    totalHomeExpenseMonth: homePayments.totalHomeExpenseMonth,
    totalHomePaidMonth: homePayments.totalHomePaidMonth,
    totalHomePendingMonth: homePayments.totalHomePendingMonth,
    totalHomeBalanceForecast: homePayments.totalHomeBalanceForecast,
    totalHomeBalanceRealized: homePayments.totalHomeBalanceRealized,
    totalHomePayMonth: homePayments.totalHomePayMonth,
    totalHomePayWeek: homePayments.totalHomePayWeek,
    upcomingHomeDueEntries: homePayments.upcomingHomeDueEntries,
    recentEntries,
    categorySummary
  };
}
