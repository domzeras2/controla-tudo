"use client";

import type { FormEvent, ReactNode } from "react";
import { ActionButton } from "@/components/shared/action-button";

type FormModalProps = {
  open: boolean;
  title: string;
  description: string;
  onClose: () => void;
  children: ReactNode;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  submitLabel: string;
  submitting?: boolean;
};

export function FormModal({
  open,
  title,
  description,
  onClose,
  children,
  onSubmit,
  submitLabel,
  submitting = false
}: FormModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/80 p-4 backdrop-blur-sm sm:items-center">
      <div className="w-full max-w-2xl rounded-[28px] border border-slate-700 bg-[#1e293b] shadow-[0_20px_60px_rgba(2,6,23,0.55)]">
        <div className="border-b border-slate-700 px-5 py-4 sm:px-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-xl font-semibold text-slate-50">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-400">{description}</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-slate-700 bg-slate-900/70 p-2 text-slate-400 transition hover:bg-white/[0.03] hover:text-slate-200"
              aria-label="Fechar"
            >
              ×
            </button>
          </div>
        </div>

        <form onSubmit={onSubmit} className="space-y-5 px-5 py-5 sm:px-6">
          {children}
          <div className="flex flex-col-reverse gap-3 border-t border-slate-700 pt-5 sm:flex-row sm:justify-end">
            <ActionButton type="button" variant="secondary" onClick={onClose}>
              Cancelar
            </ActionButton>
            <ActionButton type="submit" disabled={submitting}>
              {submitting ? "Salvando..." : submitLabel}
            </ActionButton>
          </div>
        </form>
      </div>
    </div>
  );
}
