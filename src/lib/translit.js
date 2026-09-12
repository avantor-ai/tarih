/**
 * Транслитерация: көне түркі руникасы ↔ латын ↔ қазақ кириллицасы
 *                 төте жазу (араб) ↔ қазақ кириллицасы
 *
 * Бұл — нағыз алгоритм: кез келген мәтінмен жұмыс істейді,
 * тек дайын 20 суретпен шектелмейді.
 */

import runicAlphabet from '../data/alphabet-runic.json'
import toteAlphabet from '../data/alphabet-tote.json'

/* ─────────────────────────  РУНИКА  ───────────────────────── */

/**
 * Көне түркі жазуының екі ерекшелігі бар:
 *  1) дауыстылар жиі жазылмайды (teŋri → 𐱅𐰭𐰼𐰃 = t-ŋ-r-i);
 *  2) дауыссыздардың жуан/жіңішке нұсқалары сөздің үндестік қатарын көрсетеді.
 * Сондықтан алдымен сөздің қатарын анықтап, содан кейін көп мағыналы
 * дауыстылардың оқылуын шешеміз.
 */

/** глиф → таңба туралы толық мәлімет */
const SIGN_BY_GLYPH = Object.fromEntries(
  runicAlphabet.signs.map((s) => [s.glyph, s])
)

/** Көп мағыналы таңбалардың қатарға қарай оқылуы */
const HARMONY_READING = {
  A:   { back: 'a',  front: 'ä' },
  I:   { back: 'ı',  front: 'i' },
  O:   { back: 'o',  front: 'ö' },
  OE:  { back: 'u',  front: 'ü' },
  AE:  { back: 'ä',  front: 'ä' },
  E:   { back: 'e',  front: 'e' },
}

/** Таңбаның негізгі латын мәні: "a, ä" → "a";  "b¹" → "b" */
const primaryLatin = (s) =>
  s.split(',')[0].trim().replace(/[¹²³]/g, '').replace(/\s*\(.*\)\s*/, '')

/** глиф → латын (қатарсыз, шикі мән) */
export const RUNIC_TO_LATIN = Object.fromEntries(
  runicAlphabet.signs.map((s) => [s.glyph, primaryLatin(s.latin)])
)

/** латын → қазақ */
const LATIN_TO_KAZ = {
  a: 'а', ä: 'ә', ı: 'ы', i: 'і', e: 'е', o: 'о', u: 'ұ', ö: 'ө', ü: 'ү',
  b: 'б', γ: 'ғ', g: 'г', d: 'д', z: 'з', y: 'й', k: 'к', l: 'л', m: 'м',
  n: 'н', ŋ: 'ң', p: 'п', č: 'ч', q: 'қ', r: 'р', s: 'с', š: 'ш', t: 'т',
  ń: 'нь', j: 'ж', v: 'в', h: 'х', f: 'ф',
}

/** қазақ → руника (виртуалды пернетақта үшін, орхон нұсқасы) */
export const KAZ_TO_RUNIC = (() => {
  const map = {}
  for (const s of runicAlphabet.signs) {
    if (s.variant !== 'orkhon') continue
    for (const part of s.kaz.split(',')) {
      const kaz = part.trim().replace(/\s*\(.*\)\s*/, '')
      if (kaz && !map[kaz]) map[kaz] = s.glyph
    }
  }
  return map
})()

/** Көне түркі жазуындағы сөз бөлгіштер */
const RUNIC_SEPARATORS = /[:⁚⁝⸱]/g

const isRunic = (ch) => {
  const cp = ch.codePointAt(0)
  return cp >= 0x10c00 && cp <= 0x10c48
}

/** Сөздің үндестік қатарын дауыссыздар бойынша анықтау */
function detectHarmony(word) {
  let back = 0, front = 0
  for (const ch of word) {
    const sign = SIGN_BY_GLYPH[ch]
    if (!sign) continue
    if (sign.harmony === 'back') back++
    else if (sign.harmony === 'front') front++
  }
  if (front > back) return 'front'
  return 'back' // тең түскенде жуан деп аламыз (жиірек кездеседі)
}

/** Бір сөзді транслитерациялау */
function runicWord(word) {
  const harmony = detectHarmony(word)
  let latin = ''
  const unknown = []

  for (const ch of word) {
    if (!isRunic(ch)) { latin += ch; continue }
    const sign = SIGN_BY_GLYPH[ch]
    if (!sign) { unknown.push(ch); latin += '·'; continue }
    const reading = HARMONY_READING[sign.key]
    latin += reading ? reading[harmony] : primaryLatin(sign.latin)
  }
  return { latin, harmony, unknown }
}

/**
 * Руникалық мәтінді транслитерациялау.
 * @returns {{latin, kazakh, unknown, signCount, harmonies, vowelsOmitted}}
 */
export function transliterateRunic(text) {
  const normalized = text.replace(RUNIC_SEPARATORS, ' ')
  const words = normalized.split(/\s+/).filter(Boolean)

  const unknown = []
  const harmonies = []
  let signCount = 0

  const latinWords = words.map((w) => {
    const r = runicWord(w)
    unknown.push(...r.unknown)
    harmonies.push(r.harmony)
    signCount += [...w].filter(isRunic).length
    return r.latin
  })

  const latin = latinWords.join(' ')
  const kazakh = [...latin]
    .map((c) => LATIN_TO_KAZ[c.toLowerCase()] || c)
    .join('')

  // Түпнұсқада дауысты жазылмағанын анықтау:
  // қатарынан 3+ дауыссыз, немесе мүлде дауыстысы жоқ сөз.
  const VOWELS = 'aäıioöuüe'
  const isCons = (c) => /[a-zγŋšč]/i.test(c) && !VOWELS.includes(c.toLowerCase())
  const vowelsOmitted = latinWords.some((w) => {
    if (w.length > 1 && ![...w].some((c) => VOWELS.includes(c.toLowerCase()))) return true
    let run = 0
    for (const c of w) {
      run = isCons(c) ? run + 1 : 0
      if (run >= 3) return true
    }
    return false
  })

  return { latin, kazakh, unknown, signCount, harmonies, vowelsOmitted }
}

/** Қазақша мәтінді руникаға айналдыру (демонстрация үшін) */
export function kazakhToRunic(text) {
  let out = ''
  for (const ch of text.toLowerCase()) {
    if (/\s/.test(ch)) { out += ' : '; continue }
    out += KAZ_TO_RUNIC[ch] || ch
  }
  return out.trim()
}

/* ────────────────────────  ТӨТЕ ЖАЗУ  ──────────────────────── */

const HAMZA = 'ٴ' // ٴ дәйекші — сөздің жіңішке екенін білдіреді

/** араб → қазақ (негізгі кесте) */
export const ARAB_TO_KAZ = Object.fromEntries(
  toteAlphabet.signs
    .map((s) => [s.arab, s.kaz.split(',')[0].trim()])
    .filter(([a]) => a && a !== HAMZA)
)

/** қазақ → араб (кері бағыт) */
export const KAZ_TO_ARAB = (() => {
  const map = {}
  for (const s of toteAlphabet.signs) {
    for (const k of s.kaz.split(',')) {
      const key = k.trim().toLowerCase()
      if (key && !map[key]) map[key] = s.arab
    }
  }
  return map
})()

/** Дәйекші бар сөзде жуан дауыстылар жіңішкеге ауысады */
const FRONT_HARMONY = { а: 'ә', о: 'ө', ұ: 'ү', ы: 'і', у: 'ү' }

/**
 * Төте жазудағы мәтінді қазақ кириллицасына айналдыру.
 * @returns {{kazakh: string, unknown: string[], words: number}}
 */
export function transliterateTote(text) {
  const unknown = []
  // презентациялық араб формаларын базалық таңбаға келтіру
  const normalized = text.normalize('NFKC')
  const words = normalized.split(/\s+/).filter(Boolean)

  const out = words.map((word) => {
    // сөз басындағы (немесе ішіндегі) дәйекші — бүкіл сөз жіңішке
    const isFront = word.includes(HAMZA)
    const clean = word.split(HAMZA).join('')

    let res = ''
    let i = 0
    while (i < clean.length) {
      // алдымен екі таңбалы тіркесті тексереміз (мыс. ٶ, ٷ, ٸ құрамалары)
      const two = clean.slice(i, i + 2)
      if (ARAB_TO_KAZ[two]) { res += ARAB_TO_KAZ[two]; i += 2; continue }

      const one = clean[i]
      if (ARAB_TO_KAZ[one]) { res += ARAB_TO_KAZ[one] }
      else if (/[.,!?«»()\-—:;0-9]/.test(one)) { res += one }
      else { unknown.push(one); res += '·' }
      i += 1
    }

    res = res.toLowerCase()
    if (isFront) {
      res = [...res].map((c) => FRONT_HARMONY[c] || c).join('')
    }
    return res
  })

  return { kazakh: out.join(' '), unknown, words: words.length }
}

/** Қазақшадан төте жазуға (виртуалды пернетақта үшін) */
export function kazakhToTote(text) {
  const words = text.toLowerCase().split(/\s+/).filter(Boolean)
  return words
    .map((word) => {
      // жіңішке дауысты бар ма — дәйекші қою керек пе
      const needsHamza = /[әөүі]/.test(word)
      const body = [...word]
        .map((c) => {
          const back = { ә: 'а', ө: 'о', ү: 'ұ', і: 'ы' }[c]
          return KAZ_TO_ARAB[needsHamza && back ? back : c] || KAZ_TO_ARAB[c] || c
        })
        .join('')
      return needsHamza ? HAMZA + body : body
    })
    .join(' ')
}

/* ────────────────────────  АВТОБОЛЖАУ  ─────────────────────── */

/** Мәтіннің қай жазу екенін анықтау */
export function detectScript(text) {
  let runic = 0, arab = 0, cyr = 0
  for (const ch of text) {
    const cp = ch.codePointAt(0)
    if (cp >= 0x10c00 && cp <= 0x10c48) runic++
    else if ((cp >= 0x0600 && cp <= 0x06ff) || (cp >= 0xfb50 && cp <= 0xfeff)) arab++
    else if (cp >= 0x0400 && cp <= 0x04ff) cyr++
  }
  if (runic >= arab && runic >= cyr && runic > 0) return 'runic'
  if (arab >= cyr && arab > 0) return 'tote'
  if (cyr > 0) return 'kazakh'
  return 'unknown'
}

/** Кез келген мәтінді автоматты түрде аудару */
export function autoTransliterate(text) {
  const script = detectScript(text)
  if (script === 'runic') {
    const r = transliterateRunic(text)
    return { script, ...r }
  }
  if (script === 'tote') {
    const r = transliterateTote(text)
    return { script, latin: '', ...r }
  }
  if (script === 'kazakh') {
    return {
      script,
      kazakh: text,
      runic: kazakhToRunic(text),
      tote: kazakhToTote(text),
      unknown: [],
    }
  }
  return { script, kazakh: '', latin: '', unknown: [] }
}
