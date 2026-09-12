import {
  transliterateRunic, transliterateTote,
  kazakhToRunic, kazakhToTote, detectScript,
} from '../src/lib/translit.js'

let pass = 0, fail = 0
const t = (name, got, want) => {
  const ok = got === want
  ok ? pass++ : fail++
  console.log(`${ok ? '  ok  ' : ' FAIL '} ${name}` +
    (ok ? `  →  "${got}"` : `\n        алынды:  "${got}"\n        күтілді: "${want}"`))
}

console.log('\n=== РУНИКА: үндестік бойынша дауыстыны шешу ===')
t('𐱅𐰇𐰼𐰚 → türk (жіңішке қатар: ü, ö емес)', transliterateRunic('𐱅𐰇𐰼𐰚').latin, 'türk')
t('𐰋𐰃𐰠𐰏𐰀 → bilgä (жіңішке: i, ä)', transliterateRunic('𐰋𐰃𐰠𐰏𐰀').latin, 'bilgä')
t('𐰴𐰍𐰣 → qγn (жуан қатар)', transliterateRunic('𐰴𐰍𐰣').latin, 'qγn')

const teng = transliterateRunic('𐱅𐰭𐰼𐰃')
t('𐱅𐰭𐰼𐰃 → tŋri (дауысты жазылмаған)', teng.latin, 'tŋri')
t('  дауыстының түсіп қалуы анықталды', teng.vowelsOmitted, true)

const bilge = transliterateRunic('𐰋𐰃𐰠𐰏𐰀 𐰴𐰍𐰣')
t('қатар дұрыс анықталды', bilge.harmonies.join(','), 'front,back')
console.log('        қазақша:', bilge.kazakh)

const ton = transliterateRunic('𐰋𐰃𐰠𐰏𐰀 𐱅𐰆𐰪𐰸𐰸 𐰋𐰤 𐰇𐰔𐰢')
console.log('  Тоныкөк →', ton.latin, '| белгісіз таңба:', ton.unknown.length)

console.log('\n=== ТӨТЕ ЖАЗУ ===')
t('قازاقستان', transliterateTote('قازاقستان').kazakh, 'қазақстан')
t('قازاق', transliterateTote('قازاق').kazakh, 'қазақ')
t('ٴوتكەن → өткен (дәйекші жіңішкертті)', transliterateTote('ٴوتكەن').kazakh, 'өткен')

const b1902 = transliterateTote('بۇرىنعى ٴوتكەن زاماندا')
t('1902 ж. мәтіні', b1902.kazakh, 'бұрынғы өткен заманда')
t('  белгісіз таңба жоқ', b1902.unknown.length, 0)

console.log('\n=== КЕРІ БАҒЫТ ===')
t('"түркі" → руника', kazakhToRunic('түркі'), '𐱃𐰇𐰺𐰚𐰃')
t('"қазақ" → төте', kazakhToTote('қазақ'), 'قازاق')
console.log('  "әліппе" → төте :', kazakhToTote('әліппе'))

console.log('\n=== ЖАЗУДЫ АНЫҚТАУ ===')
t('руника', detectScript('𐱅𐰇𐰼𐰚'), 'runic')
t('төте', detectScript('قازاق'), 'tote')
t('кирилл', detectScript('қазақ'), 'kazakh')

console.log(`\n──────  ${pass} өтті, ${fail} құлады  ──────\n`)
process.exit(fail ? 1 : 0)
