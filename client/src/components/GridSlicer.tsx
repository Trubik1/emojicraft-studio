import React, { useState, useRef, useEffect } from 'react';
import { useTelegram } from '../hooks/useTelegram';
import { downloadDataUrl, copyPngToClipboard } from '../utils/exporter';
import { CyberText } from './CyberText';
import JSZip from 'jszip';
import confetti from 'canvas-confetti';
import { Upload, Grid3X3, Download, Eye, HelpCircle, Copy, Check, X, Sliders } from 'lucide-react';

interface GridTile {
  index: number;
  row: number;
  col: number;
  dataUrl: string;
  sendOrder: number; // Order to send in Telegram (1 = first to send, e.g. bottom-right)
}

const PRESET_GRIDS = [
  { id: '2x2', name: '2 × 2', cols: 2, rows: 2, count: 4, desc: 'Квадрат (4 эмодзи)' },
  { id: '3x3', name: '3 × 3', cols: 3, rows: 3, count: 9, desc: 'Классический баннер (9 эмодзи)' },
  { id: '3x4', name: '3 × 4', cols: 3, rows: 4, count: 12, desc: 'Высокий постер (12 эмодзи)' },
  { id: '4x3', name: '4 × 3', cols: 4, rows: 3, count: 12, desc: 'Широкий постер (12 эмодзи)' },
  { id: '4x4', name: '4 × 4', cols: 4, rows: 4, count: 16, desc: 'Большой квадрат (16 эмодзи)' },
  { id: '5x5', name: '5 × 5', cols: 5, rows: 5, count: 25, desc: 'Гигантский постер (25 эмодзи)' },
];

export const GridSlicer: React.FC = () => {
  const { haptic } = useTelegram();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [imageSrc, setImageSrc] = useState<string | null>(null);
  
  // Custom cols & rows (allows ANY grid 1x1 to 5x5)
  const [cols, setCols] = useState<number>(3);
  const [rows, setRows] = useState<number>(3);

  const [tiles, setTiles] = useState<GridTile[]>([]);
  const [isZipping, setIsZipping] = useState(false);
  const [showChatPreview, setShowChatPreview] = useState(false);
  const [selectedTileModal, setSelectedTileModal] = useState<GridTile | null>(null);
  const [showPackReadyModal, setShowPackReadyModal] = useState(false);
  const [copiedTileIndex, setCopiedTileIndex] = useState<number | null>(null);

  // Pan & Zoom controls for pre-crop
  const [imageZoom, setImageZoom] = useState<number>(1.0);
  const [panOffsetX, setPanOffsetX] = useState<number>(0);
  const [panOffsetY, setPanOffsetY] = useState<number>(0);

  // Generate demo cyber banner if no image uploaded
  useEffect(() => {
    const demoCanvas = document.createElement('canvas');
    demoCanvas.width = 600;
    demoCanvas.height = 600;
    const ctx = demoCanvas.getContext('2d');
    if (ctx) {
      // Cosmic gradient matching Cyber Bento
      const grad = ctx.createLinearGradient(0, 0, 600, 600);
      grad.addColorStop(0, '#08090c');
      grad.addColorStop(0.5, '#064e3b');
      grad.addColorStop(1, '#022c22');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 600, 600);

      // Cyber concentric rings
      ctx.strokeStyle = 'rgba(52, 211, 153, 0.35)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(300, 300, 220, 0, Math.PI * 2);
      ctx.arc(300, 300, 140, 0, Math.PI * 2);
      ctx.stroke();

      // Big Om Nom / Mascot
      const omnomImg = new Image();
      omnomImg.src = '/omnom/amnumya_010.webp';
      omnomImg.onload = () => {
        ctx.drawImage(omnomImg, 200, 140, 200, 200);
        
        ctx.font = '800 38px Manrope, sans-serif';
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.fillText('EMOJICRAFT', 300, 395);

        ctx.font = '16px JetBrains Mono, monospace';
        ctx.fillStyle = '#34d399';
        ctx.fillText('TELEGRAM CHAT BANNER', 300, 440);

        setImageSrc(demoCanvas.toDataURL('image/png'));
      };
      omnomImg.onerror = () => {
        ctx.font = '120px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('🍬', 300, 260);

        ctx.font = '800 36px Manrope, sans-serif';
        ctx.fillStyle = '#ffffff';
        ctx.fillText('EMOJI CRAFT', 300, 390);

        setImageSrc(demoCanvas.toDataURL('image/png'));
      };
    }
  }, []);

  // Slice image whenever imageSrc, cols, rows, or zoom/pan changes
  useEffect(() => {
    if (!imageSrc) return;
    const img = new Image();
    img.src = imageSrc;
    img.onload = () => {
      sliceImage(img, cols, rows, imageZoom, panOffsetX, panOffsetY);
    };
  }, [imageSrc, cols, rows, imageZoom, panOffsetX, panOffsetY]);

  const sliceImage = (
    img: HTMLImageElement,
    numCols: number,
    numRows: number,
    zoom: number,
    offsetX: number,
    offsetY: number
  ) => {
    const masterCanvas = document.createElement('canvas');
    const masterDim = 600;
    masterCanvas.width = masterDim;
    masterCanvas.height = masterDim;
    const mCtx = masterCanvas.getContext('2d');
    if (!mCtx) return;

    mCtx.fillStyle = '#08090c';
    mCtx.fillRect(0, 0, masterDim, masterDim);

    const minDim = Math.min(img.width, img.height);
    const sx = (img.width - minDim) / 2;
    const sy = (img.height - minDim) / 2;

    mCtx.save();
    mCtx.translate(masterDim / 2 + offsetX, masterDim / 2 + offsetY);
    mCtx.scale(zoom, zoom);
    mCtx.drawImage(
      img,
      sx,
      sy,
      minDim,
      minDim,
      -masterDim / 2,
      -masterDim / 2,
      masterDim,
      masterDim
    );
    mCtx.restore();

    const tileW = masterDim / numCols;
    const tileH = masterDim / numRows;
    const newTiles: GridTile[] = [];

    let count = 1;
    for (let r = 0; r < numRows; r++) {
      for (let c = 0; c < numCols; c++) {
        const offCanvas = document.createElement('canvas');
        offCanvas.width = 100; // Telegram custom emoji standard 100x100
        offCanvas.height = 100;
        const ctx = offCanvas.getContext('2d');

        if (ctx) {
          ctx.drawImage(
            masterCanvas,
            c * tileW,
            r * tileH,
            tileW,
            tileH,
            0,
            0,
            100,
            100
          );

          // Telegram displays newest messages AT THE BOTTOM!
          // So to display top-to-bottom, the bottom row must be sent FIRST!
          const sendOrder = (numRows - 1 - r) * numCols + (c + 1);

          newTiles.push({
            index: count,
            row: r,
            col: c,
            dataUrl: offCanvas.toDataURL('image/png'),
            sendOrder,
          });
        }
        count++;
      }
    }

    setTiles(newTiles);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    haptic.selection();
    const reader = new FileReader();
    reader.onload = (event) => {
      if (typeof event.target?.result === 'string') {
        setImageSrc(event.target.result);
        setImageZoom(1.0);
        setPanOffsetX(0);
        setPanOffsetY(0);
      }
    };
    reader.readAsDataURL(file);
  };

  // Copy single tile to clipboard
  const handleCopyTile = async (tile: GridTile) => {
    haptic.selection();
    const ok = await copyPngToClipboard(tile.dataUrl);
    if (ok) {
      setCopiedTileIndex(tile.index);
      setTimeout(() => setCopiedTileIndex(null), 2000);
      haptic.success();
    } else {
      downloadDataUrl(tile.dataUrl, `tile_${tile.index}_step_${tile.sendOrder}.png`);
    }
  };

  // Save all tiles sequentially into device storage/downloads
  const handleSaveAllTilesSequentially = () => {
    haptic.medium();
    const sorted = [...tiles].sort((a, b) => a.sendOrder - b.sendOrder);
    sorted.forEach((t, i) => {
      setTimeout(() => {
        downloadDataUrl(t.dataUrl, `step_${t.sendOrder}_tile_${t.index}.png`);
      }, i * 200);
    });
    haptic.success();
  };

  // Download entire ZIP with Telegram Reverse Send Order
  const handleDownloadZip = async () => {
    if (tiles.length === 0) return;
    setIsZipping(true);
    haptic.heavy();

    try {
      const zip = new JSZip();
      const folder = zip.folder(`banner_${cols}x${rows}_emoji_pack`);

      // Sort tiles by sendOrder (1, 2, 3...)
      const sortedBySendOrder = [...tiles].sort((a, b) => a.sendOrder - b.sendOrder);

      sortedBySendOrder.forEach((t) => {
        const base64Data = t.dataUrl.replace(/^data:image\/png;base64,/, '');
        const padIndex = String(t.sendOrder).padStart(2, '0');
        folder?.file(`${padIndex}_шаг_${t.sendOrder}_тайл_${t.index}.png`, base64Data, { base64: true });
      });

      // Add Readme instruction
      folder?.file(
        'ИНСТРУКЦИЯ_ОТПРАВКИ_В_TELEGRAM.txt',
        `✨ EmojiCraft Studio — Нарезка баннера ${cols}x${rows} для Telegram.\n\n` +
        `КАК ПРАВИЛЬНО ОТПРАВЛЯТЬ В ЧАТ:\n` +
        `1. В Telegram новые сообщения появляются снизу.\n` +
        `2. Чтобы постер собрался красиво, отправляйте файлы строго по номерам шагов: 01_шаг -> 02_шаг -> ... -> ${tiles.length}_шаг.\n` +
        `3. Либо загрузите этот пак в @Stickers как кастомные эмодзи!\n`
      );

      // Generate base64 data url for 100% reliable download inside Telegram Webview
      const base64Zip = await zip.generateAsync({ type: 'base64' });
      const dataUrl = `data:application/zip;base64,${base64Zip}`;
      downloadDataUrl(dataUrl, `Telegram_Banner_${cols}x${rows}.zip`);

      // Open pack modal so user can save tiles individually on mobile
      setShowPackReadyModal(true);

      confetti({
        particleCount: 65,
        spread: 75,
        origin: { y: 0.7 },
        colors: ['#34d399', '#38bdf8', '#ffffff'],
      });
      haptic.success();
    } catch (err) {
      console.error(err);
      haptic.warning();
      setShowPackReadyModal(true);
    } finally {
      setIsZipping(false);
    }
  };

  return (
    <div className="w-full max-w-sm mx-auto space-y-4 pb-16">
      
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        accept="image/*"
        className="hidden"
      />

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
              СЕТКА {cols}×{rows} ({tiles.length} ПЛИТОК)
            </span>
          </div>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#34d399]/15 hover:bg-[#34d399]/25 text-[11px] font-bold text-[#34d399] border border-[#34d399]/30 transition-all"
          >
            <Upload size={12} />
            <span>Загрузить фото</span>
          </button>
        </div>

        {/* Tiles Sliced Grid */}
        <div className="p-3 rounded-2xl bg-[#090b10] border border-white/5 flex items-center justify-center">
          <div
            className="grid gap-1 max-w-[270px] w-full aspect-square"
            style={{
              gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
            }}
          >
            {tiles.map((tile) => (
              <div
                key={tile.index}
                onClick={() => {
                  haptic.selection();
                  setSelectedTileModal(tile);
                }}
                className="relative rounded-lg overflow-hidden border border-white/10 group aspect-square bg-slate-900 cursor-pointer hover:border-[#34d399] transition-all"
                title={`Плитка #${tile.index}. Кликните для сохранения!`}
              >
                <img
                  src={tile.dataUrl}
                  alt={`tile ${tile.index}`}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                />
                {/* Tile Send Order Indicator Badge */}
                <div className="absolute top-1 left-1 px-1 py-0.2 rounded bg-black/80 backdrop-blur-md text-[8px] font-mono-code text-[#34d399] font-bold">
                  #{tile.sendOrder}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Telegram Send Order Guide Banner */}
        <div className="mt-3 p-2.5 rounded-xl bg-white/[0.03] border border-white/5 flex items-start gap-2 text-xs">
          <HelpCircle size={15} className="text-[#34d399] shrink-0 mt-0.5" />
          <div className="text-[11px] text-slate-300 leading-snug">
            <span className="font-bold text-white">Кликните любую плитку</span> для быстрого сохранения или скачайте архив с нумерацией шагов (<span className="text-[#34d399] font-mono-code">#1 → #{tiles.length}</span>)!
          </div>
        </div>

        {/* Actions */}
        <div className="mt-3 flex gap-2">
          <button
            onClick={handleDownloadZip}
            disabled={isZipping || tiles.length === 0}
            className="flex-1 py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 bg-gradient-to-r from-[#059669] to-[#10b981] hover:from-[#10b981] hover:to-[#34d399] text-black font-extrabold shadow-lg shadow-[#10b981]/20 active:scale-[0.98] transition-all"
          >
            <Download size={14} />
            <span>{isZipping ? 'Упаковка ZIP...' : `Скачать все стикеры (${tiles.length})`}</span>
          </button>

          <button
            onClick={() => { haptic.selection(); setShowChatPreview(!showChatPreview); }}
            className={`py-2.5 px-3 rounded-xl font-medium text-xs flex items-center justify-center gap-1.5 border transition-all ${
              showChatPreview
                ? 'bg-[#34d399]/20 text-[#34d399] border-[#34d399]/40'
                : 'bg-white/5 hover:bg-white/10 text-white border-white/10'
            }`}
          >
            <Eye size={14} />
            <span>Чат</span>
          </button>
        </div>
      </div>

      {/* REAL TELEGRAM CHAT BANNER PREVIEW */}
      {showChatPreview && (
        <div className="bento-card cyber-frame p-4 space-y-3">
          <div className="corner-cross tl" />
          <div className="corner-cross tr" />
          <div className="corner-cross bl" />
          <div className="corner-cross br" />

          <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-slate-400 font-mono-code">
            <span>Вид баннера в чате Telegram</span>
            <span className="text-[#34d399]">Без рамок (как в Telegram)</span>
          </div>

          {/* Authentic Telegram Chat Window */}
          <div
            className="rounded-2xl border border-white/10 overflow-hidden shadow-2xl"
            style={{ backgroundColor: '#0f1821' }}
          >
            {/* Real Telegram Chat Header */}
            <div className="px-3 py-2 bg-[#17212b] border-b border-black/20 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="text-slate-400 font-bold">←</span>
                <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-[#059669] to-[#34d399] flex items-center justify-center font-bold text-black text-xs">
                  T
                </div>
                <div>
                  <div className="font-bold text-white text-[12px] leading-tight">Telegram Чат</div>
                  <div className="text-[10px] text-[#6ab2f2] font-mono-code">2 участника</div>
                </div>
              </div>
              <span className="text-slate-400 font-bold">⋮</span>
            </div>

            {/* Real Telegram Wallpaper Area with Free-Floating Sliced Banner */}
            <div
              className="p-4 flex flex-col items-end min-h-[220px] justify-end"
              style={{
                backgroundImage: 'radial-gradient(rgba(255, 255, 255, 0.04) 1px, transparent 1px)',
                backgroundSize: '16px 16px',
              }}
            >
              {/* Previous Chat Bubble */}
              <div className="self-start max-w-[75%] px-3 py-1.5 rounded-2xl rounded-tl-sm bg-[#182533] text-white text-[11px] mb-3 shadow">
                Смотри какой баннер собрал! 👇
                <div className="text-[9px] text-slate-400 text-right mt-0.5">17:41</div>
              </div>

              {/* Free-floating borderless sticker grid (NO speech bubble around it!) */}
              <div className="relative inline-block">
                <div
                  className="grid gap-0 leading-none overflow-hidden rounded-xl shadow-2xl"
                  style={{
                    gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
                    maxWidth: '220px',
                  }}
                >
                  {tiles.map((t) => (
                    <img
                      key={t.index}
                      src={t.dataUrl}
                      alt=""
                      className="w-full h-auto block select-none"
                    />
                  ))}
                </div>

                {/* Floating Translucent Telegram Timestamp Badge */}
                <div className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded-full bg-black/60 backdrop-blur-md text-[9px] font-mono-code text-white flex items-center gap-1">
                  <span>17:42</span>
                  <span className="text-[#34d399]">✓✓</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Dynamic Grid Selector: 3x3, 3x4, 5x5 + CUSTOM STEPPERS */}
      <div className="bento-card cyber-frame p-4 space-y-3">
        <div className="corner-cross tl" />
        <div className="corner-cross tr" />
        <div className="corner-cross bl" />
        <div className="corner-cross br" />

        <div className="flex items-center justify-between">
          <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 font-mono-code">
            <Grid3X3 size={13} className="text-[#38bdf8]" />
            <CyberText text="ФОРМАТ СЕТКИ (3×3, 3×4, 5×5 И ДР.)" delay={140} />
          </label>
          <span className="text-xs font-bold text-[#34d399] font-mono-code">
            Итого: {cols * rows} стикеров
          </span>
        </div>

        {/* Custom Steppers for Columns and Rows */}
        <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5 grid grid-cols-2 gap-3">
          {/* Columns Stepper */}
          <div className="space-y-1">
            <span className="text-[10px] text-slate-400 font-mono-code block">Колонки (ширина)</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => { haptic.selection(); setCols(Math.max(1, cols - 1)); }}
                className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 active:scale-95 flex items-center justify-center font-bold text-white text-base"
              >
                -
              </button>
              <span className="text-sm font-extrabold text-[#34d399] font-mono-code flex-1 text-center">
                {cols}
              </span>
              <button
                onClick={() => { haptic.selection(); setCols(Math.min(5, cols + 1)); }}
                className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 active:scale-95 flex items-center justify-center font-bold text-white text-base"
              >
                +
              </button>
            </div>
          </div>

          {/* Rows Stepper */}
          <div className="space-y-1">
            <span className="text-[10px] text-slate-400 font-mono-code block">Строки (высота)</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => { haptic.selection(); setRows(Math.max(1, rows - 1)); }}
                className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 active:scale-95 flex items-center justify-center font-bold text-white text-base"
              >
                -
              </button>
              <span className="text-sm font-extrabold text-[#34d399] font-mono-code flex-1 text-center">
                {rows}
              </span>
              <button
                onClick={() => { haptic.selection(); setRows(Math.min(5, rows + 1)); }}
                className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 active:scale-95 flex items-center justify-center font-bold text-white text-base"
              >
                +
              </button>
            </div>
          </div>
        </div>

        {/* Quick Presets Grid */}
        <div className="grid grid-cols-3 gap-1.5 pt-1">
          {PRESET_GRIDS.map((g) => {
            const isSelected = cols === g.cols && rows === g.rows;
            return (
              <button
                key={g.id}
                onClick={() => {
                  haptic.selection();
                  setCols(g.cols);
                  setRows(g.rows);
                }}
                className={`p-2 rounded-xl border text-center transition-all ${
                  isSelected
                    ? 'bg-[#34d399]/15 border-[#34d399] text-white shadow-sm'
                    : 'bg-white/[0.03] border-white/5 text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <div className="text-xs font-bold text-white font-mono-code">{g.name}</div>
                <div className="text-[9px] text-[#34d399] mt-0.5">{g.count} шт</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Pan & Zoom Crop Adjuster */}
      <div className="bento-card cyber-frame p-4 space-y-3">
        <div className="corner-cross tl" />
        <div className="corner-cross tr" />
        <div className="corner-cross bl" />
        <div className="corner-cross br" />

        <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 font-mono-code">
          <Sliders size={13} className="text-[#34d399]" />
          <CyberText text="ПОДГОНКА И КАДРИРОВАНИЕ ФОТО" delay={80} />
        </label>

        <div className="space-y-2">
          <div className="space-y-1">
            <div className="flex justify-between text-[10px] font-mono-code text-slate-400">
              <span>Приближение (Zoom)</span>
              <span className="text-[#34d399]">{Math.round(imageZoom * 100)}%</span>
            </div>
            <input
              type="range"
              min={0.6}
              max={2.5}
              step={0.05}
              value={imageZoom}
              onChange={(e) => setImageZoom(Number(e.target.value))}
              className="w-full accent-[#34d399] h-1.5 bg-white/10 rounded-lg cursor-pointer"
            />
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1">
            <div className="space-y-1">
              <div className="flex justify-between text-[9px] font-mono-code text-slate-400">
                <span>Сдвиг X</span>
                <span className="text-[#34d399]">{panOffsetX}px</span>
              </div>
              <input
                type="range"
                min={-150}
                max={150}
                value={panOffsetX}
                onChange={(e) => setPanOffsetX(Number(e.target.value))}
                className="w-full accent-[#34d399] h-1.5 bg-white/10 rounded-lg cursor-pointer"
              />
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-[9px] font-mono-code text-slate-400">
                <span>Сдвиг Y</span>
                <span className="text-[#34d399]">{panOffsetY}px</span>
              </div>
              <input
                type="range"
                min={-150}
                max={150}
                value={panOffsetY}
                onChange={(e) => setPanOffsetY(Number(e.target.value))}
                className="w-full accent-[#34d399] h-1.5 bg-white/10 rounded-lg cursor-pointer"
              />
            </div>
          </div>
        </div>
      </div>

      {/* PACK READY MODAL (Guarantees user can save on mobile!) */}
      {showPackReadyModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bento-card cyber-frame max-w-sm w-full p-4 space-y-3 relative text-center max-h-[85vh] overflow-y-auto">
            <button
              onClick={() => setShowPackReadyModal(false)}
              className="absolute top-3 right-3 text-slate-400 hover:text-white"
            >
              <X size={18} />
            </button>
            <h3 className="text-sm font-bold text-white font-mono-code">
              Готово! Пак из {tiles.length} стикеров
            </h3>
            <p className="text-[11px] text-slate-400">
              На смартфонах в Telegram можно сохранить стикеры в галерею или зажать любой пальцем:
            </p>

            {/* Grid of tiles */}
            <div
              className="grid gap-1 p-2 bg-[#090b10] rounded-xl border border-white/10 max-h-[220px] overflow-y-auto"
              style={{
                gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
              }}
            >
              {tiles.map((t) => (
                <div
                  key={t.index}
                  onClick={() => handleCopyTile(t)}
                  className="relative rounded group cursor-pointer aspect-square bg-slate-900 border border-white/10 hover:border-[#34d399]"
                  title={`Шаг #${t.sendOrder}. Кликните для копирования!`}
                >
                  <img src={t.dataUrl} alt="" className="w-full h-full object-cover rounded" />
                  <div className="absolute top-0.5 left-0.5 px-1 rounded bg-black/80 text-[7px] text-[#34d399] font-mono-code font-bold">
                    #{t.sendOrder}
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-2 pt-1">
              <button
                onClick={handleSaveAllTilesSequentially}
                className="w-full py-2.5 px-3 rounded-xl bg-[#34d399] text-black font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-[#34d399]/20"
              >
                <Download size={14} />
                <span>Сохранить все {tiles.length} плиток по очереди</span>
              </button>

              <button
                onClick={() => setShowPackReadyModal(false)}
                className="w-full py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white font-medium text-xs"
              >
                Закрыть
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Single Tile Inspector Modal */}
      {selectedTileModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bento-card cyber-frame max-w-xs w-full p-4 space-y-3 relative text-center">
            <button
              onClick={() => setSelectedTileModal(null)}
              className="absolute top-3 right-3 text-slate-400 hover:text-white"
            >
              <X size={18} />
            </button>
            <h3 className="text-sm font-bold text-white font-mono-code">
              Тайл #{selectedTileModal.index} • Шаг #{selectedTileModal.sendOrder}
            </h3>
            <p className="text-[11px] text-slate-400">
              Зажмите картинку пальцем, чтобы отправить в чат или сохранить:
            </p>
            <div className="p-3 bg-[#090b10] rounded-xl flex justify-center border border-white/5">
              <img
                src={selectedTileModal.dataUrl}
                alt="tile preview"
                className="w-24 h-24 object-contain rounded-lg shadow-lg border border-white/10"
              />
            </div>
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                onClick={() => handleCopyTile(selectedTileModal)}
                className={`py-2 px-3 rounded-xl border font-bold text-xs flex items-center justify-center gap-1.5 transition-all ${
                  copiedTileIndex === selectedTileModal.index
                    ? 'bg-[#34d399]/20 border-[#34d399] text-[#34d399]'
                    : 'bg-white/5 hover:bg-white/10 border-white/10 text-white'
                }`}
              >
                {copiedTileIndex === selectedTileModal.index ? <Check size={14} /> : <Copy size={14} />}
                <span>{copiedTileIndex === selectedTileModal.index ? 'Скопировано!' : 'Копировать'}</span>
              </button>

              <button
                onClick={() => {
                  downloadDataUrl(
                    selectedTileModal.dataUrl,
                    `tile_${selectedTileModal.index}_step_${selectedTileModal.sendOrder}.png`
                  );
                  setSelectedTileModal(null);
                }}
                className="py-2 px-3 rounded-xl bg-[#34d399] text-black font-extrabold text-xs flex items-center justify-center gap-1.5"
              >
                <Download size={14} />
                <span>Скачать</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
