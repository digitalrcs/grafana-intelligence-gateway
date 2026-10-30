import { useEffect, useState, useSyncExternalStore } from 'react';
import { locationService } from '@grafana/runtime';
import { validateVisionAttachments } from './limits';
import type { VisionAttachment, VisionCaptureResult, VisionProgressHandler } from './types';

interface ImageState {
  images: VisionAttachment[];
  open: boolean;
  busy: boolean;
  progress: string;
  error: string;
  warnings: string[];
}

// Only an active capture and its brief return-to-panel handoff live outside React.
// No images are written to browser storage, dashboard options, or Grafana state.
const captures = new Map<string, ImageSession>();
const emptyState = (): ImageState => ({ images: [], open: false, busy: false, progress: '', error: '', warnings: [] });

export class ImageSession {
  state = emptyState();
  private listeners = new Set<() => void>();
  private controller?: AbortController;
  private mounts = 0;
  private expiry?: ReturnType<typeof setTimeout>;
  private unlisten?: () => void;

  constructor(
    readonly key: string,
    readonly owner = key
  ) {}

  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };
  snapshot = () => this.state;
  update = (patch: Partial<ImageState>) => {
    this.state = { ...this.state, ...patch };
    this.listeners.forEach((listener) => listener());
  };
  setImages = (images: VisionAttachment[]) => this.update({ images });
  setOpen = (open: boolean) => this.update({ open });
  cancel = () => this.controller?.abort();

  mount = () => {
    for (const capture of captures.values()) {
      if (capture.owner === this.owner && capture !== this) {
        capture.dispose();
      }
    }
    this.mounts++;
    if (!this.state.busy) {
      this.release();
    }
    return () => {
      this.mounts--;
      if (!this.state.busy) {
        this.dispose();
      }
    };
  };

  private release() {
    clearTimeout(this.expiry);
    this.unlisten?.();
    this.unlisten = undefined;
    if (captures.get(this.key) === this) {
      captures.delete(this.key);
    }
  }

  dispose = () => {
    this.cancel();
    this.release();
    this.update(emptyState());
  };

  run = async (operation: (signal: AbortSignal, progress: VisionProgressHandler) => Promise<VisionCaptureResult>) => {
    if (this.state.busy) {
      return;
    }
    this.release();
    const controller = new AbortController();
    this.controller = controller;
    captures.set(this.key, this);
    // Navigation (including a dashboard/time-context change) invalidates images.
    this.unlisten = locationService.getHistory().listen(() => this.dispose());
    this.expiry = setTimeout(this.dispose, 70_000);
    this.update({ busy: true, error: '', warnings: [], progress: 'Preparing image inputs…' });
    try {
      // Hide the modal/backdrop before reading dashboard pixels.
      await new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
      if (controller.signal.aborted) {
        return;
      }
      const result = await operation(controller.signal, (progress) => {
        if (!controller.signal.aborted) {
          this.update({ progress });
        }
      });
      if (controller.signal.aborted) {
        return;
      }
      const images = [...this.state.images, ...result.attachments];
      validateVisionAttachments(images);
      this.update({ images, warnings: result.warnings });
    } catch (reason) {
      if (!controller.signal.aborted) {
        this.update({ error: reason instanceof Error ? reason.message : 'Could not prepare image inputs.' });
      }
    } finally {
      if (this.controller !== controller) {
        return;
      }
      this.controller = undefined;
      this.update({ busy: false, progress: '' });
      clearTimeout(this.expiry);
      if (this.mounts > 0) {
        this.release();
      } else {
        // Scroll restoration remounts virtualized panels asynchronously. Discard
        // the result if its panel does not return promptly (removed/navigated away).
        this.expiry = setTimeout(this.dispose, 5_000);
      }
    }
  };
}

export function useImageSession(key: string, owner: string) {
  const [session] = useState(() => captures.get(key) ?? new ImageSession(key, owner));
  const state = useSyncExternalStore(session.subscribe, session.snapshot);
  useEffect(() => session.mount(), [session]);
  return { session, state };
}
