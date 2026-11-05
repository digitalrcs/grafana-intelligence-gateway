import React, { useEffect, useRef, useState } from 'react';
import { css } from '@emotion/css';
import { Alert, Button, Modal, Spinner, useStyles2, useTheme2 } from '@grafana/ui';
import { fetchVisionCapabilities, VisionCapabilities } from '../utils/aiClient';
import { importImageFiles, VisionAttachment, VISION_LIMITS } from '../vision';
import { ImageSession } from '../vision/session';

interface Props {
  session: ImageSession;
  isOpen: boolean;
  onClose: () => void;
  images: VisionAttachment[];
  onImagesChange: (images: VisionAttachment[]) => void;
  dataSourceUid: string;
  model: string;
  includeQueryData: boolean;
}

const stylesFor = (theme: ReturnType<typeof useTheme2>) => ({
  modal: css({ width: 'min(920px, 96vw)', maxHeight: '90vh' }),
  stack: css({ display: 'flex', flexDirection: 'column', gap: theme.spacing(2) }),
  actions: css({ display: 'flex', flexWrap: 'wrap', gap: theme.spacing(1), alignItems: 'center' }),
  grid: css({
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(min(250px, 100%), 1fr))',
    gap: theme.spacing(2),
  }),
  card: css({
    border: `1px solid ${theme.colors.border.medium}`,
    borderRadius: theme.shape.radius.default,
    padding: theme.spacing(1),
    overflowWrap: 'anywhere',
  }),
  image: css({
    display: 'block',
    width: '100%',
    height: 170,
    objectFit: 'contain',
    background: theme.colors.background.secondary,
  }),
  caption: css({
    color: theme.colors.text.secondary,
    fontSize: theme.typography.bodySmall.fontSize,
    margin: `${theme.spacing(1)} 0`,
  }),
  progress: css({ display: 'flex', flexWrap: 'wrap', gap: theme.spacing(1), alignItems: 'center' }),
});

/** Attachments exist only in browser memory. This component never sends an inference request. */
export function ImageInputs({
  session,
  isOpen,
  onClose,
  images,
  onImagesChange,
  dataSourceUid,
  model,
  includeQueryData,
}: Props) {
  const styles = useStyles2(stylesFor);
  const [capabilities, setCapabilities] = useState<VisionCapabilities>();
  const [checking, setChecking] = useState(true);
  const [capabilityError, setCapabilityError] = useState('');
  const { error, warnings, busy, progress } = session.state;
  const fileInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    let active = true;
    const capabilityController = new AbortController();
    const capabilityTimeout = window.setTimeout(() => capabilityController.abort(), 30000);
    void fetchVisionCapabilities(dataSourceUid, capabilityController.signal)
      .then((result) => {
        if (active) {
          setCapabilities(result);
        }
      })
      .catch((reason: unknown) => {
        if (active) {
          setCapabilityError(reason instanceof Error ? reason.message : 'Cannot check image support.');
        }
      })
      .finally(() => {
        window.clearTimeout(capabilityTimeout);
        if (active) {
          setChecking(false);
        }
      });
    return () => {
      active = false;
      window.clearTimeout(capabilityTimeout);
      capabilityController.abort();
    };
  }, [isOpen, dataSourceUid, model]);

  const visionReady = capabilities?.vision.enabled && capabilities.vision.models.includes(model.trim());

  return (
    <>
      {busy ? (
        <div className={styles.progress} role="status">
          <Spinner />
          {progress}
          <Button size="sm" variant="secondary" onClick={session.cancel}>
            Cancel preparation
          </Button>
        </div>
      ) : null}
      <Modal title="Image inputs" isOpen={isOpen && !busy} onDismiss={onClose} className={styles.modal}>
        <div className={styles.stack} data-testid="image-inputs">
          <Alert severity="info" title="Preview before sending">
            Images remain in this browser until you select Analyze images. Review every preview for sensitive
            information. The request goes through secure data source{' '}
            <strong>{dataSourceUid || '(not selected)'}</strong> to model <strong>{model}</strong>.
            {includeQueryData
              ? ' This panel’s query data will also be included.'
              : ' Query data will not be included in image requests.'}
          </Alert>
          {checking ? (
            <div role="status">
              <Spinner /> Checking administrator-approved image support…
            </div>
          ) : null}
          {capabilityError ? (
            <Alert title="Image support unavailable" severity="warning">
              {capabilityError}
            </Alert>
          ) : null}
          {capabilities && !visionReady ? (
            <Alert title="Vision model approval required" severity="warning">
              Ask an administrator to enable vision and approve this model in the secure AI data source. Text analysis
              is still available.
            </Alert>
          ) : null}
          {capabilities?.generationControls?.maxOutputTokens === false ? (
            <Alert title="Generation settings are controlled by the agent" severity="info">
              Copilot Studio selects the underlying model and generation settings. This panel’s temperature and maximum
              output tokens do not apply to that agent. Prompt length requests remain advisory.
            </Alert>
          ) : null}
          <p>Add PNG or JPEG files, review the previews, then select Analyze images.</p>
          <div className={styles.actions}>
            <Button variant="secondary" disabled={!visionReady} onClick={() => fileInput.current?.click()}>
              Add images
            </Button>
            <input
              ref={fileInput}
              type="file"
              accept="image/png,image/jpeg"
              multiple
              hidden
              aria-label="Add PNG or JPEG images"
              onChange={(event) => {
                const files = Array.from(event.currentTarget.files ?? []);
                event.currentTarget.value = '';
                if (files.length > 0) {
                  void session.run(async (signal) => ({
                    attachments: await importImageFiles(files, signal),
                    warnings: [],
                  }));
                }
              }}
            />
          </div>
          {error ? (
            <Alert title="Image preparation failed" severity="error">
              {error}
            </Alert>
          ) : null}
          {warnings.length > 0 ? (
            <Alert title="Review image limitations" severity="warning">
              <ul>
                {warnings.map((warning, index) => (
                  <li key={index}>{warning}</li>
                ))}
              </ul>
            </Alert>
          ) : null}
          <p>
            {images.length} / {VISION_LIMITS.maxImages} images · PNG or JPEG · 4 MiB each · 12 MiB total. Large images
            may be resized; upload a higher-detail image when small labels are hard to read.
          </p>
          <div className={styles.grid}>
            {images.map((image) => (
              <div key={image.id} className={styles.card} data-testid="image-preview">
                <img src={image.dataUrl} alt={`Preview: ${image.name}`} className={styles.image} />
                <strong>{image.name}</strong>
                <div className={styles.caption}>
                  {image.width} × {image.height} · {(image.bytes / 1024).toFixed(0)} KiB · {image.source} ·{' '}
                  {image.capturedAt}
                </div>
                {image.warnings?.map((warning, index) => (
                  <p key={index}>{warning}</p>
                ))}
                <Button
                  size="sm"
                  variant="secondary"
                  aria-label={`Remove ${image.name}`}
                  onClick={() => onImagesChange(images.filter((candidate) => candidate.id !== image.id))}
                >
                  Remove
                </Button>
              </div>
            ))}
          </div>
          <Modal.ButtonRow>
            {images.length > 0 ? (
              <Button
                variant="secondary"
                onClick={() => {
                  onImagesChange([]);
                  session.update({ warnings: [] });
                }}
              >
                Remove all images
              </Button>
            ) : null}
            <Button onClick={onClose}>{images.length > 0 ? 'Use images' : 'Close'}</Button>
          </Modal.ButtonRow>
        </div>
      </Modal>
    </>
  );
}
