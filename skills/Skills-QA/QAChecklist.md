# Skill: QA Checklist — Lixium Framework

Referência completa para o QAEngineer usar em toda revisão de código.

## TypeScript
- [ ] Nenhum `any` explícito ou implícito
- [ ] Todas as props têm interface declarada e nomeada
- [ ] Handlers de evento: `React.MouseEvent<HTMLElement>`, `React.ChangeEvent<HTMLInputElement>`
- [ ] Sem `as` desnecessário (type casting suspeito)
- [ ] Return types explícitos em funções que retornam JSX
- [ ] Sem variáveis declaradas e não usadas

## Design System
- [ ] Nenhuma cor hex hardcoded que não seja token do `@theme`
- [ ] Tokens de tipografia corretos: heading, body, mono conforme CLAUDE.md
- [ ] Glassmorphism usa variáveis CSS — não improvisa valores
- [ ] Relay/glare nos botões primários seguindo o padrão definido

## Framer Motion
- [ ] `whileInView` + `viewport={{ once: true }}` em animações de scroll
- [ ] `AnimatePresence` onde há renderização condicional (key único obrigatório)
- [ ] Sem `animate` puro em elementos que devem animar só ao entrar
- [ ] `layoutId` usado com moderação — tem custo

## Acessibilidade
- [ ] Botões sem texto visível têm `aria-label` descritivo
- [ ] Imagens decorativas têm `alt=""`; imagens informativas têm alt descritivo
- [ ] Elementos interativos customizados têm `role` correto
- [ ] `tabIndex` não negativo em elementos que devem ser focáveis
- [ ] Contraste: texto sobre fundo mínimo 4.5:1, texto grande 3:1
- [ ] Focus rings visíveis para navegação por teclado

## Idioma / Copy
- [ ] Todos os `placeholder` no idioma definido no CLAUDE.md
- [ ] Todos os `aria-label` no idioma definido
- [ ] Mensagens de erro/validação no idioma correto com acentuação
- [ ] Sem mistura de idiomas em texto visível (exceto nomes próprios de tecnologia)
- [ ] Botões e CTAs no idioma correto

## Segurança
- [ ] Sem `console.log` com dados do usuário ou respostas de API
- [ ] Sem chaves de API ou URLs de produção hardcoded no código
- [ ] Sem `dangerouslySetInnerHTML` sem sanitização
- [ ] `VITE_*` vars usadas apenas no frontend (nunca segredos sensíveis)
- [ ] Sem dados privados expostos em props desnecessariamente

## Responsividade
- [ ] Classes Tailwind mobile-first em todos os componentes
- [ ] Layout não quebra em 375px (iPhone SE)
- [ ] Espaçamentos: `px-6 md:px-14 lg:px-24`
- [ ] Typography: `text-3xl md:text-5xl lg:text-7xl` (nunca fixo em tamanho grande)
- [ ] Elementos interativos acessíveis por touch (min 44×44px)

## Performance
- [ ] Imagens com `loading="lazy"` quando abaixo do fold
- [ ] Sem `useEffect` sem cleanup quando usa setTimeout/Observer
- [ ] Rotas carregadas com `React.lazy` + `Suspense`
- [ ] Sem re-renders desnecessários em componentes pesados

## data-testid
- [ ] Botões de CTA principais têm `data-testid`
- [ ] Formulários e campos críticos têm `data-testid`
- [ ] Elementos interativos que serão testados E2E têm `data-testid`
