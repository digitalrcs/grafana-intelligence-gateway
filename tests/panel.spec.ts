import { test, expect } from '@grafana/plugin-e2e';

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
  panelEditPage,
  readProvisionedDataSource,
  page,
}) => {
  const ds = await readProvisionedDataSource({ fileName: 'datasources.yml' });
  await panelEditPage.datasource.set(ds.name);
  await panelEditPage.setVisualization('Grafana Intelligence Gateway');
  await expect(page.getByTestId('intelligence-gateway-panel')).toBeVisible();
  await expect(panelEditPage.panel.locator).toContainText('Select Analyze');
});

test('exposes the manual analysis behavior option', async ({ gotoPanelEditPage, readProvisionedDashboard, page }) => {
  const dashboard = await readProvisionedDashboard({ fileName: 'dashboard.json' });
  const panelEditPage = await gotoPanelEditPage({ dashboard, id: '2' });
  await page.getByTestId('intelligence-gateway-panel').waitFor({ state: 'visible' });
  const behavior = panelEditPage.getCustomOptions('Behavior');
  const analyzeButton = behavior.getSwitch('Show Analyze button');
  await expect(analyzeButton).toBeChecked();
});

test('identifies the provisioned mock AI connection before analysis', async ({
  gotoPanelEditPage,
  readProvisionedDashboard,
  readProvisionedDataSource,
  page,
}) => {
  const dashboard = await readProvisionedDashboard({ fileName: 'dashboard.json' });
  const mock = await readProvisionedDataSource<{ reviewMock: boolean }>({ fileName: 'intelligence-gateway.yml' });
  expect(mock.jsonData.reviewMock).toBe(true);
  const panelEditPage = await gotoPanelEditPage({ dashboard, id: '2' });
  const notice = panelEditPage.panel.locator.getByTestId('connection-notice');
  await expect(notice).toBeVisible();
  await expect(notice).toContainText('Mock connection — no AI analysis');
  await expect(notice).toContainText(mock.name);
  await expect(page.getByText('Server-side credentials enabled')).toBeVisible();
  await expect(page.getByText(/API keys and provider policy remain on the Grafana server/)).toBeVisible();
});

test('completes analysis through the secure backend and deterministic provider', async ({
  gotoPanelEditPage,
  readProvisionedDashboard,
  page,
}) => {
  const dashboard = await readProvisionedDashboard({ fileName: 'dashboard.json' });
  const panelEditPage = await gotoPanelEditPage({ dashboard, id: '2' });
  await page.getByTestId('intelligence-gateway-panel').waitFor({ state: 'visible' });
  await page.getByRole('button', { name: 'Analyze' }).click();
  await expect(panelEditPage.panel.locator).toContainText('MOCK MODE — no AI inference performed.');
  await expect(panelEditPage.panel.locator).toContainText('does not analyze your data');
});
