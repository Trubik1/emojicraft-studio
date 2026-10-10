import React, { useEffect, useRef, useState } from 'react';
import type { EmojiConfig } from '../types';
import { renderEmojiFrame } from '../utils/canvasRenderer';
import { exportStaticPng, downloadDataUrl, recordAnimatedWebm, copyPngToClipboard, isVideoRecordingSupported } from '../utils/exporter';
import { saveEmojiToGallery } from '../utils/galleryStorage';
import { useTelegram } from '../hooks/useTelegram';
import confetti from 'canvas-confetti';
import { Download, Film, Sparkles, Move, RotateCcw, Check, Copy, AlertCircle, X } from 'lucide-react';

interface Props {
  config: EmojiConfig;
  onChangeConfig: (newConfig: EmojiConfig) => void;
}

export const EmojiCanvas: React.FC<Props> = ({ config, onChangeConfig }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const { haptic } = useTelegram();

  const [isRecording, setIsRecording] = useState(false);
  const [recordProgress, setRecordProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const [copiedPng, setCopiedPng] = useState(false);
  const [exportModalSrc, setExportModalSrc] = useState<string | null>(null);
  const [iosWarning, setIosWarning] = useState<string | null>(null);
  const dragStartRef = useRef<{ x: number; y: number; initialOffsetX: number; initialOffsetY: number } | null>(null);

  // Animation Loop (60 FPS)
  useEffect(() => {
    let startTime = performance.now();

    const loop = (currentTime: number) => {
      const elapsed = (currentTime - startTime) / 1000;
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          renderEmojiFrame({
            ctx,
            width: canvas.width,
            height: canvas.height,
            time: elapsed,
            config,
          });
        }
      }
      animFrameRef.current = requestAnimationFrame(loop);
    };

    animFrameRef.current = requestAnimationFrame(loop);

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [config]);

  // Touch & Mouse Dragging for Letter positioning with smooth feel
  const handlePointerDown = (e: React.PointerEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    setIsDragging(true);
    haptic.selection();
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      initialOffsetX: config.letterOffsetX,
      initialOffsetY: config.letterOffsetY,
    };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging || !dragStartRef.current) return;
    const dx = (e.clientX - dragStartRef.current.x) * 0.55;
    const dy = (e.clientY - dragStartRef.current.y) * 0.55;
    onChangeConfig({
      ...config,
      letterOffsetX: Math.max(-60, Math.min(60, Math.round(dragStartRef.current.initialOffsetX + dx))),
      letterOffsetY: Math.max(-60, Math.min(60, Math.round(dragStartRef.current.initialOffsetY + dy))),
    });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    setIsDragging(false);
    dragStartRef.current = null;
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {}
  };

  // Export Static PNG (100x100 for Telegram Emoji or 512x512 for Sticker)
  const handleExportPng = async (res: 100 | 512) => {
    haptic.medium();
    const dataUrl = await exportStaticPng(config, res);
    const suffix = res === 100 ? 'emoji_100x100' : 'sticker_512x512';
    downloadDataUrl(dataUrl, `custom_${config.character}_${suffix}.png`);
    saveEmojiToGallery(config.character, config.baseShape, dataUrl, config);
    
    setJustSaved(true);
    setTimeout(() => setJustSaved(false), 2500);

    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.8 },
      colors: ['#34d399', '#38bdf8', '#fbbf24', '#ffffff'],
    });
    haptic.success();
  };

  // 1-Click Copy PNG to Clipboard
  const handleCopyClipboard = async () => {
    haptic.selection();
    const dataUrl = await exportStaticPng(config, 512);
    const success = await copyPngToClipboard(dataUrl);
    if (success) {
      setCopiedPng(true);
      setTimeout(() => setCopiedPng(false), 2000);
      haptic.success();
    } else {
      // Show modal preview for manual copy / save on restrictive devices
      setExportModalSrc(dataUrl);
    }
  };

  // Export Animated WebM (for Telegram Video Emoji / Video Sticker)
  const handleExportAnimatedWebm = async () => {
    if (!canvasRef.current || isRecording) return;

    if (!isVideoRecordingSupported()) {
      haptic.warning();
      setIosWarning('Ваш браузер/Webview не поддерживает запись WebM видео напрямую. Скачайте четкий PNG 512×512!');
      return;
    }

    setIsRecording(true);
    setRecordProgress(0);
    haptic.heavy();

    try {
      const blob = await recordAnimatedWebm(canvasRef.current, 2.5, (p) => {
        setRecordProgress(p);
      });

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `animated_${config.character}_emoji.webm`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      // Save static preview to gallery
      const previewUrl = await exportStaticPng(config, 100);
      saveEmojiToGallery(config.character, config.baseShape, previewUrl, config);

      confetti({
        particleCount: 80,
        spread: 80,
        origin: { y: 0.7 },
        colors: ['#34d399', '#38bdf8', '#c084fc', '#ffffff'],
      });
      haptic.success();
    } catch (err: any) {
      console.warn('Recording error fallback', err);
      haptic.warning();
      setIosWarning('Не удалось завершить видеозапись в этом Webview. Используйте экспорт PNG 512×512!');
    } finally {
      setIsRecording(false);
      setRecordProgress(0);
    }
  };

  const resetOffset = () => {
    haptic.light();
    onChangeConfig({
      ...config,
      letterOffsetX: 0,
      letterOffsetY: 0,
      letterRotation: 0,
    });
  };

  return (
    <div className="flex flex-col items-center w-full max-w-sm mx-auto">
      {/* Cyber Bento Stage */}
      <div className="bento-card cyber-frame w-full p-4 relative overflow-hidden">
        <div className="corner-cross tl" />
        <div className="corner-cross tr" />
        <div className="corner-cross bl" />
        <div className="corner-cross br" />

        {/* Header inside stage card */}
        <div className="flex items-center justify-between mb-3 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#34d399] animate-pulse" />
            <span className="font-mono-code text-[11px] font-semibold text-slate-300 uppercase tracking-wider">
              {config.baseShape.startsWith('omnom') ? 'Ам Ням 3D' : config.baseShape} • 60 FPS
            </span>
          </div>

          {(config.letterOffsetX !== 0 || config.letterOffsetY !== 0 || config.letterRotation !== 0) && (
            <button
              onClick={resetOffset}
              className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/5 hover:bg-white/10 text-[10px] text-slate-300 hover:text-white transition-colors border border-white/5"
              title="Сбросить позицию в центр"
            >
              <RotateCcw size={10} className="text-[#34d399]" />
              <span>Центр</span>
            </button>
          )}
        </div>

        {/* Main Canvas with touch-none drag */}
        <div className="relative flex items-center justify-center p-3 rounded-2xl bg-[#090b10] border border-white/5 select-none overflow-hidden">
          {/* Subtle Cyber Grid Background from КАРТОЧКА */}
          <div
            className="absolute inset-0 opacity-15 rounded-2xl pointer-events-none"
            style={{
              backgroundImage: 'radial-gradient(rgba(52, 211, 153, 0.45) 1px, transparent 1px)',
              backgroundSize: '16px 16px',
            }}
          />

          <canvas
            ref={canvasRef}
            width={200}
            height={200}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            className={`w-[195px] h-[195px] touch-none cursor-grab active:cursor-grabbing transition-transform ${
              isDragging ? 'scale-105' : ''
            }`}
          />

          {/* Touch Drag Hint badge */}
          <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded-md bg-black/80 backdrop-blur-md border border-white/10 text-[9px] font-mono-code text-slate-300 flex items-center gap-1 pointer-events-none">
            <Move size={10} className="text-[#34d399]" />
            <span>Тяните букву</span>
          </div>
        </div>

        {/* Warning Toast if WebM not supported */}
        {iosWarning && (
          <div className="mt-3 p-2.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <AlertCircle size={14} className="shrink-0 text-amber-400" />
              <span className="text-[11px] leading-tight">{iosWarning}</span>
            </div>
            <button onClick={() => setIosWarning(null)} className="p-1 hover:text-white">
              <X size={12} />
            </button>
          </div>
        )}

        {/* Export Action Bar */}
        <div className="mt-4 space-y-2">
          {/* WebM Animated recording button */}
          <button
            onClick={handleExportAnimatedWebm}
            disabled={isRecording}
            className={`w-full py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all relative overflow-hidden ${
              isRecording
                ? 'bg-[#15803d]/40 text-[#86efac] border border-[#22c55e]/40'
                : 'bg-gradient-to-r from-[#059669] to-[#10b981] hover:from-[#10b981] hover:to-[#34d399] text-black font-extrabold shadow-lg shadow-[#10b981]/20 active:scale-[0.98]'
            }`}
          >
            {isRecording ? (
              <>
                <div
                  className="absolute inset-y-0 left-0 bg-[#22c55e]/30 transition-all duration-100"
                  style={{ width: `${recordProgress}%` }}
                />
                <Film size={14} className="animate-spin relative z-10" />
                <span className="relative z-10 font-mono-code">
                  Запись VP9 WebM... {recordProgress}%
                </span>
              </>
            ) : (
              <>
                <Film size={14} />
                <span>Скачать анимированный WebM (Telegram)</span>
              </>
            )}
          </button>

          {/* Static PNGs and Copy split buttons */}
          <div className="grid grid-cols-3 gap-1.5">
            <button
              onClick={() => handleExportPng(100)}
              className="py-2 px-1.5 rounded-xl bg-white/5 hover:bg-white/10 active:bg-white/15 border border-white/10 text-white font-medium text-[10.5px] flex items-center justify-center gap-1 transition-all"
              title="100x100 для Telegram Custom Emoji"
            >
              <Download size={12} className="text-[#34d399] shrink-0" />
              <span>Эмодзи 100px</span>
            </button>

            <button
              onClick={() => handleExportPng(512)}
              className="py-2 px-1.5 rounded-xl bg-white/5 hover:bg-white/10 active:bg-white/15 border border-white/10 text-white font-medium text-[10.5px] flex items-center justify-center gap-1 transition-all"
              title="512x512 для Telegram Стикера"
            >
              <Sparkles size={12} className="text-[#38bdf8] shrink-0" />
              <span>Стикер 512px</span>
            </button>

            <button
              onClick={handleCopyClipboard}
              className={`py-2 px-1.5 rounded-xl border font-medium text-[10.5px] flex items-center justify-center gap-1 transition-all ${
                copiedPng
                  ? 'bg-[#34d399]/20 border-[#34d399] text-[#34d399]'
                  : 'bg-white/5 hover:bg-white/10 border-white/10 text-slate-300 hover:text-white'
              }`}
              title="Скопировать PNG в буфер обмена"
            >
              {copiedPng ? <Check size={12} /> : <Copy size={12} />}
              <span>{copiedPng ? 'Скопировано!' : 'Копировать'}</span>
            </button>
          </div>

          {justSaved && (
            <div className="flex items-center justify-center gap-1.5 py-1 text-[11px] font-semibold text-[#34d399] animate-fade-in">
              <Check size={13} />
              <span>Сохранено в «Мою коллекцию»!</span>
            </div>
          )}
        </div>
      </div>

      {/* Fallback Image Modal for mobile preview/long-press save */}
      {exportModalSrc && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bento-card cyber-frame max-w-xs w-full p-4 space-y-3 relative text-center">
            <button
              onClick={() => setExportModalSrc(null)}
              className="absolute top-3 right-3 text-slate-400 hover:text-white"
            >
              <X size={18} />
            </button>
            <h3 className="text-sm font-bold text-white font-mono-code">Ваш готовый стикер</h3>
            <p className="text-[11px] text-slate-400">
              Зажмите картинку пальцем, чтобы сохранить в галерею или поделиться в Telegram:
            </p>
            <div className="p-3 bg-[#090b10] rounded-xl flex justify-center border border-white/5">
              <img src={exportModalSrc} alt="Sticker preview" className="w-36 h-36 object-contain" />
            </div>
            <button
              onClick={() => {
                downloadDataUrl(exportModalSrc, `sticker_${config.character}_512x512.png`);
                setExportModalSrc(null);
              }}
              className="w-full py-2 rounded-xl bg-[#34d399] text-black font-extrabold text-xs"
            >
              Скачать файл
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
