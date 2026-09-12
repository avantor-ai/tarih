/** Vercel serverless функциясы: GET /api/health */
import { getHealth } from '../server/recognize.js'

export default function handler(req, res) {
  res.status(200).json(getHealth())
}
