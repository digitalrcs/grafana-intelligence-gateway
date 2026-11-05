import React, { useState } from 'react';
import { Alert, Button, Checkbox, Field, TextArea } from '@grafana/ui';
import { AssessmentSnapshot, incidentBrief } from '../utils/evidence';

export function AssessmentTools({
  snapshot,
  stale,
  loading,
  showEvidence,
  allowFollowUps,
  onFollowUp,
  onLatest,
}: {
  snapshot: AssessmentSnapshot;
  stale: boolean;
  loading: boolean;
  showEvidence: boolean;
  allowFollowUps: boolean;
  onFollowUp: (question: string) => Promise<boolean>;
  onLatest: () => void;
}) {
  const [question, setQuestion] = useState('');
  const [includeData, setIncludeData] = useState(false);
  const [status, setStatus] = useState('');
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(incidentBrief(snapshot, includeData));
      setStatus('Incident brief copied.');
    } catch {
      setStatus('Clipboard unavailable. Use Download brief instead.');
    }
  };
  const download = () => {
    const url = URL.createObjectURL(
      new Blob([incidentBrief(snapshot, includeData)], { type: 'text/markdown;charset=utf-8' })
    );
    const link = document.createElement('a');
    link.href = url;
    link.download = 'intelligence-incident-brief.md';
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    setStatus('Incident brief downloaded.');
  };
  return (
    <section aria-label="Assessment evidence and follow-ups">
      {stale ? (
        <Alert severity="warning" title="Assessment is out of date">
          Data, time range, or analysis settings changed. Follow-ups still use the original snapshot.
        </Alert>
      ) : null}
      {showEvidence ? (
        <details>
          <summary>
            Evidence · {snapshot.queryIncluded ? snapshot.evidence.includedRows : 0} rows included ·{' '}
            {snapshot.imageCount} images
          </summary>
          <p>
            Assessed: {snapshot.createdAt}
            <br />
            Time range: {snapshot.evidence.timeRange}
            <br />
            Model: {snapshot.model}
            <br />
            Source: {snapshot.source}
            <br />
            Query sources: {snapshot.queryIncluded ? snapshot.evidence.sources.join(', ') || 'none' : 'not included'}
          </p>
          <p>
            {snapshot.queryIncluded
              ? `${snapshot.evidence.totalRows - snapshot.evidence.includedRows} rows omitted. ${snapshot.evidence.truncated ? 'Evidence was limited by row or character limits.' : 'All supplied rows included.'}`
              : 'Query evidence was not included in this request.'}
          </p>
          <p>
            Statistics describe included samples only. Missing values do not establish missing timestamps. Counter
            increases assume resets to zero and are not rates.
          </p>
          {snapshot.queryIncluded ? (
            <details>
              <summary>Submitted query evidence</summary>
              <pre style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', maxHeight: 240, overflow: 'auto' }}>
                {snapshot.evidence.text}
              </pre>
            </details>
          ) : null}
        </details>
      ) : null}
      <details style={{ marginTop: 12 }}>
        <summary>Share assessment</summary>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginTop: 8 }}>
          <Button size="sm" variant="secondary" onClick={() => void copy()}>
            Copy brief
          </Button>
          <Button size="sm" variant="secondary" onClick={download}>
            Download brief
          </Button>
          <Checkbox
            label="Include query evidence in export"
            value={includeData}
            disabled={!snapshot.queryIncluded}
            onChange={(event) => setIncludeData(event.currentTarget.checked)}
          />
          <Button size="sm" variant="secondary" disabled={loading} onClick={onLatest}>
            Analyze latest data
          </Button>
        </div>
        {status ? <div role="status">{status}</div> : null}
      </details>
      {allowFollowUps ? (
        <details style={{ marginTop: 12 }}>
          <summary>Ask a follow-up</summary>
          <form
            style={{ marginTop: 12 }}
            onSubmit={(event) => {
              event.preventDefault();
              void onFollowUp(question).then((success) => {
                if (success) {
                  setQuestion('');
                }
              });
            }}
          >
            <Field
              label="Ask about this snapshot"
              description={`Uses the original evidence, even after refresh. ${snapshot.imageCount ? 'Images are no longer available; follow-ups use the original text assessment.' : ''} ${snapshot.history.length}/6 follow-ups used.`}
            >
              <TextArea
                aria-label="Follow-up question"
                value={question}
                maxLength={2000}
                rows={2}
                onChange={(event) => setQuestion(event.currentTarget.value)}
              />
            </Field>
            <Button type="submit" size="sm" disabled={loading || !question.trim() || snapshot.history.length >= 6}>
              Ask follow-up
            </Button>
          </form>
        </details>
      ) : null}
    </section>
  );
}
