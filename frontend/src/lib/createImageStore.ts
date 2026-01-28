export const setFileForUrl = (url: string, file: File) => {
  const w = window as unknown as { __CREATE_POST_FILES__?: Map<string, File> }
  w.__CREATE_POST_FILES__ = w.__CREATE_POST_FILES__ || new Map()
  w.__CREATE_POST_FILES__.set(url, file)
}

export const getFileForUrl = (url: string): File | undefined => {
  const w = window as unknown as { __CREATE_POST_FILES__?: Map<string, File> }
  return w.__CREATE_POST_FILES__?.get(url)
}

export const removeFileForUrl = (url: string) => {
  const w = window as unknown as { __CREATE_POST_FILES__?: Map<string, File> }
  w.__CREATE_POST_FILES__?.delete(url)
}

export const clearAllFilesForCreate = () => {
  const w = window as unknown as { __CREATE_POST_FILES__?: Map<string, File> }
  if (w.__CREATE_POST_FILES__) {
    try {
      w.__CREATE_POST_FILES__.forEach((_, url) => {
        try { URL.revokeObjectURL(url) } catch {}
      })
    } finally {
      w.__CREATE_POST_FILES__ = new Map()
    }
  }
}
