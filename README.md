# Checklist App

Aplicativo web para gerar e gerenciar checklists organizados por categorias. Suporta geração por IA, importação de PDF, planilha, markdown e criação manual.

## Funcionalidades

### Criação de checklists

| Modo | Como funciona |
|------|--------------|
| **Gerar com IA** | Descreva uma tarefa em texto livre; a IA gera um checklist completo com categorias |
| **Extrair PDF/texto** | Faça upload de um PDF ou cole um texto e informe o que extrair |
| **Planilha / CSV** | Importe um arquivo `.csv`, `.xlsx` ou `.xls` e mapeie as colunas de item e categoria |
| **Manual** | Adicione itens um a um e dê um título ao checklist |
| **Markdown** | Cole ou escreva um checklist em Markdown com headings `##` e `###` como categorias |

### Gerenciamento de checklists

- Barra de progresso mostrando itens concluídos vs. total
- Marcar / desmarcar itens individualmente com feedback otimista
- Adicionar novos itens a um checklist existente, com seleção de categoria
- Deletar itens individualmente
- Deletar o checklist inteiro
- Categorias hierárquicas: subcategorias separadas por ` › ` são agrupadas visualmente sob o pai

### Navegação

- Sidebar com lista de checklists e progresso de cada um (tablet e desktop)
- Barra de navegação inferior em mobile com ícones; a aba ativa exibe o rótulo
- Dashboard com estatísticas (total de checklists, itens gerados, itens concluídos) e checklists recentes

### Autenticação

- Login via Google OAuth (Supabase Auth)
- Todos os dados filtrados por `user_id` — cada usuário vê apenas os seus

### Limites e segurança

- Máximo de **20 checklists por hora** por usuário nos modos IA e extração
- Row-Level Security (RLS) ativa no Supabase
- Conteúdo enviado à IA truncado em 16 000 caracteres

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Framework | Next.js 16 (App Router) |
| UI | React 19 + Tailwind v4 |
| Linguagem | TypeScript |
| Banco de dados / Auth | Supabase (PostgreSQL + Google OAuth) |
| IA | Groq API — modelo `llama-3.3-70b-versatile` |
| PDF client-side | pdfjs-dist |
| Planilhas client-side | xlsx |
| Notificações | Sonner |
| Monitoramento de erros | Sentry |
| Testes | Vitest + @vitest/coverage-v8 |

## Comandos

```bash
npm run dev          # servidor de desenvolvimento em localhost:3001
npm run build        # build de produção
npm run lint         # ESLint — corrija todos os erros antes de commitar
npm test             # roda todos os testes (vitest)
npm run test:watch   # modo watch
npm run test:coverage  # relatório de cobertura (meta: ≥80%)
```

## Variáveis de ambiente

Crie um arquivo `.env.local` na raiz com:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
GROQ_API_KEY=
NEXT_PUBLIC_APP_URL=

# Sentry (opcional para source maps em build)
SENTRY_DSN=
SENTRY_ORG=
SENTRY_PROJECT=
```

## Estrutura de dados

Duas tabelas no Supabase:

- **`checklists`** — `id, title, prompt, user_id, created_at`
- **`checklist_items`** — `id, checklist_id, user_id, text, category, position, checked`

O campo `category` suporta hierarquia com o separador ` › ` (ex: `"Documentos › Passaporte"`).
