/** Türkçe metinler. Yapı kk.js ile birebir aynıdır. */

export default {
  code: 'tr',

  meta: {
    title: 'TAMĞA AI — Ataların Sesi',
    description: 'Eski Türk runik yazısını, Töte yazısını ve Çağatayca mektupları günümüz diline çeviren proje.',
  },

  lang: { label: 'Dil' },

  nav: {
    brand: 'TAMĞA AI',
    home: 'Ana sayfa',
    translate: 'Çevirmen',
    archive: 'Arşiv',
    knowledge: 'Bilgi bankası',
    about: 'Proje hakkında',
    cta: 'Yazıyı oku',
    menu: 'Menü',
  },

  hero: {
    title: 'TAMĞA AI —',
    titleAccent: 'ataların sesi',
    subtitle:
      'Köl Tigin, Bilge Kağan ve Tonyukuk yazıtlarındaki Eski Türk yazısını, '
      + 'Ahmet Baytursınulı’nın Töte yazısını ve Çağatayca tarihî mektupları '
      + 'günümüz diline çeviriyoruz.',
    primary: 'Yazıyı çevir',
    secondary: 'Anıtları gör',
    scroll: 'aşağı kaydırın',
  },

  marquee: [
    'VIII. yüzyıl',
    'Orhun-Yenisey yazısı',
    '73 işaret',
    'Köl Tigin · 732',
    'Töte yazısı · 1912',
    'Bilge Kağan · 735',
    'Tonyukuk',
    'Talas · Yenisey · Altay',
  ],

  intro: {
    eyebrow: 'Sorun',
    text: 'Taşa kazınan yazılar bin yılı aştı, ama bugün onları okuyabilen insan sayısı yüzü geçmiyor. '
      + 'Müzedeki gazete de bozkırdaki mezar taşı da bize yabancı işaretlere dönüştü.',
    body: 'Bu proje o mesafeyi kısaltıyor: fotoğrafı yükleyin — işaretlerin harf çevirisini, '
      + 'günümüzdeki okunuşunu ve anlamını alın.',
  },

  translator: {
    eyebrow: 'Ana araç',
    title: 'Yazıyı',
    titleAccent: 'çevir',
    lead: 'Fotoğraf yükleyin veya kamerayla çekin. Metni elle de yazabilirsiniz.',
    dropTitle: 'Fotoğrafı buraya bırakın',
    dropHint: 'veya tıklayıp dosya seçin · JPG, PNG',
    resultEmpty: 'Çeviri sonucu burada görünecek',
    camera: 'Kamerayla çek',
    orType: 'veya işaretleri elle yazın',
    analyzing: 'İnceleniyor…',
    indexing: 'Referans veri tabanı hazırlanıyor…',
    notFound: 'Veri tabanında eşleşme bulunamadı',
    notFoundHint: 'Yapay zekâ modunu açmayı deneyin — tanımadığı yazıları da okuyabilir.',
    nearest: 'en yakın',
    distance: 'fark',
    modeDemo: 'Demo modu',
    modeAI: 'Yapay zekâ modu',
    modeDemoHint: 'Referans veri tabanı · çevrimdışı çalışır',
    modeAIHint: 'Gemini Vision · tanımadığı yazıları da okur',
    aiUnavailable: 'Yapay zekâ modu kullanılamıyor — sunucuda anahtar yok',
    noKey: 'anahtar yok',
    aiError: 'Yapay zekâ hatası',
    confidence: 'Güven',
    signs: 'İşaretler',
    latin: 'Latin harfli çeviri yazı',
    algorithm: 'algoritma',
    modern: 'Kazakça okunuşu',
    meaning: 'Anlamı',
    monument: 'Anıt',
    reset: 'Başka fotoğraf',
    keyboardRunic: 'Runik klavye',
    keyboardTote: 'Töte klavyesi',
    inRunic: 'Runik yazıyla',
    inTote: 'Töte yazısıyla',
    unknownSign: 'tanınmayan işaret',
    vowelNote: 'Asıl metinde ünlüler yazılmamış — yeniden kuruldular.',
    chagatai: 'Çağatayca mektup',
    transcription: 'Transkripsiyon (Çağatayca okunuşu)',
    translation: 'Türkçe çevirisi',
    chagataiNote: 'Çağatayca ayrı bir yazı dilidir; bu yüzden bu bir harf çevirisi değil, '
      + 'anlam çevirisidir. Transkripsiyon asıl metnin sesletimini verir.',
    chagataiAiNote: 'Dikkat: Yapay zekâ el yazısı Çağataycayı henüz güvenilir okuyamıyor — bu yalnızca '
      + 'ilk tahmindir ve bir uzmanın kontrol etmesi gerekir. Modelin kendine verdiği güven puanına '
      + 'güvenmeyin. Doğrulanmış okumalar Bilgi bankasındaki Çağatayca mektuplardadır.',
    showMore: 'Tamamını oku',
    showLess: 'Daralt',
  },

  camera: {
    label: 'Kamera',
    unsupported: 'Bu tarayıcı kamerayı desteklemiyor. Fotoğrafı dosya olarak yükleyin.',
    none: 'kamera bulunamadı',
    allow: 'Kamera iznini ver',
    found: 'Bulunan kamera',
    close: 'Kapat',
    starting: 'Kamera açılıyor…',
    shoot: 'Çek',
    errors: {
      NotAllowedError: 'Kamera izni verilmedi. Adres çubuğundaki kilit simgesinden izin verin.',
      NotFoundError: 'Kamera bulunamadı. Harici kameranın bağlı olup olmadığını kontrol edin.',
      NotReadableError: 'Kamerayı başka bir program kullanıyor. Onu kapatıp tekrar deneyin.',
      OverconstrainedError: 'Seçilen kamera kullanılamıyor. Listeden başka birini seçin.',
      SecurityError: 'Kamera yalnızca güvenli bağlantıda (HTTPS) çalışır.',
      default: 'Kamera açılamadı.',
    },
  },

  archive: {
    eyebrow: 'Arşivi sayısallaştırma',
    title: 'El yazmasını',
    titleAccent: 'metne dönüştürme',
    lead: 'Arşiv belgesinin fotoğrafını yükleyin — sistem onu okur, düzenlenebilir metne '
      + 'dönüştürür ve Word belgesi olarak indirir.',
    needKey: 'Sayısallaştırma henüz bağlanmadı',
    needKeyHint: 'Bu özellik bir yapay zekâ modeliyle çalışır, bu yüzden API anahtarı gerekir. '
      + 'Anahtar eklendiğinde bölüm hemen çalışmaya başlar.',
    dropTitle: 'Belge sayfalarını buraya bırakın',
    dropHint: 'aynı anda birkaç sayfa seçebilirsiniz · JPG, PNG',
    camera: 'Kamerayla çek',
    addPage: 'sayfa ekle',
    run: 'Sayısallaştır',
    working: 'Okunuyor…',
    queued: 'Sırada',
    retry: 'Tekrar dene',
    exportDocx: 'Word (.docx)',
    exportTxt: 'Metin (.txt)',
    copy: 'Kopyala',
    clear: 'Temizle',
    original: 'Asıl metin',
    modern: 'Türkçe çevirisi',
    uncertain: 'Şüpheli bölümler',
    noText: 'Bu sayfada metin tanınmadı',
    edited: 'düzeltildi',
    imageLost: 'Görsel kayboldu',
    failed: 'Sayısallaştırma başarısız',
    fileBase: 'arsiv',
    blocks: {
      heading: 'Başlık', paragraph: 'Metin', date: 'Tarih',
      signature: 'İmza', margin: 'Kenar notu', table: 'Tablo',
    },
    disclaimer: 'Metin otomatik olarak tanınır. Arşivde kullanmadan önce asılla '
      + 'karşılaştırın — güveni düşük bloklar ayrıca işaretlenmiştir. '
      + 'Sistem metin uydurmaz: okunamayan yeri […] olarak bırakır.',
  },

  docx: {
    locale: 'tr-TR',
    title: 'Sayısallaştırılmış arşiv belgesi',
    description: 'Arşiv belgesinin otomatik sayısallaştırılması',
    type: 'Türü',
    date: 'Tarih',
    script: 'Yazı',
    language: 'Dil',
    digitized: 'Sayısallaştırma tarihi',
    pages: 'Sayfa sayısı',
    page: (n) => `${n}. sayfa`,
    confidence: 'güven',
    original: 'Asıl metin',
    noText: 'Metin tanınmadı.',
    modern: 'Türkçe çevirisi',
    notes: 'Notlar',
    uncertain: 'Şüpheli bölümler',
    footer: 'Bu metin otomatik olarak tanınmıştır. Arşivde kullanmadan önce asılla karşılaştırılması '
      + 'gerekir. Güveni düşük bloklar kahverengiyle işaretlenmiştir.',
    footerShort: 'Otomatik tanınan metin — asılla karşılaştırın.',
  },

  review: {
    button: 'Kontrole gönder',
    hint: 'Çevirinin doğruluğunu bir uzman kontrol eder',
    title: 'Çevirinin uzman',
    titleAccent: 'kontrolü',
    lead: 'Başvuruyu doldurun — uzman çeviriyi kontrol edip yanıtı e-posta adresinize gönderecek.',
    reviewer: 'Kontrol eden',
    reviewerDegree: 'Doktora (PhD)',
    reviewerName: 'Aigerim Zhumabayeva',
    reviewerRole: 'Cuci Ulusu Araştırmaları Enstitüsü baş araştırmacısı, Yazılı Anıtlar Bölümü başkanı',
    subject: 'Kontrol edilecek çeviri',
    name: 'Adınız',
    namePh: 'Örneğin: Aybek Serikulı',
    purpose: 'Çevirinin amacı',
    purposePh: 'Örneğin: bilimsel proje, okul dersi, aile arşivi…',
    email: 'E-posta',
    emailPh: 'name@example.com',
    consent: 'Bilgileriniz yalnızca bu başvuruya yanıt vermek için kullanılır.',
    submit: 'Gönder',
    sending: 'Gönderiliyor…',
    cancel: 'Vazgeç',
    close: 'Kapat',
    successTitle: 'Başarıyla gönderildi!',
    successText: 'Yanıtı 5 iş günü içinde belirttiğiniz e-posta adresinde bekleyin.',
    errName: 'Adınızı yazın',
    errPurpose: 'Amacı kısaca yazın',
    errEmail: 'Geçerli bir e-posta adresi yazın',
    errSend: 'Gönderilemedi. Biraz sonra tekrar deneyin.',
  },

  knowledge: {
    eyebrow: 'Bilgi bankası',
    title: 'Anıtlar ve',
    titleAccent: 'alfabeler',
    lead: 'Kazakistan, Moğolistan, Kırgızistan ve Sibirya’da bulunan yazılı anıtlar.',
    tabAll: 'Tümü',
    tabRunic: 'Eski Türk',
    tabTote: 'Töte yazısı',
    tabChagatai: 'Çağatayca mektuplar',
    tabAlphabet: 'Alfabe',
    typeShort: { runic: 'Eski Türk', tote: 'Töte yazısı', chagatai: 'Çağatayca' },
    expand: 'Bilgi bankasını aç',
    collapse: 'Daralt',
    region: 'Bölge',
    date: 'Tarih',
    found: 'Keşif',
    close: 'Kapat',
    signs: 'İşaretler',
    inTote: 'Töte yazısıyla',
    latin: 'Latin harfli çeviri yazı',
    meaning: 'Çevirisi',
    alphabetRunic: 'Eski Türk runik alfabesi',
    alphabetTote: 'Töte alfabesi',
    runicNote: 'Eski Türk yazısında ünlüler çoğu zaman yazılmazdı; ünsüzlerin kalın ve ince '
      + 'biçimleri ise kelimenin ünlü uyumunu gösterir. Çevirici bu uyumu belirler ve ünlülerin '
      + 'okunuşuna ona göre karar verir.',
    toteAuthor: '1912’de Ahmet Baytursınulı tarafından düzenlendi',
    toteUsage: 'Kazakistan’da 1912–1929 yıllarında kullanıldı; bugün Çin’deki Kazaklar kullanıyor',
    toteFeature: 'Ünlüler, ünlü uyumuna göre däyekşi işaretiyle (ٴ) ayırt edilir: '
      + 'kelime inceyse başına hemze konur.',
    orkhon: 'Orhun biçimi',
    yenisei: 'Yenisey biçimi',
    vowels: 'Ünlüler',
    consonants: 'Ünsüzler',
    syllabic: 'Hece işaretleri',
  },

  about: {
    eyebrow: 'Proje hakkında',
    title: 'Bu neden',
    titleAccent: 'gerekli',
    mission:
      'Eski Türk yazısı, Kazak dilinin en eski yazılı tanığıdır. Onu okumak dar bir '
      + 'uzman çevresinde kalmıştı. Biz bu bilgiyi herkesin erişimine açtık.',
    stats: [
      { value: '73', label: 'runik işaret' },
      { value: '33', label: 'Töte harfi' },
      { value: '28', label: 'referans anıt' },
      { value: '1300', label: 'yıllık tarih' },
    ],
    howTitle: 'Nasıl çalışır',
    how: [
      {
        n: '01',
        t: 'Referans veri tabanı',
        d: 'Bilinen anıtların fotoğrafları algısal karma (perceptual hash) ile karşılaştırılır. '
          + 'İnternet olmadan da çalışır.',
      },
      {
        n: '02',
        t: 'Harf çevirisi algoritması',
        d: 'İşaretleri harfe dönüştürmek gerçek bir algoritmadır. Ünsüzlerin kalın ve ince '
          + 'biçimlerinden kelimenin ünlü uyumu belirlenir.',
      },
      {
        n: '03',
        t: 'Yapay zekâ modu',
        d: 'Anahtarı açarsanız fotoğraf Gemini Vision modeline gönderilir; '
          + 'model veri tabanında olmayan yazıları da okumaya çalışır.',
      },
    ],
    honestTitle: 'Sınırlılıkları açıkça söylüyoruz',
    honest: [
      'Eski Türk yazısında bir işaret iki sesi karşılar (o/u, ö/ü, ı/i); '
        + 'bu yüzden bazı kelimeler iki türlü okunabilir.',
      'Ünlüler çoğu zaman yazılmamıştır — onları yeniden kurmak bilimsel bir varsayımdır.',
      'Anıtların Kazakça çevirileri akademik yayınlardan alınmıştır (V. Thomsen, S. Y. Malov, T. Tekin).',
      'Çağatayca mektupların çevirisi anlam çevirisidir: Çağatayca Kazakçadan söz varlığı ve '
        + 'dil bilgisiyle ayrılır, bu yüzden harfi harfe aktarmak yetmez.',
      'Sitenin Rusça, İngilizce ve Türkçe sürümleri Kazakçadan yapay zekâ yardımıyla çevrildi — '
        + 'bilimsel çalışmalarda akademik yayınlarla karşılaştırın (örneğin Talat Tekin’in çevirileri).',
    ],
    sourcesTitle: 'Kaynaklar',
  },

  footer: {
    tagline: 'TAMĞA AI',
    made: 'Açık kaynaklara dayanılarak hazırlandı',
    sources: 'Görseller: Wikimedia Commons (public domain / CC). Alfabe: Unicode Old Turkic, V. Thomsen (1893).',
  },
}
