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
  const sourcePanel = dashboardPage.getPanelByTitle('CSV source data');
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
