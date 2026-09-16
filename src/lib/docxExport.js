/**
 * Цифрланған мұрағат құжатын .docx файлына айналдыру.
 *
 * Бәрі браузерде жасалады: серверге жүк түспейді, интернет қажет емес,
 * әрі пайдаланушы мәтінді түзеткеннен кейін бірден жүктей алады.
 */

import {
  Document, Packer, Paragraph, TextRun, HeadingLevel,
  AlignmentType, BorderStyle,
} from 'docx'

const FONT = 'Times New Roman'

/** Блок түрі → адам оқитын атау */
const BLOCK_LABEL = {
  heading: 'Тақырып',
  paragraph: 'Мәтін',
  date: 'Күні',
  signature: 'Қолы',
  margin: 'Шет жақтағы белгі',
  table: 'Кесте',
}

function heading(text, level = HeadingLevel.HEADING_1) {
  return new Paragraph({
    heading: level,
    spacing: { before: 240, after: 120 },
    children: [new TextRun({ text, font: FONT, bold: true })],
  })
}

function body(text, opts = {}) {
  return new Paragraph({
    spacing: { after: 120 },
    alignment: opts.align,
    children: [new TextRun({
      text,
      font: FONT,
      size: opts.size ?? 24,        // half-points: 24 = 12pt
      italics: opts.italic,
      bold: opts.bold,
      color: opts.color,
    })],
  })
}

function divider() {
  return new Paragraph({
    spacing: { before: 200, after: 200 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: 'CCCCCC' } },
    children: [],
  })
}

/**
 * Бір блокты абзацқа айналдыру. Күмәнді блоктар көзге түсіп тұрсын —
 * мұрағатшы нені тексеру керегін бірден көреді.
 */
function blockToParagraphs(block, index) {
  const out = []
  const label = BLOCK_LABEL[block.type] || BLOCK_LABEL.paragraph
  const conf = typeof block.confidence === 'number' ? Math.round(block.confidence * 100) : null
  const shaky = conf !== null && conf < 70

  out.push(new Paragraph({
    spacing: { before: 160, after: 40 },
    children: [new TextRun({
      text: conf !== null ? `${label} · сенімділік ${conf}%` : label,
      font: FONT, size: 18, color: shaky ? 'B45309' : '888888',
      bold: shaky,
    })],
  }))

  const isDate = block.type === 'date'
  const isSig = block.type === 'signature'
  out.push(body(block.text || '—', {
    italic: block.type === 'margin',
    bold: block.type === 'heading',
    align: isDate || isSig ? AlignmentType.RIGHT : undefined,
  }))

  if (block.uncertain?.length) {
    out.push(new Paragraph({
      spacing: { after: 80 },
      children: [new TextRun({
        text: 'Күмәнді үзінділер: ' + block.uncertain.join(' · '),
        font: FONT, size: 18, italics: true, color: 'B45309',
      })],
    }))
  }
  return out
}

/**
 * Құжатты .docx түрінде жинау.
 * @param {{pages: Array, title?: string}} input
 * @returns {Promise<Blob>}
 */
export async function buildDocx({ pages, title = 'Цифрланған мұрағат құжаты' }) {
  const children = []

  children.push(heading(title, HeadingLevel.TITLE))

  const first = pages[0]?.result
  if (first) {
    const meta = []
    if (first.docType) meta.push(`Түрі: ${first.docType}`)
    if (first.dating) meta.push(`Күні: ${first.dating}`)
    if (first.script) meta.push(`Жазуы: ${first.script}`)
    if (first.language) meta.push(`Тілі: ${first.language}`)
    if (meta.length) children.push(body(meta.join('   ·   '), { size: 20, color: '666666' }))
  }

  children.push(body(
    `Цифрланған күні: ${new Date().toLocaleDateString('kk-KZ')}   ·   Беттер саны: ${pages.length}`,
    { size: 18, color: '888888' }
  ))
  children.push(divider())

  pages.forEach((page, i) => {
    const r = page.result || {}
    if (pages.length > 1) children.push(heading(`${i + 1}-бет`, HeadingLevel.HEADING_1))

    if (r.summary) {
      children.push(body(r.summary, { italic: true, size: 22, color: '555555' }))
    }

    children.push(heading('Түпнұсқа мәтін', HeadingLevel.HEADING_2))
    if (r.blocks?.length) {
      r.blocks.forEach((b, j) => blockToParagraphs(b, j).forEach((p) => children.push(p)))
    } else {
      children.push(body('Мәтін танылмады.', { italic: true, color: '888888' }))
    }

    if (r.modern) {
      children.push(heading('Қазіргі қазақ тілінде', HeadingLevel.HEADING_2))
      children.push(body(r.modern))
    }

    if (r.notes) {
      children.push(heading('Ескертпелер', HeadingLevel.HEADING_2))
      children.push(body(r.notes, { italic: true, size: 22, color: '666666' }))
    }

    if (i < pages.length - 1) children.push(divider())
  })

  children.push(divider())
  children.push(body(
    'Бұл мәтін автоматты түрде танылған. Мұрағаттық қолданысқа берер алдында '
    + 'түпнұсқамен салыстырып тексеру қажет. Сенімділігі төмен блоктар қоңыр түспен белгіленген.',
    { size: 18, italic: true, color: '888888' }
  ))

  const doc = new Document({
    creator: 'Тас жазулар',
    title,
    description: 'Мұрағат құжатының автоматты цифрлануы',
    sections: [{ properties: {}, children }],
  })

  return Packer.toBlob(doc)
}

/** Таза мәтін нұсқасы — көшіріп алуға ыңғайлы */
export function buildPlainText({ pages, title = 'Цифрланған мұрағат құжаты' }) {
  const lines = [title, '='.repeat(title.length), '']

  pages.forEach((page, i) => {
    const r = page.result || {}
    if (pages.length > 1) lines.push(`── ${i + 1}-бет ──`, '')
    if (r.dating) lines.push(`Күні: ${r.dating}`)
    if (r.docType) lines.push(`Түрі: ${r.docType}`)
    if (r.dating || r.docType) lines.push('')

    lines.push('ТҮПНҰСҚА МӘТІН', '')
    for (const b of r.blocks || []) {
      const conf = typeof b.confidence === 'number' ? ` · ${Math.round(b.confidence * 100)}%` : ''
      lines.push(`[${BLOCK_LABEL[b.type] || 'Мәтін'}${conf}]`)
      lines.push(b.text || '—', '')
    }

    if (r.modern) lines.push('ҚАЗІРГІ ҚАЗАҚ ТІЛІНДЕ', '', r.modern, '')
    if (r.notes) lines.push('ЕСКЕРТПЕЛЕР', '', r.notes, '')
  })

  lines.push('', 'Автоматты танылған мәтін — түпнұсқамен салыстыру қажет.')
  return lines.join('\n')
}

/** Файлды жүктеу */
export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
