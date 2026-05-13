# Como Usar os Agentes — Lixium Framework

## O que são os Agentes?

Cada agente é um especialista com papel, skills e protocolo definidos. Ao invocar um agente,
você instrui o Claude Code a ler o arquivo do agente e agir como aquele especialista,
com o contexto correto e os padrões do projeto.

---

## Fluxo Obrigatório

```
Pedido do cliente
    ↓
Orchestrator → lê CLAUDE.md + arquivos de agente + skills relevantes
    ↓
Assembly → briefing para todos os envolvidos
    ↓
Agente Executor (Frontend / Copywriter / Infra)
    ↓
QAEngineer → revisão de código (antes de apresentar para aprovação)
    ↓
Aprovação
    ↓
TestEngineer → testes E2E + mobile + acessibilidade
```

---

## Invocando Cada Agente

### Orchestrator — O Regente
Use quando não souber qual agente acionar, ou quando a tarefa é grande/multiagente.

```
Aja como o Orchestrator (leia agents/Orchestrator.md e CLAUDE.md).

Quero implementar [feature]. O que isso afeta? Quem faz? Qual a ordem?
```

---

### Frontend Engineer — O Construtor
Use para componentes React, seções, animações, componentes interativos.

```
Aja como o FrontendEngineer (leia agents/FrontendEngineer.md e CLAUDE.md).

Construa: [ComponentName].
Modo: [conforme design system do projeto].
Copy: [textos aprovados ou indicar CopyFramework.md].
Animações: [entrada sequencial / stagger / nenhuma].
```

---

### Copywriter Agent — O Escritor
Use para headlines, sub-headlines, textos de cards, CTAs, formulários.

```
Aja como o CopywriterAgent (leia agents/CopywriterAgent.md e CLAUDE.md).

Escreva: [tipo de texto] para [seção].
Idioma: [conforme CLAUDE.md].
Tom: [conforme TomDeVoz.md].
Máximo: [restrição de espaço, se houver].
```

---

### QA Engineer — O Porteiro
Invoque APÓS qualquer entrega de código, ANTES de apresentar para aprovação.

```
Aja como o QAEngineer (leia agents/QAEngineer.md e CLAUDE.md).

Revise o código de [componente/feature].
Verifique: TypeScript, tokens do design system, acessibilidade, mobile-first.
```

---

### Test Engineer — O Validador
Invoque APÓS a aprovação para testar a feature no browser.

```
Aja como o TestEngineer (leia agents/TestEngineer.md e CLAUDE.md).

Execute a bateria de testes de [feature]:
- Caminho feliz
- Casos de borda: [descrever]
- Mobile 375px
- Console limpo
```

---

### Infra Engineer — O Deploy
Use para configurar Vercel, Railway, variáveis de ambiente, domínio.

```
Aja como o InfraEngineer (leia agents/InfraEngineer.md e CLAUDE.md).

Configure: [deploy / env var / domínio].
Plataforma: [Vercel / Railway].
Vars necessárias: [conforme CLAUDE.md seção 7].
```

---

## Tabela de Decisão Rápida

| Você quer... | Use este agente |
|---|---|
| Construir componente, seção ou interativo | FrontendEngineer |
| Escrever ou revisar textos do site | CopywriterAgent |
| Revisar código antes de apresentar | QAEngineer |
| Testar feature após aprovação | TestEngineer |
| Configurar deploy ou variáveis | InfraEngineer |
| Tarefa grande / não sabe qual agente | **Orchestrator** |

---

## Dica: Contexto é Tudo

**Ruim:**
> "Cria o hero"

**Bom:**
> "Aja como FrontendEngineer. Construa a seção Hero com o design system do CLAUDE.md.
> Copy: headline '[texto aprovado]' + sub '[texto aprovado]' + 2 CTAs (primário e ghost).
> Animações de entrada sequencial por elemento com delay 0, 0.1, 0.18, 0.3.
> Botão primário com relay/glare."

---

## Como o Assembly Funciona

Quando o Orchestrator monta o assembly, ele escreve um briefing antes de chamar os executores:

```markdown
## Assembly — [Nome da Feature]

**O que foi pedido:** [parafrasear]

**Contexto:**
- Seção: [qual parte do site]
- Modo visual: [conforme design system]
- Copy: [fonte dos textos]

**FrontendEngineer precisa saber:**
- [instruções específicas de implementação]

**CopywriterAgent precisa saber:** (se aplicável)
- [instruções de copy]

**QAEngineer vai revisar:**
- [o que checar especificamente]

**Critério de aprovação:** [o que deve estar OK]
```
