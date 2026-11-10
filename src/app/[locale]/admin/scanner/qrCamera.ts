import jsQR from 'jsqr';

type BarcodeDetectorLike = {
  detect: (source: HTMLVideoElement) => Promise<Array<{ rawValue?: string }>>;
};

function getBarcodeDetector(): BarcodeDetectorLike | null {
  const Ctor = (globalThis as { BarcodeDetector?: new (opts: { formats: string[] }) => BarcodeDetectorLike })
    .BarcodeDetector;
  if (!Ctor) return null;
  try {
    return new Ctor({ formats: ['qr_code'] });
  } catch {
    return null;
  }
}

export async function decodeQrFromVideo(
  video: HTMLVideoElement,
  canvas: HTMLCanvasElement,
  detector?: BarcodeDetectorLike | null,
): Promise<string | null> {
  const width = video.videoWidth;
  const height = video.videoHeight;
  if (!width || !height) return null;

  const activeDetector = detector === undefined ? getBarcodeDetector() : detector;
  if (activeDetector) {
    try {
      const codes = await activeDetector.detect(video);
      const value = codes.find((c) => c.rawValue)?.rawValue?.trim();
      if (value) return value;
    } catch {
      /* fall through to jsQR */
    }
  }

  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return null;
  canvas.width = width;
  canvas.height = height;
  ctx.drawImage(video, 0, 0, width, height);
  const imageData = ctx.getImageData(0, 0, width, height);
  const result = jsQR(imageData.data, imageData.width, imageData.height, {
    inversionAttempts: 'attemptBoth',
  });
  return result?.data?.trim() || null;
}

export function startQrScanLoop(options: {
  video: HTMLVideoElement;
  canvas: HTMLCanvasElement;
  isActive: () => boolean;
  onCode: (code: string) => void;
  cooldownMs?: number;
}): () => void {
  const cooldownMs = options.cooldownMs ?? 4000;
  let raf = 0;
  let stopped = false;
  let lastCode = '';
  let lastAt = 0;
  const detector = getBarcodeDetector();

  const tick = async () => {
    if (stopped || !options.isActive()) return;
    try {
      const code = await decodeQrFromVideo(options.video, options.canvas, detector);
      const now = Date.now();
      if (code && (code !== lastCode || now - lastAt >= cooldownMs)) {
        lastCode = code;
        lastAt = now;
        options.onCode(code);
      }
    } catch {
      /* keep looping */
    }
    if (!stopped && options.isActive()) {
      raf = requestAnimationFrame(() => {
        void tick();
      });
    }
  };

  raf = requestAnimationFrame(() => {
    void tick();
  });

  return () => {
    stopped = true;
    cancelAnimationFrame(raf);
  };
}
