import { test, expect } from '@grafana/plugin-e2e';
import { randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

test('real backend completes a query assessment and frozen follow-up', async ({
  page,
  request,
  gotoDashboardPage,
}, info) => {
  test.setTimeout(360000);
  const sourceUid = process.env.LIVE_AI_DATASOURCE_UID;
  const model = process.env.LIVE_AI_MODEL;
  test.skip(!sourceUid || !model, 'Set an explicitly approved live backend UID and model to run inference.');
  const source = await request.get(`/api/datasources/uid/${sourceUid}`);
  expect(source.ok()).toBe(true);
  expect((await source.json()).type).toBe('digitalrcs-intelligencegateway-datasource');
  const dashboard = JSON.parse(await readFile(path.join(__dirname, 'fixtures/dashboard.json'), 'utf8'));
  dashboard.id = null;
  dashboard.uid = `live-panel-${randomUUID().slice(0, 20)}`;
  dashboard.version = 0;
  dashboard.title = 'Live AI verification';
  const panelConfig = dashboard.panels.find((panel: { id: number }) => panel.id === 2);
  panelConfig.options = {
    ...panelConfig.options,
    secureDataSourceUid: sourceUid,
    model,
    maxTokens: 8192,
    responseLengthTokens: 300,
    responseTimeoutSeconds: 300,
    metricKind: 'gauge',
    responseTitle: 'Traffic assessment',
    userPromptTemplate:
      'In at most 100 words, identify the supplied DC1/DC2 traffic shift. State the combined rate and distinguish facts from possible causes.\n{{data}}',
  };
  expect((await request.post('/api/dashboards/db', { data: { dashboard, overwrite: false } })).ok()).toBe(true);
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  try {
    const view = await gotoDashboardPage({ uid: dashboard.uid });
    await view.waitForPanelsQueriesToComplete({ scrollAll: true, timeout: 30000 });
    const panel = page.getByTestId('intelligence-gateway-panel');
    await panel.getByRole('button', { name: 'Analyze', exact: true }).click();
    await expect(panel.getByText('Ask a follow-up', { exact: true })).toBeVisible({ timeout: 300000 });
    await expect(panel).toContainText(/DC1|DC2/);
    await expect(panel).not.toContainText(/Automated UI test response|mock receipt/i);
    await panel.getByText('Ask a follow-up', { exact: true }).click();
    await panel
      .getByRole('textbox', { name: 'Follow-up question' })
      .fill('In one sentence, can these measurements establish the cause?');
    await panel.getByRole('button', { name: 'Ask follow-up', exact: true }).click();
    await expect(panel).toContainText('1/6 follow-ups used', { timeout: 300000 });
    await panel.getByText('Ask a follow-up', { exact: true }).click();
    await panel.getByRole('button', { name: 'Refresh assessment' }).scrollIntoViewIfNeeded();
    const destination = process.env.VISION_EVIDENCE_DIR
      ? path.join(process.env.VISION_EVIDENCE_DIR, 'live-clean-assessment.png')
      : info.outputPath('live-clean-assessment.png');
    await page.screenshot({ path: destination, animations: 'disabled' });
    expect(errors).toEqual([]);
    await info.attach('live-assessment-text', { body: await panel.innerText(), contentType: 'text/plain' });
  } finally {
    expect((await request.delete(`/api/dashboards/uid/${dashboard.uid}`)).ok()).toBe(true);
  }
});
