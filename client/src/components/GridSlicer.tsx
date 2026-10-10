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
  { id: '4x2', name: '4 × 2', cols: 4, rows: 2, count: 8, desc: 'Широкий баннер (8 эмодзи)' },
];

export const GridSlicer: React.FC = () => {
  const { haptic } = useTelegram();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [selectedGrid, setSelectedGrid] = useState(PRESET_GRIDS[1]); // 3x3 default
  const [tiles, setTiles] = useState<GridTile[]>([]);
  const [isZipping, setIsZipping] = useState(false);
  const [showChatPreview, setShowChatPreview] = useState(false);
  const [selectedTileModal, setSelectedTileModal] = useState<GridTile | null>(null);
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

  // Slice image whenever imageSrc, grid, or zoom/pan changes
  useEffect(() => {
    if (!imageSrc) return;
    const img = new Image();
    img.src = imageSrc;
    img.onload = () => {
      sliceImage(img, selectedGrid.cols, selectedGrid.rows, imageZoom, panOffsetX, panOffsetY);
    };
  }, [imageSrc, selectedGrid, imageZoom, panOffsetX, panOffsetY]);

  const sliceImage = (
    img: HTMLImageElement,
    cols: number,
    rows: number,
    zoom: number,
    offsetX: number,
    offsetY: number
  ) => {
    // Render source image to an offscreen master canvas with user zoom and pan
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

    const tileW = masterDim / cols;
    const tileH = masterDim / rows;
    const newTiles: GridTile[] = [];

    let count = 1;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
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
          const sendOrder = (rows - 1 - r) * cols + (c + 1);

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
      // Fallback: download directly
      downloadDataUrl(tile.dataUrl, `tile_${tile.index}_step_${tile.sendOrder}.png`);
    }
  };

  // Download entire ZIP with Telegram Reverse Send Order
  const handleDownloadZip = async () => {
    if (tiles.length === 0) return;
    setIsZipping(true);
    haptic.heavy();

    try {
      const zip = new JSZip();
      const folder = zip.folder(`banner_${selectedGrid.id}_emoji_pack`);

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
        `✨ EmojiCraft Studio — Нарезка баннера ${selectedGrid.cols}x${selectedGrid.rows} для Telegram.\n\n` +
        `КАК ПРАВИЛЬНО ОТПРАВЛЯТЬ В ЧАТ:\n` +
        `1. В Telegram новые сообщения появляются снизу.\n` +
        `2. Чтобы постер собрался красиво, отправляйте файлы строго по номерам шагов: 01_шаг -> 02_шаг -> ... -> ${tiles.length}_шаг.\n` +
        `3. Либо загрузите этот пак в @Stickers как кастомные эмодзи!\n`
      );

      const blob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Telegram_Banner_${selectedGrid.id}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

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
              СЕТКА {selectedGrid.cols}×{selectedGrid.rows} ({selectedGrid.count} ПЛИТОК)
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
              gridTemplateColumns: `repeat(${selectedGrid.cols}, minmax(0, 1fr))`,
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
            <span className="font-bold text-white">Кликните любую плитку</span> для быстрого сохранения или скачайте весь ZIP с автоматической нумерацией шагов (<span className="text-[#34d399] font-mono-code">#1 → #{tiles.length}</span>)!
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
            <span>{isZipping ? 'Упаковка ZIP...' : `Скачать ZIP (${tiles.length} шт)`}</span>
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

      {/* Live Telegram Chat Preview Mockup */}
      {showChatPreview && (
        <div className="bento-card cyber-frame p-4 space-y-3">
          <div className="corner-cross tl" />
          <div className="corner-cross tr" />
          <div className="corner-cross bl" />
          <div className="corner-cross br" />

          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 font-mono-code">
            Вид баннера в чате Telegram
          </div>

          <div className="p-3 rounded-xl bg-[#0f172a]/90 border border-white/5 flex justify-end">
            <div className="bg-[#1e293b] rounded-2xl p-2 max-w-[220px] shadow-lg">
              <div
                className="grid gap-0.5 rounded-lg overflow-hidden"
                style={{
                  gridTemplateColumns: `repeat(${selectedGrid.cols}, minmax(0, 1fr))`,
                }}
              >
                {tiles.map((t) => (
                  <img key={t.index} src={t.dataUrl} alt="" className="w-full h-auto block" />
                ))}
              </div>
              <div className="text-right text-[9px] text-slate-400 font-mono-code mt-1 mr-1">
                17:42 ✓✓
              </div>
            </div>
          </div>
        </div>
      )}

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

      {/* Grid Size Selectors */}
      <div className="bento-card cyber-frame p-4 space-y-3">
        <div className="corner-cross tl" />
        <div className="corner-cross tr" />
        <div className="corner-cross bl" />
        <div className="corner-cross br" />

        <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 font-mono-code">
          <Grid3X3 size={13} className="text-[#38bdf8]" />
          <CyberText text="ФОРМАТ СЕТКИ НАРЕЗКИ" delay={140} />
        </label>

        <div className="grid grid-cols-2 gap-2">
          {PRESET_GRIDS.map((g) => {
            const isSelected = selectedGrid.id === g.id;
            return (
              <button
                key={g.id}
                onClick={() => { haptic.selection(); setSelectedGrid(g); }}
                className={`p-2.5 rounded-xl border text-left transition-all ${
                  isSelected
                    ? 'bg-[#34d399]/15 border-[#34d399] text-white shadow-sm'
                    : 'bg-white/[0.03] border-white/5 text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <div className="text-xs font-bold text-white font-mono-code">{g.name}</div>
                <div className="text-[10px] text-slate-400 mt-0.5">{g.desc}</div>
              </button>
            );
          })}
        </div>
      </div>

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
              Тайл #{selectedTileModal.index} • Шаг отправки #{selectedTileModal.sendOrder}
            </h3>
            <p className="text-[11px] text-slate-400">
              Размер 100×100 px. Можно скопировать или скачать отдельно:
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
