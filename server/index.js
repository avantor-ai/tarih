/**
 * Жергілікті әзірлеу серверi.
 *
 * Vercel-де бұл файл қолданылмайды — ондағы api/*.js функциялары
 * дәл осы server/recognize.js модулін пайдаланады. Логика бір жерде.
 */

import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { getHealth, recognize, rateLimit, clientIp } from './recognize.js'
import { transcribe } from './transcribe.js'

dotenv.config()

const app = express()
const PORT = process.env.API_PORT || 8787

app.use(cors())
app.use(express.json({ limit: '8mb' }))

app.get('/api/health', (req, res) => {
  res.json(getHealth())
})

app.post('/api/recognize', async (req, res) => {
  const ip = clientIp(req.headers, req.socket?.remoteAddress)
  const limit = rateLimit(ip)
  if (!limit.allowed) {
    res.setHeader('Retry-After', String(limit.retryAfterSec))
    return res.status(429).json({
      error: 'rate_limit',
      message: 'Сағаттық шектеу бітті. Кейінірек қайталаңыз.',
    })
  }

  const { imageBase64, mimeType } = req.body || {}
  const { status, body } = await recognize({ imageBase64, mimeType })
  res.status(status).json(body)
})

app.post('/api/transcribe', async (req, res) => {
  const ip = clientIp(req.headers, req.socket?.remoteAddress)
  const limit = rateLimit(ip)
  if (!limit.allowed) {
    res.setHeader('Retry-After', String(limit.retryAfterSec))
    return res.status(429).json({
      error: 'rate_limit',
      message: 'Сағаттық шектеу бітті. Кейінірек қайталаңыз.',
    })
  }

  const { imageBase64, mimeType } = req.body || {}
  const { status, body } = await transcribe({ imageBase64, mimeType })
  res.status(status).json(body)
})

app.listen(PORT, () => {
  const h = getHealth()
  console.log(`\n  ⬢  API: http://localhost:${PORT}`)
  console.log(`     Провайдер: ${h.provider} · ${h.model}`)
  console.log(`     AI режимі: ${h.aiReady ? 'дайын ✓' : h.message}\n`)
})
