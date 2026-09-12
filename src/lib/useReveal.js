import { useEffect } from 'react'

/** Скроллда элементтерді біртіндеп шығару (.reveal → .is-visible) */
export function useReveal(deps = []) {
  useEffect(() => {
    const els = document.querySelectorAll('.reveal:not(.is-visible)')
    if (!els.length) return

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('is-visible')
            io.unobserve(e.target)
          }
        })
      },
      { threshold: 0.14, rootMargin: '0px 0px -8% 0px' }
    )

    els.forEach((el) => io.observe(el))
    return () => io.disconnect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
}
