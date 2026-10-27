import React, { useState } from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { analyzeWithAI, fetchVisionCapabilities, type VisionCapabilities } from '../utils/aiClient';
import {
  captureDashboard,
  captureSelectedPanels,
  discoverCapturePanels,
  importImageFiles,
  validateAttachments,
  type VisionAttachment,
  type VisionCaptureResult,
} from '../vision';
import { ImageInputs } from './ImageInputs';

jest.mock('../utils/aiClient', () => ({
  fetchVisionCapabilities: jest.fn(),
  analyzeWithAI: jest.fn(),
}));
jest.mock('../vision', () => ({
  captureDashboard: jest.fn(),
  captureSelectedPanels: jest.fn(),
  discoverCapturePanels: jest.fn(),
  importImageFiles: jest.fn(),
  validateAttachments: jest.fn(),
  VISION_LIMITS: { maxImages: 8 },
}));

const image = (name = 'Volume chart'): VisionAttachment => ({
  id: name,
  name,
  dataUrl:
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Wl6DkUAAAAASUVORK5CYII=',
  mimeType: 'image/png',
  width: 1,
  height: 1,
  bytes: 68,
  source: 'panel',
  capturedAt: '2026-10-26T12:00:00.000Z',
});

const capabilities = (enabled = true, models = ['vision-model']): VisionCapabilities => ({
  vision: {
    enabled,
    models,
    mimeTypes: ['image/png', 'image/jpeg'],
    limits: {
      maxImages: 8,
      maxImageBytes: 4_194_304,
      maxTotalImageBytes: 12_582_912,
      maxImageWidth: 4096,
      maxImageHeight: 4096,
      maxImagePixels: 16_000_000,
      maxTotalImagePixels: 32_000_000,
      maxRequestBytes: 18_874_368,
    },
  },
});

function Harness({
  initialImages = [],
  onChange = () => undefined,
  onClose = () => undefined,
}: {
  initialImages?: VisionAttachment[];
  onChange?: (images: VisionAttachment[]) => void;
  onClose?: () => void;
}) {
  const [images, setImages] = useState(initialImages);
  const [isOpen, setOpen] = useState(true);
  return (
    <ImageInputs
      isOpen={isOpen}
      onClose={() => {
        setOpen(false);
        onClose();
      }}
      images={images}
      onImagesChange={(next) => {
        setImages(next);
        onChange(next);
      }}
      dataSourceUid="secure-ai"
      model="vision-model"
      includeQueryData={false}
    />
  );
}

async function captureButton(): Promise<HTMLElement> {
  const button = screen.getByRole('button', { name: 'Capture dashboard' });
  await waitFor(() => expect(button).toBeEnabled());
  return button;
}

describe('ImageInputs explicit preview workflow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(fetchVisionCapabilities).mockResolvedValue(capabilities());
    jest.mocked(discoverCapturePanels).mockReturnValue([
      {
        id: '1',
        title: 'Volume',
        element: document.createElement('section'),
        position: { x: 0, y: 0, width: 200, height: 100 },
      },
    ]);
    jest.mocked(captureDashboard).mockResolvedValue({ attachments: [image()], warnings: [] });
    jest.mocked(captureSelectedPanels).mockResolvedValue({ attachments: [image()], warnings: [] });
    jest.mocked(importImageFiles).mockResolvedValue([image('Uploaded image')]);
    jest.mocked(validateAttachments).mockImplementation(() => undefined);
    jest
      .spyOn(window, 'requestAnimationFrame')
      .mockImplementation((callback) => window.setTimeout(() => callback(0), 0));
  });

  afterEach(() => jest.restoreAllMocks());

  test('capture creates a reviewable preview and closing the preview never sends inference', async () => {
    const onChange = jest.fn();
    const onClose = jest.fn();
    render(<Harness onChange={onChange} onClose={onClose} />);
    fireEvent.click(await captureButton());
    expect(await screen.findByAltText('Preview: Volume chart')).toBeInTheDocument();
    expect(onChange).toHaveBeenCalledWith([image()]);
    expect(validateAttachments).toHaveBeenCalledWith([image()]);
    expect(analyzeWithAI).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Use images' }));
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(analyzeWithAI).not.toHaveBeenCalled();
  });

  test.each([
    ['disabled backend', capabilities(false)],
    ['unapproved model', capabilities(true, ['another-model'])],
  ])('disables capture and import for %s', async (_description, result) => {
    jest.mocked(fetchVisionCapabilities).mockResolvedValue(result);
    render(<Harness />);
    expect(await screen.findByText(/Ask an administrator to enable vision/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Capture dashboard' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Add images' })).toBeDisabled();
    fireEvent.click(screen.getByRole('checkbox', { name: 'Volume' }));
    expect(screen.getByRole('button', { name: 'Capture selected panels' })).toBeDisabled();
    expect(captureDashboard).not.toHaveBeenCalled();
    expect(analyzeWithAI).not.toHaveBeenCalled();
  });

  test('keeps controls disabled when capability discovery fails', async () => {
    jest.mocked(fetchVisionCapabilities).mockRejectedValue(new Error('Upgrade the companion data source.'));
    render(<Harness />);
    expect(await screen.findByText('Upgrade the companion data source.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Capture dashboard' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Add images' })).toBeDisabled();
  });

  test('checkbox selection is reflected in capture IDs and previews', async () => {
    render(<Harness />);
    await captureButton();
    fireEvent.click(screen.getByRole('checkbox', { name: 'Volume' }));
    fireEvent.click(screen.getByRole('button', { name: 'Capture selected panels' }));
    expect(await screen.findByAltText('Preview: Volume chart')).toBeInTheDocument();
    expect(captureSelectedPanels).toHaveBeenCalledWith(['1'], expect.any(AbortSignal), expect.any(Function));
    expect(analyzeWithAI).not.toHaveBeenCalled();
  });

  test('panel choices reserve only the checkbox width and keep titles left aligned', async () => {
    render(<Harness />);
    await captureButton();
    const checkbox = screen.getByRole('checkbox', { name: 'Volume' });
    expect(checkbox.closest('label')).toHaveStyle({
      gridTemplateColumns: 'max-content minmax(0, 1fr)',
      textAlign: 'left',
      overflowWrap: 'anywhere',
    });
    fireEvent.click(screen.getByText('Volume', { selector: 'span' }));
    expect(checkbox).toBeChecked();
    expect(analyzeWithAI).not.toHaveBeenCalled();
  });

  test('removes an individual image and clears all remaining image data', async () => {
    const onChange = jest.fn();
    render(<Harness initialImages={[image('First'), image('Second')]} onChange={onChange} />);
    await captureButton();
    fireEvent.click(screen.getByRole('button', { name: 'Remove First' }));
    expect(screen.queryByAltText('Preview: First')).not.toBeInTheDocument();
    expect(onChange).toHaveBeenLastCalledWith([image('Second')]);
    fireEvent.click(screen.getByRole('button', { name: 'Remove all images' }));
    expect(screen.queryByTestId('image-preview')).not.toBeInTheDocument();
    expect(onChange).toHaveBeenLastCalledWith([]);
    expect(analyzeWithAI).not.toHaveBeenCalled();
  });

  test('cancels preparation and discards a late result without losing previous images', async () => {
    let finish: (result: VisionCaptureResult) => void = () => undefined;
    let signal: AbortSignal | undefined;
    jest.mocked(captureDashboard).mockImplementation((activeSignal) => {
      signal = activeSignal;
      return new Promise((resolve) => {
        finish = resolve;
      });
    });
    const onChange = jest.fn();
    render(<Harness initialImages={[image('Previous')]} onChange={onChange} />);
    fireEvent.click(await captureButton());
    await waitFor(() => expect(captureDashboard).toHaveBeenCalledTimes(1));
    fireEvent.click(screen.getByRole('button', { name: 'Cancel capture' }));
    expect(signal?.aborted).toBe(true);
    await act(async () => finish({ attachments: [image('Cancelled result')], warnings: [] }));
    expect(await screen.findByAltText('Preview: Previous')).toBeInTheDocument();
    expect(screen.queryByAltText('Preview: Cancelled result')).not.toBeInTheDocument();
    expect(onChange).not.toHaveBeenCalled();
    expect(analyzeWithAI).not.toHaveBeenCalled();
  });

  test('retains previous images after failed capture and reports the failure', async () => {
    jest.mocked(captureDashboard).mockRejectedValue(new Error('Panel rendering timed out.'));
    const onChange = jest.fn();
    render(<Harness initialImages={[image('Previous')]} onChange={onChange} />);
    fireEvent.click(await captureButton());
    expect(await screen.findByText('Panel rendering timed out.')).toBeInTheDocument();
    expect(screen.getByAltText('Preview: Previous')).toBeInTheDocument();
    expect(onChange).not.toHaveBeenCalled();
  });

  test('unmounting aborts capture and prevents a late result from restoring sensitive image state', async () => {
    let finish: (result: VisionCaptureResult) => void = () => undefined;
    let signal: AbortSignal | undefined;
    jest.mocked(captureDashboard).mockImplementation((activeSignal) => {
      signal = activeSignal;
      return new Promise((resolve) => {
        finish = resolve;
      });
    });
    const onChange = jest.fn();
    const view = render(<Harness onChange={onChange} />);
    fireEvent.click(await captureButton());
    await waitFor(() => expect(captureDashboard).toHaveBeenCalledTimes(1));
    view.unmount();
    expect(signal?.aborted).toBe(true);
    await act(async () => finish({ attachments: [image('Late private image')], warnings: [] }));
    expect(onChange).not.toHaveBeenCalled();
    expect(analyzeWithAI).not.toHaveBeenCalled();
  });

  test('validates combined images before replacing previous state', async () => {
    jest.mocked(validateAttachments).mockImplementation(() => {
      throw new Error('Attach at most 8 images per analysis.');
    });
    const onChange = jest.fn();
    render(<Harness initialImages={[image('Previous')]} onChange={onChange} />);
    fireEvent.click(await captureButton());
    expect(await screen.findByText('Attach at most 8 images per analysis.')).toBeInTheDocument();
    expect(screen.getByAltText('Preview: Previous')).toBeInTheDocument();
    expect(screen.queryByAltText('Preview: Volume chart')).not.toBeInTheDocument();
    expect(onChange).not.toHaveBeenCalled();
  });

  test('imports selected files for preview without submitting them', async () => {
    render(<Harness />);
    await captureButton();
    const file = new File(['png'], 'upload.png', { type: 'image/png' });
    fireEvent.change(screen.getByLabelText('Add PNG or JPEG images'), { target: { files: [file] } });
    expect(await screen.findByAltText('Preview: Uploaded image')).toBeInTheDocument();
    expect(importImageFiles).toHaveBeenCalledWith([file], expect.any(AbortSignal));
    expect(analyzeWithAI).not.toHaveBeenCalled();
  });
});
