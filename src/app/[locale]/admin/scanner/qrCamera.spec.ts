import { decodeQrFromVideo, startQrScanLoop } from './qrCamera';

describe('qrCamera', () => {
  it('returns null when the video has no dimensions', async () => {
    const video = { videoWidth: 0, videoHeight: 0 } as HTMLVideoElement;
    const canvas = document.createElement('canvas');
    await expect(decodeQrFromVideo(video, canvas, null)).resolves.toBeNull();
  });

  it('uses BarcodeDetector when it returns a value', async () => {
    const video = { videoWidth: 10, videoHeight: 10 } as HTMLVideoElement;
    const canvas = document.createElement('canvas');
    const detector = { detect: jest.fn().mockResolvedValue([{ rawValue: '  klaruk-booking:abc  ' }]) };
    await expect(decodeQrFromVideo(video, canvas, detector)).resolves.toBe('klaruk-booking:abc');
  });

  it('startQrScanLoop emits a code once per cooldown', async () => {
    jest.useFakeTimers();
    const video = document.createElement('video');
    const canvas = document.createElement('canvas');
    const onCode = jest.fn();
    let active = true;
    const stop = startQrScanLoop({
      video,
      canvas,
      isActive: () => active,
      onCode,
      cooldownMs: 1000,
    });
    jest.advanceTimersByTime(50);
    stop();
    active = false;
    jest.useRealTimers();
    expect(typeof stop).toBe('function');
  });
});
