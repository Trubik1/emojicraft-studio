import React, { useEffect, useRef, useState } from 'react';
import type { EmojiConfig } from '../types';
import { renderEmojiFrame } from '../utils/canvasRenderer';
import { useTelegram } from '../hooks/useTelegram';
import { MessageSquare, Moon, Sun, CheckCheck, Send } from 'lucide-react';

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

  const displayName = user?.first_name || 'Artem';
  const displayUsername = user?.username ? `@${user.username}` : '@creator';

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
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-300">
          <MessageSquare size={14} className="text-sky-400" />
          <span>Симулятор диалога Telegram</span>
        </div>

        <button
          onClick={() => setIsLightMode(!isLightMode)}
          className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800 text-[11px] font-semibold text-slate-400 hover:text-white transition-colors"
        >
          {isLightMode ? <Moon size={12} /> : <Sun size={12} />}
          <span>{isLightMode ? 'Темная' : 'Светлая'}</span>
        </button>
      </div>

      {/* Simulated Telegram Screen */}
      <div
        className={`rounded-3xl border shadow-2xl p-4 transition-colors duration-200 select-none ${
          isLightMode
            ? 'bg-[#8ea6bc] border-slate-300 text-slate-900'
            : 'bg-[#0f141c] border-slate-800 text-slate-100'
        }`}
        style={{
          minHeight: '380px',
        }}
      >
        {/* Chat Header */}
        <div className="flex items-center gap-3 pb-3 mb-3 border-b border-black/10 dark:border-white/10">
          {/* Avatar */}
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center font-bold text-white shadow-sm">
            {displayName[0]}
          </div>

          <div className="flex-1 min-w-0">
            {/* Name + Custom Emoji Profile Status Badge (like in screenshot #2: Vladislav // @gitmash + emoji!) */}
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-sm truncate">{displayName}</span>
              <span className="text-xs text-sky-400 font-normal truncate">{displayUsername}</span>
              
              {/* Profile Emoji Status */}
              <div className="w-5 h-5 flex-shrink-0 relative">
                <canvas
                  ref={statusCanvasRef}
                  width={64}
                  height={64}
                  className="w-full h-full object-contain"
                />
              </div>
            </div>
            <span className="text-[11px] text-slate-400">был(а) недавно</span>
          </div>
        </div>

        {/* Message Bubble 1: In-line Text Message with Custom Emoji */}
        <div className="flex flex-col items-end mb-3">
          <div
            className={`max-w-[85%] rounded-2xl rounded-br-sm px-3.5 py-2.5 shadow-md flex flex-col gap-1 ${
              isLightMode ? 'bg-[#eeffde] text-black' : 'bg-[#2b5278] text-white'
            }`}
          >
            <div className="text-[13px] leading-relaxed flex flex-wrap items-center gap-1">
              <span>Зацени мой новый кастомный статус</span>
              <span className="inline-block w-5 h-5 align-middle">
                <canvas
                  ref={textCanvasRef}
                  width={64}
                  height={64}
                  className="w-full h-full object-contain"
                />
              </span>
              <span>в сообщении! 🔥</span>
            </div>

            <div className="flex items-center justify-end gap-1 text-[10px] opacity-60 self-end mt-0.5">
              <span>15:42</span>
              <CheckCheck size={13} className="text-sky-300" />
            </div>
          </div>
        </div>

        {/* Message Bubble 2: Big Standalone Custom Emoji / Sticker */}
        <div className="flex flex-col items-end mb-2">
          <div className="relative p-1">
            <div className="w-32 h-32 relative drop-shadow-xl">
              <canvas
                ref={bigCanvasRef}
                width={200}
                height={200}
                className="w-full h-full object-contain"
              />
            </div>
            <div className="flex items-center justify-end gap-1 text-[10px] opacity-60 mt-1">
              <span className="px-1.5 py-0.5 rounded-full bg-black/40 text-white font-mono">15:43</span>
            </div>
          </div>
        </div>

        {/* Fake Input bar */}
        <div className="mt-8 pt-3 border-t border-black/10 dark:border-white/10 flex items-center gap-2">
          <div className="flex-1 py-2 px-3 rounded-full bg-black/10 dark:bg-white/10 text-xs text-slate-400">
            Сообщение...
          </div>
          <div className="w-8 h-8 rounded-full bg-sky-500 flex items-center justify-center text-white">
            <Send size={14} />
          </div>
        </div>
      </div>
    </div>
  );
};
