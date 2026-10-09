export type BaseShape = 
  | 'emoji-look-up' // The classic yellow emoji looking up at its forehead (from screenshot)
  | 'emoji-cool'    // Sunglasses face
  | 'heart'         // Glossy heart
  | 'fire'          // Flame
  | 'diamond'       // Gemstone
  | 'star'          // Golden star
  | 'shield'        // Hero shield badge
  | 'skull'         // Cool gamer skull
  | 'crown';        // Royal crown

export type AnimationType = 
  | 'none'          // Static 
  | 'sparkle'       // Gleam & sparkle light travelling (like screenshot 1)
  | 'drip'          // Melting drip paint (like screenshot 2)
  | 'pulse'         // Neon breathing & glow
  | 'float'         // Gentle floating bob
  | 'wobble';       // Playful bounce & wobble

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
  fontSize: number; // relative scale 50..150
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

export interface SliceGridConfig {
  columns: number;
  rows: number;
  squareSize: number;
}
