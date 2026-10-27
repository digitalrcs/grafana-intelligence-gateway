import { getDataSourceSrv } from '@grafana/runtime';
import { DEFAULT_OPTIONS } from '../types';
import {
  analyzeWithAI,
  extractModelIds,
  extractResponseText,
  fetchAvailableModels,
  fetchVisionCapabilities,
} from './aiClient';
import type { VisionAttachment } from '../vision';

const png = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/l9sAAAAASUVORK5CYII=';
const image: VisionAttachment = {
  id: 'test',
  name: 'Synthetic chart.png',
  dataUrl: `data:image/png;base64,${png}`,
  mimeType: 'image/png',
  width: 1,
  height: 1,
  bytes: Buffer.from(png, 'base64').length,
  source: 'upload',
  capturedAt: '2026-10-26T12:00:00Z',
};

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

    await expect(fetchAvailableModels({ secureDataSourceUid: 'secure-uid' })).resolves.toEqual(['secure-model']);
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

  it('checks image model approval and sends only image name and data URL', async () => {
    getResource.mockResolvedValue({ vision: { enabled: true, models: [DEFAULT_OPTIONS.model] } });
    postResource.mockResolvedValue({ choices: [{ message: { content: 'Image assessment' } }] });
    await expect(
      analyzeWithAI({
        options: { ...DEFAULT_OPTIONS, secureDataSourceUid: 'secure-uid' },
        prompt: { system: 's', user: 'u' },
        images: [image],
      })
    ).resolves.toBe('Image assessment');
    expect(getResource).toHaveBeenCalledWith(
      'capabilities',
      undefined,
      expect.objectContaining({ abortSignal: expect.any(AbortSignal) })
    );
    expect(postResource.mock.calls[0][1].images).toEqual([{ name: image.name, dataUrl: image.dataUrl }]);
    expect(postResource.mock.calls[0][1]).not.toHaveProperty('apiKey');
  });

  it.each([false, true])('refuses disabled or unapproved image models before sending (enabled=%s)', async (enabled) => {
    getResource.mockResolvedValue({ vision: { enabled, models: ['another-model'] } });
    await expect(
      analyzeWithAI({
        options: { ...DEFAULT_OPTIONS, secureDataSourceUid: 'secure-uid' },
        prompt: { system: 's', user: 'u' },
        images: [image],
      })
    ).rejects.toThrow('not enabled for this model');
    expect(postResource).not.toHaveBeenCalled();
  });

  it('explains when an old companion has no capabilities endpoint', async () => {
    getResource.mockRejectedValue({ status: 404 });
    await expect(fetchVisionCapabilities('secure-uid')).rejects.toThrow('upgrade');
  });

  it('enforces the advertised UTF-8 request byte limit before sending images', async () => {
    const prompt = { system: 's', user: '图'.repeat(100) };
    // This bound fits the JavaScript character count but not the UTF-8 body.
    const characterCount = JSON.stringify({
      prompt,
      model: DEFAULT_OPTIONS.model,
      temperature: DEFAULT_OPTIONS.temperature,
      stream: false,
      images: [{ name: image.name, dataUrl: image.dataUrl }],
      maxOutputTokens: DEFAULT_OPTIONS.maxTokens,
    }).length;
    getResource.mockResolvedValue({
      vision: {
        enabled: true,
        models: [DEFAULT_OPTIONS.model],
        limits: { maxRequestBytes: characterCount + 1 },
      },
    });
    await expect(
      analyzeWithAI({
        options: { ...DEFAULT_OPTIONS, secureDataSourceUid: 'secure-uid' },
        prompt,
        images: [image],
      })
    ).rejects.toThrow('too large');
    expect(postResource).not.toHaveBeenCalled();
  });

  it('rejects remote image URLs before sending', async () => {
    await expect(
      analyzeWithAI({
        options: { ...DEFAULT_OPTIONS, secureDataSourceUid: 'secure-uid' },
        prompt: { system: 's', user: 'u' },
        images: [{ ...image, dataUrl: 'https://example.test/image.png' }],
      })
    ).rejects.toThrow('encoding');
    expect(postResource).not.toHaveBeenCalled();
  });

  it('does not send if canceled during capabilities lookup', async () => {
    const controller = new AbortController();
    getResource.mockImplementation(async () => {
      controller.abort();
      return { vision: { enabled: true, models: [DEFAULT_OPTIONS.model] } };
    });
    await expect(
      analyzeWithAI({
        options: { ...DEFAULT_OPTIONS, secureDataSourceUid: 'secure-uid' },
        prompt: { system: 's', user: 'u' },
        images: [image],
        signal: controller.signal,
      })
    ).rejects.toThrow('canceled');
    expect(postResource).not.toHaveBeenCalled();
  });
});
