/**
 * Процедуралық текстуралар: тас беті және оған қашалған руникалық жазу.
 * Дайын сурет файлы қажет емес — бәрі кодпен салынады.
 */

import * as THREE from 'three'

/* ───────────────────  Шу генераторы (fBm)  ─────────────────── */

function makeNoise(seed = 1) {
  let s = seed
  const rnd = () => {
    s = (s * 16807) % 2147483647
    return (s - 1) / 2147483646
  }
  const perm = new Uint8Array(512)
  const p = Array.from({ length: 256 }, (_, i) => i)
  for (let i = 255; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1))
    ;[p[i], p[j]] = [p[j], p[i]]
  }
  for (let i = 0; i < 512; i++) perm[i] = p[i & 255]

  const fade = (t) => t * t * t * (t * (t * 6 - 15) + 10)
  const lerp = (a, b, t) => a + t * (b - a)
  const grad = (h, x, y) => {
    const u = h & 1 ? x : -x
    const v = h & 2 ? y : -y
    return u + v
  }

  const noise2 = (x, y) => {
    const X = Math.floor(x) & 255
    const Y = Math.floor(y) & 255
    const xf = x - Math.floor(x)
    const yf = y - Math.floor(y)
    const u = fade(xf)
    const v = fade(yf)
    const aa = perm[perm[X] + Y]
    const ab = perm[perm[X] + Y + 1]
    const ba = perm[perm[X + 1] + Y]
    const bb = perm[perm[X + 1] + Y + 1]
    return lerp(
      lerp(grad(aa, xf, yf), grad(ba, xf - 1, yf), u),
      lerp(grad(ab, xf, yf - 1), grad(bb, xf - 1, yf - 1), u),
      v
    )
  }

  return (x, y, octaves = 5) => {
    let sum = 0, amp = 1, freq = 1, norm = 0
    for (let i = 0; i < octaves; i++) {
      sum += noise2(x * freq, y * freq) * amp
      norm += amp
      amp *= 0.5
      freq *= 2
    }
    return sum / norm
  }
}

/* ─────────────────────  Тас беті  ───────────────────── */

/**
 * Гранит тас текстурасы.
 * @returns {{color: HTMLCanvasElement, height: HTMLCanvasElement}}
 */
export function makeStoneCanvas(w = 1024, h = 2048, seed = 7) {
  const noise = makeNoise(seed)

  const color = document.createElement('canvas')
  color.width = w; color.height = h
  const cctx = color.getContext('2d')
  const cimg = cctx.createImageData(w, h)

  const height = document.createElement('canvas')
  height.width = w; height.height = h
  const hctx = height.getContext('2d')
  const himg = hctx.createImageData(w, h)

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4
      const nx = x / w * 8
      const ny = y / h * 16

      // ірі дақтар + ұсақ түйіршік
      const big = noise(nx, ny, 5) * 0.5 + 0.5
      const fine = noise(nx * 9, ny * 9, 3) * 0.5 + 0.5
      const grain = Math.random() * 0.09

      const v = big * 0.62 + fine * 0.28 + grain

      // сұр-қоңыр гранит реңкі
      const r = 134 + v * 88
      const g = 127 + v * 82
      const b = 112 + v * 72

      cimg.data[i] = r
      cimg.data[i + 1] = g
      cimg.data[i + 2] = b
      cimg.data[i + 3] = 255

      const hv = Math.floor(v * 255)
      himg.data[i] = hv
      himg.data[i + 1] = hv
      himg.data[i + 2] = hv
      himg.data[i + 3] = 255
    }
  }

  cctx.putImageData(cimg, 0, 0)
  hctx.putImageData(himg, 0, 0)

  // тастағы жарықшақтар
  cctx.strokeStyle = 'rgba(40,34,26,0.34)'
  hctx.strokeStyle = 'rgba(0,0,0,0.55)'
  for (let k = 0; k < 14; k++) {
    const x0 = Math.random() * w
    const y0 = Math.random() * h
    cctx.beginPath(); hctx.beginPath()
    cctx.moveTo(x0, y0); hctx.moveTo(x0, y0)
    let x = x0, y = y0
    const steps = 8 + Math.floor(Math.random() * 14)
    for (let s = 0; s < steps; s++) {
      x += (Math.random() - 0.5) * 90
      y += Math.random() * 80
      cctx.lineTo(x, y); hctx.lineTo(x, y)
    }
    const lw = 0.6 + Math.random() * 1.8
    cctx.lineWidth = lw; hctx.lineWidth = lw
    cctx.stroke(); hctx.stroke()
  }

  return { color, height }
}

/* ─────────────────  Қашалған руникалық жазу  ───────────────── */

const RUNIC_LINES = [
  '𐱅𐰭𐰼𐰃𐱅𐰏𐱅𐰭𐰼𐰃𐰓𐰀𐰉𐰆𐰞𐰢𐱁𐱅𐰇𐰼𐰚𐰋𐰃𐰠𐰏𐰀𐴴',
  '𐰴𐰍𐰣𐰉𐰆𐰇𐰓𐰚𐰀𐰆𐰞𐰺𐱅𐰢𐰽𐰉𐰢𐰃𐰤',
  '𐰚𐰇𐰠𐱅𐰏𐰤𐰢𐰤𐰆𐰍𐰞𐰢𐰉𐰆𐰑𐰣𐰢',
  '𐱅𐰇𐰼𐰚𐰉𐰆𐰑𐰣𐰃𐰠𐰃𐰤𐱅𐰇𐰼𐰇𐰤',
  '𐰋𐰃𐰠𐰏𐰀𐱅𐰆𐰪𐰸𐰸𐰋𐰤𐰇𐰔𐰢',
  '𐰅𐰲𐰢𐰔𐰀𐰯𐰢𐰔𐰖𐰢𐰃𐰴𐰍𐰣',
  '𐰸𐰺𐰍𐰔𐰆𐰍𐰞𐰢𐰢𐰤',
  '𐰅𐰠𐰢𐰀𐰸𐰆𐰑𐰢𐰀𐰀𐰑𐰺𐰃𐰠𐱅𐰢',
]

/** Руникалық қаріптің жүктелуін күту */
export async function ensureRunicFont() {
  if (!document.fonts) return false
  try {
    await document.fonts.load('72px "Noto Sans Old Turkic"')
    await document.fonts.ready
    return document.fonts.check('72px "Noto Sans Old Turkic"')
  } catch {
    return false
  }
}

/**
 * Тас бетіне қашалған жазу маскасы.
 * Орхон жазуы тік бағандармен, жоғарыдан төмен қарай жазылған.
 * @returns {HTMLCanvasElement} ақ = ойық, қара = тегіс
 */
export function makeRunesCanvas(w = 1024, h = 2048, hasFont = true) {
  const c = document.createElement('canvas')
  c.width = w; c.height = h
  const ctx = c.getContext('2d')

  ctx.fillStyle = '#000'
  ctx.fillRect(0, 0, w, h)

  const size = Math.round(w / 15)
  ctx.fillStyle = '#fff'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.font = hasFont
    ? `${size}px "Noto Sans Old Turkic"`
    : `${size}px monospace`

  const columns = 7
  const colWidth = w / (columns + 1.6)
  const topPad = h * 0.135

  for (let col = 0; col < columns; col++) {
    // бағандар оңнан солға
    const x = w - colWidth * (col + 1.15)
    const line = RUNIC_LINES[col % RUNIC_LINES.length]
    const glyphs = [...line]
    const step = size * 1.28
    const maxGlyphs = Math.floor((h - topPad * 1.7) / step)

    for (let i = 0; i < Math.min(glyphs.length, maxGlyphs); i++) {
      const y = topPad + i * step
      // қашау тереңдігінің табиғи ауытқуы
      ctx.globalAlpha = 0.72 + Math.random() * 0.28
      ctx.fillText(glyphs[i], x + (Math.random() - 0.5) * 2.5, y)
    }
  }
  ctx.globalAlpha = 1

  // жоғарғы жағындағы қағанат таңбасы (тамға)
  drawTamga(ctx, w / 2, h * 0.072, w * 0.075)

  // жиектегі жақтау сызығы
  ctx.strokeStyle = 'rgba(255,255,255,0.42)'
  ctx.lineWidth = 3.5
  ctx.strokeRect(w * 0.055, h * 0.108, w * 0.89, h * 0.855)

  // тозу: кейбір жерлерді өшіру
  ctx.globalCompositeOperation = 'destination-out'
  for (let i = 0; i < 26; i++) {
    const x = Math.random() * w
    const y = topPad + Math.random() * (h - topPad)
    const r = 14 + Math.random() * 62
    const g = ctx.createRadialGradient(x, y, 0, x, y, r)
    g.addColorStop(0, 'rgba(0,0,0,0.92)')
    g.addColorStop(1, 'rgba(0,0,0,0)')
    ctx.fillStyle = g
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill()
  }
  ctx.globalCompositeOperation = 'source-over'

  return c
}

/** Түркі қағанатының таңбасы */
function drawTamga(ctx, cx, cy, r) {
  ctx.save()
  ctx.strokeStyle = '#fff'
  ctx.lineWidth = r * 0.2
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.beginPath()
  ctx.moveTo(cx - r * 0.75, cy + r * 0.6)
  ctx.lineTo(cx - r * 0.75, cy - r * 0.25)
  ctx.quadraticCurveTo(cx, cy - r * 1.25, cx + r * 0.75, cy - r * 0.25)
  ctx.lineTo(cx + r * 0.75, cy + r * 0.6)
  ctx.stroke()
  ctx.beginPath()
  ctx.moveTo(cx, cy - r * 0.72)
  ctx.lineTo(cx, cy + r * 0.62)
  ctx.stroke()
  ctx.restore()
}

/* ─────────────────  Текстураларды құрастыру  ───────────────── */

/**
 * Тас + жазу біріктірілген материал текстуралары.
 * @returns {{map, bumpMap, roughnessMap}}
 */
export function buildStelaTextures({ hasFont = true, w = 1024, h = 2048 } = {}) {
  const stone = makeStoneCanvas(w, h)
  const runes = makeRunesCanvas(w, h, hasFont)

  // ── түс картасы: тас + жазудың көлеңкесі ──
  const colorC = document.createElement('canvas')
  colorC.width = w; colorC.height = h
  const cctx = colorC.getContext('2d')
  cctx.drawImage(stone.color, 0, 0)
  cctx.globalAlpha = 0.5
  cctx.globalCompositeOperation = 'multiply'
  // жазуды инверттеп қараңғылаймыз (ойық жер көлеңкелі)
  const inv = document.createElement('canvas')
  inv.width = w; inv.height = h
  const ictx = inv.getContext('2d')
  ictx.fillStyle = '#fff'; ictx.fillRect(0, 0, w, h)
  ictx.globalCompositeOperation = 'difference'
  ictx.drawImage(runes, 0, 0)
  cctx.drawImage(inv, 0, 0)
  cctx.globalAlpha = 1
  cctx.globalCompositeOperation = 'source-over'

  // ── бедер картасы: тас бедері + қашалған ойық ──
  const bumpC = document.createElement('canvas')
  bumpC.width = w; bumpC.height = h
  const bctx = bumpC.getContext('2d')
  bctx.drawImage(stone.height, 0, 0)
  bctx.globalCompositeOperation = 'multiply'
  bctx.drawImage(inv, 0, 0)
  bctx.globalCompositeOperation = 'source-over'

  const mk = (canvas) => {
    const t = new THREE.CanvasTexture(canvas)
    t.colorSpace = THREE.SRGBColorSpace
    t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping
    t.anisotropy = 8
    return t
  }

  const map = mk(colorC)
  const bump = new THREE.CanvasTexture(bumpC)
  bump.anisotropy = 8

  return { map, bumpMap: bump, roughnessMap: bump }
}
