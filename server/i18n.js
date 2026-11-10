/**
 * Сервер жағындағы тілдер: AI жауабының тілі және қате хабарламалары.
 * Клиент әр сұранысқа `lang` (kk | ru | en | tr) жібереді.
 */

/** Промптқа қойылатын тіл атауы (промпт қазақша, сондықтан атаулар да қазақша) */
export const LANG_NAMES = {
  kk: 'қазақ',
  ru: 'орыс (русский)',
  en: 'ағылшын (English)',
  tr: 'түрік (Türkçe)',
}

export const normLang = (v) => (Object.prototype.hasOwnProperty.call(LANG_NAMES, v) ? v : 'kk')

const M = {
  rate_limit: {
    kk: 'Сағаттық шектеу бітті. Кейінірек қайталаңыз.',
    ru: 'Лимит запросов на час исчерпан. Повторите позже.',
    en: 'Hourly request limit reached. Please try again later.',
    tr: 'Saatlik istek sınırına ulaşıldı. Lütfen daha sonra tekrar deneyin.',
  },
  method: {
    kk: 'POST қана қабылданады',
    ru: 'Принимается только POST',
    en: 'Only POST is accepted',
    tr: 'Yalnızca POST kabul edilir',
  },
  ai_flag_off: {
    kk: 'AI режимі әдейі өшірілген (AI_ENABLED=false)',
    ru: 'Режим AI намеренно отключён (AI_ENABLED=false)',
    en: 'AI mode is switched off on purpose (AI_ENABLED=false)',
    tr: 'Yapay zekâ modu bilerek kapatıldı (AI_ENABLED=false)',
  },
  no_key: {
    kk: 'API кілті табылмады — тек демо режимі жұмыс істейді',
    ru: 'API-ключ не найден — работает только демо-режим',
    en: 'No API key found — only demo mode is available',
    tr: 'API anahtarı bulunamadı — yalnızca demo modu çalışıyor',
  },
  no_image: {
    kk: 'Сурет жіберілмеді',
    ru: 'Изображение не отправлено',
    en: 'No image was sent',
    tr: 'Görsel gönderilmedi',
  },
  too_large: {
    kk: 'Сурет тым үлкен. Кішірейтіп қайта жіберіңіз.',
    ru: 'Изображение слишком большое. Уменьшите его и отправьте снова.',
    en: 'The image is too large. Please make it smaller and try again.',
    tr: 'Görsel çok büyük. Küçültüp tekrar gönderin.',
  },
  unknown_provider: {
    kk: 'Бұл AI провайдері әлі қосылмаған. Қазір тек "gemini" бар.',
    ru: 'Этот AI-провайдер ещё не подключён. Сейчас доступен только "gemini".',
    en: 'This AI provider is not connected yet. Only "gemini" is available.',
    tr: 'Bu yapay zekâ sağlayıcısı henüz bağlı değil. Şu an yalnızca "gemini" var.',
  },
  network: {
    kk: 'Gemini-ге қосыла алмадық',
    ru: 'Не удалось подключиться к Gemini',
    en: 'Could not connect to Gemini',
    tr: "Gemini'ye bağlanılamadı",
  },
  quota: {
    kk: 'Gemini лимиті бітті — біраздан кейін қайталаңыз',
    ru: 'Лимит Gemini исчерпан — повторите чуть позже',
    en: 'Gemini quota exhausted — please try again a bit later',
    tr: 'Gemini kotası doldu — biraz sonra tekrar deneyin',
  },
  upstream: {
    kk: 'Gemini жауап бермеді',
    ru: 'Gemini не ответил',
    en: 'Gemini did not respond',
    tr: 'Gemini yanıt vermedi',
  },
  truncated: {
    kk: 'Жауап толық сыймады. Қайталап көріңіз.',
    ru: 'Ответ не поместился целиком. Попробуйте ещё раз.',
    en: 'The answer was cut off. Please try again.',
    tr: 'Yanıt tam sığmadı. Lütfen tekrar deneyin.',
  },
  truncated_page: {
    kk: 'Бет тым көлемді — жауап толық сыймады. Бетті екіге бөліп немесе жеке бөліктерін жүктеп көріңіз.',
    ru: 'Страница слишком объёмная — ответ не поместился. Разделите страницу на части и загрузите их по отдельности.',
    en: 'The page is too long — the answer was cut off. Try splitting the page and uploading the parts separately.',
    tr: 'Sayfa çok uzun — yanıt sığmadı. Sayfayı bölüp parçaları ayrı ayrı yüklemeyi deneyin.',
  },
  parse: {
    kk: 'Модельдің жауабын оқу мүмкін болмады',
    ru: 'Не удалось разобрать ответ модели',
    en: 'Could not read the model response',
    tr: 'Modelin yanıtı okunamadı',
  },
}

/** Хабарлама таңдалған тілде (табылмаса — қазақша) */
export function msg(lang, key) {
  const row = M[key]
  if (!row) return key
  return row[normLang(lang)] || row.kk
}

/**
 * Промптқа жауап тілі туралы қосымша нұсқау.
 * Қазақша үшін бос — негізгі промпт онсыз да қазақша жауап сұрайды.
 */
export function answerLanguageRule(lang, fields, keepFields) {
  const l = normLang(lang)
  if (l === 'kk') return ''
  return `\n\nЖАУАП ТІЛІ: ${fields.map((f) => `"${f}"`).join(', ')} өрістерін ТЕК ${LANG_NAMES[l]} тілінде жаз. `
    + `${keepFields.map((f) => `"${f}"`).join(', ')} өрістері өзгермейді — олар түпнұсқаның оқылымы, аударма емес.`
}
