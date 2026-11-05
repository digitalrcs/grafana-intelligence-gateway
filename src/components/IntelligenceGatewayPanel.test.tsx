import React, { ComponentProps } from 'react';
import { dateTime, FieldType, toDataFrame } from '@grafana/data';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { DEFAULT_OPTIONS as BASE_OPTIONS } from '../types';
const DEFAULT_OPTIONS = { ...BASE_OPTIONS, secureDataSourceUid: 'test-ai', model: 'test-model' };
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

  return { ...render(<IntelligenceGatewayPanel {...props} />), props };
};

describe('IntelligenceGatewayPanel', () => {
  beforeEach(() => jest.clearAllMocks());
  it('requires a selected connection and model before manual or automatic analysis', () => {
    jest.useFakeTimers();
    try {
      renderPanel({ ...DEFAULT_OPTIONS, secureDataSourceUid: '', model: '', autoAnalyze: true });
      expect(screen.getByRole('button', { name: 'Analyze' })).toBeDisabled();
      act(() => jest.advanceTimersByTime(2000));
      expect(mockedAnalyzeWithAI).not.toHaveBeenCalled();
    } finally {
      jest.useRealTimers();
    }
  });
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
    expect(screen.getByText(/Submitted 1 image/)).toBeInTheDocument();
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

  it('marks changed data stale and sends follow-ups against the original snapshot', async () => {
    mockedAnalyzeWithAI.mockResolvedValueOnce('Original assessment').mockResolvedValueOnce('Follow-up answer');
    const { rerender, props } = renderPanel();
    const series = (value: number) => [
      toDataFrame({ refId: 'A', fields: [{ name: 'latency', type: FieldType.number, values: [value] }] }),
    ];
    rerender(<IntelligenceGatewayPanel {...props} data={{ ...props.data, series: series(10) }} />);
    fireEvent.click(screen.getByRole('button', { name: 'Analyze' }));
    await screen.findByText('Original assessment');
    const frozenPrompt = mockedAnalyzeWithAI.mock.calls[0][0].prompt.user;
    rerender(<IntelligenceGatewayPanel {...props} data={{ ...props.data, series: series(999) }} />);
    expect(screen.getByText('Assessment is out of date')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Ask a follow-up'));
    fireEvent.change(screen.getByRole('textbox', { name: 'Follow-up question' }), {
      target: { value: 'What changed?' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Ask follow-up' }));
    await screen.findByText('Follow-up answer');
    const follow = mockedAnalyzeWithAI.mock.calls[1][0];
    expect(follow.prompt.user).toContain(frozenPrompt);
    expect(follow.prompt.user).not.toContain('999');
    expect(follow.images).toEqual([]);
    expect(screen.getByText('Assessment is out of date')).toBeInTheDocument();
  });

  it('does not resurrect a cleared snapshot when an in-flight follow-up completes', async () => {
    let resolve!: (value: string) => void;
    mockedAnalyzeWithAI.mockResolvedValueOnce('Original assessment').mockImplementationOnce(
      () =>
        new Promise((done) => {
          resolve = done;
        })
    );
    renderPanel();
    fireEvent.click(screen.getByRole('button', { name: 'Analyze' }));
    await screen.findByText('Original assessment');
    fireEvent.click(screen.getByText('Ask a follow-up'));
    fireEvent.change(screen.getByRole('textbox', { name: 'Follow-up question' }), { target: { value: 'Why?' } });
    fireEvent.click(screen.getByRole('button', { name: 'Ask follow-up' }));
    fireEvent.click(screen.getByRole('button', { name: 'Clear analysis' }));
    await act(async () => resolve('Late answer'));
    expect(screen.queryByText('Late answer')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Download brief' })).not.toBeInTheDocument();
  });

  it('blocks an invalid baseline before making an inference request', async () => {
    renderPanel({ ...DEFAULT_OPTIONS, compareBaseline: true });
    fireEvent.click(screen.getByRole('button', { name: 'Analyze' }));
    expect(await screen.findByText(/Baseline comparison needs/)).toBeInTheDocument();
    expect(mockedAnalyzeWithAI).not.toHaveBeenCalled();
  });

  it('resolves dashboard variables in instructions without rewriting query values', async () => {
    mockedAnalyzeWithAI.mockResolvedValue('Assessment');
    const { rerender, props } = renderPanel({ ...DEFAULT_OPTIONS, userPromptTemplate: 'Inspect $host using {{data}}' });
    rerender(
      <IntelligenceGatewayPanel
        {...props}
        replaceVariables={(text) => text.replaceAll('$host', 'web-1')}
        data={{
          ...props.data,
          series: [toDataFrame({ fields: [{ name: 'message', type: FieldType.string, values: ['literal $host'] }] })],
        }}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: 'Analyze' }));
    await screen.findByText('Assessment');
    expect(mockedAnalyzeWithAI.mock.calls[0][0].prompt.user).toContain('Inspect web-1');
    expect(mockedAnalyzeWithAI.mock.calls[0][0].prompt.user).toContain('literal $host');
  });

  it('adds selected preset instructions without replacing the user prompt', async () => {
    mockedAnalyzeWithAI.mockResolvedValue('Handover');
    renderPanel({ ...DEFAULT_OPTIONS, analysisPreset: 'handover', userPromptTemplate: 'My custom task {{data}}' });
    fireEvent.click(screen.getByRole('button', { name: 'Analyze' }));
    await screen.findByText('Handover');
    expect(mockedAnalyzeWithAI.mock.calls[0][0].prompt.system).toContain('incident handover');
    expect(mockedAnalyzeWithAI.mock.calls[0][0].prompt.user).toContain('My custom task');
  });

  it('pauses automatic analysis during a snapshot conversation and resumes after Analyze latest data', async () => {
    jest.useFakeTimers();
    try {
      mockedAnalyzeWithAI.mockResolvedValue('Assessment');
      const { rerender, props } = renderPanel({ ...DEFAULT_OPTIONS, autoAnalyze: true, autoAnalyzeDelayMs: 300 });
      await act(async () => {
        jest.advanceTimersByTime(300);
      });
      expect(mockedAnalyzeWithAI).toHaveBeenCalledTimes(1);
      fireEvent.click(screen.getByText('Ask a follow-up'));
      fireEvent.change(screen.getByRole('textbox', { name: 'Follow-up question' }), { target: { value: 'Why?' } });
      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: 'Ask follow-up' }));
      });
      expect(mockedAnalyzeWithAI).toHaveBeenCalledTimes(2);
      const changed = { ...props, options: { ...props.options, skillsContext: 'Changed context' } };
      rerender(<IntelligenceGatewayPanel {...changed} />);
      await act(async () => {
        jest.advanceTimersByTime(2000);
      });
      expect(mockedAnalyzeWithAI).toHaveBeenCalledTimes(2);
      await act(async () => {
        fireEvent.click(screen.getByText('Share assessment'));
        fireEvent.click(screen.getByRole('button', { name: 'Analyze latest data' }));
      });
      expect(mockedAnalyzeWithAI).toHaveBeenCalledTimes(3);
      expect(screen.queryByText('Assessment is out of date')).not.toBeInTheDocument();
      rerender(
        <IntelligenceGatewayPanel {...changed} options={{ ...changed.options, skillsContext: 'Next change' }} />
      );
      await act(async () => {
        jest.advanceTimersByTime(300);
      });
      expect(mockedAnalyzeWithAI).toHaveBeenCalledTimes(4);
    } finally {
      jest.useRealTimers();
    }
  });
});
