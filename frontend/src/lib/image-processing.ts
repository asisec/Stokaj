export interface ProcessImageOptions {
  autoCrop?: boolean
  cleanBackground?: boolean
  rotation?: number
  brightness?: number
  contrast?: number
}

export function processIdCardImage(
  imageSource: string | File,
  options: ProcessImageOptions = {}
): Promise<string> {
  const {
    autoCrop = true,
    cleanBackground = true,
    rotation = 0,
    brightness = 10,
    contrast = 25,
  } = options

  return new Promise((resolve, reject) => {
    const img = new Image()

    img.onload = () => {
      try {
        const sourceCanvas = document.createElement("canvas")
        const sCtx = sourceCanvas.getContext("2d")
        if (!sCtx) {
          resolve(typeof imageSource === "string" ? imageSource : "")
          return
        }

        const isRotated90or270 = rotation % 180 !== 0
        const sw = isRotated90or270 ? img.height : img.width
        const sh = isRotated90or270 ? img.width : img.height

        sourceCanvas.width = sw
        sourceCanvas.height = sh

        sCtx.translate(sw / 2, sh / 2)
        sCtx.rotate((rotation * Math.PI) / 180)
        sCtx.drawImage(img, -img.width / 2, -img.height / 2)

        let finalWidth = sw
        let finalHeight = sh
        let sx = 0
        let sy = 0

        const ID_CARD_RATIO = 85.6 / 53.98 // ISO/IEC 7810 ID-1 standard (~1.5858)

        if (autoCrop) {
          const currentRatio = sw / sh
          if (currentRatio > ID_CARD_RATIO) {
            finalWidth = Math.round(sh * ID_CARD_RATIO)
            finalHeight = sh
            sx = Math.round((sw - finalWidth) / 2)
            sy = 0
          } else {
            finalWidth = sw
            finalHeight = Math.round(sw / ID_CARD_RATIO)
            sx = 0
            sy = Math.round((sh - finalHeight) / 2)
          }
        }

        const targetCanvas = document.createElement("canvas")
        const tCtx = targetCanvas.getContext("2d")
        if (!tCtx) {
          resolve(sourceCanvas.toDataURL("image/jpeg", 0.9))
          return
        }

        const OUTPUT_WIDTH = 1200
        const OUTPUT_HEIGHT = Math.round(OUTPUT_WIDTH / ID_CARD_RATIO)

        targetCanvas.width = OUTPUT_WIDTH
        targetCanvas.height = OUTPUT_HEIGHT

        tCtx.fillStyle = "#ffffff"
        tCtx.fillRect(0, 0, OUTPUT_WIDTH, OUTPUT_HEIGHT)

        tCtx.drawImage(
          sourceCanvas,
          sx,
          sy,
          finalWidth,
          finalHeight,
          0,
          0,
          OUTPUT_WIDTH,
          OUTPUT_HEIGHT
        )

        if (cleanBackground) {
          const imgData = tCtx.getImageData(0, 0, OUTPUT_WIDTH, OUTPUT_HEIGHT)
          const data = imgData.data

          const bFactor = brightness
          const cFactor = (259 * (contrast + 255)) / (255 * (259 - contrast))

          for (let i = 0; i < data.length; i += 4) {
            let r = data[i]
            let g = data[i + 1]
            let b = data[i + 2]

            r = cFactor * (r - 128) + 128 + bFactor
            g = cFactor * (g - 128) + 128 + bFactor
            b = cFactor * (b - 128) + 128 + bFactor

            const lum = 0.299 * r + 0.587 * g + 0.114 * b

            if (lum > 215) {
              const boost = Math.min(255, lum + 35)
              r = Math.min(255, (r + boost) / 2)
              g = Math.min(255, (g + boost) / 2)
              b = Math.min(255, (b + boost) / 2)
            }

            data[i] = Math.min(255, Math.max(0, r))
            data[i + 1] = Math.min(255, Math.max(0, g))
            data[i + 2] = Math.min(255, Math.max(0, b))
          }

          tCtx.putImageData(imgData, 0, 0)
        }

        resolve(targetCanvas.toDataURL("image/jpeg", 0.92))
      } catch (err) {
        reject(err)
      }
    }

    img.onerror = () => {
      reject(new Error("Görsel yüklenirken bir hata oluştu"))
    }

    if (typeof imageSource === "string") {
      img.src = imageSource
    } else {
      const reader = new FileReader()
      reader.onload = (e) => {
        img.src = e.target?.result as string
      }
      reader.onerror = () => reject(new Error("Dosya okunamadı"))
      reader.readAsDataURL(imageSource)
    }
  })
}
