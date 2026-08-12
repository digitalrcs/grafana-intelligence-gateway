import { PanelPlugin, SelectableValue } from '@grafana/data';
import { ApiKeyEditor } from './components/ApiKeyEditor';
import { IntelligenceGatewayPanel } from './components/IntelligenceGatewayPanel';
import { ModelEditor } from './components/ModelEditor';
import { PromptPreviewEditor } from './components/PromptPreviewEditor';
import { AIProvider, DEFAULT_OPTIONS, IntelligenceGatewayOptions, ReasoningEffort } from './types';

const providerOptions: Array<SelectableValue<AIProvider>> = [
  { value: 'openai', label: 'OpenAI', description: 'OpenAI Chat Completions API' },
  { value: 'lmstudio', label: 'LM Studio', description: 'Local OpenAI-compatible server' },
  { value: 'custom', label: 'Custom / OpenAI-compatible', description: 'Any compatible chat completions endpoint' },
  { value: 'copilot', label: 'Copilot Studio (experimental)', description: 'Direct Line or messaging endpoint' },
];

const reasoningEffortOptions: Array<SelectableValue<ReasoningEffort>> = [
  { value: 'none', label: 'None', description: 'Reserve the output budget for the visible answer' },
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'default', label: 'Model default' },
];

export const plugin = new PanelPlugin<IntelligenceGatewayOptions>(IntelligenceGatewayPanel).setPanelOptions((builder) =>
  builder
    .addSelect({
      path: 'provider',
      name: 'Provider',
      category: ['AI provider'],
      defaultValue: DEFAULT_OPTIONS.provider,
      settings: { options: providerOptions },
    })
    .addCustomEditor({
      id: 'apiKey',
      path: 'apiKey',
      name: 'API key',
      description: 'Optional for LM Studio and some custom endpoints. Required for OpenAI.',
      category: ['AI provider'],
      editor: ApiKeyEditor,
      defaultValue: DEFAULT_OPTIONS.apiKey,
      showIf: (options) => options.provider !== 'copilot',
    })
    .addTextInput({
      path: 'baseUrl',
      name: 'Base URL',
      description: 'OpenAI defaults to https://api.openai.com/v1. LM Studio commonly uses http://localhost:1234/v1.',
      category: ['AI provider'],
      defaultValue: DEFAULT_OPTIONS.baseUrl,
      showIf: (options) => options.provider !== 'copilot',
    })
    .addCustomEditor({
      id: 'model',
      path: 'model',
      name: 'Model',
      description: 'Enter a model identifier manually or load the available models from the configured base URL.',
      category: ['AI provider'],
      editor: ModelEditor,
      defaultValue: DEFAULT_OPTIONS.model,
      showIf: (options) => options.provider !== 'copilot',
    })
    .addTextInput({
      path: 'copilotEndpoint',
      name: 'Messaging endpoint',
      description: 'Experimental: enter the complete Direct Line or compatible messaging URL.',
      category: ['AI provider'],
      defaultValue: DEFAULT_OPTIONS.copilotEndpoint,
      showIf: (options) => options.provider === 'copilot',
    })
    .addCustomEditor({
      id: 'copilotToken',
      path: 'copilotToken',
      name: 'Bearer token',
      description: 'Experimental and insecure in a frontend-only panel. Prefer a backend token exchange.',
      category: ['AI provider'],
      editor: ApiKeyEditor,
      defaultValue: DEFAULT_OPTIONS.copilotToken,
      showIf: (options) => options.provider === 'copilot',
    })
    .addSliderInput({
      path: 'temperature',
      name: 'Temperature',
      category: ['AI provider'],
      defaultValue: DEFAULT_OPTIONS.temperature,
      settings: { min: 0, max: 2, step: 0.1 },
      showIf: (options) => options.provider !== 'copilot',
    })
    .addBooleanSwitch({
      path: 'unlimitedOutputTokens',
      name: 'Provider/model default output limit',
      description:
        'Omits max_tokens from the request. This removes the panel cap but does not bypass the provider, model, context-window, or account limits.',
      category: ['AI provider'],
      defaultValue: DEFAULT_OPTIONS.unlimitedOutputTokens,
      showIf: (options) => options.provider !== 'copilot',
    })
    .addSliderInput({
      path: 'maxTokens',
      name: 'Maximum output tokens',
      description: 'Hard request cap for output and, on many models, hidden reasoning. Supports up to 1,048,576 tokens.',
      category: ['AI provider'],
      defaultValue: DEFAULT_OPTIONS.maxTokens,
      settings: { min: 64, max: 1048576, step: 64 },
      showIf: (options) => options.provider !== 'copilot' && !options.unlimitedOutputTokens,
    })
    .addNumberInput({
      path: 'responseLengthTokens',
      name: 'Requested answer max tokens (soft)',
      description:
        'Adds a prompt instruction asking for a shorter visible answer. Use 0 for no length instruction. Models may only approximate token counts.',
      category: ['AI provider'],
      defaultValue: DEFAULT_OPTIONS.responseLengthTokens,
      settings: { min: 0, max: 1048576, integer: true },
      showIf: (options) => options.provider !== 'copilot',
    })
    .addSelect({
      path: 'reasoningEffort',
      name: 'Reasoning effort',
      description:
        'LM Studio reasoning tokens count against the output limit. Use None when a model finishes with no visible answer.',
      category: ['AI provider'],
      defaultValue: DEFAULT_OPTIONS.reasoningEffort,
      settings: { options: reasoningEffortOptions },
      showIf: (options) => options.provider === 'lmstudio',
    })
    .addNumberInput({
      path: 'responseTimeoutSeconds',
      name: 'Response timeout (seconds)',
      description: 'Stops an analysis that does not complete within this time. Local models may need several minutes.',
      category: ['AI provider'],
      defaultValue: DEFAULT_OPTIONS.responseTimeoutSeconds,
      settings: { min: 10, max: 3600, integer: true },
      showIf: (options) => options.provider !== 'copilot',
    })
    .addBooleanSwitch({
      path: 'streaming',
      name: 'Stream response',
      description: 'Uses browser streaming and therefore requires endpoint CORS support. Copilot mode is buffered.',
      category: ['AI provider'],
      defaultValue: DEFAULT_OPTIONS.streaming,
      showIf: (options) => options.provider !== 'copilot',
    })
    .addTextInput({
      path: 'systemPrompt',
      name: 'System / backend prompt',
      description: 'Core role and assessment instructions. Supports the template variables listed below.',
      category: ['Prompt and skills'],
      defaultValue: DEFAULT_OPTIONS.systemPrompt,
      settings: { useTextarea: true, rows: 10 },
    })
    .addTextInput({
      path: 'userPromptTemplate',
      name: 'User message template',
      description: 'Supported: {{data}}, {{timeRange}}, {{panelTitle}}, {{panelId}}, {{skills}}, {{sourcePanel}}.',
      category: ['Prompt and skills'],
      defaultValue: DEFAULT_OPTIONS.userPromptTemplate,
      settings: { useTextarea: true, rows: 12 },
    })
    .addTextInput({
      path: 'skillsContext',
      name: 'Skills / additional context',
      description:
        'Plain text or JSON with domain rules, definitions, runbooks, thresholds, and response requirements.',
      category: ['Prompt and skills'],
      defaultValue: DEFAULT_OPTIONS.skillsContext,
      settings: { useTextarea: true, rows: 10 },
    })
    .addCustomEditor({
      id: 'promptPreview',
      path: 'promptPreview',
      name: 'Constructed prompt preview',
      description: 'Live DataFrame values are represented by a placeholder in the options editor.',
      category: ['Prompt and skills'],
      editor: PromptPreviewEditor,
      defaultValue: '',
    })
    .addNumberInput({
      path: 'maxRows',
      name: 'Recent rows per frame',
      description: 'Serializes the most recent rows from every DataFrame.',
      category: ['Data context'],
      defaultValue: DEFAULT_OPTIONS.maxRows,
      settings: { min: 1, max: 1000, integer: true },
    })
    .addNumberInput({
      path: 'maxContextChars',
      name: 'Maximum context characters',
      description: 'Hard cap for serialized dashboard data to control request size and cost.',
      category: ['Data context'],
      defaultValue: DEFAULT_OPTIONS.maxContextChars,
      settings: { min: 1000, max: 200000, integer: true },
    })
    .addTextInput({
      path: 'sourcePanelHint',
      name: 'Source panel title or ID (hint)',
      description:
        "Best-effort label for the prompt. Use the Dashboard data source to actually receive another panel's data.",
      category: ['Data context'],
      defaultValue: DEFAULT_OPTIONS.sourcePanelHint,
    })
    .addRadio({
      path: 'emptyDataBehavior',
      name: 'When no data arrives',
      category: ['Data context'],
      defaultValue: DEFAULT_OPTIONS.emptyDataBehavior,
      settings: {
        options: [
          { value: 'allow', label: 'Allow' },
          { value: 'warn', label: 'Warn' },
          { value: 'block', label: 'Block' },
        ],
      },
    })
    .addBooleanSwitch({
      path: 'autoAnalyze',
      name: 'Analyze automatically',
      description: 'Runs after data or prompt changes, with a debounce to reduce duplicate requests.',
      category: ['Behavior'],
      defaultValue: DEFAULT_OPTIONS.autoAnalyze,
    })
    .addNumberInput({
      path: 'autoAnalyzeDelayMs',
      name: 'Auto-analysis debounce (ms)',
      category: ['Behavior'],
      defaultValue: DEFAULT_OPTIONS.autoAnalyzeDelayMs,
      settings: { min: 300, max: 30000, integer: true },
      showIf: (options) => options.autoAnalyze,
    })
    .addBooleanSwitch({
      path: 'showAnalyzeButton',
      name: 'Show Analyze button',
      category: ['Behavior'],
      defaultValue: DEFAULT_OPTIONS.showAnalyzeButton,
    })
    .addTextInput({
      path: 'responseTitle',
      name: 'Assessment title',
      category: ['Display'],
      defaultValue: DEFAULT_OPTIONS.responseTitle,
    })
    .addTextInput({
      path: 'responseDescription',
      name: 'Description',
      category: ['Display'],
      defaultValue: DEFAULT_OPTIONS.responseDescription,
    })
    .addColorPicker({
      path: 'backgroundColor',
      name: 'Background color',
      category: ['Display'],
      defaultValue: DEFAULT_OPTIONS.backgroundColor,
    })
    .addColorPicker({
      path: 'textColor',
      name: 'Text color',
      description: 'Leave empty to use the active Grafana theme.',
      category: ['Display'],
      defaultValue: DEFAULT_OPTIONS.textColor,
    })
    .addNumberInput({
      path: 'fontSize',
      name: 'Font size',
      category: ['Display'],
      defaultValue: DEFAULT_OPTIONS.fontSize,
      settings: { min: 10, max: 48, integer: true },
    })
    .addNumberInput({
      path: 'padding',
      name: 'Padding',
      category: ['Display'],
      defaultValue: DEFAULT_OPTIONS.padding,
      settings: { min: 0, max: 64, integer: true },
    })
    .addRadio({
      path: 'alignment',
      name: 'Alignment',
      category: ['Display'],
      defaultValue: DEFAULT_OPTIONS.alignment,
      settings: {
        options: [
          { value: 'left', label: 'Left' },
          { value: 'center', label: 'Center' },
          { value: 'right', label: 'Right' },
        ],
      },
    })
);
