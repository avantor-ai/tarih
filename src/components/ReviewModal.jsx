import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { isEmail, submitReview } from '../lib/review'

export const REVIEWER_PHOTO = '/reviewer/zhumabayeva.jpg'

/**
 * Аударманы маманның тексеруіне жіберу терезесі.
 * Сол жақта — тексерушінің суреті мен лауазымы, оң жақта — қысқа өтінім.
 *
 * @param {object} subject  не тексерілетіні: {source, id?, title?, original?, translation?}
 */
export default function ReviewModal({ t, lang, subject, onClose }) {
  const R = t.review
  // botcheck — адамға көрінбейтін өріс: оны тек спам-бот толтырады
  const [form, setForm] = useState({ name: '', purpose: '', email: '', botcheck: '' })
  const [errors, setErrors] = useState({})
  const [state, setState] = useState('form') // form | sending | done | error
  const firstRef = useRef(null)

  useEffect(() => {
    firstRef.current?.focus()
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [onClose])

  const set = (k) => (e) => {
    setForm((f) => ({ ...f, [k]: e.target.value }))
    if (errors[k]) setErrors((er) => ({ ...er, [k]: null }))
  }

  function validate() {
    const er = {}
    if (form.name.trim().length < 2) er.name = R.errName
    if (form.purpose.trim().length < 3) er.purpose = R.errPurpose
    if (!isEmail(form.email)) er.email = R.errEmail
    setErrors(er)
    return Object.keys(er).length === 0
  }

  async function onSubmit(e) {
    e.preventDefault()
    if (!validate()) return
    setState('sending')
    try {
      await submitReview({
        name: form.name.trim(),
        purpose: form.purpose.trim(),
        email: form.email.trim(),
        lang,
        subject,
        botcheck: form.botcheck,
        page: window.location.href,
        createdAt: new Date().toISOString(),
      })
      setState('done')
    } catch {
      setState('error')
    }
  }

  // Порталмен body-ге: .reveal анимациясының transform-ы fixed терезені ығыстырмасын
  return createPortal(
    <div className="rv" onClick={onClose}>
      <div className="rv__box scrollbar-thin" role="dialog" aria-modal="true" aria-labelledby="rv-title"
           onClick={(e) => e.stopPropagation()}>
        <button className="rv__close" onClick={onClose} aria-label={R.close}>×</button>

        {/* ── тексеруші ── */}
        <aside className="rv__expert">
          <p className="rv__label">{R.reviewer}</p>
          <div className="rv__photo">
            <img src={REVIEWER_PHOTO} alt={R.reviewerName} />
          </div>
          <div className="rv__who">
            <span className="rv__degree">{R.reviewerDegree}</span>
            <h3 className="rv__name">{R.reviewerName}</h3>
            <p className="rv__role">{R.reviewerRole}</p>
          </div>
        </aside>

        {/* ── өтінім ── */}
        <div className="rv__main">
          {state === 'done' ? (
            <div className="rv__done" role="status">
              <div className="rv__check" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"
                     strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
              </div>
              <h3>{R.successTitle}</h3>
              <p>{R.successText}</p>
              <p className="rv__done-mail">{form.email}</p>
              <button className="btn btn--primary" onClick={onClose}>{R.close}</button>
            </div>
          ) : (
            <form className="rv__form" onSubmit={onSubmit} noValidate>
              <p className="eyebrow">{R.button}</p>
              <h2 id="rv-title">{R.title} <span className="accent-italic">{R.titleAccent}</span></h2>
              <p className="rv__lead">{R.lead}</p>

              {subject?.title && (
                <div className="rv__subject">
                  <span>{R.subject}</span>
                  <strong>{subject.title}</strong>
                </div>
              )}

              <Field id="rv-name" label={R.name} error={errors.name}>
                <input id="rv-name" ref={firstRef} type="text" autoComplete="name"
                       value={form.name} onChange={set('name')} placeholder={R.namePh} />
              </Field>
              <Field id="rv-purpose" label={R.purpose} error={errors.purpose}>
                <textarea id="rv-purpose" rows={3}
                          value={form.purpose} onChange={set('purpose')} placeholder={R.purposePh} />
              </Field>
              <Field id="rv-email" label={R.email} error={errors.email}>
                <input id="rv-email" type="email" inputMode="email" autoComplete="email"
                       value={form.email} onChange={set('email')} placeholder={R.emailPh} />
              </Field>

              <input type="text" name="botcheck" className="rv__trap" tabIndex={-1} autoComplete="off"
                     aria-hidden="true" value={form.botcheck} onChange={set('botcheck')} />

              <p className="rv__consent">{R.consent}</p>
              {state === 'error' && <p className="rv__error" role="alert">{R.errSend}</p>}

              <div className="rv__actions">
                <button type="button" className="btn btn--ghost" onClick={onClose}>{R.cancel}</button>
                <button type="submit" className="btn btn--primary" disabled={state === 'sending'}>
                  {state === 'sending' ? R.sending : R.submit}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>,
    document.body
  )
}

function Field({ id, label, error, children }) {
  return (
    <div className={`rv__field ${error ? 'is-error' : ''}`}>
      <label htmlFor={id}>{label}</label>
      {children}
      {error && <span className="rv__err">{error}</span>}
    </div>
  )
}
