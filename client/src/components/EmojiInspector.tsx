import React, { useState } from 'react';
import { useTelegram } from '../hooks/useTelegram';
import { Search, Code2, Copy, Check, ExternalLink } from 'lucide-react';

interface CustomEmojiData {
  id: string;
  name: string;
  packName: string;
  packUrl: string;
  previewUrl: string;
  format: 'WEBM (Animated)' | 'TGS (Vector)' | 'WEBP (Static)';
  entityType: 'custom_emoji';
}

const SAMPLE_EMOJIS: CustomEmojiData[] = [
  {
    id: '5368324170671202288',
    name: 'Verified Golden Star ⭐',
    packName: 'PremiumBadges_by_Telegram',
    packUrl: 'https://t.me/addemoji/PremiumBadges_by_Telegram',
    previewUrl: '⭐',
    format: 'WEBM (Animated)',
    entityType: 'custom_emoji',
  },
  {
    id: '5427187974360667083',
    name: 'Cyber Neon Flame 🔥',
    packName: 'NeonEffects_v2',
    packUrl: 'https://t.me/addemoji/NeonEffects_v2',
    previewUrl: '🔥',
    format: 'WEBM (Animated)',
    entityType: 'custom_emoji',
  },
  {
    id: '5382025700205139049',
    name: 'Royal Crown 3D 👑',
    packName: 'CrownStatus_VIP',
    packUrl: 'https://t.me/addemoji/CrownStatus_VIP',
    previewUrl: '👑',
    format: 'TGS (Vector)',
    entityType: 'custom_emoji',
  },
  {
    id: '5213458920198421033',
    name: 'Liquid Pink Balloon (S) 💖',
    packName: 'LetterGlow_Faces',
    packUrl: 'https://t.me/addemoji/LetterGlow_Faces',
    previewUrl: '💖',
    format: 'WEBM (Animated)',
    entityType: 'custom_emoji',
  },
];

export const EmojiInspector: React.FC = () => {
  const { haptic } = useTelegram();
  const [query, setQuery] = useState('5368324170671202288');
  const [selectedEmoji, setSelectedEmoji] = useState<CustomEmojiData>(SAMPLE_EMOJIS[0]);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleCopy = (text: string, key: string) => {
    haptic.medium();
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleSearch = (val: string) => {
    setQuery(val);
    const cleaned = val.replace(/\D/g, '');
    const found = SAMPLE_EMOJIS.find(e => e.id === cleaned);
    if (found) {
      setSelectedEmoji(found);
    } else if (cleaned.length >= 8) {
      // Simulate dynamic detection
      setSelectedEmoji({
        id: cleaned,
        name: `Custom Emoji #${cleaned.slice(-4)}`,
        packName: `Pack_${cleaned.slice(0, 6)}`,
        packUrl: `https://t.me/addemoji/Pack_${cleaned.slice(0, 6)}`,
        previewUrl: '✨',
        format: 'WEBM (Animated)',
        entityType: 'custom_emoji',
      });
    }
  };

  return (
    <div className="w-full max-w-sm mx-auto space-y-5 pb-16">
      
      {/* Search & Inspector Input Card */}
      <div className="p-5 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl backdrop-blur-md space-y-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <Search size={16} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Emoji ID Inspector</h3>
            <p className="text-[11px] text-slate-400">Определение ID и метаданных эмодзи</p>
          </div>
        </div>

        <div className="relative">
          <input
            type="text"
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Вставьте ID эмодзи или <tg-emoji>..."
            className="w-full py-2.5 pl-3.5 pr-10 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 font-mono"
          />
          <div className="absolute right-3 top-2.5 text-slate-500">
            <Search size={15} />
          </div>
        </div>

        {/* Quick Sample Chips */}
        <div>
          <span className="text-[11px] font-semibold text-slate-400 block mb-1.5">Примеры популярных эмодзи:</span>
          <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {SAMPLE_EMOJIS.map((e) => (
              <button
                key={e.id}
                onClick={() => { haptic.selection(); setSelectedEmoji(e); setQuery(e.id); }}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs whitespace-nowrap transition-all ${
                  selectedEmoji.id === e.id
                    ? 'bg-amber-950/70 border-amber-500 text-white font-bold shadow-md'
                    : 'bg-slate-800/60 border-slate-750 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <span>{e.previewUrl}</span>
                <span className="text-[11px]">{e.name.split(' ')[0]}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Details & Specs Card */}
      <div className="p-5 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl backdrop-blur-md space-y-4">
        
        {/* Top summary */}
        <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-slate-950 border border-slate-800">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500/20 to-purple-500/20 border border-amber-500/30 flex items-center justify-center text-3xl shadow-inner">
            {selectedEmoji.previewUrl}
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-bold text-white truncate">{selectedEmoji.name}</h4>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-semibold">
                {selectedEmoji.format}
              </span>
              <span className="text-[10px] font-mono text-slate-400">Telegram Premium</span>
            </div>
          </div>
        </div>

        {/* Data Fields */}
        <div className="space-y-2.5 text-xs">
          {/* custom_emoji_id */}
          <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/90 flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-500 block">custom_emoji_id (Int64)</span>
              <span className="font-mono text-amber-300 font-semibold">{selectedEmoji.id}</span>
            </div>
            <button
              onClick={() => handleCopy(selectedEmoji.id, 'id')}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-300 transition-colors"
            >
              {copiedKey === 'id' ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
            </button>
          </div>

          {/* Sticker Pack URL */}
          <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/90 flex items-center justify-between">
            <div className="min-w-0 flex-1 pr-2">
              <span className="text-[10px] uppercase font-bold text-slate-500 block">Оригинальный набор</span>
              <span className="font-mono text-sky-400 font-medium truncate block">{selectedEmoji.packName}</span>
            </div>
            <a
              href={selectedEmoji.packUrl}
              target="_blank"
              rel="noreferrer"
              className="p-1.5 rounded-lg bg-sky-950 border border-sky-800 text-sky-400 hover:text-white transition-colors"
            >
              <ExternalLink size={14} />
            </a>
          </div>
        </div>

        {/* Code Snippets for Developers */}
        <div className="space-y-2 pt-1">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Code2 size={14} className="text-sky-400" />
            <span>Готовый код для ботов</span>
          </label>

          {/* HTML */}
          <div className="relative p-2.5 rounded-xl bg-slate-950 border border-slate-800 font-mono text-[11px] text-slate-300 group">
            <div className="text-[10px] text-slate-500 mb-1 font-bold">HTML Format:</div>
            <code>{`<tg-emoji emoji-id="${selectedEmoji.id}">${selectedEmoji.previewUrl}</tg-emoji>`}</code>
            <button
              onClick={() => handleCopy(`<tg-emoji emoji-id="${selectedEmoji.id}">${selectedEmoji.previewUrl}</tg-emoji>`, 'html')}
              className="absolute right-2 top-2 p-1 rounded-md bg-slate-800 text-slate-400 hover:text-white"
            >
              {copiedKey === 'html' ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
            </button>
          </div>

          {/* Markdown */}
          <div className="relative p-2.5 rounded-xl bg-slate-950 border border-slate-800 font-mono text-[11px] text-slate-300 group">
            <div className="text-[10px] text-slate-500 mb-1 font-bold">Markdown Format:</div>
            <code>{`[${selectedEmoji.previewUrl}](tg://emoji?id=${selectedEmoji.id})`}</code>
            <button
              onClick={() => handleCopy(`[${selectedEmoji.previewUrl}](tg://emoji?id=${selectedEmoji.id})`, 'md')}
              className="absolute right-2 top-2 p-1 rounded-md bg-slate-800 text-slate-400 hover:text-white"
            >
              {copiedKey === 'md' ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
