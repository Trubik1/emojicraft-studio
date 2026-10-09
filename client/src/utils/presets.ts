import type { LetterColorPreset } from '../types';

export const COLOR_PRESETS: LetterColorPreset[] = [
  {
    id: 'cyber-emerald',
    name: 'Cyber Emerald (Trubik)',
    gradient: ['#34d399', '#059669'],
    glow: 'rgba(52, 211, 153, 0.6)',
    border: '#065f46',
  },
  {
    id: 'pink-balloon',
    name: 'Pink Pop (как на фото)',
    gradient: ['#ff3b88', '#c01968'],
    glow: 'rgba(255, 60, 140, 0.6)',
    border: '#7a063d',
  },
  {
    id: 'royal-gold',
    name: 'Royal Gold 3D',
    gradient: ['#ffd700', '#ff9900'],
    glow: 'rgba(255, 200, 0, 0.6)',
    border: '#b36b00',
  },
  {
    id: 'cyber-cyan',
    name: 'Cyber Neon Cyan',
    gradient: ['#00f0ff', '#0072ff'],
    glow: 'rgba(0, 240, 255, 0.6)',
    border: '#0047a0',
  },
  {
    id: 'toxic-lime',
    name: 'Acid Lime',
    gradient: ['#adff2f', '#00c853'],
    glow: 'rgba(173, 255, 47, 0.6)',
    border: '#006429',
  },
  {
    id: 'amethyst-purple',
    name: 'Violet Gem',
    gradient: ['#c084fc', '#7e22ce'],
    glow: 'rgba(192, 132, 252, 0.6)',
    border: '#4c1d95',
  },
  {
    id: 'flame-ruby',
    name: 'Flame Ruby',
    gradient: ['#ff4d4d', '#b30000'],
    glow: 'rgba(255, 77, 77, 0.6)',
    border: '#660000',
  },
  {
    id: 'ice-diamond',
    name: 'Ice Crystal',
    gradient: ['#ffffff', '#a5f3fc'],
    glow: 'rgba(165, 243, 252, 0.7)',
    border: '#0891b2',
  },
  {
    id: 'midnight-black',
    name: 'Dark Chrome',
    gradient: ['#334155', '#0f172a'],
    glow: 'rgba(148, 163, 184, 0.4)',
    border: '#020617',
  },
];

export const FONT_PRESETS = [
  { id: 'Fredoka', name: 'Fredoka Bubble', css: "'Fredoka', cursive" },
  { id: 'Rubik', name: 'Rubik Bold 3D', css: "'Rubik', sans-serif" },
  { id: 'Impact', name: 'Meme Impact', css: "Impact, sans-serif" },
  { id: 'Press Start 2P', name: 'Retro Pixel 8-Bit', css: "'Press Start 2P', monospace" },
  { id: 'Plus Jakarta Sans', name: 'Modern Clean', css: "'Plus Jakarta Sans', sans-serif" },
];

export const SHAPE_PRESETS = [
  { id: 'omnom', name: 'Ам Ням (Om Nom)', icon: '🟢', desc: 'Фирменный милый маскот' },
  { id: 'emoji-look-up', name: 'Смайлик (Глаза вверх)', icon: '👀', desc: 'Классический трендовый смайл' },
  { id: 'emoji-cool', name: 'Крутой смайл', icon: '😎', desc: 'В очках с короной' },
  { id: 'heart', name: 'Глянцевое Сердце', icon: '❤️', desc: '3D рубиновое сердце' },
  { id: 'fire', name: 'Огонь / Пламя', icon: '🔥', desc: 'Яркий горящий огонек' },
  { id: 'diamond', name: 'Алмаз / Кристалл', icon: '💎', desc: 'Ограненный драгоценный камень' },
  { id: 'star', name: 'Золотая Звезда', icon: '⭐', desc: 'Сияющая звезда' },
  { id: 'shield', name: 'Герб / Щит', icon: '🛡️', desc: 'Рыцарский бейдж' },
  { id: 'crown', name: 'Корона Премиум', icon: '👑', desc: 'Королевский статус' },
  { id: 'skull', name: 'Геймерский Череп', icon: '💀', desc: 'Стильный арт-череп' },
];

export const ANIMATION_PRESETS = [
  { id: 'sparkle', name: 'Сверкающий блик ✨', desc: 'Яркая звезда скользит по букве с искрами' },
  { id: 'drip', name: 'Стекающие капли 💧', desc: 'Жидкие капли стекают с буквы вниз' },
  { id: 'pulse', name: 'Неоновое дыхание 💓', desc: 'Мягкая пульсация масштаба и свечения' },
  { id: 'float', name: 'Плавное парение 🪂', desc: 'Мягкое покачивание вверх и вниз' },
  { id: 'wobble', name: 'Пружинистый отскок 🤹', desc: 'Динамичное упругое подпрыгивание' },
  { id: 'none', name: 'Статичный', desc: 'Без анимации (для обычных эмодзи)' },
];
