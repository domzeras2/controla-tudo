insert into public.expenses (title, value, category, date, notes)
values
  ('Assinatura ChatGPT Plus', 99.90, 'IA', current_date - interval '3 day', 'Plano principal para uso diário.'),
  ('Hospedagem Vercel Pro', 64.90, 'Hospedagem', current_date - interval '6 day', 'Hospedagem dos projetos ativos.'),
  ('Domínio studioia.com.br', 39.90, 'Domínio', current_date - interval '10 day', 'Renovação anual rateada no mês.');

insert into public.time_entries (project, hours, date, description)
values
  ('Painel de Controle IA', 6.50, current_date - interval '1 day', 'Estrutura base do dashboard e CRUD.'),
  ('Site JC Jardins', 4.25, current_date - interval '4 day', 'Ajustes finais de layout e revisão mobile.'),
  ('Automação de propostas', 2.75, current_date - interval '8 day', 'Teste de prompts e refinamento do fluxo.');

insert into public.projects (name, status, estimated_value, description)
values
  ('Painel de Controle IA', 'em andamento', 6500.00, 'Sistema pessoal para acompanhar operação, produtividade e custos.'),
  ('Site JC Jardins', 'finalizado', 5500.00, 'Site comercial com painel administrativo e fluxo de orçamento.'),
  ('Automação de propostas', 'ideia', 3200.00, 'Ferramenta para gerar propostas comerciais com apoio de IA.');

insert into public.ai_usage_entries (tool, purpose, time_used, cost_estimated, date, notes)
values
  ('Codex', 'Criar MVP do painel pessoal', 2.40, 18.00, current_date, 'Uso focado em estruturação e componentes.'),
  ('ChatGPT', 'Planejamento de escopo e copy', 1.20, 9.00, current_date - interval '2 day', 'Apoio na definição de funcionalidades e organização.'),
  ('Claude', 'Benchmark de dashboard', 0.80, 6.00, current_date - interval '7 day', 'Pesquisa rápida de referências.');
