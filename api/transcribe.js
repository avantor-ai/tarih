/** Vercel serverless функциясы: POST /api/transcribe — мұрағат бетін цифрлау */
import { transcribe } from '../server/transcribe.js'
import { rateLimit, clientIp } from '../server/recognize.js'
import { msg, normLang } from '../server/i18n.js'

export const config = {
  api: { bodyParser: { sizeLimit: '8mb' } },
  maxDuration: 120,
}

export default async function handler(req, res) {
  const lang = normLang(req.body?.lang)
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'method', message: msg(lang, 'method') })
  }

  const ip = clientIp(req.headers, req.socket?.remoteAddress)
  const limit = rateLimit(ip)
  if (!limit.allowed) {
    res.setHeader('Retry-After', String(limit.retryAfterSec))
    return res.status(429).json({
      error: 'rate_limit',
      message: msg(lang, 'rate_limit'),
    })
  }

  const { imageBase64, mimeType } = req.body || {}
  const { status, body } = await transcribe({ imageBase64, mimeType, lang })
  res.status(status).json(body)
}
