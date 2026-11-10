import { useMemo, useState, useEffect, useRef } from 'react'
import monuments from '../data/monuments.json'
import runicAlphabet from '../data/alphabet-runic.json'
import toteAlphabet from '../data/alphabet-tote.json'
import { localizeMonument } from '../lib/localize'

const TABS = ['all', 'runic', 'tote', 'chagatai', 'alphabet']


/** Карточкадағы үлгі мәтін: руника/араб таңбалары, шағатайда — транскрипция басы */
const sampleText = (m) =>
  m.type === 'runic' ? m.runic : m.type === 'chagatai' ? m.transkripsiya : m.arab

const sampleClass = (m) =>
  m.type === 'runic' ? 'runic' : m.type === 'chagatai' ? 'card__script--text' : 'arabic'

export default function Knowledge({ t, lang }) {
  const [tab, setTab] = useState('all')
  const [open, setOpen] = useState(null)
  // Бөлім әдепкіде жиулы тұрады — сайт тым ұзын болмас үшін
  const [expanded, setExpanded] = useState(
    () => typeof window !== 'undefined' && window.location.hash === '#knowledge'
  )
  const sectionRef = useRef(null)

  // Мәзірдегі немесе hero-дағы «#knowledge» сілтемесі бөлімді ашады
  useEffect(() => {
    const onClick = (e) => {
      if (e.target.closest?.('a[href="#knowledge"]')) setExpanded(true)
    }
    document.addEventListener('click', onClick)
    return () => document.removeEventListener('click', onClick)
  }, [])

  const openTab = (id) => { setTab(id); setExpanded(true) }
  const collapse = () => {
    setExpanded(false)
    sectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const counts = useMemo(() => {
    const c = { runic: 0, tote: 0, chagatai: 0 }
    for (const m of monuments.items) c[m.type] = (c[m.type] || 0) + 1
    return c
  }, [])

  const items = useMemo(() => {
    const list = tab === 'all' ? monuments.items : monuments.items.filter((m) => m.type === tab)
    return list.map((m) => localizeMonument(m, lang))
  }, [tab, lang])

  const openItem = useMemo(() => {
    const raw = open && monuments.items.find((m) => m.id === open)
    return raw ? localizeMonument(raw, lang) : null
  }, [open, lang])

  // Esc — жабу
  useEffect(() => {
    if (!open) return
    const onKey = (e) => e.key === 'Escape' && setOpen(null)
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open])

  const tabLabel = {
    all: t.knowledge.tabAll,
    runic: t.knowledge.tabRunic,
    tote: t.knowledge.tabTote,
    chagatai: t.knowledge.tabChagatai,
    alphabet: t.knowledge.tabAlphabet,
  }

  return (
    <section id="knowledge" ref={sectionRef} className="section section--dark knowledge">
      <div className="container">
        <div className="knowledge__head reveal">
          <div>
            <p className="eyebrow">{t.knowledge.eyebrow}</p>
            <h2>
              {t.knowledge.title}{' '}
              <span className="accent-italic">{t.knowledge.titleAccent}</span>
            </h2>
          </div>
          <p className="knowledge__lead">{t.knowledge.lead}</p>
        </div>

        {!expanded ? (
          <div className="kb-summary reveal">
            <div className="kb-summary__tiles">
              {[
                { id: 'runic', n: counts.runic, label: t.knowledge.tabRunic, glyph: '𐱅', cls: 'runic' },
                { id: 'tote', n: counts.tote, label: t.knowledge.tabTote, glyph: 'ق', cls: 'arabic' },
                { id: 'chagatai', n: counts.chagatai, label: t.knowledge.tabChagatai, glyph: 'خ', cls: 'arabic' },
                { id: 'alphabet', n: '73 + 33', label: t.knowledge.tabAlphabet, glyph: 'Аа', cls: '' },
              ].map((x) => (
                <button key={x.id} className="kb-tile" onClick={() => openTab(x.id)}>
                  <span className={`kb-tile__glyph ${x.cls}`}>{x.glyph}</span>
                  <span className="kb-tile__n">{x.n}</span>
                  <span className="kb-tile__label">{x.label}</span>
                </button>
              ))}
            </div>
            <button className="btn btn--ghost kb-summary__open" onClick={() => openTab('all')}>
              {t.knowledge.expand} ↓
            </button>
          </div>
        ) : (
        <>
        <div className="tabs reveal">
          {TABS.map((id) => (
            <button
              key={id}
              className={`tabs__btn ${tab === id ? 'is-active' : ''}`}
              onClick={() => setTab(id)}
            >
              {tabLabel[id]}
            </button>
          ))}
        </div>

        {tab === 'alphabet' ? (
          <AlphabetTables t={t} />
        ) : (
          <div className="cards">
            {items.map((m) => (
              <button className="card reveal" key={m.id} onClick={() => setOpen(m.id)}>
                <div className="card__img">
                  <img src={m.image} alt={m.atauy} loading="lazy" />
                  <span className="card__type">{t.knowledge.typeShort[m.type]}</span>
                </div>
                <div className="card__body">
                  <h3 className="card__title">{m.atauy}</h3>
                  <p className="card__meta">{m.aimaq}</p>
                  <p className="card__date">{m.jyl}</p>
                  <div className={`card__script ${sampleClass(m)}`}>{sampleText(m)}</div>
                </div>
              </button>
            ))}
          </div>
        )}

        <div className="kb-collapse">
          <button className="btn btn--ghost" onClick={collapse}>{t.knowledge.collapse} ↑</button>
        </div>
        </>
        )}
      </div>

      {openItem && <Detail t={t} lang={lang} m={openItem} onClose={() => setOpen(null)} />}
    </section>
  )
}

/* ══════════════════════  Ескерткіш картасы  ══════════════════════ */

function Detail({ t, lang, m, onClose }) {
  return (
    <div className="modal" onClick={onClose}>
      <div className="modal__box scrollbar-thin" onClick={(e) => e.stopPropagation()}>
        <button className="modal__close" onClick={onClose} aria-label={t.knowledge.close}>×</button>

        <div className="modal__grid">
          <div className="modal__media">
            <img src={m.image} alt={m.atauy} />
            <p className="modal__license">{m.derek} · {m.license}</p>
          </div>

          <div className="modal__info">
            <p className="eyebrow">
              {{ runic: t.knowledge.tabRunic, tote: t.knowledge.tabTote, chagatai: t.knowledge.tabChagatai }[m.type]}
            </p>
            <h3>{m.atauy}</h3>
            {/* Қазақшада — орысша атауы, басқа тілде — түпнұсқа қазақша атауы */}
            <p className="modal__ru">{lang === 'kk' ? m.atauy_ru : m.atauy_kk}</p>

            <dl className="facts">
              <div><dt>{t.knowledge.region}</dt><dd>{m.aimaq}</dd></div>
              <div><dt>{t.knowledge.date}</dt><dd>{m.jyl}</dd></div>
              {m.ashylgan && <div><dt>{t.knowledge.found}</dt><dd>{m.ashylgan}</dd></div>}
            </dl>

            {m.type === 'chagatai' ? (
              <>
                <div className="modal__script">
                  <span className="field__label">{t.translator.transcription}</span>
                  <div className="modal__kazakh modal__longtext">{m.transkripsiya}</div>
                </div>
                <div className="modal__script">
                  <span className="field__label">{t.translator.translation}</span>
                  <div className="modal__kazakh modal__longtext">{m.meaning}</div>
                </div>
              </>
            ) : (
            <>
            <div className="modal__script">
              <span className="field__label">
                {m.type === 'runic' ? t.knowledge.signs : t.knowledge.inTote}
              </span>
              <div className={m.type === 'runic' ? 'runic' : 'arabic'}>
                {m.type === 'runic' ? m.runic : m.arab}
              </div>
            </div>

            {m.latin && (
              <div className="modal__script">
                <span className="field__label">{t.knowledge.latin}</span>
                <div className="latin-translit">{m.latin}</div>
              </div>
            )}

            <div className="modal__script">
              <span className="field__label">{t.knowledge.meaning}</span>
              <div className="modal__kazakh">{m.meaning}</div>
            </div>
            </>
            )}

            <p className="modal__desc">{m.sipattama}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ══════════════════════  Әліпби кестелері  ══════════════════════ */

function AlphabetTables({ t }) {
  const [variant, setVariant] = useState('orkhon')

  const groups = useMemo(() => {
    const signs = runicAlphabet.signs.filter((s) => s.variant === variant)
    return {
      dauysty: signs.filter((s) => s.type === 'dauysty'),
      dauyssyz: signs.filter((s) => s.type === 'dauyssyz'),
      buyn: signs.filter((s) => s.type === 'buyn'),
    }
  }, [variant])

  return (
    <div className="alphabet reveal">
      <div className="alphabet__block">
        <div className="alphabet__head">
          <h3>{t.knowledge.alphabetRunic}</h3>
          <div className="alphabet__switch">
            <button
              className={variant === 'orkhon' ? 'is-active' : ''}
              onClick={() => setVariant('orkhon')}
            >{t.knowledge.orkhon}</button>
            <button
              className={variant === 'yenisei' ? 'is-active' : ''}
              onClick={() => setVariant('yenisei')}
            >{t.knowledge.yenisei}</button>
          </div>
        </div>

        <p className="alphabet__note">{t.knowledge.runicNote}</p>

        <SignGroup title={t.knowledge.vowels} signs={groups.dauysty} kind="runic" />
        <SignGroup title={t.knowledge.consonants} signs={groups.dauyssyz} kind="runic" />
        <SignGroup title={t.knowledge.syllabic} signs={groups.buyn} kind="runic" />
      </div>

      <div className="alphabet__block">
        <div className="alphabet__head">
          <h3>{t.knowledge.alphabetTote}</h3>
        </div>
        <p className="alphabet__note">
          {t.knowledge.toteAuthor} · {t.knowledge.toteUsage}
        </p>
        <p className="alphabet__note">{t.knowledge.toteFeature}</p>

        <div className="signs">
          {toteAlphabet.signs.map((s) => (
            <div className="sign" key={s.arab + s.kaz}>
              <span className="sign__glyph arabic">{s.arab}</span>
              <span className="sign__kaz">{s.kaz}</span>
              <span className="sign__latin">{s.latin}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function SignGroup({ title, signs, kind }) {
  if (!signs.length) return null
  return (
    <div className="alphabet__group">
      <h4 className="alphabet__group-title">{title} <span>{signs.length}</span></h4>
      <div className="signs">
        {signs.map((s) => (
          <div className="sign" key={s.cp} title={s.unicode_name}>
            <span className={`sign__glyph ${kind}`}>{s.glyph}</span>
            <span className="sign__kaz">{s.kaz}</span>
            <span className="sign__latin">{s.latin}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
