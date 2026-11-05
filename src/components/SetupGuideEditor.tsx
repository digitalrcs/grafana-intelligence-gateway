import React from 'react';

export const SetupGuideEditor = () => (
  <details>
    <summary>Four steps to your first assessment</summary>
    <ol style={{ paddingLeft: 20 }}>
      <li>
        <strong>Connect AI:</strong> select a Secure AI data source and an approved model or Copilot Studio agent alias
        below. Configure credentials in Connections → Data sources.
      </li>
      <li>
        <strong>Choose evidence:</strong> in the Queries tab, use Dashboard → Source panel to reuse existing results, or
        configure queries here. This connection supplies measurements, not AI.
      </li>
      <li>
        <strong>Choose a task:</strong> use an analysis preset and optionally add your team’s definitions or runbook
        context.
      </li>
      <li>
        <strong>Analyze:</strong> return to the panel and select Analyze. Review evidence, ask follow-ups, or export a
        brief.
      </li>
    </ol>
    <p>
      For baseline comparison, supply two query results with different reference IDs and configure the historical window
      in the source query. For images, review PNG/JPEG uploads and explicitly select Analyze images.
    </p>
  </details>
);
