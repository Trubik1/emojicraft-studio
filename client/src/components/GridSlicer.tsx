import React, { useState, useRef, useEffect } from 'react';
import { useTelegram } from '../hooks/useTelegram';
import JSZip from 'jszip';
import confetti from 'canvas-confetti';
import { Upload, Grid3X3, Download, Copy, Check, Eye } from 'lucide-react';

interface GridTile {
  index: number;
  row: number;
  col: number;
  dataUrl: string;
}

const PRESET_GRIDS = [
  { id: '2x2', name: '2 × 2 (4 шт)', cols: 2, rows: 2, desc: 'Компактный квадрат' },
  { id: '3x3', name: '3 × 3 (9 шт)', cols: 3, rows: 3, desc: 'Классический баннер' },
  { id: '3x4', name: '3 × 4 (12 шт)', cols: 3, rows: 4, desc: 'Вертикальный постер' },
  { id: '4x2', name: '4 × 2 (8 шт)', cols: 4, rows: 2, desc: 'Широкий баннер' },
];

export const GridSlicer: React.FC = () => {
  const { haptic } = useTelegram();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [selectedGrid, setSelectedGrid] = useState(PRESET_GRIDS[1]); // 3x3 default
  const [tiles, setTiles] = useState<GridTile[]>([]);
  const [isCopied, setIsCopied] = useState(false);
  const [resolution, setResolution] = useState<100 | 512>(100);

  // Load a demo stylish cyber artwork if no image uploaded
  useEffect(() => {
    // Generate a default attractive graphic pattern on load
    const demoCanvas = document.createElement('canvas');
    demoCanvas.width = 600;
    demoCanvas.height = 600;
    const ctx = demoCanvas.getContext('2d');
    if (ctx) {
      // Cosmic gradient
      const grad = ctx.createLinearGradient(0, 0, 600, 600);
      grad.addColorStop(0, '#0f172a');
      grad.addColorStop(0.5, '#4f46e5');
      grad.addColorStop(1, '#ec4899');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 600, 600);

      // Cyber circles
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(300, 300, 200, 0, Math.PI * 2);
      ctx.stroke();

      // Big Glowing Icon
      ctx.font = '140px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('⚡', 300, 270);

      ctx.font = 'bold 38px sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.fillText('EMOJI CRAFT', 300, 400);

      setImageSrc(demoCanvas.toDataURL('image/png'));
    }
  }, []);

  // Slice image whenever imageSrc or grid changes
  useEffect(() => {
    if (!imageSrc) return;
    const img = new Image();
    img.src = imageSrc;
    img.onload = () => {
      sliceImage(img, selectedGrid.cols, selectedGrid.rows, resolution);
    };
  }, [imageSrc, selectedGrid, resolution]);

  const sliceImage = (img: HTMLImageElement, cols: number, rows: number, res: number) => {
    const tileW = img.width / cols;
    const tileH = img.height / rows;
    const newTiles: GridTile[] = [];

    let count = 1;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const offCanvas = document.createElement('canvas');
        offCanvas.width = res;
        offCanvas.height = res;
        const ctx = offCanvas.getContext('2d');

        if (ctx) {
          ctx.drawImage(
            img,
            c * tileW,
            r * tileH,
            tileW,
            tileH,
            0,
            0,
            res,
            res
          );
          newTiles.push({
            index: count++,
            row: r,
            col: c,
            dataUrl: offCanvas.toDataURL('image/png'),
          });
        }
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
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDownloadAllZip = async () => {
    if (tiles.length === 0) return;
    haptic.heavy();

    const zip = new JSZip();
    const folder = zip.folder(`emoji_grid_${selectedGrid.cols}x${selectedGrid.rows}`);

    tiles.forEach((t) => {
      const base64Data = t.dataUrl.replace(/^data:image\/png;base64,/, '');
      folder?.file(`tile_${t.index}_r${t.row + 1}_c${t.col + 1}.png`, base64Data, { base64: true });
    });

    const content = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(content);
    const a = document.createElement('a');
    a.href = url;
    a.download = `emoji_grid_${selectedGrid.cols}x${selectedGrid.rows}.zip`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    confetti({ particleCount: 70, spread: 80, origin: { y: 0.6 } });
    haptic.success();
  };

  const handleCopyGuide = () => {
    haptic.medium();
    setIsCopied(true);
    navigator.clipboard.writeText(
      `Отправляйте эмодзи строго по порядку (1 по ${tiles.length}), перенося строку каждые ${selectedGrid.cols} эмодзи!`
    );
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="w-full max-w-sm mx-auto space-y-5 pb-16">
      
      {/* Upload & Grid Selection Card */}
      <div className="p-5 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl backdrop-blur-md space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
              <Grid3X3 size={16} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Grid Slicer (Эмодзи-пазл)</h3>
              <p className="text-[11px] text-slate-400">Нарезка фото на сетку эмодзи для чата</p>
            </div>
          </div>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="text-xs font-bold text-sky-400 bg-sky-950/80 hover:bg-sky-900 border border-sky-800 px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-all active:scale-95"
          >
            <Upload size={13} />
            <span>Своё фото</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileUpload}
          />
        </div>

        {/* Grid Preset Buttons */}
        <div className="grid grid-cols-2 gap-2">
          {PRESET_GRIDS.map((g) => (
            <button
              key={g.id}
              onClick={() => { haptic.selection(); setSelectedGrid(g); }}
              className={`p-2.5 rounded-xl border text-left transition-all ${
                selectedGrid.id === g.id
                  ? 'bg-purple-950/70 border-purple-500 text-white shadow-md'
                  : 'bg-slate-800/60 border-slate-750 text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className="text-xs font-bold text-slate-100">{g.name}</div>
              <div className="text-[10px] text-slate-400">{g.desc}</div>
            </button>
          ))}
        </div>

        {/* Resolution selector */}
        <div className="flex items-center justify-between pt-1 text-xs text-slate-300">
          <span>Формат плиток:</span>
          <div className="flex gap-1.5">
            <button
              onClick={() => setResolution(100)}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${
                resolution === 100 ? 'bg-sky-500 text-white' : 'bg-slate-800 text-slate-400'
              }`}
            >
              100×100 px (Emoji)
            </button>
            <button
              onClick={() => setResolution(512)}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${
                resolution === 512 ? 'bg-sky-500 text-white' : 'bg-slate-800 text-slate-400'
              }`}
            >
              512×512 px (Sticker)
            </button>
          </div>
        </div>
      </div>

      {/* Sliced Tiles Visual Preview */}
      <div className="p-5 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl backdrop-blur-md space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Eye size={14} className="text-emerald-400" />
            <span>Сетка нарезки ({tiles.length} блоков)</span>
          </span>

          <button
            onClick={handleDownloadAllZip}
            className="text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 px-3.5 py-1.5 rounded-xl flex items-center gap-1.5 shadow-md active:scale-95 transition-all"
          >
            <Download size={13} />
            <span>Скачать все в ZIP</span>
          </button>
        </div>

        {/* Visual Grid Matrix */}
        <div 
          className="grid gap-1.5 p-3 rounded-2xl bg-slate-950 border border-slate-800 mx-auto max-w-[280px]"
          style={{
            gridTemplateColumns: `repeat(${selectedGrid.cols}, minmax(0, 1fr))`,
          }}
        >
          {tiles.map((tile) => (
            <div
              key={tile.index}
              className="relative aspect-square rounded-lg overflow-hidden border border-slate-700/60 group shadow-sm bg-slate-900"
            >
              <img src={tile.dataUrl} alt={`Tile ${tile.index}`} className="w-full h-full object-cover" />
              {/* Tile Order Badge */}
              <div className="absolute top-1 left-1 w-4 h-4 rounded-full bg-black/70 backdrop-blur-sm text-[9px] font-bold text-white flex items-center justify-center">
                {tile.index}
              </div>
            </div>
          ))}
        </div>

        {/* Telegram Chat Simulation guide */}
        <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800/80 space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-200">
            <span>Как отправлять в Telegram:</span>
            <button
              onClick={handleCopyGuide}
              className="flex items-center gap-1 text-[11px] text-sky-400 hover:text-sky-300"
            >
              {isCopied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
              <span>{isCopied ? 'Скопировано!' : 'Копировать'}</span>
            </button>
          </div>
          <p className="text-[11px] leading-relaxed text-slate-400">
            После загрузки пака в Telegram отправляйте эмодзи в одном сообщении подряд:{' '}
            <span className="text-white font-mono font-bold">1-{selectedGrid.cols}</span> в первой строке,{' '}
            <span className="text-white font-mono font-bold">
              {selectedGrid.cols + 1}-{selectedGrid.cols * 2}
            </span>{' '}
            во второй и так далее. Они автоматически соберутся в бесшовный арт!
          </p>
        </div>
      </div>
    </div>
  );
};
