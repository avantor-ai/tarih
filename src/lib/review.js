/**
 * Аударманы маманның тексеруіне жіберу — Web3Forms арқылы (web3forms.com).
 *
 * Қалай жұмыс істейді: браузер өтінімді тікелей Web3Forms-қа жібереді,
 * ал ол оны кілт тіркелген электрондық поштаға хат етіп жеткізеді.
 * Өз серверіміз қажет емес. Тегін жоспар — айына 250 өтінім.
 *
 * Кілт (access key): web3forms.com сайтында алушының поштасын енгізгенде
 * сол поштаға келеді. Бұл кілт әдейі ашық болуға арналған (тек хат
 * жіберуге жарайды, хаттарды оқуға болмайды), сондықтан оны кодта
 * сақтауға болады. Басымдық: VITE_WEB3FORMS_KEY айнымалысы → төмендегі мән.
 *
 * Кілт жоқ кезде өтінім жіберілмейді, тек консольге жазылады —
 * мұндай нұсқаны жариялы сайтқа шығаруға болмайды.
 *
 * @typedef {{
 *   name: string, purpose: string, email: string, lang: string,
 *   subject: { source: string, id?: string, script?: string, title?: string,
 *              original?: string, translation?: string },
 *   page: string, createdAt: string, botcheck?: string,
 * }} ReviewRequest
 */

// Web3Forms кілті (UUID). Алынған соң осында қойылады.
const WEB3FORMS_KEY_DEFAULT = '58a19580-6ee4-45b6-8af8-19130f9fde1c'

export const WEB3FORMS_KEY = import.meta.env.VITE_WEB3FORMS_KEY || WEB3FORMS_KEY_DEFAULT
const WEB3FORMS_URL = 'https://api.web3forms.com/submit'

/** Жіберу жолы қосылған ба */
export const reviewConfigured = () => Boolean(WEB3FORMS_KEY)

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
export const isEmail = (v) => EMAIL_RE.test(String(v).trim())

const LANG_NAME = { kk: 'қазақша', ru: 'орысша', en: 'ағылшынша', tr: 'түрікше' }
const SOURCE_NAME = { demo: 'Эталондық база', ai: 'AI режимі' }

/** Маманға келетін хаттың мәтіні — оқуға ыңғайлы, қазақша */
export function buildMessage(r) {
  const s = r.subject || {}
  const cut = (v, n = 1500) => (v && v.length > n ? v.slice(0, n) + ' […]' : v || '—')
  return [
    'TAMĞA AI сайтынан аударманы тексеруге өтінім келді.',
    '',
    `Аты-жөні: ${r.name}`,
    `Электрондық пошта: ${r.email}`,
    `Аударманың мақсаты: ${r.purpose}`,
    `Сайт тілі: ${LANG_NAME[r.lang] || r.lang}`,
    '',
    '── Тексерілетін аударма ──',
    `Атауы: ${s.title || '—'}`,
    `Дереккөзі: ${SOURCE_NAME[s.source] || s.source || '—'}${s.id ? ` (${s.id})` : ''}`,
    '',
    'Түпнұсқа / оқылымы:',
    cut(s.original),
    '',
    'Аудармасы:',
    cut(s.translation),
    '',
    `Бет: ${r.page}`,
    `Уақыты: ${new Date(r.createdAt).toLocaleString('kk-KZ')}`,
    '',
    'Жауап беру үшін осы хатқа «Жауап беру» батырмасын басыңыз — хат өтінім иесіне кетеді.',
  ].join('\n')
}

/**
 * @param {ReviewRequest} request
 * @returns {Promise<{ok: true, stub?: boolean}>}
 */
export async function submitReview(request) {
  // Спам-бот жасырын өрісті толтырады — ондай өтінімді үнсіз «қабылдаймыз»
  if (request.botcheck) return { ok: true }

  if (!WEB3FORMS_KEY) {
    console.info('[review] Web3Forms кілті қойылмаған, өтінім жіберілмеді:', request)
    await new Promise((r) => setTimeout(r, 700))
    return { ok: true, stub: true }
  }

  const title = request.subject?.title
  const resp = await fetch(WEB3FORMS_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({
      access_key: WEB3FORMS_KEY,
      subject: `TAMĞA AI — аударманы тексеру${title ? `: ${title}` : ''}`,
      from_name: 'TAMĞA AI',
      replyto: request.email,        // маман «Жауап беру» басса, хат пайдаланушыға кетеді
      name: request.name,
      email: request.email,
      message: buildMessage(request),
    }),
  })

  let data = null
  try { data = await resp.json() } catch { /* бос жауап */ }
  if (!resp.ok || !data?.success) {
    throw new Error(`review: ${resp.status} ${data?.message || ''}`.trim())
  }
  return { ok: true }
}
