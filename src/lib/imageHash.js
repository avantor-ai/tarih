/**
 * Суретті эталондық базамен салыстыру (перцептивті хэш).
 *
 * Неге керек: пайдаланушы телефонмен түсірген сурет эталоннан
 * жарығымен, бұрышымен, қиылуымен ерекшеленеді. Перцептивті хэш
 * дәл сол пикселдерді емес, суреттің жалпы құрылымын салыстырады.
 *
 * Эталондардың хэші браузерде, дәл сол код жолымен есептеледі —
 * сондықтан кітапхана айырмашылығынан туатын жылжу болмайды.
 */

// 16×16 = 256 бит. 64 биттік хэш ұқсас суреттерді ажырата алмай,
// дұрыс және қате сәйкестіктер бір диапазонға түсіп қалды.
const HASH_SIZE = 16
const DCT_SIZE = 32      // pHash үшін DCT матрицасының өлшемі
const BITS_D = HASH_SIZE * HASH_SIZE
const BITS_P = HASH_SIZE * HASH_SIZE - 1

/* ─────────────────  Суретті сұр шкалаға түсіру  ───────────────── */

/**
 * Суретті сұр шкалаға түсіру.
 *
 * Маңызды: сурет квадратқа ҚЫСЫЛМАЙДЫ, пропорциясы сақталып,
 * бос жері сұр өріспен толтырылады. Қысқанда 6:1 панорамалық
 * суреттер (эстампаждар, газет жолақтары) бір-біріне ұқсап кетеді.
 */
function drawToGray(img, outW, outH, crop = 1) {
  const canvas = document.createElement('canvas')
  canvas.width = outW
  canvas.height = outH
  const ctx = canvas.getContext('2d', { willReadFrequently: true })

  ctx.fillStyle = '#808080'
  ctx.fillRect(0, 0, outW, outH)

  const w = img.naturalWidth || img.width
  const h = img.naturalHeight || img.height
  const cw = w * crop
  const ch = h * crop
  const sx = (w - cw) / 2
  const sy = (h - ch) / 2

  // пропорцияны сақтап сыйдыру
  const scale = Math.min(outW / cw, outH / ch)
  const dw = cw * scale
  const dh = ch * scale
  ctx.drawImage(img, sx, sy, cw, ch, (outW - dw) / 2, (outH - dh) / 2, dw, dh)

  const { data } = ctx.getImageData(0, 0, outW, outH)
  const gray = new Float64Array(outW * outH)
  for (let i = 0; i < outW * outH; i++) {
    const r = data[i * 4], g = data[i * 4 + 1], b = data[i * 4 + 2]
    gray[i] = 0.299 * r + 0.587 * g + 0.114 * b
  }
  return gray
}

/* ───────────────────────────  dHash  ─────────────────────────── */

/** Көрші пикселдердің жарықтығын салыстырады — жарыққа төзімді */
function dHash(img, crop) {
  const w = HASH_SIZE + 1
  const gray = drawToGray(img, w, HASH_SIZE, crop)
  let bits = ''
  for (let y = 0; y < HASH_SIZE; y++) {
    for (let x = 0; x < HASH_SIZE; x++) {
      bits += gray[y * w + x] < gray[y * w + x + 1] ? '1' : '0'
    }
  }
  return bits
}

/* ───────────────────────────  pHash  ─────────────────────────── */

let COS_TABLE = null
function cosTable() {
  if (COS_TABLE) return COS_TABLE
  COS_TABLE = new Float64Array(DCT_SIZE * DCT_SIZE)
  for (let u = 0; u < DCT_SIZE; u++) {
    for (let x = 0; x < DCT_SIZE; x++) {
      COS_TABLE[u * DCT_SIZE + x] = Math.cos(((2 * x + 1) * u * Math.PI) / (2 * DCT_SIZE))
    }
  }
  return COS_TABLE
}

/** DCT-II арқылы төменгі жиілікті алады — қиюға және шуға төзімді */
function pHash(img, crop) {
  const gray = drawToGray(img, DCT_SIZE, DCT_SIZE, crop)
  const cos = cosTable()

  // жолдар бойынша DCT
  const rows = new Float64Array(DCT_SIZE * DCT_SIZE)
  for (let y = 0; y < DCT_SIZE; y++) {
    for (let u = 0; u < DCT_SIZE; u++) {
      let sum = 0
      for (let x = 0; x < DCT_SIZE; x++) sum += gray[y * DCT_SIZE + x] * cos[u * DCT_SIZE + x]
      rows[y * DCT_SIZE + u] = sum
    }
  }
  // бағандар бойынша DCT
  const dct = new Float64Array(DCT_SIZE * DCT_SIZE)
  for (let u = 0; u < DCT_SIZE; u++) {
    for (let v = 0; v < DCT_SIZE; v++) {
      let sum = 0
      for (let y = 0; y < DCT_SIZE; y++) sum += rows[y * DCT_SIZE + u] * cos[v * DCT_SIZE + y]
      dct[v * DCT_SIZE + u] = sum
    }
  }

  // сол жақ жоғарғы 8×8 (DC мүшесін алып тастаймыз)
  const vals = []
  for (let y = 0; y < HASH_SIZE; y++) {
    for (let x = 0; x < HASH_SIZE; x++) {
      if (x === 0 && y === 0) continue
      vals.push(dct[y * DCT_SIZE + x])
    }
  }
  const sorted = [...vals].sort((a, b) => a - b)
  const median = sorted[Math.floor(sorted.length / 2)]

  return vals.map((v) => (v > median ? '1' : '0')).join('')
}

/* ─────────────────────────  Салыстыру  ───────────────────────── */

export function hamming(a, b) {
  if (!a || !b || a.length !== b.length) return Infinity
  let d = 0
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) d++
  return d
}

/** Бір сурет үшін бірнеше қиылымда хэш жинағын есептеу */
export function fingerprint(img) {
  const crops = [1, 0.85, 0.7]
  const w = img.naturalWidth || img.width
  const h = img.naturalHeight || img.height
  return {
    d: crops.map((c) => dHash(img, c)),
    p: crops.map((c) => pHash(img, c)),
    // Кадр пропорциясы. Хэш үшін сурет квадратқа қысылады, сондықтан
    // ұзынша панорамалық суреттер бір-біріне ұқсап кетеді — пропорция
    // соларды ажыратады.
    ar: h > 0 ? w / h : 1,
  }
}

/** Екі саусақ ізінің ең жақын арақашықтығы */
export function distance(fpA, fpB) {
  let best = Infinity
  for (const a of fpA.d) for (const b of fpB.d) best = Math.min(best, hamming(a, b))
  let bestP = Infinity
  for (const a of fpA.p) for (const b of fpB.p) bestP = Math.min(bestP, hamming(a, b))
  // Пропорция айырмашылығына айыппұл
  const arA = fpA.ar || 1
  const arB = fpB.ar || 1
  const arPenalty = Math.min(0.22, Math.abs(Math.log(arA / arB)) * 0.2)

  // 0..1 аралығына келтіреміз — шек хэш ұзындығына тәуелді болмасын
  const dNorm = best / BITS_D
  const pNorm = bestP / BITS_P

  // pHash құрылымға, dHash жарыққа сезімтал
  const score = dNorm * 0.4 + pNorm * 0.6 + arPenalty
  return { d: dNorm, p: pNorm, ar: arPenalty, score }
}

/** Суретті жүктеу */
export function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('Суретті жүктеу мүмкін болмады: ' + src))
    img.src = src
  })
}

/** File нысанын суретке айналдыру */
export function fileToImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => loadImage(reader.result).then(resolve, reject)
    reader.onerror = () => reject(new Error('Файлды оқу мүмкін болмады'))
    reader.readAsDataURL(file)
  })
}

/**
 * Эталондық базаның саусақ іздерін құру (браузерде, бір рет).
 * localStorage-та сақталады — келесі ашқанда қайта есептелмейді.
 */
const CACHE_KEY = 'tas-jazular:fingerprints:v1'

export async function buildIndex(items, onProgress) {
  let cache = {}
  try { cache = JSON.parse(localStorage.getItem(CACHE_KEY) || '{}') } catch { cache = {} }

  const index = []
  for (let i = 0; i < items.length; i++) {
    const item = items[i]
    let fp = cache[item.id]
    if (!fp) {
      try {
        const img = await loadImage(item.image)
        fp = fingerprint(img)
        cache[item.id] = fp
      } catch (e) {
        console.warn('индекске қосылмады:', item.id, e.message)
        continue
      }
    }
    index.push({ item, fp })
    onProgress?.((i + 1) / items.length)
  }

  try { localStorage.setItem(CACHE_KEY, JSON.stringify(cache)) } catch { /* жады толы */ }
  return index
}

/**
 * Сұралған суретті базадан іздеу.
 * @returns {{item, score, confidence}|null}
 */
/**
 * Шек эмпирикалық түрде таңдалды (tests/match-calibration нәтижесі):
 *   дұрыс сәйкестік      0.16 – 0.30
 *   ең жақын бөтен сурет 0.31 – 0.47
 *   базада жоқ сурет     0.38 – 0.43
 */
export function findMatch(queryImg, index, threshold = 0.31) {
  const qfp = fingerprint(queryImg)

  const ranked = index
    .map(({ item, fp }) => ({ item, ...distance(qfp, fp) }))
    .sort((a, b) => a.score - b.score)

  if (!ranked.length) return null
  const best = ranked[0]
  const second = ranked[1]

  // Ең жақсы нәтиже екіншіден қаншалық алшақ тұр
  const gap = second ? second.score - best.score : 0.3

  const confidence = Math.max(0, Math.min(1,
    (1 - best.score / 0.45) * 0.65 + Math.min(gap / 0.12, 1) * 0.35
  ))

  // Табылды деп есептеу шарты: абсолют жақындық НЕМЕСЕ екінші орыннан
  // анық алшақ тұру (базада бұдан ұқсас сурет жоқ дегенді білдіреді).
  const matched =
    best.score <= threshold ||
    (gap >= 0.07 && best.score <= threshold * 1.5)

  return {
    item: best.item,
    score: best.score,
    gap,
    confidence,
    matched,
    runnerUp: second?.item ?? null,
  }
}

/* ────────────────  Серверге жіберер алдында кішірейту  ──────────────── */

/**
 * Суретті AI режиміне жіберер алдында кішірейтеді.
 *
 * Не́ге керек: Vercel serverless функциясының сұраныс денесіне қатаң шегі бар,
 * ал телефонның 12 Мп суреті base64-те одан оңай асып кетеді. Оның үстіне
 * үлкен сурет модельге де қымбат түседі, ал 1600 пикселден жоғары дәлдік
 * жазуды оқуға ештеңе қоспайды.
 *
 * @returns {Promise<{base64: string, mimeType: string, width: number, height: number}>}
 */
export function downscaleForUpload(img, maxSide = 1600, quality = 0.85) {
  const w = img.naturalWidth || img.width
  const h = img.naturalHeight || img.height
  const scale = Math.min(1, maxSide / Math.max(w, h))

  const canvas = document.createElement('canvas')
  canvas.width = Math.round(w * scale)
  canvas.height = Math.round(h * scale)

  const ctx = canvas.getContext('2d')
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height)

  const dataUrl = canvas.toDataURL('image/jpeg', quality)
  return {
    base64: dataUrl.split(',')[1],
    mimeType: 'image/jpeg',
    width: canvas.width,
    height: canvas.height,
  }
}
