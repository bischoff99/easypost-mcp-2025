/**
 * EasyPost MCP Server 2025 - Internationalization Configuration
 * Multi-language support with automatic locale detection and fallbacks
 */

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = new URL('.', import.meta.url).pathname;

// Supported locales configuration
export const I18N_CONFIG = {
  defaultLocale: 'en-US',
  fallbackLocale: 'en-US',
  supportedLocales: [
    'en-US', // English (United States)
    'es-ES', // Spanish (Spain)
    'es-MX', // Spanish (Mexico)
    'fr-FR', // French (France)
    'de-DE', // German (Germany)
    'it-IT', // Italian (Italy)
    'pt-BR', // Portuguese (Brazil)
    'ja-JP', // Japanese (Japan)
    'ko-KR', // Korean (Korea)
    'zh-CN', // Chinese (Simplified)
    'zh-TW', // Chinese (Traditional)
    'ru-RU', // Russian (Russia)
    'ar-SA', // Arabic (Saudi Arabia)
    'hi-IN', // Hindi (India)
    'th-TH', // Thai (Thailand)
    'vi-VN', // Vietnamese (Vietnam)
  ],
  directory: join(__dirname, '../../locales'),
  autoReload: process.env.NODE_ENV === 'development',
  updateFiles: false,
  syncFiles: false,
  objectNotation: true,
  logDebugFn: (msg: string) => {
    if (process.env.I18N_DEBUG === 'true') {
      console.log('[i18n]', msg);
    }
  },
  logWarnFn: (msg: string) => {
    console.warn('[i18n]', msg);
  },
  logErrorFn: (msg: string) => {
    console.error('[i18n]', msg);
  },
};

// Translation cache
const translationCache = new Map<string, Record<string, any>>();

// Locale information
export const LOCALE_INFO = {
  'en-US': {
    name: 'English',
    nativeName: 'English',
    flag: '🇺🇸',
    rtl: false,
    dateFormat: 'MM/DD/YYYY',
    timeFormat: 'h:mm A',
    currency: 'USD',
    numberFormat: {
      decimal: '.',
      thousands: ',',
    },
  },
  'es-ES': {
    name: 'Spanish (Spain)',
    nativeName: 'Español',
    flag: '🇪🇸',
    rtl: false,
    dateFormat: 'DD/MM/YYYY',
    timeFormat: 'HH:mm',
    currency: 'EUR',
    numberFormat: {
      decimal: ',',
      thousands: '.',
    },
  },
  'es-MX': {
    name: 'Spanish (Mexico)',
    nativeName: 'Español (México)',
    flag: '🇲🇽',
    rtl: false,
    dateFormat: 'DD/MM/YYYY',
    timeFormat: 'HH:mm',
    currency: 'MXN',
    numberFormat: {
      decimal: '.',
      thousands: ',',
    },
  },
  'fr-FR': {
    name: 'French',
    nativeName: 'Français',
    flag: '🇫🇷',
    rtl: false,
    dateFormat: 'DD/MM/YYYY',
    timeFormat: 'HH:mm',
    currency: 'EUR',
    numberFormat: {
      decimal: ',',
      thousands: ' ',
    },
  },
  'de-DE': {
    name: 'German',
    nativeName: 'Deutsch',
    flag: '🇩🇪',
    rtl: false,
    dateFormat: 'DD.MM.YYYY',
    timeFormat: 'HH:mm',
    currency: 'EUR',
    numberFormat: {
      decimal: ',',
      thousands: '.',
    },
  },
  'it-IT': {
    name: 'Italian',
    nativeName: 'Italiano',
    flag: '🇮🇹',
    rtl: false,
    dateFormat: 'DD/MM/YYYY',
    timeFormat: 'HH:mm',
    currency: 'EUR',
    numberFormat: {
      decimal: ',',
      thousands: '.',
    },
  },
  'pt-BR': {
    name: 'Portuguese (Brazil)',
    nativeName: 'Português (Brasil)',
    flag: '🇧🇷',
    rtl: false,
    dateFormat: 'DD/MM/YYYY',
    timeFormat: 'HH:mm',
    currency: 'BRL',
    numberFormat: {
      decimal: ',',
      thousands: '.',
    },
  },
  'ja-JP': {
    name: 'Japanese',
    nativeName: '日本語',
    flag: '🇯🇵',
    rtl: false,
    dateFormat: 'YYYY/MM/DD',
    timeFormat: 'HH:mm',
    currency: 'JPY',
    numberFormat: {
      decimal: '.',
      thousands: ',',
    },
  },
  'ko-KR': {
    name: 'Korean',
    nativeName: '한국어',
    flag: '🇰🇷',
    rtl: false,
    dateFormat: 'YYYY.MM.DD',
    timeFormat: 'HH:mm',
    currency: 'KRW',
    numberFormat: {
      decimal: '.',
      thousands: ',',
    },
  },
  'zh-CN': {
    name: 'Chinese (Simplified)',
    nativeName: '简体中文',
    flag: '🇨🇳',
    rtl: false,
    dateFormat: 'YYYY/MM/DD',
    timeFormat: 'HH:mm',
    currency: 'CNY',
    numberFormat: {
      decimal: '.',
      thousands: ',',
    },
  },
  'zh-TW': {
    name: 'Chinese (Traditional)',
    nativeName: '繁體中文',
    flag: '🇹🇼',
    rtl: false,
    dateFormat: 'YYYY/MM/DD',
    timeFormat: 'HH:mm',
    currency: 'TWD',
    numberFormat: {
      decimal: '.',
      thousands: ',',
    },
  },
  'ru-RU': {
    name: 'Russian',
    nativeName: 'Русский',
    flag: '🇷🇺',
    rtl: false,
    dateFormat: 'DD.MM.YYYY',
    timeFormat: 'HH:mm',
    currency: 'RUB',
    numberFormat: {
      decimal: ',',
      thousands: ' ',
    },
  },
  'ar-SA': {
    name: 'Arabic',
    nativeName: 'العربية',
    flag: '🇸🇦',
    rtl: true,
    dateFormat: 'DD/MM/YYYY',
    timeFormat: 'HH:mm',
    currency: 'SAR',
    numberFormat: {
      decimal: '.',
      thousands: ',',
    },
  },
  'hi-IN': {
    name: 'Hindi',
    nativeName: 'हिन्दी',
    flag: '🇮🇳',
    rtl: false,
    dateFormat: 'DD/MM/YYYY',
    timeFormat: 'HH:mm',
    currency: 'INR',
    numberFormat: {
      decimal: '.',
      thousands: ',',
    },
  },
  'th-TH': {
    name: 'Thai',
    nativeName: 'ไทย',
    flag: '🇹🇭',
    rtl: false,
    dateFormat: 'DD/MM/YYYY',
    timeFormat: 'HH:mm',
    currency: 'THB',
    numberFormat: {
      decimal: '.',
      thousands: ',',
    },
  },
  'vi-VN': {
    name: 'Vietnamese',
    nativeName: 'Tiếng Việt',
    flag: '🇻🇳',
    rtl: false,
    dateFormat: 'DD/MM/YYYY',
    timeFormat: 'HH:mm',
    currency: 'VND',
    numberFormat: {
      decimal: ',',
      thousands: '.',
    },
  },
};

class I18nManager {
  private currentLocale: string = I18N_CONFIG.defaultLocale;
  private translations: Map<string, Record<string, any>> = new Map();

  constructor() {
    this.loadTranslations();
  }

  // Load all translation files
  private loadTranslations() {
    for (const locale of I18N_CONFIG.supportedLocales) {
      try {
        const filePath = join(I18N_CONFIG.directory, `${locale}.json`);
        if (existsSync(filePath)) {
          const translations = JSON.parse(readFileSync(filePath, 'utf8'));
          this.translations.set(locale, translations);
          translationCache.set(locale, translations);
        }
      } catch (error) {
        I18N_CONFIG.logWarnFn(`Failed to load translations for ${locale}: ${(error as Error).message}`);
      }
    }
  }

  // Get translation for a key
  public t(key: string, options: { locale?: string; interpolation?: Record<string, any> } = {}): string {
    const locale = options.locale || this.currentLocale;
    const translations = this.translations.get(locale) || this.translations.get(I18N_CONFIG.fallbackLocale) || {};
    
    let translation = this.getNestedValue(translations, key);
    
    // Fallback to default locale if not found
    if (!translation && locale !== I18N_CONFIG.fallbackLocale) {
      const fallbackTranslations = this.translations.get(I18N_CONFIG.fallbackLocale) || {};
      translation = this.getNestedValue(fallbackTranslations, key);
    }
    
    // Return key if translation not found
    if (!translation) {
      I18N_CONFIG.logWarnFn(`Translation not found: ${key} (locale: ${locale})`);
      return key;
    }
    
    // Interpolate variables
    if (options.interpolation) {
      return this.interpolate(translation, options.interpolation);
    }
    
    return translation;
  }

  // Get nested object value by dot notation
  private getNestedValue(obj: any, key: string): any {
    return key.split('.').reduce((o, k) => (o && o[k] !== undefined) ? o[k] : null, obj);
  }

  // Interpolate variables in translation string
  private interpolate(template: string, variables: Record<string, any>): string {
    return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return variables[key] !== undefined ? String(variables[key]) : match;
    });
  }

  // Set current locale
  public setLocale(locale: string): void {
    if (I18N_CONFIG.supportedLocales.includes(locale)) {
      this.currentLocale = locale;
    } else {
      I18N_CONFIG.logWarnFn(`Unsupported locale: ${locale}. Using default: ${I18N_CONFIG.defaultLocale}`);
      this.currentLocale = I18N_CONFIG.defaultLocale;
    }
  }

  // Get current locale
  public getLocale(): string {
    return this.currentLocale;
  }

  // Get locale information
  public getLocaleInfo(locale?: string): any {
    const targetLocale = locale || this.currentLocale;
    return LOCALE_INFO[targetLocale as keyof typeof LOCALE_INFO] || LOCALE_INFO[I18N_CONFIG.defaultLocale as keyof typeof LOCALE_INFO];
  }

  // Format date according to locale
  public formatDate(date: Date, locale?: string): string {
    const targetLocale = locale || this.currentLocale;
    const localeInfo = this.getLocaleInfo(targetLocale);
    
    try {
      return new Intl.DateTimeFormat(targetLocale.replace('-', '_'), {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }).format(date);
    } catch (error) {
      // Fallback to manual formatting
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      
      return localeInfo.dateFormat
        .replace('YYYY', year.toString())
        .replace('MM', month)
        .replace('DD', day);
    }
  }

  // Format number according to locale
  public formatNumber(number: number, locale?: string): string {
    const targetLocale = locale || this.currentLocale;
    const localeInfo = this.getLocaleInfo(targetLocale);
    
    try {
      return new Intl.NumberFormat(targetLocale.replace('-', '_')).format(number);
    } catch (error) {
      // Fallback to manual formatting
      const parts = number.toString().split('.');
      parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, localeInfo.numberFormat.thousands);
      return parts.join(localeInfo.numberFormat.decimal);
    }
  }

  // Format currency according to locale
  public formatCurrency(amount: number, locale?: string): string {
    const targetLocale = locale || this.currentLocale;
    const localeInfo = this.getLocaleInfo(targetLocale);
    
    try {
      return new Intl.NumberFormat(targetLocale.replace('-', '_'), {
        style: 'currency',
        currency: localeInfo.currency,
      }).format(amount);
    } catch (error) {
      // Fallback to simple formatting
      return `${localeInfo.currency} ${this.formatNumber(amount, locale)}`;
    }
  }

  // Get available locales
  public getAvailableLocales(): Array<{ code: string; name: string; nativeName: string; flag: string }> {
    return I18N_CONFIG.supportedLocales.map(locale => ({
      code: locale,
      name: LOCALE_INFO[locale as keyof typeof LOCALE_INFO]?.name || locale,
      nativeName: LOCALE_INFO[locale as keyof typeof LOCALE_INFO]?.nativeName || locale,
      flag: LOCALE_INFO[locale as keyof typeof LOCALE_INFO]?.flag || '🌐',
    }));
  }

  // Detect locale from Accept-Language header
  public detectLocale(acceptLanguage: string): string {
    if (!acceptLanguage) {
      return I18N_CONFIG.defaultLocale;
    }

    const languages = acceptLanguage
      .split(',')
      .map(lang => {
        const [code, q = '1'] = lang.trim().split(';q=');
        return { code: code.trim(), quality: parseFloat(q) };
      })
      .sort((a, b) => b.quality - a.quality);

    for (const lang of languages) {
      // Exact match
      if (I18N_CONFIG.supportedLocales.includes(lang.code)) {
        return lang.code;
      }
      
      // Language family match (e.g., 'en' matches 'en-US')
      const languageCode = lang.code.split('-')[0];
      const match = I18N_CONFIG.supportedLocales.find(locale => 
        locale.startsWith(languageCode + '-')
      );
      if (match) {
        return match;
      }
    }

    return I18N_CONFIG.defaultLocale;
  }

  // Express middleware for locale detection and setting
  public middleware() {
    return (req: any, res: any, next: any) => {
      let locale = I18N_CONFIG.defaultLocale;

      // 1. Check query parameter
      if (req.query.lang && I18N_CONFIG.supportedLocales.includes(req.query.lang)) {
        locale = req.query.lang;
      }
      // 2. Check session
      else if (req.session?.locale && I18N_CONFIG.supportedLocales.includes(req.session.locale)) {
        locale = req.session.locale;
      }
      // 3. Check cookie
      else if (req.cookies?.locale && I18N_CONFIG.supportedLocales.includes(req.cookies.locale)) {
        locale = req.cookies.locale;
      }
      // 4. Detect from Accept-Language header
      else if (req.headers['accept-language']) {
        locale = this.detectLocale(req.headers['accept-language']);
      }

      // Set locale for this request
      req.locale = locale;
      req.t = (key: string, options?: any) => this.t(key, { ...options, locale });
      req.formatDate = (date: Date) => this.formatDate(date, locale);
      req.formatNumber = (number: number) => this.formatNumber(number, locale);
      req.formatCurrency = (amount: number) => this.formatCurrency(amount, locale);
      req.localeInfo = this.getLocaleInfo(locale);

      // Set response headers
      res.locals.locale = locale;
      res.locals.localeInfo = this.getLocaleInfo(locale);
      res.locals.availableLocales = this.getAvailableLocales();
      res.locals.t = req.t;

      next();
    };
  }

  // Pluralization helper
  public plural(count: number, key: string, locale?: string): string {
    const targetLocale = locale || this.currentLocale;
    
    // Try to get pluralized version
    let pluralKey = key;
    if (count === 0) {
      pluralKey = `${key}_zero`;
    } else if (count === 1) {
      pluralKey = `${key}_one`;
    } else {
      pluralKey = `${key}_other`;
    }
    
    let translation = this.t(pluralKey, { locale: targetLocale });
    
    // Fallback to singular form if plural not found
    if (translation === pluralKey) {
      translation = this.t(key, { locale: targetLocale });
    }
    
    return this.interpolate(translation, { count });
  }
}

// Create singleton instance
export const i18n = new I18nManager();

// Helper functions
export const t = (key: string, options?: any) => i18n.t(key, options);
export const setLocale = (locale: string) => i18n.setLocale(locale);
export const getLocale = () => i18n.getLocale();
export const formatDate = (date: Date, locale?: string) => i18n.formatDate(date, locale);
export const formatNumber = (number: number, locale?: string) => i18n.formatNumber(number, locale);
export const formatCurrency = (amount: number, locale?: string) => i18n.formatCurrency(amount, locale);
export const getAvailableLocales = () => i18n.getAvailableLocales();
export const detectLocale = (acceptLanguage: string) => i18n.detectLocale(acceptLanguage);
export const createI18nMiddleware = () => i18n.middleware();

// Default export
export default i18n;