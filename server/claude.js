/**
 * Claude (Anthropic API) арқылы суретті оқу — Gemini-дің баламасы.
 *
 * Қосу: AI_PROVIDER=anthropic, ANTHROPIC_API_KEY=… (міндетті),
 *       ANTHROPIC_MODEL=claude-sonnet-5-5 (әдепкі).
 *
 * Жауап құрылымы JSON-схемамен шектеледі (structured outputs), сондықтан
 * Gemini-дегідей «JSON үзіліп қалды / оқылмады» жағдайы жоқтың қасы.
 * Модель бас тартса (refusal), сервер өзі басқа модельмен қайталайды
 * (server-side fallback, `fallbacks: "default"`).
 */
import Anthropic from '@anthropic-ai/sdk'
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod'
import { z } from 'zod'

export const claudeModel = () => process.env.ANTHROPIC_MODEL || 'claude-sonnet-5-5'
export const claudeKey = () => process.env.ANTHROPIC_API_KEY || ''

// Клиентті шақырылғанда жасаймыз: .env модуль жүктелгеннен кейін оқылады
let client = null
function getClient() {
  if (!client) client = new Anthropic({ apiKey: claudeKey() })
  return client
}

/* ─────────────────────────  Жауап схемалары  ───────────────────────── */

/** Тас жазу / төте / шағатай — бір сурет (server/recognize.js промптымен бірдей өрістер) */
export const RecognizeSchema = z.object({
  script: z.enum(['runic', 'tote', 'chagatai', 'other']),
  confidence: z.number(),
  signs: z.string(),
  latin: z.string(),
  transcription: z.string(),
  kazakh: z.string(),
  translation: z.string(),
  monument: z.string().nullable(),
  notes: z.string(),
})

/** Мұрағат беті (server/transcribe.js промптымен бірдей өрістер) */
export const TranscribeSchema = z.object({
  script: z.enum(['arabic', 'cyrillic', 'latin', 'runic', 'mixed']),
  language: z.string(),
  docType: z.string(),
  dating: z.string().nullable(),
  confidence: z.number(),
  blocks: z.array(z.object({
    type: z.enum(['heading', 'paragraph', 'date', 'signature', 'margin', 'table']),
    text: z.string(),
    confidence: z.number(),
    uncertain: z.array(z.string()),
  })),
  modern: z.string(),
  summary: z.string(),
  notes: z.string(),
})

/* ─────────────────────────  Сұраныс  ───────────────────────── */

const MEDIA = new Set(['image/jpeg', 'image/png', 'image/gif', 'image/webp'])

/**
 * Суретті Claude-қа жіберіп, схемаға сай JSON алу.
 *
 * @returns {Promise<{ok: true, result: object, model: string} |
 *                   {ok: false, kind: string, status?: number, detail?: string}>}
 *   kind — server/i18n.js кілті: quota | network | upstream | truncated | parse | refused
 */
export async function claudeVisionJSON({ prompt, imageBase64, mimeType, schema, maxTokens = 16000 }) {
  const model = claudeModel()
  let response
  try {
    response = await getClient().beta.messages.create({
      model,
      max_tokens: maxTokens,
      // Бас тартқан жағдайда сервер өзі лайықты модельмен қайталайды
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
      output_config: { format: zodOutputFormat(schema) },
      messages: [{
        role: 'user',
        content: [
          {
            type: 'image',
            source: { type: 'base64', media_type: MEDIA.has(mimeType) ? mimeType : 'image/jpeg', data: imageBase64 },
          },
          { type: 'text', text: prompt },
        ],
      }],
    })
  } catch (err) {
    console.error('Claude қатесі:', err?.status, err?.message?.slice(0, 300))
    if (err instanceof Anthropic.RateLimitError) return { ok: false, kind: 'quota', status: 429 }
    if (err instanceof Anthropic.APIConnectionError) return { ok: false, kind: 'network', detail: err.message }
    if (err instanceof Anthropic.APIError) return { ok: false, kind: 'upstream', status: err.status }
    return { ok: false, kind: 'upstream' }
  }

  if (response.stop_reason === 'refusal') {
    console.error('Claude бас тартты:', response.stop_details?.category)
    return { ok: false, kind: 'refused' }
  }
  if (response.stop_reason === 'max_tokens') return { ok: false, kind: 'truncated' }

  const text = response.content.filter((b) => b.type === 'text').map((b) => b.text).join('')
  let data
  try {
    data = JSON.parse(text)
  } catch {
    return { ok: false, kind: 'parse', detail: text.slice(0, 300) }
  }
  const checked = schema.safeParse(data)
  if (!checked.success) return { ok: false, kind: 'parse', detail: checked.error.message.slice(0, 300) }

  return { ok: true, result: checked.data, model: response.model || model }
}
