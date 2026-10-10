import type { EmojiConfig } from '../types';
import { COLOR_PRESETS } from './presets';

export interface RenderContext {
  ctx: CanvasRenderingContext2D;
  width: number;
  height: number;
  time: number; // in seconds
  config: EmojiConfig;
}

export function renderEmojiFrame({ ctx, width, height, time, config }: RenderContext) {
  // Clear canvas (keeps transparent background)
  ctx.clearRect(0, 0, width, height);

  const scale = width / 200; // Normalized to 200x200 canvas
  ctx.save();
  ctx.scale(scale, scale);

  const colorPreset = COLOR_PRESETS.find(c => c.id === config.colorPresetId) || COLOR_PRESETS[0];

  // 1. Draw Base Shape
  drawBaseShape(ctx, config.baseShape, time, config);

  // 2. Draw Letter with 3D Balloon styling & Motion
  drawStyledLetter(ctx, config, colorPreset, time);

  ctx.restore();
}

const imageCache = new Map<string, HTMLImageElement>();

const OMNOM_SPRITES: Record<string, string> = {
  'omnom': '/omnom/amnumya_010.webp',
  'omnom-candy': '/omnom/omnom-candy.webp',
  'omnom-eating': '/omnom/omnom-eating.webp',
  'omnom-super': '/omnom/omnom-super.webp',
  'omnom-happy': '/omnom/omnom-happy.webp',
  'omnom-jump': '/omnom/omnom-jump.webp',
  'omnom-cake': '/omnom/omnom-cake.webp',
};

function drawBaseShape(ctx: CanvasRenderingContext2D, shape: string, time: number, config: EmojiConfig) {
  ctx.save();

  if (shape.startsWith('omnom')) {
    // 🟢 Аутентичный высокодетализированный Ам Ням (WebP-спрайты из КАРТОЧКА)
    const spriteUrl = OMNOM_SPRITES[shape] || OMNOM_SPRITES['omnom'];
    let img = imageCache.get(spriteUrl);
    if (!img) {
      img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = spriteUrl;
      imageCache.set(spriteUrl, img);
    }

    // Мягкая естественная тень под Ам Нямом
    const shadowGrad = ctx.createRadialGradient(100, 184, 5, 100, 184, 60);
    shadowGrad.addColorStop(0, 'rgba(0, 0, 0, 0.45)');
    shadowGrad.addColorStop(0.6, 'rgba(0, 0, 0, 0.15)');
    shadowGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = shadowGrad;
    ctx.beginPath();
    ctx.ellipse(100, 184, 55, 12, 0, 0, Math.PI * 2);
    ctx.fill();

    if (img.complete && img.naturalWidth > 0) {
      // Идеальное позиционирование спрайта на холсте
      const targetSize = 135;
      const x = 100 - targetSize / 2;
      const y = 126 - targetSize / 2;
      ctx.drawImage(img, x, y, targetSize, targetSize);
    } else {
      // Резервный градиент на время первого обращения к картинке
      const cx = 100, cy = 125;
      const bodyGrad = ctx.createRadialGradient(cx - 15, cy - 25, 12, cx, cy, 68);
      bodyGrad.addColorStop(0, '#86efac');
      bodyGrad.addColorStop(0.35, '#22c55e');
      bodyGrad.addColorStop(1, '#15803d');
      ctx.beginPath();
      ctx.ellipse(cx, cy, 60, 52, 0, 0, Math.PI * 2);
      ctx.fillStyle = bodyGrad;
      ctx.fill();
    }
  } else if (shape === 'emoji-look-up') {
    // Face body - yellow 3D sphere
    const cx = 100;
    const cy = 115;
    const r = 70;

    // Outer subtle glow
    ctx.shadowColor = 'rgba(245, 158, 11, 0.4)';
    ctx.shadowBlur = 16;

    // Body gradient
    const grad = ctx.createRadialGradient(cx - 20, cy - 25, 10, cx, cy, r);
    grad.addColorStop(0, '#fef08a'); // Highlight
    grad.addColorStop(0.4, '#facc15'); // Yellow
    grad.addColorStop(0.85, '#eab308'); // Warm amber
    grad.addColorStop(1, '#ca8a04'); // Rim shadow

    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();

    // Darker outline
    ctx.shadowBlur = 0;
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#a16207';
    ctx.stroke();

    // Forehead glow under the letter
    const foreheadGlow = ctx.createRadialGradient(100, 68, 5, 100, 68, 42);
    foreheadGlow.addColorStop(0, 'rgba(255, 110, 180, 0.55)');
    foreheadGlow.addColorStop(1, 'rgba(255, 110, 180, 0)');
    ctx.fillStyle = foreheadGlow;
    ctx.beginPath();
    ctx.arc(100, 68, 42, 0, Math.PI * 2);
    ctx.fill();

    // Big expressive eyes looking UPWARDS towards the forehead letter
    const eyeY = 125;
    const leftEyeX = 72;
    const rightEyeX = 128;
    const eyeR = 25;

    // Sclera (White of the eyes)
    [leftEyeX, rightEyeX].forEach((ex) => {
      ctx.save();
      ctx.beginPath();
      ctx.arc(ex, eyeY, eyeR, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = '#78350f';
      ctx.stroke();

      // Pupil looking UP towards the letter
      // subtle eye tracking if in drip animation
      const pupilOffsetY = config.animationType === 'drip' ? Math.sin(time * 3) * 2 : 0;
      const pupilX = ex + (ex < 100 ? 5 : -5);
      const pupilY = eyeY - 12 + pupilOffsetY;
      const pupilR = 13;

      ctx.beginPath();
      ctx.arc(pupilX, pupilY, pupilR, 0, Math.PI * 2);
      ctx.fillStyle = '#1c1917';
      ctx.fill();

      // Specular eye reflections (glossy cartoon eyes)
      ctx.beginPath();
      ctx.arc(pupilX - 4, pupilY - 4, 4.5, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();

      ctx.beginPath();
      ctx.arc(pupilX + 3, pupilY + 3, 2, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      ctx.fill();
      ctx.restore();
    });

    // Small surprised / attentive mouth
    ctx.beginPath();
    ctx.roundRect(88, 162, 24, 9, 4);
    ctx.fillStyle = '#78350f';
    ctx.fill();
  } else if (shape === 'emoji-cool') {
    // Cool Face with Sunglasses
    const cx = 100, cy = 100, r = 75;
    const grad = ctx.createRadialGradient(cx - 20, cy - 20, 10, cx, cy, r);
    grad.addColorStop(0, '#fef08a');
    grad.addColorStop(0.5, '#facc15');
    grad.addColorStop(1, '#b45309');

    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#92400e';
    ctx.stroke();

    // Sunglasses
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.roundRect(45, 90, 48, 30, [4, 4, 18, 18]);
    ctx.roundRect(107, 90, 48, 30, [4, 4, 18, 18]);
    ctx.fill();
    ctx.fillRect(88, 96, 24, 6);

    // Glare on glasses
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.beginPath();
    ctx.moveTo(55, 93);
    ctx.lineTo(82, 93);
    ctx.lineTo(60, 115);
    ctx.lineTo(47, 115);
    ctx.fill();

    // Smirk
    ctx.beginPath();
    ctx.arc(100, 138, 20, 0.2 * Math.PI, 0.8 * Math.PI);
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#78350f';
    ctx.stroke();
  } else if (shape === 'heart') {
    // 3D Glossy Ruby Heart
    const heartX = 100;
    const heartY = 110;
    const size = 65;

    ctx.save();
    ctx.translate(heartX, heartY);

    const grad = ctx.createRadialGradient(-15, -20, 10, 0, 0, 80);
    grad.addColorStop(0, '#ff4d6d');
    grad.addColorStop(0.5, '#c9184a');
    grad.addColorStop(1, '#590d22');

    ctx.beginPath();
    ctx.moveTo(0, size * 0.7);
    ctx.bezierCurveTo(-size * 1.3, -size * 0.2, -size * 0.9, -size * 1.1, 0, -size * 0.4);
    ctx.bezierCurveTo(size * 0.9, -size * 1.1, size * 1.3, -size * 0.2, 0, size * 0.7);
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#400818';
    ctx.stroke();

    // Top glossy highlight arc
    ctx.beginPath();
    ctx.ellipse(-size * 0.4, -size * 0.5, size * 0.35, size * 0.15, -Math.PI / 4, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
    ctx.fill();

    ctx.restore();
  } else if (shape === 'fire') {
    // 3D Stylized Flame
    ctx.save();
    ctx.translate(100, 115);
    const flameGrad = ctx.createLinearGradient(0, 70, 0, -80);
    flameGrad.addColorStop(0, '#dc2626');
    flameGrad.addColorStop(0.5, '#ea580c');
    flameGrad.addColorStop(0.9, '#facc15');

    ctx.beginPath();
    ctx.moveTo(0, 65);
    ctx.bezierCurveTo(-65, 50, -70, -10, -25, -50);
    ctx.bezierCurveTo(-15, -40, -5, -20, 0, -80);
    ctx.bezierCurveTo(20, -50, 40, -25, 30, -5);
    ctx.bezierCurveTo(70, 10, 65, 50, 0, 65);
    ctx.fillStyle = flameGrad;
    ctx.fill();
    ctx.lineWidth = 3.5;
    ctx.strokeStyle = '#7f1d1d';
    ctx.stroke();

    // Inner core
    ctx.beginPath();
    ctx.moveTo(0, 50);
    ctx.bezierCurveTo(-30, 40, -35, 0, -10, -20);
    ctx.bezierCurveTo(0, -30, 15, -20, 20, 0);
    ctx.bezierCurveTo(30, 20, 20, 45, 0, 50);
    ctx.fillStyle = '#fef08a';
    ctx.fill();
    ctx.restore();
  } else if (shape === 'diamond') {
    // Faceted Gemstone
    ctx.save();
    ctx.translate(100, 105);
    const gemGrad = ctx.createLinearGradient(-60, -50, 60, 50);
    gemGrad.addColorStop(0, '#67e8f9');
    gemGrad.addColorStop(0.5, '#06b6d4');
    gemGrad.addColorStop(1, '#0e7490');

    ctx.beginPath();
    ctx.moveTo(-35, -50);
    ctx.lineTo(35, -50);
    ctx.lineTo(65, -15);
    ctx.lineTo(0, 65);
    ctx.lineTo(-65, -15);
    ctx.closePath();
    ctx.fillStyle = gemGrad;
    ctx.fill();
    ctx.lineWidth = 3.5;
    ctx.strokeStyle = '#155e75';
    ctx.stroke();

    // Facet lines
    ctx.beginPath();
    ctx.moveTo(-35, -50);
    ctx.lineTo(-20, -15);
    ctx.lineTo(20, -15);
    ctx.lineTo(35, -50);
    ctx.moveTo(-20, -15);
    ctx.lineTo(0, 65);
    ctx.moveTo(20, -15);
    ctx.lineTo(0, 65);
    ctx.moveTo(-65, -15);
    ctx.lineTo(65, -15);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();
  } else if (shape === 'star') {
    // Golden Star
    ctx.save();
    ctx.translate(100, 105);
    const starGrad = ctx.createRadialGradient(0, -10, 5, 0, 0, 75);
    starGrad.addColorStop(0, '#fef08a');
    starGrad.addColorStop(0.6, '#facc15');
    starGrad.addColorStop(1, '#ca8a04');

    drawStar(ctx, 0, 0, 5, 68, 32);
    ctx.fillStyle = starGrad;
    ctx.fill();
    ctx.lineWidth = 3.5;
    ctx.strokeStyle = '#854d0e';
    ctx.stroke();
    ctx.restore();
  } else if (shape === 'crown') {
    // Crown
    ctx.save();
    ctx.translate(100, 115);
    const crownGrad = ctx.createLinearGradient(0, -50, 0, 40);
    crownGrad.addColorStop(0, '#fde047');
    crownGrad.addColorStop(0.5, '#eab308');
    crownGrad.addColorStop(1, '#a16207');

    ctx.beginPath();
    ctx.moveTo(-60, 35);
    ctx.lineTo(-55, -25);
    ctx.lineTo(-20, 5);
    ctx.lineTo(0, -45);
    ctx.lineTo(20, 5);
    ctx.lineTo(55, -25);
    ctx.lineTo(60, 35);
    ctx.closePath();
    ctx.fillStyle = crownGrad;
    ctx.fill();
    ctx.lineWidth = 3.5;
    ctx.strokeStyle = '#713f12';
    ctx.stroke();

    // Pearls on tips
    [-55, 0, 55].forEach((px, i) => {
      const py = i === 1 ? -45 : -25;
      ctx.beginPath();
      ctx.arc(px, py, 6, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
      ctx.stroke();
    });
    ctx.restore();
  } else if (shape === 'shield') {
    // Knight shield
    ctx.save();
    ctx.translate(100, 105);
    ctx.beginPath();
    ctx.moveTo(-55, -45);
    ctx.lineTo(55, -45);
    ctx.lineTo(55, 10);
    ctx.bezierCurveTo(55, 55, 0, 70, 0, 70);
    ctx.bezierCurveTo(0, 70, -55, 55, -55, 10);
    ctx.closePath();
    const shieldGrad = ctx.createLinearGradient(-55, -45, 55, 70);
    shieldGrad.addColorStop(0, '#3b82f6');
    shieldGrad.addColorStop(0.5, '#1d4ed8');
    shieldGrad.addColorStop(1, '#1e3a8a');
    ctx.fillStyle = shieldGrad;
    ctx.fill();
    ctx.lineWidth = 5;
    ctx.strokeStyle = '#fbbf24'; // Gold border
    ctx.stroke();
    ctx.restore();
  } else if (shape === 'skull') {
    // Cool gamer skull
    ctx.save();
    ctx.translate(100, 110);
    ctx.beginPath();
    ctx.arc(0, -15, 55, Math.PI, 0, false);
    ctx.lineTo(35, 45);
    ctx.lineTo(-35, 45);
    ctx.closePath();
    ctx.fillStyle = '#f1f5f9';
    ctx.fill();
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#334155';
    ctx.stroke();

    // Eye sockets
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.ellipse(-20, -5, 16, 20, -0.1, 0, Math.PI * 2);
    ctx.ellipse(20, -5, 16, 20, 0.1, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  ctx.restore();
}

function drawStyledLetter(
  ctx: CanvasRenderingContext2D,
  config: EmojiConfig,
  colorPreset: typeof COLOR_PRESETS[0],
  time: number
) {
  const char = config.character || 'S';
  const isHeadMounted = config.baseShape.startsWith('omnom') || config.baseShape === 'emoji-look-up';

  // Base position for the letter:
  // If it's the look-up emoji or Om Nom, position on the forehead/hovering above!
  const basePosX = 100;
  const basePosY = isHeadMounted ? 56 : 105;

  let posX = basePosX + config.letterOffsetX;
  let posY = basePosY + config.letterOffsetY;
  let rotation = (config.letterRotation * Math.PI) / 180;
  let scaleX = config.fontSize / 100;
  let scaleY = config.fontSize / 100;

  // Animation modifications
  if (config.animationType === 'pulse') {
    const pulseFactor = 1 + 0.08 * Math.sin(time * 5 * config.animationSpeed);
    scaleX *= pulseFactor;
    scaleY *= pulseFactor;
  } else if (config.animationType === 'float') {
    posY += Math.sin(time * 3 * config.animationSpeed) * 6;
    rotation += Math.sin(time * 2 * config.animationSpeed) * 0.05;
  } else if (config.animationType === 'wobble') {
    const w = Math.sin(time * 7 * config.animationSpeed);
    scaleX *= 1 + 0.09 * w;
    scaleY *= 1 - 0.09 * w;
    rotation += w * 0.08;
  }

  ctx.save();
  ctx.translate(posX, posY);
  ctx.rotate(rotation);
  ctx.scale(scaleX, scaleY);

  const font = `900 68px ${config.fontFamily}, sans-serif`;
  ctx.font = font;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // 1. Neon Aura / Glow behind letter
  if (config.hasGlow || config.animationType === 'pulse') {
    const glowRadius = config.animationType === 'pulse' 
      ? 20 + 10 * Math.sin(time * 5)
      : 22;
    ctx.save();
    ctx.shadowColor = colorPreset.glow;
    ctx.shadowBlur = glowRadius;
    ctx.fillStyle = colorPreset.glow;
    ctx.fillText(char, 0, 0);
    ctx.fillText(char, 0, 0);
    ctx.restore();
  }

  // 2. Liquid Drips (like screenshot #2!)
  if (config.hasDrip || config.animationType === 'drip') {
    drawDrips(ctx, colorPreset, time, config.animationSpeed);
  }

  // 3. Thick 3D Outer Bevel / Outline
  ctx.lineWidth = 12;
  ctx.lineJoin = 'round';
  ctx.miterLimit = 2;
  ctx.strokeStyle = colorPreset.border;
  ctx.strokeText(char, 0, 0);

  // 4. Middle Stroke for 3D depth
  ctx.lineWidth = 7;
  ctx.strokeStyle = colorPreset.gradient[1];
  ctx.strokeText(char, 0, 0);

  // 5. Letter Fill Gradient (Bubble / Balloon effect)
  const letterGrad = ctx.createLinearGradient(0, -35, 0, 35);
  letterGrad.addColorStop(0, colorPreset.gradient[0]);
  letterGrad.addColorStop(1, colorPreset.gradient[1]);
  ctx.fillStyle = letterGrad;
  ctx.fillText(char, 0, 0);

  // 6. Glossy Balloon Reflection / Bevel
  if (config.hasGlossyBevel) {
    drawGlossyHighlights(ctx);
  }

  // 7. Sparkle & Shine Animation (like screenshot #1!)
  if (config.animationType === 'sparkle') {
    drawSparkleShine(ctx, time * config.animationSpeed);
  }

  ctx.restore();
}

// Procedural liquid drips running down from the letter
function drawDrips(
  ctx: CanvasRenderingContext2D,
  colorPreset: typeof COLOR_PRESETS[0],
  time: number,
  speed: number
) {
  ctx.save();
  ctx.fillStyle = colorPreset.border;

  // 3 drips at different offsets
  const drips = [
    { x: -12, baseY: 18, maxLen: 38, phase: 0 },
    { x: 3,   baseY: 22, maxLen: 50, phase: 1.8 },
    { x: 14,  baseY: 16, maxLen: 32, phase: 3.4 },
  ];

  drips.forEach((drip) => {
    // Droplet elongation cycle
    const cycle = (time * 1.8 * speed + drip.phase) % (Math.PI * 2);
    const dropProgress = (Math.sin(cycle) + 1) / 2; // 0..1
    const currentLen = drip.maxLen * (0.3 + 0.7 * dropProgress);

    // Drip body
    ctx.beginPath();
    ctx.moveTo(drip.x - 3.5, drip.baseY);
    ctx.lineTo(drip.x + 3.5, drip.baseY);
    ctx.lineTo(drip.x + 2, drip.baseY + currentLen);
    ctx.arc(drip.x, drip.baseY + currentLen, 4, 0, Math.PI);
    ctx.lineTo(drip.x - 2, drip.baseY + currentLen);
    ctx.closePath();
    ctx.fill();

    // Drip specular gloss
    ctx.beginPath();
    ctx.arc(drip.x - 1, drip.baseY + currentLen - 1, 1.5, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.fill();
    ctx.fillStyle = colorPreset.border;
  });

  ctx.restore();
}

// Organic glossy reflection across the bubble letter
function drawGlossyHighlights(ctx: CanvasRenderingContext2D) {
  ctx.save();
  ctx.clip(); // clip to text path if supported, or overlay specular curved pill
  
  // Curved white specular bubble shine
  ctx.beginPath();
  ctx.ellipse(-4, -16, 16, 8, -Math.PI / 6, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
  ctx.fill();

  // Secondary small specular dot
  ctx.beginPath();
  ctx.arc(14, -12, 3, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
  ctx.fill();

  ctx.restore();
}

// 4-pointed radiant sparkle traveling along the letter (like in screenshot 1)
function drawSparkleShine(ctx: CanvasRenderingContext2D, animTime: number) {
  const cycle = (animTime * 1.2) % 3; // 3 seconds loop
  
  // Only shines during first 1.8s of the cycle
  if (cycle > 2.0) return;

  const progress = cycle / 2.0;
  // Sparkle path along letter contour
  const sx = -18 + progress * 36;
  const sy = -22 + Math.sin(progress * Math.PI) * 12;
  const starScale = Math.sin(progress * Math.PI) * 1.3;

  if (starScale <= 0.05) return;

  ctx.save();
  ctx.translate(sx, sy);
  ctx.scale(starScale, starScale);

  // Radiant outer bloom
  const bloom = ctx.createRadialGradient(0, 0, 1, 0, 0, 18);
  bloom.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
  bloom.addColorStop(0.3, 'rgba(255, 230, 245, 0.8)');
  bloom.addColorStop(1, 'rgba(255, 200, 240, 0)');
  ctx.fillStyle = bloom;
  ctx.beginPath();
  ctx.arc(0, 0, 18, 0, Math.PI * 2);
  ctx.fill();

  // 4-pointed Diamond Star Rays
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  // Horizontal ray
  ctx.moveTo(-16, 0);
  ctx.quadraticCurveTo(0, 0, 0, -3);
  ctx.quadraticCurveTo(0, 0, 16, 0);
  ctx.quadraticCurveTo(0, 0, 0, 3);
  ctx.quadraticCurveTo(0, 0, -16, 0);
  ctx.fill();

  // Vertical ray
  ctx.beginPath();
  ctx.moveTo(0, -16);
  ctx.quadraticCurveTo(0, 0, -3, 0);
  ctx.quadraticCurveTo(0, 0, 0, 16);
  ctx.quadraticCurveTo(0, 0, 3, 0);
  ctx.quadraticCurveTo(0, 0, 0, -16);
  ctx.fill();

  // Diagonal mini glint
  ctx.rotate(Math.PI / 4);
  ctx.beginPath();
  ctx.moveTo(-7, 0);
  ctx.lineTo(7, 0);
  ctx.moveTo(0, -7);
  ctx.lineTo(0, 7);
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = '#ffffff';
  ctx.stroke();

  ctx.restore();
}

function drawStar(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  spikes: number,
  outerR: number,
  innerR: number
) {
  let rot = (Math.PI / 2) * 3;
  let x = cx;
  let y = cy;
  const step = Math.PI / spikes;

  ctx.beginPath();
  ctx.moveTo(cx, cy - outerR);
  for (let i = 0; i < spikes; i++) {
    x = cx + Math.cos(rot) * outerR;
    y = cy + Math.sin(rot) * outerR;
    ctx.lineTo(x, y);
    rot += step;

    x = cx + Math.cos(rot) * innerR;
    y = cy + Math.sin(rot) * innerR;
    ctx.lineTo(x, y);
    rot += step;
  }
  ctx.lineTo(cx, cy - outerR);
  ctx.closePath();
}
