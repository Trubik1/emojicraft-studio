import React, { useState, useRef, useEffect } from 'react';
import { useTelegram } from '../hooks/useTelegram';
import { recordAnimatedWebm } from '../utils/exporter';
import confetti from 'canvas-confetti';
import { Upload, Film, Type, Sliders } from 'lucide-react';

export const MediaConverter: React.FC = () => {
  const { haptic } = useTelegram();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);

  const [mediaType, setMediaType] = useState<'video' | 'image' | null>(null);
  const [mediaSrc, setMediaSrc] = useState<string | null>(null);
  const [topText, setTopText] = useState('ШОК');
  const [bottomText, setBottomText] = useState('КОГДА СДЕЛАЛ СТИКЕР');
  const [hasWhiteBorder, setHasWhiteBorder] = useState(true);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);
  const [mediaScale, setMediaScale] = useState<number>(1.0);
  const resolution = 512;
  const [isRecording, setIsRecording] = useState(false);
  const [recordProgress, setRecordProgress] = useState(0);

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
      img.src = url;
      imgRef.current = img;
    } else {
      setMediaType('video');
    }
  };

  // Video playback speed sync
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = playbackSpeed;
    }
  }, [playbackSpeed]);

  // Main canvas render loop
  useEffect(() => {
    let animId: number;

    const render = () => {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      const img = imgRef.current;

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
            ctx.translate(canvas.width / 2, canvas.height / 2);
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
            ctx.translate(canvas.width / 2, canvas.height / 2);
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
            ctx.fillText('Загрузите Видео или GIF', canvas.width / 2, canvas.height / 2 - 15);

            ctx.fillStyle = '#34d399';
            ctx.font = '14px JetBrains Mono, monospace';
            ctx.fillText('Стандарт Telegram • До 3 сек • VP9', canvas.width / 2, canvas.height / 2 + 20);
          }

          // 2. White Sticker Border
          if (hasWhiteBorder) {
            ctx.lineWidth = 14;
            ctx.strokeStyle = '#ffffff';
            ctx.strokeRect(7, 7, canvas.width - 14, canvas.height - 14);
          }

          // 3. Top Meme Text
          if (topText.trim()) {
            ctx.font = '900 36px Impact, sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'top';
            ctx.lineWidth = 6;
            ctx.strokeStyle = '#000000';
            ctx.strokeText(topText.toUpperCase(), canvas.width / 2, 22);
            ctx.fillStyle = '#ffffff';
            ctx.fillText(topText.toUpperCase(), canvas.width / 2, 22);
          }

          // 4. Bottom Meme Text
          if (bottomText.trim()) {
            ctx.font = '900 34px Impact, sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'bottom';
            ctx.lineWidth = 6;
            ctx.strokeStyle = '#000000';
            ctx.strokeText(bottomText.toUpperCase(), canvas.width / 2, canvas.height - 20);
            ctx.fillStyle = '#ffffff';
            ctx.fillText(bottomText.toUpperCase(), canvas.width / 2, canvas.height - 20);
          }
        }
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [mediaType, topText, bottomText, hasWhiteBorder, mediaScale]);

  // Export WebM Video Sticker (Telegram 512x512 standard, max 3s)
  const handleExportWebm = async () => {
    if (!canvasRef.current || isRecording) return;
    setIsRecording(true);
    setRecordProgress(0);
    haptic.heavy();

    // Rewind video to start for seamless loop
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play();
    }

    try {
      const duration = 2.8; // strict Telegram limit < 3 sec
      const blob = await recordAnimatedWebm(canvasRef.current, duration, (p) => {
        setRecordProgress(p);
      });

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `telegram_sticker_${Date.now()}.webm`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      confetti({
        particleCount: 70,
        spread: 80,
        origin: { y: 0.7 },
        colors: ['#34d399', '#38bdf8', '#ffffff'],
      });
      haptic.success();
    } catch (err) {
      console.error('Recording error', err);
      haptic.warning();
    } finally {
      setIsRecording(false);
      setRecordProgress(0);
    }
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
        <div className="relative flex items-center justify-center p-2 rounded-2xl bg-[#090b10] border border-white/5">
          <canvas
            ref={canvasRef}
            width={resolution}
            height={resolution}
            className="w-full max-w-[280px] aspect-square rounded-xl object-contain shadow-2xl"
          />
        </div>

        {/* Action Button */}
        <div className="mt-4">
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
        </div>
      </div>

      {/* Meme Text Controls */}
      <div className="bento-card cyber-frame p-4 space-y-3">
        <div className="corner-cross tl" />
        <div className="corner-cross tr" />
        <div className="corner-cross bl" />
        <div className="corner-cross br" />

        <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 font-mono-code">
          <Type size={13} className="text-[#38bdf8]" />
          <span>Мемный текст и контур</span>
        </label>

        <div className="space-y-2">
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

      {/* Video Framing & Speed */}
      <div className="bento-card cyber-frame p-4 space-y-3">
        <div className="corner-cross tl" />
        <div className="corner-cross tr" />
        <div className="corner-cross bl" />
        <div className="corner-cross br" />

        <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 font-mono-code">
          <Sliders size={13} className="text-[#34d399]" />
          <span>Масштаб и Скорость</span>
        </label>

        {/* Scale Slider */}
        <div className="space-y-1">
          <div className="flex justify-between text-[10px] font-mono-code text-slate-400">
            <span>Масштаб кадра</span>
            <span className="text-[#34d399]">{Math.round(mediaScale * 100)}%</span>
          </div>
          <input
            type="range"
            min={0.6}
            max={2.0}
            step={0.05}
            value={mediaScale}
            onChange={(e) => setMediaScale(Number(e.target.value))}
            className="w-full accent-[#34d399] h-1.5 bg-white/10 rounded-lg cursor-pointer"
          />
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

    </div>
  );
};
