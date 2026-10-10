import React from 'react';
import type { EmojiConfig, BaseShape, AnimationType } from '../types';
import { COLOR_PRESETS, FONT_PRESETS, SHAPE_PRESETS, ANIMATION_PRESETS } from '../utils/presets';
import { useTelegram } from '../hooks/useTelegram';
import { CyberText } from './CyberText';
import { Sparkles, Layers, Sliders, Type, Palette, Droplets } from 'lucide-react';

interface Props {
  config: EmojiConfig;
  onChange: (updated: EmojiConfig) => void;
  onOpenBatchModal: () => void;
}

export const StudioControls: React.FC<Props> = ({ config, onChange, onOpenBatchModal }) => {
  const { haptic } = useTelegram();

  const QUICK_CHARS = ['S', 'А', 'M', 'Я', '🍬', '👑', '🔥', '💎', '⭐', '7', 'Z', 'X'];

  const setConfig = (partial: Partial<EmojiConfig>) => {
    haptic.selection();
    onChange({ ...config, ...partial });
  };

  return (
    <div className="w-full max-w-sm mx-auto space-y-4 pb-12">
      
      {/* 1. Character & Text Input */}
      <div className="bento-card cyber-frame p-4 space-y-3">
        <div className="corner-cross tl" />
        <div className="corner-cross tr" />
        <div className="corner-cross bl" />
        <div className="corner-cross br" />

        <div className="flex items-center justify-between">
          <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 font-mono-code">
            <Type size={13} className="text-[#34d399]" />
            <CyberText text="СИМВОЛ / БУКВА" delay={50} />
          </label>

          <button
            onClick={() => { haptic.medium(); onOpenBatchModal(); }}
            className="text-[11px] font-bold text-[#34d399] bg-[#34d399]/10 hover:bg-[#34d399]/20 border border-[#34d399]/30 px-2.5 py-1 rounded-full flex items-center gap-1 transition-colors"
          >
            <Sparkles size={11} />
            <span>Алфавит А-Я</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="text"
            maxLength={2}
            value={config.character}
            onChange={(e) => setConfig({ character: e.target.value.toUpperCase() })}
            placeholder="S"
            className="w-14 h-11 text-center text-2xl font-black rounded-xl bg-[#090b10] border border-white/10 text-white focus:outline-none focus:border-[#34d399] transition-colors font-mono-code"
          />

          {/* Quick preset chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto py-1 scrollbar-none flex-1">
            {QUICK_CHARS.map((char) => (
              <button
                key={char}
                onClick={() => setConfig({ character: char })}
                className={`min-w-8 h-8 px-2 rounded-lg font-bold text-xs transition-all ${
                  config.character === char
                    ? 'bg-[#34d399] text-black shadow-md shadow-[#34d399]/30 scale-105'
                    : 'bg-white/5 text-slate-300 hover:bg-white/10 border border-white/5'
                }`}
              >
                {char}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 2. Base Shape Picker (With Real Om Nom Sprites) */}
      <div className="bento-card cyber-frame p-4 space-y-3">
        <div className="corner-cross tl" />
        <div className="corner-cross tr" />
        <div className="corner-cross bl" />
        <div className="corner-cross br" />

        <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 font-mono-code">
          <Layers size={13} className="text-[#38bdf8]" />
          <CyberText text="БАЗОВЫЙ ПЕРСОНАЖ / ФОРМА" delay={120} />
        </label>

        <div className="grid grid-cols-2 gap-2 max-h-[260px] overflow-y-auto pr-1">
          {SHAPE_PRESETS.map((shape) => {
            const isSelected = config.baseShape === shape.id;
            return (
              <button
                key={shape.id}
                onClick={() => setConfig({ baseShape: shape.id as BaseShape })}
                className={`flex items-center gap-2 p-2 rounded-xl border text-left transition-all ${
                  isSelected
                    ? 'bg-[#34d399]/15 border-[#34d399] text-white shadow-sm'
                    : 'bg-white/[0.03] border-white/5 text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {shape.sprite ? (
                  <img
                    src={shape.sprite}
                    alt={shape.name}
                    className="w-7 h-7 object-contain shrink-0 filter drop-shadow-sm"
                  />
                ) : (
                  <span className="text-xl shrink-0">{shape.icon}</span>
                )}
                <div className="truncate min-w-0">
                  <div className="text-[11px] font-bold truncate text-white">{shape.name}</div>
                  <div className="text-[9px] text-slate-400 truncate">{shape.desc}</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Animation Effects */}
      <div className="bento-card cyber-frame p-4 space-y-3">
        <div className="corner-cross tl" />
        <div className="corner-cross tr" />
        <div className="corner-cross bl" />
        <div className="corner-cross br" />

        <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 font-mono-code">
          <Sparkles size={13} className="text-[#fbbf24]" />
          <CyberText text="АНИМАЦИОННЫЙ ЭФФЕКТ" delay={180} />
        </label>

        <div className="grid grid-cols-2 gap-2">
          {ANIMATION_PRESETS.map((anim) => {
            const isSelected = config.animationType === anim.id;
            return (
              <button
                key={anim.id}
                onClick={() => setConfig({ animationType: anim.id as AnimationType })}
                className={`p-2.5 rounded-xl border text-left transition-all ${
                  isSelected
                    ? 'bg-[#34d399]/15 border-[#34d399] text-white shadow-sm'
                    : 'bg-white/[0.03] border-white/5 text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <div className="text-[11px] font-bold text-white">{anim.name}</div>
                <div className="text-[9px] text-slate-400 mt-0.5 line-clamp-1">{anim.desc}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Color & Shader Preset */}
      <div className="bento-card cyber-frame p-4 space-y-3">
        <div className="corner-cross tl" />
        <div className="corner-cross tr" />
        <div className="corner-cross bl" />
        <div className="corner-cross br" />

        <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 font-mono-code">
          <Palette size={13} className="text-[#c084fc]" />
          <CyberText text="ЦВЕТОВАЯ ПАЛИТРА 3D ГЛЯНЦА" delay={240} />
        </label>

        <div className="grid grid-cols-3 gap-2">
          {COLOR_PRESETS.map((color) => {
            const isSelected = config.colorPresetId === color.id;
            return (
              <button
                key={color.id}
                onClick={() => setConfig({ colorPresetId: color.id })}
                className={`flex flex-col items-center p-2 rounded-xl border transition-all ${
                  isSelected
                    ? 'border-[#34d399] bg-[#34d399]/10 shadow-sm'
                    : 'border-white/5 bg-white/[0.02] hover:bg-white/5'
                }`}
              >
                <div
                  className="w-8 h-8 rounded-full mb-1.5 shadow-md flex items-center justify-center border border-white/20"
                  style={{
                    background: `linear-gradient(135deg, ${color.gradient[0]}, ${color.gradient[1]})`,
                    boxShadow: isSelected ? `0 0 12px ${color.glow}` : 'none',
                  }}
                />
                <span className="text-[10px] font-medium text-slate-300 truncate w-full text-center">
                  {color.name}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 5. Toggles & Sliders */}
      <div className="bento-card cyber-frame p-4 space-y-3">
        <div className="corner-cross tl" />
        <div className="corner-cross tr" />
        <div className="corner-cross bl" />
        <div className="corner-cross br" />

        <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 font-mono-code">
          <Sliders size={13} className="text-[#34d399]" />
          <CyberText text="ТОНКАЯ НАСТРОЙКА ЭФФЕКТОВ" delay={300} />
        </label>

        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => setConfig({ hasDrip: !config.hasDrip })}
            className={`flex items-center justify-between p-2.5 rounded-xl border transition-all text-xs ${
              config.hasDrip
                ? 'bg-[#34d399]/15 border-[#34d399] text-white'
                : 'bg-white/[0.03] border-white/5 text-slate-400'
            }`}
          >
            <span className="flex items-center gap-1.5 font-medium">
              <Droplets size={13} className="text-[#38bdf8]" />
              Капли (Drip)
            </span>
            <span className="font-mono-code text-[10px] font-bold">{config.hasDrip ? 'ВКЛ' : 'ВЫКЛ'}</span>
          </button>

          <button
            onClick={() => setConfig({ hasGlow: !config.hasGlow })}
            className={`flex items-center justify-between p-2.5 rounded-xl border transition-all text-xs ${
              config.hasGlow
                ? 'bg-[#34d399]/15 border-[#34d399] text-white'
                : 'bg-white/[0.03] border-white/5 text-slate-400'
            }`}
          >
            <span className="flex items-center gap-1.5 font-medium">
              <Sparkles size={13} className="text-[#fbbf24]" />
              Неон аура
            </span>
            <span className="font-mono-code text-[10px] font-bold">{config.hasGlow ? 'ВКЛ' : 'ВЫКЛ'}</span>
          </button>
        </div>

        {/* Font Family selector */}
        <div className="pt-2">
          <div className="text-[10px] text-slate-400 mb-1 font-mono-code uppercase">Шрифт буквы</div>
          <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {FONT_PRESETS.map((font) => (
              <button
                key={font.id}
                onClick={() => setConfig({ fontFamily: font.id })}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  config.fontFamily === font.id
                    ? 'bg-[#34d399] text-black font-bold'
                    : 'bg-white/5 text-slate-300 border border-white/5 hover:bg-white/10'
                }`}
                style={{ fontFamily: font.css }}
              >
                {font.name}
              </button>
            ))}
          </div>
        </div>

        {/* Size Slider */}
        <div className="space-y-1 pt-1">
          <div className="flex justify-between text-[10px] font-mono-code text-slate-400">
            <span>Размер буквы</span>
            <span className="text-[#34d399]">{config.fontSize}%</span>
          </div>
          <input
            type="range"
            min={60}
            max={140}
            value={config.fontSize}
            onChange={(e) => setConfig({ fontSize: Number(e.target.value) })}
            className="w-full accent-[#34d399] h-1.5 bg-white/10 rounded-lg cursor-pointer"
          />
        </div>

        {/* Rotation Slider */}
        <div className="space-y-1">
          <div className="flex justify-between text-[10px] font-mono-code text-slate-400">
            <span>Наклон буквы</span>
            <span className="text-[#34d399]">{config.letterRotation}°</span>
          </div>
          <input
            type="range"
            min={-35}
            max={35}
            value={config.letterRotation}
            onChange={(e) => setConfig({ letterRotation: Number(e.target.value) })}
            className="w-full accent-[#34d399] h-1.5 bg-white/10 rounded-lg cursor-pointer"
          />
        </div>
      </div>

    </div>
  );
};
