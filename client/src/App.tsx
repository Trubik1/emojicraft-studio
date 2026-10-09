import React, { useState } from 'react';
import type { EmojiConfig } from './types';
import { EmojiCanvas } from './components/EmojiCanvas';
import { StudioControls } from './components/StudioControls';
import { BatchGeneratorModal } from './components/BatchGeneratorModal';
import { GridSlicer } from './components/GridSlicer';
import { EmojiInspector } from './components/EmojiInspector';
import { ChatSimulator } from './components/ChatSimulator';
import { MediaConverter } from './components/MediaConverter';
import { useTelegram } from './hooks/useTelegram';
import { Sparkles, Grid3X3, Search, MessageSquare, Wand2, Film } from 'lucide-react';

export const App: React.FC = () => {
  const { user, haptic } = useTelegram();

  // Active Tab: 'studio' | 'media' | 'slicer' | 'inspector' | 'chat'
  const [activeTab, setActiveTab] = useState<'studio' | 'media' | 'slicer' | 'inspector' | 'chat'>('studio');
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);

  // Global Emoji Studio State
  const [emojiConfig, setEmojiConfig] = useState<EmojiConfig>({
    baseShape: 'emoji-look-up',
    character: 'S',
    fontFamily: 'Fredoka',
    fontSize: 100,
    letterOffsetX: 0,
    letterOffsetY: 0,
    letterRotation: 0,
    colorPresetId: 'pink-balloon', // Matches user's screenshot!
    animationType: 'sparkle',      // Sparkle animation like screenshot #1
    animationSpeed: 1.0,
    hasDrip: true,                 // Drips like screenshot #2
    hasGlow: true,
    hasGlossyBevel: true,
    sizeMode: 'emoji',
  });

  const handleTabChange = (tab: typeof activeTab) => {
    haptic.selection();
    setActiveTab(tab);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-start pb-20 selection:bg-sky-500/30">
      
      {/* Top Header */}
      <header className="w-full max-w-sm px-4 pt-5 pb-3 flex items-center justify-between border-b border-slate-900 sticky top-0 bg-slate-950/80 backdrop-blur-xl z-30">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-sky-500 to-pink-500 p-0.5 shadow-lg shadow-pink-500/20">
            <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center text-lg">
              ✨
            </div>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="text-sm font-extrabold tracking-tight text-white m-0">EmojiCraft</h1>
              <span className="px-1.5 py-0.5 text-[9px] font-bold rounded-md bg-pink-500/10 text-pink-400 border border-pink-500/20 uppercase tracking-wider">
                Studio
              </span>
            </div>
            <p className="text-[10px] text-slate-400">Telegram Custom & Animated Emojis</p>
          </div>
        </div>

        {/* Telegram User Badge */}
        {user ? (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800 text-[11px] font-semibold text-slate-300">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="truncate max-w-[80px]">{user.first_name}</span>
          </div>
        ) : (
          <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-900/80 border border-slate-800 text-[11px] font-medium text-slate-400">
            <Wand2 size={12} className="text-sky-400" />
            <span>TMA Ready</span>
          </div>
        )}
      </header>

      {/* Main Content Area based on Tab */}
      <main className="w-full max-w-sm px-4 pt-4 flex-1">
        {activeTab === 'studio' && (
          <div className="space-y-4">
            <EmojiCanvas config={emojiConfig} onChangeConfig={setEmojiConfig} />
            <StudioControls
              config={emojiConfig}
              onChange={setEmojiConfig}
              onOpenBatchModal={() => setIsBatchModalOpen(true)}
            />
          </div>
        )}

        {activeTab === 'media' && <MediaConverter />}

        {activeTab === 'slicer' && <GridSlicer />}

        {activeTab === 'inspector' && <EmojiInspector />}

        {activeTab === 'chat' && <ChatSimulator config={emojiConfig} />}
      </main>

      {/* Bottom Sticky Tab Navigation */}
      <nav className="fixed bottom-0 inset-x-0 w-full max-w-sm mx-auto bg-slate-950/90 border-t border-slate-800/80 backdrop-blur-2xl p-1.5 z-40">
        <div className="grid grid-cols-5 gap-1">
          {[
            { id: 'studio', label: 'Студия', icon: Sparkles },
            { id: 'media', label: 'Видео/GIF', icon: Film },
            { id: 'slicer', label: 'Нарезка', icon: Grid3X3 },
            { id: 'inspector', label: 'Инспектор', icon: Search },
            { id: 'chat', label: 'Чат-тест', icon: MessageSquare },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id as any)}
                className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-2xl transition-all ${
                  isActive
                    ? 'bg-sky-500/15 text-sky-400 font-bold shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Icon size={17} className={isActive ? 'stroke-[2.5]' : 'stroke-2'} />
                <span className="text-[9px] mt-0.5 tracking-tight truncate w-full text-center">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Batch Alphabet Generator Modal */}
      <BatchGeneratorModal
        isOpen={isBatchModalOpen}
        onClose={() => setIsBatchModalOpen(false)}
        baseConfig={emojiConfig}
      />
    </div>
  );
};

export default App;
