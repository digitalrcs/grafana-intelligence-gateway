import { FieldType, MutableDataFrame, dateTime } from '@grafana/data';
import { serializeDataFrames } from './dataFrames';

describe('serializeDataFrames', () => {
  const range = {
    from: dateTime('2026-08-11T10:00:00Z'),
    to: dateTime('2026-08-11T11:00:00Z'),
    raw: { from: 'now-1h', to: 'now' },
  };

  it('includes labels and only the newest configured rows', () => {
    const frame = new MutableDataFrame({
      name: 'CPU',
      fields: [
        { name: 'time', type: FieldType.time, values: [1_700_000_000_000, 1_700_000_060_000, 1_700_000_120_000] },
        { name: 'usage', type: FieldType.number, labels: { host: 'web-1' }, values: [10, 20, 30] },
      ],
    });
    const serialized = serializeDataFrames([frame], range, 2, 10000);
    expect(serialized).toContain('"host": "web-1"');
    expect(serialized).toContain('"usage": 30');
    expect(serialized).not.toContain('"usage": 10');
  });

  it('returns a clear empty-data marker', () => {
    expect(serializeDataFrames([], range, 10, 10000)).toContain('No query data');
  });

  it('caps the serialized context length', () => {
    const frame = new MutableDataFrame({
      fields: [{ name: 'message', type: FieldType.string, values: ['x'.repeat(3000)] }],
    });
    expect(serializeDataFrames([frame], range, 10, 1000)).toContain('context truncated at 1000 characters');
  });
});
