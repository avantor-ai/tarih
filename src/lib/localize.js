/**
 * Эталондық базаның мәтінін таңдалған тілге келтіру.
 *
 * Негізгі мәтін monuments.json-да қазақша тұрады. Басқа тілдердің
 * аудармасы бөлек файлдарда (id → өрістер), сондықтан базаға жаңа
 * ескерткіш қосқанда алдымен қазақшасы жазылады, аудармасы кейін қосылады:
 * аудармасы жоқ өріс қазақша күйінде көрінеді.
 *
 * Аударылмайтын өрістер (әдейі): түпнұсқа таңбалар (runic, arab),
 * латын транслитерациясы (latin), шағатай транскрипциясы (transkripsiya)
 * және қазақша оқылымы (kazakh) — бұлар дереккөздің өзі, аударма емес.
 */
import ru from '../data/i18n/monuments.ru.json'
import en from '../data/i18n/monuments.en.json'
import tr from '../data/i18n/monuments.tr.json'

const TABLES = { ru, en, tr }
const FIELDS = ['atauy', 'aimaq', 'jyl', 'ashylgan', 'meaning', 'sipattama', 'derek', 'license']

/**
 * @param {object} m  monuments.json ішіндегі жазба
 * @param {string} lang  kk | ru | en | tr
 * @returns {object} сол жазба + `meaning` (мағынасы таңдалған тілде)
 */
export function localizeMonument(m, lang) {
  // atauy_kk — қазақша атауы: басқа тілде тақырып астында түпнұсқа атау ретінде көрсетіледі
  const base = { ...m, meaning: m.tolyq_kazakh, atauy_kk: m.atauy }
  const tr = TABLES[lang]?.[m.id]
  if (!tr) return base
  for (const f of FIELDS) if (tr[f]) base[f] = tr[f]
  return base
}
