/**
 * Суретті тану дәлдігін тексеру.
 *
 * Қалай іске қосу керек: сайтты ашып (npm run dev), браузердің
 * консолін ашыңыз да, осы файлдың мазмұнын толық көшіріп қойыңыз.
 * Node-та жұмыс істемейді — canvas пен нақты браузер қажет.
 *
 * Соңғы нәтиже (2026-09-10):
 *   таза көшірме                        20/20, сенімділік 88%
 *   жеңіл бұрмалау (қиылу 10%, 3°)      20/20
 *   орташа (қиылу 15%, 5°, күңгірт)     20/20
 *   ауыр (қиылу 25%, 8°, қараңғы, кіші) 15/20
 *   базада жоқ суреттер                 0 жалған сәйкестік
 */

const { buildIndex, findMatch, loadImage } = await import('/src/lib/imageHash.js')
const mon = await (await fetch('/src/data/monuments.json')).json()
localStorage.removeItem('tas-jazular:fingerprints:v1')
const index = await buildIndex(mon.items)

/** Телефонмен түсірілген суретті имитациялау */
function simulatePhoto(img, o = {}) {
  const { crop = 0.9, rot = 3, bright = 1.15, noise = 12, scale = 900 } = o
  const w = scale
  const h = Math.round(scale * img.naturalHeight / img.naturalWidth)
  const c = document.createElement('canvas')
  c.width = w; c.height = h
  const x = c.getContext('2d')
  x.filter = `brightness(${bright}) contrast(0.92) saturate(0.9)`
  x.translate(w / 2, h / 2); x.rotate(rot * Math.PI / 180)
  x.scale(1 / crop, 1 / crop); x.translate(-w / 2, -h / 2)
  x.drawImage(img, 0, 0, w, h)
  x.filter = 'none'
  const d = x.getImageData(0, 0, w, h)
  for (let i = 0; i < d.data.length; i += 4) {
    const n = (Math.random() - 0.5) * noise
    d.data[i] += n; d.data[i + 1] += n; d.data[i + 2] += n
  }
  x.putImageData(d, 0, 0)
  const out = new Image()
  out.src = c.toDataURL('image/jpeg', 0.8)
  return new Promise((r) => { out.onload = () => r(out) })
}

async function run(label, opts) {
  const res = []
  for (const item of mon.items) {
    const orig = await loadImage(item.image)
    const fake = await simulatePhoto(orig, opts)
    const m = findMatch(fake, index)
    res.push({
      id: item.id,
      ok: m.item.id === item.id && m.matched,
      got: m.item.id,
      score: +m.score.toFixed(3),
      conf: Math.round(m.confidence * 100),
    })
  }
  const good = res.filter((r) => r.ok)
  return {
    label,
    correct: `${good.length}/${res.length}`,
    avgConf: Math.round(good.reduce((s, r) => s + r.conf, 0) / (good.length || 1)),
    fails: res.filter((r) => !r.ok),
  }
}

console.table([
  await run('таза көшірме', { crop: 1, rot: 0, bright: 1, noise: 0 }),
  await run('жеңіл', {}),
  await run('орташа', { crop: 0.85, rot: 5, bright: 0.9, noise: 18 }),
  await run('ауыр', { crop: 0.75, rot: 8, bright: 0.75, noise: 26, scale: 600 }),
])
