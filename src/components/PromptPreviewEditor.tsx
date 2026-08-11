import React from 'react';
import { StandardEditorProps } from '@grafana/data';
import { CodeEditor, Stack } from '@grafana/ui';
import { constructPrompt } from '../utils/prompt';
import { DEFAULT_OPTIONS, IntelligenceGatewayOptions } from '../types';

export const PromptPreviewEditor = ({
  context,
}: StandardEditorProps<string, undefined, IntelligenceGatewayOptions>) => {
  const options = { ...DEFAULT_OPTIONS, ...context.options };
  const prompt = constructPrompt(options, {
    data: '[Live DataFrame context will be injected here at analysis time.]',
    timeRange: '[Current dashboard time range]',
    panelTitle: '[Current panel title]',
    panelId: '[Current panel ID]',
    sourcePanel: options.sourcePanelHint || '[Dashboard data source / current query results]',
  });

  return (
    <Stack direction="column" gap={1}>
      <strong>System message</strong>
      <CodeEditor value={prompt.system} language="markdown" height="160px" readOnly showMiniMap={false} />
      <strong>User message</strong>
      <CodeEditor value={prompt.user} language="markdown" height="260px" readOnly showMiniMap={false} />
    </Stack>
  );
};
