import { SetupGuideEditor } from './components/SetupGuideEditor';
import { ANALYSIS_PRESETS } from './utils/presets';
import { PanelPlugin } from '@grafana/data';
import { IntelligenceGatewayPanel } from './components/IntelligenceGatewayPanel';
import { ModelEditor } from './components/ModelEditor';
import { WideNumberEditor, WideSliderEditor } from './components/NumericEditors';
import { PromptPreviewEditor } from './components/PromptPreviewEditor';
import { SecureDataSourceEditor } from './components/SecureDataSourceEditor';
import { DEFAULT_OPTIONS, IntelligenceGatewayOptions } from './types';

export const plugin = new PanelPlugin<IntelligenceGatewayOptions>(IntelligenceGatewayPanel).setPanelOptions((builder) =>
  builder
    .addCustomEditor({
      id: 'setupGuide',
      path: 'promptPreview',
      name: 'Start here',
      category: ['1. Connect AI'],
      editor: SetupGuideEditor,
    })
    .addCustomEditor({
      id: 'secureDataSourceUid',
      path: 'secureDataSourceUid',
      name: 'Secure AI data source',
      description:
        'Required. Select a digitalrcs-intelligencegateway-datasource instance. Credentials and provider policy remain on the Grafana server.',
      category: ['1. Connect AI'],
      editor: SecureDataSourceEditor,
      defaultValue: DEFAULT_OPTIONS.secureDataSourceUid,
    })
    .addCustomEditor({
      id: 'model',
      path: 'model',
      name: 'Model',
      description: 'Enter an administrator-approved model identifier or load models through the secure data source.',
      category: ['1. Connect AI'],
      editor: ModelEditor,
      defaultValue: DEFAULT_OPTIONS.model,
    })

    .addBooleanSwitch({
      path: 'includeStatistics',
      name: 'Calculate sample statistics',
      description: 'Compute facts from included query rows before asking AI. Statistics share the query context limit.',
      category: ['2. Choose evidence'],
      defaultValue: true,
    })
    .addSelect({
      path: 'metricKind',
      name: 'Numeric metric meaning',
      description:
        'Unknown: raw values only. Gauge: sample averages and baseline differences. Counter: adjacent increases with reset handling, never rates. Use separate panels for mixed semantics.',
      category: ['2. Choose evidence'],
      defaultValue: 'unknown',
      settings: {
        options: [
          { value: 'unknown', label: 'Unknown / raw values' },
          { value: 'gauge', label: 'Gauge / measured values' },
          { value: 'counter', label: 'Cumulative counter' },
        ],
      },
    })
    .addBooleanSwitch({
      path: 'compareBaseline',
      name: 'Compare with a baseline',
      description:
        'Use two supplied query results. Configure the baseline historical window in Queries; this panel does not fetch history.',
      category: ['2. Choose evidence'],
      defaultValue: false,
    })
    .addTextInput({
      path: 'currentRefId',
      name: 'Current query reference ID',
      description: 'Exact query ID, for example A. Only the selected current and baseline results are included.',
      category: ['2. Choose evidence'],
      defaultValue: 'A',
      showIf: (options) => options.compareBaseline,
    })
    .addTextInput({
      path: 'baselineRefId',
      name: 'Baseline query reference ID',
      description:
        'A different query ID, for example B. Match field names, labels and units to calculate gauge comparisons.',
      category: ['2. Choose evidence'],
      defaultValue: 'B',
      showIf: (options) => options.compareBaseline,
    })
    .addTextInput({
      path: 'sourcePanelHint',
      name: 'Source panel title or ID (hint)',
      description:
        "Best-effort label for the prompt. Use the Dashboard data source to actually receive another panel's data.",
      category: ['2. Choose evidence'],
      defaultValue: DEFAULT_OPTIONS.sourcePanelHint,
    })
    .addRadio({
      path: 'emptyDataBehavior',
      name: 'When no data arrives',
      category: ['2. Choose evidence'],
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
      path: 'showImageControls',
      name: 'Show image controls',
      description:
        'Upload PNG/JPEG images. Image sending requires administrator-enabled vision support in the secure AI data source.',
      category: ['2. Choose evidence'],
      defaultValue: DEFAULT_OPTIONS.showImageControls,
    })
    .addBooleanSwitch({
      path: 'includeDataWithImages',
      name: 'Include query data with images',
      description:
        "Send this Intelligence panel's query results alongside images for precise values. Use the Dashboard data source to share another panel's query results.",
      category: ['2. Choose evidence'],
      defaultValue: DEFAULT_OPTIONS.includeDataWithImages,
    })

    .addSelect({
      path: 'analysisPreset',
      name: 'Analysis task',
      description: 'Presets add instructions to your existing prompts. Custom uses your prompts unchanged.',
      category: ['3. Analysis task'],
      defaultValue: 'custom',
      settings: { options: ANALYSIS_PRESETS.map(({ value, label }) => ({ value, label })) },
    })
    .addTextInput({
      path: 'skillsContext',
      name: 'Skills / additional context',
      description:
        'Plain text or JSON with domain rules, definitions, runbooks, thresholds, and response requirements.',
      category: ['3. Analysis task'],
      defaultValue: DEFAULT_OPTIONS.skillsContext,
      settings: { useTextarea: true, rows: 10 },
    })
    .addBooleanSwitch({
      path: 'autoAnalyze',
      name: 'Analyze automatically',
      description:
        'Text-only analysis after data or prompt changes. Pauses while image inputs are open or attached; images always require a manual Analyze action.',
      category: ['3. Analysis task'],
      defaultValue: DEFAULT_OPTIONS.autoAnalyze,
    })
    .addCustomEditor({
      id: 'autoAnalyzeDelayMs',
      path: 'autoAnalyzeDelayMs',
      name: 'Auto-analysis debounce (ms)',
      category: ['3. Analysis task'],
      defaultValue: DEFAULT_OPTIONS.autoAnalyzeDelayMs,
      settings: { min: 300, max: 30000, integer: true },
      editor: WideNumberEditor,
      showIf: (options) => options.autoAnalyze,
    })
    .addBooleanSwitch({
      path: 'showAnalyzeButton',
      name: 'Show Analyze button',
      category: ['3. Analysis task'],
      defaultValue: DEFAULT_OPTIONS.showAnalyzeButton,
    })

    .addBooleanSwitch({
      path: 'showEvidence',
      name: 'Show evidence details',
      description:
        'Show time range, included/omitted rows, sources and submitted query evidence. Out-of-date warnings always remain visible.',
      category: ['4. Results and sharing'],
      defaultValue: true,
    })
    .addBooleanSwitch({
      path: 'allowFollowUps',
      name: 'Enable snapshot follow-ups',
      description:
        'Ask up to six follow-ups on the original evidence. Automatic analysis pauses during a conversation. Nothing is saved with the dashboard.',
      category: ['4. Results and sharing'],
      defaultValue: true,
    })
    .addTextInput({
      path: 'responseTitle',
      name: 'Assessment title',
      category: ['4. Results and sharing'],
      defaultValue: DEFAULT_OPTIONS.responseTitle,
    })
    .addTextInput({
      path: 'responseDescription',
      name: 'Description',
      category: ['4. Results and sharing'],
      defaultValue: DEFAULT_OPTIONS.responseDescription,
    })

    .addTextInput({
      path: 'systemPrompt',
      name: 'System / backend prompt',
      description: 'Core role and assessment instructions. Supports the template variables listed below.',
      category: ['5. Advanced prompts and limits'],
      defaultValue: DEFAULT_OPTIONS.systemPrompt,
      settings: { useTextarea: true, rows: 10 },
    })
    .addTextInput({
      path: 'userPromptTemplate',
      name: 'User message template',
      description: 'Supported: {{data}}, {{timeRange}}, {{panelTitle}}, {{panelId}}, {{skills}}, {{sourcePanel}}.',
      category: ['5. Advanced prompts and limits'],
      defaultValue: DEFAULT_OPTIONS.userPromptTemplate,
      settings: { useTextarea: true, rows: 12 },
    })
    .addCustomEditor({
      id: 'promptPreview',
      path: 'promptPreview',
      name: 'Constructed prompt preview',
      description: 'Live DataFrame values are represented by a placeholder in the options editor.',
      category: ['5. Advanced prompts and limits'],
      editor: PromptPreviewEditor,
      defaultValue: '',
    })
    .addCustomEditor({
      id: 'maxRows',
      path: 'maxRows',
      name: 'Recent rows per frame',
      description: 'Serializes the most recent rows from every DataFrame.',
      category: ['5. Advanced prompts and limits'],
      defaultValue: DEFAULT_OPTIONS.maxRows,
      settings: { min: 1, max: 1000, integer: true },
      editor: WideNumberEditor,
    })
    .addCustomEditor({
      id: 'maxContextChars',
      path: 'maxContextChars',
      name: 'Maximum context characters',
      description: 'Hard cap for serialized dashboard data to control request size and cost.',
      category: ['5. Advanced prompts and limits'],
      defaultValue: DEFAULT_OPTIONS.maxContextChars,
      settings: { min: 1000, max: 200000, integer: true },
      editor: WideNumberEditor,
    })
    .addCustomEditor({
      id: 'temperature',
      path: 'temperature',
      name: 'Temperature',
      category: ['5. Advanced prompts and limits'],
      defaultValue: DEFAULT_OPTIONS.temperature,
      settings: { min: 0, max: 2, step: 0.1 },
      editor: WideSliderEditor,
    })
    .addBooleanSwitch({
      path: 'unlimitedOutputTokens',
      name: 'Provider/model default output limit',
      description:
        'Omits max_tokens from the request. This removes the panel cap but does not bypass the provider, model, context-window, or account limits.',
      category: ['5. Advanced prompts and limits'],
      defaultValue: DEFAULT_OPTIONS.unlimitedOutputTokens,
    })
    .addCustomEditor({
      id: 'maxTokens',
      path: 'maxTokens',
      name: 'Maximum output tokens',
      description:
        'Hard request cap for output and, on many models, hidden reasoning. Supports up to 1,048,576 tokens.',
      category: ['5. Advanced prompts and limits'],
      defaultValue: DEFAULT_OPTIONS.maxTokens,
      settings: { min: 64, max: 1048576, step: 64 },
      editor: WideSliderEditor,
      showIf: (options) => !options.unlimitedOutputTokens,
    })
    .addCustomEditor({
      id: 'responseLengthTokens',
      path: 'responseLengthTokens',
      name: 'Requested answer max tokens (soft)',
      description:
        'Adds a prompt instruction asking for a shorter visible answer. Use 0 for no length instruction. Models may only approximate token counts.',
      category: ['5. Advanced prompts and limits'],
      defaultValue: DEFAULT_OPTIONS.responseLengthTokens,
      settings: { min: 0, max: 1048576, integer: true },
      editor: WideNumberEditor,
    })
    .addCustomEditor({
      id: 'responseTimeoutSeconds',
      path: 'responseTimeoutSeconds',
      name: 'Response timeout (seconds)',
      description: 'Stops an analysis that does not complete within this time. Local models may need several minutes.',
      category: ['5. Advanced prompts and limits'],
      defaultValue: DEFAULT_OPTIONS.responseTimeoutSeconds,
      settings: { min: 10, max: 600, integer: true },
      editor: WideNumberEditor,
    })

    .addColorPicker({
      path: 'backgroundColor',
      name: 'Background color',
      category: ['6. Appearance'],
      defaultValue: DEFAULT_OPTIONS.backgroundColor,
    })
    .addColorPicker({
      path: 'textColor',
      name: 'Text color',
      description: 'Leave empty to use the active Grafana theme.',
      category: ['6. Appearance'],
      defaultValue: DEFAULT_OPTIONS.textColor,
    })
    .addCustomEditor({
      id: 'fontSize',
      path: 'fontSize',
      name: 'Font size',
      category: ['6. Appearance'],
      defaultValue: DEFAULT_OPTIONS.fontSize,
      settings: { min: 10, max: 48, integer: true },
      editor: WideNumberEditor,
    })
    .addCustomEditor({
      id: 'padding',
      path: 'padding',
      name: 'Padding',
      category: ['6. Appearance'],
      defaultValue: DEFAULT_OPTIONS.padding,
      settings: { min: 0, max: 64, integer: true },
      editor: WideNumberEditor,
    })
    .addRadio({
      path: 'alignment',
      name: 'Alignment',
      category: ['6. Appearance'],
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
