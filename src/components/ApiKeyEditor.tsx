import React from 'react';
import { StandardEditorProps } from '@grafana/data';
import { Alert, Input, Stack } from '@grafana/ui';
import { IntelligenceGatewayOptions } from '../types';

export const ApiKeyEditor = ({
  value,
  onChange,
}: StandardEditorProps<string, undefined, IntelligenceGatewayOptions>) => (
  <Stack direction="column" gap={1}>
    <Input
      type="password"
      value={value ?? ''}
      onChange={(event) => onChange(event.currentTarget.value)}
      placeholder="Stored in dashboard JSON"
      autoComplete="off"
    />
    <Alert severity="warning" title="Frontend storage is not secure">
      This masks the value while editing, but panel options are serialized into the dashboard. Use a restricted
      development key only. Put production secrets behind a Grafana backend or data source proxy.
    </Alert>
  </Stack>
);
