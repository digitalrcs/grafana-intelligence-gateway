import { IntelligenceGatewayOptions } from '../types';

export const ANALYSIS_PRESETS = [
  { value: 'custom', label: 'Custom instructions', instruction: '' },
  {
    value: 'spike',
    label: 'Explain this spike',
    instruction:
      'Locate the largest visible changes and their timestamps. Separate measured observations from possible causes. Suggest three checks; do not claim a root cause without evidence.',
  },
  {
    value: 'compare',
    label: 'Compare these series',
    instruction:
      'Compare the supplied series and, if provided, current and baseline results. Use calculated comparisons when present. Respect units, labels, sample coverage and counter semantics. Do not invent historical data.',
  },
  {
    value: 'handover',
    label: 'Summarize for handover',
    instruction:
      'Write a concise incident handover with Observations, Impact supported by evidence, Uncertainty, and Next checks. Include the supplied time range. Do not invent actions already taken.',
  },
  {
    value: 'quality',
    label: 'Check data quality',
    instruction:
      'Assess missing or invalid supplied values, sampling limitations, truncation and inconsistencies. Distinguish absent samples from explicit nulls. Do not infer expected cadence or outages without evidence.',
  },
] as const;

export const presetInstruction = (preset: IntelligenceGatewayOptions['analysisPreset']) =>
  ANALYSIS_PRESETS.find((entry) => entry.value === preset)?.instruction ?? '';
