import { useEffect } from 'react'

/**
 * Скроллда элементтерді біртіндеп шығару (.reveal → .is-visible).
 *
 * Маңызды: бақылаушы тек монтаж кезіндегі элементтерді емес, КЕЙІН пайда
 * болғандарын да ұстауы керек. Мұрағат бөлімінде нәтиже блоктары кейін
 * қосылады — оларды бақыламасақ, DOM-да тұрғанымен мөлдір күйінде қалып,
 * экран бос көрінеді.
 */
export function useReveal() {
  useEffect(() => {
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

    const observeAll = () => {
      document.querySelectorAll('.reveal:not(.is-visible)').forEach((el) => io.observe(el))
    }

    observeAll()

    // Жаңа .reveal элементтері пайда болса, оларды да қосамыз
    const mo = new MutationObserver((records) => {
      let added = false
      for (const r of records) {
        for (const node of r.addedNodes) {
          if (node.nodeType !== 1) continue
          if (node.classList?.contains('reveal') || node.querySelector?.('.reveal')) {
            added = true
            break
          }
        }
        if (added) break
      }
      if (added) observeAll()
    })

    mo.observe(document.body, { childList: true, subtree: true })

    return () => { io.disconnect(); mo.disconnect() }
  }, [])
}
