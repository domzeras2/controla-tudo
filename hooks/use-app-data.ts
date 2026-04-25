"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  createAiUsage,
  createExpense,
  createHomeAccount,
  createHomeRevenue,
  createProject,
  createTimeEntry,
  deleteAiUsage,
  deleteExpense,
  deleteHomeAccount,
  deleteHomeRevenue,
  deleteProject,
  deleteTimeEntry,
  loadAppData,
  migrateLocalDataToSupabase,
  updateAiUsage,
  updateExpense,
  updateHomeAccount,
  updateHomeAccountOccurrenceStatus,
  updateHomeInstallmentStatus,
  updateHomeRevenue,
  updateProject,
  updateTimeEntry
} from "@/lib/data-source";
import { buildDashboardMetrics } from "@/lib/dashboard";
import {
  AiUsageInput,
  AppData,
  ExpenseInput,
  HomeAccountInput,
  HomePaymentStatus,
  HomeRevenueInput,
  ProjectInput,
  TimeEntryInput
} from "@/lib/types";

const emptyData: AppData = {
  expenses: [],
  timeEntries: [],
  projects: [],
  aiUsages: [],
  homeRevenues: [],
  homeAccounts: [],
  homeInstallments: [],
  homeAccountOccurrences: []
};

export function useAppData() {
  const [data, setData] = useState<AppData>(emptyData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const nextData = await loadAppData();
      setData(nextData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível carregar os dados.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const metrics = useMemo(() => buildDashboardMetrics(data), [data]);

  return {
    data,
    metrics,
    loading,
    error,
    refresh,
    createExpense: async (input: ExpenseInput) => {
      await createExpense(input);
      await refresh();
    },
    updateExpense: async (id: string, input: ExpenseInput) => {
      await updateExpense(id, input);
      await refresh();
    },
    deleteExpense: async (id: string) => {
      await deleteExpense(id);
      await refresh();
    },
    createTimeEntry: async (input: TimeEntryInput) => {
      await createTimeEntry(input);
      await refresh();
    },
    updateTimeEntry: async (id: string, input: TimeEntryInput) => {
      await updateTimeEntry(id, input);
      await refresh();
    },
    deleteTimeEntry: async (id: string) => {
      await deleteTimeEntry(id);
      await refresh();
    },
    createProject: async (input: ProjectInput) => {
      await createProject(input);
      await refresh();
    },
    updateProject: async (id: string, input: ProjectInput) => {
      await updateProject(id, input);
      await refresh();
    },
    deleteProject: async (id: string) => {
      await deleteProject(id);
      await refresh();
    },
    createAiUsage: async (input: AiUsageInput) => {
      await createAiUsage(input);
      await refresh();
    },
    updateAiUsage: async (id: string, input: AiUsageInput) => {
      await updateAiUsage(id, input);
      await refresh();
    },
    deleteAiUsage: async (id: string) => {
      await deleteAiUsage(id);
      await refresh();
    },
    createHomeRevenue: async (input: HomeRevenueInput) => {
      await createHomeRevenue(input);
      await refresh();
    },
    updateHomeRevenue: async (id: string, input: HomeRevenueInput) => {
      await updateHomeRevenue(id, input);
      await refresh();
    },
    deleteHomeRevenue: async (id: string) => {
      await deleteHomeRevenue(id);
      await refresh();
    },
    createHomeAccount: async (input: HomeAccountInput) => {
      await createHomeAccount(input);
      await refresh();
    },
    updateHomeAccount: async (id: string, input: HomeAccountInput) => {
      await updateHomeAccount(id, input);
      await refresh();
    },
    deleteHomeAccount: async (id: string) => {
      await deleteHomeAccount(id);
      await refresh();
    },
    updateHomeInstallmentStatus: async (id: string, status: HomePaymentStatus) => {
      await updateHomeInstallmentStatus(id, status);
      await refresh();
    },
    updateHomeAccountOccurrenceStatus: async (id: string, status: HomePaymentStatus) => {
      await updateHomeAccountOccurrenceStatus(id, status);
      await refresh();
    },
    migrateLocalDataToSupabase: async () => {
      const result = await migrateLocalDataToSupabase();

      if (result.success) {
        await refresh();
      }

      return result;
    }
  };
}
