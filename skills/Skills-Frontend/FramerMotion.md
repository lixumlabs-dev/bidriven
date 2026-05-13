# Skill: Framer Motion — Padrões Lixium Framework

## 1. Animação de Entrada (Scroll-Triggered)

Padrão para todas as seções e componentes que entram ao rolar:

```tsx
import { motion } from "framer-motion";

<motion.div
  initial={{ opacity: 0, y: 30 }}
  whileInView={{ opacity: 1, y: 0 }}
  viewport={{ once: true }}
  transition={{ duration: 0.8, ease: "easeOut" }}
>
  {/* conteúdo */}
</motion.div>
```

Para stagger em listas de cards:
```tsx
const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12 } }
};

const item = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" } }
};

<motion.ul variants={container} initial="hidden" whileInView="show" viewport={{ once: true }}>
  {items.map(i => <motion.li key={i} variants={item}>{i}</motion.li>)}
</motion.ul>
```

---

## 2. Navigation Slide-Down

```tsx
<motion.nav
  initial={{ y: -100 }}
  animate={{ y: 0 }}
  transition={{ duration: 0.8, ease: "easeOut" }}
>
```

---

## 3. Botão com Hover/Tap

```tsx
<motion.button
  whileHover={{ scale: 1.02 }}
  whileTap={{ scale: 0.98 }}
  transition={{ type: "spring", stiffness: 400, damping: 20 }}
>
```

---

## 4. AnimatePresence (para elementos condicionais)

**Obrigatório** quando um elemento aparece/desaparece condicionalmente (modais, dropdowns, toasts):

```tsx
import { AnimatePresence, motion } from "framer-motion";

<AnimatePresence>
  {visible && (
    <motion.div
      key="elemento-unico"
      initial={{ opacity: 0, y: 12, scale: 0.94 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 8, scale: 0.94 }}
      transition={{ type: "spring", stiffness: 300, damping: 26 }}
    >
      {/* conteúdo */}
    </motion.div>
  )}
</AnimatePresence>
```

---

## 5. Hero Section — Animações Sequenciais

Cada elemento entra com delay incremental:

```tsx
// delay: 0, 0.1, 0.18, 0.24, 0.3, 0.38
transition={{ duration: 0.65, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
```

---

## 6. Layout Animations

Para elementos que mudam de posição dentro do DOM:

```tsx
<motion.div layout layoutId="identificador-unico">
```

---

## 7. Regras de Uso

- Sempre `viewport={{ once: true }}` em `whileInView` — não reanimar ao voltar ao scroll
- Nunca usar `animate` puro em elementos que devem disparar ao entrar na tela
- Para elementos flutuantes (badges, ícones): CSS `animate-float` do Tailwind (mais performático)
- Framer Motion não substitui CSS transitions simples — usar apenas onde há lógica de estado ou complexidade visual
- `layoutId` só quando necessário — tem custo de performance
- Duração recomendada: 150–300ms para micro-interações, 600–800ms para entradas de seção
