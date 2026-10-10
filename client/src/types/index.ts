export type BaseShape = 
  | 'omnom'           // Классический Ам Ням (#10 из КАРТОЧКИ)
  | 'omnom-candy'     // Ам Ням с леденцом
  | 'omnom-eating'    // Ам Ням кушает
  | 'omnom-super'     // Супергерой Ам Ням в плаще
  | 'omnom-happy'     // Радостный Ам Ням
  | 'omnom-jump'      // Прыгающий Ам Ням
  | 'omnom-cake'      // Ам Ням с тортиком
  | 'emoji-look-up'   // 3D Смайлик смотрящий вверх
  | 'emoji-cool'      // Крутой смайл в темных очках
  | 'heart'           // 3D глянцевое сердце
  | 'fire'            // Огонь / пламя
  | 'diamond'         // Алмаз / кристалл
  | 'star'            // Золотая звезда
  | 'crown'           // Корона Премиум
  | 'shield';         // Рыцарский герб

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
  letterRotation: number; // -35..35
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
