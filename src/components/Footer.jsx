export default function Footer({ t }) {
  return (
    <footer className="footer">
      <div className="container footer__inner">
        <div>
          <div className="footer__logo">
            <span className="runic">𐰚𐰇𐰠𐱅𐰏𐰤</span>
          </div>
          <p className="footer__tagline">{t.footer.tagline}</p>
        </div>
        <div className="footer__meta">
          <p>{t.footer.made}</p>
          <p className="footer__sources">{t.footer.sources}</p>
        </div>
      </div>
    </footer>
  )
}
