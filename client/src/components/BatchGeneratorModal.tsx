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
      // Give UI time to update
      await new Promise((r) => setTimeout(r, 15));
    }

    setGeneratedItems(results);
    setIsGenerating(false);
    confetti({ particleCount: 70, spread: 70, origin: { y: 0.6 } });
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="w-full max-w-md max-h-[90vh] bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
              <Sparkles size={16} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Пакетный генератор алфавита</h3>
              <p className="text-[11px] text-slate-400">Создать полный пак в едином стиле</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4 overflow-y-auto flex-1">
          {/* Alphabet Selection */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">Набор символов</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'RU', name: 'Русский (А-Я)', count: '28 букв' },
                { id: 'EN', name: 'English (A-Z)', count: '26 букв' },
                { id: 'NUM', name: 'Цифры (0-9)', count: '10 цифр' },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => { haptic.selection(); setSelectedSet(item.id as any); }}
                  className={`p-2 rounded-xl border text-center transition-all ${
                    selectedSet === item.id
                      ? 'bg-sky-950/80 border-sky-500 text-white font-bold'
                      : 'bg-slate-800/60 border-slate-750 text-slate-400'
                  }`}
                >
                  <div className="text-xs">{item.name}</div>
                  <div className="text-[10px] text-slate-400">{item.count}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Resolution Mode */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">Формат Telegram</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => { haptic.selection(); setResolution(100); }}
                className={`p-2 rounded-xl border text-center transition-all ${
                  resolution === 100
                    ? 'bg-sky-950/80 border-sky-500 text-white font-bold'
                    : 'bg-slate-800/60 border-slate-750 text-slate-400'
                }`}
              >
                <div className="text-xs">Custom Emoji</div>
                <div className="text-[10px] text-slate-400">100×100 px (в текст)</div>
              </button>
              <button
                onClick={() => { haptic.selection(); setResolution(512); }}
                className={`p-2 rounded-xl border text-center transition-all ${
                  resolution === 512
                    ? 'bg-sky-950/80 border-sky-500 text-white font-bold'
                    : 'bg-slate-800/60 border-slate-750 text-slate-400'
                }`}
              >
                <div className="text-xs">Sticker Pack</div>
                <div className="text-[10px] text-slate-400">512×512 px (стикеры)</div>
              </button>
            </div>
          </div>

          {/* Action Trigger */}
          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-sky-500/20 active:scale-95 transition-all"
          >
            {isGenerating ? (
              <>
                <Loader2 size={15} className="animate-spin" />
                <span>Генерация {progress}%...</span>
              </>
            ) : (
              <>
                <Sparkles size={15} />
                <span>Сгенерировать алфавит</span>
              </>
            )}
          </button>

          {/* Progress or Results Grid */}
          {generatedItems.length > 0 && (
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1">
                  <CheckCircle size={14} />
                  <span>Сгенерировано {generatedItems.length} эмодзи</span>
                </span>
                <button
                  onClick={handleDownloadZip}
                  className="text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 px-3 py-1.5 rounded-xl flex items-center gap-1.5 shadow-md transition-all active:scale-95"
                >
                  <Download size={13} />
                  <span>Скачать все в ZIP</span>
                </button>
              </div>

              {/* Thumbnail Gallery */}
              <div className="grid grid-cols-6 gap-2 max-h-48 overflow-y-auto p-2 bg-slate-950/70 rounded-2xl border border-slate-800">
                {generatedItems.map((item) => (
                  <div
                    key={item.char}
                    className="flex flex-col items-center justify-center p-1 rounded-lg bg-slate-900 border border-slate-800 group hover:border-sky-500 transition-colors"
                  >
                    <img src={item.dataUrl} alt={item.char} className="w-10 h-10 object-contain" />
                    <span className="text-[10px] font-mono text-slate-400 mt-0.5">{item.char}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
