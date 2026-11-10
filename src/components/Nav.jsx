import { useEffect, useRef, useState } from 'react'
import { LANGS } from '../i18n'

const LINKS = [
  { id: 'home', href: '#home' },
  { id: 'translate', href: '#translate' },
  { id: 'archive', href: '#archive' },
  { id: 'knowledge', href: '#knowledge' },
  { id: 'about', href: '#about' },
]

export default function Nav({ t, lang, setLang }) {
  const [solid, setSolid] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setSolid(window.scrollY > 40)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header className={`nav ${solid ? 'nav--solid' : ''}`}>
      <div className="nav__inner">
        <a href="#home" className="nav__logo" onClick={() => setOpen(false)}>
          <span className="nav__mark runic">𐰚</span>
          <span className="nav__name">{t.nav.brand}</span>
        </a>

        <nav className={`nav__links ${open ? 'is-open' : ''}`}>
          {LINKS.map((l) => (
            <a key={l.id} href={l.href} onClick={() => setOpen(false)}>
              {t.nav[l.id]}
            </a>
          ))}
        </nav>

        <LangSwitch t={t} lang={lang} setLang={setLang} />

        <a href="#translate" className="btn btn--primary nav__cta">{t.nav.cta}</a>

        <button
          className="nav__burger"
          onClick={() => setOpen((v) => !v)}
          aria-label={t.nav.menu}
          aria-expanded={open}
        >
          <span /><span /><span />
        </button>
      </div>
    </header>
  )
}

/** Тіл ауыстырғыш: ықшам батырма + ашылатын тізім (мобильде де көрінеді) */
function LangSwitch({ t, lang, setLang }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const current = LANGS.find((l) => l.code === lang) ?? LANGS[0]

  // Сырт жерді басқанда немесе Esc-те жабу
  useEffect(() => {
    if (!open) return
    const onDown = (e) => { if (!ref.current?.contains(e.target)) setOpen(false) }
    const onKey = (e) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('pointerdown', onDown)
    window.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onDown)
      window.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <div className="lang" ref={ref}>
      <button
        className="lang__btn"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`${t.lang.label}: ${current.name}`}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.6">
          <circle cx="12" cy="12" r="9" />
          <path d="M3 12h18M12 3c2.6 2.6 2.6 15.4 0 18M12 3c-2.6 2.6-2.6 15.4 0 18" />
        </svg>
        {current.short}
      </button>

      {open && (
        <ul className="lang__menu" role="listbox" aria-label={t.lang.label}>
          {LANGS.map((l) => (
            <li key={l.code}>
              <button
                role="option"
                aria-selected={l.code === lang}
                className={l.code === lang ? 'is-active' : ''}
                onClick={() => { setLang(l.code); setOpen(false) }}
              >
                <span className="lang__short">{l.short}</span>
                <span>{l.name}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
