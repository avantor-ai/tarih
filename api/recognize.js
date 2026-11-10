/** Vercel serverless функциясы: POST /api/recognize */
import { recognize, rateLimit, clientIp } from '../server/recognize.js'
import { msg, normLang } from '../server/i18n.js'

export const config = {
  api: { bodyParser: { sizeLimit: '8mb' } },
  maxDuration: 60,
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
  const { status, body } = await recognize({ imageBase64, mimeType, lang })
  res.status(status).json(body)
}
