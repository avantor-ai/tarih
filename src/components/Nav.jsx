import { useEffect, useState } from 'react'

const LINKS = [
  { id: 'home', href: '#home' },
  { id: 'translate', href: '#translate' },
  { id: 'archive', href: '#archive' },
  { id: 'knowledge', href: '#knowledge' },
  { id: 'about', href: '#about' },
]

export default function Nav({ t }) {
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
          <span className="nav__name">Тас жазулар</span>
        </a>

        <nav className={`nav__links ${open ? 'is-open' : ''}`}>
          {LINKS.map((l) => (
            <a key={l.id} href={l.href} onClick={() => setOpen(false)}>
              {t.nav[l.id]}
            </a>
          ))}
        </nav>

        <a href="#translate" className="btn btn--primary nav__cta">{t.nav.cta}</a>

        <button
          className="nav__burger"
          onClick={() => setOpen((v) => !v)}
          aria-label="Мәзір"
          aria-expanded={open}
        >
          <span /><span /><span />
        </button>
      </div>
    </header>
  )
}
