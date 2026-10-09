import type { EmojiConfig } from '../types';
import { renderEmojiFrame } from './canvasRenderer';

export async function exportStaticPng(config: EmojiConfig, resolution: 100 | 512): Promise<string> {
  const canvas = document.createElement('canvas');
  canvas.width = resolution;
  canvas.height = resolution;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Failed to get 2D context');

  renderEmojiFrame({
    ctx,
    width: resolution,
    height: resolution,
    time: 0.5, // nice mid-frame
    config,
  });

  return canvas.toDataURL('image/png');
}

export function downloadDataUrl(dataUrl: string, filename: string) {
  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

// Record animated loop to WebM (VP9 with alpha for Telegram animated custom emojis)
export async function recordAnimatedWebm(
  canvas: HTMLCanvasElement,
  durationSeconds: number = 2.5,
  onProgress?: (progress: number) => void
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    try {
      // 30 or 60 fps stream from the canvas
      const stream = canvas.captureStream(30);
      
      // Supported mimeTypes for Telegram Animated WebM with alpha
      const mimeTypes = [
        'video/webm;codecs=vp9',
        'video/webm;codecs=vp8',
        'video/webm',
      ];
      
      const mimeType = mimeTypes.find(type => MediaRecorder.isTypeSupported(type)) || 'video/webm';
      
      const recorder = new MediaRecorder(stream, {
        mimeType,
        videoBitsPerSecond: 2500000,
      });

      const chunks: Blob[] = [];

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: mimeType });
        resolve(blob);
      };

      recorder.start();

      const startTime = performance.now();
      const interval = setInterval(() => {
        const elapsed = (performance.now() - startTime) / 1000;
        const p = Math.min(100, Math.round((elapsed / durationSeconds) * 100));
        if (onProgress) onProgress(p);

        if (elapsed >= durationSeconds) {
          clearInterval(interval);
          recorder.stop();
        }
      }, 100);
    } catch (err) {
      reject(err);
    }
  });
}
