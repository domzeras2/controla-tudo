# Painel de Controle IA

MVP pessoal para acompanhar:

- gastos
- tempo investido
- projetos
- uso de ferramentas de IA

O projeto foi estruturado com foco em clareza, crescimento futuro e funcionamento real desde a versão 1.

## Stack

- Next.js 14
- TypeScript
- Tailwind CSS
- Supabase

## O que esta versao entrega

- layout responsivo com menu lateral
- dashboard com cards de resumo
- tabela de lançamentos recentes
- resumo de gastos por categoria
- CRUD completo de:
  - gastos
  - tempo
  - projetos
  - uso de IA
- dados de exemplo para testes
- modo local pronto para uso
- integração preparada para Supabase sem autenticação

## Como funciona a persistencia

O sistema funciona de duas formas:

1. Sem variáveis do Supabase:
   - usa `localStorage`
   - carrega dados de exemplo automaticamente
   - ideal para testar rápido

2. Com Supabase configurado:
   - usa as tabelas reais do banco
   - executa o CRUD direto no Supabase

## Instalacao

```bash
npm install
```

## Execucao local

```bash
npm run dev
```

Abra:

```bash
http://localhost:3000
```

## Configuracao do Supabase

1. Crie um projeto no Supabase.
2. Copie `.env.example` para `.env.local`.
3. Preencha:

```env
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

4. Rode o SQL de schema:

- arquivo: `supabase/schema.sql`

5. Opcionalmente rode o seed:

- arquivo: `supabase/seed.sql`

## Estrutura principal

```text
app/
  page.tsx
  gastos/page.tsx
  tempo/page.tsx
  projetos/page.tsx
  uso-ia/page.tsx
components/
  layout/
  pages/
  shared/
hooks/
  use-app-data.ts
lib/
  data-source.ts
  dashboard.ts
  format.ts
  mock-data.ts
  supabase.ts
  types.ts
supabase/
  schema.sql
  seed.sql
```

## Tabelas criadas no banco

- `expenses`
- `time_entries`
- `projects`
- `ai_usage_entries`

Todas usam nomes simples e incluem `id`, `created_at` e `updated_at` quando faz sentido.

## Proximos passos sugeridos

- adicionar autenticação com Supabase Auth
- criar filtros por período
- relacionar tempo com projetos por `project_id`
- criar gráficos no dashboard
- adicionar paginação e busca
- separar repositórios por entidade

## Observacoes

- Esta primeira versao prioriza simplicidade e funcionamento.
- O modo local facilita demonstração e validação sem depender de banco.
- Quando o Supabase estiver configurado, o app passa a operar com dados reais.
