import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import { type Locale, type MessageKey, messages } from './locales'

const SUPPORTED_LOCALES: Locale[] = ['zh-CN', 'en', 'ja']

function detectLocale(): Locale {
  const browserLang = navigator.language
  if (browserLang.startsWith('zh')) return 'zh-CN'
  if (browserLang.startsWith('ja')) return 'ja'
  if (browserLang.startsWith('en')) return 'en'
  return 'en'
}

interface LocaleContextValue {
  locale: Locale
  setLocale: (locale: Locale) => void
  t: (key: MessageKey) => string
}

const LocaleContext = createContext<LocaleContextValue | null>(null)

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(detectLocale)

  const setLocale = useCallback((next: Locale) => {
    if (SUPPORTED_LOCALES.includes(next)) {
      setLocaleState(next)
    }
  }, [])

  const t = useCallback(
    (key: MessageKey) => {
      return messages[locale][key] ?? key
    },
    [locale],
  )

  return (
    <LocaleContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </LocaleContext.Provider>
  )
}

export function useLocale(): LocaleContextValue {
  const ctx = useContext(LocaleContext)
  if (!ctx) {
    throw new Error('useLocale must be used within a LocaleProvider')
  }
  return ctx
}
