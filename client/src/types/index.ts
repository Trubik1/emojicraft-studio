export type BaseShape = 
  | 'omnom'         // Ам Ням (Om Nom) фирменный маскот!
  | 'emoji-look-up' // Классический смайлик с глазами вверх
  | 'emoji-cool'    // Крутой смайл в очках
  | 'heart'         // 3D глянцевое сердце
  | 'fire'          // Огонь / пламя
  | 'diamond'       // Алмаз / кристалл
  | 'star'          // Золотая звезда
  | 'crown'         // Корона Премиум
  | 'shield'        // Герб / щит
  | 'skull';        // Арт-череп

export type AnimationType = 
  | 'none'          // Статичный
  | 'sparkle'       // Сверкающий блик и искры
  | 'drip'          // Стекающие капли краски
  | 'pulse'         // Неоновое дыхание
  | 'float'         // Плавное парение
  | 'wobble';       // Пружинистый отскок

export type LetterColorPreset = {
  id: string;
  name: string;
  gradient: [string, string];
  glow: string;
  border: string;
};

export interface EmojiConfig {
  baseShape: BaseShape;
  character: string;
  fontFamily: string;
  fontSize: number; // 50..150
  letterOffsetX: number; // -50..50
  letterOffsetY: number; // -50..50
  letterRotation: number; // -30..30
  colorPresetId: string;
  animationType: AnimationType;
  animationSpeed: number; // 0.5 .. 2.0
  hasDrip: boolean;
  hasGlow: boolean;
  hasGlossyBevel: boolean;
  sizeMode: 'emoji' | 'sticker'; // 100x100 or 512x512
}

export interface SavedEmoji {
  id: string;
  createdAt: number;
  character: string;
  baseShape: BaseShape;
  previewUrl: string;
  config: EmojiConfig;
}

export interface SliceGridConfig {
  columns: number;
  rows: number;
  squareSize: number;
}
