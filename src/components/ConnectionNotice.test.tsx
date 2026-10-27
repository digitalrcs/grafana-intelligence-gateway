import React from 'react';
import { render, screen } from '@testing-library/react';
import { getDataSourceSrv } from '@grafana/runtime';
import { ConnectionNotice } from './ConnectionNotice';

jest.mock('@grafana/runtime', () => ({ getDataSourceSrv: jest.fn() }));

const getInstanceSettings = jest.fn();
const initializeDataSource = jest.fn();
const mockSettings = {
  uid: 'review-ai',
  name: 'DEMO ONLY - Mock AI (no inference)',
  type: 'digitalrcs-intelligencegateway-datasource',
  jsonData: { reviewMock: true, provider: 'custom', baseUrl: 'http://mock-ai:8080/v1' },
};

beforeEach(() => {
  jest.clearAllMocks();
  jest.mocked(getDataSourceSrv).mockReturnValue({ getInstanceSettings, get: initializeDataSource } as never);
  getInstanceSettings.mockReturnValue(mockSettings);
});

test('marks the provisioned mock prominently without initializing or calling a provider', () => {
  render(<ConnectionNotice dataSourceUid="review-ai" model="review-model" />);
  expect(screen.getByText('Mock connection — no AI analysis')).toBeVisible();
  expect(screen.getByText(/delivery receipt only/)).toBeVisible();
  expect(screen.getByText('DEMO ONLY - Mock AI (no inference)')).toBeVisible();
  expect(screen.getByText('review-model')).toBeVisible();
  expect(screen.getByText('Use your own AI — setup checklist')).toBeVisible();
  expect(screen.getByRole('link', { name: /Full reviewer setup/ })).toHaveAttribute(
    'href',
    'https://github.com/digitalrcs/grafana-intelligence-gateway/wiki/Reviewer-Walkthrough'
  );
  expect(initializeDataSource).not.toHaveBeenCalled();
});

test.each([
  { reviewMock: undefined },
  { reviewMock: false },
  { baseUrl: 'http://host.docker.internal:1234/v1' },
  { baseUrl: 'http://mock-ai:8080/v1/another-provider' },
  { provider: 'lmstudio' },
])('does not label other connections as the supplied mock: %p', (changedConfig) => {
  getInstanceSettings.mockReturnValue({ ...mockSettings, jsonData: { ...mockSettings.jsonData, ...changedConfig } });
  render(<ConnectionNotice dataSourceUid="real-ai" model="my-model" />);
  expect(screen.queryByText('Mock connection — no AI analysis')).not.toBeInTheDocument();
  expect(screen.getByText('my-model')).toBeVisible();
  expect(initializeDataSource).not.toHaveBeenCalled();
});

test('updates the notice when a real provider instance is selected', () => {
  const { rerender } = render(<ConnectionNotice dataSourceUid="review-ai" model="review-model" />);
  expect(screen.getByText('Mock connection — no AI analysis')).toBeVisible();
  getInstanceSettings.mockReturnValue({
    ...mockSettings,
    name: 'My local AI',
    jsonData: { provider: 'lmstudio', baseUrl: 'http://host.docker.internal:1234/v1' },
  });
  rerender(<ConnectionNotice dataSourceUid="real-ai" model="my-vision-model" />);
  expect(screen.queryByText('Mock connection — no AI analysis')).not.toBeInTheDocument();
  expect(screen.getByText('My local AI')).toBeVisible();
  expect(screen.getByText('my-vision-model')).toBeVisible();
});

test('provides setup guidance before a data source is selected', () => {
  render(<ConnectionNotice dataSourceUid="" model="" />);
  expect(screen.getByText('AI connection not configured')).toBeVisible();
  expect(screen.getByRole('link', { name: 'Setup instructions' })).toBeVisible();
  expect(getInstanceSettings).not.toHaveBeenCalled();
  expect(initializeDataSource).not.toHaveBeenCalled();
});

test('does not mistake a missing instance for a configured mock', () => {
  getInstanceSettings.mockReturnValue(undefined);
  render(<ConnectionNotice dataSourceUid="missing-ai" model="my-model" />);
  expect(screen.getByText('missing-ai')).toBeVisible();
  expect(screen.queryByText('Mock connection — no AI analysis')).not.toBeInTheDocument();
});
