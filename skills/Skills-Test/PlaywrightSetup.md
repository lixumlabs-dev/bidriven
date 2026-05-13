# Skill: Playwright — Setup e Padrões

## Configuração

```ts
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  retries: 1,
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'Desktop Chrome', use: { ...devices['Desktop Chrome'] } },
    { name: 'Mobile Chrome', use: { ...devices['Pixel 5'] } },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
  },
});
```

## Convenção de data-testid

Todo elemento crítico deve ter `data-testid`:

```tsx
// No componente
<button data-testid="hero-cta-primary">Texto do CTA</button>
<section data-testid="hero-section">...</section>
<form data-testid="contact-form">...</form>
<input data-testid="field-name" />
<div data-testid="gallery-grid">...</div>
```

## Padrão de Teste

```ts
import { test, expect } from '@playwright/test';

test.describe('NomeDaFeature', () => {
  
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('caminho feliz', async ({ page }) => {
    // arrange
    const elemento = page.getByTestId('nome-testid');
    
    // act
    await elemento.click();
    
    // assert
    await expect(page.getByTestId('resultado')).toBeVisible();
  });

  test('mobile — responsividade', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(page.getByTestId('elemento')).toBeVisible();
  });
});
```

## Console Limpo (obrigatório em todo spec)

```ts
test('sem erros no console', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  expect(errors).toHaveLength(0);
});
```

## Baterias Obrigatórias por Feature

### Toda entrega precisa:
1. Teste do caminho feliz (desktop Chrome)
2. Teste mobile (375px) — `test.use({ viewport: { width: 375, height: 851 } })` no topo do spec
3. Verificação de console limpo

### Formulários:
```ts
test('validação bloqueia envio vazio', async ({ page }) => {
  await page.goto('/contact');
  await page.getByTestId('form-submit').click();
  await expect(page.getByTestId('field-name')).toBeFocused();
  // ou verificar mensagem de erro
});
```

### Navegação:
```ts
test('todas as rotas carregam sem erro', async ({ page }) => {
  const rotas = ['/', '/about', '/services', '/contact'];
  for (const rota of rotas) {
    await page.goto(rota);
    await expect(page).toHaveTitle(/{{NOME_DO_PROJETO}}/i);
  }
});
```

### SEO (react-helmet-async):
```ts
test('título e meta description presentes', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/{{PALAVRA_CHAVE_TITULO}}/i);
  const description = await page.locator('meta[name="description"]').getAttribute('content');
  expect(description).toBeTruthy();
  expect(description!.length).toBeGreaterThan(50);
});
```

## Comandos

```bash
npx playwright test                    # todos os testes
npx playwright test --ui               # modo visual
npx playwright test --headed           # browser visível
npx playwright test tests/home.spec.ts # arquivo específico
npx playwright show-report             # relatório HTML
```
