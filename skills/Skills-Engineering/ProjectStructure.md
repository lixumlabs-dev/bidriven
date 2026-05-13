# Skill: Estrutura do Projeto — Lixium Framework

## Estrutura Padrão de Repositório

```
{{NOME_DO_PROJETO}}/
├── CLAUDE.md                    # Contexto principal — lido por todos os agentes
├── agents/                      # Definições dos agentes (copiados do framework)
│   ├── Orchestrator.md
│   ├── FrontendEngineer.md
│   ├── CopywriterAgent.md
│   ├── QAEngineer.md
│   ├── TestEngineer.md
│   ├── InfraEngineer.md
│   └── COMO-USAR-OS-AGENTES.md
├── skills/                      # Base de conhecimento (copiados + customizados)
│   ├── Skills-Frontend/
│   │   ├── DesignSystem.md      ← customizar com tokens do projeto
│   │   ├── TailwindV4.md
│   │   └── FramerMotion.md
│   ├── Skills-Copy/
│   │   ├── TomDeVoz.md          ← customizar com voz da marca
│   │   └── CopyFramework.md     ← preencher com textos aprovados
│   ├── Skills-QA/
│   │   └── QAChecklist.md
│   ├── Skills-Test/
│   │   └── PlaywrightSetup.md
│   └── Skills-Engineering/
│       └── ProjectStructure.md
├── .claude/
│   └── skills/
│       └── ui-ux-pro-max/       # Skill de design intelligence
│           ├── SKILL.md
│           ├── scripts/
│           └── data/
├── {{PASTA_DO_APP}}/            # Código da aplicação (ex: procar-web/, my-app/)
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ui/              # shadcn/ui base
│   │   │   ├── shared/          # Navbar, Footer, SectionLabel, Buttons
│   │   │   ├── sections/        # Seções da home page
│   │   │   ├── interactive/     # Componentes interativos
│   │   │   └── pages/           # Page-level wrappers
│   │   ├── styles/
│   │   │   └── index.css        # @theme tokens + @layer base/components
│   │   ├── lib/
│   │   │   └── utils.ts         # cn() helper + utilities
│   │   ├── hooks/
│   │   ├── data/                # Dados estáticos (services, testimonials, etc.)
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── tests/                   # Playwright E2E
│   ├── vite.config.ts
│   ├── tsconfig.json
│   ├── playwright.config.ts
│   └── package.json
└── .env.local                   # Variáveis locais (nunca commitar)
```

## Convenções de Nomenclatura

| Tipo | Convenção | Exemplo |
|------|-----------|---------|
| Componente | PascalCase | `HeroSection.tsx` |
| Hook | camelCase com `use` | `useScrolled.ts` |
| Context | PascalCase + Context | `AppContext.tsx` |
| Skill | PascalCase | `TomDeVoz.md` |
| Teste E2E | kebab-case.spec.ts | `contact.spec.ts` |
| CSS util | kebab-case | `.glass-panel` |
| data-testid | kebab-case | `hero-cta-primary` |

## Deploy Padrão

```
Frontend → Vercel
  - Branch: main → produção automática
  - Branch: dev/* → preview URL

Backend (quando existir) → Railway
  - Dockerfile na raiz do /backend
  - Health check: GET /health → 200
```

## Variáveis de Ambiente

```bash
# .env.local (não commitar)
VITE_API_URL=http://localhost:8000
# ... demais vars do projeto

# Vercel (produção)
VITE_API_URL=https://{{BACKEND_URL}}
# ... mesmas vars com valores de produção
```

## Comandos Úteis

```bash
npm run dev          # servidor local
npm run build        # build de produção
npm run preview      # preview do build
tsc --noEmit         # checar TypeScript sem buildar
npx playwright test  # rodar testes E2E
```
