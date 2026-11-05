import React from 'react';
import { render, screen } from '@testing-library/react';
import { getDataSourceSrv } from '@grafana/runtime';
import { locationUtil } from '@grafana/data';
import { ConnectionNotice } from './ConnectionNotice';
jest.mock('@grafana/runtime', () => ({ getDataSourceSrv: jest.fn() }));
const getInstanceSettings = jest.fn();
const initializeDataSource = jest.fn();
beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(locationUtil, 'assureBaseUrl').mockImplementation((url) => '/grafana' + url);
  jest.mocked(getDataSourceSrv).mockReturnValue({ getInstanceSettings, get: initializeDataSource } as never);
  getInstanceSettings.mockReturnValue({
    uid: 'local-ai',
    name: 'Local AI',
    type: 'digitalrcs-intelligencegateway-datasource',
  });
});
test('shows the selected connection and model without calling a provider', () => {
  render(<ConnectionNotice dataSourceUid="local-ai" model="chosen-model" />);
  expect(screen.getByText('Local AI · chosen-model')).toBeVisible();
  expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  expect(initializeDataSource).not.toHaveBeenCalled();
});
test('guides setup without assuming a provider and respects the Grafana subpath', () => {
  render(<ConnectionNotice dataSourceUid="" model="" />);
  expect(screen.getByText('Connect your AI backend')).toBeVisible();
  expect(screen.getByRole('link', { name: 'Add AI connection' })).toHaveAttribute(
    'href',
    '/grafana/connections/datasources/new'
  );
  expect(getInstanceSettings).not.toHaveBeenCalled();
});
test('requires a model or agent alias after choosing a data source', () => {
  render(<ConnectionNotice dataSourceUid="local-ai" model="" />);
  expect(screen.getByText('Choose a model or Copilot agent')).toBeVisible();
});
test('does not present a missing data source as connected', () => {
  getInstanceSettings.mockReturnValue(undefined);
  render(<ConnectionNotice dataSourceUid="missing" model="chosen-model" />);
  expect(screen.getByText('Select an available AI connection')).toBeVisible();
});
