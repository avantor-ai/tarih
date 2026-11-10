/**
 * Тілдердің толықтығын тексеру:
 *   1) ru / en / tr сөздіктерінде kk.js-тегі әр кілт бар (артығы да жоқ);
 *   2) эталондық базаның әр жазбасының үш тілге аудармасы бар.
 * Іске қосу:
 *   npx esbuild tests/i18n.test.mjs --bundle --platform=node --format=esm \
 *     --loader:.json=json --outfile=<temp>/i.mjs && node <temp>/i.mjs
 */
import kk from '../src/i18n/kk.js'
import ru from '../src/i18n/ru.js'
import en from '../src/i18n/en.js'
import tr from '../src/i18n/tr.js'
import monuments from '../src/data/monuments.json'
import mRu from '../src/data/i18n/monuments.ru.json'
import mEn from '../src/data/i18n/monuments.en.json'
import mTr from '../src/data/i18n/monuments.tr.json'

let fails = 0
const fail = (msg) => { fails++; console.log('  ✗ ' + msg) }

/** Объектінің кілттер жолы: массивте элемент саны да тексеріледі */
function shape(obj, prefix = '') {
  const out = []
  for (const [k, v] of Object.entries(obj)) {
    const p = prefix ? `${prefix}.${k}` : k
    if (Array.isArray(v)) {
      out.push(`${p}[${v.length}]`)
      v.forEach((item, i) => { if (item && typeof item === 'object') out.push(...shape(item, `${p}[${i}]`)) })
    } else if (v && typeof v === 'object') out.push(...shape(v, p))
    else out.push(`${p}:${typeof v}`)
  }
  return out
}

const base = new Set(shape(kk))
for (const [name, d] of Object.entries({ ru, en, tr })) {
  const s = new Set(shape(d))
  const missing = [...base].filter((k) => !s.has(k) && !k.startsWith('code'))
  const extra = [...s].filter((k) => !base.has(k) && !k.startsWith('code'))
  console.log(`${name}: ${s.size} кілт`)
  missing.forEach((k) => fail(`${name}: жоқ ${k}`))
  extra.forEach((k) => fail(`${name}: артық ${k}`))
  // бос жол қалмасын
  for (const k of shape(d)) if (k.endsWith(':string')) {
    const val = k.split(':')[0].split('.').reduce((o, p) => o?.[p], d)
    if (typeof val === 'string' && !val.trim()) fail(`${name}: бос ${k}`)
  }
}

const NEED = ['atauy', 'aimaq', 'jyl', 'meaning', 'sipattama']
for (const [name, table] of Object.entries({ ru: mRu, en: mEn, tr: mTr })) {
  let ok = 0
  for (const m of monuments.items) {
    const row = table[m.id]
    if (!row) { fail(`${name}: аудармасы жоқ — ${m.id}`); continue }
    const lacking = NEED.filter((f) => !row[f])
    if (m.ashylgan && !row.ashylgan) lacking.push('ashylgan')
    if (lacking.length) fail(`${name}/${m.id}: ${lacking.join(', ')}`)
    else ok++
    // абзац саны түпнұсқамен бірдей болсын (шағатай хаттары)
    const paras = (s) => s.split('\n').length
    if (row.meaning && paras(row.meaning) !== paras(m.tolyq_kazakh)) {
      fail(`${name}/${m.id}: абзац саны ${paras(row.meaning)} ≠ ${paras(m.tolyq_kazakh)}`)
    }
  }
  const stray = Object.keys(table).filter((id) => !monuments.items.some((m) => m.id === id))
  stray.forEach((id) => fail(`${name}: базада жоқ id — ${id}`))
  console.log(`${name}: ${ok}/${monuments.items.length} жазба толық`)
}

console.log(fails ? `\n──────  ${fails} қате  ──────` : '\n──────  бәрі дұрыс  ──────')
process.exit(fails ? 1 : 0)
