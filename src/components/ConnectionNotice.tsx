import React from 'react';
import { css } from '@emotion/css';
import { DataSourceInstanceSettings } from '@grafana/data';
import { getDataSourceSrv, config } from '@grafana/runtime';
import { useTheme2 } from '@grafana/ui';

export const ConnectionNotice = ({ dataSourceUid, model }: { dataSourceUid: string; model: string }) => {
  const theme = useTheme2();
  let settings: DataSourceInstanceSettings | undefined;
  try {
    settings = dataSourceUid ? getDataSourceSrv().getInstanceSettings(dataSourceUid) : undefined;
  } catch {
    /* Request errors are reported by the analysis path. */
  }
  const selected = Boolean(dataSourceUid && settings?.type === 'digitalrcs-intelligencegateway-datasource');
  return (
    <div
      className={css({ color: theme.colors.text.secondary, overflowWrap: 'anywhere', fontSize: '0.9em' })}
      data-testid="connection-notice"
    >
      {selected && model.trim() ? (
        <span>
          {settings!.name} · {model}
        </span>
      ) : (
        <div>
          <strong>
            {!dataSourceUid
              ? 'Connect your AI backend'
              : !selected
                ? 'Select an available AI connection'
                : 'Choose a model or Copilot agent'}
          </strong>
          <p style={{ margin: '4px 0' }}>
            In panel settings → <strong>1. Connect AI</strong>, select a configured Secure AI data source and model or
            agent alias.
          </p>
          <a
            href="https://github.com/digitalrcs/grafana-intelligence-gateway/wiki/Panel-Setup-and-Configuration"
            target="_blank"
            rel="noopener noreferrer"
          >
            Setup guide
          </a>
          {' · '}
          <a href={(config.appSubUrl || '') + '/connections/datasources/new'} target="_blank" rel="noopener noreferrer">
            Add AI connection
          </a>
        </div>
      )}
    </div>
  );
};
