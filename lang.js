/* ============================================================
   POLYCONNECT — Internationalization (i18n) System
   Supports: English (en) & বাংলা (bn)
   ============================================================ */

const TRANSLATIONS = {
  en: {
    // Meta / Page
    pageTitle: "Polyconnect — BTEB AI Assistant",
    metaDescription: "Polyconnect — Your AI-powered assistant for BTEB polytechnic studies. Get instant help with courses, exams, and more.",

    // Sidebar
    sidebarTitle: "Polyconnect",
    searchPlaceholder: "Search history...",
    newChat: "New Chat",
    deleteAllHistory: "Delete All History",
    noChatsYet: "No chats yet.",
    startConversation: "Start a new conversation!",

    // Chat Header
    chatTitleDefault: "BTEB Student Help",
    clearButton: "Clear",

    // Welcome Screen
    welcomeTitle: "Welcome to Polyconnect",
    welcomeDesc: "Your AI-powered BTEB study assistant. Ask me anything about your courses, exams, or projects.",

    // Prompt Chips
    chipOhm: "⚡ Explain Ohm's Law",
    chipOhmPrompt: "Explain Ohm's Law simply",
    chipMath: "📐 Math Help",
    chipMathPrompt: "Help me with a math problem",
    chipSyllabus: "📚 BTEB Syllabus",
    chipSyllabusPrompt: "What topics are in the BTEB syllabus?",
    chipLab: "🧪 Lab Report",
    chipLabPrompt: "Write a lab report for me",

    // Input
    inputPlaceholder: "Type your message...",
    inputHint: "Press Enter to send · Shift+Enter for new line",

    // Modal
    modalConfirm: "Confirm",
    modalCancel: "Cancel",
    editMessageTitle: "Edit Message",
    editMessageSave: "Save",
    renameChatTitle: "Rename Chat",
    renameChatConfirm: "Rename",
    deleteAllTitle: "Delete All History?",
    deleteAllText: "This action cannot be undone.",
    deleteChatTitle: "Delete Chat?",
    deleteChatText: "Are you sure you want to delete this chat?",

    // Bot Messages
    errorResponse: "Something went wrong. Please try again.",
    unparsedResponse: "Received a response but could not parse it.",

    // Language
    langLabel: "EN",
    langName: "English",
  },

  bn: {
    // Meta / Page
    pageTitle: "পলিকানেক্ট — বিটিইবি এআই সহকারী",
    metaDescription: "পলিকানেক্ট — বিটিইবি পলিটেকনিক পড়াশোনার জন্য আপনার এআই-চালিত সহকারী।",

    // Sidebar
    sidebarTitle: "পলিকানেক্ট",
    searchPlaceholder: "ইতিহাস খুঁজুন...",
    newChat: "নতুন চ্যাট",
    deleteAllHistory: "সব ইতিহাস মুছুন",
    noChatsYet: "এখনো কোনো চ্যাট নেই।",
    startConversation: "নতুন কথোপকথন শুরু করুন!",

    // Chat Header
    chatTitleDefault: "বিটিইবি শিক্ষার্থী সহায়তা",
    clearButton: "মুছুন",

    // Welcome Screen
    welcomeTitle: "পলিকানেক্টে স্বাগতম",
    welcomeDesc: "আপনার এআই-চালিত বিটিইবি পড়াশোনার সহকারী। আপনার কোর্স, পরীক্ষা বা প্রকল্প সম্পর্কে যেকোনো কিছু জিজ্ঞাসা করুন।",

    // Prompt Chips
    chipOhm: "⚡ ওহমের সূত্র ব্যাখ্যা",
    chipOhmPrompt: "ওহমের সূত্র সহজভাবে ব্যাখ্যা করো",
    chipMath: "📐 গণিত সাহায্য",
    chipMathPrompt: "একটি গণিত সমস্যায় সাহায্য করো",
    chipSyllabus: "📚 বিটিইবি সিলেবাস",
    chipSyllabusPrompt: "বিটিইবি সিলেবাসে কোন বিষয়গুলো আছে?",
    chipLab: "🧪 ল্যাব রিপোর্ট",
    chipLabPrompt: "আমার জন্য একটি ল্যাব রিপোর্ট লেখো",

    // Input
    inputPlaceholder: "আপনার বার্তা লিখুন...",
    inputHint: "পাঠাতে Enter চাপুন · নতুন লাইনের জন্য Shift+Enter",

    // Modal
    modalConfirm: "নিশ্চিত",
    modalCancel: "বাতিল",
    editMessageTitle: "বার্তা সম্পাদনা",
    editMessageSave: "সংরক্ষণ",
    renameChatTitle: "চ্যাটের নাম পরিবর্তন",
    renameChatConfirm: "পরিবর্তন",
    deleteAllTitle: "সব ইতিহাস মুছে ফেলবেন?",
    deleteAllText: "এই কাজটি পূর্বাবস্থায় ফেরানো যাবে না।",
    deleteChatTitle: "চ্যাট মুছে ফেলবেন?",
    deleteChatText: "আপনি কি নিশ্চিত যে আপনি এই চ্যাটটি মুছতে চান?",

    // Bot Messages
    errorResponse: "কিছু ভুল হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।",
    unparsedResponse: "একটি উত্তর পাওয়া গেছে কিন্তু তা পার্স করা যায়নি।",

    // Language
    langLabel: "বাং",
    langName: "বাংলা",
  }
};

/* --- i18n Engine --- */
const I18n = {
  _currentLang: 'en',
  _listeners: [],

  init() {
    const saved = localStorage.getItem('polyconnect-lang');
    this._currentLang = (saved === 'bn') ? 'bn' : 'en';
    this.apply();
  },

  get lang() {
    return this._currentLang;
  },

  t(key) {
    return TRANSLATIONS[this._currentLang]?.[key] || TRANSLATIONS['en']?.[key] || key;
  },

  toggle() {
    this._currentLang = this._currentLang === 'en' ? 'bn' : 'en';
    localStorage.setItem('polyconnect-lang', this._currentLang);
    this.apply();
    this._listeners.forEach(fn => fn(this._currentLang));
  },

  setLang(lang) {
    if (lang !== 'en' && lang !== 'bn') return;
    this._currentLang = lang;
    localStorage.setItem('polyconnect-lang', lang);
    this.apply();
    this._listeners.forEach(fn => fn(lang));
  },

  onChange(fn) {
    this._listeners.push(fn);
  },

  apply() {
    // Update all elements with data-i18n attribute
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      const val = this.t(key);
      if (val) el.textContent = val;
    });

    // Update all elements with data-i18n-placeholder attribute
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
      const key = el.getAttribute('data-i18n-placeholder');
      const val = this.t(key);
      if (val) el.setAttribute('placeholder', val);
    });

    // Update all elements with data-i18n-aria attribute
    document.querySelectorAll('[data-i18n-aria]').forEach(el => {
      const key = el.getAttribute('data-i18n-aria');
      const val = this.t(key);
      if (val) el.setAttribute('aria-label', val);
    });

    // Update data-prompt on chips
    document.querySelectorAll('[data-i18n-prompt]').forEach(el => {
      const key = el.getAttribute('data-i18n-prompt');
      const val = this.t(key);
      if (val) el.setAttribute('data-prompt', val);
    });

    // Update page title
    document.title = this.t('pageTitle');

    // Update html lang
    document.documentElement.lang = this._currentLang === 'bn' ? 'bn' : 'en';

    // Toggle Bangla font class
    document.body.classList.toggle('lang-bn', this._currentLang === 'bn');
    document.body.classList.toggle('lang-en', this._currentLang === 'en');

    // Update language toggle button
    const langBtn = document.getElementById('lang-toggle-button');
    if (langBtn) {
      const labelSpan = langBtn.querySelector('.lang-label');
      if (labelSpan) {
        labelSpan.textContent = this._currentLang === 'en' ? 'বাং' : 'EN';
      }
      langBtn.setAttribute('aria-label',
        this._currentLang === 'en' ? 'Switch to Bangla' : 'Switch to English'
      );
    }
  }
};
