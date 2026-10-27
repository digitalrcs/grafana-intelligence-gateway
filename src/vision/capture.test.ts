import { captureDashboard, capturePanelBlob, captureSelectedPanels, compositionGeometry } from './capture';
import { discoverCapturePanels } from './dom';
import { attachmentFromBlob, decodeImage, encodeCanvas } from './images';
import type { VisionAttachment } from './types';
import * as runtime from '@grafana/runtime';
import { toBlob } from 'html-to-image';

jest.mock('@grafana/runtime', () => ({ getPanelScreenshotService: jest.fn() }));
jest.mock('html-to-image', () => ({ toBlob: jest.fn() }));
jest.mock('./images', () => ({
  attachmentFromBlob: jest.fn(),
  dataUrlToBlob: jest.fn(),
  decodeImage: jest.fn(),
  encodeCanvas: jest.fn(),
}));

function attachment(): VisionAttachment {
  const bytes = new Uint8Array(32);
  bytes.set([137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 13, 73, 72, 68, 82]);
  const view = new DataView(bytes.buffer);
  view.setUint32(16, 200);
  view.setUint32(20, 100);
  return {
    id: 'image',
    name: 'Panel 1',
    dataUrl: `data:image/png;base64,${Buffer.from(bytes).toString('base64')}`,
    mimeType: 'image/png',
    width: 200,
    height: 100,
    bytes: bytes.length,
    source: 'panel',
    capturedAt: new Date(0).toISOString(),
  };
}

function dashboard(): HTMLElement {
  const viewport = document.createElement('main');
  viewport.style.overflowY = 'auto';
  Object.defineProperties(viewport, { scrollHeight: { value: 2000 }, clientHeight: { value: 600 } });
  viewport.getBoundingClientRect = () => ({ top: 0, left: 0 }) as DOMRect;
  viewport.scrollTop = 300;
  viewport.scrollLeft = 20;
  const panel = document.createElement('section');
  panel.dataset.vizPanelId = 'panel-1';
  panel.innerHTML = '<h2>Volume</h2>';
  panel.getBoundingClientRect = () => ({ top: 100 - viewport.scrollTop, left: 20, width: 200, height: 100 }) as DOMRect;
  viewport.append(panel);
  document.body.append(viewport);
  return viewport;
}

describe('bounded vision capture lifecycle', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest
      .mocked(runtime.getPanelScreenshotService)
      .mockReturnValue({ capture: jest.fn().mockResolvedValue(new Blob(['png'], { type: 'image/png' })) });
    jest.mocked(attachmentFromBlob).mockResolvedValue(attachment());
    jest.mocked(toBlob).mockResolvedValue(new Blob(['png'], { type: 'image/png' }));
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
    jest.restoreAllMocks();
    document.body.replaceChildren();
  });

  test('captures the selected panel and restores both scroll axes', async () => {
    const viewport = dashboard();
    const controller = new AbortController();
    const operation = captureSelectedPanels(['1'], controller.signal);
    await jest.advanceTimersByTimeAsync(500);
    const result = await operation;
    expect(result.attachments).toHaveLength(1);
    expect(runtime.getPanelScreenshotService().capture).toHaveBeenCalledWith('panel-1', { format: 'png' });
    expect(viewport.scrollTop).toBe(300);
    expect(viewport.scrollLeft).toBe(20);
    expect(result.warnings).toContainEqual(expect.stringContaining('initial data load'));
  });

  test('restores scroll on cancellation and does not continue capturing', async () => {
    const viewport = dashboard();
    const controller = new AbortController();
    const operation = captureSelectedPanels(['1'], controller.signal);
    const assertion = expect(operation).rejects.toMatchObject({ name: 'AbortError' });
    await jest.advanceTimersByTimeAsync(160);
    controller.abort();
    await assertion;
    expect(viewport.scrollTop).toBe(300);
    expect(viewport.scrollLeft).toBe(20);
    expect(attachmentFromBlob).not.toHaveBeenCalled();
  });

  test('times out a stalled renderer, restores scroll, and prevents overlapping renders', async () => {
    const viewport = dashboard();
    let finishRender: (blob: Blob) => void = () => undefined;
    jest.mocked(runtime.getPanelScreenshotService).mockReturnValue({
      capture: jest.fn().mockImplementation(
        () =>
          new Promise<Blob>((resolve) => {
            finishRender = resolve;
          })
      ),
    });
    const operation = captureSelectedPanels(['1'], new AbortController().signal);
    const assertion = expect(operation).rejects.toThrow('exceeded 60 seconds');
    await jest.advanceTimersByTimeAsync(60_001);
    await assertion;
    expect(viewport.scrollTop).toBe(300);
    expect(viewport.scrollLeft).toBe(20);
    await expect(captureSelectedPanels(['1'], new AbortController().signal)).rejects.toThrow('still finishing');
    finishRender(new Blob(['png'], { type: 'image/png' }));
    await jest.advanceTimersByTimeAsync(0);
  });

  test('refuses cancelled operations before any scrolling or capture', async () => {
    const viewport = dashboard();
    const controller = new AbortController();
    controller.abort();
    await expect(captureDashboard(controller.signal)).rejects.toMatchObject({ name: 'AbortError' });
    expect(viewport.scrollTop).toBe(300);
    expect(runtime.getPanelScreenshotService).not.toHaveBeenCalled();
  });

  test('does not capture any gateway instance even if selected by ID', async () => {
    const viewport = dashboard();
    viewport.querySelector('section')!.innerHTML =
      '<div data-digitalrcs-intelligence-gateway="true">Private analysis</div>';
    const operation = captureSelectedPanels(['1'], new AbortController().signal);
    const assertion = expect(operation).rejects.toThrow('was not rendered');
    await jest.advanceTimersByTimeAsync(500);
    await assertion;
    expect(runtime.getPanelScreenshotService).not.toHaveBeenCalled();
    expect(viewport.scrollTop).toBe(300);
  });

  test('falls back when the alpha screenshot service is unavailable', async () => {
    dashboard();
    jest.mocked(runtime.getPanelScreenshotService).mockImplementation(() => {
      throw new Error('Not registered');
    });
    const descriptor = discoverCapturePanels()[0];
    await capturePanelBlob(descriptor, new AbortController().signal);
    expect(toBlob).toHaveBeenCalledWith(
      descriptor.element,
      expect.objectContaining({ cacheBust: false, skipFonts: true })
    );
  });

  test('loading panels are omitted with an explicit error and no screenshot calls', async () => {
    const viewport = dashboard();
    viewport.querySelector('section')!.innerHTML = '<span aria-label="Loading data"></span>';
    const operation = captureSelectedPanels(['1'], new AbortController().signal);
    const assertion = expect(operation).rejects.toThrow('still loading');
    await jest.advanceTimersByTimeAsync(500);
    await assertion;
    expect(runtime.getPanelScreenshotService).not.toHaveBeenCalled();
    expect(viewport.scrollTop).toBe(300);
  });

  test('rejects huge layouts instead of silently shrinking chart text', () => {
    dashboard();
    const panel = discoverCapturePanels()[0];
    panel.position = { x: 0, y: 0, width: 1000, height: 10000 };
    expect(() => compositionGeometry([panel])).toThrow('selected panels');
  });

  test('walks virtualized rows without skipping intermediate panels and composes one image', async () => {
    const viewport = dashboard();
    let top = 300;
    const positions = [0, 700, 1400];
    Object.defineProperty(viewport, 'scrollTop', {
      configurable: true,
      get: () => top,
      set: (next: number) => {
        top = next;
        viewport.replaceChildren();
        positions.forEach((y, index) => {
          if (y + 100 >= top && y <= top + 600) {
            const panel = document.createElement('section');
            panel.dataset.vizPanelId = `panel-${index + 1}`;
            panel.innerHTML = `<h2>Panel ${index + 1}</h2>`;
            panel.getBoundingClientRect = () => ({ top: y - top, left: 20, width: 200, height: 100 }) as DOMRect;
            viewport.append(panel);
          }
        });
      },
    });
    jest
      .spyOn(HTMLCanvasElement.prototype, 'getContext')
      .mockReturnValue({ fillRect: jest.fn(), drawImage: jest.fn() } as unknown as CanvasRenderingContext2D);
    jest
      .mocked(decodeImage)
      .mockResolvedValue({ image: {} as CanvasImageSource, width: 200, height: 100, close: jest.fn() });
    jest.mocked(encodeCanvas).mockResolvedValue(new Blob(['png'], { type: 'image/png' }));
    jest
      .mocked(attachmentFromBlob)
      .mockImplementation(async (_blob, name, source) => ({ ...attachment(), name, source }));
    const operation = captureDashboard(new AbortController().signal);
    await jest.advanceTimersByTimeAsync(5000);
    const result = await operation;
    expect(result.attachments).toHaveLength(1);
    expect(result.attachments[0].source).toBe('dashboard');
    expect(jest.mocked(attachmentFromBlob).mock.calls.map((call) => call[1])).toEqual([
      'Panel 1',
      'Panel 2',
      'Panel 3',
      'Dashboard snapshot',
    ]);
    expect(viewport.scrollTop).toBe(300);
    expect(viewport.scrollLeft).toBe(20);
    expect(result.warnings).toContainEqual(expect.stringContaining('Collapsed rows'));
  });
});
