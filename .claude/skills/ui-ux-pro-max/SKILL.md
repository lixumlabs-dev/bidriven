---
name: ui-ux-pro-max
description: UI/UX design intelligence. 67 styles, 161 palettes, 57 font pairings, 25 charts, 16 stacks (React, Next.js, Vue, Svelte, Astro, SwiftUI, React Native, Flutter, Nuxt, Nuxt UI, Tailwind, shadcn/ui, Jetpack Compose, Three.js, Angular, Laravel). Actions: plan, build, create, design, implement, review, fix, improve, optimize, enhance, refactor, check UI/UX code. Projects: website, landing page, dashboard, admin panel, e-commerce, SaaS, portfolio, blog, mobile app, .html, .tsx, .vue, .svelte. Elements: button, modal, navbar, sidebar, card, table, form, chart. Styles: glassmorphism, claymorphism, minimalism, brutalism, neumorphism, bento grid, dark mode, responsive, skeuomorphism, flat design. Topics: color palette, accessibility, animation, layout, typography, font pairing, spacing, hover, shadow, gradient.
---

# UI/UX Pro Max - Design Intelligence

Comprehensive design guide for web and mobile applications. Contains 67 styles, 161 color palettes, 57 font pairings, 99 UX guidelines, and 25 chart types across 16 technology stacks. Searchable database with priority-based recommendations.

## When to Apply

Use this skill when the task involves **UI structure, visual design decisions, interaction patterns, or UX quality control**.

### Must Use
- Designing new pages (Landing Page, Dashboard, SaaS, mobile app)
- Creating or refactoring UI components (buttons, modals, forms, tables, charts)
- Choosing color palettes, font systems, spacing rules, or layout systems
- Reviewing UI code for UX, accessibility, or visual consistency
- Implementing navigation, animations, or responsive behavior
- Making product-level design decisions (style, information hierarchy, brand expression)
- Improving interface perceived quality, clarity, or usability

### Skip
- Pure backend logic
- API or database design only
- Infrastructure or DevOps
- Non-visual scripts or automation

---

## Prerequisites

Python 3 must be available:

```bash
python --version
```

On Windows, run scripts with:
```bash
python .claude/skills/ui-ux-pro-max/scripts/search.py "<query>" --domain <domain>
```

---

## How to Use

### Step 1: Generate Design System (start here for new pages/features)

```bash
# Adapt keywords to the current project context
python .claude/skills/ui-ux-pro-max/scripts/search.py "{{KEYWORDS_DO_PROJETO}}" --design-system -p "{{NOME_DO_PROJETO}}"
```

### Step 2: Domain searches (supplement the design system)

```bash
# Style options
python .claude/skills/ui-ux-pro-max/scripts/search.py "{{ESTILO_VISUAL}}" --domain style

# Color palettes
python .claude/skills/ui-ux-pro-max/scripts/search.py "{{PALAVRAS_COR}}" --domain color

# Typography
python .claude/skills/ui-ux-pro-max/scripts/search.py "{{PALAVRAS_TIPOGRAFIA}}" --domain typography

# UX best practices
python .claude/skills/ui-ux-pro-max/scripts/search.py "animation accessibility landing" --domain ux

# React performance
python .claude/skills/ui-ux-pro-max/scripts/search.py "bundle lazy suspense" --domain react
```

### Step 3: Stack-specific guidance

```bash
python .claude/skills/ui-ux-pro-max/scripts/search.py "framer motion animation performance" --stack react
```

---

## Rule Categories by Priority

| Priority | Category | Impact | Domain | Key Checks |
|----------|----------|--------|--------|------------|
| 1 | Accessibility | CRITICAL | `ux` | Contrast 4.5:1, Alt text, Keyboard nav, Aria-labels |
| 2 | Touch & Interaction | CRITICAL | `ux` | Min size 44×44px, 8px+ spacing, Loading feedback |
| 3 | Performance | HIGH | `ux` | WebP/AVIF, Lazy loading, CLS < 0.1 |
| 4 | Style Selection | HIGH | `style`, `product` | Match product type, Consistency, SVG icons |
| 5 | Layout & Responsive | HIGH | `ux` | Mobile-first, No horizontal scroll |
| 6 | Typography & Color | MEDIUM | `typography`, `color` | Base 16px, Line-height 1.5, Semantic tokens |
| 7 | Animation | MEDIUM | `ux` | 150–300ms, transform/opacity only |
| 8 | Forms & Feedback | MEDIUM | `ux` | Visible labels, Error near field |
| 9 | Navigation Patterns | HIGH | `ux` | Predictable back, Bottom nav ≤5 |
| 10 | Charts & Data | LOW | `chart` | Legends, Tooltips, Accessible colors |

---

## How to Set Project Context

When starting a new project, update this SKILL.md with the project's specific design context:

```markdown
## {{NOME_DO_PROJETO}} Design Context

**Keywords for design system search:**
python .claude/skills/ui-ux-pro-max/scripts/search.py "{{KEYWORDS}}" --design-system -p "{{NOME}}"

**Current design tokens to respect:**
- Background: {{COR_FUNDO}}
- Accent: {{COR_PRIMARIA}}
- Typography: {{FONTE_TITULOS}} (headings) + {{FONTE_CORPO}} (body) + {{FONTE_MONO}} (labels)
- Stack: React 19 + Tailwind v4 + Framer Motion

**Use skill output to:**
- Validate new component designs against established patterns
- Find additional font pairings for future typography decisions
- Check UX anti-patterns before implementing interactions
- Get Framer Motion animation timing recommendations
```
