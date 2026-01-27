export async function getCroppedImg(imageSrc: string, pixelCrop: { x: number; y: number; width: number; height: number; }) {
  return new Promise<Blob>((resolve, reject) => {
    const image = new Image()
    image.crossOrigin = 'anonymous'
    image.onload = () => {
      try {
        const canvas = document.createElement('canvas')
        canvas.width = pixelCrop.width
        canvas.height = pixelCrop.height
        const ctx = canvas.getContext('2d')
        if (!ctx) throw new Error('Failed to get canvas context')

        ctx.drawImage(
          image,
          pixelCrop.x,
          pixelCrop.y,
          pixelCrop.width,
          pixelCrop.height,
          0,
          0,
          pixelCrop.width,
          pixelCrop.height
        )

        canvas.toBlob((blob) => {
          if (!blob) return reject(new Error('Canvas is empty'))
          resolve(blob)
        }, 'image/jpeg', 0.95)
      } catch (err) {
        reject(err)
      }
    }
    image.onerror = (err) => reject(err)
    image.src = imageSrc
  })
}

export const readFileAsDataUrl = (file: File) => new Promise<string>((resolve, reject) => {
  const reader = new FileReader()
  reader.onload = () => resolve(reader.result as string)
  reader.onerror = reject
  reader.readAsDataURL(file)
})
