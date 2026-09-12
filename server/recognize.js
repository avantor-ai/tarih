/**
 * Суреттен жазуды тану — ортақ логика.
 *
 * Бұл модульді екі жер де қолданады:
 *   - server/index.js  → жергілікті әзірлеу (Express)
 *   - api/*.js         → Vercel-дегі serverless функциялар
 * Сондықтан код бір жерде тұрады, екі рет жазылмайды.
 *
 * API кілті ЕШҚАШАН браузерге жіберілмейді — тек осы жақта оқылады.
 */

const PROVIDER = process.env.AI_PROVIDER || 'gemini'
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash'
const GEMINI_KEY = process.env.GEMINI_API_KEY

/**
 * AI режимін жариялы сайтта әдейі өшіріп қоюға болады.
 * Себебі: ашық тұрған сайтта кілтті кез келген адам жұмсай алады.
 * Vercel-де AI_ENABLED=true деп қойғанда ғана қосылады.
 */
const AI_ENABLED = process.env.AI_ENABLED !== 'false' && Boolean(GEMINI_KEY)

const MAX_IMAGE_BYTES = 6 * 1024 * 1024 // base64 күйіндегі шек

export const PROMPT = `Сен — көне түркі жазуы мен қазақ төте жазуын оқитын маман-эпиграфистсің.

Суреттегі жазуды талда. Жауапты ТЕК таза JSON түрінде бер, басқа мәтін қоспа:

{
  "script": "runic" | "tote" | "other",
  "confidence": 0.0-1.0,
  "signs": "суреттен көрген таңбалар (руника болса Unicode Old Turkic, төте болса араб әрпімен)",
  "latin": "латын транслитерациясы (руника үшін; төте болса бос жол)",
  "kazakh": "қазіргі қазақ тіліндегі оқылымы",
  "translation": "мағынасының қазақша аудармасы",
  "monument": "егер танымал ескерткіш болса, атауы; әйтпесе null",
  "notes": "оқуға кедергі болған жайттар (тозу, көлеңке, бұрыш) — қысқаша"
}

Маңызды ережелер:
- Көне түркі жазуы оңнан солға оқылады.
- Дауысты дыбыстар жиі жазылмайды — оларды қалпына келтіргеніңді "notes"-та айт.
- Егер анық оқи алмасаң, ойдан құрастырма: confidence-ті төмен қой және notes-та түсіндір.
- Егер суретте жазу мүлде болмаса: script="other", confidence=0.`

/* ─────────────────────────  Денсаулық  ───────────────────────── */

export function getHealth() {
  return {
    ok: true,
    provider: PROVIDER,
    aiReady: AI_ENABLED,
    model: GEMINI_MODEL,
    message: AI_ENABLED
      ? 'AI режимі дайын'
      : GEMINI_KEY
        ? 'AI режимі әдейі өшірілген (AI_ENABLED=false)'
        : 'API кілті табылмады — тек демо режимі жұмыс істейді',
  }
}

/* ─────────────────  Қарапайым жиілік шектеуі  ────────────────── */

// Serverless-те дана қайта іске қосылуы мүмкін, сондықтан бұл — абсолют
// қорғаныс емес, дөрекі теріс пайдаланудан сақтайтын бірінші тосқауыл.
const hits = new Map()
const WINDOW_MS = 60 * 60 * 1000
const MAX_PER_WINDOW = 30

export function rateLimit(ip) {
  const now = Date.now()
  const rec = hits.get(ip)
  if (!rec || now - rec.start > WINDOW_MS) {
    hits.set(ip, { start: now, count: 1 })
    return { allowed: true, remaining: MAX_PER_WINDOW - 1 }
  }
  rec.count += 1
  if (rec.count > MAX_PER_WINDOW) {
    return { allowed: false, retryAfterSec: Math.ceil((rec.start + WINDOW_MS - now) / 1000) }
  }
  return { allowed: true, remaining: MAX_PER_WINDOW - rec.count }
}

/* ────────────────────────  Танып оқу  ───────────────────────── */

/**
 * @param {{imageBase64: string, mimeType?: string}} input
 * @returns {Promise<{status: number, body: object}>}
 */
export async function recognize({ imageBase64, mimeType }) {
  if (!AI_ENABLED) {
    return {
      status: 503,
      body: {
        error: 'ai_disabled',
        message: getHealth().message,
      },
    }
  }

  if (!imageBase64) {
    return { status: 400, body: { error: 'no_image', message: 'Сурет жіберілмеді' } }
  }

  if (imageBase64.length > MAX_IMAGE_BYTES) {
    return {
      status: 413,
      body: {
        error: 'too_large',
        message: 'Сурет тым үлкен. Кішірейтіп қайта жіберіңіз.',
      },
    }
  }

  if (PROVIDER !== 'gemini') {
    return {
      status: 501,
      body: {
        error: 'unknown_provider',
        message: `AI_PROVIDER="${PROVIDER}" әлі қосылмаған. Қазір тек "gemini" бар.`,
      },
    }
  }

  return recognizeWithGemini({ imageBase64, mimeType })
}

async function recognizeWithGemini({ imageBase64, mimeType }) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_KEY}`

  let upstream
  try {
    upstream = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: PROMPT },
            { inline_data: { mime_type: mimeType || 'image/jpeg', data: imageBase64 } },
          ],
        }],
        generationConfig: { temperature: 0.2, responseMimeType: 'application/json' },
      }),
    })
  } catch (err) {
    return {
      status: 502,
      body: { error: 'network', message: 'Gemini-ге қосыла алмадық: ' + err.message },
    }
  }

  if (!upstream.ok) {
    const detail = await upstream.text().catch(() => '')
    console.error('Gemini қатесі:', upstream.status, detail.slice(0, 300))
    return {
      status: 502,
      body: {
        error: 'upstream',
        status: upstream.status,
        message: upstream.status === 429
          ? 'Gemini лимиті бітті — біраздан кейін қайталаңыз'
          : 'Gemini жауап бермеді',
      },
    }
  }

  const data = await upstream.json()
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? ''

  let parsed = null
  try {
    parsed = JSON.parse(text)
  } catch {
    const m = text.match(/\{[\s\S]*\}/)
    if (m) { try { parsed = JSON.parse(m[0]) } catch { /* қала берсін */ } }
  }

  if (!parsed) {
    return {
      status: 502,
      body: {
        error: 'parse',
        message: 'Модельдің жауабын оқу мүмкін болмады',
        raw: text.slice(0, 500),
      },
    }
  }

  return {
    status: 200,
    body: { ok: true, source: 'gemini', model: GEMINI_MODEL, result: parsed },
  }
}

/** Сұраныс жіберушінің IP-і (Vercel прокси арқылы келеді) */
export function clientIp(headers, fallback = 'unknown') {
  const fwd = headers['x-forwarded-for'] || headers['X-Forwarded-For']
  if (typeof fwd === 'string' && fwd.length) return fwd.split(',')[0].trim()
  return fallback
}
