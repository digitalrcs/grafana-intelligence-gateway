import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { css, cx } from '@emotion/css';
import { PanelProps, renderMarkdown } from '@grafana/data';
import { Alert, Button, Icon, LoadingPlaceholder, Stack, useStyles2, useTheme2 } from '@grafana/ui';
import { analyzeWithAI } from '../utils/aiClient';
import { formatTimeRange, serializeDataFrames } from '../utils/dataFrames';
import { constructPrompt } from '../utils/prompt';
import { IntelligenceGatewayOptions } from '../types';

type Props = PanelProps<IntelligenceGatewayOptions>;

const getStyles = (theme: ReturnType<typeof useTheme2>) => ({
  root: css({
    width: '100%',
    height: '100%',
    overflow: 'auto',
    borderRadius: theme.shape.radius.default,
  }),
  content: css({ minHeight: '100%', display: 'flex', flexDirection: 'column', gap: theme.spacing(1.5) }),
  header: css({ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: theme.spacing(2) }),
  heading: css({ margin: 0, fontSize: '1.15em', lineHeight: 1.3 }),
  description: css({ margin: `${theme.spacing(0.5)} 0 0`, color: theme.colors.text.secondary }),
  response: css({ lineHeight: 1.55, overflowWrap: 'anywhere' }),
  empty: css({
    flex: 1,
    display: 'grid',
    placeItems: 'center',
    color: theme.colors.text.secondary,
    textAlign: 'center',
  }),
});

export const IntelligenceGatewayPanel = ({
  options,
  data,
  width,
  height,
  id,
  title,
  timeRange,
  replaceVariables,
}: Props) => {
  const theme = useTheme2();
  const styles = useStyles2(getStyles);
  const [response, setResponse] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const requestSequence = useRef(0);
  const abortController = useRef<AbortController>();

  const dataContext = useMemo(
    () => serializeDataFrames(data.series, timeRange, options.maxRows, options.maxContextChars),
    [data.series, options.maxContextChars, options.maxRows, timeRange]
  );

  const prompt = useMemo(() => {
    const constructed = constructPrompt(options, {
      data: dataContext,
      timeRange: formatTimeRange(timeRange),
      panelTitle: title || 'Untitled panel',
      panelId: String(id),
      sourcePanel: options.sourcePanelHint || 'Current panel query results',
    });
    return {
      system: replaceVariables(constructed.system),
      user: replaceVariables(constructed.user),
    };
  }, [dataContext, id, options, replaceVariables, timeRange, title]);
  const responseHtml = useMemo(() => renderMarkdown(response), [response]);

  const clearAnalysis = useCallback(() => {
    requestSequence.current += 1;
    abortController.current?.abort();
    abortController.current = undefined;
    setResponse('');
    setError('');
    setLoading(false);
  }, []);

  const analyze = useCallback(async () => {
    if (data.series.length === 0 && options.emptyDataBehavior === 'block') {
      setError('No data is available. Configure a query (preferably the Dashboard data source) before analysis.');
      return;
    }
    const sequence = requestSequence.current + 1;
    requestSequence.current = sequence;
    abortController.current?.abort();
    const controller = new AbortController();
    abortController.current = controller;
    setLoading(true);
    setError('');
    try {
      const result = await analyzeWithAI({
        options,
        prompt,
        signal: controller.signal,
      });
      if (requestSequence.current === sequence) {
        setResponse(result);
      }
    } catch (requestError) {
      if (controller.signal.aborted) {
        return;
      }
      if (requestSequence.current === sequence) {
        setError(requestError instanceof Error ? requestError.message : 'The analysis request failed.');
      }
    } finally {
      if (requestSequence.current === sequence) {
        setLoading(false);
      }
    }
  }, [data.series.length, options, prompt]);

  useEffect(() => {
    if (!options.autoAnalyze) {
      return undefined;
    }
    const timeout = window.setTimeout(() => void analyze(), Math.max(300, options.autoAnalyzeDelayMs));
    return () => window.clearTimeout(timeout);
  }, [analyze, options.autoAnalyze, options.autoAnalyzeDelayMs]);

  useEffect(() => () => abortController.current?.abort(), []);

  const background =
    options.backgroundColor && options.backgroundColor !== 'transparent' ? options.backgroundColor : 'transparent';
  const color = options.textColor || theme.colors.text.primary;

  return (
    <div
      className={cx(
        styles.root,
        css({
          width,
          height,
          backgroundColor: background,
          color,
          fontSize: options.fontSize,
          textAlign: options.alignment,
        })
      )}
      data-testid="intelligence-gateway-panel"
    >
      <div className={cx(styles.content, css({ padding: options.padding }))}>
        <div className={styles.header}>
          <div>
            {options.responseTitle ? <h3 className={styles.heading}>{options.responseTitle}</h3> : null}
            {options.responseDescription ? <p className={styles.description}>{options.responseDescription}</p> : null}
          </div>
          <Stack direction="row" gap={1}>
            {response || error || loading ? (
              <Button
                type="button"
                size="sm"
                variant="secondary"
                icon="trash-alt"
                onClick={clearAnalysis}
                data-testid="clear-analysis-button"
              >
                Clear analysis
              </Button>
            ) : null}
            {options.showAnalyzeButton ? (
              <Button type="button" size="sm" icon="robot" onClick={() => void analyze()} disabled={loading}>
                {response ? 'Refresh assessment' : 'Analyze'}
              </Button>
            ) : null}
          </Stack>
        </div>

        {data.series.length === 0 && options.emptyDataBehavior === 'warn' ? (
          <Alert severity="info" title="No dashboard data received">
            Analysis can continue with prompt context only. For another panel&apos;s results, query it through
            Grafana&apos;s Dashboard data source.
          </Alert>
        ) : null}
        {error ? (
          <Alert severity="error" title="Analysis failed">
            {error}
          </Alert>
        ) : null}
        {loading && !response ? <LoadingPlaceholder text="Generating intelligence assessment..." /> : null}
        {response ? (
          <div
            className={styles.response}
            aria-live="polite"
            // Grafana's renderMarkdown sanitizes HTML unless explicitly told not to; we retain the secure default.
            dangerouslySetInnerHTML={{ __html: responseHtml }}
          />
        ) : !loading ? (
          <div className={styles.empty}>
            <Stack direction="column" alignItems="center" gap={1}>
              <Icon name="robot" size="xxl" />
              <span>Select Analyze to assess the current dashboard context.</span>
            </Stack>
          </div>
        ) : null}
      </div>
    </div>
  );
};
