export function isMobileClient() {
  if (typeof document !== 'undefined' && typeof document.body !== 'undefined' && typeof document.body.dataset !== 'undefined' && document.body.dataset.mobile !== undefined) {
    return document.body.dataset.mobile === '1'
  }

  if (typeof window !== 'undefined') {
    return window.innerWidth < 1024
  }

  return false
}
