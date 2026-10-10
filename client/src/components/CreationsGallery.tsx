import React, { useState, useEffect } from 'react';
import type { SavedEmoji, EmojiConfig } from '../types';
import { getSavedGallery, removeEmojiFromGallery } from '../utils/galleryStorage';
import { downloadDataUrl } from '../utils/exporter';
import { useTelegram } from '../hooks/useTelegram';
import { CyberText } from './CyberText';
import JSZip from 'jszip';
import confetti from 'canvas-confetti';
import { Download, Trash2, ArrowUpRight, Sparkles, FolderHeart, Archive } from 'lucide-react';

interface Props {
  onLoadConfig: (config: EmojiConfig) => void;
  onOpenStudio: () => void;
}

export const CreationsGallery: React.FC<Props> = ({ onLoadConfig, onOpenStudio }) => {
  const { haptic } = useTelegram();
  const [items, setItems] = useState<SavedEmoji[]>([]);
  const [isZipping, setIsZipping] = useState(false);

  useEffect(() => {
    setItems(getSavedGallery());
  }, []);

  const handleDownload = (item: SavedEmoji) => {
    haptic.medium();
    downloadDataUrl(item.previewUrl, `emoji_${item.character}_${item.id}.png`);
  };

  const handleDelete = (id: string) => {
    haptic.selection();
    const updated = removeEmojiFromGallery(id);
    setItems(updated);
  };

  const handleApply = (item: SavedEmoji) => {
    haptic.success();
    onLoadConfig(item.config);
    onOpenStudio();
  };

  const handleExportAllZip = async () => {
    if (items.length === 0) return;
    setIsZipping(true);
    haptic.heavy();

    try {
      const zip = new JSZip();
      const folder = zip.folder('My_EmojiCraft_Stickers');

      items.forEach((item, idx) => {
        const base64Data = item.previewUrl.replace(/^data:image\/png;base64,/, '');
        const pad = String(idx + 1).padStart(2, '0');
        folder?.file(`${pad}_emoji_${item.character}_${item.baseShape}.png`, base64Data, { base64: true });
      });

      const blob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `EmojiCraft_Collection_${Date.now()}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 },
        colors: ['#34d399', '#38bdf8', '#ffffff'],
      });
      haptic.success();
    } catch (err) {
      console.warn('Zip export failed', err);
    } finally {
      setIsZipping(false);
    }
  };

  return (
    <div className="w-full max-w-sm mx-auto space-y-4 pb-16">
      <div className="bento-card cyber-frame p-4 space-y-3">
        <div className="corner-cross tl" />
        <div className="corner-cross tr" />
        <div className="corner-cross bl" />
        <div className="corner-cross br" />

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <FolderHeart size={14} className="text-[#34d399]" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-300 font-mono-code">
              <CyberText text={`МОЯ КОЛЛЕКЦИЯ (${items.length})`} delay={50} />
            </h2>
          </div>
          {items.length > 0 && (
            <button
              onClick={handleExportAllZip}
              disabled={isZipping}
              className="text-[10px] text-[#34d399] font-mono-code flex items-center gap-1 hover:underline"
            >
              <Archive size={11} />
              <span>{isZipping ? 'Сжатие...' : 'Скачать всё ZIP'}</span>
            </button>
          )}
        </div>

        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center px-4">
            <div className="w-20 h-20 mb-3 relative">
              <img
                src="/omnom/amnumya_010.webp"
                alt="Ам Ням"
                className="w-full h-full object-contain filter drop-shadow-md"
              />
            </div>
            <h3 className="text-sm font-bold text-white mb-1">Коллекция пока пуста</h3>
            <p className="text-[11px] text-slate-400 max-w-[200px] mb-4">
              Создайте и скачайте свой первый эмодзи в Студии — он автоматически появится здесь!
            </p>
            <button
              onClick={() => { haptic.selection(); onOpenStudio(); }}
              className="py-2 px-4 rounded-xl bg-[#34d399] text-black font-extrabold text-xs shadow-lg shadow-[#34d399]/20 flex items-center gap-1.5"
            >
              <Sparkles size={13} />
              <span>Перейти в Студию</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2.5 pt-1">
            {items.map((item) => (
              <div
                key={item.id}
                className="p-3 rounded-2xl bg-[#090b10] border border-white/5 flex flex-col items-center group relative hover:border-[#34d399]/30 transition-all"
              >
                <div className="w-16 h-16 mb-2 flex items-center justify-center relative">
                  <img
                    src={item.previewUrl}
                    alt={item.character}
                    className="w-16 h-16 object-contain filter drop-shadow-md"
                  />
                </div>

                <div className="w-full text-center mb-2">
                  <div className="font-bold text-xs text-white font-mono-code">
                    Символ: {item.character}
                  </div>
                  <div className="text-[9px] text-slate-500 font-mono-code truncate">
                    {item.baseShape}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-1 w-full pt-1 border-t border-white/5">
                  <button
                    onClick={() => handleApply(item)}
                    className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-[#34d399] flex items-center justify-center transition-colors"
                    title="Загрузить в Студию"
                  >
                    <ArrowUpRight size={13} />
                  </button>

                  <button
                    onClick={() => handleDownload(item)}
                    className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white flex items-center justify-center transition-colors"
                    title="Скачать PNG"
                  >
                    <Download size={13} />
                  </button>

                  <button
                    onClick={() => handleDelete(item.id)}
                    className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-rose-400 hover:text-rose-300 flex items-center justify-center transition-colors"
                    title="Удалить"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
