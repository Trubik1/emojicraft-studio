import React, { useState, useEffect } from 'react';
import { useTelegram } from '../hooks/useTelegram';
import { Search, Code2, Copy, Check, ExternalLink } from 'lucide-react';

interface CustomEmojiData {
  id: string;
  name: string;
  packName: string;
  packUrl: string;
  previewChar: string;
  format: string;
}

const SAMPLE_EMOJIS: CustomEmojiData[] = [
  {
    id: '5368324170671202288',
    name: 'Verified Golden Star ⭐',
    packName: 'PremiumBadges_by_Telegram',
    packUrl: 'https://t.me/addemoji/PremiumBadges_by_Telegram',
    previewChar: '⭐',
    format: 'WEBM (Animated 60 FPS)',
  },
  {
    id: '5427187974360667083',
    name: 'Cyber Neon Flame 🔥',
    packName: 'NeonEffects_v2',
    packUrl: 'https://t.me/addemoji/NeonEffects_v2',
    previewChar: '🔥',
    format: 'WEBM (Animated)',
  },
  {
    id: '5382025700205139049',
    name: 'Royal Crown 3D 👑',
    packName: 'CrownStatus_VIP',
    packUrl: 'https://t.me/addemoji/CrownStatus_VIP',
    previewChar: '👑',
    format: 'TGS (Vector)',
  },
  {
    id: '5213458920198421033',
    name: 'Liquid Pink Balloon (S) 💖',
    packName: 'LetterGlow_Faces',
    packUrl: 'https://t.me/addemoji/LetterGlow_Faces',
    previewChar: '💖',
    format: 'WEBM (Animated)',
  },
];

export const EmojiInspector: React.FC = () => {
  const { haptic } = useTelegram();
  const [query, setQuery] = useState('5368324170671202288');
  const [selectedEmoji, setSelectedEmoji] = useState<CustomEmojiData>(SAMPLE_EMOJIS[0]);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Check URL query parameters for ?id= from bot deep links
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const idParam = params.get('id') || params.get('emoji_id');
    if (idParam) {
      handleSearch(idParam);
    }
  }, []);

  const handleCopy = (text: string, key: string) => {
    haptic.medium();
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleSearch = (rawVal: string) => {
    setQuery(rawVal);

    // Extract numerical ID from tg://emoji?id=... or <tg-emoji emoji-id="..."> or raw numbers
    const match = rawVal.match(/\d{10,25}/);
    const cleaned = match ? match[0] : rawVal.replace(/\D/g, '');

    const found = SAMPLE_EMOJIS.find((e) => e.id === cleaned);
    if (found) {
      setSelectedEmoji(found);
    } else if (cleaned.length >= 8) {
      setSelectedEmoji({
        id: cleaned,
        name: `Custom Emoji #${cleaned.slice(-4)}`,
        packName: `StickerPack_${cleaned.slice(0, 6)}`,
        packUrl: `https://t.me/addemoji/StickerPack_${cleaned.slice(0, 6)}`,
        previewChar: '✨',
        format: 'WEBM (Animated)',
      });
    }
  };

  return (
    <div className="w-full max-w-sm mx-auto space-y-4 pb-16">
      
      {/* Search Input Card */}
      <div className="bento-card cyber-frame p-4 space-y-3">
        <div className="corner-cross tl" />
        <div className="corner-cross tr" />
        <div className="corner-cross bl" />
        <div className="corner-cross br" />

        <div className="flex items-center justify-between">
          <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 font-mono-code">
            <Search size={13} className="text-[#34d399]" />
            <span>Инспектор Custom Emoji ID</span>
          </label>
          <span className="text-[10px] text-[#34d399] font-mono-code">Telegram 8.8+</span>
        </div>

        <div className="relative">
          <input
            type="text"
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Вставьте ID или tg://emoji?id=..."
            className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-[#090b10] border border-white/10 text-white font-mono-code text-xs focus:outline-none focus:border-[#34d399]"
          />
          <Search size={14} className="absolute left-3 top-3 text-slate-500" />
        </div>

        {/* Quick Sample Chips */}
        <div className="pt-1 flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {SAMPLE_EMOJIS.map((e) => (
            <button
              key={e.id}
              onClick={() => { haptic.selection(); handleSearch(e.id); }}
              className={`px-2.5 py-1 rounded-lg text-xs font-mono-code flex items-center gap-1 whitespace-nowrap transition-all ${
                selectedEmoji.id === e.id
                  ? 'bg-[#34d399] text-black font-bold'
                  : 'bg-white/5 text-slate-300 hover:bg-white/10 border border-white/5'
              }`}
            >
              <span>{e.previewChar}</span>
              <span>#{e.id.slice(-4)}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Inspected Emoji Card */}
      <div className="bento-card cyber-frame p-4 space-y-4">
        <div className="corner-cross tl" />
        <div className="corner-cross tr" />
        <div className="corner-cross bl" />
        <div className="corner-cross br" />

        <div className="flex items-start gap-3">
          <div className="w-16 h-16 rounded-2xl bg-[#090b10] border border-white/10 flex items-center justify-center text-3xl shadow-inner shrink-0">
            {selectedEmoji.previewChar}
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-bold text-white truncate">{selectedEmoji.name}</h3>
            <div className="text-[10px] text-slate-400 font-mono-code mt-0.5">{selectedEmoji.format}</div>
            
            <a
              href={selectedEmoji.packUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 mt-1 text-[11px] text-[#34d399] hover:underline font-medium"
            >
              <span>Открыть стикерпак</span>
              <ExternalLink size={10} />
            </a>
          </div>
        </div>

        {/* ID Row */}
        <div className="p-2.5 rounded-xl bg-[#090b10] border border-white/10 flex items-center justify-between">
          <div className="min-w-0 pr-2">
            <div className="text-[9px] text-slate-400 font-mono-code uppercase">Telegram Custom Emoji ID</div>
            <div className="text-xs font-bold text-white font-mono-code truncate select-all">
              {selectedEmoji.id}
            </div>
          </div>
          <button
            onClick={() => handleCopy(selectedEmoji.id, 'id')}
            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-colors shrink-0"
            title="Копировать ID"
          >
            {copiedKey === 'id' ? <Check size={14} className="text-[#34d399]" /> : <Copy size={14} />}
          </button>
        </div>
      </div>

      {/* Code Snippets for Developers */}
      <div className="bento-card cyber-frame p-4 space-y-3">
        <div className="corner-cross tl" />
        <div className="corner-cross tr" />
        <div className="corner-cross bl" />
        <div className="corner-cross br" />

        <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 font-mono-code">
          <Code2 size={13} className="text-[#38bdf8]" />
          <span>Готовый код для ботов & постов</span>
        </label>

        <div className="space-y-2">
          {/* HTML Snippet */}
          <div className="p-2.5 rounded-xl bg-[#090b10] border border-white/10 flex items-center justify-between">
            <div className="min-w-0 pr-2">
              <div className="text-[9px] text-slate-400 font-mono-code">HTML (Telegram Bot API)</div>
              <div className="text-[11px] font-mono-code text-[#34d399] truncate">
                {`<tg-emoji emoji-id="${selectedEmoji.id}">${selectedEmoji.previewChar}</tg-emoji>`}
              </div>
            </div>
            <button
              onClick={() =>
                handleCopy(
                  `<tg-emoji emoji-id="${selectedEmoji.id}">${selectedEmoji.previewChar}</tg-emoji>`,
                  'html'
                )
              }
              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300"
            >
              {copiedKey === 'html' ? <Check size={13} className="text-[#34d399]" /> : <Copy size={13} />}
            </button>
          </div>

          {/* Markdown Snippet */}
          <div className="p-2.5 rounded-xl bg-[#090b10] border border-white/10 flex items-center justify-between">
            <div className="min-w-0 pr-2">
              <div className="text-[9px] text-slate-400 font-mono-code">MarkdownV2 Link</div>
              <div className="text-[11px] font-mono-code text-[#38bdf8] truncate">
                {`[${selectedEmoji.previewChar}](tg://emoji?id=${selectedEmoji.id})`}
              </div>
            </div>
            <button
              onClick={() =>
                handleCopy(
                  `[${selectedEmoji.previewChar}](tg://emoji?id=${selectedEmoji.id})`,
                  'md'
                )
              }
              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300"
            >
              {copiedKey === 'md' ? <Check size={13} className="text-[#34d399]" /> : <Copy size={13} />}
            </button>
          </div>

          {/* Aiogram 3 / Python Snippet */}
          <div className="p-2.5 rounded-xl bg-[#090b10] border border-white/10 flex items-center justify-between">
            <div className="min-w-0 pr-2">
              <div className="text-[9px] text-slate-400 font-mono-code">Python (Aiogram 3 / Telebot)</div>
              <div className="text-[11px] font-mono-code text-[#facc15] truncate">
                {`CustomEmoji(custom_emoji_id="${selectedEmoji.id}")`}
              </div>
            </div>
            <button
              onClick={() =>
                handleCopy(
                  `CustomEmoji(custom_emoji_id="${selectedEmoji.id}")`,
                  'python'
                )
              }
              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300"
            >
              {copiedKey === 'python' ? <Check size={13} className="text-[#34d399]" /> : <Copy size={13} />}
            </button>
          </div>
        </div>
      </div>

    </div>
  );
};
