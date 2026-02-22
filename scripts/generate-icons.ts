import { createCanvas, type SKRSContext2D } from '@napi-rs/canvas';
import { writeFileSync } from 'fs';
import { resolve } from 'path';

const ASSETS_DIR = resolve(__dirname, '../assets/images');

// Brand colors
const PRIMARY = '#E74C3C';
const PRIMARY_LIGHT = '#F05A4D';
const BG_DARK = '#1A1A2E';

/**
 * Chat bubble + claw marks dizaynini chizish
 * Bubble: rounded rectangle + pastda chapda tail
 * Ichida: 3 ta diagonal claw scratch
 */
function drawChatClawIcon(
  ctx: SKRSContext2D,
  size: number,
  padding: number,
) {
  const cx = size / 2;
  const cy = size / 2;
  const scale = (size - padding * 2) / 800; // 800 = base design size

  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(scale, scale);

  // === Chat Bubble ===
  const bw = 560; // bubble width
  const bh = 420; // bubble height
  const br = 80;  // corner radius
  const bx = -bw / 2;
  const by = -bh / 2 - 20; // slightly up to make room for tail

  // Bubble body (rounded rect)
  ctx.beginPath();
  ctx.moveTo(bx + br, by);
  ctx.lineTo(bx + bw - br, by);
  ctx.quadraticCurveTo(bx + bw, by, bx + bw, by + br);
  ctx.lineTo(bx + bw, by + bh - br);
  ctx.quadraticCurveTo(bx + bw, by + bh, bx + bw - br, by + bh);

  // Bottom edge with tail
  ctx.lineTo(bx + 160, by + bh);
  // Tail going down-left
  ctx.lineTo(bx + 80, by + bh + 80);
  // Back to bubble bottom
  ctx.lineTo(bx + 100, by + bh);

  ctx.lineTo(bx + br, by + bh);
  ctx.quadraticCurveTo(bx, by + bh, bx, by + bh - br);
  ctx.lineTo(bx, by + br);
  ctx.quadraticCurveTo(bx, by, bx + br, by);
  ctx.closePath();

  ctx.fillStyle = PRIMARY;
  ctx.fill();

  // Subtle highlight on top edge
  ctx.save();
  ctx.clip();
  const hlGrad = ctx.createLinearGradient(0, by, 0, by + 60);
  hlGrad.addColorStop(0, 'rgba(255,255,255,0.15)');
  hlGrad.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = hlGrad;
  ctx.fillRect(bx, by, bw, 60);
  ctx.restore();

  // === Claw Marks (3 diagonal scratches inside bubble) ===
  drawClawMarks(ctx);

  ctx.restore();
}

/**
 * 3 ta diagonal claw scratch chizish
 * Har bir scratch — qalin o'rtasi, ingichka uchlari bilan tapered line
 */
function drawClawMarks(ctx: SKRSContext2D) {
  const marks = [
    { offsetX: -100, offsetY: 0 },
    { offsetX: 0, offsetY: 0 },
    { offsetX: 100, offsetY: 0 },
  ];

  for (const mark of marks) {
    drawSingleClaw(ctx, mark.offsetX, mark.offsetY - 20);
  }
}

function drawSingleClaw(ctx: SKRSContext2D, ox: number, oy: number) {
  const length = 280;
  const maxWidth = 48;
  const tipWidth = 6;

  // Claw goes from top-left to bottom-right, with organic curve
  const startX = ox - length * 0.42;
  const startY = oy - length * 0.42;
  const endX = ox + length * 0.42;
  const endY = oy + length * 0.42;

  // Control point for curve
  const cpx = ox + 20;
  const cpy = oy - 20;

  // Draw as a filled tapered shape — thick in the middle, thin at tips
  ctx.beginPath();

  // Top-left tip (narrow start)
  ctx.moveTo(startX, startY);

  // Left edge curving to bottom-right (widening via control point offset)
  ctx.bezierCurveTo(
    cpx - maxWidth * 0.6, cpy - maxWidth * 0.3,
    cpx - maxWidth * 0.2, cpy + maxWidth * 0.1,
    endX, endY,
  );

  // Small tip at end
  ctx.lineTo(endX + tipWidth, endY + tipWidth);

  // Right edge curving back to top-left (creating width)
  ctx.bezierCurveTo(
    cpx + maxWidth * 0.6, cpy + maxWidth * 0.5,
    cpx + maxWidth * 0.3, cpy - maxWidth * 0.1,
    startX + tipWidth, startY + tipWidth,
  );

  ctx.closePath();

  // Dark color for scratches (strong contrast against red bubble)
  ctx.fillStyle = BG_DARK;
  ctx.fill();
}

/**
 * Icon generatsiya qilish
 */
function generateIcon(
  size: number,
  background: 'solid' | 'transparent',
  outputName: string,
  paddingRatio: number = 0.1,
) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');

  // Background
  if (background === 'solid') {
    // Radial gradient for subtle depth
    const grad = ctx.createRadialGradient(
      size / 2, size / 2, 0,
      size / 2, size / 2, size * 0.7,
    );
    grad.addColorStop(0, '#1F1F35');
    grad.addColorStop(1, BG_DARK);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);
  }

  const padding = size * paddingRatio;
  drawChatClawIcon(ctx, size, padding);

  const buffer = canvas.toBuffer('image/png');
  const outputPath = resolve(ASSETS_DIR, outputName);
  writeFileSync(outputPath, buffer);
  console.log(`✓ ${outputName} (${size}x${size})`);
}

// === Generate all icons ===
console.log('OpenClaw icon generatsiya boshlanmoqda...\n');

// iOS app icon — 1024x1024 with solid background
generateIcon(1024, 'solid', 'icon.png', 0.1);

// Android adaptive icon foreground — transparent, design in safe zone (66%)
// Extra padding to keep within the 66% safe zone
generateIcon(1024, 'transparent', 'adaptive-icon.png', 0.18);

// Splash screen icon — 512x512, transparent
generateIcon(512, 'transparent', 'splash-icon.png', 0.08);

// Favicon — 48x48, solid background, less padding
generateIcon(48, 'solid', 'favicon.png', 0.06);

console.log('\nBarcha iconlar muvaffaqiyatli generatsiya qilindi!');
