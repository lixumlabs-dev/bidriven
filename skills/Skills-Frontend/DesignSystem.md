# Skill: Design System — Template

> **Customizar por projeto.** Substituir todos os `{{PLACEHOLDER}}` pelos valores reais
> e mover este arquivo para `skills/Skills-Frontend/DesignSystem.md` do novo projeto.

---

## 1. Filosofia Visual

{{FILOSOFIA_VISUAL}}

Exemplo: "Ultra-dark premium — autoridade técnica, contraste preciso, fundo void com acento signature"

Regras:
- Nunca hardcodar cores que não sejam tokens do `@theme`
- Cada seção tem um fundo definido — não misturar

---

## 2. Tokens de Cor

```css
@theme {
  /* BASE */
  --color-bg:             {{COR_FUNDO_PRINCIPAL}};
  --color-bg-alt:         {{COR_FUNDO_ALTERNADO}};
  --color-surface:        {{COR_SURFACE}};
  --color-surface-hover:  {{COR_SURFACE_HOVER}};

  /* SIGNATURE */
  --color-primary:        {{COR_PRIMARY}};
  --color-primary-dim:    {{COR_PRIMARY_DIM}};
  --color-primary-hover:  {{COR_PRIMARY_HOVER}};

  /* TEXT */
  --color-text-primary:   {{COR_TEXTO_PRINCIPAL}};
  --color-text-secondary: {{COR_TEXTO_SECUNDARIO}};
  --color-text-muted:     {{COR_TEXTO_MUTED}};

  /* BORDERS */
  --color-border:         {{COR_BORDA}};
  --color-border-md:      {{COR_BORDA_MEDIA}};
}
```

---

## 3. Tipografia

| Papel | Fonte | Peso | Tracking |
|-------|-------|------|----------|
| Títulos H1/H2 | {{FONTE_TITULOS}} | 600–700 | {{TRACKING_TITULOS}} |
| Corpo | {{FONTE_CORPO}} | 300–400 | normal |
| Labels/Mono | {{FONTE_MONO}} | 400–600 | 0.12em–0.2em uppercase |

---

## 4. Componentes-Chave

### GlassCard
```tsx
className="bg-[var(--color-surface)]/60 backdrop-blur-xl border border-[var(--color-border)] rounded-2xl"
// Hover: border-primary/15 + glow interno radial primary/5
```

### Section Label
```tsx
<div className="flex items-center gap-3 font-mono text-[0.7rem] uppercase tracking-[0.2em] text-primary mb-8">
  <div className="w-8 h-px bg-current" />
  Label
</div>
```

### GlareButton (primário)
```tsx
// Efeito relay: radial-gradient segue cursor dentro do botão
// Background: bg-primary | Hover: bg-primary-hover
// Glare: radial-gradient circle at position, rgba(255,255,255,0.15)
// Motion: whileHover scale 1.02 | whileTap scale 0.98
```

### GhostButton (secundário)
```tsx
// Border: border border-white/15 | Hover: border-white/30
// Background: transparent | Hover: bg-white/5
```

---

## 5. Efeito Relay/Glare nos Botões

```tsx
const [position, setPosition] = useState({ x: 0, y: 0 });
const [isHovered, setIsHovered] = useState(false);
const ref = useRef<HTMLButtonElement>(null);

const handleMouseMove = (e: React.MouseEvent) => {
  const rect = ref.current!.getBoundingClientRect();
  setPosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
};

{isHovered && (
  <div
    className="pointer-events-none absolute inset-0 z-0"
    style={{
      background: `radial-gradient(100px circle at ${position.x}px ${position.y}px, rgba(255,255,255,0.15), transparent 40%)`
    }}
  />
)}
```

---

## 6. Animações Padrão

```ts
// Entrada ao entrar na viewport
const fadeUp = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.8, ease: "easeOut" }
};

// Float para badges/ícones em destaque
// @keyframes: translateY(0) → translateY(-10px) → translateY(0), 6s ease-in-out infinite

// PulseGlow para indicadores
// @keyframes: opacity 0.8 → 0.3 → 0.8, 2s cubic-bezier(0.4,0,0.6,1) infinite
```

---

## 7. Sequência de Seções

Definir a alternância de fundos conforme as seções do projeto:

```
Seção 1 → bg-[var(--color-bg)]
Seção 2 → bg-[var(--color-bg-alt)]
Seção 3 → bg-[var(--color-bg)]
...
Footer  → bg-[var(--color-bg)]
```
