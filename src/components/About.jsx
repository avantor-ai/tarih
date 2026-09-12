export default function About({ t }) {
  return (
    <section id="about" className="section section--darker about">
      <div className="container">
        <div className="about__head reveal">
          <p className="eyebrow">{t.about.eyebrow}</p>
          <h2>
            {t.about.title}{' '}
            <span className="accent-italic">{t.about.titleAccent}</span>
          </h2>
          <p className="about__mission">{t.about.mission}</p>
        </div>

        <div className="stats reveal">
          {t.about.stats.map((s) => (
            <div className="stats__cell" key={s.label}>
              <div className="stats__value">{s.value}</div>
              <div className="stats__label">{s.label}</div>
            </div>
          ))}
        </div>

        <h3 className="about__sub reveal">{t.about.howTitle}</h3>
        <div className="how">
          {t.about.how.map((h) => (
            <article className="how__card reveal" key={h.n}>
              <span className="how__num">{h.n}</span>
              <h4>{h.t}</h4>
              <p>{h.d}</p>
            </article>
          ))}
        </div>

        <div className="honest reveal">
          <h3 className="honest__title">{t.about.honestTitle}</h3>
          <ul className="honest__list">
            {t.about.honest.map((line, i) => (
              <li key={i}>{line}</li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}
