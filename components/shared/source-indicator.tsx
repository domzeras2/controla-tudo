import { isSupabaseConfigured } from "@/lib/supabase";

export function SourceIndicator() {
  const configured = isSupabaseConfigured();

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/80 px-4 py-3 text-sm text-slate-400 shadow-panel">
      <span className="font-semibold text-slate-100">Fonte de dados:</span>{" "}
      {configured ? "Supabase conectado" : "modo local com dados de exemplo"}
    </div>
  );
}
