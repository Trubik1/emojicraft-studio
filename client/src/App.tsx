import React, { useState, useEffect } from 'react';
import type { EmojiConfig } from './types';
import { EmojiCanvas } from './components/EmojiCanvas';
import { StudioControls } from './components/StudioControls';
import { BatchGeneratorModal } from './components/BatchGeneratorModal';
import { GridSlicer } from './components/GridSlicer';
import { EmojiInspector } from './components/EmojiInspector';
import { ChatSimulator } from './components/ChatSimulator';
import { MediaConverter } from './components/MediaConverter';
import { CreationsGallery } from './components/CreationsGallery';
import { BackgroundParticles } from './components/BackgroundParticles';
import { useTelegram } from './hooks/useTelegram';
import { Sparkles, Grid3X3, Search, MessageSquare, Film, FolderHeart } from 'lucide-react';

export const App: React.FC = () => {
  const { user, haptic } = useTelegram();

  // Active Tab: 'studio' | 'media' | 'slicer' | 'inspector' | 'chat' | 'gallery'
  const [activeTab, setActiveTab] = useState<'studio' | 'media' | 'slicer' | 'inspector' | 'chat' | 'gallery'>('studio');
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
  const [mascotBounce, setMascotBounce] = useState(false);

  // Check URL params for deep-linking (e.g. from Telegram Bot /start commands)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tabParam = params.get('tab');
    if (tabParam && ['studio', 'media', 'slicer', 'inspector', 'chat', 'gallery'].includes(tabParam)) {
      setActiveTab(tabParam as any);
    }
  }, []);

  // Global Emoji Studio State (Defaulting to Om Nom with Cyber Emerald glow!)
  const [emojiConfig, setEmojiConfig] = useState<EmojiConfig>({
    baseShape: 'omnom',          // 🟢 Ам Ням по умолчанию!
    character: 'S',
    fontFamily: 'Fredoka',
    fontSize: 100,
    letterOffsetX: 0,
    letterOffsetY: 0,
    letterRotation: 0,
    colorPresetId: 'cyber-emerald', // Cyber Emerald из КАРТОЧКИ!
    animationType: 'sparkle',       // Искрящийся блик
    animationSpeed: 1.0,
    hasDrip: true,                  // Капли краски
    hasGlow: true,
    hasGlossyBevel: true,
    sizeMode: 'emoji',
  });

  const handleTabChange = (tab: typeof activeTab) => {
    haptic.selection();
    setActiveTab(tab);
  };

  const handleMascotClick = () => {
    haptic.medium();
    setMascotBounce(true);
    setTimeout(() => setMascotBounce(false), 500);
  };

  return (
    <div className="min-h-screen bg-[#08090c] text-white flex flex-col items-center justify-start pb-24 relative selection:bg-[#34d399]/30">
      
      {/* 1. Interactive 60fps Particle Canvas from КАРТОЧКА */}
      <BackgroundParticles />

      {/* 2. Top Header (Cyber Bento Bar) */}
      <header className="w-full max-w-sm px-4 pt-4 pb-2 flex items-center justify-between sticky top-0 bg-[#08090c]/85 backdrop-blur-xl border-b border-white/5 z-30">
        <div className="flex items-center gap-2.5">
          {/* Interactive Om Nom Mascot Icon */}
          <button
            onClick={handleMascotClick}
            className={`w-9 h-9 rounded-2xl bg-[#0e1017] border border-white/10 p-1 flex items-center justify-center relative shadow-md transition-transform ${
              mascotBounce ? 'scale-125 rotate-6' : 'hover:scale-105'
            }`}
            title="Кликните Ам Няма!"
          >
            <img
              src="/omnom/amnumya_010.webp"
              alt="Ам Ням"
              className="w-full h-full object-contain filter drop-shadow"
            />
          </button>

          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="text-sm font-extrabold tracking-tight text-white m-0 font-mono-code">
                EmojiCraft
              </h1>
              <span className="px-1.5 py-0.2 text-[9px] font-bold rounded-md bg-[#34d399]/15 text-[#34d399] border border-[#34d399]/30 uppercase tracking-wider font-mono-code">
                Bento
              </span>
            </div>
            <p className="text-[10px] text-slate-400">Telegram Studio & Stickers</p>
          </div>
        </div>

        {/* Telegram User / Status Badge */}
        {user ? (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#11131a] border border-white/10 text-[11px] font-mono-code text-slate-300">
            <span className="w-2 h-2 rounded-full bg-[#34d399] animate-pulse" />
            <span className="truncate max-w-[85px]">{user.first_name}</span>
          </div>
        ) : (
          <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#11131a] border border-white/10 text-[10px] font-mono-code text-[#34d399]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#34d399]" />
            <span>v2.0 PROD</span>
          </div>
        )}
      </header>

      {/* 3. Main Content Area */}
      <main className="w-full max-w-sm px-4 pt-3 flex-1 relative z-10">
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

        {activeTab === 'gallery' && (
          <CreationsGallery
            onLoadConfig={(cfg) => setEmojiConfig(cfg)}
            onOpenStudio={() => setActiveTab('studio')}
          />
        )}
      </main>

      {/* 4. Floating Bento Navigation Bar (Desktop & Mobile) */}
      <nav className="fixed bottom-3 inset-x-0 w-[calc(100%-24px)] max-w-sm mx-auto bg-[#0d1017]/90 border border-white/10 rounded-2xl backdrop-blur-2xl p-1.5 z-40 shadow-2xl">
        <div className="grid grid-cols-6 gap-1">
          {[
            { id: 'studio', label: 'Студия', icon: Sparkles },
            { id: 'media', label: 'Медиа', icon: Film },
            { id: 'slicer', label: 'Нарезка', icon: Grid3X3 },
            { id: 'inspector', label: 'Инспектор', icon: Search },
            { id: 'chat', label: 'Чат', icon: MessageSquare },
            { id: 'gallery', label: 'Паки', icon: FolderHeart },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id as any)}
                className={`flex flex-col items-center justify-center py-1.5 px-0.5 rounded-xl transition-all ${
                  isActive
                    ? 'bg-[#34d399] text-black font-extrabold shadow-md shadow-[#34d399]/20'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Icon size={16} className={isActive ? 'stroke-[2.5]' : 'stroke-2'} />
                <span className="text-[9px] mt-0.5 font-mono-code truncate w-full text-center">
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* 5. Batch Alphabet Generator Modal */}
      <BatchGeneratorModal
        isOpen={isBatchModalOpen}
        onClose={() => setIsBatchModalOpen(false)}
        baseConfig={emojiConfig}
      />
    </div>
  );
};

export default App;
