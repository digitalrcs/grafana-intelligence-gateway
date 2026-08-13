export type TextAlignment = 'left' | 'center' | 'right';

export interface IntelligenceGatewayOptions {
  secureDataSourceUid: string;
  model: string;
  temperature: number;
  maxTokens: number;
  unlimitedOutputTokens: boolean;
  responseLengthTokens: number;
  responseTimeoutSeconds: number;
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
  secureDataSourceUid: '',
  model: 'gpt-4.1-mini',
  temperature: 0.2,
  maxTokens: 1200,
  unlimitedOutputTokens: false,
  responseLengthTokens: 0,
  responseTimeoutSeconds: 300,
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
