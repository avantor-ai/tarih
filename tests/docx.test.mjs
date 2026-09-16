/**
 * .docx экспортын тексеру: файл шынымен ашыла ма, ішінде мәтін бар ма.
 * Іске қосу:
 *   npx esbuild tests/docx.test.mjs --bundle --platform=node --format=esm \
 *     --outfile=/tmp/d.mjs && node /tmp/d.mjs
 */
import { writeFileSync } from 'node:fs'
import { buildDocx, buildPlainText } from '../src/lib/docxExport.js'

const mock = [{
  result: {
    script: 'arabic', language: 'kk', docType: 'өтініш', dating: '1907 ж.', confidence: 0.82,
    summary: 'Дала генерал-губернаторына жазылған өтініш.',
    blocks: [
      { type: 'heading', text: 'Дала генерал-губернаторы мырзаға', confidence: 0.91, uncertain: [] },
      { type: 'paragraph', text: 'Біз, Ақмола уезінің тұрғындары, төмендегіні мәлім етеміз […]', confidence: 0.64, uncertain: ['уезінің'] },
      { type: 'date', text: '1907 жылғы 14 наурыз', confidence: 0.88, uncertain: [] },
      { type: 'signature', text: 'Қолы: […]', confidence: 0.41, uncertain: ['қолтаңба'] },
    ],
    modern: 'Біз, Ақмола уезінің тұрғындары, мынаны мәлімдейміз…',
    notes: 'Сия оңған, қолтаңба оқылмады.',
  },
}]

const blob = await buildDocx({ pages: mock, title: 'Тесттік құжат' })
const buf = Buffer.from(await blob.arrayBuffer())
writeFileSync('/tmp/tas-jazular-test.docx', buf)

console.log('docx жазылды: /tmp/tas-jazular-test.docx,', buf.length, 'байт')
console.log('ZIP қолтаңбасы:', buf.subarray(0, 4).toString('hex'))
console.log()
console.log('--- txt үлгісі ---')
console.log(buildPlainText({ pages: mock }).slice(0, 400))
