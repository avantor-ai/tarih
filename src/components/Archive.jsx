import { useEffect, useMemo, useRef, useState } from 'react'
import { fileToImage, downscaleForUpload } from '../lib/imageHash'

const STATUS = { IDLE: 'idle', QUEUED: 'queued', WORKING: 'working', DONE: 'done', FAILED: 'failed' }

export default function Archive({ t }) {
  const [pages, setPages] = useState([])   // {id, name, preview, status, result, error}
  const [aiReady, setAiReady] = useState(false)
  const [busy, setBusy] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [active, setActive] = useState(0)
  const [exporting, setExporting] = useState(false)

  const fileRef = useRef(null)
  const cameraRef = useRef(null)

  useEffect(() => {
    fetch('/api/health')
      .then((r) => r.json())
      .then((d) => setAiReady(Boolean(d.aiReady)))
      .catch(() => setAiReady(false))
  }, [])

  /* ─────────  беттерді қосу  ───────── */

  async function addFiles(fileList) {
    const files = [...(fileList || [])].filter((f) => f.type.startsWith('image/'))
    if (!files.length) return

    const added = []
    for (const file of files) {
      try {
        const img = await fileToImage(file)
        added.push({
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          name: file.name,
          preview: img.src,
          img,
          status: STATUS.QUEUED,
          result: null,
          error: null,
        })
      } catch (e) {
        console.warn('бет қосылмады:', file.name, e.message)
      }
    }
    setPages((prev) => [...prev, ...added])
  }

  /* ─────────  цифрлау  ───────── */

  async function runAll() {
    setBusy(true)
    for (const page of pages) {
      if (page.status === STATUS.DONE) continue
      await runOne(page.id)
    }
    setBusy(false)
  }

  async function runOne(id) {
    setPages((prev) => prev.map((p) => p.id === id ? { ...p, status: STATUS.WORKING, error: null } : p))

    const page = pages.find((p) => p.id === id) ?? null
    const img = page?.img
    if (!img) {
      setPages((prev) => prev.map((p) => p.id === id
        ? { ...p, status: STATUS.FAILED, error: 'Сурет жоғалды' } : p))
      return
    }

    try {
      const { base64, mimeType } = downscaleForUpload(img, 2000, 0.9)
      const resp = await fetch('/api/transcribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: base64, mimeType }),
      })
      const data = await resp.json()
      if (!resp.ok) throw new Error(data.message || 'Цифрлау сәтсіз')

      setPages((prev) => prev.map((p) => p.id === id
        ? { ...p, status: STATUS.DONE, result: data.result } : p))
    } catch (e) {
      setPages((prev) => prev.map((p) => p.id === id
        ? { ...p, status: STATUS.FAILED, error: e.message } : p))
    }
  }

  /* ─────────  мәтінді түзету  ───────── */

  function editBlock(pageId, blockIndex, value) {
    setPages((prev) => prev.map((p) => {
      if (p.id !== pageId) return p
      const blocks = [...(p.result?.blocks || [])]
      blocks[blockIndex] = { ...blocks[blockIndex], text: value, edited: true }
      return { ...p, result: { ...p.result, blocks } }
    }))
  }

  function editModern(pageId, value) {
    setPages((prev) => prev.map((p) => p.id === pageId
      ? { ...p, result: { ...p.result, modern: value, edited: true } } : p))
  }

  /* ─────────  экспорт  ───────── */

  const done = useMemo(() => pages.filter((p) => p.status === STATUS.DONE), [pages])

  // docx кітапханасы ~350 КБ — оны бастапқы жүктеуге қоспай,
  // экспорт басылған сәтте ғана тартамыз.
  const loadExporter = () => import('../lib/docxExport')

  const stamp = () => new Date().toISOString().slice(0, 10)

  async function exportDocx() {
    if (!done.length) return
    setExporting(true)
    try {
      const { buildDocx, downloadBlob } = await loadExporter()
      const blob = await buildDocx({ pages: done })
      downloadBlob(blob, `murağat-${stamp()}.docx`)
    } catch (e) {
      console.error('docx қатесі:', e)
    } finally {
      setExporting(false)
    }
  }

  async function exportTxt() {
    if (!done.length) return
    const { buildPlainText, downloadBlob } = await loadExporter()
    downloadBlob(new Blob([buildPlainText({ pages: done })], { type: 'text/plain;charset=utf-8' }),
      `murağat-${stamp()}.txt`)
  }

  async function copyText() {
    if (!done.length) return
    const { buildPlainText } = await loadExporter()
    try {
      await navigator.clipboard.writeText(buildPlainText({ pages: done }))
    } catch { /* рұқсат берілмеді */ }
  }

  const current = pages[active] ?? null
  const progress = pages.length
    ? Math.round(pages.filter((p) => p.status === STATUS.DONE).length / pages.length * 100)
    : 0

  return (
    <section id="archive" className="section section--light archive">
      <div className="container">
        <div className="archive__head reveal">
          <p className="eyebrow">{t.archive.eyebrow}</p>
          <h2>
            {t.archive.title}{' '}
            <span className="accent-italic">{t.archive.titleAccent}</span>
          </h2>
          <p className="archive__lead">{t.archive.lead}</p>
        </div>

        {!aiReady && (
          <div className="archive__warn reveal">
            <strong>{t.archive.needKey}</strong>
            <p>{t.archive.needKeyHint}</p>
          </div>
        )}

        {/* ─────────  беттерді жүктеу  ───────── */}
        {!pages.length ? (
          <div
            className={`drop reveal ${dragOver ? 'is-over' : ''}`}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => { e.preventDefault(); setDragOver(false); addFiles(e.dataTransfer.files) }}
            onClick={() => fileRef.current?.click()}
          >
            <div className="drop__icon drop__icon--doc">
              {/* Эмодзи орнына SVG: барлық жүйеде бірдей көрінеді */}
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
                   strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"
                   aria-hidden="true">
                <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
                <path d="M14 3v5h5" />
                <path d="M9 12h6M9 15h6M9 18h3" />
              </svg>
            </div>
            <p className="drop__title">{t.archive.dropTitle}</p>
            <p className="drop__hint">{t.archive.dropHint}</p>
            <button
              className="btn btn--ghost drop__camera"
              onClick={(e) => { e.stopPropagation(); cameraRef.current?.click() }}
            >
              {t.archive.camera}
            </button>
          </div>
        ) : (
          <>
            {/* ─────────  беттер жолағы  ───────── */}
            <div className="pages reveal">
              {pages.map((p, i) => (
                <button
                  key={p.id}
                  className={`pages__item ${i === active ? 'is-active' : ''} is-${p.status}`}
                  onClick={() => setActive(i)}
                  title={p.name}
                >
                  <img src={p.preview} alt="" />
                  <span className="pages__num">{i + 1}</span>
                  <span className={`pages__dot pages__dot--${p.status}`} />
                </button>
              ))}
              <button className="pages__add" onClick={() => fileRef.current?.click()}>
                +<small>{t.archive.addPage}</small>
              </button>
            </div>

            <div className="archive__bar reveal">
              <button
                className="btn btn--primary"
                onClick={runAll}
                disabled={busy || !aiReady}
              >
                {busy ? t.archive.working : t.archive.run}
              </button>

              <div className="archive__progress">
                <div style={{ width: `${progress}%` }} />
              </div>
              <span className="archive__count">
                {pages.filter((p) => p.status === STATUS.DONE).length} / {pages.length}
              </span>

              <div className="archive__exports">
                <button className="btn btn--ghost" onClick={exportDocx} disabled={!done.length || exporting}>
                  {exporting ? '…' : t.archive.exportDocx}
                </button>
                <button className="btn btn--ghost" onClick={exportTxt} disabled={!done.length}>
                  {t.archive.exportTxt}
                </button>
                <button className="btn btn--ghost" onClick={copyText} disabled={!done.length}>
                  {t.archive.copy}
                </button>
                <button className="btn btn--ghost" onClick={() => { setPages([]); setActive(0) }}>
                  {t.archive.clear}
                </button>
              </div>
            </div>

            {/* ─────────  түпнұсқа мен мәтін қатар  ───────── */}
            {current && (
              <div className="archive__work reveal">
                <div className="archive__scan">
                  <img src={current.preview} alt={current.name} />
                  <p className="archive__filename">{current.name}</p>
                </div>

                <div className="archive__text scrollbar-thin">
                  {current.status === STATUS.QUEUED && (
                    <p className="archive__placeholder">{t.archive.queued}</p>
                  )}
                  {current.status === STATUS.WORKING && (
                    <p className="archive__placeholder">{t.archive.working}</p>
                  )}
                  {current.status === STATUS.FAILED && (
                    <div className="archive__error">
                      <p>{current.error}</p>
                      <button className="btn btn--ghost" onClick={() => runOne(current.id)}>
                        {t.archive.retry}
                      </button>
                    </div>
                  )}
                  {current.status === STATUS.DONE && current.result && (
                    <PageResult
                      t={t}
                      page={current}
                      onEditBlock={(i, v) => editBlock(current.id, i, v)}
                      onEditModern={(v) => editModern(current.id, v)}
                    />
                  )}
                </div>
              </div>
            )}
          </>
        )}

        <input
          ref={fileRef} type="file" accept="image/*" multiple hidden
          onChange={(e) => { addFiles(e.target.files); e.target.value = '' }}
        />
        <input
          ref={cameraRef} type="file" accept="image/*" capture="environment" hidden
          onChange={(e) => { addFiles(e.target.files); e.target.value = '' }}
        />

        <p className="archive__disclaimer reveal">{t.archive.disclaimer}</p>
      </div>
    </section>
  )
}

/* ══════════════════════  Бір беттің нәтижесі  ══════════════════════ */

const BLOCK_LABEL = {
  heading: 'Тақырып', paragraph: 'Мәтін', date: 'Күні',
  signature: 'Қолы', margin: 'Шет жақтағы белгі', table: 'Кесте',
}

function PageResult({ t, page, onEditBlock, onEditModern }) {
  const r = page.result
  const conf = Math.round((r.confidence ?? 0) * 100)

  return (
    <div className="pr">
      <div className="pr__meta">
        {r.docType && <span className="pr__tag">{r.docType}</span>}
        {r.dating && <span className="pr__tag">{r.dating}</span>}
        {r.script && <span className="pr__tag pr__tag--dim">{r.script}</span>}
        <span className={`pr__conf ${conf < 70 ? 'is-low' : ''}`}>{conf}%</span>
      </div>

      {r.summary && <p className="pr__summary">{r.summary}</p>}

      <h4 className="pr__section">{t.archive.original}</h4>
      {r.blocks?.length ? r.blocks.map((b, i) => {
        const c = Math.round((b.confidence ?? 0) * 100)
        const low = c < 70
        return (
          <div className={`pr__block ${low ? 'is-low' : ''}`} key={i}>
            <div className="pr__blockhead">
              <span>{BLOCK_LABEL[b.type] || BLOCK_LABEL.paragraph}</span>
              <span className={low ? 'is-low' : ''}>{c}%{b.edited ? ' · түзетілді' : ''}</span>
            </div>
            <textarea
              className="pr__input"
              value={b.text || ''}
              onChange={(e) => onEditBlock(i, e.target.value)}
              rows={Math.min(10, Math.max(2, Math.ceil((b.text || '').length / 60)))}
            />
            {b.uncertain?.length > 0 && (
              <p className="pr__uncertain">
                {t.archive.uncertain}: {b.uncertain.join(' · ')}
              </p>
            )}
          </div>
        )
      }) : (
        <p className="archive__placeholder">{t.archive.noText}</p>
      )}

      {r.modern && (
        <>
          <h4 className="pr__section">{t.archive.modern}</h4>
          <textarea
            className="pr__input pr__input--modern"
            value={r.modern}
            onChange={(e) => onEditModern(e.target.value)}
            rows={Math.min(14, Math.max(3, Math.ceil(r.modern.length / 60)))}
          />
        </>
      )}

      {r.notes && <p className="pr__notes">{r.notes}</p>}
    </div>
  )
}
