import { test, expect } from '@grafana/plugin-e2e';
import path from 'node:path';

test('fresh installation requires an AI connection and has no demo provider', async ({
  gotoDashboardPage,
  readProvisionedDashboard,
  page,
}, info) => {
  const dashboard = await readProvisionedDashboard({ fileName: 'dashboard.json' });
  await gotoDashboardPage({ uid: dashboard.uid });
  const panel = page.getByTestId('intelligence-gateway-panel');
  await expect(panel).toContainText('Connect your AI backend');
  await expect(panel.getByRole('button', { name: 'Analyze', exact: true })).toBeDisabled();
  await expect(panel).not.toContainText(/mock|receipt/i);
  await expect(panel.getByRole('link', { name: 'Add AI connection' })).toBeVisible();
  if (process.env.VISION_EVIDENCE_DIR) {
    await page.screenshot({
      path: path.join(process.env.VISION_EVIDENCE_DIR, 'clean-setup.png'),
      animations: 'disabled',
    });
  }
});
