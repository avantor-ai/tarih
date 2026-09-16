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

/**
 * Баптауларды МОДУЛЬ ЖҮКТЕЛГЕНДЕ емес, ШАҚЫРЫЛҒАНДА оқимыз.
 *
 * Не́ге: ES модульдерінде импорттар файлдағы кез келген кодтан бұрын
 * орындалады. Егер осы мәндерді модуль деңгейінде оқысақ, олар
 * server/index.js ішіндегі dotenv.config() жұмыс істемей тұрып оқылып,
 * кілт әрқашан бос болып шығады. Vercel-де айнымалылар процесс
 * басталғанға дейін қойылады, сондықтан ол жақта бәрібір.
 */
const cfg = () => ({
  provider: process.env.AI_PROVIDER || 'gemini',
  model: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
  key: process.env.GEMINI_API_KEY,
})

/**
 * AI режимін жариялы сайтта әдейі өшіріп қоюға болады.
 * Себебі: ашық тұрған сайтта кілтті кез келген адам жұмсай алады.
 */
const aiEnabled = () => process.env.AI_ENABLED !== 'false' && Boolean(cfg().key)

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
  const { provider, model, key } = cfg()
  const ready = aiEnabled()
  return {
    ok: true,
    provider,
    aiReady: ready,
    model,
    message: ready
      ? 'AI режимі дайын'
      : key
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
  if (!aiEnabled()) {
    return {
      status: 503,
      body: { error: 'ai_disabled', message: getHealth().message },
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

  const { provider } = cfg()
  if (provider !== 'gemini') {
    return {
      status: 501,
      body: {
        error: 'unknown_provider',
        message: `AI_PROVIDER="${provider}" әлі қосылмаған. Қазір тек "gemini" бар.`,
      },
    }
  }

  return recognizeWithGemini({ imageBase64, mimeType })
}

async function recognizeWithGemini({ imageBase64, mimeType }) {
  const { model, key } = cfg()
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`

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
        generationConfig: {
          temperature: 0.2,
          responseMimeType: 'application/json',
          maxOutputTokens: 4096,
          // Ойлану токендері де осы лимиттен алынады — шектемесек,
          // жауапқа орын қалмай, JSON үзіліп қалады.
          thinkingConfig: { thinkingBudget: 1024 },
        },
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
  const candidate = data?.candidates?.[0]
  const text = candidate?.content?.parts?.[0]?.text ?? ''

  if (candidate?.finishReason === 'MAX_TOKENS') {
    return {
      status: 502,
      body: { error: 'truncated', message: 'Жауап толық сыймады. Қайталап көріңіз.' },
    }
  }

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
    body: { ok: true, source: 'gemini', model, result: parsed },
  }
}

/** Сұраныс жіберушінің IP-і (Vercel прокси арқылы келеді) */
export function clientIp(headers, fallback = 'unknown') {
  const fwd = headers['x-forwarded-for'] || headers['X-Forwarded-For']
  if (typeof fwd === 'string' && fwd.length) return fwd.split(',')[0].trim()
  return fallback
}
