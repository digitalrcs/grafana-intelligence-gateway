import React from 'react';
import { css } from '@emotion/css';
import { DataSourceInstanceSettings } from '@grafana/data';
import { getDataSourceSrv } from '@grafana/runtime';
import { Alert } from '@grafana/ui';

const setupUrl = 'https://github.com/digitalrcs/grafana-intelligence-gateway/wiki/Reviewer-Walkthrough';
const noticeStyle = css({ overflowWrap: 'anywhere', minWidth: 0 });

interface Props {
  dataSourceUid: string;
  model: string;
}

export const ConnectionNotice = ({ dataSourceUid, model }: Props) => {
  let settings: DataSourceInstanceSettings | undefined;
  if (dataSourceUid) {
    try {
      // Read only Grafana's existing non-secret settings; do not initialize a
      // data source, query a provider, or send data to identify the connection.
      settings = getDataSourceSrv().getInstanceSettings(dataSourceUid);
    } catch {
      // A missing/unavailable instance is handled by the normal Analyze error.
      // Keep the selected UID visible without claiming its connection is healthy.
    }
  }
  const config = settings?.jsonData as { reviewMock?: unknown; provider?: unknown; baseUrl?: unknown } | undefined;
  const isReviewMock =
    settings?.type === 'digitalrcs-intelligencegateway-datasource' &&
    config?.reviewMock === true &&
    config.provider === 'custom' &&
    typeof config.baseUrl === 'string' &&
    config.baseUrl.trim().replace(/\/+$/, '') === 'http://mock-ai:8080/v1';

  return (
    <div className={noticeStyle} data-testid="connection-notice">
      {dataSourceUid ? (
        <div>
          AI connection: <strong>{settings?.name || dataSourceUid}</strong> · Model:{' '}
          <strong>{model || 'Default'}</strong>
        </div>
      ) : (
        <Alert severity="info" title="AI connection not configured">
          Create an Intelligence Gateway Secure AI data source for your provider, then select it under this panel&apos;s
          AI provider settings.{' '}
          <a href={setupUrl} target="_blank" rel="noopener noreferrer">
            Setup instructions
          </a>
          .
        </Alert>
      )}
      {isReviewMock ? (
        <Alert severity="warning" title="Mock connection — no AI analysis">
          <p>
            This is the supplied test server, not an AI model. Analyze returns a delivery receipt only: it cannot
            interpret your data or images. A successful mock response does not verify AI analysis.
          </p>
          <details>
            <summary>Use your own AI — setup checklist</summary>
            <ol>
              <li>
                In Connections → Data sources, add a separate Intelligence Gateway Secure AI instance. Configure your
                provider, a URL reachable from the Grafana server, its model, and credentials if required. Select Save
                &amp; test.
              </li>
              <li>
                Edit this panel. Under AI provider, select your new Secure AI data source, load the available models,
                and select the intended model. Leave the mock instance available for connectivity checks.
              </li>
              <li>
                For data analysis, set Queries → Dashboard → Source panel. For images only, no source query is needed:
                turn off Include query data with images, approve vision in the AI data source, and review your images
                before selecting Analyze images.
              </li>
            </ol>
          </details>
          <a href={setupUrl} target="_blank" rel="noopener noreferrer">
            Full reviewer setup and real-provider examples
          </a>
        </Alert>
      ) : null}
    </div>
  );
};
