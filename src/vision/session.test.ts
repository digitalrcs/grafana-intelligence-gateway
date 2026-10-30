import { act, renderHook } from '@testing-library/react';
import { locationService } from '@grafana/runtime';
import { useImageSession } from './session';
import type { VisionCaptureResult } from './types';

const captured: VisionCaptureResult = {
  attachments: [
    {
      id: '1',
      name: 'Chart',
      dataUrl:
        'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Wl6DkUAAAAASUVORK5CYII=',
      mimeType: 'image/png',
      width: 1,
      height: 1,
      bytes: 68,
      source: 'dashboard',
      capturedAt: '2026-10-30T00:00:00Z',
    },
  ],
  warnings: ['Review the capture'],
};

async function start() {
  const hook = renderHook(() => useImageSession('dashboard:panel:model', 'dashboard:panel'));
  const session = hook.result.current.session;
  let finish!: (result: VisionCaptureResult) => void;
  let signal!: AbortSignal;
  const operation = jest.fn((active: AbortSignal) => {
    signal = active;
    return new Promise<VisionCaptureResult>((resolve) => {
      finish = resolve;
    });
  });
  let pending!: Promise<void>;
  act(() => {
    session.setOpen(true);
    pending = session.run(operation);
  });
  await act(async () => {
    await jest.advanceTimersByTimeAsync(40);
  });
  expect(operation).toHaveBeenCalledTimes(1);
  return { hook, session, signal, finish, pending };
}

describe('capture handoff across Grafana virtualization', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  test.each([false, true])('restores review when the panel returns (capture finished: %s)', async (finished) => {
    const { hook, session, signal, finish, pending } = await start();
    hook.unmount();
    expect(signal.aborted).toBe(false);
    if (finished) {
      await act(async () => {
        finish(captured);
        await pending;
      });
    }
    const restored = renderHook(() => useImageSession('dashboard:panel:model', 'dashboard:panel'));
    expect(restored.result.current.session).toBe(session);
    expect(restored.result.current.state.open).toBe(true);
    if (!finished) {
      await act(async () => {
        finish(captured);
        await pending;
      });
    }
    expect(restored.result.current.state.images).toEqual(captured.attachments);
    expect(restored.result.current.state.warnings).toEqual(captured.warnings);
    expect(restored.result.current.state.busy).toBe(false);
    restored.unmount();
    expect(session.state.images).toEqual([]);
  });

  test('discards unclaimed images after the bounded handoff', async () => {
    const { hook, session, finish, pending } = await start();
    hook.unmount();
    await act(async () => {
      finish(captured);
      await pending;
    });
    await act(async () => {
      await jest.advanceTimersByTimeAsync(5000);
    });
    expect(session.state.images).toEqual([]);
    const restored = renderHook(() => useImageSession('dashboard:panel:model', 'dashboard:panel'));
    expect(restored.result.current.session).not.toBe(session);
    expect(restored.result.current.state.open).toBe(false);
    restored.unmount();
  });

  test('clearing the panel cancels capture and cannot restore a late image', async () => {
    const { hook, session, signal, finish, pending } = await start();
    act(() => {
      session.setImages([]);
      session.setOpen(false);
    });
    expect(signal.aborted).toBe(true);
    await act(async () => {
      finish(captured);
      await pending;
    });
    expect(hook.result.current.state.images).toEqual([]);
    expect(hook.result.current.state.open).toBe(false);
    hook.unmount();
  });

  test.each(['navigation', 'configuration', 'timeout'])('invalidates a detached capture on %s', async (reason) => {
    const { hook, session, signal, finish, pending } = await start();
    hook.unmount();
    if (reason === 'navigation') {
      act(() => locationService.push('/changed-dashboard'));
    }
    if (reason === 'configuration') {
      const changed = renderHook(() => useImageSession('dashboard:panel:other-model', 'dashboard:panel'));
      changed.unmount();
    }
    if (reason === 'timeout') {
      await act(async () => {
        await jest.advanceTimersByTimeAsync(70_000);
      });
    }
    expect(signal.aborted).toBe(true);
    await act(async () => {
      finish(captured);
      await pending;
    });
    expect(session.state.images).toEqual([]);
    const restored = renderHook(() => useImageSession('dashboard:panel:model', 'dashboard:panel'));
    expect(restored.result.current.state.images).toEqual([]);
    expect(restored.result.current.state.open).toBe(false);
    restored.unmount();
  });
});
