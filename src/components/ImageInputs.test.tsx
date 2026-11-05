import React, { useEffect } from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { analyzeWithAI, fetchVisionCapabilities, type VisionCapabilities } from '../utils/aiClient';
import { importImageFiles, type VisionAttachment } from '../vision';
import { ImageInputs } from './ImageInputs';
import { useImageSession } from '../vision/session';
import { validateVisionAttachments as validateAttachments } from '../vision/limits';

jest.mock('../vision/limits', () => ({ validateVisionAttachments: jest.fn() }));

jest.mock('../utils/aiClient', () => ({
  fetchVisionCapabilities: jest.fn(),
  analyzeWithAI: jest.fn(),
}));
jest.mock('../vision', () => ({
  importImageFiles: jest.fn(),
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

const noChange = () => undefined;
const noImages: VisionAttachment[] = [];
function Harness({
  initialImages = noImages,
  onChange = noChange,
  onClose = noChange,
}: {
  initialImages?: VisionAttachment[];
  onChange?: (images: VisionAttachment[]) => void;
  onClose?: () => void;
}) {
  const {
    session,
    state: { images, open: isOpen },
  } = useImageSession('test-images', 'test-images');
  useEffect(() => {
    if (!session.state.open) {
      session.update({ images: initialImages, open: true });
    }
    let previous = session.state.images;
    return session.subscribe(() => {
      if (session.state.images !== previous) {
        previous = session.state.images;
        onChange(previous);
      }
    });
  }, [session, initialImages, onChange]);
  const setImages = session.setImages;
  const setOpen = session.setOpen;
  return (
    <ImageInputs
      session={session}
      isOpen={isOpen}
      onClose={() => {
        setOpen(false);
        onClose();
      }}
      images={images}
      onImagesChange={(next) => {
        setImages(next);
      }}
      dataSourceUid="secure-ai"
      model="vision-model"
      includeQueryData={false}
    />
  );
}

describe('public image upload workflow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(fetchVisionCapabilities).mockResolvedValue(capabilities());
    jest.mocked(importImageFiles).mockResolvedValue([image('Uploaded image')]);
    jest.mocked(validateAttachments).mockImplementation(() => undefined);
    jest
      .spyOn(window, 'requestAnimationFrame')
      .mockImplementation((callback) => window.setTimeout(() => callback(0), 0));
  });
  afterEach(() => jest.restoreAllMocks());
  test('offers only uploads, previews without inference, and removes pending images', async () => {
    render(<Harness />);
    await waitFor(() => expect(screen.getByRole('button', { name: 'Add images' })).toBeEnabled());
    expect(screen.queryByRole('button', { name: /Capture/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Add PNG or JPEG images'), {
      target: { files: [new File(['image'], 'chart.png', { type: 'image/png' })] },
    });
    expect(await screen.findByAltText('Preview: Uploaded image')).toBeInTheDocument();
    expect(analyzeWithAI).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Remove Uploaded image' }));
    expect(screen.queryByTestId('image-preview')).not.toBeInTheDocument();
    fireEvent.click(screen.getByText('Close', { selector: 'span' }));
    expect(analyzeWithAI).not.toHaveBeenCalled();
  });
  test.each([
    ['disabled vision', capabilities(false)],
    ['unapproved model', capabilities(true, ['other'])],
  ])('blocks uploads for %s', async (_name, policy) => {
    jest.mocked(fetchVisionCapabilities).mockResolvedValue(policy);
    render(<Harness />);
    expect(await screen.findByText(/Ask an administrator to enable vision/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Add images' })).toBeDisabled();
    expect(importImageFiles).not.toHaveBeenCalled();
  });
});
