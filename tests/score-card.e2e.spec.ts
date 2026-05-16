import { expect, test } from 'playwright/test'
import {
  ensureAuthenticatedScoreCardState,
  seedScoreCardFixtures,
} from './fixtures/score-card-e2e'

test('select strategy -> score appears', async ({ page }) => {
  const fixtures = await seedScoreCardFixtures()
  await ensureAuthenticatedScoreCardState(page, fixtures)
  await page.goto(fixtures.withInsightNoScore.path)

  await page.getByLabel('Estratégia').click()
  await page.getByRole('option', { name: 'Farmácia / Drogaria' }).click()
  await page.getByRole('button', { name: 'Calcular pontuação' }).click()

  await expect(page.getByText('Pontuação de oportunidade').first()).toBeVisible()
  await expect(page.getByText('Pontos fortes')).toBeVisible()
  await expect(page.getByText('Riscos')).toBeVisible()
  await expect(page.getByText('Farmácia / Drogaria').nth(1)).toBeVisible()
})

test('no location_insights -> enrichment prompt', async ({ page }) => {
  const fixtures = await seedScoreCardFixtures()
  await ensureAuthenticatedScoreCardState(page, fixtures)
  await page.goto(fixtures.withoutInsight.path)

  await expect(page.getByText('Enriqueça a localização antes de calcular a pontuação')).toBeVisible()
})

test('no saved score -> Calcular pontuação CTA', async ({ page }) => {
  const fixtures = await seedScoreCardFixtures()
  await ensureAuthenticatedScoreCardState(page, fixtures)
  await page.goto(fixtures.withInsightNoScore.path)

  await expect(page.getByRole('button', { name: 'Calcular pontuação' })).toBeVisible()
  await expect(page.getByText('Calculando...')).toBeHidden()
})

test('strategy change -> card updates', async ({ page }) => {
  const fixtures = await seedScoreCardFixtures()
  await ensureAuthenticatedScoreCardState(page, fixtures)
  await page.goto(fixtures.withInsightSavedScore.path)

  await expect(page.getByText('Versão')).toBeVisible()
  await page.getByLabel('Estratégia').click()
  await page.getByRole('option', { name: 'Varejo / Loja' }).click()
  await page.getByRole('button', { name: /pontuação/i }).click()

  await expect(page.getByText('Varejo / Loja')).toBeVisible()
  await expect(page.getByText('Pontuação de oportunidade').first()).toBeVisible()
})
