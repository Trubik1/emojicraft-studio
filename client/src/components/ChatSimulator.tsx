import React, { useEffect, useRef, useState } from 'react';
import type { EmojiConfig } from '../types';
import { renderEmojiFrame } from '../utils/canvasRenderer';
import { useTelegram } from '../hooks/useTelegram';
import { CyberText } from './CyberText';
import { MessageSquare, Moon, Sun, CheckCheck, Send, Smile, Sparkles } from 'lucide-react';

interface Props {
  config: EmojiConfig;
}

interface ChatMessage {
  id: string;
  sender: 'other' | 'me';
  type: 'sticker' | 'text';
  text?: string;
  time: string;
  hasCustomEmoji?: boolean;
}

export const ChatSimulator: React.FC<Props> = ({ config }) => {
  const { user, haptic } = useTelegram();
  const [isLightMode, setIsLightMode] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'sticker' | 'text'>('all');
  const [stickerTapped, setStickerTapped] = useState(false);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      sender: 'other',
      type: 'text',
      text: 'Привет! Отправь новый стикер с Ам Нямом! 🔥',
      time: '17:44',
    },
    {
      id: '2',
      sender: 'me',
      type: 'sticker',
      time: '17:45',
    },
    {
      id: '3',
      sender: 'me',
      type: 'text',
      text: 'Держи! Сделано в EmojiCraft Studio',
      time: '17:46',
      hasCustomEmoji: true,
    },
  ]);

  const statusCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const textCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const stickerCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const reactionCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);

  const displayName = user?.first_name || 'Артём';
  const displayUsername = user?.username ? `@${user.username}` : '@Trubik1';

  useEffect(() => {
    let startTime = performance.now();

    const loop = (currentTime: number) => {
      const elapsed = (currentTime - startTime) / 1000;

      [statusCanvasRef, textCanvasRef, stickerCanvasRef, reactionCanvasRef].forEach((ref) => {
        const c = ref.current;
        if (c) {
          const ctx = c.getContext('2d');
          if (ctx) {
            renderEmojiFrame({
              ctx,
              width: c.width,
              height: c.height,
              time: elapsed,
              config,
            });
          }
        }
      });

      animFrameRef.current = requestAnimationFrame(loop);
    };

    animFrameRef.current = requestAnimationFrame(loop);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [config]);

  const handleSendMessage = () => {
    if (!inputValue.trim()) return;
    haptic.selection();

    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    setMessages((prev) => [
      ...prev,
      {
        id: String(Date.now()),
        sender: 'me',
        type: 'text',
        text: inputValue.trim(),
        time: timeStr,
        hasCustomEmoji: true,
      },
    ]);
    setInputValue('');
  };

  const handleSendSticker = () => {
    haptic.medium();
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    setMessages((prev) => [
      ...prev,
      {
        id: String(Date.now()),
        sender: 'me',
        type: 'sticker',
        time: timeStr,
      },
    ]);
  };

  return (
    <div className="w-full max-w-sm mx-auto space-y-4 pb-16">
      
      {/* Top Header & Theme Toggle */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-1.5 text-xs font-bold font-mono-code text-slate-300">
          <MessageSquare size={13} className="text-[#34d399]" />
          <CyberText text="СИМУЛЯТОР TELEGRAM" delay={50} />
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => { haptic.selection(); setIsLightMode(!isLightMode); }}
            className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-[11px] font-mono-code font-semibold text-slate-400 hover:text-white transition-colors"
          >
            {isLightMode ? <Moon size={11} /> : <Sun size={11} />}
            <span>{isLightMode ? 'Тёмная' : 'Светлая'}</span>
          </button>
        </div>
      </div>

      {/* Mode Filter Pills */}
      <div className="grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-white/[0.03] border border-white/5">
        <button
          onClick={() => { haptic.selection(); setActiveTab('all'); }}
          className={`py-1.5 px-2 rounded-lg text-[11px] font-mono-code font-bold transition-all text-center ${
            activeTab === 'all'
              ? 'bg-[#34d399]/20 text-[#34d399] border border-[#34d399]/40'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Все форматы
        </button>
        <button
          onClick={() => { haptic.selection(); setActiveTab('sticker'); }}
          className={`py-1.5 px-2 rounded-lg text-[11px] font-mono-code font-bold transition-all text-center ${
            activeTab === 'sticker'
              ? 'bg-[#34d399]/20 text-[#34d399] border border-[#34d399]/40'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Только стикер
        </button>
        <button
          onClick={() => { haptic.selection(); setActiveTab('text'); }}
          className={`py-1.5 px-2 rounded-lg text-[11px] font-mono-code font-bold transition-all text-center ${
            activeTab === 'text'
              ? 'bg-[#34d399]/20 text-[#34d399] border border-[#34d399]/40'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          В сообщении
        </button>
      </div>

      {/* Simulated Authentic Telegram Mobile Screen */}
      <div
        className={`bento-card cyber-frame transition-colors duration-200 select-none overflow-hidden relative flex flex-col justify-between ${
          isLightMode
            ? 'border-slate-300 text-slate-900 shadow-xl'
            : 'border-white/10 text-slate-100 shadow-2xl'
        }`}
        style={{
          minHeight: '460px',
          backgroundColor: isLightMode ? '#93adc2' : '#0e1621',
        }}
      >
        <div className="corner-cross tl" />
        <div className="corner-cross tr" />
        <div className="corner-cross bl" />
        <div className="corner-cross br" />

        {/* Authentic Telegram Top Bar */}
        <div
          className={`px-3 py-2.5 flex items-center justify-between border-b ${
            isLightMode
              ? 'bg-[#527e9f] border-black/10 text-white'
              : 'bg-[#17212b] border-white/5 text-white'
          }`}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="text-white/80 font-bold text-sm cursor-pointer hover:text-white">←</span>
            
            {/* User Avatar */}
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-[#059669] to-[#34d399] flex items-center justify-center font-bold text-black shadow text-sm flex-shrink-0">
              {displayName[0]}
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-xs truncate text-white">{displayName}</span>
                
                {/* Premium Custom Status Badge in Title */}
                <div className="w-4 h-4 flex-shrink-0 relative">
                  <canvas
                    ref={statusCanvasRef}
                    width={32}
                    height={32}
                    className="w-4 h-4 object-contain"
                  />
                </div>
              </div>
              <p className="text-[10px] text-[#34d399] font-mono-code leading-none">
                в сети <span className="text-white/40">• {displayUsername}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-white/70 text-xs font-bold font-mono-code">
            <span className="cursor-pointer hover:text-white">⋮</span>
          </div>
        </div>

        {/* Telegram Chat Wallpaper Stream */}
        <div
          className="p-3 flex-1 flex flex-col space-y-3 overflow-y-auto max-h-[320px]"
          style={{
            backgroundImage: isLightMode
              ? 'radial-gradient(rgba(0, 0, 0, 0.06) 1px, transparent 1px)'
              : 'radial-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px)',
            backgroundSize: '16px 16px',
          }}
        >
          {/* Day Separator Badge */}
          <div className="flex justify-center">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono-code bg-black/30 backdrop-blur-md text-white/80">
              Сегодня
            </span>
          </div>

          {/* Render Messages */}
          {messages
            .filter((m) => {
              if (activeTab === 'sticker') return m.type === 'sticker';
              if (activeTab === 'text') return m.type === 'text';
              return true;
            })
            .map((m) => {
              const isMe = m.sender === 'me';

              // 1. STANDALONE STICKER RENDERING (NO BUBBLE! BORDERLESS FLOATING ON WALLPAPER)
              if (m.type === 'sticker') {
                return (
                  <div
                    key={m.id}
                    className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} my-1 animate-fade-in`}
                  >
                    <div
                      onClick={() => {
                        haptic.medium();
                        setStickerTapped(true);
                        setTimeout(() => setStickerTapped(false), 300);
                      }}
                      className={`relative group cursor-pointer transition-transform duration-150 ${
                        stickerTapped ? 'scale-105' : 'hover:scale-[1.02]'
                      }`}
                      title="Нажмите на стикер для анимации"
                    >
                      {/* Authentic Floating Telegram Sticker - 150x150 */}
                      <div className="w-36 h-36 relative flex items-center justify-center filter drop-shadow-[0_8px_16px_rgba(0,0,0,0.35)]">
                        <canvas
                          ref={stickerCanvasRef}
                          width={200}
                          height={200}
                          className="w-full h-full object-contain"
                        />
                      </div>

                      {/* Authentic Floating Telegram Pill Timestamp Badge (Translucent & Borderless) */}
                      <div className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded-full bg-black/55 backdrop-blur-md text-[9px] font-mono-code text-white flex items-center gap-1 shadow">
                        <span>{m.time}</span>
                        <CheckCheck size={11} className="text-[#34d399]" />
                      </div>
                    </div>
                  </div>
                );
              }

              // 2. TEXT MESSAGE RENDERING (TELEGRAM SPEECH BUBBLE)
              return (
                <div
                  key={m.id}
                  className={`flex flex-col gap-1 ${isMe ? 'items-end' : 'items-start'} animate-fade-in`}
                >
                  <div
                    className={`max-w-[82%] px-3 py-1.5 rounded-2xl text-xs shadow-md leading-relaxed ${
                      isMe
                        ? isLightMode
                          ? 'bg-[#eef5fd] text-slate-900 rounded-tr-sm'
                          : 'bg-[#2b5278] text-white rounded-tr-sm'
                        : isLightMode
                          ? 'bg-white text-slate-900 rounded-tl-sm'
                          : 'bg-[#182533] text-slate-100 rounded-tl-sm'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span>{m.text}</span>
                      {m.hasCustomEmoji && (
                        <span className="inline-block w-5 h-5 align-middle relative">
                          <canvas
                            ref={textCanvasRef}
                            width={40}
                            height={40}
                            className="w-5 h-5 object-contain"
                          />
                        </span>
                      )}
                    </div>

                    <div
                      className={`flex items-center justify-end gap-1 text-[9px] mt-0.5 font-mono-code ${
                        isMe
                          ? isLightMode ? 'text-slate-500' : 'text-[#8cc7fe]'
                          : isLightMode ? 'text-slate-400' : 'text-slate-400'
                      }`}
                    >
                      <span>{m.time}</span>
                      {isMe && <CheckCheck size={11} className="text-[#34d399]" />}
                    </div>
                  </div>

                  {/* Reaction Pill Badge attached under message */}
                  {isMe && (
                    <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-black/60 border border-white/10 text-[10px] text-slate-200 shadow -mt-2 mr-2 z-10 backdrop-blur-md">
                      <span className="w-3.5 h-3.5 relative inline-block">
                        <canvas
                          ref={reactionCanvasRef}
                          width={32}
                          height={32}
                          className="w-3.5 h-3.5 object-contain"
                        />
                      </span>
                      <span className="font-bold text-[9px] text-[#34d399] font-mono-code">1</span>
                    </div>
                  )}
                </div>
              );
            })}
        </div>

        {/* Telegram Input Bar */}
        <div
          className={`p-2 border-t flex items-center gap-2 ${
            isLightMode
              ? 'bg-[#ffffff] border-black/10'
              : 'bg-[#17212b] border-white/5'
          }`}
        >
          <button
            onClick={handleSendSticker}
            title="Отправить стикер"
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-[#34d399] transition-colors"
          >
            <Smile size={18} />
          </button>

          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="Сообщение..."
            className={`flex-1 py-1 px-3 rounded-full text-xs font-mono-code focus:outline-none ${
              isLightMode
                ? 'bg-[#f0f2f5] text-slate-900 placeholder:text-slate-400'
                : 'bg-[#0e1621] text-white border border-white/5 placeholder:text-slate-500'
            }`}
          />

          <button
            onClick={handleSendMessage}
            className="w-8 h-8 rounded-full bg-[#34d399] text-black flex items-center justify-center hover:scale-105 active:scale-95 transition-transform flex-shrink-0 shadow-md shadow-[#34d399]/20"
          >
            <Send size={13} className="ml-0.5" />
          </button>
        </div>
      </div>

      {/* Helpful Hint Card */}
      <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5 text-[11px] text-slate-400 space-y-1">
        <div className="flex items-center gap-1.5 text-white font-bold font-mono-code">
          <Sparkles size={12} className="text-[#34d399]" />
          <span>Как это выглядит в Telegram:</span>
        </div>
        <p>
          • <b>Стикер:</b> отправляется без пузыря диалога прямо на фон чата с полупрозрачным бейджем времени.
        </p>
        <p>
          • <b>Эмодзи в тексте:</b> встраивается прямо в строку сообщения и анимируется на лету.
        </p>
        <p>
          • <b>Статус:</b> отображается возле имени пользователя в Telegram Premium.
        </p>
      </div>

    </div>
  );
};

