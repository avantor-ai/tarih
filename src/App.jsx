import { useEffect, useRef } from 'react'
import kk from './i18n/kk'
import Nav from './components/Nav'
import Hero from './components/Hero'
import Marquee from './components/Marquee'
import Translator from './components/Translator'
import Archive from './components/Archive'
import Knowledge from './components/Knowledge'
import About from './components/About'
import Footer from './components/Footer'
import { useReveal } from './lib/useReveal'
import './styles/app.css'

export default function App() {
  const t = kk
  // 3D сахнаға скролл күйін ref арқылы береміз — қайта рендер болмайды
  const scrollRef = useRef(0)

  useEffect(() => {
    const onScroll = () => {
      const h = window.innerHeight
      scrollRef.current = Math.min(1, Math.max(0, window.scrollY / (h * 1.15)))
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useReveal()

  return (
    <>
      <Nav t={t} />
      <main>
        <Hero t={t} scrollRef={scrollRef} />
        <Marquee items={t.marquee} />

        <section id="intro" className="section section--dark intro">
          <div className="container intro__grid">
            <div className="reveal">
              <p className="eyebrow">{t.intro.eyebrow}</p>
              <h2 className="intro__statement">{t.intro.text}</h2>
            </div>
            <div className="intro__body reveal">
              <p>{t.intro.body}</p>
              <a href="#translate" className="btn btn--ghost">{t.hero.primary}</a>
            </div>
          </div>
        </section>

        <Translator t={t} />
        <Archive t={t} />
        <Knowledge t={t} />
        <About t={t} />
      </main>
      <Footer t={t} />
    </>
  )
}
