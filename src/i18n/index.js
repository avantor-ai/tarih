/**
 * Тілдер: қазақша (негізгі), орысша, ағылшынша, түрікше.
 *
 * Таңдалған тіл үш жерден оқылады (басымдық ретімен):
 *   1) сілтемедегі ?lang=tr — жюриге бірден керек тілмен жіберуге болады;
 *   2) браузерде сақталған таңдау;
 *   3) әдепкі — қазақша.
 */
import { useCallback, useEffect, useState } from 'react'
import kk from './kk'
import ru from './ru'
import en from './en'
import tr from './tr'

export const DICTS = { kk, ru, en, tr }

export const LANGS = [
  { code: 'kk', short: 'ҚАЗ', name: 'Қазақша' },
  { code: 'ru', short: 'РУС', name: 'Русский' },
  { code: 'en', short: 'ENG', name: 'English' },
  { code: 'tr', short: 'TÜR', name: 'Türkçe' },
]

const STORAGE_KEY = 'tas-jazular:lang'
const isLang = (v) => Object.prototype.hasOwnProperty.call(DICTS, v)

function initialLang() {
  try {
    const fromUrl = new URLSearchParams(window.location.search).get('lang')
    if (isLang(fromUrl)) return fromUrl
  } catch { /* SSR жоқ, бірақ сақтанамыз */ }
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (isLang(saved)) return saved
  } catch { /* жеке режим */ }
  return 'kk'
}

/** @returns {[string, (code: string) => void]} */
export function useLang() {
  const [lang, setLangState] = useState(initialLang)

  const setLang = useCallback((code) => {
    if (!isLang(code)) return
    setLangState(code)
    try { localStorage.setItem(STORAGE_KEY, code) } catch { /* жеке режим */ }
    // Сілтемедегі ?lang= мәнін де жаңартамыз — көшірілген сілтеме сол тілде ашылсын
    try {
      const url = new URL(window.location.href)
      if (code === 'kk') url.searchParams.delete('lang')
      else url.searchParams.set('lang', code)
      window.history.replaceState(null, '', url)
    } catch { /* ескі браузер */ }
  }, [])

  // <html lang>, бет атауы мен сипаттамасы таңдалған тілге сай болсын
  useEffect(() => {
    const t = DICTS[lang]
    document.documentElement.lang = lang
    document.title = t.meta.title
    document.querySelector('meta[name="description"]')?.setAttribute('content', t.meta.description)
  }, [lang])

  return [lang, setLang]
}
