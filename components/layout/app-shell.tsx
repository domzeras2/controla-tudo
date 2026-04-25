"use client";

import type { ReactNode } from "react";
import type { Route } from "next";
import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { BrandLogo } from "@/components/shared/brand-logo";

const navigation: Array<{ href: Route; label: string; icon: string }> = [
  { href: "/", label: "Dashboard", icon: "⌂" },
  { href: "/gastos", label: "Gastos", icon: "−" },
  { href: "/tempo", label: "Tempo", icon: "◷" },
  { href: "/projetos", label: "Projetos", icon: "▣" },
  { href: "/uso-ia", label: "Uso de IA", icon: "✦" },
  { href: "/financas-da-casa", label: "Finanças da Casa", icon: "⌘" }
];

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-100 lg:grid lg:grid-cols-[300px_minmax(0,1fr)]">
      <aside className="border-b border-slate-700/70 bg-[#020617] px-5 py-5 text-white lg:min-h-screen lg:border-b-0 lg:border-r lg:border-slate-800 lg:px-6 lg:py-8">
        <div className="rounded-[30px] border border-slate-800 bg-[linear-gradient(180deg,rgba(30,41,59,0.96),rgba(15,23,42,0.98))] p-5 shadow-[0_24px_60px_rgba(2,6,23,0.45)]">
          <BrandLogo />
          <p className="mt-4 text-sm leading-6 text-slate-400">
            Seu painel moderno para acompanhar caixa, produtividade, serviços e ferramentas de IA.
          </p>
        </div>

        <nav className="mt-5 grid gap-2 lg:mt-8">
          {navigation.map((item) => {
            const active = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={clsx(
                  "flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm font-medium transition",
                  active
                    ? "border-brand-500/50 bg-brand-500/20 text-slate-50 shadow-[0_16px_40px_rgba(59,130,246,0.18)]"
                    : "border-transparent text-slate-400 hover:border-slate-700 hover:bg-slate-900/70 hover:text-slate-50"
                )}
              >
                <span
                  className={clsx(
                    "flex h-8 w-8 items-center justify-center rounded-xl text-sm font-semibold",
                    active ? "bg-brand-500 text-white" : "bg-slate-900 text-slate-300"
                  )}
                >
                  {item.icon}
                </span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-5 rounded-[28px] border border-slate-800 bg-slate-900/80 p-5 text-sm text-slate-300 lg:mt-auto">
          <p className="font-semibold text-slate-50">App em modo escuro</p>
          <p className="mt-2 leading-6 text-slate-400">
            Controle tudo em um visual mais limpo, moderno e focado em leitura rápida.
          </p>
        </div>
      </aside>

      <main className="min-w-0 px-4 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
        <div className="mb-4 flex items-center justify-between rounded-[28px] border border-slate-800 bg-slate-900/80 px-4 py-4 shadow-[0_18px_50px_rgba(2,6,23,0.38)] sm:px-5">
          <BrandLogo compact className="sm:hidden" />
          <div className="hidden sm:flex">
            <BrandLogo compact />
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
            Dashboard moderno
          </div>
        </div>
        {children}
      </main>
    </div>
  );
}
