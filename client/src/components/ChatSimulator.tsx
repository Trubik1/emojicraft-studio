import React, { useEffect, useRef, useState } from 'react';
import type { EmojiConfig } from '../types';
import { renderEmojiFrame } from '../utils/canvasRenderer';
import { useTelegram } from '../hooks/useTelegram';
import { MessageSquare, Moon, Sun, CheckCheck, Send, Sparkles } from 'lucide-react';

interface Props {
  config: EmojiConfig;
}

export const ChatSimulator: React.FC<Props> = ({ config }) => {
  const { user } = useTelegram();
  const [isLightMode, setIsLightMode] = useState(false);
  const statusCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const textCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const bigCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);

  const displayName = user?.first_name || 'Trubik';
  const displayUsername = user?.username ? `@${user.username}` : '@Trubik1';

  useEffect(() => {
    let startTime = performance.now();

    const loop = (currentTime: number) => {
      const elapsed = (currentTime - startTime) / 1000;

      [statusCanvasRef, textCanvasRef, bigCanvasRef].forEach((ref) => {
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

  return (
    <div className="w-full max-w-sm mx-auto space-y-4 pb-16">
      
      {/* Top Header & Theme Toggle */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-1.5 text-xs font-bold font-mono-code text-slate-300">
          <MessageSquare size={13} className="text-[#34d399]" />
          <span>Симулятор диалога Telegram</span>
        </div>

        <button
          onClick={() => setIsLightMode(!isLightMode)}
          className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-[11px] font-mono-code font-semibold text-slate-400 hover:text-white transition-colors"
        >
          {isLightMode ? <Moon size={11} /> : <Sun size={11} />}
          <span>{isLightMode ? 'Тёмная' : 'Светлая'}</span>
        </button>
      </div>

      {/* Simulated Telegram Screen */}
      <div
        className={`bento-card cyber-frame p-4 transition-colors duration-200 select-none overflow-hidden relative ${
          isLightMode
            ? 'bg-[#8ea6bc] border-slate-300 text-slate-900 shadow-xl'
            : 'bg-[#0b0e14] border-white/10 text-slate-100 shadow-2xl'
        }`}
        style={{ minHeight: '380px' }}
      >
        <div className="corner-cross tl" />
        <div className="corner-cross tr" />
        <div className="corner-cross bl" />
        <div className="corner-cross br" />

        {/* Chat Header */}
        <div className="flex items-center gap-3 pb-3 mb-3 border-b border-black/10 dark:border-white/10">
          {/* Avatar */}
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#059669] to-[#34d399] flex items-center justify-center font-bold text-black shadow-md text-sm">
            {displayName[0]}
          </div>

          <div className="flex-1 min-w-0">
            {/* Name + Custom Emoji Profile Status Badge */}
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-sm truncate">{displayName}</span>
              <span className="text-xs text-[#34d399] font-mono-code font-normal truncate">{displayUsername}</span>
              
              {/* Profile Emoji Status */}
              <div className="w-5 h-5 flex-shrink-0 relative">
                <canvas
                  ref={statusCanvasRef}
                  width={40}
                  height={40}
                  className="w-5 h-5 object-contain"
                />
              </div>
            </div>
            <p className="text-[10px] text-slate-400 font-mono-code">онлайн • Telegram Premium</p>
          </div>
        </div>

        {/* Message 1: Incoming from contact */}
        <div className="flex flex-col gap-1 mb-4 items-start">
          <div
            className={`max-w-[78%] px-3.5 py-2 rounded-2xl rounded-tl-sm text-xs shadow-sm leading-relaxed ${
              isLightMode ? 'bg-white text-slate-900' : 'bg-[#18222d] text-slate-200'
            }`}
          >
            Привет! Как ты сделал такую анимированную букву в никнейме? 🔥
            <div className="text-[9px] text-slate-400 text-right mt-0.5 font-mono-code">17:44</div>
          </div>
        </div>

        {/* Message 2: Outgoing from user with INLINE Custom Emoji */}
        <div className="flex flex-col gap-1 mb-4 items-end">
          <div
            className={`max-w-[85%] px-3.5 py-2 rounded-2xl rounded-tr-sm text-xs shadow-md leading-relaxed ${
              isLightMode
                ? 'bg-[#eef5fd] text-slate-900'
                : 'bg-gradient-to-r from-[#064e3b] to-[#047857] text-white'
            }`}
          >
            <div className="flex items-center gap-1.5 flex-wrap">
              <span>Сделал в EmojiCraft Studio</span>
              <span className="inline-block w-6 h-6 align-middle relative">
                <canvas
                  ref={textCanvasRef}
                  width={48}
                  height={48}
                  className="w-6 h-6 object-contain"
                />
              </span>
              <span>— экспорт сразу в WebM!</span>
            </div>

            <div className="flex items-center justify-end gap-1 text-[9px] text-[#34d399] mt-0.5 font-mono-code">
              <span>17:45</span>
              <CheckCheck size={11} />
            </div>
          </div>

          {/* Reaction Pill Badge attached to the message */}
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-black/40 border border-white/10 text-[10px] text-slate-200 shadow-sm -mt-2 mr-2 z-10 backdrop-blur-md">
            <span className="w-3.5 h-3.5 relative inline-block">
              <canvas
                ref={bigCanvasRef}
                width={32}
                height={32}
                className="w-3.5 h-3.5 object-contain"
              />
            </span>
            <span className="font-bold text-[9px] text-[#34d399] font-mono-code">1</span>
          </div>
        </div>

        {/* Input Field Placeholder */}
        <div className="mt-8 pt-3 border-t border-black/10 dark:border-white/10 flex items-center gap-2">
          <div
            className={`flex-1 py-1.5 px-3 rounded-full text-xs font-mono-code text-slate-400 flex items-center justify-between ${
              isLightMode ? 'bg-white' : 'bg-[#18222d]'
            }`}
          >
            <span>Сообщение...</span>
            <Sparkles size={12} className="text-[#34d399]" />
          </div>
          <div className="w-7 h-7 rounded-full bg-[#34d399] text-black flex items-center justify-center">
            <Send size={12} className="ml-0.5" />
          </div>
        </div>
      </div>

    </div>
  );
};
