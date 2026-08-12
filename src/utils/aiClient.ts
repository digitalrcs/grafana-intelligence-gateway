import { getDataSourceSrv } from '@grafana/runtime';
import { ConstructedPrompt, IntelligenceGatewayOptions } from '../types';

interface ChatCompletionResponse {
  choices?: Array<{
    message?: { content?: string; reasoning_content?: string; reasoning?: string };
    text?: string;
    finish_reason?: string;
  }>;
  output_text?: string;
  text?: string;
  message?: string;
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
  const normalizedUid = uid.trim();
  if (!normalizedUid) {
    throw new Error('Select an Intelligence Gateway Secure AI data source before running analysis.');
  }
  const datasource = await getDataSourceSrv().get(normalizedUid);
  if (datasource.type !== SECURE_DATASOURCE_PLUGIN_ID) {
    throw new Error('The selected data source is not an Intelligence Gateway Secure AI instance.');
  }
  const resourceDatasource = datasource as unknown as Partial<ResourceDataSource>;
  if (!resourceDatasource.getResource || !resourceDatasource.postResource) {
    throw new Error('The selected secure AI data source does not expose backend resources.');
  }
  return resourceDatasource as ResourceDataSource;
};

export const extractResponseText = (payload: ChatCompletionResponse): string => {
  const choice = payload.choices?.[0];
  const text = choice?.message?.content ?? choice?.text ?? payload.output_text ?? payload.text ?? payload.message;
  if (!text?.trim()) {
    const reasoning = choice?.message?.reasoning_content ?? choice?.message?.reasoning;
    if (reasoning?.trim() && choice?.finish_reason === 'length') {
      throw new Error(
        'The model used the entire output-token limit for reasoning before producing a visible answer. Increase Maximum output tokens or select a non-reasoning model.'
      );
    }
    if (reasoning?.trim()) {
      throw new Error('The model returned reasoning but no visible final answer. Try a different model.');
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
    return new Error(`The secure AI data source rejected the request. Ask a Grafana administrator to verify its credentials and permissions.${detail ? ` ${detail}` : ''}`);
  }
  if (status === 429) {
    return new Error(`The secure AI data source or provider rate limit was reached.${detail ? ` ${detail}` : ''}`);
  }
  if (status && status >= 500) {
    return new Error(`The secure AI backend is unavailable (HTTP ${status}).${detail ? ` ${detail}` : ''}`);
  }
  return new Error(detail || 'The secure AI request failed. Ask a Grafana administrator to run Save & test on the data source.');
};

export const extractModelIds = (payload: ModelListResponse): string[] => {
  const entries = payload.data ?? payload.models ?? [];
  const ids = entries
    .map((entry) => (typeof entry === 'string' ? entry : entry.id ?? entry.name))
    .filter((id): id is string => Boolean(id?.trim()))
    .map((id) => id.trim());
  return Array.from(new Set(ids)).sort((left, right) => left.localeCompare(right));
};

export const fetchAvailableModels = async (
  options: Pick<IntelligenceGatewayOptions, 'secureDataSourceUid'>
): Promise<string[]> => {
  try {
    const datasource = await getSecureDataSource(options.secureDataSourceUid ?? '');
    const payload = await datasource.getResource<ModelListResponse>('models');
    const models = extractModelIds(payload);
    if (models.length === 0) {
      throw new Error('The secure data source returned no administrator-approved model identifiers.');
    }
    return models;
  } catch (error) {
    throw friendlyError(error);
  }
};

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

export interface AnalyzeRequest {
  options: IntelligenceGatewayOptions;
  prompt: ConstructedPrompt;
  signal?: AbortSignal;
}

export const analyzeWithAI = async ({ options, prompt, signal }: AnalyzeRequest): Promise<string> => {
  const timeoutSeconds = options.responseTimeoutSeconds ?? 300;
  const timedSignal = createTimedSignal(signal, timeoutSeconds);
  try {
    if (!options.model.trim()) {
      throw new Error('An administrator-approved AI model identifier is required.');
    }
    const datasource = await getSecureDataSource(options.secureDataSourceUid ?? '');
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
  } catch (error) {
    if (timedSignal.didTimeOut()) {
      throw new Error(
        `The AI response timed out after ${timeoutSeconds} seconds. Increase Response timeout, reduce the prompt size, or ask the administrator to adjust the secure data source timeout.`
      );
    }
    throw friendlyError(error);
  } finally {
    timedSignal.cleanup();
  }
};
