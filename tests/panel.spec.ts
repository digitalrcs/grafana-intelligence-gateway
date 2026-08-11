import { test, expect } from '@grafana/plugin-e2e';

test('shows a clear notice when query data is empty', async ({ gotoPanelEditPage, readProvisionedDashboard }) => {
  const dashboard = await readProvisionedDashboard({ fileName: 'dashboard.json' });
  const panelEditPage = await gotoPanelEditPage({ dashboard, id: '2' });
  await expect(panelEditPage.panel.locator).toContainText('No dashboard data received');
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

test('exposes the manual analysis behavior option', async ({ gotoPanelEditPage, readProvisionedDashboard }) => {
  const dashboard = await readProvisionedDashboard({ fileName: 'dashboard.json' });
  const panelEditPage = await gotoPanelEditPage({ dashboard, id: '1' });
  const behavior = panelEditPage.getCustomOptions('Behavior');
  const analyzeButton = behavior.getSwitch('Show Analyze button');
  await expect(analyzeButton).toBeChecked();
});
