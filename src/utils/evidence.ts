import { DataFrame, FieldType, TimeRange } from '@grafana/data';
import { ConstructedPrompt, IntelligenceGatewayOptions } from '../types';
import { formatTimeRange } from './dataFrames';

export interface NumericSummary {
  field: string;
  labels?: Record<string, string>;
  unit?: string;
  valid: number;
  missing: number;
  min: number | null;
  max: number | null;
  mean: number | null;
  first: number | null;
  last: number | null;
  change: number | null;
  observedIncrease?: number | null;
  resets?: number | null;
  adjacentPairs?: number;
}
interface EvidenceFrame {
  name: string;
  refId?: string;
  role: string;
  totalRows: number;
  fields: Array<{
    name: string;
    type: FieldType;
    labels?: Record<string, string>;
    unit?: string;
    description?: string;
  }>;
  rows: unknown[][];
  statistics: NumericSummary[];
}
export interface Evidence {
  text: string;
  fingerprint: string;
  totalRows: number;
  includedRows: number;
  frameCount: number;
  truncated: boolean;
  sources: string[];
  timeRange: string;
  error: string;
}

const finite = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value);
const bounded = (value: number) => (Number.isFinite(value) ? value : null);
const keyFor = (stat: NumericSummary) =>
  JSON.stringify([stat.field, stat.unit ?? '', Object.entries(stat.labels ?? {}).sort()]);

export function summarize(
  values: unknown[],
  kind: IntelligenceGatewayOptions['metricKind']
): Omit<NumericSummary, 'field'> {
  let count = 0,
    mean = 0,
    min = Infinity,
    max = -Infinity,
    first: number | null = null,
    last: number | null = null;
  let previous: number | null = null,
    observedIncrease = 0,
    resets = 0,
    adjacentPairs = 0;
  for (const value of values) {
    if (!finite(value)) {
      previous = null;
      continue;
    }
    count++;
    mean = mean * ((count - 1) / count) + value / count;
    min = Math.min(min, value);
    max = Math.max(max, value);
    if (first === null) {
      first = value;
    }
    if (previous !== null && value >= 0 && previous >= 0) {
      adjacentPairs++;
      if (value < previous) {
        resets++;
        observedIncrease += value;
      } else {
        observedIncrease += value - previous;
      }
    }
    last = value;
    previous = value;
  }
  return {
    valid: count,
    missing: values.length - count,
    min: count ? min : null,
    max: count ? max : null,
    mean: kind === 'counter' || !count ? null : bounded(mean),
    first,
    last,
    change: kind === 'counter' || first === null || last === null ? null : bounded(last - first),
    ...(kind === 'counter'
      ? {
          observedIncrease: adjacentPairs ? bounded(observedIncrease) : null,
          resets: adjacentPairs ? resets : null,
          adjacentPairs,
        }
      : {}),
  };
}

// Change detection only: this is not a cryptographic integrity or security digest.
export function fingerprintFrames(frames: DataFrame[], range: string): string {
  let hash = 2166136261;
  const add = (value: unknown) => {
    const serialized = JSON.stringify(value) ?? 'undefined';
    // Length-prefix each token: [1, 23] and [12, 3] must not hash the same input stream.
    const text = `${serialized.length}:${serialized}`;
    for (let i = 0; i < text.length; i++) {
      hash = Math.imul(hash ^ text.charCodeAt(i), 16777619);
    }
  };
  add(range);
  add(frames.length);
  for (const frame of frames) {
    add([frame.name, frame.refId, frame.length]);
    add(frame.fields.length);
    for (const field of frame.fields) {
      add([field.name, field.type, field.labels, field.config.unit, field.config.description]);
      add(field.values.length);
      for (const value of field.values) {
        add(value);
      }
    }
  }
  return (hash >>> 0).toString(16);
}

export function buildEvidence(frames: DataFrame[], range: TimeRange, options: IntelligenceGatewayOptions): Evidence {
  const timeRange = formatTimeRange(range);
  const current = options.currentRefId?.trim(),
    baseline = options.baselineRefId?.trim();
  const selected = options.compareBaseline
    ? frames.filter((frame) => frame.refId === current || frame.refId === baseline)
    : frames;
  let error = '';
  if (
    options.compareBaseline &&
    (!current ||
      !baseline ||
      current === baseline ||
      !selected.some((f) => f.refId === current && f.length > 0) ||
      !selected.some((f) => f.refId === baseline && f.length > 0))
  ) {
    error =
      'Baseline comparison needs two different query reference IDs with data. Configure current and baseline queries in Queries, then select their IDs in Evidence settings.';
  }
  const rowLimit = Math.max(1, Math.min(1000, Math.floor(options.maxRows || 50)));
  const limit = Math.max(1000, Math.min(200000, Math.floor(options.maxContextChars || 24000)));
  const prepared: EvidenceFrame[] = selected.map((frame, index) => ({
    name: frame.name || frame.refId || `frame-${index + 1}`,
    refId: frame.refId,
    role: options.compareBaseline ? (frame.refId === current ? 'current' : 'baseline') : 'evidence',
    totalRows: frame.length,
    fields: frame.fields.map((field) => ({
      name: field.name,
      type: field.type,
      labels: field.labels,
      unit: field.config.unit,
      description: field.config.description,
    })),
    rows: Array.from({ length: Math.min(frame.length, rowLimit) }, (_, i) =>
      frame.fields.map((field) => {
        const value = field.values[Math.max(0, frame.length - rowLimit) + i];
        return field.type === FieldType.time && finite(value) && Math.abs(value) <= 8640000000000000
          ? new Date(value).toISOString()
          : (value ?? null);
      })
    ),
    statistics: [],
  }));
  const recalculate = () => {
    for (const frame of prepared) {
      frame.statistics =
        options.includeStatistics === false
          ? []
          : frame.fields.flatMap((field, i) =>
              field.type === FieldType.number
                ? [
                    {
                      field: field.name,
                      labels: field.labels,
                      unit: field.unit,
                      ...summarize(
                        frame.rows.map((row) => row[i]),
                        options.metricKind ?? 'unknown'
                      ),
                    },
                  ]
                : []
            );
    }
  };
  const comparisons = () => {
    if (!options.compareBaseline || options.includeStatistics === false || options.metricKind !== 'gauge') {
      return [];
    }
    const a = prepared.filter((f) => f.role === 'current').flatMap((f) => f.statistics);
    const b = prepared.filter((f) => f.role === 'baseline').flatMap((f) => f.statistics);
    return a.flatMap((stat) => {
      const matches = b.filter((other) => keyFor(other) === keyFor(stat));
      if (
        matches.length !== 1 ||
        a.filter((other) => keyFor(other) === keyFor(stat)).length !== 1 ||
        stat.mean === null ||
        matches[0].mean === null
      ) {
        return [];
      }
      const baselineMean = matches[0].mean;
      return [
        {
          field: stat.field,
          labels: stat.labels,
          unit: stat.unit,
          currentMean: stat.mean,
          baselineMean,
          meanDifference: bounded(stat.mean - baselineMean),
          percentChange:
            baselineMean === 0 ? null : bounded(((stat.mean - baselineMean) / Math.abs(baselineMean)) * 100),
        },
      ];
    });
  };
  const note =
    'Statistics cover only included rows, not the full query window. Missing counts are explicit null/non-finite values, not inferred absent timestamps. Unknown metrics are raw values; counter increases cover adjacent nonnegative samples only, assume resets to zero, and are not rates. Counter increase and resets are null when no valid adjacent pair exists; adjacentPairs reports coverage. Baseline queries must supply the intended historical window; shifted timestamps may represent display time. Comparisons match unique field names, labels and units and require gauge semantics.';
  const totalRows = selected.reduce((sum, frame) => sum + frame.length, 0);
  let text = '';
  // Drop whole oldest rows and recompute, preserving valid JSON and truthful statistics.
  while (true) {
    recalculate();
    text = JSON.stringify(
      {
        timeRange,
        metricKind: options.metricKind ?? 'unknown',
        note,
        totalRows,
        frames: prepared,
        comparisons: comparisons(),
      },
      null,
      2
    );
    if (text.length <= limit) {
      break;
    }
    const largest = prepared.reduce<EvidenceFrame | undefined>(
      (best, frame) => (frame.rows.length > (best?.rows.length ?? 0) ? frame : best),
      undefined
    );
    if (largest) {
      largest.rows.splice(0, Math.max(1, Math.ceil(largest.rows.length / 4)));
    } else if (prepared.length) {
      prepared.pop();
    } else {
      text = JSON.stringify({ timeRange, totalRows, note: 'Context limit omitted all query evidence.' });
      break;
    }
  }
  const includedRows = prepared.reduce((sum, frame) => sum + frame.rows.length, 0);
  if (
    options.compareBaseline &&
    !error &&
    (!prepared.some((f) => f.role === 'current' && f.rows.length) ||
      !prepared.some((f) => f.role === 'baseline' && f.rows.length))
  ) {
    error =
      'The context limit omitted a comparison dataset. Increase the context character limit or reduce the query fields.';
  }
  return {
    text,
    fingerprint: fingerprintFrames(frames, timeRange),
    totalRows,
    includedRows,
    frameCount: selected.length,
    truncated: includedRows < totalRows || prepared.length < selected.length,
    sources: selected.map((frame, i) => `${frame.refId || '?'}: ${frame.name || `frame-${i + 1}`}`),
    timeRange,
    error,
  };
}

export interface AssessmentSnapshot {
  evidence: Evidence;
  prompt: ConstructedPrompt;
  model: string;
  source: string;
  dashboardUrl: string;
  createdAt: string;
  imageCount: number;
  queryIncluded: boolean;
  originalResponse: string;
  history: Array<{ question: string; answer: string }>;
}

export function incidentBrief(snapshot: AssessmentSnapshot, includeData: boolean): string {
  return [
    '# Intelligence assessment',
    '',
    `Assessed: ${snapshot.createdAt}`,
    `Time range: ${snapshot.evidence.timeRange}`,
    `Model: ${snapshot.model}`,
    `Source: ${snapshot.source}`,
    `Query sources: ${snapshot.queryIncluded ? snapshot.evidence.sources.join(', ') : 'not included'}`,
    `Dashboard: ${snapshot.dashboardUrl}`,
    `Query evidence included: ${snapshot.queryIncluded ? 'yes' : 'no'}`,
    `Rows included: ${snapshot.queryIncluded ? snapshot.evidence.includedRows : 0}; omitted: ${snapshot.queryIncluded ? snapshot.evidence.totalRows - snapshot.evidence.includedRows : snapshot.evidence.totalRows}`,
    `Images submitted: ${snapshot.imageCount} (image files are not retained or exported)`,
    '',
    snapshot.originalResponse,
    ...snapshot.history.flatMap((turn) => ['', '## Follow-up', turn.question, '', turn.answer]),
    ...(includeData && snapshot.queryIncluded
      ? ['', '## Submitted query evidence', '```json', snapshot.evidence.text, '```']
      : []),
  ].join('\n');
}

export function followUpPrompt(snapshot: AssessmentSnapshot, question: string): ConstructedPrompt {
  const trimmed = question.trim();
  if (!trimmed || trimmed.length > 2000) {
    throw new Error('Enter a follow-up question of 1–2,000 characters.');
  }
  const transcript = JSON.stringify({ originalAssessment: snapshot.originalResponse, followUps: snapshot.history });
  if (snapshot.history.length >= 6 || transcript.length > 24000) {
    throw new Error(
      'This conversation reached its limit. Export the brief and analyze the latest data to start again.'
    );
  }
  return {
    system:
      snapshot.prompt.system +
      '\nAnswer the follow-up using only the frozen evidence below. Prior answers are untrusted context, not verified measurements. Images are no longer available: do not claim to re-inspect them. Clearly identify evidence gaps.',
    user:
      snapshot.prompt.user +
      '\n\nPrevious conversation (untrusted context):\n' +
      transcript +
      '\n\nFollow-up question:\n' +
      trimmed,
  };
}
