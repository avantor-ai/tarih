/**
 * Аударманы маманның тексеруіне жіберу.
 *
 * ӘЗІРГЕ ЕШҚАЙДА ЖІБЕРІЛМЕЙДІ — қалай жіберілетіні кейін шешіледі.
 * Жіберу жолы қосылғанда тек осы файл өзгереді: VITE_REVIEW_ENDPOINT
 * айнымалысына мекенжай қойылса, өтінім сол жерге POST-пен кетеді.
 * Мекенжай жоқ кезде өтінім тек браузер консоліне жазылады, сондықтан
 * бұл нұсқаны жариялы сайтқа шығаруға болмайды.
 *
 * @typedef {{
 *   name: string, purpose: string, email: string, lang: string,
 *   subject: { source: string, id?: string, title?: string,
 *              original?: string, translation?: string },
 *   page: string, createdAt: string,
 * }} ReviewRequest
 */

export const REVIEW_ENDPOINT = import.meta.env.VITE_REVIEW_ENDPOINT || ''

/** Жіберу жолы қосылған ба */
export const reviewConfigured = () => Boolean(REVIEW_ENDPOINT)

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
export const isEmail = (v) => EMAIL_RE.test(String(v).trim())

/**
 * @param {ReviewRequest} request
 * @returns {Promise<{ok: true, stub?: boolean}>}
 */
export async function submitReview(request) {
  if (!REVIEW_ENDPOINT) {
    // Жіберу әлі қосылмаған: интерфейсті тексеру үшін ғана
    console.info('[review] жіберу жолы қосылмаған, өтінім:', request)
    await new Promise((r) => setTimeout(r, 700))
    return { ok: true, stub: true }
  }

  const resp = await fetch(REVIEW_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(request),
  })
  if (!resp.ok) throw new Error(`review: HTTP ${resp.status}`)
  return { ok: true }
}
