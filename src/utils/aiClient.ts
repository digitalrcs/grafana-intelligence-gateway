import { getBackendSrv, getDataSourceSrv } from '@grafana/runtime';
import { IntelligenceGatewayOptions, ConstructedPrompt } from '../types';

interface ChatCompletionResponse {
  choices?: Array<{
    message?: { content?: string; reasoning_content?: string; reasoning?: string };
    text?: string;
    finish_reason?: string;
  }>;
  output_text?: string;
  text?: string;
  message?: string;
  activities?: Array<{ text?: string }>;
}

interface ModelListResponse {
  data?: Array<{ id?: string; name?: string } | string>;
  models?: Array<{ id?: string; name?: string } | string>;
}

interface ResourceDataSource {
  getResource<T>(path: string): Promise<T>;
  postResource<T>(path: string, body: unknown, options?: { abortSignal?: AbortSignal }): Promise<T>;
}

export const SECURE_DATASOURCE_PLUGIN_ID = 'digitalrcs-intelligencegateway-datasource';

const getSecureDataSource = async (uid: string): Promise<ResourceDataSource> => {
  const datasource = await getDataSourceSrv().get(uid);
  if (datasource.type !== SECURE_DATASOURCE_PLUGIN_ID) {
    throw new Error('The selected data source is not an Intelligence Gateway Secure AI instance.');
  }
  const resourceDatasource = datasource as unknown as Partial<ResourceDataSource>;
  if (!resourceDatasource.getResource || !resourceDatasource.postResource) {
    throw new Error('The selected secure AI data source does not expose backend resources.');
  }
  return resourceDatasource as ResourceDataSource;
};

const joinUrl = (baseUrl: string, path: string): string => `${baseUrl.replace(/\/+$/, '')}/${path.replace(/^\/+/, '')}`;

export const extractResponseText = (payload: ChatCompletionResponse): string => {
  const choice = payload.choices?.[0];
  const text =
    choice?.message?.content ??
    choice?.text ??
    payload.output_text ??
    payload.text ??
    payload.message ??
    payload.activities?.find((activity) => activity.text)?.text;
  if (!text?.trim()) {
    const reasoning = choice?.message?.reasoning_content ?? choice?.message?.reasoning;
    if (reasoning?.trim()) {
      if (choice?.finish_reason === 'length') {
        throw new Error(
          'The model used the entire output-token limit for reasoning before producing a visible answer. Set Reasoning effort to None, increase Maximum output tokens, or enable Provider/model default output limit.'
        );
      }
      throw new Error(
        'The model returned reasoning but no visible final answer. Set Reasoning effort to None or try a different model.'
      );
    }
    throw new Error('The AI endpoint returned no text content.');
  }
  return text.trim();
};

const friendlyError = (error: unknown): Error => {
  const candidate = error as {
    status?: number;
    statusText?: string;
    data?: { error?: { message?: string }; message?: string };
    message?: string;
  };
  const status = candidate.status;
  const detail = candidate.data?.error?.message ?? candidate.data?.message ?? candidate.message ?? candidate.statusText;
  if (status === 401 || status === 403) {
    return new Error(`Authentication failed. Check the configured key or token.${detail ? ` ${detail}` : ''}`);
  }
  if (status === 429) {
    return new Error(`The AI provider rate limit was reached.${detail ? ` ${detail}` : ''}`);
  }
  if (status && status >= 500) {
    return new Error(`The AI provider is unavailable (HTTP ${status}).${detail ? ` ${detail}` : ''}`);
  }
  return new Error(detail || 'The AI request failed. Check the endpoint, model, CORS settings, and network access.');
};

const requestBuffered = async <T>(
  url: string,
  headers: Record<string, string>,
  data: unknown,
  signal?: AbortSignal
): Promise<T> => {
  try {
    const response = await new Promise<{ data: T }>((resolve, reject) => {
      getBackendSrv()
        .fetch<T>({ url, method: 'POST', headers, data, showErrorAlert: false, abortSignal: signal })
        .subscribe({ next: (value) => resolve(value), error: reject });
    });
    return response.data;
  } catch (error) {
    throw friendlyError(error);
  }
};

const requestModelList = async <T>(url: string, headers: Record<string, string>): Promise<T> => {
  try {
    const response = await new Promise<{ data: T }>((resolve, reject) => {
      getBackendSrv()
        .fetch<T>({ url, method: 'GET', headers, showErrorAlert: false })
        .subscribe({ next: (value) => resolve(value), error: reject });
    });
    return response.data;
  } catch (error) {
    throw friendlyError(error);
  }
};

export const extractModelIds = (payload: ModelListResponse): string[] => {
  const entries = payload.data ?? payload.models ?? [];
  const ids = entries
    .map((entry) => {
      if (typeof entry === 'string') {
        return entry;
      }
      return entry.id ?? entry.name;
    })
    .filter((id): id is string => Boolean(id?.trim()))
    .map((id) => id.trim());
  return Array.from(new Set(ids)).sort((left, right) => left.localeCompare(right));
};

export const fetchAvailableModels = async (
  options: Pick<IntelligenceGatewayOptions, 'secureDataSourceUid' | 'baseUrl' | 'apiKey'>
): Promise<string[]> => {
  const secureDataSourceUid = options.secureDataSourceUid?.trim() ?? '';
  if (secureDataSourceUid) {
    try {
      const datasource = await getSecureDataSource(secureDataSourceUid);
      const payload = await datasource.getResource<ModelListResponse>('models');
      const models = extractModelIds(payload);
      if (models.length === 0) {
        throw new Error('The secure data source returned no model identifiers.');
      }
      return models;
    } catch (error) {
      throw friendlyError(error);
    }
  }
  const baseUrl = options.baseUrl.trim();
  if (!baseUrl) {
    throw new Error('Enter a base URL before loading models.');
  }
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (options.apiKey.trim()) {
    headers.Authorization = `Bearer ${options.apiKey.trim()}`;
  }
  const url = /\/models\/?$/i.test(baseUrl) ? baseUrl : joinUrl(baseUrl, 'models');
  const payload = await requestModelList<ModelListResponse>(url, headers);
  const models = extractModelIds(payload);
  if (models.length === 0) {
    throw new Error('The endpoint returned no model identifiers.');
  }
  return models;
};

const requestStreaming = async (
  url: string,
  headers: Record<string, string>,
  data: unknown,
  onChunk: (text: string) => void,
  signal?: AbortSignal
): Promise<string> => {
  let response: Response;
  try {
    response = await fetch(url, { method: 'POST', headers, body: JSON.stringify(data), signal });
  } catch (error) {
    throw friendlyError(error);
  }
  if (!response.ok) {
    let detail = response.statusText;
    try {
      const payload = (await response.json()) as { error?: { message?: string } };
      detail = payload.error?.message ?? detail;
    } catch {
      // Keep the HTTP status text when the provider did not return JSON.
    }
    throw friendlyError({ status: response.status, message: detail });
  }
  if (!response.body) {
    throw new Error('Streaming was requested, but the endpoint returned no response stream.');
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let complete = '';
  let sawReasoning = false;
  let finishReason = '';
  while (true) {
    const { value, done } = await reader.read();
    if (done) {
      break;
    }
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith('data:') || trimmed === 'data: [DONE]') {
        continue;
      }
      try {
        const event = JSON.parse(trimmed.slice(5).trim()) as {
          choices?: Array<{
            delta?: { content?: string; reasoning_content?: string; reasoning?: string };
            finish_reason?: string;
          }>;
        };
        const choice = event.choices?.[0];
        const chunk = choice?.delta?.content;
        sawReasoning = sawReasoning || Boolean(choice?.delta?.reasoning_content || choice?.delta?.reasoning);
        finishReason = choice?.finish_reason ?? finishReason;
        if (chunk) {
          complete += chunk;
          onChunk(complete);
        }
      } catch {
        // Ignore provider keep-alives and non-JSON event lines.
      }
    }
  }
  if (!complete.trim()) {
    if (sawReasoning && finishReason === 'length') {
      throw new Error(
        'The model used the entire output-token limit for reasoning before producing a visible answer. Set Reasoning effort to None, increase Maximum output tokens, or enable Provider/model default output limit.'
      );
    }
    if (sawReasoning) {
      throw new Error(
        'The model streamed reasoning but no visible final answer. Set Reasoning effort to None or try a different model.'
      );
    }
    throw new Error('The streaming response completed without text content.');
  }
  return complete.trim();
};

export interface AnalyzeRequest {
  options: IntelligenceGatewayOptions;
  prompt: ConstructedPrompt;
  onChunk?: (text: string) => void;
  signal?: AbortSignal;
}

interface TimedSignal {
  signal: AbortSignal;
  didTimeOut: () => boolean;
  cleanup: () => void;
}

const createTimedSignal = (upstream: AbortSignal | undefined, timeoutSeconds: number): TimedSignal => {
  const controller = new AbortController();
  let timedOut = false;
  const abortFromUpstream = () => controller.abort(upstream?.reason);
  if (upstream?.aborted) {
    abortFromUpstream();
  } else {
    upstream?.addEventListener('abort', abortFromUpstream, { once: true });
  }
  const timeoutId = window.setTimeout(
    () => {
      timedOut = true;
      controller.abort();
    },
    Math.max(10, timeoutSeconds) * 1000
  );
  return {
    signal: controller.signal,
    didTimeOut: () => timedOut,
    cleanup: () => {
      window.clearTimeout(timeoutId);
      upstream?.removeEventListener('abort', abortFromUpstream);
    },
  };
};

export const analyzeWithAI = async ({
  options,
  prompt,
  onChunk = () => undefined,
  signal,
}: AnalyzeRequest): Promise<string> => {
  const timeoutSeconds = options.responseTimeoutSeconds ?? 300;
  const timedSignal = createTimedSignal(signal, timeoutSeconds);
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  try {
    const secureDataSourceUid = options.secureDataSourceUid?.trim() ?? '';
    if (secureDataSourceUid) {
      if (!options.model.trim()) {
        throw new Error('An AI model identifier is required.');
      }
      const datasource = await getSecureDataSource(secureDataSourceUid);
      const body: Record<string, unknown> = {
        prompt,
        model: options.model.trim(),
        temperature: options.temperature,
        stream: false,
      };
      if (!options.unlimitedOutputTokens) {
        body.maxOutputTokens = Math.max(1, Math.floor(options.maxTokens));
      }
      const payload = await datasource.postResource<ChatCompletionResponse>('chat/completions', body, {
        abortSignal: timedSignal.signal,
      });
      return extractResponseText(payload);
    }
    if (options.provider === 'copilot') {
      if (!options.copilotEndpoint.trim()) {
        throw new Error('A Copilot Studio messaging endpoint is required.');
      }
      if (options.copilotToken.trim()) {
        headers.Authorization = `Bearer ${options.copilotToken.trim()}`;
      }
      const payload = await requestBuffered<ChatCompletionResponse>(
        options.copilotEndpoint.trim(),
        headers,
        {
          type: 'message',
          from: { id: 'grafana-intelligence-gateway' },
          text: prompt.user,
          channelData: { systemPrompt: prompt.system },
        },
        timedSignal.signal
      );
      return extractResponseText(payload);
    }

    if (!options.baseUrl.trim()) {
      throw new Error('An AI provider base URL is required.');
    }
    if (!options.model.trim()) {
      throw new Error('An AI model identifier is required.');
    }
    if (options.provider === 'openai' && !options.apiKey.trim()) {
      throw new Error('An OpenAI API key is required.');
    }
    if (options.apiKey.trim()) {
      headers.Authorization = `Bearer ${options.apiKey.trim()}`;
    }

    const url = joinUrl(options.baseUrl, 'chat/completions');
    const body: Record<string, unknown> = {
      model: options.model.trim(),
      messages: [
        { role: 'system', content: prompt.system },
        { role: 'user', content: prompt.user },
      ],
      temperature: options.temperature,
      stream: options.streaming,
    };
    if (!options.unlimitedOutputTokens) {
      body.max_tokens = Math.max(1, Math.floor(options.maxTokens));
    }
    if (options.provider === 'lmstudio') {
      const reasoningEffort = options.reasoningEffort ?? 'none';
      if (reasoningEffort !== 'default') {
        body.reasoning_effort = reasoningEffort;
      }
    }
    if (options.streaming) {
      return requestStreaming(url, headers, body, onChunk, timedSignal.signal);
    }
    const payload = await requestBuffered<ChatCompletionResponse>(url, headers, body, timedSignal.signal);
    return extractResponseText(payload);
  } catch (error) {
    if (timedSignal.didTimeOut()) {
      throw new Error(
        `The AI response timed out after ${timeoutSeconds} seconds. The model may still be loading or reasoning. Increase Response timeout, reduce the prompt size, or use a faster model.`
      );
    }
    throw error;
  } finally {
    timedSignal.cleanup();
  }
};
