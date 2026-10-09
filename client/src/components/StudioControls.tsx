import React from 'react';
import type { EmojiConfig, BaseShape, AnimationType } from '../types';
import { COLOR_PRESETS, FONT_PRESETS, SHAPE_PRESETS, ANIMATION_PRESETS } from '../utils/presets';
import { useTelegram } from '../hooks/useTelegram';
import { Sparkles, Layers, Sliders, Type, Palette, Droplets } from 'lucide-react';

interface Props {
  config: EmojiConfig;
  onChange: (updated: EmojiConfig) => void;
  onOpenBatchModal: () => void;
}

export const StudioControls: React.FC<Props> = ({ config, onChange, onOpenBatchModal }) => {
  const { haptic } = useTelegram();

  const QUICK_CHARS = ['S', 'A', 'M', 'V', 'K', 'D', '7', '👑', '🔥', '❤️'];

  const setConfig = (partial: Partial<EmojiConfig>) => {
    haptic.selection();
    onChange({ ...config, ...partial });
  };

  return (
    <div className="w-full max-w-sm mx-auto space-y-5 pb-12">
      
      {/* 1. Character & Text Input */}
      <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-md shadow-lg space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Type size={14} className="text-sky-400" />
            <span>Символ / Буква</span>
          </label>

          <button
            onClick={() => { haptic.medium(); onOpenBatchModal(); }}
            className="text-[11px] font-bold text-sky-400 bg-sky-950/80 hover:bg-sky-900/80 border border-sky-800/80 px-2.5 py-1 rounded-full flex items-center gap-1 transition-colors"
          >
            <Sparkles size={11} />
            <span>Пакетный алфавит А-Я</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="text"
            maxLength={2}
            value={config.character}
            onChange={(e) => setConfig({ character: e.target.value.toUpperCase() })}
            placeholder="S"
            className="w-16 h-12 text-center text-2xl font-black rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-sky-500 transition-colors"
          />

          {/* Quick preset chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto py-1 scrollbar-none flex-1">
            {QUICK_CHARS.map((char) => (
              <button
                key={char}
                onClick={() => setConfig({ character: char })}
                className={`min-w-9 h-9 px-2 rounded-lg font-bold text-sm transition-all ${
                  config.character === char
                    ? 'bg-sky-500 text-white shadow-md shadow-sky-500/30 scale-105'
                    : 'bg-slate-800/80 text-slate-300 hover:bg-slate-750 border border-slate-700/60'
                }`}
              >
                {char}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 2. Base Shape Picker */}
      <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-md shadow-lg space-y-3">
        <label className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
          <Layers size={14} className="text-pink-400" />
          <span>Базовая форма</span>
        </label>

        <div className="grid grid-cols-3 gap-2">
          {SHAPE_PRESETS.map((shape) => {
            const isSelected = config.baseShape === shape.id;
            return (
              <button
                key={shape.id}
                onClick={() => setConfig({ baseShape: shape.id as BaseShape })}
                className={`flex flex-col items-center justify-center p-2.5 rounded-xl border transition-all text-center ${
                  isSelected
                    ? 'bg-gradient-to-b from-sky-950/80 to-slate-900 border-sky-500 text-white shadow-md'
                    : 'bg-slate-800/60 border-slate-750 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                <span className="text-2xl mb-1">{shape.icon}</span>
                <span className="text-[11px] font-semibold truncate w-full">{shape.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Animation Selector */}
      <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-md shadow-lg space-y-3">
        <label className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
          <Sparkles size={14} className="text-amber-400" />
          <span>Анимационный эффект</span>
        </label>

        <div className="grid grid-cols-2 gap-2">
          {ANIMATION_PRESETS.map((anim) => {
            const isSelected = config.animationType === anim.id;
            return (
              <button
                key={anim.id}
                onClick={() => setConfig({ animationType: anim.id as AnimationType })}
                className={`flex flex-col text-left p-2.5 rounded-xl border transition-all ${
                  isSelected
                    ? 'bg-sky-950/70 border-sky-500 text-white shadow-md'
                    : 'bg-slate-800/60 border-slate-750 text-slate-400 hover:text-slate-200'
                }`}
              >
                <span className="text-xs font-bold text-slate-100">{anim.name}</span>
                <span className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">{anim.desc}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Color & Texture Presets */}
      <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-md shadow-lg space-y-3">
        <label className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
          <Palette size={14} className="text-emerald-400" />
          <span>Стиль и цвет буквы</span>
        </label>

        <div className="grid grid-cols-4 gap-2">
          {COLOR_PRESETS.map((preset) => {
            const isSelected = config.colorPresetId === preset.id;
            return (
              <button
                key={preset.id}
                onClick={() => setConfig({ colorPresetId: preset.id })}
                className={`group flex flex-col items-center gap-1 p-2 rounded-xl border transition-all ${
                  isSelected
                    ? 'bg-slate-800 border-sky-400 ring-2 ring-sky-400/30'
                    : 'bg-slate-800/40 border-slate-750 hover:bg-slate-800'
                }`}
                title={preset.name}
              >
                <div
                  className="w-8 h-8 rounded-full border border-white/20 shadow-inner transition-transform group-hover:scale-105"
                  style={{
                    background: `linear-gradient(135deg, ${preset.gradient[0]}, ${preset.gradient[1]})`,
                    boxShadow: `0 0 10px ${preset.glow}`,
                  }}
                />
                <span className="text-[9px] font-medium text-slate-400 truncate w-full text-center">
                  {preset.name.split(' ')[0]}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 5. Typography & Fine-Tuning */}
      <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-md shadow-lg space-y-3.5">
        <label className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
          <Sliders size={14} className="text-indigo-400" />
          <span>Тонкая настройка</span>
        </label>

        {/* Font selection */}
        <div>
          <span className="text-[11px] text-slate-400 font-medium block mb-1.5">Шрифт</span>
          <div className="grid grid-cols-2 gap-1.5">
            {FONT_PRESETS.map((f) => (
              <button
                key={f.id}
                onClick={() => setConfig({ fontFamily: f.id })}
                className={`py-1.5 px-2.5 rounded-lg text-xs font-bold border truncate transition-all ${
                  config.fontFamily === f.id
                    ? 'bg-indigo-950/80 border-indigo-500 text-white'
                    : 'bg-slate-800/60 border-slate-750 text-slate-400 hover:text-slate-200'
                }`}
                style={{ fontFamily: f.css }}
              >
                {f.name}
              </button>
            ))}
          </div>
        </div>

        {/* Sliders: Size & Rotation */}
        <div className="space-y-2 pt-1">
          <div className="flex justify-between text-xs text-slate-400">
            <span>Размер буквы</span>
            <span className="font-mono text-slate-300">{config.fontSize}%</span>
          </div>
          <input
            type="range"
            min={60}
            max={140}
            value={config.fontSize}
            onChange={(e) => setConfig({ fontSize: Number(e.target.value) })}
            className="w-full accent-sky-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
          />

          <div className="flex justify-between text-xs text-slate-400 pt-1">
            <span>Наклон буквы</span>
            <span className="font-mono text-slate-300">{config.letterRotation}°</span>
          </div>
          <input
            type="range"
            min={-30}
            max={30}
            value={config.letterRotation}
            onChange={(e) => setConfig({ letterRotation: Number(e.target.value) })}
            className="w-full accent-sky-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
          />
        </div>

        {/* Effect Toggles */}
        <div className="pt-2 border-t border-slate-800/80 space-y-2">
          <label className="flex items-center justify-between text-xs text-slate-300 cursor-pointer">
            <span className="flex items-center gap-1.5">
              <Droplets size={13} className="text-pink-400" />
              <span>Стекающие капли (Drip)</span>
            </span>
            <input
              type="checkbox"
              checked={config.hasDrip}
              onChange={(e) => setConfig({ hasDrip: e.target.checked })}
              className="w-4 h-4 rounded accent-sky-500"
            />
          </label>

          <label className="flex items-center justify-between text-xs text-slate-300 cursor-pointer">
            <span className="flex items-center gap-1.5">
              <Sparkles size={13} className="text-amber-400" />
              <span>3D Шариковый глянец (Bevel)</span>
            </span>
            <input
              type="checkbox"
              checked={config.hasGlossyBevel}
              onChange={(e) => setConfig({ hasGlossyBevel: e.target.checked })}
              className="w-4 h-4 rounded accent-sky-500"
            />
          </label>

          <label className="flex items-center justify-between text-xs text-slate-300 cursor-pointer">
            <span className="flex items-center gap-1.5">
              <Sparkles size={13} className="text-cyan-400" />
              <span>Неоновое свечение (Aura)</span>
            </span>
            <input
              type="checkbox"
              checked={config.hasGlow}
              onChange={(e) => setConfig({ hasGlow: e.target.checked })}
              className="w-4 h-4 rounded accent-sky-500"
            />
          </label>
        </div>
      </div>
    </div>
  );
};
