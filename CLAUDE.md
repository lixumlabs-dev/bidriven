# CLAUDE.md — BiDriven | BI Full Cycle Platform

> **Bíblia do projeto.** Todos os agentes leem este arquivo antes de qualquer ação.
> Contém: identidade da marca, design system completo, arquitetura técnica, páginas e protocolo de agentes.

---

## 1. O Projeto

**Cliente:** Lixium / Interno
**Segmento:** Business Intelligence — Plataforma Full Cycle de Dados (End-to-End)
**Localização:** Brasil
**Contato:** Tiago
**Site atual:** Novo Projeto

**Objetivo do projeto:**
Construir uma ferramenta completa de Estruturação, Padronização, Elaboração, Consolidação, Construção e Análise de Dados, baseada no framework BI Full Cycle. O foco é automatizar o ciclo de vida dos dados, desde a ingestão até a tomada de decisão, utilizando agentes de IA para amplificar a produtividade.

**Público-alvo:**
- **Data Architects & Engineers:** Profissionais que desenham e constroem a infraestrutura.
- **Analytics Engineers & Analysts:** Profissionais que transformam dados em insights.
- **Data Scientists:** Especialistas em modelos preditivos.
- **Business Stakeholders:** Executivos que buscam decisões baseadas em dados.

---

## 2. Identidade Visual (Techno-Minimalist Enterprise)

| Elemento | Conceito | Detalhes |
|----------|----------|----------|
| **Fundo** | Dark/Sleek | Deep Navy/Slate (#0A0C10) |
| **Cor primária** | Cyber Blue | Eletrizante mas profissional (#00A3FF) |
| **Tom geral** | Minimalista | Foco em legibilidade e clareza de dados |
| **Sotaque Tech** | Glassmorphism | Subtle blurs em cards e menus |

**Premissas de UX:**
- **Fácil de Entender:** Fluxos diretos e navegação intuitiva.
- **Eficiente:** Menos cliques para chegar ao insight.
- **Visualmente Rico:** Micro-animações que guiam a atenção.

---

## 3. Design System — {{NOME_TEMA}}

### 3.1 Paleta de Cores

```css
@theme {
  /* === BASE === */
  --color-bg:              {{COR_FUNDO_PRINCIPAL}};   /* Fundo principal */
  --color-bg-alt:          {{COR_FUNDO_ALTERNADO}};   /* Fundo alternado de seções */
  --color-surface:         {{COR_SURFACE}};            /* Cards, panels, inputs */
  --color-surface-hover:   {{COR_SURFACE_HOVER}};      /* Hover state de cards */

  /* === COR SIGNATURE === */
  --color-primary:         {{COR_PRIMARY}};            /* CTA primário, badges, accents */
  --color-primary-dim:     {{COR_PRIMARY_DIM}};        /* Glow/highlight */
  --color-primary-hover:   {{COR_PRIMARY_HOVER}};      /* Hover state */

  /* === TEXTO === */
  --color-text-primary:    {{COR_TEXTO_PRINCIPAL}};   /* Texto principal */
  --color-text-secondary:  {{COR_TEXTO_SECUNDARIO}};  /* Subtexto */
  --color-text-muted:      {{COR_TEXTO_MUTED}};       /* Labels discretos */

  /* === BORDAS === */
  --color-border:          {{COR_BORDA}};             /* Borda padrão */

  /* === FONTES === */
  --font-heading:  '{{FONTE_TITULOS}}', sans-serif;
  --font-body:     '{{FONTE_CORPO}}', sans-serif;
  --font-mono:     '{{FONTE_MONO}}', monospace;

  /* === ANIMAÇÕES === */
  --animate-float:      float 6s ease-in-out infinite;
  --animate-pulse-glow: pulseGlow 2s cubic-bezier(0.4,0,0.6,1) infinite;
}
```

### 3.2 Tipografia

| Papel | Fonte | Peso | Tracking | Tamanho |
|-------|-------|------|----------|---------|
| H1 principal | {{FONTE_TITULOS}} | 700 | {{TRACKING_H1}} | {{TAMANHO_H1}} |
| H2 seção | {{FONTE_TITULOS}} | 600 | {{TRACKING_H2}} | {{TAMANHO_H2}} |
| Body | {{FONTE_CORPO}} | 400 | normal | {{TAMANHO_BODY}} |
| Label de seção | {{FONTE_MONO}} | 500 | 0.2em uppercase | 11px → 12px |

### 3.3 Componentes Core

**Botão Primário**
```tsx
// Background: bg-[{{COR_PRIMARY}}]
// Hover: bg-[{{COR_PRIMARY_HOVER}}]
// Motion: whileHover scale 1.02 | whileTap scale 0.98
// Efeito relay/glare: radial-gradient segue cursor
```

**Botão Secundário (Ghost)**
```tsx
// Border: border border-white/15 | Hover: border-white/30
// Background: transparent | Hover: bg-white/5
```

**SectionLabel**
```tsx
<div className="flex items-center gap-3 font-mono text-[0.7rem] uppercase tracking-[0.2em] text-[{{COR_PRIMARY}}] mb-8">
  <div className="w-8 h-px bg-current" />
  Label
</div>
```

### 3.4 Animações Padrão

```ts
// ENTRADA (scroll-triggered) — usar em TODAS as seções
const fadeUp = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.8, ease: "easeOut" }
};

// STAGGER (listas de cards)
const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.10 } }
};
const item = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: "easeOut" } }
};
```

---

## 4. Arquitetura Técnica

### 4.1 Stack (Premissa: Cloud-First & Cost-Effective)

| Camada | Tecnologia | Detalhes |
|--------|-----------|--------|
| Cloud Provider | Railway / AWS / Supabase | Infraestrutura Escalável |
| Banco de Dados | PostgreSQL (Managed) | Unified Data Warehouse |
| Ingestão | Python Lambdas / Airbyte Cloud | APIs, Sheets, DBs |
| Transformação | dbt (Cloud/Core) | Modelagem Versionada |
| Orquestração | Dagster Cloud / GitHub Actions | Workflows Automatizados |
| Visualização | Metabase (Cloud) / Custom UI | Dashboards Integrados |
| Frontend | Next.js / React 19 | Interface BiDriven |
| CSS | Tailwind CSS v4 + Framer | Techno-Minimalist Style |
| Auth/Backend | Supabase / Clerk | Controle de Acesso |

### 4.2 Estrutura de Arquivos

```
{{NOME_PASTA_PROJETO}}/
├── public/
│   ├── favicon.ico
│   └── images/
├── src/
│   ├── components/
│   │   ├── ui/             # shadcn/ui base
│   │   ├── shared/         # Navbar, Footer, SectionLabel, GlareButton
│   │   ├── sections/       # Seções da Home page
│   │   │   {{LISTA_SECOES}}
│   │   ├── interactive/    # Componentes interativos
│   │   └── pages/          # Wrappers de página
│   │       {{LISTA_PAGINAS}}
│   ├── styles/
│   │   └── index.css       # @theme tokens + @layer base/components
│   ├── lib/
│   │   └── utils.ts
│   ├── hooks/
│   ├── data/
│   │   {{ARQUIVOS_DATA}}
│   ├── App.tsx
│   └── main.tsx
├── tests/                  # Playwright E2E
├── vite.config.ts
├── tsconfig.json
└── package.json
```

### 4.3 Routing

```
/                    → HomePage
{{LISTA_ROTAS}}
/contact             → ContactPage
```

---

## 5. Páginas e Seções

### 5.1 Home Page — Sequência de Seções

| # | Seção | Fundo | Descrição |
|---|-------|-------|-----------|
| 1 | HeroSection | `{{COR_FUNDO_PRINCIPAL}}` | Full viewport, headline, CTAs |
{{TABELA_SECOES_HOME}}

---

## 6. Regras de Código

### TypeScript
- `strict: true` em tsconfig.json — sem `any`
- Interfaces explícitas para todos os props de componentes
- Não usar `as` casting desnecessário

### Tailwind
- Sem `tailwind.config.js` — só `@theme` no CSS
- Mobile first: classes base → `md:` → `lg:`
- Usar tokens definidos no `@theme`, nunca hardcodar hex

### Componentes
- Um arquivo por componente
- Named exports em todos os componentes de ui/shared
- Default exports em sections e pages
- `data-testid` em todos os elementos interativos críticos

### Acessibilidade
- Todos os `<img>` com `alt` descritivo
- Contrast ratio mínimo 4.5:1 para texto
- `aria-label` em botões icon-only
- Focus rings visíveis
- Navegação por teclado funcional em todos os interativos

### Performance
- Lazy loading para imagens
- Imagens em WebP
- Lighthouse target: >90 em Performance, Accessibility, Best Practices, SEO

---

## 7. Variáveis de Ambiente

```env
# .env.local
{{LISTA_ENV_VARS}}
```

---

## 8. Protocolo de Agentes — BiDriven "Assembly"

### Fluxo Obrigatório

```
BiDriven Team (pedido)
    ↓
Orchestrator → Reúne a "Assembleia" de Agentes
    ↓
Assembleia (Design + Engineering + Data) → Decisão sobre novas skills/agentes
    ↓
Executores (Frontend, DataEngineer, AnalyticsEngineer, etc.)
    ↓
QAEngineer → Revisa código e qualidade dos dados
    ↓
Aprovação do Tiago (via Questões de Múltipla Escolha)
    ↓
TestEngineer → E2E + Data Validation
```

### Roster de Agentes (Framework + Novos)

| Agente | Especialidade | Status |
|--------|--------------|--------|
| **Orchestrator** | Regente e Facilitador da Assembleia | Ativo |
| **DataArchitectAgent** | Visão macro de infra e Data Mesh | [A CRIAR] |
| **DataEngineerAgent** | Pipelines ETL/ELT e Observabilidade | [A CRIAR] |
| **AnalyticsEngineerAgent** | Modelagem dbt e Transformação | [A CRIAR] |
| **FrontendEngineer** | Interface UI/UX Pro Max | Ativo |
| **QAEngineer** | Revisão de Código e Integridade | Ativo |
| **CopywriterAgent** | Texto e Tom de Voz BiDriven | Ativo |

### Como invocar cada agente

```
// Orchestrator (tarefa grande ou indefinida)
"Aja como o Orchestrator (leia agents/Orchestrator.md e este CLAUDE.md).
Quero [feature]. O que afeta? Quem faz? Qual a ordem?"

// FrontendEngineer (componente ou seção)
"Aja como o FrontendEngineer (leia agents/FrontendEngineer.md e CLAUDE.md).
Construa: [ComponentName]. Tokens: design system do projeto."

// CopywriterAgent (textos)
"Aja como o CopywriterAgent (leia agents/CopywriterAgent.md e CLAUDE.md).
Escreva: [seção]. Tom: [tom definido no TomDeVoz.md]."

// QAEngineer (revisão após build)
"Aja como o QAEngineer (leia agents/QAEngineer.md e CLAUDE.md).
Revise: [componente]. Verificar: TypeScript, tokens, acessibilidade, mobile."

// TestEngineer (E2E após aprovação)
"Aja como o TestEngineer (leia agents/TestEngineer.md e CLAUDE.md).
Teste: [feature]. Mobile: 375px. Browser: Chromium."

// InfraEngineer (deploy)
"Aja como o InfraEngineer (leia agents/InfraEngineer.md e CLAUDE.md).
Configure: Vercel deploy. Branch main → produção. Env vars: ver seção 7."
```

---

## 9. Checklist de Qualidade (Pré-entrega)

- [ ] TypeScript compila sem erros (`tsc --noEmit`)
- [ ] Todos os tokens de cor vêm do `@theme` (sem hex hardcodado)
- [ ] Mobile 375px: nada cortado, CTAs acessíveis
- [ ] Tablet 768px: layout fluido
- [ ] Desktop 1280px: max-width contido, espaçamentos corretos
- [ ] Contrast ratio aprovado para texto principal e muted
- [ ] Animações com `viewport={{ once: true }}`
- [ ] `data-testid` nos elementos críticos
- [ ] Imagens com `alt` descritivo
- [ ] Nenhum console.error no browser
- [ ] Lighthouse Performance > 90
