import { test, expect } from './fixtures';

test.describe.configure({ mode: 'serial' });

test('shows a clear notice when query data is empty', async ({ gotoPanelEditPage, readProvisionedDashboard, page }) => {
  const dashboard = await readProvisionedDashboard({ fileName: 'dashboard.json' });
  const panelEditPage = await gotoPanelEditPage({ dashboard, id: '3' });
  await page.getByTestId('intelligence-gateway-panel').waitFor({ state: 'visible' });
  await expect(panelEditPage.panel.locator).toContainText('No dashboard data received');
});

test('loads the provisioned DC1 and DC2 CSV data', async ({ gotoDashboardPage, readProvisionedDashboard }) => {
  const dashboard = await readProvisionedDashboard({ fileName: 'dashboard.json' });
  const dashboardPage = await gotoDashboardPage({ uid: dashboard.uid });
  await dashboardPage.waitForPanelsQueriesToComplete({ timeout: 15000 });
  const sourcePanel = dashboardPage.getPanelByTitle('Synthetic traffic: requests/minute by data center');
  await expect(sourcePanel.locator).toContainText('DC1');
  await expect(sourcePanel.locator).toContainText('DC2');
});

test('renders the intelligence gateway when data is supplied', async ({
  gotoPanelEditPage,
  readProvisionedDashboard,
  page,
}) => {
  // Exercise the provisioned gateway and its real query data without coupling
  // this plugin assertion to Grafana's version-dependent visualization picker.
  const dashboard = await readProvisionedDashboard({ fileName: 'dashboard.json' });
  const panelEditPage = await gotoPanelEditPage({ dashboard, id: '2' });
  await expect(page.getByTestId('intelligence-gateway-panel')).toBeVisible();
  await expect(panelEditPage.panel.locator).toContainText('Select Analyze');
});

test('exposes the manual analysis behavior option', async ({ gotoPanelEditPage, readProvisionedDashboard, page }) => {
  const dashboard = await readProvisionedDashboard({ fileName: 'dashboard.json' });
  const panelEditPage = await gotoPanelEditPage({ dashboard, id: '2' });
  await page.getByTestId('intelligence-gateway-panel').waitFor({ state: 'visible' });
  const behavior = panelEditPage.getCustomOptions('3. Analysis task');
  const analyzeButton = behavior.getSwitch('Show Analyze button');
  await expect(analyzeButton).toBeChecked();
});

test('shows the selected AI connection without a large status banner', async ({
  gotoPanelEditPage,
  readProvisionedDashboard,
  readProvisionedDataSource,
  page,
}) => {
  const dashboard = await readProvisionedDashboard({ fileName: 'dashboard.json' });
  const source = await readProvisionedDataSource({ fileName: 'intelligence-gateway.yml' });
  const editor = await gotoPanelEditPage({ dashboard, id: '2' });
  await expect(editor.panel.locator.getByTestId('connection-notice')).toContainText(source.name);
  await expect(page.getByText('Server-side credentials enabled')).toHaveCount(0);
});

test('renders an intercepted backend response in the UI contract test', async ({
  gotoPanelEditPage,
  readProvisionedDashboard,
  page,
}) => {
  const dashboard = await readProvisionedDashboard({ fileName: 'dashboard.json' });
  const panelEditPage = await gotoPanelEditPage({ dashboard, id: '2' });
  await page.getByTestId('intelligence-gateway-panel').waitFor({ state: 'visible' });
  await page.getByRole('button', { name: 'Analyze' }).click();
  await expect(panelEditPage.panel.locator).toContainText('Automated UI test response.');
  await expect(panelEditPage.panel.locator).toContainText('Automated UI test response.');
});
