import React, { useState, useRef, useEffect } from 'react';
import { useTelegram } from '../hooks/useTelegram';
import { recordAnimatedWebm, downloadDataUrl, isVideoRecordingSupported, copyPngToClipboard } from '../utils/exporter';
import { CyberText } from './CyberText';
import confetti from 'canvas-confetti';
import { Upload, Film, Type, Sliders, Sparkles, Download, AlertCircle, RotateCcw, Copy, Check, X } from 'lucide-react';

const MEME_PRESETS = [
  { top: 'ШОК', bottom: 'КОГДА СДЕЛАЛ СТИКЕР' },
  { top: 'БАЗА', bottom: 'АМ НЯМ ОДОБРЯЕТ' },
  { top: 'КРИНЖ', bottom: 'УДАЛИ И НЕ ПОЗОРЬСЯ' },
  { top: 'СИГМА', bottom: '100% НАСТОЯЩИЙ ML' },
];

const OMNOM_BADGES = [
  { id: 'none', name: 'Без Ам Няма', icon: '❌', src: null },
  { id: 'classic', name: 'Классик #10', icon: '🟢', src: '/omnom/amnumya_010.webp' },
  { id: 'candy', name: 'С леденцом', icon: '🍬', src: '/omnom/omnom-candy.webp' },
  { id: 'eating', name: 'Кушает', icon: '😋', src: '/omnom/omnom-eating.webp' },
  { id: 'super', name: 'Супергерой', icon: '🦸', src: '/omnom/omnom-super.webp' },
];

export const MediaConverter: React.FC = () => {
  const { haptic } = useTelegram();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const badgeImgRef = useRef<HTMLImageElement | null>(null);

  const [mediaType, setMediaType] = useState<'video' | 'image' | null>(null);
  const [mediaSrc, setMediaSrc] = useState<string | null>(null);
  const [topText, setTopText] = useState('ШОК');
  const [bottomText, setBottomText] = useState('КОГДА СДЕЛАЛ СТИКЕР');
  const [hasWhiteBorder, setHasWhiteBorder] = useState(true);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);
  const [mediaScale, setMediaScale] = useState<number>(1.0);
  const [panX, setPanX] = useState<number>(0);
  const [panY, setPanY] = useState<number>(0);
  const [selectedBadge, setSelectedBadge] = useState<string>('candy');
  
  const resolution = 512;
  const [isRecording, setIsRecording] = useState(false);
  const [recordProgress, setRecordProgress] = useState(0);
  const [exportModalSrc, setExportModalSrc] = useState<string | null>(null);
  const [copiedModal, setCopiedModal] = useState(false);
  const [iosWarning, setIosWarning] = useState<string | null>(null);

  // Preload Om Nom badge
  useEffect(() => {
    const badge = OMNOM_BADGES.find((b) => b.id === selectedBadge);
    if (badge && badge.src) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = badge.src;
      badgeImgRef.current = img;
    } else {
      badgeImgRef.current = null;
    }
  }, [selectedBadge]);

  // File upload handler supporting MP4, WebM, MOV, GIF, PNG, WebP
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    haptic.selection();
    const url = URL.createObjectURL(file);
    setMediaSrc(url);

    if (file.type.startsWith('image/')) {
      setMediaType('image');
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = url;
      img.onload = () => {
        imgRef.current = img;
      };
    } else {
      setMediaType('video');
    }
  };

  // Video playback speed and playsinline sync
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = playbackSpeed;
      videoRef.current.play().catch(() => {});
    }
  }, [playbackSpeed, mediaSrc]);

  // Main canvas render loop (60 FPS)
  useEffect(() => {
    let animId: number;

    const render = () => {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      const img = imgRef.current;
      const badgeImg = badgeImgRef.current;

      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);

          // 1. Draw Media (Video or Image)
          if (mediaType === 'video' && video && video.readyState >= 2) {
            const minDim = Math.min(video.videoWidth, video.videoHeight);
            const sx = (video.videoWidth - minDim) / 2;
            const sy = (video.videoHeight - minDim) / 2;

            ctx.save();
            ctx.translate(canvas.width / 2 + panX, canvas.height / 2 + panY);
            ctx.scale(mediaScale, mediaScale);
            ctx.drawImage(
              video,
              sx,
              sy,
              minDim,
              minDim,
              -canvas.width / 2,
              -canvas.height / 2,
              canvas.width,
              canvas.height
            );
            ctx.restore();
          } else if (mediaType === 'image' && img && img.complete) {
            const minDim = Math.min(img.naturalWidth, img.naturalHeight);
            const sx = (img.naturalWidth - minDim) / 2;
            const sy = (img.naturalHeight - minDim) / 2;

            ctx.save();
            ctx.translate(canvas.width / 2 + panX, canvas.height / 2 + panY);
            ctx.scale(mediaScale, mediaScale);
            ctx.drawImage(
              img,
              sx,
              sy,
              minDim,
              minDim,
              -canvas.width / 2,
              -canvas.height / 2,
              canvas.width,
              canvas.height
            );
            ctx.restore();
          } else {
            // Default Demo visual with Om Nom mascot
            const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
            grad.addColorStop(0, '#090b10');
            grad.addColorStop(1, '#111827');
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Draw cute center badge
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 24px Manrope, sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('Загрузите Видео или Картинку', canvas.width / 2, canvas.height / 2 - 15);

            ctx.fillStyle = '#34d399';
            ctx.font = '14px JetBrains Mono, monospace';
            ctx.fillText('Стандарт Telegram 512×512 • До 3 сек', canvas.width / 2, canvas.height / 2 + 20);
          }

          // 2. White Sticker Border
          if (hasWhiteBorder) {
            ctx.lineWidth = 14;
            ctx.strokeStyle = '#ffffff';
            ctx.strokeRect(7, 7, canvas.width - 14, canvas.height - 14);
          }

          // 3. Om Nom Reaction Corner Badge
          if (badgeImg && badgeImg.complete && badgeImg.naturalWidth > 0) {
            const bSize = 130;
            const bx = canvas.width - bSize - 12;
            const by = canvas.height - bSize - 12;

            // Soft drop shadow
            ctx.save();
            ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
            ctx.shadowBlur = 14;
            ctx.drawImage(badgeImg, bx, by, bSize, bSize);
            ctx.restore();
          }

          // 4. Top Meme Text
          if (topText.trim()) {
            ctx.font = '900 38px Impact, sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'top';
            ctx.lineWidth = 7;
            ctx.strokeStyle = '#000000';
            ctx.strokeText(topText.toUpperCase(), canvas.width / 2, 22);
            ctx.fillStyle = '#ffffff';
            ctx.fillText(topText.toUpperCase(), canvas.width / 2, 22);
          }

          // 5. Bottom Meme Text
          if (bottomText.trim()) {
            ctx.font = '900 36px Impact, sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'bottom';
            ctx.lineWidth = 7;
            ctx.strokeStyle = '#000000';
            ctx.strokeText(bottomText.toUpperCase(), canvas.width / 2, canvas.height - 22);
            ctx.fillStyle = '#ffffff';
            ctx.fillText(bottomText.toUpperCase(), canvas.width / 2, canvas.height - 22);
          }
        }
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [mediaType, topText, bottomText, hasWhiteBorder, mediaScale, panX, panY, selectedBadge]);

  // Export Static PNG Sticker (Always opens Modal for guaranteed save on mobile!)
  const handleExportPng = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    haptic.medium();
    const dataUrl = canvas.toDataURL('image/png');
    
    // Download and open modal
    downloadDataUrl(dataUrl, `meme_sticker_512x512_${Date.now()}.png`);
    setExportModalSrc(dataUrl);

    confetti({
      particleCount: 45,
      spread: 60,
      origin: { y: 0.8 },
      colors: ['#34d399', '#38bdf8', '#ffffff'],
    });
    haptic.success();
  };

  // Export WebM Video Sticker (Telegram 512x512 standard, max 3s)
  const handleExportWebm = async () => {
    const canvas = canvasRef.current;
    if (!canvas || isRecording) return;

    // Immediately create a snapshot PNG in case WebM is unsupported or blocked by Telegram Webview
    const snapshotUrl = canvas.toDataURL('image/png');

    if (!isVideoRecordingSupported()) {
      haptic.warning();
      downloadDataUrl(snapshotUrl, `telegram_sticker_${Date.now()}.png`);
      setExportModalSrc(snapshotUrl);
      setIosWarning('В этом Webview нет записи VP9 WebM. Стикер сгенерирован в PNG 512×512!');
      return;
    }

    setIsRecording(true);
    setRecordProgress(0);
    haptic.heavy();

    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play().catch(() => {});
    }

    try {
      const duration = 2.8; // strict Telegram limit < 3 sec
      const blob = await recordAnimatedWebm(canvas, duration, (p) => {
        setRecordProgress(p);
      });

      const url = URL.createObjectURL(blob);
      downloadDataUrl(url, `telegram_sticker_${Date.now()}.webm`);
      
      // Also open the modal with the snapshot image for mobile long-press
      setExportModalSrc(snapshotUrl);

      confetti({
        particleCount: 70,
        spread: 80,
        origin: { y: 0.7 },
        colors: ['#34d399', '#38bdf8', '#ffffff'],
      });
      haptic.success();
    } catch (err) {
      console.warn('Recording error fallback', err);
      haptic.warning();
      downloadDataUrl(snapshotUrl, `telegram_sticker_${Date.now()}.png`);
      setExportModalSrc(snapshotUrl);
      setIosWarning('Запись видео ограничена браузером. Открыт стикер PNG 512×512!');
    } finally {
      setIsRecording(false);
      setRecordProgress(0);
    }
  };

  const resetFraming = () => {
    haptic.light();
    setMediaScale(1.0);
    setPanX(0);
    setPanY(0);
  };

  return (
    <div className="w-full max-w-sm mx-auto space-y-4 pb-16">
      
      {/* Hidden elements for media sources */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        accept="video/mp4,video/webm,video/quicktime,image/gif,image/png,image/webp"
        className="hidden"
      />
      {mediaSrc && mediaType === 'video' && (
        <video
          ref={videoRef}
          src={mediaSrc}
          autoPlay
          loop
          muted
          playsInline
          className="hidden"
        />
      )}

      {/* Main Preview Card */}
      <div className="bento-card cyber-frame p-4 relative overflow-hidden">
        <div className="corner-cross tl" />
        <div className="corner-cross tr" />
        <div className="corner-cross bl" />
        <div className="corner-cross br" />

        <div className="flex items-center justify-between mb-3 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#34d399] animate-pulse" />
            <span className="font-mono-code text-[11px] font-semibold text-slate-300">
              {resolution}×{resolution} PX • {mediaType ? mediaType.toUpperCase() : 'ГОТОВ К ЗАГРУЗКЕ'}
            </span>
          </div>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#34d399]/15 hover:bg-[#34d399]/25 text-[11px] font-bold text-[#34d399] border border-[#34d399]/30 transition-all"
          >
            <Upload size={12} />
            <span>Выбрать файл</span>
          </button>
        </div>

        {/* Canvas Stage */}
        <div className="relative flex items-center justify-center p-2 rounded-2xl bg-[#090b10] border border-white/5 overflow-hidden">
          <canvas
            ref={canvasRef}
            width={resolution}
            height={resolution}
            className="w-full max-w-[280px] aspect-square rounded-xl object-contain shadow-2xl"
          />
        </div>

        {/* Warning Toast */}
        {iosWarning && (
          <div className="mt-3 p-2.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <AlertCircle size={14} className="shrink-0 text-amber-400" />
              <span className="text-[11px] leading-tight">{iosWarning}</span>
            </div>
            <button onClick={() => setIosWarning(null)} className="p-1 hover:text-white">
              ✕
            </button>
          </div>
        )}

        {/* Action Buttons */}
        <div className="mt-4 space-y-2">
          <button
            onClick={handleExportWebm}
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
                  Конвертация WebM... {recordProgress}%
                </span>
              </>
            ) : (
              <>
                <Film size={14} />
                <span>Экспорт Telegram Стикера (.webm)</span>
              </>
            )}
          </button>

          <button
            onClick={handleExportPng}
            className="w-full py-2.5 px-3 rounded-xl bg-white/5 hover:bg-white/10 active:bg-white/15 border border-white/10 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all"
          >
            <Download size={13} className="text-[#34d399]" />
            <span>Скачать / Сохранить PNG 512×512</span>
          </button>
        </div>
      </div>

      {/* Meme Text Controls & Presets */}
      <div className="bento-card cyber-frame p-4 space-y-3">
        <div className="corner-cross tl" />
        <div className="corner-cross tr" />
        <div className="corner-cross bl" />
        <div className="corner-cross br" />

        <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 font-mono-code">
          <Type size={13} className="text-[#38bdf8]" />
          <CyberText text="МЕМНЫЙ ТЕКСТ И ШАБЛОНЫ" delay={50} />
        </label>

        {/* Quick Meme Presets */}
        <div className="grid grid-cols-2 gap-1.5">
          {MEME_PRESETS.map((p, idx) => (
            <button
              key={idx}
              onClick={() => {
                haptic.selection();
                setTopText(p.top);
                setBottomText(p.bottom);
              }}
              className="p-2 rounded-lg bg-white/[0.03] hover:bg-white/10 border border-white/5 text-left transition-all"
            >
              <div className="text-[10px] font-bold text-[#34d399] font-mono-code">{p.top}</div>
              <div className="text-[9px] text-slate-400 truncate">{p.bottom}</div>
            </button>
          ))}
        </div>

        <div className="space-y-2 pt-1">
          <div>
            <label className="text-[10px] text-slate-400 font-mono-code mb-1 block">Верхний текст</label>
            <input
              type="text"
              value={topText}
              onChange={(e) => setTopText(e.target.value)}
              placeholder="ШОК..."
              className="w-full px-3 py-2 rounded-xl bg-[#090b10] border border-white/10 text-white font-bold text-sm focus:outline-none focus:border-[#34d399]"
            />
          </div>

          <div>
            <label className="text-[10px] text-slate-400 font-mono-code mb-1 block">Нижний текст</label>
            <input
              type="text"
              value={bottomText}
              onChange={(e) => setBottomText(e.target.value)}
              placeholder="КОГДА СДЕЛАЛ СТИКЕР"
              className="w-full px-3 py-2 rounded-xl bg-[#090b10] border border-white/10 text-white font-bold text-sm focus:outline-none focus:border-[#34d399]"
            />
          </div>

          {/* White border toggle */}
          <div className="pt-1 flex items-center justify-between">
            <span className="text-xs text-slate-300 font-medium">Белая стикерная рамка</span>
            <button
              onClick={() => { haptic.selection(); setHasWhiteBorder(!hasWhiteBorder); }}
              className={`px-3 py-1 rounded-full text-xs font-mono-code font-bold transition-all ${
                hasWhiteBorder
                  ? 'bg-[#34d399]/20 text-[#34d399] border border-[#34d399]/40'
                  : 'bg-white/5 text-slate-400 border border-white/5'
              }`}
            >
              {hasWhiteBorder ? 'ВКЛЮЧЕНА' : 'ВЫКЛ'}
            </button>
          </div>
        </div>
      </div>

      {/* Om Nom Reaction Badge Selector */}
      <div className="bento-card cyber-frame p-4 space-y-3">
        <div className="corner-cross tl" />
        <div className="corner-cross tr" />
        <div className="corner-cross bl" />
        <div className="corner-cross br" />

        <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 font-mono-code">
          <Sparkles size={13} className="text-[#34d399]" />
          <CyberText text="СТИКЕР АМ НЯМА В УГЛУ" delay={100} />
        </label>

        <div className="grid grid-cols-3 gap-1.5">
          {OMNOM_BADGES.map((b) => {
            const isSelected = selectedBadge === b.id;
            return (
              <button
                key={b.id}
                onClick={() => { haptic.selection(); setSelectedBadge(b.id); }}
                className={`p-2 rounded-xl border flex flex-col items-center gap-1 transition-all ${
                  isSelected
                    ? 'bg-[#34d399]/15 border-[#34d399] text-white'
                    : 'bg-white/[0.03] border-white/5 text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {b.src ? (
                  <img src={b.src} alt={b.name} className="w-7 h-7 object-contain" />
                ) : (
                  <span className="text-xl">{b.icon}</span>
                )}
                <span className="text-[9px] font-mono-code truncate w-full text-center">{b.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Video Framing, Pan & Speed */}
      <div className="bento-card cyber-frame p-4 space-y-3">
        <div className="corner-cross tl" />
        <div className="corner-cross tr" />
        <div className="corner-cross bl" />
        <div className="corner-cross br" />

        <div className="flex items-center justify-between">
          <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 font-mono-code">
            <Sliders size={13} className="text-[#34d399]" />
            <CyberText text="КАДРИРОВАНИЕ И СКОРОСТЬ" delay={150} />
          </label>

          {(mediaScale !== 1 || panX !== 0 || panY !== 0) && (
            <button
              onClick={resetFraming}
              className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/5 text-[10px] text-slate-300 hover:text-white"
            >
              <RotateCcw size={10} />
              <span>Сброс</span>
            </button>
          )}
        </div>

        {/* Scale Slider */}
        <div className="space-y-1">
          <div className="flex justify-between text-[10px] font-mono-code text-slate-400">
            <span>Масштаб кадра (Zoom)</span>
            <span className="text-[#34d399]">{Math.round(mediaScale * 100)}%</span>
          </div>
          <input
            type="range"
            min={0.5}
            max={2.5}
            step={0.05}
            value={mediaScale}
            onChange={(e) => setMediaScale(Number(e.target.value))}
            className="w-full accent-[#34d399] h-1.5 bg-white/10 rounded-lg cursor-pointer"
          />
        </div>

        {/* Horizontal & Vertical Pan */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          <div className="space-y-1">
            <div className="flex justify-between text-[9px] font-mono-code text-slate-400">
              <span>Сдвиг X</span>
              <span className="text-[#34d399]">{panX}px</span>
            </div>
            <input
              type="range"
              min={-150}
              max={150}
              value={panX}
              onChange={(e) => setPanX(Number(e.target.value))}
              className="w-full accent-[#34d399] h-1.5 bg-white/10 rounded-lg cursor-pointer"
            />
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-[9px] font-mono-code text-slate-400">
              <span>Сдвиг Y</span>
              <span className="text-[#34d399]">{panY}px</span>
            </div>
            <input
              type="range"
              min={-150}
              max={150}
              value={panY}
              onChange={(e) => setPanY(Number(e.target.value))}
              className="w-full accent-[#34d399] h-1.5 bg-white/10 rounded-lg cursor-pointer"
            />
          </div>
        </div>

        {/* Speed buttons */}
        <div className="pt-2">
          <div className="text-[10px] text-slate-400 font-mono-code mb-1.5">Скорость видео (под лимит 3 сек)</div>
          <div className="grid grid-cols-4 gap-1.5">
            {[0.75, 1.0, 1.5, 2.0].map((s) => (
              <button
                key={s}
                onClick={() => { haptic.selection(); setPlaybackSpeed(s); }}
                className={`py-1 rounded-lg text-xs font-mono-code font-bold transition-all ${
                  playbackSpeed === s
                    ? 'bg-[#34d399] text-black'
                    : 'bg-white/5 text-slate-300 hover:bg-white/10 border border-white/5'
                }`}
              >
                {s}×
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Fallback & Result Modal for 100% reliable mobile saving */}
      {exportModalSrc && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bento-card cyber-frame max-w-xs w-full p-4 space-y-3 relative text-center">
            <button
              onClick={() => setExportModalSrc(null)}
              className="absolute top-3 right-3 text-slate-400 hover:text-white"
            >
              <X size={18} />
            </button>
            <h3 className="text-sm font-bold text-white font-mono-code">Ваш стикер готов!</h3>
            <p className="text-[11px] text-slate-400">
              Зажмите картинку пальцем, чтобы сохранить в галерею или скопируйте:
            </p>
            <div className="p-3 bg-[#090b10] rounded-xl flex justify-center border border-white/5">
              <img src={exportModalSrc} alt="Sticker result" className="w-40 h-40 object-contain rounded-lg" />
            </div>
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                onClick={async () => {
                  haptic.selection();
                  if (exportModalSrc) {
                    const ok = await copyPngToClipboard(exportModalSrc);
                    if (ok) {
                      setCopiedModal(true);
                      setTimeout(() => setCopiedModal(false), 2000);
                      haptic.success();
                    }
                  }
                }}
                className={`py-2 rounded-xl border font-bold text-xs flex items-center justify-center gap-1 transition-all ${
                  copiedModal
                    ? 'bg-[#34d399]/20 border-[#34d399] text-[#34d399]'
                    : 'bg-white/10 hover:bg-white/15 border-white/10 text-white'
                }`}
              >
                {copiedModal ? <Check size={12} /> : <Copy size={12} />}
                <span>{copiedModal ? 'Скопировано!' : 'Копировать'}</span>
              </button>
              <button
                onClick={() => {
                  if (exportModalSrc) {
                    downloadDataUrl(exportModalSrc, `meme_sticker_512x512_${Date.now()}.png`);
                  }
                  setExportModalSrc(null);
                }}
                className="py-2 rounded-xl bg-[#34d399] text-black font-extrabold text-xs flex items-center justify-center gap-1"
              >
                <Download size={12} />
                <span>Скачать PNG</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
