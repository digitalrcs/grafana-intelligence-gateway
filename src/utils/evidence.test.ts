import { dateTime, FieldType, toDataFrame } from '@grafana/data';
import { DEFAULT_OPTIONS } from '../types';
import {
  AssessmentSnapshot,
  buildEvidence,
  fingerprintFrames,
  followUpPrompt,
  incidentBrief,
  summarize,
} from './evidence';

const range = { from: dateTime(0), to: dateTime(3600000), raw: { from: 'now-1h', to: 'now' } };
const frame = (refId: string, values: unknown[], unit = 'ms') =>
  toDataFrame({
    refId,
    fields: [
      { name: 'time', type: FieldType.time, values: values.map((_, i) => i * 60000) },
      { name: 'value', type: FieldType.number, config: { unit }, labels: { service: 'web' }, values },
    ],
  });

describe('bounded query evidence', () => {
  it('separates adjacent numeric values in freshness fingerprints', () => {
    expect(fingerprintFrames([frame('A', [1, 23])], 'range')).not.toBe(
      fingerprintFrames([frame('A', [12, 3])], 'range')
    );
    expect(fingerprintFrames([frame('A', [1, 23])], 'range')).toBe(fingerprintFrames([frame('A', [1, 23])], 'range'));
  });
  it.each([[], [5], [null, NaN, Infinity], [5, null, 8], [5, NaN, 8], [-1, 5], [5, -1], [5, -1, 8]])(
    'does not report zero counter increase without a valid adjacent pair: %j',
    (...values) => {
      expect(summarize(values, 'counter')).toMatchObject({ observedIncrease: null, resets: null, adjacentPairs: 0 });
    }
  );
  it('distinguishes observed zero counter increase from insufficient samples', () => {
    expect(summarize([5, 5], 'counter')).toMatchObject({ observedIncrease: 0, resets: 0, adjacentPairs: 1 });
    const evidence = buildEvidence([frame('A', [5, 8])], range, {
      ...DEFAULT_OPTIONS,
      metricKind: 'counter',
      maxRows: 1,
    });
    expect(JSON.parse(evidence.text).frames[0].statistics[0]).toMatchObject({
      observedIncrease: null,
      adjacentPairs: 0,
    });
  });
  it('keeps valid JSON, a strict character limit and accurate included counts', () => {
    const evidence = buildEvidence(
      [
        frame(
          'A',
          Array.from({ length: 100 }, (_, i) => i)
        ),
      ],
      range,
      { ...DEFAULT_OPTIONS, maxContextChars: 2000 }
    );
    const payload = JSON.parse(evidence.text);
    expect(evidence.text.length).toBeLessThanOrEqual(2000);
    expect(evidence.includedRows).toBe(
      payload.frames.reduce((sum: number, f: { rows: unknown[] }) => sum + f.rows.length, 0)
    );
    expect(evidence.totalRows).toBe(100);
    expect(evidence.truncated).toBe(true);
    const supplied = payload.frames[0];
    if (supplied?.rows.length) {
      expect(supplied.statistics[0].valid).toBe(supplied.rows.length);
      expect(supplied.statistics[0].last).toBe(99);
    }
  });
  it('fingerprints changes outside the supplied tail', () => {
    const a = buildEvidence([frame('A', [1, 2, 3])], range, { ...DEFAULT_OPTIONS, maxRows: 1 });
    const b = buildEvidence([frame('A', [99, 2, 3])], range, { ...DEFAULT_OPTIONS, maxRows: 1 });
    expect(a.text).toBe(b.text);
    expect(a.fingerprint).not.toBe(b.fingerprint);
  });
  it('computes sample statistics without treating nulls as zero', () => {
    expect(summarize([10, null, NaN, 30], 'gauge')).toMatchObject({
      valid: 2,
      missing: 2,
      mean: 20,
      min: 10,
      max: 30,
      change: 20,
    });
    expect(summarize([], 'gauge')).toMatchObject({ valid: 0, mean: null, change: null });
  });
  it('handles counter resets and never bridges missing samples or reports a gauge mean', () => {
    expect(summarize([100, 110, 5, 9, null, 80, 82], 'counter')).toMatchObject({
      observedIncrease: 21,
      resets: 1,
      mean: null,
      change: null,
      missing: 1,
    });
  });
  it('compares unique compatible gauges and excludes unrelated query results', () => {
    const evidence = buildEvidence([frame('A', [20, 40]), frame('B', [10, 20]), frame('C', [999])], range, {
      ...DEFAULT_OPTIONS,
      compareBaseline: true,
      metricKind: 'gauge',
    });
    const payload = JSON.parse(evidence.text);
    expect(evidence.error).toBe('');
    expect(payload.frames).toHaveLength(2);
    expect(payload.comparisons[0]).toMatchObject({
      currentMean: 30,
      baselineMean: 15,
      meanDifference: 15,
      percentChange: 100,
    });
  });
  it('does not compare incompatible units, ambiguous fields, counters or zero baseline percentages', () => {
    const options = { ...DEFAULT_OPTIONS, compareBaseline: true, metricKind: 'gauge' as const };
    expect(
      JSON.parse(buildEvidence([frame('A', [20]), frame('B', [10], 's')], range, options).text).comparisons
    ).toEqual([]);
    expect(
      JSON.parse(buildEvidence([frame('A', [20]), frame('A', [40]), frame('B', [10])], range, options).text).comparisons
    ).toEqual([]);
    expect(
      JSON.parse(buildEvidence([frame('A', [20]), frame('B', [10])], range, { ...options, metricKind: 'counter' }).text)
        .comparisons
    ).toEqual([]);
    expect(
      JSON.parse(buildEvidence([frame('A', [20]), frame('B', [0])], range, options).text).comparisons[0].percentChange
    ).toBeNull();
  });
  it('rejects missing or identical baseline IDs and datasets omitted by limits', () => {
    const options = { ...DEFAULT_OPTIONS, compareBaseline: true };
    expect(buildEvidence([frame('A', [1])], range, options).error).toContain('two different');
    expect(buildEvidence([frame('A', [1])], range, { ...options, baselineRefId: 'A' }).error).toContain(
      'two different'
    );
    expect(
      buildEvidence([frame('A', [1]), frame('B', [2])], range, { ...options, maxContextChars: 1000 }).error
    ).toContain('omitted');
  });
});

describe('snapshot conversation and brief', () => {
  const snapshot: AssessmentSnapshot = {
    evidence: buildEvidence([frame('A', [123])], range, DEFAULT_OPTIONS),
    prompt: { system: 'Role', user: 'Frozen query rows' },
    model: 'local-model',
    source: 'A',
    dashboardUrl: 'http://localhost/d/test',
    createdAt: '2026-11-05T12:00:00Z',
    imageCount: 1,
    queryIncluded: true,
    originalResponse: 'Original assessment',
    history: [],
  };
  it('excludes query payload by default and includes it only on request', () => {
    expect(incidentBrief(snapshot, false)).not.toContain('Submitted query evidence');
    expect(incidentBrief(snapshot, true)).toContain(snapshot.evidence.text);
    expect(incidentBrief({ ...snapshot, queryIncluded: false }, true)).not.toContain(snapshot.evidence.text);
  });
  it('uses the frozen prompt and bounds conversation without silently truncating', () => {
    const prompt = followUpPrompt(snapshot, 'Why?');
    expect(prompt.user).toContain('Frozen query rows');
    expect(prompt.user).toContain('Original assessment');
    expect(prompt.system).toContain('Images are no longer available');
    expect(() => followUpPrompt(snapshot, 'x'.repeat(2001))).toThrow('2,000');
    expect(() =>
      followUpPrompt({ ...snapshot, history: Array(6).fill({ question: 'q', answer: 'a' }) }, 'Why?')
    ).toThrow('limit');
  });
});
