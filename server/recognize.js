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
import { msg, normLang, answerLanguageRule } from './i18n.js'
import { claudeVisionJSON, claudeModel, claudeKey, RecognizeSchema } from './claude.js'

/** Провайдер: AI_PROVIDER=anthropic (Claude) немесе gemini (әдепкі) */
const cfg = () => {
  const provider = process.env.AI_PROVIDER || 'gemini'
  if (provider === 'anthropic') return { provider, model: claudeModel(), key: claudeKey() }
  return {
    provider,
    model: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
    key: process.env.GEMINI_API_KEY,
  }
}

/**
 * AI режимін жариялы сайтта әдейі өшіріп қоюға болады.
 * Себебі: ашық тұрған сайтта кілтті кез келген адам жұмсай алады.
 */
const aiEnabled = () => process.env.AI_ENABLED !== 'false' && Boolean(cfg().key)

const MAX_IMAGE_BYTES = 6 * 1024 * 1024 // base64 күйіндегі шек

export const PROMPT_KK = `Сен — көне түркі жазуын, қазақ төте жазуын және шағатай (түркі) тіліндегі
араб графикалы құжаттарды оқитын маман-эпиграфист әрі палеографсың.

Суреттегі жазуды талда. Жауапты ТЕК таза JSON түрінде бер, басқа мәтін қоспа:

{
  "script": "runic" | "tote" | "chagatai" | "other",
  "confidence": 0.0-1.0,
  "signs": "суреттен көрген таңбалар (руника болса Unicode Old Turkic, төте/шағатай болса араб әрпімен; шағатайда — алғашқы 1-2 жол)",
  "latin": "латын транслитерациясы (руника үшін; басқа жазуда бос жол)",
  "transcription": "тек шағатай үшін: мәтіннің толық оқылымы қазақ кириллицасымен (төмендегі үлгі бойынша); басқа жазуда бос жол",
  "kazakh": "қазіргі қазақ тіліндегі оқылымы (руника мен төте үшін; шағатайда бос жол)",
  "translation": "мағынасының қазақша аудармасы (шағатайда — толық мәтіннің аудармасы)",
  "monument": "егер танымал ескерткіш немесе құжат болса, атауы; әйтпесе null",
  "notes": "оқуға кедергі болған жайттар (тозу, көлеңке, бұрыш) — қысқаша"
}

Жазуды қалай ажыратасың:
- Төте жазу (Байтұрсынұлы, 1912–1929): қазақ тілі, дауыстылар толық жазылады,
  жіңішке сөзде басында дәйекші (ٴ) тұрады, ث ح ذ ص ض ط ظ ع әріптері жоқтың қасы.
- Шағатай (XV–XIX ғ., қазақ хандары мен билерінің хаттары осы тілде): дауыстылар жиі
  жазылмайды, араб-парсы сөздері мен ث ح ذ ص ض ط ظ ع әріптері көп, тұрақты тіркестер:
  «عزتلو», «حضرتلری», «شکر الله», «بیرله», «ایدی», «اولدور».

Шағатай транскрипциясының үлгісі (сол жазылу тәсілін сақта: «иұрт», «қылыб», «бірлә», «уа»):
  Транскрипция: «Біз мұнда есен аман тұрамыз шүкір аллаға. Сіз анда есен аман болұңыз.
  Сөзіміз олдұр мұнда падишаһ иұртына қаршылық қылыб иатған бір пара үйсүн деген халық бар.»
  Аударма: «Біз мұнда, Аллаға шүкір, аман-есенбіз. Сіз де аман-есен болыңыз. Сізге айтпағымыз,
  мында патшаға қарсылық танытып жатқан үйсін деген халық бар.»

Маңызды ережелер:
- Көне түркі жазуы оңнан солға оқылады.
- Дауысты дыбыстар жиі жазылмайды — оларды қалпына келтіргеніңді "notes"-та айт.
- Шағатай мәтінін аударғанда мағынасын бер, сөзбе-сөз емес; есімдерді өзгертпе.
- Оқылмаған жерді […] деп қалдыр, ойдан құрастырма: confidence-ті төмен қой және notes-та түсіндір.
- Егер суретте жазу мүлде болмаса: script="other", confidence=0.`

/** Промпт + таңдалған жауап тілі (аудармасы мен ескертпелері сол тілде) */
export function promptFor(lang) {
  return PROMPT_KK + answerLanguageRule(lang, ['translation', 'notes', 'monument'], ['signs', 'latin', 'kazakh', 'transcription'])
}

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
 * @param {{imageBase64: string, mimeType?: string, lang?: string}} input
 * @returns {Promise<{status: number, body: object}>}
 */
export async function recognize({ imageBase64, mimeType, lang: rawLang }) {
  const lang = normLang(rawLang)
  if (!aiEnabled()) {
    return {
      status: 503,
      body: { error: 'ai_disabled', message: msg(lang, cfg().key ? 'ai_flag_off' : 'no_key') },
    }
  }

  if (!imageBase64) {
    return { status: 400, body: { error: 'no_image', message: msg(lang, 'no_image') } }
  }

  if (imageBase64.length > MAX_IMAGE_BYTES) {
    return {
      status: 413,
      body: {
        error: 'too_large',
        message: msg(lang, 'too_large'),
      },
    }
  }

  const { provider } = cfg()
  if (provider === 'anthropic') return recognizeWithClaude({ imageBase64, mimeType, lang })
  if (provider !== 'gemini') {
    return {
      status: 501,
      body: {
        error: 'unknown_provider',
        message: msg(lang, 'unknown_provider'),
      },
    }
  }

  return recognizeWithGemini({ imageBase64, mimeType, lang })
}

async function recognizeWithClaude({ imageBase64, mimeType, lang }) {
  const r = await claudeVisionJSON({
    prompt: promptFor(lang), imageBase64, mimeType, schema: RecognizeSchema, maxTokens: 16000,
  })
  if (!r.ok) {
    return {
      status: r.status === 429 ? 429 : 502,
      body: { error: r.kind, message: msg(lang, r.kind) + (r.kind === 'network' && r.detail ? ': ' + r.detail : '') },
    }
  }
  return { status: 200, body: { ok: true, source: 'claude', model: r.model, result: r.result } }
}

async function recognizeWithGemini({ imageBase64, mimeType, lang }) {
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
            { text: promptFor(lang) },
            { inline_data: { mime_type: mimeType || 'image/jpeg', data: imageBase64 } },
          ],
        }],
        generationConfig: {
          temperature: 0.2,
          responseMimeType: 'application/json',
          // Шағатай хаты — толық транскрипция мен аударма, 4096 жетпей қалады
          maxOutputTokens: 8192,
          // Ойлану токендері де осы лимиттен алынады — шектемесек,
          // жауапқа орын қалмай, JSON үзіліп қалады.
          thinkingConfig: { thinkingBudget: 1024 },
        },
      }),
    })
  } catch (err) {
    return {
      status: 502,
      body: { error: 'network', message: msg(lang, 'network') + ': ' + err.message },
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
        message: upstream.status === 429 ? msg(lang, 'quota') : msg(lang, 'upstream'),
      },
    }
  }

  const data = await upstream.json()
  const candidate = data?.candidates?.[0]
  const text = candidate?.content?.parts?.[0]?.text ?? ''

  if (candidate?.finishReason === 'MAX_TOKENS') {
    return {
      status: 502,
      body: { error: 'truncated', message: msg(lang, 'truncated') },
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
        message: msg(lang, 'parse'),
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
