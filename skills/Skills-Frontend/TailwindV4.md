# Skill: Tailwind CSS v4

## 1. Configuração (Vite Plugin — sem tailwind.config.js)

```ts
// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
})
```

## 2. Definição de Tema no CSS (`src/index.css`)

```css
@import "tailwindcss";

@theme {
  /* Substituir pelos tokens do CLAUDE.md do projeto */
  --color-bg:              #080808;
  --color-bg-alt:          #0F0F0F;
  --color-surface:         #161616;
  --color-surface-hover:   #1E1E1E;
  --color-primary:         #E52222;  /* exemplo */
  --color-primary-hover:   #FF3333;  /* exemplo */
  --color-text-primary:    rgba(255,255,255,0.95);
  --color-text-secondary:  rgba(255,255,255,0.65);
  --color-text-muted:      rgba(255,255,255,0.35);
  --color-border:          rgba(255,255,255,0.06);

  /* Fontes (substituir pelos do projeto) */
  --font-heading: 'Outfit', sans-serif;
  --font-body:    'Inter', sans-serif;
  --font-mono:    'IBM Plex Mono', monospace;

  /* Animações */
  --animate-float:      float 6s ease-in-out infinite;
  --animate-pulse-glow: pulseGlow 2s cubic-bezier(0.4,0,0.6,1) infinite;
  --animate-scroll:     scrollLeft 30s linear infinite;
}

@layer base {
  @keyframes float {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-10px); }
  }

  @keyframes pulseGlow {
    0%, 100% { opacity: 0.8; }
    50% { opacity: 0.3; }
  }

  @keyframes scrollLeft {
    from { transform: translateX(0); }
    to { transform: translateX(-50%); }
  }

  * { box-sizing: border-box; }
  body { font-family: var(--font-body); }
  h1, h2, h3 { font-family: var(--font-heading); }
}

@layer components {
  .section-padding { @apply px-6 py-24 md:px-14 lg:px-24 lg:py-32; }
  .container-max  { @apply max-w-7xl mx-auto; }
  .glass-panel {
    @apply backdrop-blur-xl border rounded-2xl;
    background: color-mix(in srgb, var(--color-surface) 60%, transparent);
    border-color: var(--color-border);
  }
}
```

## 3. Uso nas Classes

```tsx
// Cores via tokens
<div className="bg-[var(--color-bg)] text-[var(--color-text-primary)]" />
<div className="border border-[var(--color-border)]" />

// Ou com classes geradas pelo @theme (Tailwind v4 gera automaticamente)
<div className="bg-bg text-text-primary border-border" />

// Fontes
<h1 className="font-heading tracking-tighter" />
<p className="font-body font-light leading-relaxed" />
<span className="font-mono uppercase tracking-widest" />

// Animações
<div className="animate-float" />
<div className="animate-pulse-glow" />
```

## 4. Não Usar

- `tailwind.config.js` — configuração agora é só no CSS via `@theme`
- `@apply` em excesso — preferir classes inline no JSX
- `style={{}}` inline quando existir equivalente Tailwind
- Valores hex hardcoded fora do `@theme`
