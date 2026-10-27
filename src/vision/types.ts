export type VisionImageSource = 'dashboard' | 'panel' | 'upload';

export interface VisionAttachment {
  id: string;
  name: string;
  dataUrl: string;
  mimeType: 'image/png' | 'image/jpeg';
  width: number;
  height: number;
  /** Image bytes before base64 encoding, not JavaScript string length. */
  bytes: number;
  source: VisionImageSource;
  capturedAt: string;
  warnings?: string[];
}

export interface CapturePanel {
  id: string;
  title: string;
  /** Opaque Grafana scene identity; never construct it from the numeric ID. */
  panelPathId?: string;
  element: HTMLElement;
  position: { x: number; y: number; width: number; height: number };
}

export interface VisionCaptureResult {
  attachments: VisionAttachment[];
  warnings: string[];
}

export type VisionProgressHandler = (label: string) => void;
