import React from 'react';
import { css } from '@emotion/css';
import { StandardEditorProps } from '@grafana/data';
import { Input, Slider, Stack, useStyles2 } from '@grafana/ui';
import { IntelligenceGatewayOptions } from '../types';

export interface NumericEditorSettings {
  min: number;
  max: number;
  step?: number;
  integer?: boolean;
}

const getStyles = () => ({
  fullWidth: css({ width: '100%', minWidth: 0 }),
  value: css({
    width: '100%',
    minWidth: 0,
    fontVariantNumeric: 'tabular-nums',
  }),
});

const normalizeValue = (rawValue: string, settings: NumericEditorSettings): number | undefined => {
  if (rawValue.trim() === '') {
    return undefined;
  }

  const parsed = Number(rawValue);
  if (!Number.isFinite(parsed)) {
    return undefined;
  }

  return settings.integer ? Math.round(parsed) : parsed;
};

const constrainValue = (value: number, settings: NumericEditorSettings): number =>
  Math.min(settings.max, Math.max(settings.min, value));

export const WideNumberEditor = ({
  value,
  onChange,
  item,
}: StandardEditorProps<number, NumericEditorSettings, IntelligenceGatewayOptions>) => {
  const styles = useStyles2(getStyles);
  const settings = item.settings!;

  return (
    <div className={styles.fullWidth}>
      <Input
        className={styles.value}
        type="number"
        value={value}
        min={settings.min}
        max={settings.max}
        step={settings.step ?? (settings.integer ? 1 : 'any')}
        onChange={(event) => {
          const nextValue = normalizeValue(event.currentTarget.value, settings);
          if (nextValue !== undefined) {
            onChange(nextValue);
          }
        }}
        onBlur={(event) => {
          const nextValue = normalizeValue(event.currentTarget.value, settings);
          if (nextValue !== undefined) {
            onChange(constrainValue(nextValue, settings));
          }
        }}
      />
    </div>
  );
};

export const WideSliderEditor = ({
  value,
  onChange,
  item,
}: StandardEditorProps<number, NumericEditorSettings, IntelligenceGatewayOptions>) => {
  const styles = useStyles2(getStyles);
  const settings = item.settings!;

  return (
    <Stack direction="column" gap={1}>
      <Input
        className={styles.value}
        type="number"
        value={value}
        min={settings.min}
        max={settings.max}
        step={settings.step ?? 1}
        onChange={(event) => {
          const nextValue = normalizeValue(event.currentTarget.value, settings);
          if (nextValue !== undefined) {
            onChange(nextValue);
          }
        }}
        onBlur={(event) => {
          const nextValue = normalizeValue(event.currentTarget.value, settings);
          if (nextValue !== undefined) {
            onChange(constrainValue(nextValue, settings));
          }
        }}
      />
      <div className={styles.fullWidth}>
        <Slider
          min={settings.min}
          max={settings.max}
          step={settings.step}
          value={value}
          showInput={false}
          onChange={(nextValue) => onChange(nextValue)}
        />
      </div>
    </Stack>
  );
};
