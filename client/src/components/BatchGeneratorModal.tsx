import React, { useState } from 'react';
import type { EmojiConfig } from '../types';
import { renderEmojiFrame } from '../utils/canvasRenderer';
import { useTelegram } from '../hooks/useTelegram';
import JSZip from 'jszip';
import confetti from 'canvas-confetti';
import { X, Sparkles, Download, CheckCircle, Loader2 } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  baseConfig: EmojiConfig;
}

const ALPHABETS = {
  RU: 'АБВГДЕЖЗИКЛМНОПРСТУФХЦЧШЩЭЮЯ'.split(''),
  EN: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split(''),
  NUM: '0123456789'.split(''),
};

export const BatchGeneratorModal: React.FC<Props> = ({ isOpen, onClose, baseConfig }) => {
  const { haptic } = useTelegram();
  const [selectedSet, setSelectedSet] = useState<'RU' | 'EN' | 'NUM'>('RU');
  const [resolution, setResolution] = useState<100 | 512>(100);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [generatedItems, setGeneratedItems] = useState<{ char: string; dataUrl: string }[]>([]);

  if (!isOpen) return null;

  const handleGenerate = async () => {
    setIsGenerating(true);
    setProgress(0);
    setGeneratedItems([]);
    haptic.medium();

    const chars = ALPHABETS[selectedSet];
    const results: { char: string; dataUrl: string }[] = [];

    const offscreenCanvas = document.createElement('canvas');
    offscreenCanvas.width = resolution;
    offscreenCanvas.height = resolution;
    const ctx = offscreenCanvas.getContext('2d');
    if (!ctx) return;

    for (let i = 0; i < chars.length; i++) {
      const char = chars[i];
      renderEmojiFrame({
        ctx,
        width: resolution,
        height: resolution,
        time: 0.5,
        config: { ...baseConfig, character: char },
      });

      results.push({
        char,
        dataUrl: offscreenCanvas.toDataURL('image/png'),
      });

      setProgress(Math.round(((i + 1) / chars.length) * 100));
      await new Promise((r) => setTimeout(r, 15));
    }

    setGeneratedItems(results);
    setIsGenerating(false);
    confetti({
      particleCount: 65,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#34d399', '#38bdf8', '#fbbf24'],
    });
    haptic.success();
  };

  const handleDownloadZip = async () => {
    if (generatedItems.length === 0) return;
    haptic.heavy();

    const zip = new JSZip();
    const folderName = `telegram_pack_${selectedSet}_${resolution}px`;
    const folder = zip.folder(folderName);

    generatedItems.forEach((item) => {
      const base64Data = item.dataUrl.replace(/^data:image\/png;base64,/, '');
      folder?.file(`${item.char}_${resolution}x${resolution}.png`, base64Data, { base64: true });
    });

    const content = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(content);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${folderName}.zip`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    haptic.success();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <div className="w-full max-w-sm max-h-[85vh] bento-card cyber-frame bg-[#0d1017] border border-white/10 rounded-3xl shadow-2xl flex flex-col overflow-hidden relative">
        <div className="corner-cross tl" />
        <div className="corner-cross tr" />
        <div className="corner-cross bl" />
        <div className="corner-cross br" />

        {/* Modal Header */}
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-[#34d399]" />
            <h2 className="text-sm font-bold text-white font-mono-code uppercase tracking-wider">
              Пакетный генератор
            </h2>
          </div>
          <button
            onClick={() => { haptic.light(); onClose(); }}
            className="p-1.5 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 space-y-4 overflow-y-auto flex-1">
          {/* Alphabet Selection */}
          <div className="space-y-1.5">
            <label className="text-[10px] text-slate-400 font-mono-code uppercase">Выбор набора</label>
            <div className="grid grid-cols-3 gap-1.5">
              {[
                { id: 'RU', label: 'Русский (А-Я)' },
                { id: 'EN', label: 'English (A-Z)' },
                { id: 'NUM', label: 'Цифры (0-9)' },
              ].map((set) => (
                <button
                  key={set.id}
                  onClick={() => { haptic.selection(); setSelectedSet(set.id as any); }}
                  className={`py-2 px-1 rounded-xl text-xs font-bold font-mono-code border transition-all ${
                    selectedSet === set.id
                      ? 'bg-[#34d399] text-black border-[#34d399]'
                      : 'bg-white/5 text-slate-300 border-white/5 hover:bg-white/10'
                  }`}
                >
                  {set.label}
                </button>
              ))}
            </div>
          </div>

          {/* Resolution Selection */}
          <div className="space-y-1.5">
            <label className="text-[10px] text-slate-400 font-mono-code uppercase">Формат экспорта</label>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                onClick={() => { haptic.selection(); setResolution(100); }}
                className={`py-2 px-2 rounded-xl text-xs font-medium border font-mono-code transition-all ${
                  resolution === 100
                    ? 'bg-[#34d399]/20 text-[#34d399] border-[#34d399]'
                    : 'bg-white/5 text-slate-400 border-white/5'
                }`}
              >
                100×100 px (Custom Emoji)
              </button>

              <button
                onClick={() => { haptic.selection(); setResolution(512); }}
                className={`py-2 px-2 rounded-xl text-xs font-medium border font-mono-code transition-all ${
                  resolution === 512
                    ? 'bg-[#34d399]/20 text-[#34d399] border-[#34d399]'
                    : 'bg-white/5 text-slate-400 border-white/5'
                }`}
              >
                512×512 px (Stickers)
              </button>
            </div>
          </div>

          {/* Action Button */}
          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="w-full py-2.5 px-3 rounded-xl font-extrabold text-xs flex items-center justify-center gap-2 bg-[#34d399] text-black shadow-lg shadow-[#34d399]/20 active:scale-[0.98] transition-all"
          >
            {isGenerating ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                <span className="font-mono-code">Генерация... {progress}%</span>
              </>
            ) : (
              <>
                <Sparkles size={14} />
                <span>Сгенерировать все {ALPHABETS[selectedSet].length} шт</span>
              </>
            )}
          </button>

          {/* Generated Grid Preview */}
          {generatedItems.length > 0 && (
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between text-xs text-slate-300">
                <span className="flex items-center gap-1 font-mono-code text-[#34d399]">
                  <CheckCircle size={13} />
                  Готово ({generatedItems.length} шт)
                </span>
              </div>

              <div className="grid grid-cols-6 gap-1 p-2 rounded-xl bg-black/40 border border-white/5 max-h-36 overflow-y-auto">
                {generatedItems.map((item) => (
                  <div key={item.char} className="p-1 rounded bg-white/5 flex items-center justify-center">
                    <img src={item.dataUrl} alt={item.char} className="w-6 h-6 object-contain" />
                  </div>
                ))}
              </div>

              <button
                onClick={handleDownloadZip}
                className="w-full py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 bg-gradient-to-r from-[#059669] to-[#10b981] text-black shadow-md shadow-[#10b981]/20 active:scale-[0.98] transition-all"
              >
                <Download size={14} />
                <span>Скачать пак в ZIP-архиве</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
