import React, { useMemo } from 'react';
import { StandardEditorProps } from '@grafana/data';
import { getDataSourceSrv } from '@grafana/runtime';
import { Alert, Combobox, type ComboboxOption, Stack } from '@grafana/ui';
import { SECURE_DATASOURCE_PLUGIN_ID } from '../utils/aiClient';
import { IntelligenceGatewayOptions } from '../types';

export const SecureDataSourceEditor = ({
  value,
  onChange,
}: StandardEditorProps<string, undefined, IntelligenceGatewayOptions>) => {
  const instances = useMemo(
    () => getDataSourceSrv().getList({ pluginId: SECURE_DATASOURCE_PLUGIN_ID, all: true }),
    []
  );
  const choices: Array<ComboboxOption<string>> = instances.map((instance) => ({
    value: instance.uid,
    label: instance.name,
    description: instance.uid,
  }));

  return (
    <Stack direction="column" gap={1}>
      <Combobox
        options={choices}
        value={value || null}
        onChange={(choice) => onChange(choice?.value ?? '')}
        placeholder="Select a configured secure AI data source"
        noOptionsMessage="No Intelligence Gateway Secure AI data source is configured."
        isClearable
      />
      {value ? (
        <Alert severity="success" title="Server-side credentials enabled">
          Provider requests use the selected data source. API keys and provider policy remain on the Grafana server.
        </Alert>
      ) : (
        <Alert severity="warning" title="Direct development mode">
          Without a secure data source, provider credentials in panel options remain visible in dashboard JSON.
        </Alert>
      )}
    </Stack>
  );
};
