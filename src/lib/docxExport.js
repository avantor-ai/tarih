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
function blockToParagraphs(block, L, blocks) {
  const out = []
  const label = blocks[block.type] || blocks.paragraph
  const conf = typeof block.confidence === 'number' ? Math.round(block.confidence * 100) : null
  const shaky = conf !== null && conf < 70

  out.push(new Paragraph({
    spacing: { before: 160, after: 40 },
    children: [new TextRun({
      text: conf !== null ? `${label} · ${L.confidence} ${conf}%` : label,
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
        text: `${L.uncertain}: ` + block.uncertain.join(' · '),
        font: FONT, size: 18, italics: true, color: 'B45309',
      })],
    }))
  }
  return out
}

/**
 * Құжатты .docx түрінде жинау.
 * @param {{pages: Array, L: object, blocks: object, title?: string}} input
 *   L — таңдалған тілдегі мәтіндер (t.docx), blocks — блок атаулары (t.archive.blocks)
 * @returns {Promise<Blob>}
 */
export async function buildDocx({ pages, L, blocks, title = L.title }) {
  const children = []

  children.push(heading(title, HeadingLevel.TITLE))

  const first = pages[0]?.result
  if (first) {
    const meta = []
    if (first.docType) meta.push(`${L.type}: ${first.docType}`)
    if (first.dating) meta.push(`${L.date}: ${first.dating}`)
    if (first.script) meta.push(`${L.script}: ${first.script}`)
    if (first.language) meta.push(`${L.language}: ${first.language}`)
    if (meta.length) children.push(body(meta.join('   ·   '), { size: 20, color: '666666' }))
  }

  children.push(body(
    `${L.digitized}: ${new Date().toLocaleDateString(L.locale)}   ·   ${L.pages}: ${pages.length}`,
    { size: 18, color: '888888' }
  ))
  children.push(divider())

  pages.forEach((page, i) => {
    const r = page.result || {}
    if (pages.length > 1) children.push(heading(L.page(i + 1), HeadingLevel.HEADING_1))

    if (r.summary) {
      children.push(body(r.summary, { italic: true, size: 22, color: '555555' }))
    }

    children.push(heading(L.original, HeadingLevel.HEADING_2))
    if (r.blocks?.length) {
      r.blocks.forEach((b) => blockToParagraphs(b, L, blocks).forEach((p) => children.push(p)))
    } else {
      children.push(body(L.noText, { italic: true, color: '888888' }))
    }

    if (r.modern) {
      children.push(heading(L.modern, HeadingLevel.HEADING_2))
      children.push(body(r.modern))
    }

    if (r.notes) {
      children.push(heading(L.notes, HeadingLevel.HEADING_2))
      children.push(body(r.notes, { italic: true, size: 22, color: '666666' }))
    }

    if (i < pages.length - 1) children.push(divider())
  })

  children.push(divider())
  children.push(body(L.footer, { size: 18, italic: true, color: '888888' }))

  const doc = new Document({
    creator: 'TAMĞA AI',
    title,
    description: L.description,
    sections: [{ properties: {}, children }],
  })

  return Packer.toBlob(doc)
}

/** Таза мәтін нұсқасы — көшіріп алуға ыңғайлы */
export function buildPlainText({ pages, L, blocks, title = L.title }) {
  const lines = [title, '='.repeat(title.length), '']

  pages.forEach((page, i) => {
    const r = page.result || {}
    if (pages.length > 1) lines.push(`── ${L.page(i + 1)} ──`, '')
    if (r.dating) lines.push(`${L.date}: ${r.dating}`)
    if (r.docType) lines.push(`${L.type}: ${r.docType}`)
    if (r.dating || r.docType) lines.push('')

    lines.push(L.original.toLocaleUpperCase(L.locale), '')
    for (const b of r.blocks || []) {
      const conf = typeof b.confidence === 'number' ? ` · ${Math.round(b.confidence * 100)}%` : ''
      lines.push(`[${blocks[b.type] || blocks.paragraph}${conf}]`)
      lines.push(b.text || '—', '')
    }

    if (r.modern) lines.push(L.modern.toLocaleUpperCase(L.locale), '', r.modern, '')
    if (r.notes) lines.push(L.notes.toLocaleUpperCase(L.locale), '', r.notes, '')
  })

  lines.push('', L.footerShort)
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
