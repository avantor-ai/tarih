/** English texts. The structure mirrors kk.js exactly. */

export default {
  code: 'en',

  meta: {
    title: 'TAMĞA AI — Voice of the Ancestors',
    description: 'A project that translates Old Turkic runes, Tote script and Chagatai letters into a modern language.',
  },

  lang: { label: 'Language' },

  nav: {
    brand: 'TAMĞA AI',
    home: 'Home',
    translate: 'Translator',
    archive: 'Archive',
    knowledge: 'Knowledge base',
    about: 'About',
    cta: 'Read a script',
    menu: 'Menu',
  },

  hero: {
    title: 'TAMĞA AI —',
    titleAccent: 'voice of the ancestors',
    subtitle:
      'We translate the Old Turkic inscriptions of Kul Tigin, Bilge Kagan and Tonyukuk, '
      + 'the Tote script of Akhmet Baitursynuly and historical letters in Chagatai '
      + 'into a modern language.',
    primary: 'Translate a script',
    secondary: 'See the monuments',
    scroll: 'scroll down',
  },

  marquee: [
    '8th century',
    'Orkhon-Yenisei script',
    '73 signs',
    'Kul Tigin · 732',
    'Tote script · 1912',
    'Bilge Kagan · 735',
    'Tonyukuk',
    'Talas · Yenisei · Altai',
  ],

  intro: {
    eyebrow: 'The problem',
    text: 'Inscriptions in stone have survived a millennium, yet fewer than a hundred people can read them today. '
      + 'A newspaper in a museum and a gravestone in the steppe have both become foreign signs to us.',
    body: 'This project closes that gap: upload a photo and get the transliteration of the signs, '
      + 'a modern reading and the meaning.',
  },

  translator: {
    eyebrow: 'Main tool',
    title: 'Translate',
    titleAccent: 'a script',
    lead: 'Upload a photo or take one with the camera. You can also type the text by hand.',
    dropTitle: 'Drop the photo here',
    dropHint: 'or click to choose a file · JPG, PNG',
    resultEmpty: 'The translation will appear here',
    camera: 'Use the camera',
    orType: 'or type the signs by hand',
    analyzing: 'Analysing…',
    indexing: 'Preparing the reference base…',
    notFound: 'No match found in the base',
    notFoundHint: 'Try AI mode — it can read unfamiliar scripts too.',
    nearest: 'closest',
    distance: 'distance',
    modeDemo: 'Demo mode',
    modeAI: 'AI mode',
    modeDemoHint: 'Reference base · works offline',
    modeAIHint: 'Gemini Vision · reads unfamiliar scripts too',
    aiUnavailable: 'AI mode unavailable — the server has no key',
    noKey: 'no key',
    aiError: 'AI error',
    confidence: 'Confidence',
    signs: 'Signs',
    latin: 'Latin transliteration',
    algorithm: 'algorithm',
    modern: 'Kazakh reading',
    meaning: 'Meaning',
    monument: 'Monument',
    reset: 'Another photo',
    keyboardRunic: 'Runic keyboard',
    keyboardTote: 'Tote keyboard',
    inRunic: 'In runes',
    inTote: 'In Tote script',
    unknownSign: 'unrecognised sign',
    vowelNote: 'Vowels are not written in the original — they have been restored.',
    chagatai: 'Chagatai letter',
    transcription: 'Transcription (Chagatai reading)',
    translation: 'English translation',
    chagataiNote: 'Chagatai is a separate literary language, so this is not a transliteration '
      + 'but a translation of the meaning. The transcription renders how the original sounds.',
    chagataiAiNote: 'Please note: AI still reads handwritten Chagatai unreliably — this is only '
      + 'a first guess and needs a specialist to check it. Do not rely on the confidence the model '
      + 'gives itself. Verified readings are in the Chagatai letters of the Knowledge base.',
    showMore: 'Read in full',
    showLess: 'Collapse',
  },

  camera: {
    label: 'Camera',
    unsupported: 'This browser does not support the camera. Please upload the photo as a file.',
    none: 'no camera found',
    allow: 'Allow camera access',
    found: 'Cameras found',
    close: 'Close',
    starting: 'Starting the camera…',
    shoot: 'Capture',
    errors: {
      NotAllowedError: 'Camera access was denied. Allow it via the lock icon in the address bar.',
      NotFoundError: 'No camera found. Check that the external camera is connected.',
      NotReadableError: 'Another program is using the camera. Close it and try again.',
      OverconstrainedError: 'The selected camera is unavailable. Choose another one from the list.',
      SecurityError: 'The camera works only over a secure connection (HTTPS).',
      default: 'Could not open the camera.',
    },
  },

  archive: {
    eyebrow: 'Archive digitisation',
    title: 'From manuscript',
    titleAccent: 'to text',
    lead: 'Upload a photo of an archival document — the system reads it, turns it into '
      + 'editable text and exports it as a Word document.',
    needKey: 'Digitisation is not connected yet',
    needKeyHint: 'This feature runs on an AI model, so it needs an API key. '
      + 'Once the key is added, the section starts working right away.',
    dropTitle: 'Drop the document pages here',
    dropHint: 'you can select several pages at once · JPG, PNG',
    camera: 'Use the camera',
    addPage: 'add page',
    run: 'Digitise',
    working: 'Reading…',
    queued: 'Queued',
    retry: 'Retry',
    exportDocx: 'Word (.docx)',
    exportTxt: 'Text (.txt)',
    copy: 'Copy',
    clear: 'Clear',
    original: 'Original text',
    modern: 'English translation',
    uncertain: 'Uncertain fragments',
    noText: 'No text was recognised on this page',
    edited: 'edited',
    imageLost: 'Image lost',
    failed: 'Digitisation failed',
    fileBase: 'archive',
    blocks: {
      heading: 'Heading', paragraph: 'Text', date: 'Date',
      signature: 'Signature', margin: 'Margin note', table: 'Table',
    },
    disclaimer: 'The text is recognised automatically. Before using it in an archive, '
      + 'check it against the original — blocks with low confidence are marked separately. '
      + 'The system does not invent text: anything unreadable is left as […].',
  },

  docx: {
    locale: 'en-GB',
    title: 'Digitised archival document',
    description: 'Automatic digitisation of an archival document',
    type: 'Type',
    date: 'Date',
    script: 'Script',
    language: 'Language',
    digitized: 'Digitised on',
    pages: 'Pages',
    page: (n) => `Page ${n}`,
    confidence: 'confidence',
    original: 'Original text',
    noText: 'No text recognised.',
    modern: 'English translation',
    notes: 'Notes',
    uncertain: 'Uncertain fragments',
    footer: 'This text was recognised automatically. It must be checked against the original '
      + 'before archival use. Blocks with low confidence are highlighted in brown.',
    footerShort: 'Automatically recognised text — check it against the original.',
  },

  review: {
    button: 'Send for expert review',
    hint: 'A specialist will check that the translation is correct',
    title: 'Expert review',
    titleAccent: 'of the translation',
    lead: 'Fill in the request — the specialist will check the translation and reply to your email.',
    reviewer: 'Reviewer',
    reviewerDegree: 'PhD',
    reviewerName: 'Aigerim Zhumabayeva',
    reviewerRole: 'Leading Researcher at the Institute for the Study of the Ulus of Jochi, Head of the Department of Written Monuments',
    subject: 'Translation to review',
    name: 'Your name',
    namePh: 'e.g. Aibek Serikuly',
    purpose: 'Purpose of the translation',
    purposePh: 'e.g. research project, school lesson, family archive…',
    email: 'Email',
    emailPh: 'name@example.com',
    consent: 'Your details are used only to reply to this request.',
    submit: 'Send',
    sending: 'Sending…',
    cancel: 'Cancel',
    close: 'Close',
    successTitle: 'Sent successfully!',
    successText: 'Expect a reply at the email you gave within 5 working days.',
    errName: 'Please enter your name',
    errPurpose: 'Please describe the purpose briefly',
    errEmail: 'Please enter a valid email',
    errSend: 'Could not send. Please try again a bit later.',
  },

  knowledge: {
    eyebrow: 'Knowledge base',
    title: 'Monuments and',
    titleAccent: 'alphabets',
    lead: 'Written monuments found in Kazakhstan, Mongolia, Kyrgyzstan and Siberia.',
    tabAll: 'All',
    tabRunic: 'Old Turkic',
    tabTote: 'Tote script',
    tabChagatai: 'Chagatai letters',
    tabAlphabet: 'Alphabet',
    typeShort: { runic: 'Old Turkic', tote: 'Tote script', chagatai: 'Chagatai' },
    expand: 'Open the knowledge base',
    collapse: 'Collapse',
    region: 'Region',
    date: 'Date',
    found: 'Discovery',
    close: 'Close',
    signs: 'Signs',
    inTote: 'In Tote script',
    latin: 'Latin transliteration',
    meaning: 'Translation',
    alphabetRunic: 'Old Turkic runic alphabet',
    alphabetTote: 'Tote alphabet',
    runicNote: 'Old Turkic writing often omitted vowels, while the back and front variants '
      + 'of consonants show the harmony class of a word. The transliterator detects this class '
      + 'and uses it to decide how the vowels are read.',
    toteAuthor: 'Reformed by Akhmet Baitursynuly in 1912',
    toteUsage: 'used in Kazakhstan in 1912–1929; today used by Kazakhs in China',
    toteFeature: 'Vowels are distinguished by vowel harmony using the dәyekshi sign (ٴ): '
      + 'if a word is front-vowelled, a hamza is placed at its start.',
    orkhon: 'Orkhon variant',
    yenisei: 'Yenisei variant',
    vowels: 'Vowels',
    consonants: 'Consonants',
    syllabic: 'Syllabic signs',
  },

  about: {
    eyebrow: 'About',
    title: 'Why this',
    titleAccent: 'matters',
    mission:
      'Old Turkic writing is the earliest written evidence of the Kazakh language. '
      + 'Only a small circle of specialists can read it. We have made that knowledge open to everyone.',
    stats: [
      { value: '73', label: 'runic signs' },
      { value: '33', label: 'Tote letters' },
      { value: '28', label: 'reference monuments' },
      { value: '1300', label: 'years of history' },
    ],
    howTitle: 'How it works',
    how: [
      {
        n: '01',
        t: 'Reference base',
        d: 'Photos of known monuments are compared using a perceptual hash. '
          + 'It works even without the internet.',
      },
      {
        n: '02',
        t: 'Transliteration algorithm',
        d: 'Turning signs into letters is a real algorithm. The back and front variants '
          + 'of consonants reveal the harmony class of each word.',
      },
      {
        n: '03',
        t: 'AI mode',
        d: 'Switch the toggle on and the photo is sent to the Gemini Vision model, '
          + 'which tries to read scripts that are not in the base.',
      },
    ],
    honestTitle: 'Honest about the limits',
    honest: [
      'In Old Turkic, one sign stands for two sounds (o/u, ö/ü, ı/i), '
        + 'so some words can be read in two ways.',
      'Vowels were often not written — restoring them is a scholarly hypothesis.',
      'The Kazakh translations of the monuments come from academic editions (V. Thomsen, S. E. Malov, T. Tekin).',
      'The Chagatai letters are translated for meaning: Chagatai differs from Kazakh in vocabulary '
        + 'and grammar, so swapping letter for letter is not enough.',
      'The Russian, English and Turkish versions of the site were translated from Kazakh with AI assistance — '
        + 'for research, check them against academic editions.',
    ],
    sourcesTitle: 'Sources',
  },

  footer: {
    tagline: 'TAMĞA AI',
    made: 'Built on open sources',
    sources: 'Images: Wikimedia Commons (public domain / CC). Alphabet: Unicode Old Turkic, V. Thomsen (1893).',
  },
}
