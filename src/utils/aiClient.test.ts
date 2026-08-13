import { getDataSourceSrv } from '@grafana/runtime';
import { DEFAULT_OPTIONS } from '../types';
import { analyzeWithAI, extractModelIds, extractResponseText, fetchAvailableModels } from './aiClient';

jest.mock('@grafana/runtime', () => ({
  getBackendSrv: jest.fn(),
  getDataSourceSrv: jest.fn(),
}));

const mockedGetDataSourceSrv = jest.mocked(getDataSourceSrv);

describe('extractResponseText', () => {
  it('reads an OpenAI chat completion', () => {
    expect(extractResponseText({ choices: [{ message: { content: ' Assessment ' } }] })).toBe('Assessment');
  });

  it('rejects empty provider responses', () => {
    expect(() => extractResponseText({ choices: [] })).toThrow('no text content');
  });

  it('explains when reasoning consumes the output-token limit', () => {
    expect(() =>
      extractResponseText({
        choices: [
          {
            finish_reason: 'length',
            message: { content: '', reasoning_content: 'The model was still reasoning.' },
          },
        ],
      })
    ).toThrow('entire output-token limit for reasoning');
  });
});

describe('extractModelIds', () => {
  it('reads, deduplicates, and sorts OpenAI model-list responses', () => {
    expect(extractModelIds({ data: [{ id: 'model-b' }, { id: 'model-a' }, { id: 'model-b' }] })).toEqual([
      'model-a',
      'model-b',
    ]);
  });

  it('supports common custom model-list shapes', () => {
    expect(extractModelIds({ models: ['local-model', { name: 'named-model' }] })).toEqual([
      'local-model',
      'named-model',
    ]);
  });
});

describe('secure data source transport', () => {
  const getResource = jest.fn();
  const postResource = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockedGetDataSourceSrv.mockReturnValue({
      get: jest.fn().mockResolvedValue({
        type: 'digitalrcs-intelligencegateway-datasource',
        getResource,
        postResource,
      }),
    } as unknown as ReturnType<typeof getDataSourceSrv>);
  });

  it('loads models through the selected backend resource', async () => {
    getResource.mockResolvedValue({ data: [{ id: 'secure-model' }] });

    await expect(
      fetchAvailableModels({ secureDataSourceUid: 'secure-uid' })
    ).resolves.toEqual(['secure-model']);
    expect(getResource).toHaveBeenCalledWith('models');
  });

  it('sends prompts without credentials through the selected backend resource', async () => {
    postResource.mockResolvedValue({ choices: [{ message: { content: 'Secure assessment' } }] });

    await expect(
      analyzeWithAI({
        options: { ...DEFAULT_OPTIONS, secureDataSourceUid: 'secure-uid' },
        prompt: { system: 'system', user: 'user' },
      })
    ).resolves.toBe('Secure assessment');

    expect(postResource).toHaveBeenCalledWith(
      'chat/completions',
      expect.objectContaining({
        prompt: { system: 'system', user: 'user' },
        model: DEFAULT_OPTIONS.model,
        maxOutputTokens: DEFAULT_OPTIONS.maxTokens,
        stream: false,
      }),
      expect.objectContaining({ abortSignal: expect.any(AbortSignal) })
    );
  });

  it('requires a secure data source', async () => {
    await expect(
      analyzeWithAI({
        options: { ...DEFAULT_OPTIONS, secureDataSourceUid: '' },
        prompt: { system: 'system', user: 'user' },
      })
    ).rejects.toThrow('Select an Intelligence Gateway Secure AI data source');
  });
});
