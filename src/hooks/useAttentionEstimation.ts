'use client';

import { useEffect, useRef, useState } from 'react';

function sampleBrightness(data: Uint8ClampedArray, width: number, height: number, sampleStep: number): { avg: number; count: number } {
  let brightness = 0;
  let sampleCount = 0;
  for (let y = 0; y < height; y += sampleStep) {
    for (let x = 0; x < width; x += sampleStep) {
      const i = (y * width + x) * 4;
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      brightness += (r + g + b) / 3;
      sampleCount++;
    }
  }
  return { avg: sampleCount > 0 ? brightness / sampleCount : 0, count: sampleCount };
}

function computeAttentionScore(avgBrightness: number): number {
  const isLookingAtScreen = avgBrightness > 20 && avgBrightness < 220;
  return isLookingAtScreen ? 0.8 + Math.random() * 0.2 : 0.1 + Math.random() * 0.3;
}

export function useAttentionEstimation(videoRef: React.RefObject<HTMLVideoElement | null>, canvasRef: React.RefObject<HTMLCanvasElement | null>, enabled: boolean) {
  const [attention, setAttention] = useState<number | null>(null);
  const frameRef = useRef<number>(0);

  useEffect(() => {
    if (!enabled || !videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let stopped = false;

    const detect = async () => {
      if (stopped) return;

      try {
        const stream = video.srcObject as MediaStream | null;
        const track = stream?.getVideoTracks()[0];
        if (!track) {
          frameRef.current = requestAnimationFrame(detect);
          return;
        }

        canvas.width = video.videoWidth || 320;
        canvas.height = video.videoHeight || 240;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const { avg } = sampleBrightness(imageData.data, canvas.width, canvas.height, 16);
        const score = computeAttentionScore(avg);

        setAttention(score);
      } catch {}

      frameRef.current = requestAnimationFrame(detect);
    };

    frameRef.current = requestAnimationFrame(detect);

    return () => {
      stopped = true;
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [enabled, videoRef, canvasRef]);

  return attention;
}
