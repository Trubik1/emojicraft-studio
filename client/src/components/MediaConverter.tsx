import React, { useState, useRef, useEffect } from 'react';
import { useTelegram } from '../hooks/useTelegram';
import { recordAnimatedWebm } from '../utils/exporter';
import confetti from 'canvas-confetti';
import { Video, Upload, Film, Type, Play, Pause, Sparkles } from 'lucide-react';

export const MediaConverter: React.FC = () => {
  const { haptic } = useTelegram();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const [videoSrc, setVideoSrc] = useState<string | null>(null);
  const [topText, setTopText] = useState('ШОК');
  const [bottomText, setBottomText] = useState('КОГДА СДЕЛАЛ СТИКЕР');
  const [hasWhiteBorder, setHasWhiteBorder] = useState(true);
  const [isPlaying, setIsPlaying] = useState(true);
  const [resolution, setResolution] = useState<100 | 512>(512);
  const [isRecording, setIsRecording] = useState(false);
  const [recordProgress, setRecordProgress] = useState(0);

  // Default sample animated canvas when no video uploaded
  useEffect(() => {
    // Generate a default animated visual if no video uploaded
    const demoCanvas = document.createElement('canvas');
    demoCanvas.width = 400;
    demoCanvas.height = 400;
    const ctx = demoCanvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#1e1b4b';
      ctx.fillRect(0, 0, 400, 400);
      ctx.font = '80px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('🎬', 200, 200);
    }
  }, []);

  // Animation / Render loop
  useEffect(() => {
    let animId: number;

    const render = () => {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);

          // Draw video frame or placeholder
          if (video && video.readyState >= 2) {
            // Center crop into square
            const minDim = Math.min(video.videoWidth, video.videoHeight);
            const sx = (video.videoWidth - minDim) / 2;
            const sy = (video.videoHeight - minDim) / 2;

            ctx.drawImage(video, sx, sy, minDim, minDim, 0, 0, canvas.width, canvas.height);
          } else {
            // Gradient placeholder
            const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
            grad.addColorStop(0, '#312e81');
            grad.addColorStop(1, '#6366f1');
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            ctx.font = 'bold 32px sans-serif';
            ctx.fillStyle = '#ffffff';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('Загрузите видео или GIF', canvas.width / 2, canvas.height / 2 - 20);
            ctx.font = '18px sans-serif';
            ctx.fillStyle = 'rgba(255,255,255,0.7)';
            ctx.fillText('До 3 сек под стандарт Telegram', canvas.width / 2, canvas.height / 2 + 25);
          }

          // Optional White Sticker Border
          if (hasWhiteBorder) {
            ctx.lineWidth = 14;
            ctx.strokeStyle = '#ffffff';
            ctx.strokeRect(7, 7, canvas.width - 14, canvas.height - 14);
          }

          // Draw Top Meme Text
          if (topText.trim()) {
            ctx.font = '900 36px Impact, sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'top';
            ctx.lineWidth = 6;
            ctx.strokeStyle = '#000000';
            ctx.strokeText(topText.toUpperCase(), canvas.width / 2, 20);
            ctx.fillStyle = '#ffffff';
            ctx.fillText(topText.toUpperCase(), canvas.width / 2, 20);
          }

          // Draw Bottom Meme Text
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
  }, [videoSrc, topText, bottomText, hasWhiteBorder]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    haptic.selection();
    const url = URL.createObjectURL(file);
    setVideoSrc(url);
    setIsPlaying(true);
  };

  const togglePlayback = () => {
    if (!videoRef.current) return;
    haptic.light();
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleExportWebm = async () => {
    if (!canvasRef.current || isRecording) return;
    setIsRecording(true);
    setRecordProgress(0);
    haptic.heavy();

    try {
      const blob = await recordAnimatedWebm(canvasRef.current, 2.8, (p) => {
        setRecordProgress(p);
      });

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `video_sticker_${resolution}x${resolution}.webm`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      confetti({ particleCount: 80, spread: 80, origin: { y: 0.7 } });
      haptic.success();
    } catch (err) {
      console.error(err);
      haptic.warning();
    } finally {
      setIsRecording(false);
      setRecordProgress(0);
    }
  };

  return (
    <div className="w-full max-w-sm mx-auto space-y-5 pb-16">
      
      {/* Top Header Card */}
      <div className="p-5 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl backdrop-blur-md space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Video size={16} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Video & GIF to Sticker</h3>
              <p className="text-[11px] text-slate-400">Конвертер медиа в стикеры и эмодзи</p>
            </div>
          </div>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="text-xs font-bold text-indigo-400 bg-indigo-950/80 hover:bg-indigo-900 border border-indigo-800 px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-all active:scale-95"
          >
            <Upload size={13} />
            <span>Загрузить</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="video/*,image/gif"
            className="hidden"
            onChange={handleFileUpload}
          />
        </div>

        {/* Hidden video element for rendering frames */}
        {videoSrc && (
          <video
            ref={videoRef}
            src={videoSrc}
            playsInline
            loop
            muted
            autoPlay
            className="hidden"
          />
        )}

        {/* Video Canvas Viewport */}
        <div className="relative w-64 h-64 mx-auto rounded-2xl overflow-hidden border border-slate-700/60 shadow-2xl bg-black">
          <canvas
            ref={canvasRef}
            width={400}
            height={400}
            className="w-full h-full object-contain"
          />

          {/* Play/Pause overlay */}
          {videoSrc && (
            <button
              onClick={togglePlayback}
              className="absolute bottom-2 right-2 p-2 rounded-full bg-black/60 backdrop-blur-md text-white hover:bg-black/80 transition-colors"
            >
              {isPlaying ? <Pause size={14} /> : <Play size={14} />}
            </button>
          )}

          {/* Recording overlay */}
          {isRecording && (
            <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-sm flex flex-col items-center justify-center gap-2 z-20">
              <Film className="w-8 h-8 text-indigo-400 animate-spin" />
              <div className="text-xs font-semibold text-white">
                Конвертация WebM: {recordProgress}%
              </div>
            </div>
          )}
        </div>

        {/* Format Selector */}
        <div className="flex items-center justify-between text-xs text-slate-300 pt-1">
          <span>Разрешение:</span>
          <div className="flex gap-1.5">
            <button
              onClick={() => { haptic.selection(); setResolution(512); }}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                resolution === 512 ? 'bg-indigo-600 text-white shadow' : 'bg-slate-800 text-slate-400'
              }`}
            >
              512×512 (Стикер)
            </button>
            <button
              onClick={() => { haptic.selection(); setResolution(100); }}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                resolution === 100 ? 'bg-indigo-600 text-white shadow' : 'bg-slate-800 text-slate-400'
              }`}
            >
              100×100 (Эмодзи)
            </button>
          </div>
        </div>
      </div>

      {/* Meme Text & Sticker Controls */}
      <div className="p-5 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl backdrop-blur-md space-y-3.5">
        <label className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
          <Type size={14} className="text-pink-400" />
          <span>Стикерный текст (Meme Impact)</span>
        </label>

        <div className="space-y-2">
          <div>
            <span className="text-[11px] text-slate-400 block mb-1">Верхняя надпись</span>
            <input
              type="text"
              value={topText}
              onChange={(e) => setTopText(e.target.value)}
              placeholder="ВЕРХНИЙ ТЕКСТ"
              className="w-full py-2 px-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500 font-bold uppercase"
            />
          </div>

          <div>
            <span className="text-[11px] text-slate-400 block mb-1">Нижняя надпись</span>
            <input
              type="text"
              value={bottomText}
              onChange={(e) => setBottomText(e.target.value)}
              placeholder="НИЖНИЙ ТЕКСТ"
              className="w-full py-2 px-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500 font-bold uppercase"
            />
          </div>
        </div>

        {/* White Sticker Outline toggle */}
        <div className="pt-2 border-t border-slate-800">
          <label className="flex items-center justify-between text-xs text-slate-300 cursor-pointer">
            <span className="flex items-center gap-1.5">
              <Sparkles size={13} className="text-emerald-400" />
              <span>Белая стикерная рамка</span>
            </span>
            <input
              type="checkbox"
              checked={hasWhiteBorder}
              onChange={(e) => setHasWhiteBorder(e.target.checked)}
              className="w-4 h-4 rounded accent-indigo-500"
            />
          </label>
        </div>

        {/* Export Button */}
        <button
          onClick={handleExportWebm}
          disabled={isRecording}
          className="w-full mt-3 py-3.5 px-4 rounded-xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:opacity-95 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/25 active:scale-95 transition-all"
        >
          <Film size={15} />
          <span>{isRecording ? 'Конвертация...' : `Экспорт WebM ${resolution}×${resolution} (Telegram)`}</span>
        </button>
      </div>
    </div>
  );
};
