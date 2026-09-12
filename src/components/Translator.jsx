import { useEffect, useMemo, useRef, useState } from 'react'
import monuments from '../data/monuments.json'
import runicAlphabet from '../data/alphabet-runic.json'
import toteAlphabet from '../data/alphabet-tote.json'
import { buildIndex, findMatch, fileToImage, downscaleForUpload } from '../lib/imageHash'
import { autoTransliterate, transliterateRunic, transliterateTote } from '../lib/translit'

const MODE = { DEMO: 'demo', AI: 'ai' }

export default function Translator({ t }) {
  const [mode, setMode] = useState(MODE.DEMO)
  const [aiReady, setAiReady] = useState(false)
  const [index, setIndex] = useState(null)
  const [indexing, setIndexing] = useState(0)
  const [preview, setPreview] = useState(null)
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const [manual, setManual] = useState('')
  const [kbd, setKbd] = useState(null) // 'runic' | 'tote' | null
  const [dragOver, setDragOver] = useState(false)

  const fileRef = useRef(null)
  const cameraRef = useRef(null)

  /* ── серверде кілт бар ма ── */
  useEffect(() => {
    fetch('/api/health')
      .then((r) => r.json())
      .then((d) => setAiReady(Boolean(d.aiReady)))
      .catch(() => setAiReady(false))
  }, [])

  /* ── эталондық базаның индексін құру ── */
  useEffect(() => {
    let alive = true
    buildIndex(monuments.items, (p) => alive && setIndexing(p))
      .then((idx) => alive && setIndex(idx))
      .catch((e) => alive && setError(e.message))
    return () => { alive = false }
  }, [])

  /* ── суретті өңдеу ── */
  async function handleFile(file) {
    if (!file) return
    setError(null)
    setResult(null)
    setBusy(true)

    try {
      const img = await fileToImage(file)
      setPreview(img.src)

      if (mode === MODE.AI) {
        await recognizeWithAI(img)
      } else {
        if (!index) throw new Error(t.translator.indexing)
        const match = findMatch(img, index)
        if (match?.matched) {
          setResult({ source: 'demo', ...match })
        } else {
          setResult({ source: 'demo', notFound: true, best: match })
        }
      }
    } catch (e) {
      setError(e.message)
    } finally {
      setBusy(false)
    }
  }

  async function recognizeWithAI(img) {
    // Жіберер алдында кішірейтеміз: сұраныс шегіне сыю үшін де,
    // модельге артық пиксель үшін төлемеу үшін де.
    const { base64, mimeType } = downscaleForUpload(img)

    const resp = await fetch('/api/recognize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageBase64: base64, mimeType }),
    })
    const data = await resp.json()
    if (!resp.ok) throw new Error(data.message || 'AI қатесі')
    setResult({ source: 'ai', ai: data.result })
  }

  /* ── қолмен терілген мәтін ── */
  const manualResult = useMemo(
    () => (manual.trim() ? autoTransliterate(manual) : null),
    [manual]
  )

  const runicKeys = useMemo(
    () => runicAlphabet.signs.filter((s) => s.variant === 'orkhon'),
    []
  )
  const toteKeys = useMemo(() => toteAlphabet.signs, [])

  const reset = () => {
    setPreview(null); setResult(null); setError(null)
    if (fileRef.current) fileRef.current.value = ''
    if (cameraRef.current) cameraRef.current.value = ''
  }

  return (
    <section id="translate" className="section section--light translator">
      <div className="container">
        <div className="translator__head reveal">
          <p className="eyebrow">{t.translator.eyebrow}</p>
          <h2>
            {t.translator.title}{' '}
            <span className="accent-italic">{t.translator.titleAccent}</span>
          </h2>
          <p className="translator__lead">{t.translator.lead}</p>
        </div>

        {/* ─────────  режим тумблері  ───────── */}
        <div className="mode reveal">
          <button
            className={`mode__btn ${mode === MODE.DEMO ? 'is-active' : ''}`}
            onClick={() => { setMode(MODE.DEMO); reset() }}
          >
            <span className="mode__label">{t.translator.modeDemo}</span>
            <span className="mode__hint">{t.translator.modeDemoHint}</span>
          </button>

          <button
            className={`mode__btn ${mode === MODE.AI ? 'is-active' : ''} ${!aiReady ? 'is-disabled' : ''}`}
            onClick={() => { if (aiReady) { setMode(MODE.AI); reset() } }}
            disabled={!aiReady}
            title={aiReady ? '' : t.translator.aiUnavailable}
          >
            <span className="mode__label">
              {t.translator.modeAI}
              {!aiReady && <span className="mode__badge">кілт жоқ</span>}
            </span>
            <span className="mode__hint">
              {aiReady ? t.translator.modeAIHint : t.translator.aiUnavailable}
            </span>
          </button>
        </div>

        {/* ─────────  сурет жүктеу  ───────── */}
        <div className="translator__grid">
          <div className="reveal">
            {!preview ? (
              <div
                className={`drop ${dragOver ? 'is-over' : ''}`}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault(); setDragOver(false)
                  handleFile(e.dataTransfer.files?.[0])
                }}
                onClick={() => fileRef.current?.click()}
              >
                <div className="drop__icon runic">𐰺</div>
                <p className="drop__title">{t.translator.dropTitle}</p>
                <p className="drop__hint">{t.translator.dropHint}</p>

                <button
                  className="btn btn--ghost drop__camera"
                  onClick={(e) => { e.stopPropagation(); cameraRef.current?.click() }}
                >
                  ⃝ {t.translator.camera}
                </button>

                {index === null && (
                  <div className="drop__progress">
                    <div className="drop__bar" style={{ width: `${indexing * 100}%` }} />
                    <span>{t.translator.indexing}</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="preview">
                <img src={preview} alt="" />
                <button className="btn btn--ghost preview__reset" onClick={reset}>
                  {t.translator.reset}
                </button>
              </div>
            )}

            <input
              ref={fileRef} type="file" accept="image/*" hidden
              onChange={(e) => handleFile(e.target.files?.[0])}
            />
            <input
              ref={cameraRef} type="file" accept="image/*" capture="environment" hidden
              onChange={(e) => handleFile(e.target.files?.[0])}
            />
          </div>

          {/* ─────────  нәтиже  ───────── */}
          <div className="reveal">
            {busy && <div className="result result--busy">{t.translator.analyzing}</div>}
            {error && <div className="result result--error">{error}</div>}

            {!busy && !error && result && (
              <ResultCard t={t} result={result} />
            )}

            {!busy && !error && !result && (
              <div className="result result--empty">
                <p>{t.translator.dropHint}</p>
              </div>
            )}
          </div>
        </div>

        {/* ─────────  қолмен теру  ───────── */}
        <div className="manual reveal">
          <h3 className="manual__title">{t.translator.orType}</h3>

          <div className="manual__tabs">
            <button
              className={kbd === 'runic' ? 'is-active' : ''}
              onClick={() => setKbd(kbd === 'runic' ? null : 'runic')}
            >
              {t.translator.keyboardRunic}
            </button>
            <button
              className={kbd === 'tote' ? 'is-active' : ''}
              onClick={() => setKbd(kbd === 'tote' ? null : 'tote')}
            >
              {t.translator.keyboardTote}
            </button>
          </div>

          <textarea
            className={`manual__input ${manualResult?.script === 'runic' ? 'runic' : ''} ${manualResult?.script === 'tote' ? 'arabic' : ''}`}
            value={manual}
            onChange={(e) => setManual(e.target.value)}
            placeholder="𐰋𐰃𐰠𐰏𐰀 𐰴𐰍𐰣   ·   قازاقستان   ·   қазақ"
            rows={3}
          />

          {kbd === 'runic' && (
            <div className="keyboard">
              {runicKeys.map((s) => (
                <button
                  key={s.cp}
                  className="keyboard__key"
                  onClick={() => setManual((v) => v + s.glyph)}
                  title={`${s.latin} · ${s.kaz}`}
                >
                  <span className="runic">{s.glyph}</span>
                  <small>{s.latin}</small>
                </button>
              ))}
              <button className="keyboard__key keyboard__key--wide"
                onClick={() => setManual((v) => v + ' ')}>␣</button>
              <button className="keyboard__key keyboard__key--wide"
                onClick={() => setManual((v) => v.slice(0, -2))}>⌫</button>
            </div>
          )}

          {kbd === 'tote' && (
            <div className="keyboard">
              {toteKeys.map((s) => (
                <button
                  key={s.arab + s.kaz}
                  className="keyboard__key"
                  onClick={() => setManual((v) => v + s.arab)}
                  title={s.kaz}
                >
                  <span className="arabic">{s.arab}</span>
                  <small>{s.kaz}</small>
                </button>
              ))}
              <button className="keyboard__key keyboard__key--wide"
                onClick={() => setManual((v) => v + ' ')}>␣</button>
              <button className="keyboard__key keyboard__key--wide"
                onClick={() => setManual((v) => v.slice(0, -1))}>⌫</button>
            </div>
          )}

          {manualResult && <ManualResult t={t} r={manualResult} />}
        </div>
      </div>
    </section>
  )
}

/* ══════════════════════  Нәтиже карточкасы  ══════════════════════ */

function ResultCard({ t, result }) {
  if (result.notFound) {
    return (
      <div className="result result--none">
        <h3>{t.translator.notFound}</h3>
        <p>{t.translator.notFoundHint}</p>
        {result.best && (
          <p className="result__debug">
            ең жақын: {result.best.item.atauy} · айырма {result.best.score.toFixed(1)}
          </p>
        )}
      </div>
    )
  }

  if (result.source === 'ai') {
    const a = result.ai
    return (
      <div className="result">
        <div className="result__badge result__badge--ai">Gemini Vision</div>
        {a.monument && <h3>{a.monument}</h3>}

        <Confidence t={t} value={a.confidence ?? 0} />

        {a.signs && (
          <Field label={t.translator.signs}>
            <span className={a.script === 'tote' ? 'arabic' : 'runic'}>{a.signs}</span>
          </Field>
        )}
        {a.latin && (
          <Field label={t.translator.latin}>
            <span className="latin-translit">{a.latin}</span>
          </Field>
        )}
        {a.kazakh && <Field label={t.translator.modern}><strong>{a.kazakh}</strong></Field>}
        {a.translation && <Field label={t.translator.meaning}>{a.translation}</Field>}
        {a.notes && <p className="result__notes">{a.notes}</p>}
      </div>
    )
  }

  // демо режимі — эталондық базадан
  const m = result.item
  const signs = m.type === 'runic' ? m.runic : m.arab
  const auto = m.type === 'runic'
    ? transliterateRunic(m.runic || '')
    : transliterateTote(m.arab || '')

  return (
    <div className="result">
      <div className="result__badge">{t.translator.monument}</div>
      <h3>{m.atauy}</h3>
      <p className="result__meta">{m.aimaq} · {m.jyl}</p>

      <Confidence t={t} value={result.confidence} />

      <Field label={t.translator.signs}>
        <span className={m.type === 'runic' ? 'runic' : 'arabic'}>{signs}</span>
      </Field>

      {m.type === 'runic' && (
        <Field label={t.translator.latin}>
          <span className="latin-translit">{m.latin}</span>
          {auto.latin && auto.latin !== m.latin && (
            <span className="result__auto">алгоритм: {auto.latin}</span>
          )}
        </Field>
      )}

      <Field label={t.translator.modern}><strong>{m.kazakh}</strong></Field>
      <Field label={t.translator.meaning}>{m.tolyq_kazakh}</Field>

      {m.type === 'runic' && auto.vowelsOmitted && (
        <p className="result__notes">{t.translator.vowelNote}</p>
      )}

      <p className="result__source">{m.sipattama}</p>
    </div>
  )
}

function ManualResult({ t, r }) {
  return (
    <div className="manual__result">
      {r.script === 'runic' && (
        <>
          <Field label={t.translator.latin}>
            <span className="latin-translit">{r.latin || '—'}</span>
          </Field>
          <Field label={t.translator.modern}><strong>{r.kazakh || '—'}</strong></Field>
          {r.vowelsOmitted && <p className="result__notes">{t.translator.vowelNote}</p>}
        </>
      )}

      {r.script === 'tote' && (
        <Field label={t.translator.modern}><strong>{r.kazakh || '—'}</strong></Field>
      )}

      {r.script === 'kazakh' && (
        <>
          <Field label="Руникамен"><span className="runic">{r.runic}</span></Field>
          <Field label="Төте жазумен"><span className="arabic">{r.tote}</span></Field>
        </>
      )}

      {r.unknown?.length > 0 && (
        <p className="result__notes">
          танылмаған таңба: {[...new Set(r.unknown)].join(' ')}
        </p>
      )}
    </div>
  )
}

function Field({ label, children }) {
  return (
    <div className="field">
      <span className="field__label">{label}</span>
      <div className="field__value">{children}</div>
    </div>
  )
}

function Confidence({ t, value }) {
  const pct = Math.round((value ?? 0) * 100)
  const tone = pct >= 70 ? 'high' : pct >= 40 ? 'mid' : 'low'
  return (
    <div className={`conf conf--${tone}`}>
      <span className="conf__label">{t.translator.confidence}</span>
      <div className="conf__bar"><div style={{ width: `${pct}%` }} /></div>
      <span className="conf__pct">{pct}%</span>
    </div>
  )
}
