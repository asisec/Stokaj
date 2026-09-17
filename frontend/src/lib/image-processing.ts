export interface CropBox {
  x: number
  y: number
  width: number
  height: number
}

export type FilterMode = "enhanced_color" | "photocopy_bw" | "grayscale" | "original"

export interface ProcessImageOptions {
  cropBox?: CropBox
  autoDetectBounds?: boolean
  filterMode?: FilterMode
  rotation?: number
}

export function detectCardBounds(
  canvas: HTMLCanvasElement
): CropBox {
  const ctx = canvas.getContext("2d")
  const w = canvas.width
  const h = canvas.height

  if (!ctx || w < 20 || h < 20) {
    return { x: 0, y: 0, width: w, height: h }
  }

  const sampleW = 240
  const sampleH = Math.round((sampleW * h) / w)
  const tempCanvas = document.createElement("canvas")
  tempCanvas.width = sampleW
  tempCanvas.height = sampleH
  const tCtx = tempCanvas.getContext("2d")

  if (!tCtx) {
    return { x: 0, y: 0, width: w, height: h }
  }

  tCtx.drawImage(canvas, 0, 0, sampleW, sampleH)
  const imgData = tCtx.getImageData(0, 0, sampleW, sampleH)
  const data = imgData.data

  const getGray = (x: number, y: number): number => {
    const idx = (y * sampleW + x) * 4
    return 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2]
  }

  const cornerSamples = [
    getGray(5, 5),
    getGray(sampleW - 6, 5),
    getGray(5, sampleH - 6),
    getGray(sampleW - 6, sampleH - 6),
  ]
  const bgRef = cornerSamples.reduce((a, b) => a + b, 0) / cornerSamples.length

  const threshold = 28

  let top = 0
  let bottom = sampleH - 1
  let left = 0
  let right = sampleW - 1

  for (let y = 0; y < Math.floor(sampleH * 0.45); y++) {
    let diffCount = 0
    for (let x = Math.floor(sampleW * 0.2); x < Math.floor(sampleW * 0.8); x += 2) {
      if (Math.abs(getGray(x, y) - bgRef) > threshold) {
        diffCount++
      }
    }
    if (diffCount > sampleW * 0.15) {
      top = Math.max(0, y - 2)
      break
    }
  }

  for (let y = sampleH - 1; y > Math.floor(sampleH * 0.55); y--) {
    let diffCount = 0
    for (let x = Math.floor(sampleW * 0.2); x < Math.floor(sampleW * 0.8); x += 2) {
      if (Math.abs(getGray(x, y) - bgRef) > threshold) {
        diffCount++
      }
    }
    if (diffCount > sampleW * 0.15) {
      bottom = Math.min(sampleH - 1, y + 2)
      break
    }
  }

  for (let x = 0; x < Math.floor(sampleW * 0.45); x++) {
    let diffCount = 0
    for (let y = Math.floor(sampleH * 0.2); y < Math.floor(sampleH * 0.8); y += 2) {
      if (Math.abs(getGray(x, y) - bgRef) > threshold) {
        diffCount++
      }
    }
    if (diffCount > sampleH * 0.15) {
      left = Math.max(0, x - 2)
      break
    }
  }

  for (let x = sampleW - 1; x > Math.floor(sampleW * 0.55); x--) {
    let diffCount = 0
    for (let y = Math.floor(sampleH * 0.2); y < Math.floor(sampleH * 0.8); y += 2) {
      if (Math.abs(getGray(x, y) - bgRef) > threshold) {
        diffCount++
      }
    }
    if (diffCount > sampleH * 0.15) {
      right = Math.min(sampleW - 1, x + 2)
      break
    }
  }

  const scaleX = w / sampleW
  const scaleY = h / sampleH

  let rx = Math.round(left * scaleX)
  let ry = Math.round(top * scaleY)
  let rw = Math.round((right - left) * scaleX)
  let rh = Math.round((bottom - top) * scaleY)

  if (rw < w * 0.3 || rh < h * 0.3) {
    const ID_CARD_RATIO = 85.6 / 53.98
    const currentRatio = w / h
    if (currentRatio > ID_CARD_RATIO) {
      rw = Math.round(h * ID_CARD_RATIO * 0.9)
      rh = Math.round(h * 0.9)
      rx = Math.round((w - rw) / 2)
      ry = Math.round((h - rh) / 2)
    } else {
      rw = Math.round(w * 0.9)
      rh = Math.round((w * 0.9) / ID_CARD_RATIO)
      rx = Math.round((w - rw) / 2)
      ry = Math.round((h - rh) / 2)
    }
  }

  return {
    x: Math.max(0, rx),
    y: Math.max(0, ry),
    width: Math.min(w - rx, rw),
    height: Math.min(h - ry, rh),
  }
}

export function applyDocumentEnhance(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  mode: FilterMode
) {
  if (mode === "original") return

  const imgData = ctx.getImageData(0, 0, width, height)
  const d = imgData.data

  if (mode === "photocopy_bw") {
    let totalGray = 0
    const len = d.length / 4
    for (let i = 0; i < d.length; i += 4) {
      totalGray += 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2]
    }
    const avgGray = totalGray / len
    const threshold = Math.max(115, Math.min(170, avgGray * 0.92))

    for (let i = 0; i < d.length; i += 4) {
      const g = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2]
      const val = g > threshold ? 255 : 0
      d[i] = val
      d[i + 1] = val
      d[i + 2] = val
    }
  } else if (mode === "grayscale") {
    for (let i = 0; i < d.length; i += 4) {
      let g = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2]
      g = Math.min(255, Math.max(0, 1.25 * (g - 110) + 128))
      if (g > 195) g = Math.min(255, g + 35)
      d[i] = g
      d[i + 1] = g
      d[i + 2] = g
    }
  } else if (mode === "enhanced_color") {
    const cFactor = 1.35
    for (let i = 0; i < d.length; i += 4) {
      let r = d[i]
      let g = d[i + 1]
      let b = d[i + 2]

      r = cFactor * (r - 128) + 128 + 15
      g = cFactor * (g - 128) + 128 + 15
      b = cFactor * (b - 128) + 128 + 15

      const lum = 0.299 * r + 0.587 * g + 0.114 * b

      if (lum > 180) {
        const whiteLift = Math.min(255, lum + (lum - 180) * 0.85)
        r = Math.min(255, (r * 0.4) + (whiteLift * 0.6))
        g = Math.min(255, (g * 0.4) + (whiteLift * 0.6))
        b = Math.min(255, (b * 0.4) + (whiteLift * 0.6))
      }

      d[i] = Math.min(255, Math.max(0, r))
      d[i + 1] = Math.min(255, Math.max(0, g))
      d[i + 2] = Math.min(255, Math.max(0, b))
    }
  }

  ctx.putImageData(imgData, 0, 0)
}

export function processIdCardImage(
  imageSource: string | File,
  options: ProcessImageOptions = {}
): Promise<string> {
  const {
    cropBox,
    autoDetectBounds = true,
    filterMode = "enhanced_color",
    rotation = 0,
  } = options

  return new Promise((resolve, reject) => {
    const img = new Image()

    img.onload = () => {
      try {
        const isRotated90or270 = rotation % 180 !== 0
        const sw = isRotated90or270 ? img.height : img.width
        const sh = isRotated90or270 ? img.width : img.height

        const rotatedCanvas = document.createElement("canvas")
        rotatedCanvas.width = sw
        rotatedCanvas.height = sh
        const rCtx = rotatedCanvas.getContext("2d")
        if (!rCtx) {
          resolve(typeof imageSource === "string" ? imageSource : "")
          return
        }

        rCtx.translate(sw / 2, sh / 2)
        rCtx.rotate((rotation * Math.PI) / 180)
        rCtx.drawImage(img, -img.width / 2, -img.height / 2)

        let targetCrop = cropBox
        if (!targetCrop && autoDetectBounds) {
          targetCrop = detectCardBounds(rotatedCanvas)
        }

        if (!targetCrop) {
          targetCrop = { x: 0, y: 0, width: sw, height: sh }
        }

        const ID_CARD_RATIO = 85.6 / 53.98
        const OUTPUT_WIDTH = 1200
        const OUTPUT_HEIGHT = Math.round(OUTPUT_WIDTH / ID_CARD_RATIO)

        const finalCanvas = document.createElement("canvas")
        finalCanvas.width = OUTPUT_WIDTH
        finalCanvas.height = OUTPUT_HEIGHT
        const fCtx = finalCanvas.getContext("2d")
        if (!fCtx) {
          resolve(rotatedCanvas.toDataURL("image/jpeg", 0.9))
          return
        }

        fCtx.fillStyle = "#ffffff"
        fCtx.fillRect(0, 0, OUTPUT_WIDTH, OUTPUT_HEIGHT)

        fCtx.drawImage(
          rotatedCanvas,
          targetCrop.x,
          targetCrop.y,
          targetCrop.width,
          targetCrop.height,
          0,
          0,
          OUTPUT_WIDTH,
          OUTPUT_HEIGHT
        )

        applyDocumentEnhance(fCtx, OUTPUT_WIDTH, OUTPUT_HEIGHT, filterMode)

        resolve(finalCanvas.toDataURL("image/jpeg", 0.94))
      } catch (err) {
        reject(err)
      }
    }

    img.onerror = () => reject(new Error("Görsel yüklenemedi"))

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
