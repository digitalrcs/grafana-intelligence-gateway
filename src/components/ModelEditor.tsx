import React, { useRef, useState } from 'react';
import { StandardEditorProps } from '@grafana/data';
import { Alert, Button, Combobox, ComboboxOption, Stack } from '@grafana/ui';
import { DEFAULT_OPTIONS, IntelligenceGatewayOptions } from '../types';
import { fetchAvailableModels } from '../utils/aiClient';

interface LoadedModels {
  key: string;
  items: string[];
}

export const ModelEditor = ({
  value,
  onChange,
  context,
}: StandardEditorProps<string, undefined, IntelligenceGatewayOptions>) => {
  const options = { ...DEFAULT_OPTIONS, ...context.options };
  const requestKey = `${options.provider}\u0000${options.baseUrl}\u0000${options.apiKey}`;
  const [loaded, setLoaded] = useState<LoadedModels>({ key: '', items: [] });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const requestSequence = useRef(0);
  const availableModels = loaded.key === requestKey ? loaded.items : [];
  const modelOptions: Array<ComboboxOption<string>> = availableModels.map((model) => ({
    value: model,
    label: model,
  }));

  const loadModels = async () => {
    const sequence = requestSequence.current + 1;
    requestSequence.current = sequence;
    setLoading(true);
    setError('');
    try {
      const models = await fetchAvailableModels(options);
      if (requestSequence.current === sequence) {
        setLoaded({ key: requestKey, items: models });
      }
    } catch (requestError) {
      if (requestSequence.current === sequence) {
        setError(requestError instanceof Error ? requestError.message : 'Unable to load models.');
      }
    } finally {
      if (requestSequence.current === sequence) {
        setLoading(false);
      }
    }
  };

  return (
    <Stack direction="column" gap={1}>
      <Combobox
        options={modelOptions}
        value={value ?? ''}
        onChange={(selection) => onChange(selection?.value ?? '')}
        placeholder="Enter a model ID or load available models"
        noOptionsMessage="Load models from the configured base URL or enter a custom model ID."
        createCustomValue
        customValueDescription="Use custom model ID"
        isClearable
      />
      <Button type="button" variant="secondary" icon="search" disabled={loading} onClick={() => void loadModels()}>
        {loading ? 'Loading models...' : 'Load available models'}
      </Button>
      {availableModels.length > 0 ? <span>{availableModels.length} model(s) available in the dropdown.</span> : null}
      {error ? (
        <Alert severity="error" title="Could not load models">
          {error}
        </Alert>
      ) : null}
    </Stack>
  );
};
