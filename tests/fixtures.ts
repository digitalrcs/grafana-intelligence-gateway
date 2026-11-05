import { test as base, expect, Dashboard } from '@grafana/plugin-e2e';
import { randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { VISION_LIMITS } from '../src/vision/limits';

// Browser-only response fixtures. No AI simulator is shipped, provisioned or started.
// These tests do not prove live inference; live-backend.spec.ts covers an explicitly selected backend.
export { expect, gte } from '@grafana/plugin-e2e';
export type { Dashboard } from '@grafana/plugin-e2e';
export const test = base.extend<{ testBackend: { uid: string; name: string; jsonData: Record<string, unknown> } }>({
  testBackend: async ({ page, request }, use) => {
    const uid = `ui-contract-${randomUUID().slice(0, 20)}`;
    const source = {
      uid,
      name: `Automated test connection ${uid}`,
      type: 'digitalrcs-intelligencegateway-datasource',
      access: 'proxy',
      jsonData: {
        provider: 'custom',
        baseUrl: 'https://inference.invalid/v1',
        defaultModel: 'test-model',
        allowedModels: ['test-model'],
        enableVision: true,
        allowedVisionModels: ['test-model'],
      },
    };
    expect((await request.post('/api/datasources', { data: source })).ok()).toBe(true);
    await page.route(`**/api/datasources/uid/${uid}/resources/**`, async (route) => {
      const pathname = new URL(route.request().url()).pathname;
      if (pathname.endsWith('/chat/completions')) {
        const payload = route.request().postDataJSON();
        await route.fulfill({
          json: {
            choices: [
              {
                message: {
                  content: `Automated UI test response.\n\nImage request: ${payload.images?.length ?? 0} image(s) received.`,
                },
              },
            ],
          },
        });
      } else if (pathname.endsWith('/models')) {
        await route.fulfill({ json: { data: [{ id: 'test-model' }] } });
      } else if (pathname.endsWith('/capabilities')) {
        await route.fulfill({
          json: {
            provider: 'custom',
            generationControls: { temperature: true, maxOutputTokens: true },
            vision: {
              enabled: true,
              models: ['test-model'],
              mimeTypes: ['image/png', 'image/jpeg'],
              limits: VISION_LIMITS,
            },
          },
        });
      } else {
        await route.continue();
      }
    });
    try {
      await use(source);
    } finally {
      expect((await request.delete(`/api/datasources/uid/${uid}`)).ok()).toBe(true);
    }
  },
  readProvisionedDataSource: async ({ testBackend }, use) => {
    await use(async () => testBackend as never);
  },
  readProvisionedDashboard: async ({ testBackend, request }, use) => {
    const source = JSON.parse(await readFile(path.join(__dirname, 'fixtures/dashboard.json'), 'utf8'));
    source.id = null;
    source.uid = `ui-panel-${randomUUID().slice(0, 20)}`;
    source.version = 0;
    const intelligence = source.panels.find((panel: { id: number }) => panel.id === 2);
    intelligence.options.secureDataSourceUid = testBackend.uid;
    intelligence.options.model = 'test-model';
    source.panels.push({
      ...intelligence,
      id: 3,
      title: 'Empty-data behavior test',
      gridPos: { h: 8, w: 24, x: 0, y: 20 },
      datasource: source.panels[0].datasource,
      targets: [{ datasource: source.panels[0].datasource, refId: 'A', scenarioId: 'no_data_points' }],
      options: { ...intelligence.options, emptyDataBehavior: 'warn' },
    });
    expect((await request.post('/api/dashboards/db', { data: { dashboard: source, overwrite: false } })).ok()).toBe(
      true
    );
    try {
      await use(async () => source as Dashboard);
    } finally {
      expect((await request.delete(`/api/dashboards/uid/${source.uid}`)).ok()).toBe(true);
    }
  },
});
