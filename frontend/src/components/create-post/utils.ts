export async function getCroppedImg(
  imageSrc: string,
  pixelCrop: { x: number; y: number; width: number; height: number; },
  rotation = 0
) {
  return new Promise<Blob>((resolve, reject) => {
    const image = new Image()
    image.crossOrigin = 'anonymous'
    image.onload = () => {
      try {
        const radians = rotation * Math.PI / 180
        const sin = Math.abs(Math.sin(radians))
        const cos = Math.abs(Math.cos(radians))
        const width = image.width
        const height = image.height

        // size of the bounding box after rotation
        const boundWidth = Math.floor(width * cos + height * sin)
        const boundHeight = Math.floor(width * sin + height * cos)

        // draw rotated image on a temporary canvas
        const rotCanvas = document.createElement('canvas')
        rotCanvas.width = boundWidth
        rotCanvas.height = boundHeight
        const rctx = rotCanvas.getContext('2d')
        if (!rctx) throw new Error('Failed to get canvas context')

        // move origin to center and rotate
        rctx.translate(boundWidth / 2, boundHeight / 2)
        rctx.rotate(radians)
        rctx.drawImage(image, -width / 2, -height / 2)

        // extract the cropped area from rotated canvas
        const canvas = document.createElement('canvas')
        canvas.width = pixelCrop.width
        canvas.height = pixelCrop.height
        const ctx = canvas.getContext('2d')
        if (!ctx) throw new Error('Failed to get canvas context')

        const data = rctx.getImageData(pixelCrop.x, pixelCrop.y, pixelCrop.width, pixelCrop.height)
        ctx.putImageData(data, 0, 0)

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


