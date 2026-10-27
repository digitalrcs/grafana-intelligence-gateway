// SPDX-License-Identifier: Apache-2.0
// Adapted from DigitalRCS Current View Exporter; see PROVENANCE.md.
import * as grafanaRuntime from '@grafana/runtime';
import {
  discoverCapturePanels,
  findDashboardScroller,
  isExcludedElement,
  panelPosition,
  panelUnavailableReason,
  setScroll,
} from './dom';
import { attachmentFromBlob, dataUrlToBlob, decodeImage, encodeCanvas } from './images';
import { boundedGeometry, throwIfAborted, validateVisionAttachments, VISION_LIMITS, waitForAbortable } from './limits';
import type { CapturePanel, VisionAttachment, VisionCaptureResult, VisionProgressHandler } from './types';

const MAX_CAPTURE_MS = 60_000;
const MAX_SCROLL_STEPS = 40;
const MAX_DASHBOARD_PANELS = 24;
const MAX_CAPTURE_SOURCE_PIXELS = 32_000_000;
let captureRunning = false;
let pendingRenders = 0;

type RuntimeWithOptionalScreenshotService = typeof grafanaRuntime & {
  getPanelScreenshotService?: () => { capture: (panelPathId: string, options?: { format: 'png' }) => Promise<Blob> };
};

interface Snapshot {
  panel: CapturePanel;
  attachment: VisionAttachment;
}

function pause(signal: AbortSignal): Promise<void> {
  return waitForAbortable(new Promise<void>((resolve) => setTimeout(resolve, 150)), signal);
}

function waitForRender<T>(promise: Promise<T>, signal: AbortSignal): Promise<T> {
  // Browser screenshot APIs cannot cancel their internal renderer. Do not start
  // another capture while an aborted render is still consuming browser memory.
  pendingRenders++;
  const tracked = promise.then(
    (value) => {
      pendingRenders--;
      return value;
    },
    (error) => {
      pendingRenders--;
      throw error;
    }
  );
  return waitForAbortable(tracked, signal);
}

function backgroundColor(): string {
  const value = window.getComputedStyle(document.body).backgroundColor;
  return value && value !== 'rgba(0, 0, 0, 0)' ? value : '#181b1f';
}

export async function capturePanelBlob(panel: CapturePanel, signal: AbortSignal): Promise<Blob> {
  throwIfAborted(signal);
  const unavailable = panelUnavailableReason(panel);
  if (unavailable) {
    throw new Error(unavailable);
  }
  const rect = panel.element.getBoundingClientRect();
  const geometry = boundedGeometry(Math.round(rect.width), Math.round(rect.height));
  const getService = (grafanaRuntime as RuntimeWithOptionalScreenshotService).getPanelScreenshotService;
  // The alpha service owns its rendering scale. Bound its potential source bitmap
  // using devicePixelRatio; use the controlled fallback for very large panels.
  const estimatedPixels = rect.width * rect.height * Math.max(1, window.devicePixelRatio) ** 2;
  if (panel.panelPathId && typeof getService === 'function' && estimatedPixels <= MAX_CAPTURE_SOURCE_PIXELS) {
    try {
      const blob = await waitForRender(getService().capture(panel.panelPathId, { format: 'png' }), signal);
      throwIfAborted(signal);
      if (blob.size) {
        return blob;
      }
    } catch (error) {
      throwIfAborted(signal);
      // The alpha service can reject legacy or unsupported panel renderers.
    }
  }
  const { toBlob } = await waitForAbortable(import('html-to-image'), signal);
  throwIfAborted(signal);
  const blob = await waitForRender(
    toBlob(panel.element, {
      backgroundColor: backgroundColor(),
      pixelRatio: geometry.scale,
      cacheBust: false,
      skipFonts: true,
      skipAutoScale: false,
      // Exclude every gateway panel even if a dashboard layout nests panel roots.
      filter: (node) => !(node instanceof Element) || !isExcludedElement(node),
    }),
    signal
  );
  throwIfAborted(signal);
  if (!blob?.size) {
    throw new Error('The browser returned an empty panel image. Canvas or WebGL content may be unreadable.');
  }
  return blob;
}

function snapshotTotals(snapshots: Snapshot[]): { bytes: number; pixels: number } {
  return snapshots.reduce(
    (total, snapshot) => ({
      bytes: total.bytes + snapshot.attachment.bytes,
      pixels: total.pixels + snapshot.attachment.width * snapshot.attachment.height,
    }),
    { bytes: 0, pixels: 0 }
  );
}

export function compositionGeometry(panels: CapturePanel[]): {
  width: number;
  height: number;
  scale: number;
  minX: number;
  minY: number;
} {
  if (!panels.length) {
    throw new Error('No dashboard panels are available to compose.');
  }
  const minX = Math.min(...panels.map((panel) => panel.position.x));
  const minY = Math.min(...panels.map((panel) => panel.position.y));
  const width = Math.max(...panels.map((panel) => panel.position.x + panel.position.width)) - minX;
  const height = Math.max(...panels.map((panel) => panel.position.y + panel.position.height)) - minY;
  const geometry = boundedGeometry(Math.max(1, Math.ceil(width)), Math.max(1, Math.ceil(height)));
  if (geometry.scale < 0.5) {
    throw new Error('This dashboard is too large for a readable single image. Capture selected panels instead.');
  }
  return { ...geometry, minX, minY };
}

async function compose(snapshots: Snapshot[], signal: AbortSignal, warnings: string[]): Promise<VisionAttachment> {
  const geometry = compositionGeometry(snapshots.map((snapshot) => snapshot.panel));
  const canvas = document.createElement('canvas');
  canvas.width = geometry.width;
  canvas.height = geometry.height;
  try {
    const context = canvas.getContext('2d');
    if (!context) {
      throw new Error('This browser could not create a dashboard image canvas.');
    }
    context.fillStyle = backgroundColor();
    context.fillRect(0, 0, canvas.width, canvas.height);
    for (const snapshot of snapshots) {
      throwIfAborted(signal);
      const bitmap = await decodeImage(
        dataUrlToBlob(snapshot.attachment.dataUrl, snapshot.attachment.mimeType),
        signal
      );
      try {
        const position = snapshot.panel.position;
        context.drawImage(
          bitmap.image,
          Math.round((position.x - geometry.minX) * geometry.scale),
          Math.round((position.y - geometry.minY) * geometry.scale),
          Math.max(1, Math.round(position.width * geometry.scale)),
          Math.max(1, Math.round(position.height * geometry.scale))
        );
      } finally {
        bitmap.close();
      }
    }
    if (geometry.scale < 1) {
      warnings.push(
        `The dashboard image was scaled to ${Math.round(geometry.scale * 100)}% (${geometry.width} × ${geometry.height}). Review chart labels before sending, or capture selected panels for more detail.`
      );
    }
    const attachment = await attachmentFromBlob(
      await encodeCanvas(canvas, 'image/png', signal),
      'Dashboard snapshot',
      'dashboard',
      signal
    );
    warnings.push(...(attachment.warnings ?? []));
    attachment.warnings = [...warnings];
    return attachment;
  } finally {
    canvas.width = 1;
    canvas.height = 1;
  }
}

async function runCapture(
  ids: string[] | undefined,
  externalSignal: AbortSignal,
  onProgress?: VisionProgressHandler
): Promise<VisionCaptureResult> {
  throwIfAborted(externalSignal);
  if (captureRunning || pendingRenders) {
    throw new Error('An image capture is still finishing in your browser. Try again shortly.');
  }
  if (ids && (!ids.length || ids.length > VISION_LIMITS.maxImages)) {
    throw new Error('Select between 1 and 8 panels to capture.');
  }
  const scroller = findDashboardScroller();
  if (!scroller) {
    throw new Error('No rendered dashboard panels were found. Open a dashboard and wait for its panels to load.');
  }
  captureRunning = true;
  const controller = new AbortController();
  const onAbort = () => controller.abort(externalSignal.reason);
  externalSignal.addEventListener('abort', onAbort, { once: true });
  const timer = setTimeout(
    () => controller.abort(new Error('Image capture exceeded 60 seconds. Capture fewer panels and try again.')),
    MAX_CAPTURE_MS
  );
  const signal = controller.signal;
  const originalTop = scroller.scrollTop;
  const originalLeft = scroller.scrollLeft;
  const snapshots: Snapshot[] = [];
  const warnings: string[] = [];
  const handled = new Set<string>();
  const selected = ids ? new Set(ids) : undefined;
  let reachedEnd = false;
  let newPanels = false;
  let capped = false;
  let scrolled = false;
  const initiallyPresent = new Set(discoverCapturePanels(document, scroller, true).map((panel) => panel.id));
  try {
    for (let step = 0; step < MAX_SCROLL_STEPS; step++) {
      throwIfAborted(signal);
      onProgress?.('Finding rendered dashboard panels…');
      if (!selected && step === 0) {
        scrolled ||= scroller.scrollTop !== 0;
        setScroll(scroller, 0, originalLeft);
      }
      await pause(signal);
      const viewportTop = scroller.scrollTop;
      const viewportHeight = scroller.clientHeight || window.innerHeight;
      // Unrendered roots guide scrolling only. The fresh lookup below requires
      // materialized content and rechecks Intelligence Gateway exclusion.
      const panels = discoverCapturePanels(document, scroller, true).filter((panel) =>
        selected
          ? selected.has(panel.id)
          : panel.position.y + panel.position.height >= viewportTop && panel.position.y <= viewportTop + viewportHeight
      );
      for (const panel of panels) {
        if (handled.has(panel.id)) {
          continue;
        }
        handled.add(panel.id);
        newPanels ||= !initiallyPresent.has(panel.id);
        if (!selected && snapshots.length >= MAX_DASHBOARD_PANELS) {
          capped = true;
          break;
        }
        try {
          // Reveal only the target's existing position; no Grafana refresh/query API is called.
          const current = panelPosition(panel.element, scroller);
          scrolled ||= Math.max(0, current.y) !== scroller.scrollTop;
          setScroll(scroller, Math.max(0, current.y), originalLeft);
          await pause(signal);
          const fresh = discoverCapturePanels(document, scroller).find((candidate) => candidate.id === panel.id);
          if (!fresh) {
            throw new Error('the panel was unmounted before capture');
          }
          onProgress?.(`Capturing ${fresh.title}…`);
          const attachment = await attachmentFromBlob(
            await capturePanelBlob(fresh, signal),
            fresh.title,
            'panel',
            signal
          );
          if (attachment.width < fresh.position.width || attachment.height < fresh.position.height) {
            const sizeWarning = `${fresh.title} was reduced to ${attachment.width} × ${attachment.height}. Check chart labels in the preview.`;
            attachment.warnings = [...(attachment.warnings ?? []), sizeWarning];
          }
          const next = [...snapshots, { panel: fresh, attachment }];
          const totals = snapshotTotals(next);
          if (totals.bytes > VISION_LIMITS.maxTotalImageBytes || totals.pixels > VISION_LIMITS.maxTotalImagePixels) {
            capped = true;
            warnings.push(
              `${fresh.title} was omitted because capture reached the 12 MiB or 32 million pixel memory limit.`
            );
            break;
          }
          snapshots.push({ panel: fresh, attachment });
          warnings.push(...(attachment.warnings ?? []));
        } catch (error) {
          throwIfAborted(signal);
          warnings.push(`${panel.title} was omitted: ${error instanceof Error ? error.message : 'capture failed'}.`);
        }
      }
      if (selected || capped) {
        reachedEnd = Boolean(selected);
        break;
      }
      // Visiting an individual panel must not skip intervening virtualized rows.
      setScroll(scroller, viewportTop, originalLeft);
      const maxTop = Math.max(0, scroller.scrollHeight - scroller.clientHeight);
      const currentTop = scroller.scrollTop;
      if (currentTop >= maxTop - 1) {
        reachedEnd = true;
        break;
      }
      const nextTop = Math.min(maxTop, currentTop + Math.max(1, Math.floor(scroller.clientHeight * 0.75)));
      if (nextTop <= currentTop) {
        break;
      }
      scrolled = true;
      setScroll(scroller, nextTop, originalLeft);
    }
    throwIfAborted(signal);
    if (selected) {
      for (const id of selected) {
        if (!handled.has(id)) {
          warnings.push(`Panel ${id} was not rendered. Scroll it into view, wait for its data, and capture it again.`);
        }
      }
    } else {
      warnings.push(
        'Intelligence Gateway panels are excluded. Collapsed rows and panels that Grafana has not rendered may be absent; review the image before sending.'
      );
    }
    if (scrolled || newPanels) {
      warnings.push(
        'Scrolling can cause Grafana to perform the initial data load for lazy panels. This capture did not request a dashboard refresh or requery.'
      );
    }
    if (!reachedEnd || capped) {
      warnings.push(
        'This is a partial dashboard capture because the capture limit was reached. Use selected-panel images for the omitted panels.'
      );
    }
    if (!snapshots.length) {
      throw new Error(
        warnings[0] ?? 'No eligible dashboard panels could be captured. Intelligence Gateway panels are excluded.'
      );
    }
    if (selected) {
      const attachments = snapshots.map((snapshot) => snapshot.attachment);
      validateVisionAttachments(attachments);
      return { attachments, warnings };
    }
    onProgress?.('Composing dashboard snapshot…');
    return { attachments: [await compose(snapshots, signal, warnings)], warnings };
  } finally {
    clearTimeout(timer);
    externalSignal.removeEventListener('abort', onAbort);
    setScroll(scroller, originalTop, originalLeft);
    snapshots.length = 0;
    captureRunning = false;
  }
}

export function captureDashboard(
  signal: AbortSignal,
  onProgress?: VisionProgressHandler
): Promise<VisionCaptureResult> {
  return runCapture(undefined, signal, onProgress);
}

export function captureSelectedPanels(
  ids: string[],
  signal: AbortSignal,
  onProgress?: VisionProgressHandler
): Promise<VisionCaptureResult> {
  return runCapture(ids, signal, onProgress);
}
