import { useMemo, useState, useEffect } from 'react'
import monuments from '../data/monuments.json'
import runicAlphabet from '../data/alphabet-runic.json'
import toteAlphabet from '../data/alphabet-tote.json'

const TABS = ['all', 'runic', 'tote', 'alphabet']

export default function Knowledge({ t }) {
  const [tab, setTab] = useState('all')
  const [open, setOpen] = useState(null)

  const items = useMemo(() => {
    if (tab === 'runic') return monuments.items.filter((m) => m.type === 'runic')
    if (tab === 'tote') return monuments.items.filter((m) => m.type === 'tote')
    return monuments.items
  }, [tab])

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
    alphabet: t.knowledge.tabAlphabet,
  }

  return (
    <section id="knowledge" className="section section--dark knowledge">
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
              <button className="card reveal" key={m.id} onClick={() => setOpen(m)}>
                <div className="card__img">
                  <img src={m.image} alt={m.atauy} loading="lazy" />
                  <span className="card__type">
                    {m.type === 'runic' ? 'көне түркі' : 'төте жазу'}
                  </span>
                </div>
                <div className="card__body">
                  <h3 className="card__title">{m.atauy}</h3>
                  <p className="card__meta">{m.aimaq}</p>
                  <p className="card__date">{m.jyl}</p>
                  <div className={`card__script ${m.type === 'runic' ? 'runic' : 'arabic'}`}>
                    {m.type === 'runic' ? m.runic : m.arab}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {open && <Detail t={t} m={open} onClose={() => setOpen(null)} />}
    </section>
  )
}

/* ══════════════════════  Ескерткіш картасы  ══════════════════════ */

function Detail({ t, m, onClose }) {
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
              {m.type === 'runic' ? t.knowledge.tabRunic : t.knowledge.tabTote}
            </p>
            <h3>{m.atauy}</h3>
            <p className="modal__ru">{m.atauy_ru}</p>

            <dl className="facts">
              <div><dt>{t.knowledge.region}</dt><dd>{m.aimaq}</dd></div>
              <div><dt>{t.knowledge.date}</dt><dd>{m.jyl}</dd></div>
              {m.ashylgan && <div><dt>{t.knowledge.found}</dt><dd>{m.ashylgan}</dd></div>}
            </dl>

            <div className="modal__script">
              <span className="field__label">
                {m.type === 'runic' ? 'Таңбалар' : 'Төте жазумен'}
              </span>
              <div className={m.type === 'runic' ? 'runic' : 'arabic'}>
                {m.type === 'runic' ? m.runic : m.arab}
              </div>
            </div>

            {m.latin && (
              <div className="modal__script">
                <span className="field__label">Латын транслитерациясы</span>
                <div className="latin-translit">{m.latin}</div>
              </div>
            )}

            <div className="modal__script">
              <span className="field__label">Қазіргі қазақ тілінде</span>
              <div className="modal__kazakh">{m.tolyq_kazakh}</div>
            </div>

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

        <p className="alphabet__note">{runicAlphabet.eskertu}</p>

        <SignGroup title={t.knowledge.vowels} signs={groups.dauysty} kind="runic" />
        <SignGroup title={t.knowledge.consonants} signs={groups.dauyssyz} kind="runic" />
        <SignGroup title={t.knowledge.syllabic} signs={groups.buyn} kind="runic" />
      </div>

      <div className="alphabet__block">
        <div className="alphabet__head">
          <h3>{t.knowledge.alphabetTote}</h3>
        </div>
        <p className="alphabet__note">
          {toteAlphabet.avtor} · {toteAlphabet.qoldanys}
        </p>
        <p className="alphabet__note">{toteAlphabet.erekshelik}</p>

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
