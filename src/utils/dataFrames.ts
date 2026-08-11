import { DataFrame, Field, FieldType, TimeRange } from '@grafana/data';

const valueAt = (field: Field, index: number): unknown => {
  const values = field.values as unknown as { get?: (position: number) => unknown; [position: number]: unknown };
  return typeof values.get === 'function' ? values.get(index) : values[index];
};

const formatValue = (value: unknown, fieldType: FieldType): unknown => {
  if (value === null || value === undefined) {
    return null;
  }
  if (fieldType === FieldType.time) {
    const timestamp = typeof value === 'number' ? value : Date.parse(String(value));
    return Number.isFinite(timestamp) ? new Date(timestamp).toISOString() : String(value);
  }
  if (typeof value === 'number' || typeof value === 'boolean' || typeof value === 'string') {
    return value;
  }
  try {
    return JSON.parse(JSON.stringify(value));
  } catch {
    return String(value);
  }
};

const serializeFrame = (frame: DataFrame, frameIndex: number, maxRows: number) => {
  const rowCount = frame.length ?? Math.max(0, ...frame.fields.map((field) => field.values.length));
  const start = Math.max(0, rowCount - maxRows);
  const rows = [];

  for (let rowIndex = start; rowIndex < rowCount; rowIndex += 1) {
    const row: Record<string, unknown> = {};
    frame.fields.forEach((field, fieldIndex) => {
      const duplicateCount = frame.fields
        .slice(0, fieldIndex)
        .filter((candidate) => candidate.name === field.name).length;
      const key = duplicateCount === 0 ? field.name : `${field.name}_${duplicateCount + 1}`;
      row[key] = formatValue(valueAt(field, rowIndex), field.type);
    });
    rows.push(row);
  }

  return {
    name: frame.name || frame.refId || `frame-${frameIndex + 1}`,
    refId: frame.refId,
    meta: frame.meta?.preferredVisualisationType,
    rowCount,
    includedRows: rows.length,
    fields: frame.fields.map((field) => ({
      name: field.name,
      type: field.type,
      labels: field.labels ?? undefined,
      unit: field.config?.unit,
      description: field.config?.description,
    })),
    rows,
  };
};

export const formatTimeRange = (timeRange: TimeRange): string =>
  `${timeRange.from.toISOString()} to ${timeRange.to.toISOString()}`;

export const serializeDataFrames = (
  frames: DataFrame[],
  timeRange: TimeRange,
  maxRows: number,
  maxChars: number
): string => {
  if (frames.length === 0) {
    return '[No query data was supplied to this panel.]';
  }

  const payload = {
    timeRange: { from: timeRange.from.toISOString(), to: timeRange.to.toISOString() },
    frameCount: frames.length,
    note: `Only the most recent ${maxRows} row(s) per frame are included.`,
    frames: frames.map((frame, index) => serializeFrame(frame, index, Math.max(1, maxRows))),
  };
  const serialized = JSON.stringify(payload, null, 2);
  const limit = Math.max(1000, maxChars);
  return serialized.length <= limit
    ? serialized
    : `${serialized.slice(0, limit)}\n...[context truncated at ${limit} characters]`;
};
