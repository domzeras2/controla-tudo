import { AppData } from "@/lib/types";

const now = new Date();
const iso = (daysAgo: number) => {
  const value = new Date(now);
  value.setDate(now.getDate() - daysAgo);
  return value.toISOString();
};

const dateOnly = (daysAgo: number) => iso(daysAgo).slice(0, 10);

export const mockData: AppData = {
  expenses: [
    {
      id: "exp-1",
      title: "Assinatura ChatGPT Plus",
      value: 99.9,
      category: "IA",
      date: dateOnly(3),
      notes: "Plano principal para uso diário.",
      created_at: iso(3),
      updated_at: iso(3)
    },
    {
      id: "exp-2",
      title: "Hospedagem Vercel Pro",
      value: 64.9,
      category: "Hospedagem",
      date: dateOnly(6),
      notes: "Hospedagem dos projetos ativos.",
      created_at: iso(6),
      updated_at: iso(6)
    },
    {
      id: "exp-3",
      title: "Domínio studioia.com.br",
      value: 39.9,
      category: "Domínio",
      date: dateOnly(10),
      notes: "Renovação anual rateada no mês.",
      created_at: iso(10),
      updated_at: iso(10)
    }
  ],
  timeEntries: [
    {
      id: "time-1",
      project: "Painel de Controle IA",
      hours: 6.5,
      date: dateOnly(1),
      description: "Estrutura base do dashboard e CRUD.",
      created_at: iso(1),
      updated_at: iso(1)
    },
    {
      id: "time-2",
      project: "Site JC Jardins",
      hours: 4.25,
      date: dateOnly(4),
      description: "Ajustes finais de layout e revisão mobile.",
      created_at: iso(4),
      updated_at: iso(4)
    },
    {
      id: "time-3",
      project: "Automação de propostas",
      hours: 2.75,
      date: dateOnly(8),
      description: "Teste de prompts e refinamento do fluxo.",
      created_at: iso(8),
      updated_at: iso(8)
    }
  ],
  projects: [
    {
      id: "proj-1",
      name: "Painel de Controle IA",
      status: "em andamento",
      estimated_value: 6500,
      description: "Sistema pessoal para acompanhar operação, produtividade e custos.",
      created_at: iso(2),
      updated_at: iso(1)
    },
    {
      id: "proj-2",
      name: "Site JC Jardins",
      status: "finalizado",
      estimated_value: 5500,
      description: "Site comercial com painel administrativo e fluxo de orçamento.",
      created_at: iso(18),
      updated_at: iso(5)
    },
    {
      id: "proj-3",
      name: "Automação de propostas",
      status: "ideia",
      estimated_value: 3200,
      description: "Ferramenta para gerar propostas comerciais com apoio de IA.",
      created_at: iso(12),
      updated_at: iso(12)
    }
  ],
  aiUsages: [
    {
      id: "ai-1",
      tool: "Codex",
      purpose: "Criar MVP do painel pessoal",
      time_used: 2.4,
      cost_estimated: 18,
      date: dateOnly(0),
      notes: "Uso focado em estruturação e componentes.",
      created_at: iso(0),
      updated_at: iso(0)
    },
    {
      id: "ai-2",
      tool: "ChatGPT",
      purpose: "Planejamento de escopo e copy",
      time_used: 1.2,
      cost_estimated: 9,
      date: dateOnly(2),
      notes: "Apoio na definição de funcionalidades e organização.",
      created_at: iso(2),
      updated_at: iso(2)
    },
    {
      id: "ai-3",
      tool: "Claude",
      purpose: "Benchmark de dashboard",
      time_used: 0.8,
      cost_estimated: 6,
      date: dateOnly(7),
      notes: "Pesquisa rápida de referências.",
      created_at: iso(7),
      updated_at: iso(7)
    }
  ],
  homeRevenues: [
    {
      id: "rev-1",
      name: "Salário Gabriel",
      value: 4200,
      received_date: dateOnly(2),
      recurring: true,
      frequency: "mensal",
      notes: "Receita principal da casa.",
      created_at: iso(2),
      updated_at: iso(2)
    },
    {
      id: "rev-2",
      name: "Salário Esposa",
      value: 3500,
      received_date: dateOnly(4),
      recurring: true,
      frequency: "mensal",
      notes: "Entrada fixa mensal.",
      created_at: iso(4),
      updated_at: iso(4)
    },
    {
      id: "rev-3",
      name: "Extra",
      value: 600,
      received_date: dateOnly(6),
      recurring: false,
      frequency: "unico",
      notes: "Serviço extra no mês.",
      created_at: iso(6),
      updated_at: iso(6)
    }
  ],
  homeAccounts: [
    {
      id: "acc-1",
      name: "Conta de Luz",
      category: "Luz",
      total_value: 180,
      type: "fixa",
      start_date: dateOnly(12),
      due_day: 12,
      installment_count: 1,
      recurring: true,
      status: "ativa",
      notes: "Conta mensal média.",
      created_at: iso(12),
      updated_at: iso(12)
    },
    {
      id: "acc-2",
      name: "Geladeira",
      category: "Eletrônicos",
      total_value: 850,
      type: "parcelada",
      start_date: dateOnly(18),
      due_day: 18,
      installment_count: 3,
      recurring: false,
      status: "ativa",
      notes: "Compra parcelada em 3x.",
      created_at: iso(18),
      updated_at: iso(18)
    },
    {
      id: "acc-3",
      name: "Mercado especial",
      category: "Mercado",
      total_value: 240,
      type: "avulsa",
      start_date: dateOnly(5),
      due_day: 5,
      installment_count: 1,
      recurring: false,
      status: "ativa",
      notes: "Compra única do mês.",
      created_at: iso(5),
      updated_at: iso(5)
    }
  ],
  homeInstallments: [
    {
      id: "inst-1",
      account_id: "acc-2",
      installment_number: 1,
      installment_total: 3,
      value: 283.33,
      reference_month: dateOnly(18).slice(0, 7),
      due_date: dateOnly(18),
      status: "pendente",
      created_at: iso(18),
      updated_at: iso(18)
    },
    {
      id: "inst-2",
      account_id: "acc-2",
      installment_number: 2,
      installment_total: 3,
      value: 283.33,
      reference_month: "2026-05",
      due_date: "2026-05-18",
      status: "pendente",
      created_at: iso(18),
      updated_at: iso(18)
    },
    {
      id: "inst-3",
      account_id: "acc-2",
      installment_number: 3,
      installment_total: 3,
      value: 283.34,
      reference_month: "2026-06",
      due_date: "2026-06-18",
      status: "pendente",
      created_at: iso(18),
      updated_at: iso(18)
    }
  ],
  homeAccountOccurrences: [
    {
      id: "occ-1",
      account_id: "acc-1",
      reference_month: dateOnly(12).slice(0, 7),
      due_date: dateOnly(12),
      status: "pendente",
      value: 180,
      created_at: iso(12),
      updated_at: iso(12)
    },
    {
      id: "occ-2",
      account_id: "acc-3",
      reference_month: dateOnly(5).slice(0, 7),
      due_date: dateOnly(5),
      status: "pendente",
      value: 240,
      created_at: iso(5),
      updated_at: iso(5)
    }
  ]
};
