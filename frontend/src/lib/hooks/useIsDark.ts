import { useEffect, useState } from 'react'

export default function useIsDark() {
  const getIsDark = () => {
    if (typeof window === 'undefined') return false
    const root = document.documentElement
    const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)')?.matches
    return root.classList.contains('dark') || Boolean(prefersDark)
  }

  const [isDark, setIsDark] = useState<boolean>(getIsDark)

  useEffect(() => {
    const check = () => setIsDark(getIsDark())

    const mql = window.matchMedia?.('(prefers-color-scheme: dark)')
    mql?.addEventListener('change', check)

    const obs = new MutationObserver(check)
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })

    // Also listen to storage in case theme is stored in localStorage elsewhere
    const onStorage = () => check()
    window.addEventListener('storage', onStorage)

    return () => {
      mql?.removeEventListener('change', check)
      obs.disconnect()
      window.removeEventListener('storage', onStorage)
    }
  }, [])

  return isDark
}
