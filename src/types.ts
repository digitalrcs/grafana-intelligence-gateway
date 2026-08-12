export type AIProvider = 'openai' | 'lmstudio' | 'custom' | 'copilot';
export type TextAlignment = 'left' | 'center' | 'right';
export type ReasoningEffort = 'default' | 'none' | 'low' | 'medium' | 'high';

export interface IntelligenceGatewayOptions {
  provider: AIProvider;
  apiKey: string;
  baseUrl: string;
  model: string;
  copilotEndpoint: string;
  copilotToken: string;
  temperature: number;
  maxTokens: number;
  unlimitedOutputTokens: boolean;
  responseLengthTokens: number;
  reasoningEffort: ReasoningEffort;
  responseTimeoutSeconds: number;
  streaming: boolean;
  systemPrompt: string;
  userPromptTemplate: string;
  skillsContext: string;
  promptPreview: string;
  maxRows: number;
  maxContextChars: number;
  sourcePanelHint: string;
  autoAnalyze: boolean;
  autoAnalyzeDelayMs: number;
  showAnalyzeButton: boolean;
  emptyDataBehavior: 'allow' | 'warn' | 'block';
  responseTitle: string;
  responseDescription: string;
  backgroundColor: string;
  textColor: string;
  fontSize: number;
  padding: number;
  alignment: TextAlignment;
}

export interface PromptVariables {
  data: string;
  timeRange: string;
  panelTitle: string;
  panelId: string;
  skills: string;
  sourcePanel: string;
}

export interface ConstructedPrompt {
  system: string;
  user: string;
}

export const DEFAULT_SYSTEM_PROMPT = `You are a careful observability analyst. Assess the supplied Grafana data, identify meaningful patterns, anomalies, risks, and likely explanations. Distinguish observations from hypotheses. Be concise, use Markdown, and recommend concrete next steps.`;

export const DEFAULT_USER_PROMPT = `Assess the dashboard context below.

Panel: {{panelTitle}} (ID: {{panelId}})
Time range: {{timeRange}}
Source panel hint: {{sourcePanel}}

Skills and additional context:
{{skills}}

Dashboard data:
{{data}}`;

export const DEFAULT_OPTIONS: IntelligenceGatewayOptions = {
  provider: 'openai',
  apiKey: '',
  baseUrl: 'https://api.openai.com/v1',
  model: 'gpt-4.1-mini',
  copilotEndpoint: '',
  copilotToken: '',
  temperature: 0.2,
  maxTokens: 1200,
  unlimitedOutputTokens: false,
  responseLengthTokens: 0,
  reasoningEffort: 'none',
  responseTimeoutSeconds: 300,
  streaming: false,
  systemPrompt: DEFAULT_SYSTEM_PROMPT,
  userPromptTemplate: DEFAULT_USER_PROMPT,
  skillsContext: '',
  promptPreview: '',
  maxRows: 50,
  maxContextChars: 24000,
  sourcePanelHint: '',
  autoAnalyze: false,
  autoAnalyzeDelayMs: 1200,
  showAnalyzeButton: true,
  emptyDataBehavior: 'warn',
  responseTitle: 'Intelligence assessment',
  responseDescription: '',
  backgroundColor: 'transparent',
  textColor: '',
  fontSize: 14,
  padding: 16,
  alignment: 'left',
};
