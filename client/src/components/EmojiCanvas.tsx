import React, { useEffect, useRef, useState } from 'react';
import type { EmojiConfig } from '../types';
import { renderEmojiFrame } from '../utils/canvasRenderer';
import { exportStaticPng, downloadDataUrl, recordAnimatedWebm } from '../utils/exporter';
import { useTelegram } from '../hooks/useTelegram';
import confetti from 'canvas-confetti';
import { Download, Film, Sparkles, Move, RefreshCw } from 'lucide-react';

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
  const dragStartRef = useRef<{ x: number; y: number; initialOffsetX: number; initialOffsetY: number } | null>(null);

  // Animation Loop
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

  // Touch & Mouse Dragging for Letter positioning
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
    const dx = (e.clientX - dragStartRef.current.x) * 0.4;
    const dy = (e.clientY - dragStartRef.current.y) * 0.4;
    onChangeConfig({
      ...config,
      letterOffsetX: Math.max(-50, Math.min(50, Math.round(dragStartRef.current.initialOffsetX + dx))),
      letterOffsetY: Math.max(-50, Math.min(50, Math.round(dragStartRef.current.initialOffsetY + dy))),
    });
  };

  const handlePointerUp = () => {
    setIsDragging(false);
    dragStartRef.current = null;
  };

  // Export Static PNG (100x100 for Telegram Emoji or 512x512 for Sticker)
  const handleExportPng = async (res: 100 | 512) => {
    haptic.medium();
    const dataUrl = await exportStaticPng(config, res);
    const suffix = res === 100 ? 'emoji_100x100' : 'sticker_512x512';
    downloadDataUrl(dataUrl, `custom_${config.character}_${suffix}.png`);
    confetti({ particleCount: 50, spread: 60, origin: { y: 0.8 } });
    haptic.success();
  };

  // Export Animated WebM (for Telegram Video Emoji / Video Sticker)
  const handleExportAnimatedWebm = async () => {
    if (!canvasRef.current || isRecording) return;
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

      confetti({ particleCount: 100, spread: 80, origin: { y: 0.7 } });
      haptic.success();
    } catch (err) {
      console.error(err);
      haptic.warning();
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
      {/* Canvas Display Card */}
      <div className="relative p-6 rounded-3xl bg-gradient-to-b from-slate-900/90 to-slate-950 border border-slate-800 shadow-2xl backdrop-blur-xl w-full flex flex-col items-center">
        
        {/* Transparency Checkered Canvas Background */}
        <div 
          className="relative w-64 h-64 rounded-2xl flex items-center justify-center overflow-hidden border border-slate-700/60 shadow-inner select-none cursor-move group"
          style={{
            backgroundImage: `radial-gradient(#334155 1px, transparent 1px), radial-gradient(#334155 1px, #0f172a 1px)`,
            backgroundSize: '16px 16px',
            backgroundPosition: '0 0, 8px 8px',
          }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
        >
          {/* Native High-DPI Canvas */}
          <canvas
            ref={canvasRef}
            width={400}
            height={400}
            className="w-full h-full object-contain pointer-events-none drop-shadow-md"
          />

          {/* Drag Overlay Hint */}
          <div className="absolute bottom-2 left-2 px-2.5 py-1 rounded-full bg-slate-900/80 border border-slate-700/70 text-[11px] text-slate-300 font-medium flex items-center gap-1.5 backdrop-blur-md opacity-80 group-hover:opacity-100 transition-opacity">
            <Move size={12} className="text-sky-400" />
            <span>Тяни букву пальцем</span>
          </div>

          {/* Reset position icon if moved */}
          {(config.letterOffsetX !== 0 || config.letterOffsetY !== 0) && (
            <button
              onClick={(e) => { e.stopPropagation(); resetOffset(); }}
              className="absolute top-2 right-2 p-1.5 rounded-full bg-slate-900/80 border border-slate-700 text-slate-300 hover:text-white transition-colors"
              title="Сбросить позицию"
            >
              <RefreshCw size={13} />
            </button>
          )}

          {/* Recording Progress Bar */}
          {isRecording && (
            <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center gap-3 z-20">
              <Film className="w-8 h-8 text-sky-400 animate-spin" />
              <div className="text-xs font-semibold text-slate-200">
                Запись WebM VP9: {recordProgress}%
              </div>
              <div className="w-40 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-sky-400 to-indigo-500 transition-all duration-100" 
                  style={{ width: `${recordProgress}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-2.5 w-full mt-4">
          <button
            onClick={() => handleExportPng(100)}
            className="flex items-center justify-center gap-2 py-3 px-3 rounded-xl bg-slate-800/90 hover:bg-slate-750 text-slate-100 font-semibold text-xs border border-slate-700 active:scale-95 transition-all shadow-sm"
          >
            <Download size={14} className="text-emerald-400" />
            <span>Emoji PNG (100×100)</span>
          </button>

          <button
            onClick={() => handleExportPng(512)}
            className="flex items-center justify-center gap-2 py-3 px-3 rounded-xl bg-slate-800/90 hover:bg-slate-750 text-slate-100 font-semibold text-xs border border-slate-700 active:scale-95 transition-all shadow-sm"
          >
            <Sparkles size={14} className="text-amber-400" />
            <span>Стикер (512×512)</span>
          </button>

          <button
            onClick={handleExportAnimatedWebm}
            disabled={isRecording}
            className="col-span-2 flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl bg-gradient-to-r from-sky-500 via-indigo-500 to-pink-500 hover:opacity-95 text-white font-bold text-sm shadow-lg shadow-sky-500/20 active:scale-95 transition-all"
          >
            <Film size={16} />
            <span>{isRecording ? 'Рендеринг...' : 'Экспорт Animated WebM (Telegram Video)'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
