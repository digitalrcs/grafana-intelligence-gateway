import React, { ComponentProps } from 'react';
import { dateTime } from '@grafana/data';
import { fireEvent, render, screen } from '@testing-library/react';
import { DEFAULT_OPTIONS } from '../types';
import { analyzeWithAI } from '../utils/aiClient';
import { IntelligenceGatewayPanel } from './IntelligenceGatewayPanel';

jest.mock('../utils/aiClient', () => ({
  analyzeWithAI: jest.fn(),
}));

const mockedAnalyzeWithAI = jest.mocked(analyzeWithAI);

const renderPanel = () => {
  const from = dateTime('2026-08-11T00:00:00Z');
  const to = dateTime('2026-08-11T01:00:00Z');
  const props = {
    options: DEFAULT_OPTIONS,
    data: { series: [] },
    width: 800,
    height: 500,
    id: 1,
    title: 'Test panel',
    timeRange: { from, to, raw: { from, to } },
    replaceVariables: (value: string) => value,
  } as unknown as ComponentProps<typeof IntelligenceGatewayPanel>;

  return render(<IntelligenceGatewayPanel {...props} />);
};

describe('IntelligenceGatewayPanel', () => {
  it('clears a completed analysis without changing the panel configuration', async () => {
    mockedAnalyzeWithAI.mockResolvedValue('Generated assessment');
    renderPanel();

    fireEvent.click(screen.getByRole('button', { name: 'Analyze' }));
    expect(await screen.findByText('Generated assessment')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Clear analysis' }));

    expect(screen.queryByText('Generated assessment')).not.toBeInTheDocument();
    expect(screen.getByText('Select Analyze to assess the current dashboard context.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Analyze' })).toBeInTheDocument();
  });
});
