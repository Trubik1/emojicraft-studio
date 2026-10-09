import React, { useState, useEffect } from 'react';
import type { SavedEmoji, EmojiConfig } from '../types';
import { getSavedGallery, removeEmojiFromGallery } from '../utils/galleryStorage';
import { downloadDataUrl } from '../utils/exporter';
import { useTelegram } from '../hooks/useTelegram';
import { Download, Trash2, ArrowUpRight, Sparkles, FolderHeart } from 'lucide-react';

interface Props {
  onLoadConfig: (config: EmojiConfig) => void;
  onOpenStudio: () => void;
}

export const CreationsGallery: React.FC<Props> = ({ onLoadConfig, onOpenStudio }) => {
  const { haptic } = useTelegram();
  const [items, setItems] = useState<SavedEmoji[]>([]);

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
              Моя коллекция ({items.length})
            </h2>
          </div>
          <span className="text-[10px] text-slate-500 font-mono-code">Локальное хранилище</span>
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
                  <div className="text-[9px] text-slate-500 font-mono-code">
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
