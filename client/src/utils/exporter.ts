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
    time: 0.5, // optimal frame
    config,
  });

  return canvas.toDataURL('image/png');
}

export function downloadDataUrl(dataUrl: string, filename: string) {
  try {
    // 1. Try Telegram WebApp downloadFile if available (Telegram 6.9+)
    const tg = (window as any).Telegram?.WebApp;
    if (tg?.downloadFile && dataUrl.startsWith('data:')) {
      tg.downloadFile({
        url: dataUrl,
        file_name: filename,
      });
      return;
    }
  } catch (e) {
    console.warn('Telegram downloadFile fallback', e);
  }

  // 2. Standard DOM anchor download
  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = filename;
  a.target = '_blank';
  a.rel = 'noopener noreferrer';
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
  }, 100);
}

/**
 * Copy PNG image directly into clipboard (works across modern desktop and mobile browsers)
 */
export async function copyPngToClipboard(dataUrl: string): Promise<boolean> {
  try {
    if (!navigator.clipboard || !window.ClipboardItem) return false;
    const res = await fetch(dataUrl);
    const blob = await res.blob();
    await navigator.clipboard.write([
      new ClipboardItem({ 'image/png': blob }),
    ]);
    return true;
  } catch (err) {
    console.warn('Clipboard image copy not supported', err);
    return false;
  }
}

/**
 * Check if the browser supports animated video recording (MediaRecorder)
 */
export function isVideoRecordingSupported(): boolean {
  if (typeof window === 'undefined' || typeof MediaRecorder === 'undefined') return false;
  const mimeTypes = [
    'video/webm;codecs=vp9',
    'video/webm;codecs=vp8',
    'video/webm',
    'video/mp4',
  ];
  return mimeTypes.some((t) => {
    try {
      return MediaRecorder.isTypeSupported(t);
    } catch {
      return false;
    }
  });
}

/**
 * Record animated loop to WebM/MP4 (VP9/VP8 with alpha for Telegram)
 */
export async function recordAnimatedWebm(
  canvas: HTMLCanvasElement,
  durationSeconds: number = 2.5,
  onProgress?: (progress: number) => void
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    try {
      if (typeof MediaRecorder === 'undefined') {
        throw new Error('MEDIA_RECORDER_UNSUPPORTED');
      }

      // 30 or 60 fps stream from the canvas
      const stream = (canvas as any).captureStream ? (canvas as any).captureStream(30) : null;
      if (!stream) {
        throw new Error('CANVAS_CAPTURE_STREAM_UNSUPPORTED');
      }

      const mimeTypes = [
        'video/webm;codecs=vp9',
        'video/webm;codecs=vp8',
        'video/webm',
        'video/mp4;codecs=avc1',
        'video/mp4',
      ];

      const mimeType = mimeTypes.find((type) => {
        try {
          return MediaRecorder.isTypeSupported(type);
        } catch {
          return false;
        }
      });

      if (!mimeType) {
        throw new Error('NO_SUPPORTED_VIDEO_CODEC');
      }

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
          try {
            if (recorder.state === 'recording') {
              recorder.stop();
            }
          } catch (e) {
            reject(e);
          }
        }
      }, 100);
    } catch (err) {
      reject(err);
    }
  });
}
