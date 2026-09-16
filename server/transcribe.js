/**
 * Мұрағат құжаттарын цифрлау — қолжазбаны мәтінге айналдыру.
 *
 * Бұл server/recognize.js-тен бөлек тұр, себебі мақсаты басқа:
 *   recognize.js — тастағы қысқа жазуды тану (бір-екі жол).
 *   transcribe.js — көпжолды қолжазбаны толық көшіру, құрылымын сақтап.
 *
 * Қазақстан мұрағаттары көпқабатты: бір істің ішінде араб графикасы да,
 * орыс скорописі де, латын да, кирилл де кездеседі. Сондықтан жазу түрін
 * қолмен таңдатпаймыз — модель өзі анықтайды.
 */

// Баптаулар модуль жүктелгенде емес, шақырылғанда оқылады —
// себебі recognize.js-тегідей (ES импорттары dotenv-тен бұрын жүреді).
const cfg = () => ({
  provider: process.env.AI_PROVIDER || 'gemini',
  model: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
  key: process.env.GEMINI_API_KEY,
})
const aiEnabled = () => process.env.AI_ENABLED !== 'false' && Boolean(cfg().key)

const MAX_IMAGE_BYTES = 6 * 1024 * 1024

export const TRANSCRIBE_PROMPT = `Сен — мұрағат құжаттарын оқитын маман-палеографсың.

Суретте тарихи немесе қазіргі қолжазба құжат берілген. Оны мұқият көшіріп жаз.

Жауапты ТЕК таза JSON түрінде бер:

{
  "script": "arabic" | "cyrillic" | "latin" | "runic" | "mixed",
  "language": "kk" | "ru" | "cht" | "other",
  "docType": "хат | өтініш | жарлық | тізім | куәлік | күнделік | басқа",
  "dating": "құжаттағы күн, болса; әйтпесе null",
  "confidence": 0.0-1.0,
  "blocks": [
    {
      "type": "heading" | "paragraph" | "date" | "signature" | "margin" | "table",
      "text": "түпнұсқадағы мәтін, сол қалпында",
      "confidence": 0.0-1.0,
      "uncertain": ["оқылуы күмәнді үзінділер"]
    }
  ],
  "modern": "бүкіл құжаттың қазіргі қазақ тіліндегі оқылымы",
  "summary": "құжаттың мазмұны бір-екі сөйлеммен",
  "notes": "оқуға кедергі болған жайттар: сия оңған, қағаз жыртылған, қолтаңба қиын"
}

Қатаң ережелер:
- Мәтінді ОЙДАН ҚҰРАСТЫРМА. Әрпін ажырата алмасаң, сол жерге […] қой және
  оны "uncertain" тізіміне енгіз. Болжап толтырғаннан гөрі бос қалдырған дұрыс.
- Құжаттың ҚҰРЫЛЫМЫН сақта: тақырып, азат жолдар, күні, қолы, шет жақтағы белгілер —
  әрқайсысы бөлек block болсын, түрін дұрыс көрсет.
- "text" өрісінде түпнұсқа қалай жазылса, солай бер (ескі емле сақталады).
  Қазіргі тілге бейімдеу тек "modern" өрісінде болады.
- Араб графикасы оңнан солға оқылады.
- Орыс тіліндегі революцияға дейінгі құжаттарда ѣ, і, ъ кездеседі — оларды сол күйінде жаз.
- Әр блокқа өз confidence мәнін қой: анық оқылса жоғары, күмәнді болса төмен.
- Суретте құжат болмаса немесе мәтін мүлде оқылмаса: blocks бос, confidence 0.`

export function getTranscribeHealth() {
  const { provider, model } = cfg()
  return { ok: true, provider, aiReady: aiEnabled(), model }
}

/**
 * @param {{imageBase64: string, mimeType?: string}} input
 * @returns {Promise<{status: number, body: object}>}
 */
export async function transcribe({ imageBase64, mimeType }) {
  if (!aiEnabled()) {
    return {
      status: 503,
      body: {
        error: 'ai_disabled',
        message: cfg().key
          ? 'Цифрлау режимі әдейі өшірілген (AI_ENABLED=false)'
          : 'API кілті табылмады — цифрлау үшін кілт қажет',
      },
    }
  }

  if (!imageBase64) {
    return { status: 400, body: { error: 'no_image', message: 'Сурет жіберілмеді' } }
  }

  if (imageBase64.length > MAX_IMAGE_BYTES) {
    return {
      status: 413,
      body: { error: 'too_large', message: 'Бет тым үлкен. Кішірейтіп қайта жіберіңіз.' },
    }
  }

  const { provider, model, key } = cfg()
  if (provider !== 'gemini') {
    return {
      status: 501,
      body: {
        error: 'unknown_provider',
        message: `AI_PROVIDER="${provider}" әлі қосылмаған.`,
      },
    }
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`

  let upstream
  try {
    upstream = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: TRANSCRIBE_PROMPT },
            { inline_data: { mime_type: mimeType || 'image/jpeg', data: imageBase64 } },
          ],
        }],
        generationConfig: {
          temperature: 0.1,              // көшіру дәл болуы керек, қиял емес
          responseMimeType: 'application/json',
          maxOutputTokens: 16384,        // көпбетті құжат сыюы үшін
          // Gemini 2.5 Flash-та "ойлану" әдепкі бойынша қосулы, әрі оның
          // токендері СОЛ ЛИМИТТЕН алынады. Шектеусіз қалдырсақ, модель
          // 7800 токенді ойлануға жұмсап, жауап жартылай үзіліп қалады.
          // Мүлде өшірсек те нашар: модель шашыраңқы жазып, лимитке тағы
          // тіреледі. Өлшеп таңдалған орта жол — 2048.
          thinkingConfig: { thinkingBudget: 2048 },
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
    console.error('Gemini (transcribe) қатесі:', upstream.status, detail.slice(0, 300))
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
      body: {
        error: 'truncated',
        message: 'Бет тым көлемді — жауап толық сыймады. '
          + 'Бетті екіге бөліп немесе жеке бөліктерін жүктеп көріңіз.',
      },
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
      body: { error: 'parse', message: 'Модельдің жауабын оқу мүмкін болмады', raw: text.slice(0, 500) },
    }
  }

  // Модель блок бермей қалса да, бет бос қалмасын
  if (!Array.isArray(parsed.blocks)) parsed.blocks = []

  return {
    status: 200,
    body: { ok: true, source: 'gemini', model, result: parsed },
  }
}
