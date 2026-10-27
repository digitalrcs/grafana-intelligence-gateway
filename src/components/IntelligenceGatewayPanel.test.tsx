import React, { ComponentProps } from 'react';
import { dateTime } from '@grafana/data';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { DEFAULT_OPTIONS } from '../types';
import { analyzeWithAI } from '../utils/aiClient';
import { IntelligenceGatewayPanel } from './IntelligenceGatewayPanel';

jest.mock('../utils/aiClient', () => ({
  analyzeWithAI: jest.fn(),
}));
jest.mock('./ImageInputs', () => ({
  ImageInputs: ({ onImagesChange, onClose }: { onImagesChange: (images: unknown[]) => void; onClose: () => void }) => (
    <button
      onClick={() => {
        onImagesChange([
          {
            id: 'test',
            name: 'Synthetic screenshot',
            dataUrl: 'data:image/png;base64,AA==',
            width: 1,
            height: 1,
            bytes: 1,
            source: 'upload',
            capturedAt: '2026-10-26T12:00:00Z',
          },
        ]);
        onClose();
      }}
    >
      Attach test image
    </button>
  ),
}));

const mockedAnalyzeWithAI = jest.mocked(analyzeWithAI);

const renderPanel = (options = DEFAULT_OPTIONS) => {
  const from = dateTime('2026-08-11T00:00:00Z');
  const to = dateTime('2026-08-11T01:00:00Z');
  const props = {
    options,
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
  beforeEach(() => jest.clearAllMocks());
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

  it('allows image-only assessment with empty query data and releases image state after success', async () => {
    mockedAnalyzeWithAI.mockResolvedValue('Image assessment');
    renderPanel({ ...DEFAULT_OPTIONS, emptyDataBehavior: 'block', includeDataWithImages: false });
    fireEvent.click(screen.getByRole('button', { name: 'Images' }));
    fireEvent.click(screen.getByRole('button', { name: 'Attach test image' }));
    expect(mockedAnalyzeWithAI).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Analyze images' }));
    expect(await screen.findByText('Image assessment')).toBeInTheDocument();
    expect(mockedAnalyzeWithAI.mock.calls[0][0].images).toHaveLength(1);
    expect(mockedAnalyzeWithAI.mock.calls[0][0].prompt.user).toContain('Query data was intentionally omitted');
    expect(screen.queryByRole('button', { name: 'Analyze images' })).not.toBeInTheDocument();
    expect(screen.getByText(/Assessed 1 image/)).toBeInTheDocument();
  });

  it('clears pending image attachments with Clear analysis', () => {
    renderPanel();
    fireEvent.click(screen.getByRole('button', { name: 'Images' }));
    fireEvent.click(screen.getByRole('button', { name: 'Attach test image' }));
    fireEvent.click(screen.getByRole('button', { name: 'Clear analysis' }));
    expect(screen.queryByRole('button', { name: 'Analyze images' })).not.toBeInTheDocument();
    expect(mockedAnalyzeWithAI).not.toHaveBeenCalled();
  });

  it('never sends attached images through automatic analysis', () => {
    jest.useFakeTimers();
    try {
      renderPanel({ ...DEFAULT_OPTIONS, autoAnalyze: true, autoAnalyzeDelayMs: 300 });
      fireEvent.click(screen.getByRole('button', { name: 'Images' }));
      act(() => jest.advanceTimersByTime(1000));
      expect(mockedAnalyzeWithAI).not.toHaveBeenCalled();
      fireEvent.click(screen.getByRole('button', { name: 'Attach test image' }));
      act(() => jest.advanceTimersByTime(1000));
      expect(mockedAnalyzeWithAI).not.toHaveBeenCalled();
    } finally {
      jest.useRealTimers();
    }
  });
});
