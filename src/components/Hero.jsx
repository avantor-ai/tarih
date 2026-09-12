import { Suspense, lazy } from 'react'

const HeroScene = lazy(() => import('../three/HeroScene'))

export default function Hero({ t, scrollRef }) {
  return (
    <section id="home" className="hero">
      <div className="hero__canvas">
        <Suspense fallback={<div className="hero__loading" />}>
          <HeroScene scrollRef={scrollRef} />
        </Suspense>
      </div>

      <div className="hero__veil" />

      <div className="hero__content container">
        <h1 className="hero__title">
          {t.hero.title}
          <br />
          <span className="accent-italic">{t.hero.titleAccent}</span>
        </h1>

        <p className="hero__subtitle">{t.hero.subtitle}</p>

        <div className="hero__actions">
          <a href="#translate" className="btn btn--primary">{t.hero.primary}</a>
          <a href="#knowledge" className="btn btn--ghost">{t.hero.secondary}</a>
        </div>
      </div>

      <a href="#intro" className="hero__scroll" aria-label={t.hero.scroll}>
        <span className="hero__scroll-ring">↓</span>
        <span className="hero__scroll-label">{t.hero.scroll}</span>
      </a>
    </section>
  )
}
