// make.fun entry: news-image-20261124
// "Sum up 24 November's world news in one image"
// Node 22, standard library only. Draws a 1024x1024 infographic poster
// (big date header, one hero market chart, four story panels, a ticker
// strip) with an embedded 5x7 bitmap font and a hand-rolled PNG encoder.
// No network, no files read, no randomness: running it twice writes
// byte-identical entry.png.
//
// Stories (all reported on Tuesday 24 November 2026):
//  1. Nvidia reinstates Jensen Huang as CEO after Trump's intervention;
//     Nvidia +31%, Nasdaq +6.5%, S&P +4.7%, Asia rallies.
//  2. COP31 fallout: 90+ nations reject a final text with no mention of
//     fossil fuels; EU blames Saudi pressure, Pacific states despair.
//  3. Russia warns Estonia its moves are "on the verge of triggering
//     open war"; NATO sends AWACS to Poland after Russian missiles
//     landed there; 25 Russian airspace violations in 2026.
//  4. Trump warns Iran of a "very traumatic" outcome if the nuclear
//     deal fails; US weighs a second carrier; UK logs record Iranian
//     attacks in the Strait of Hormuz.
//  5. Oregon and Virginia sue SpaceX over Grok's sexualised images,
//     including of children: the first state lawsuits of their kind.

import * as fs from "node:fs";
import * as path from "node:path";
import { deflateSync } from "node:zlib";

const W = 1024;
const H = 1024;

// ---------- palette ----------
const PAPER = [245, 240, 230];
const NAVY = [11, 30, 59];
const NAVY2 = [18, 41, 77];
const INK = [22, 34, 46];
const MUTED = [74, 90, 106];
const WHITE = [255, 255, 255];
const GREEN_BG = [11, 61, 46];
const GREEN = [14, 122, 77];
const LIGHT_GREEN = [55, 181, 122];
const YELLOW = [255, 197, 61];
const PALE_GREEN = [216, 234, 223];
const RED = [192, 57, 43];
const ORANGE = [230, 126, 34];
const BLUE = [31, 111, 235];
const PURPLE = [124, 58, 237];
const SAND = [242, 223, 178];
const SKY = [191, 224, 242];
const SEA = [30, 111, 168];
const STEEL = [120, 144, 166];

// ---------- canvas ----------
const px = new Uint8Array(W * H * 4);
for (let i = 0; i < W * H; i++) {
  px[i * 4] = PAPER[0];
  px[i * 4 + 1] = PAPER[1];
  px[i * 4 + 2] = PAPER[2];
  px[i * 4 + 3] = 255;
}

function setPixel(x: number, y: number, c: number[]): void {
  if (x < 0 || y < 0 || x >= W || y >= H) return;
  const o = (y * W + x) * 4;
  px[o] = c[0];
  px[o + 1] = c[1];
  px[o + 2] = c[2];
  px[o + 3] = 255;
}

function fillRect(x: number, y: number, w: number, h: number, c: number[]): void {
  const x0 = Math.max(0, Math.floor(x));
  const y0 = Math.max(0, Math.floor(y));
  const x1 = Math.min(W, Math.ceil(x + w));
  const y1 = Math.min(H, Math.ceil(y + h));
  for (let yy = y0; yy < y1; yy++) {
    for (let xx = x0; xx < x1; xx++) setPixel(xx, yy, c);
  }
}

function fillCircle(cx: number, cy: number, r: number, c: number[]): void {
  for (let yy = Math.floor(cy - r); yy <= Math.ceil(cy + r); yy++) {
    for (let xx = Math.floor(cx - r); xx <= Math.ceil(cx + r); xx++) {
      const dx = xx - cx;
      const dy = yy - cy;
      if (dx * dx + dy * dy <= r * r) setPixel(xx, yy, c);
    }
  }
}

function ring(cx: number, cy: number, r: number, t: number, c: number[]): void {
  for (let yy = Math.floor(cy - r - t); yy <= Math.ceil(cy + r + t); yy++) {
    for (let xx = Math.floor(cx - r - t); xx <= Math.ceil(cx + r + t); xx++) {
      const d = Math.sqrt((xx - cx) * (xx - cx) + (yy - cy) * (yy - cy));
      if (Math.abs(d - r) <= t / 2) setPixel(xx, yy, c);
    }
  }
}

function drawLine(x0: number, y0: number, x1: number, y1: number, t: number, c: number[]): void {
  const dx = x1 - x0;
  const dy = y1 - y0;
  const steps = Math.max(Math.abs(dx), Math.abs(dy), 1);
  for (let i = 0; i <= steps; i++) {
    const x = Math.round(x0 + (dx * i) / steps);
    const y = Math.round(y0 + (dy * i) / steps);
    fillCircle(x, y, Math.max(1, Math.floor(t / 2)), c);
  }
}

function fillPoly(points: number[][], c: number[]): void {
  let minY = Infinity;
  let maxY = -Infinity;
  for (const p of points) {
    minY = Math.min(minY, p[1]);
    maxY = Math.max(maxY, p[1]);
  }
  for (let y = Math.floor(minY); y <= Math.ceil(maxY); y++) {
    const xs: number[] = [];
    for (let i = 0; i < points.length; i++) {
      const a = points[i];
      const b = points[(i + 1) % points.length];
      if ((a[1] <= y && b[1] > y) || (b[1] <= y && a[1] > y)) {
        const t = (y - a[1]) / (b[1] - a[1]);
        xs.push(a[0] + t * (b[0] - a[0]));
      }
    }
    xs.sort((m, n) => m - n);
    for (let k = 0; k + 1 < xs.length; k += 2) {
      for (let x = Math.ceil(xs[k]); x <= Math.floor(xs[k + 1]); x++) setPixel(x, y, c);
    }
  }
}

// ---------- 5x7 bitmap font (A-Z, 0-9, punctuation) ----------
const FONT: Record<string, string[]> = {
  A: ["01110", "10001", "10001", "11111", "10001", "10001", "10001"],
  B: ["11110", "10001", "10001", "11110", "10001", "10001", "11110"],
  C: ["01110", "10001", "10000", "10000", "10000", "10001", "01110"],
  D: ["11110", "10001", "10001", "10001", "10001", "10001", "11110"],
  E: ["11111", "10000", "10000", "11110", "10000", "10000", "11111"],
  F: ["11111", "10000", "10000", "11110", "10000", "10000", "10000"],
  G: ["01110", "10001", "10000", "10111", "10001", "10001", "01111"],
  H: ["10001", "10001", "10001", "11111", "10001", "10001", "10001"],
  I: ["01110", "00100", "00100", "00100", "00100", "00100", "01110"],
  J: ["00111", "00010", "00010", "00010", "00010", "10010", "01100"],
  K: ["10001", "10010", "10100", "11000", "10100", "10010", "10001"],
  L: ["10000", "10000", "10000", "10000", "10000", "10000", "11111"],
  M: ["10001", "11011", "10101", "10101", "10001", "10001", "10001"],
  N: ["10001", "11001", "10101", "10011", "10001", "10001", "10001"],
  O: ["01110", "10001", "10001", "10001", "10001", "10001", "01110"],
  P: ["11110", "10001", "10001", "11110", "10000", "10000", "10000"],
  Q: ["01110", "10001", "10001", "10001", "10101", "10010", "01101"],
  R: ["11110", "10001", "10001", "11110", "10100", "10010", "10001"],
  S: ["01111", "10000", "10000", "01110", "00001", "00001", "11110"],
  T: ["11111", "00100", "00100", "00100", "00100", "00100", "00100"],
  U: ["10001", "10001", "10001", "10001", "10001", "10001", "01110"],
  V: ["10001", "10001", "10001", "10001", "10001", "01010", "00100"],
  W: ["10001", "10001", "10001", "10101", "10101", "11011", "10001"],
  X: ["10001", "10001", "01010", "00100", "01010", "10001", "10001"],
  Y: ["10001", "10001", "01010", "00100", "00100", "00100", "00100"],
  Z: ["11111", "00001", "00010", "00100", "01000", "10000", "11111"],
  "0": ["01110", "10001", "10011", "10101", "11001", "10001", "01110"],
  "1": ["00100", "01100", "00100", "00100", "00100", "00100", "01110"],
  "2": ["01110", "10001", "00001", "00110", "01000", "10000", "11111"],
  "3": ["11111", "00010", "00100", "00010", "00001", "10001", "01110"],
  "4": ["00010", "00110", "01010", "10010", "11111", "00010", "00010"],
  "5": ["11111", "10000", "11110", "00001", "00001", "10001", "01110"],
  "6": ["00110", "01000", "10000", "11110", "10001", "10001", "01110"],
  "7": ["11111", "00001", "00010", "00100", "01000", "01000", "01000"],
  "8": ["01110", "10001", "10001", "01110", "10001", "10001", "01110"],
  "9": ["01110", "10001", "10001", "01111", "00001", "00010", "01100"],
  " ": ["00000", "00000", "00000", "00000", "00000", "00000", "00000"],
  ".": ["00000", "00000", "00000", "00000", "00000", "01100", "01100"],
  ",": ["00000", "00000", "00000", "00000", "01100", "00100", "01000"],
  ":": ["00000", "01100", "01100", "00000", "01100", "01100", "00000"],
  ";": ["00000", "01100", "01100", "00000", "01100", "00100", "01000"],
  "!": ["00100", "00100", "00100", "00100", "00100", "00000", "00100"],
  "?": ["01110", "10001", "00001", "00110", "00100", "00000", "00100"],
  "'": ["00100", "00100", "01000", "00000", "00000", "00000", "00000"],
  "-": ["00000", "00000", "00000", "01110", "00000", "00000", "00000"],
  "/": ["00001", "00010", "00010", "00100", "01000", "01000", "10000"],
  "(": ["00010", "00100", "01000", "01000", "01000", "00100", "00010"],
  ")": ["01000", "00100", "00010", "00010", "00010", "00100", "01000"],
  "%": ["11001", "11010", "00010", "00100", "01000", "01011", "10011"],
  "+": ["00000", "00100", "00100", "01110", "00100", "00100", "00000"],
  "=": ["00000", "00000", "11111", "00000", "11111", "00000", "00000"],
  "&": ["01100", "10010", "10100", "01000", "10101", "10010", "01101"],
};

function textWidth(s: string, scale: number): number {
  return s.length * 6 * scale - scale;
}

function drawText(s: string, x: number, y: number, scale: number, c: number[]): void {
  // The embedded font is capitals only: normalise every string to upper
  // case here so a lower-case letter can never render as a "?" glyph.
  const text = s.toUpperCase();
  let cx = x;
  for (const ch of text) {
    const g = FONT[ch] ?? FONT["?"];
    for (let r = 0; r < 7; r++) {
      for (let col = 0; col < 5; col++) {
        if (g[r][col] === "1") fillRect(cx + col * scale, y + r * scale, scale, scale, c);
      }
    }
    cx += 6 * scale;
  }
}

function drawTextCentered(s: string, cx: number, y: number, scale: number, c: number[]): void {
  drawText(s, cx - Math.floor(textWidth(s, scale) / 2), y, scale, c);
}

function wrapText(s: string, maxWidth: number, scale: number): string[] {
  const words = s.split(" ");
  const lines: string[] = [];
  let cur = "";
  for (const w of words) {
    const test = cur === "" ? w : cur + " " + w;
    if (textWidth(test, scale) <= maxWidth) {
      cur = test;
    } else {
      if (cur !== "") lines.push(cur);
      cur = w;
    }
  }
  if (cur !== "") lines.push(cur);
  return lines;
}

// ---------- panels ----------
function panel(x: number, y: number, w: number, h: number, accent: number[]): void {
  fillRect(x, y, w, h, WHITE);
  fillRect(x, y, w, 8, accent);
  // thin border
  fillRect(x, y + h - 1, w, 1, STEEL);
  fillRect(x + w - 1, y, 1, h, STEEL);
  fillRect(x, y, 1, h, STEEL);
}

// ---------- pictograms ----------
function drawChart(x: number, y: number, w: number, h: number): void {
  // rising bars + trend line on the dark hero panel
  const base = y + h - 18;
  const tops = [0.62, 0.52, 0.58, 0.4, 0.3, 0.14];
  const bw = Math.floor((w - 20) / tops.length) - 10;
  const pts: number[][] = [];
  for (let i = 0; i < tops.length; i++) {
    const bx = x + 10 + i * (bw + 10);
    const bh = Math.floor((h - 40) * (1 - tops[i]));
    const top = base - bh;
    fillRect(bx, top, bw, bh, i === tops.length - 1 ? YELLOW : LIGHT_GREEN);
    pts.push([bx + Math.floor(bw / 2), top - 6]);
  }
  for (let i = 0; i + 1 < pts.length; i++) {
    drawLine(pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1], 5, WHITE);
  }
  const last = pts[pts.length - 1];
  fillPoly(
    [
      [last[0], last[1] - 16],
      [last[0] + 18, last[1] + 2],
      [last[0] - 2, last[1] + 6],
    ],
    WHITE
  );
  drawLine(x + 4, base, x + w - 4, base, 3, PALE_GREEN);
  drawText("+31%", x + 8, y + 2, 4, YELLOW);
}

function drawSunCrack(x: number, y: number, w: number, h: number): void {
  fillRect(x, y, w, h, SAND);
  fillCircle(x + Math.floor(w * 0.68), y + 30, 24, ORANGE);
  for (let a = 0; a < 8; a++) {
    const ang = (a * Math.PI) / 4;
    drawLine(
      x + Math.floor(w * 0.68) + Math.round(Math.cos(ang) * 30),
      y + 30 + Math.round(Math.sin(ang) * 30),
      x + Math.floor(w * 0.68) + Math.round(Math.cos(ang) * 42),
      y + 30 + Math.round(Math.sin(ang) * 42),
      4,
      ORANGE
    );
  }
  // cracked dry ground
  fillRect(x, y + h - 34, w, 34, [193, 154, 92]);
  drawLine(x + 8, y + h - 34, x + 30, y + h - 12, 3, [120, 82, 40]);
  drawLine(x + 30, y + h - 12, x + 22, y + h - 2, 3, [120, 82, 40]);
  drawLine(x + 58, y + h - 34, x + 70, y + h - 8, 3, [120, 82, 40]);
  drawLine(x + 70, y + h - 8, x + 92, y + h - 16, 3, [120, 82, 40]);
  drawLine(x + 100, y + h - 34, x + 112, y + h - 6, 3, [120, 82, 40]);
}

function drawRadar(x: number, y: number, w: number, h: number): void {
  fillRect(x, y, w, h, NAVY2);
  const cx = x + Math.floor(w / 2);
  const cy = y + Math.floor(h / 2) + 6;
  ring(cx, cy, 44, 3, LIGHT_GREEN);
  ring(cx, cy, 28, 2, LIGHT_GREEN);
  fillCircle(cx, cy, 4, LIGHT_GREEN);
  drawLine(cx, cy, cx + 38, cy - 26, 3, YELLOW);
  fillCircle(cx + 24, cy - 16, 4, YELLOW);
  fillCircle(cx - 18, cy + 10, 4, RED);
  fillCircle(cx + 8, cy + 22, 4, WHITE);
  // two jets above the radar
  fillPoly(
    [
      [x + 8, y + 14],
      [x + 30, y + 14],
      [x + 19, y + 26],
    ],
    WHITE
  );
  fillPoly(
    [
      [x + w - 30, y + 6],
      [x + w - 8, y + 6],
      [x + w - 19, y + 18],
    ],
    WHITE
  );
}

function drawTanker(x: number, y: number, w: number, h: number): void {
  fillRect(x, y, w, h, SKY);
  // sea
  fillRect(x, y + h - 26, w, 26, SEA);
  drawLine(x + 4, y + h - 20, x + 30, y + h - 20, 2, WHITE);
  drawLine(x + 44, y + h - 14, x + 78, y + h - 14, 2, WHITE);
  drawLine(x + 90, y + h - 20, x + 118, y + h - 20, 2, WHITE);
  // tanker hull
  fillRect(x + 10, y + 52, w - 20, 22, INK);
  fillPoly(
    [
      [x + w - 10, y + 52],
      [x + w - 2, y + 62],
      [x + w - 10, y + 74],
    ],
    INK
  );
  fillRect(x + 18, y + 30, 16, 22, INK);
  fillRect(x + 38, y + 40, 34, 12, RED);
  fillRect(x + 76, y + 40, 34, 12, YELLOW);
  // warning triangle
  const tx = x + Math.floor(w / 2);
  fillPoly(
    [
      [tx, y + 2],
      [tx - 16, y + 30],
      [tx + 16, y + 30],
    ],
    YELLOW
  );
  drawText("!", tx - 3, y + 10, 2, INK);
}

function drawPhone(x: number, y: number, w: number, h: number): void {
  fillRect(x, y, w, h, [232, 228, 245]);
  // phone
  fillRect(x + 28, y + 6, 66, h - 12, INK);
  fillRect(x + 34, y + 12, 54, h - 30, WHITE);
  // chat bubble with three dots
  fillRect(x + 40, y + 22, 42, 26, PURPLE);
  fillPoly(
    [
      [x + 44, y + 48],
      [x + 52, y + 48],
      [x + 44, y + 58],
    ],
    PURPLE
  );
  fillCircle(x + 48, y + 35, 3, WHITE);
  fillCircle(x + 58, y + 35, 3, WHITE);
  fillCircle(x + 68, y + 35, 3, WHITE);
  // gavel below the screen
  drawLine(x + 36, y + h - 22, x + 84, y + h - 22, 5, [139, 94, 52]);
  fillRect(x + 56, y + h - 32, 22, 12, [139, 94, 52]);
  // red warning badge
  fillCircle(x + w - 22, y + 16, 15, RED);
  drawText("!", x + w - 26, y + 6, 3, WHITE);
}

// ---------- layout ----------
// Header: full-bleed navy banner naming the day.
fillRect(0, 0, W, 118, NAVY);
drawTextCentered("THE WORLD IN ONE DAY", W / 2, 16, 4, YELLOW);
drawTextCentered("TUESDAY 24 NOVEMBER 2026", W / 2, 52, 6, WHITE);

// Hero panel: Nvidia / Huang market rally.
fillRect(24, 134, 976, 296, GREEN_BG);
drawText("MARKETS  -  TECH", 48, 156, 3, YELLOW);
drawText("HUANG IS BACK", 48, 190, 6, WHITE);
drawText("NVIDIA +31%", 48, 244, 6, YELLOW);
drawText("Trump pressed the board to", 48, 306, 3, PALE_GREEN);
drawText("reinstate the fired CEO.", 48, 332, 3, PALE_GREEN);
drawText("Nasdaq +6.5%, S&P +4.7%.", 48, 358, 3, PALE_GREEN);
drawText("Seoul +6%, Nikkei +3.9%.", 48, 384, 3, PALE_GREEN);
drawChart(620, 150, 356, 264);

// Row 2, panel A: COP31 fallout.
panel(24, 446, 480, 240, ORANGE);
drawText("CLIMATE  -  ANTALYA", 48, 462, 3, ORANGE);
drawText("COP31 FALLOUT:", 48, 490, 4, INK);
drawText("90 NATIONS SAY NO", 48, 522, 4, INK);
wrapText("Nations reject a text with no fossil fuels. EU blames Saudi pressure.", 312, 3).forEach((line, i) => {
  drawText(line, 48, 566 + i * 22, 3, MUTED);
});
drawSunCrack(360, 566, 120, 108);

// Row 2, panel B: NATO / Estonia.
panel(528, 446, 480, 240, BLUE);
drawText("NATO  -  EASTERN EDGE", 552, 462, 3, BLUE);
drawText("RUSSIA: ESTONIA", 552, 490, 4, INK);
drawText("NEARS OPEN WAR", 552, 522, 4, INK);
wrapText("25 airspace violations in 2026. NATO sends AWACS to Poland.", 312, 3).forEach((line, i) => {
  drawText(line, 552, 566 + i * 22, 3, MUTED);
});
drawRadar(864, 566, 120, 108);

// Row 3, panel C: Trump / Iran / Hormuz.
panel(24, 702, 480, 200, RED);
drawText("MIDDLE EAST  -  IRAN", 48, 716, 3, RED);
drawText("TRUMP WARNS IRAN:", 48, 744, 4, INK);
drawText("'VERY TRAUMATIC'", 48, 776, 4, INK);
wrapText("Trump: deal or trauma. Iran attacks in Hormuz hit record.", 312, 3).forEach((line, i) => {
  drawText(line, 48, 814 + i * 20, 3, MUTED);
});
drawTanker(360, 812, 120, 78);

// Row 3, panel D: Grok lawsuits.
panel(528, 702, 480, 200, PURPLE);
drawText("TECH  -  US COURTS", 552, 716, 3, PURPLE);
drawText("TWO STATES SUE", 552, 744, 4, INK);
drawText("SPACEX OVER GROK", 552, 776, 4, INK);
wrapText("Oregon, Virginia sue over Grok's sexual images of children.", 312, 3).forEach((line, i) => {
  drawText(line, 552, 814 + i * 20, 3, MUTED);
});
drawPhone(864, 812, 120, 78);

// Ticker strip: the rest of the day.
fillRect(24, 918, 976, 82, NAVY);
const ticker =
  "ALSO: GAZA STRIKES KILL 3, INCL. UN WORKER - NEPAL QUAKE 5.6 - " +
  "14 NATIONS BACK ICJ RULING - UN SEEKS LIBYA PROBE - " +
  "UN: AI RULES IN A YEAR";
const tickerLines = wrapText(ticker, 928, 3);
tickerLines.forEach((line, i) => {
  drawText(line, 48, 928 + i * 23, 3, WHITE);
});

// ---------- PNG encode ----------
function crc32(buf: Buffer): number {
  let table: number[] | null = (crc32 as unknown as { t?: number[] }).t ?? null;
  if (!table) {
    table = [];
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      table[n] = c >>> 0;
    }
    (crc32 as unknown as { t: number[] }).t = table;
  }
  let c = 0xffffffff;
  for (const b of buf) c = table[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type: string, data: Buffer): Buffer {
  const out = Buffer.alloc(12 + data.length);
  out.writeUInt32BE(data.length, 0);
  out.write(type, 4, "ascii");
  data.copy(out, 8);
  const crc = crc32(Buffer.concat([Buffer.from(type, "ascii"), data]));
  out.writeUInt32BE(crc, 8 + data.length);
  return out;
}

function encodePNG(): Buffer {
  const raw = Buffer.alloc(H * (1 + W * 3));
  for (let y = 0; y < H; y++) {
    raw[y * (1 + W * 3)] = 0;
    for (let x = 0; x < W; x++) {
      const s = (y * W + x) * 4;
      const d = y * (1 + W * 3) + 1 + x * 3;
      raw[d] = px[s];
      raw[d + 1] = px[s + 1];
      raw[d + 2] = px[s + 2];
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(W, 0);
  ihdr.writeUInt32BE(H, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // colour type RGB
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;
  const idat = deflateSync(raw, { level: 9 });
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", idat),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? "/output";
fs.mkdirSync(outDir, { recursive: true });
const outPath = path.join(outDir, "entry.png");
fs.writeFileSync(outPath, encodePNG());
console.log("wrote " + outPath);
