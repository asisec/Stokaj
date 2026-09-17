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

export const ID_CARD_RATIO = 85.6 / 53.98 // ISO/IEC 7810 ID-1 standard (~1.5858)

export function detectCardBounds(canvas: HTMLCanvasElement): CropBox {
  const w = canvas.width
  const h = canvas.height

  if (w < 40 || h < 40) {
    return { x: 0, y: 0, width: w, height: h }
  }

  const sampleW = 320
  const sampleH = Math.round((sampleW * h) / w)
  const tempCanvas = document.createElement("canvas")
  tempCanvas.width = sampleW
  tempCanvas.height = sampleH
  const tCtx = tempCanvas.getContext("2d")

  const defaultCrop = () => {
    let rw = Math.round(w * 0.74)
    let rh = Math.round(rw / ID_CARD_RATIO)
    if (rh > h * 0.88) {
      rh = Math.round(h * 0.85)
      rw = Math.round(rh * ID_CARD_RATIO)
    }
    const rx = Math.round((w - rw) / 2)
    const ry = Math.round((h - rh) / 2)
    return {
      x: Math.max(0, rx),
      y: Math.max(0, ry),
      width: Math.min(w - rx, rw),
      height: Math.min(h - ry, rh),
    }
  }

  if (!tCtx) {
    return defaultCrop()
  }

  tCtx.drawImage(canvas, 0, 0, sampleW, sampleH)
  const imgData = tCtx.getImageData(0, 0, sampleW, sampleH)
  const data = imgData.data

  const getLuminance = (x: number, y: number): number => {
    const px = Math.max(0, Math.min(sampleW - 1, x))
    const py = Math.max(0, Math.min(sampleH - 1, y))
    const idx = (py * sampleW + px) * 4
    return 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2]
  }

  const rowEnergy = new Float32Array(sampleH)
  const xStart = Math.floor(sampleW * 0.25)
  const xEnd = Math.floor(sampleW * 0.75)
  for (let y = 3; y < sampleH - 3; y++) {
    let sum = 0
    for (let x = xStart; x < xEnd; x += 2) {
      const diff1 = Math.abs(getLuminance(x, y + 2) - getLuminance(x, y - 2))
      const diff2 = Math.abs(getLuminance(x, y + 1) - getLuminance(x, y - 1))
      sum += diff1 * 0.7 + diff2 * 0.3
    }
    rowEnergy[y] = sum
  }

  const colEnergy = new Float32Array(sampleW)
  const yStart = Math.floor(sampleH * 0.25)
  const yEnd = Math.floor(sampleH * 0.75)
  for (let x = 3; x < sampleW - 3; x++) {
    let sum = 0
    for (let y = yStart; y < yEnd; y += 2) {
      const diff1 = Math.abs(getLuminance(x + 2, y) - getLuminance(x - 2, y))
      const diff2 = Math.abs(getLuminance(x + 1, y) - getLuminance(x - 1, y))
      sum += diff1 * 0.7 + diff2 * 0.3
    }
    colEnergy[x] = sum
  }

  let maxTopVal = 0
  let peakTop = -1
  const topLimit = Math.floor(sampleH * 0.42)
  for (let y = Math.floor(sampleH * 0.06); y < topLimit; y++) {
    if (rowEnergy[y] > maxTopVal) {
      maxTopVal = rowEnergy[y]
      peakTop = y
    }
  }

  let maxBottomVal = 0
  let peakBottom = -1
  const bottomStart = Math.floor(sampleH * 0.58)
  for (let y = bottomStart; y < sampleH - Math.floor(sampleH * 0.05); y++) {
    if (rowEnergy[y] > maxBottomVal) {
      maxBottomVal = rowEnergy[y]
      peakBottom = y
    }
  }

  let maxLeftVal = 0
  let peakLeft = -1
  const leftLimit = Math.floor(sampleW * 0.42)
  for (let x = Math.floor(sampleW * 0.05); x < leftLimit; x++) {
    if (colEnergy[x] > maxLeftVal) {
      maxLeftVal = colEnergy[x]
      peakLeft = x
    }
  }

  let maxRightVal = 0
  let peakRight = -1
  const rightStart = Math.floor(sampleW * 0.58)
  for (let x = rightStart; x < sampleW - Math.floor(sampleW * 0.05); x++) {
    if (colEnergy[x] > maxRightVal) {
      maxRightVal = colEnergy[x]
      peakRight = x
    }
  }

  const scaleX = w / sampleW
  const scaleY = h / sampleH

  let finalTop = peakTop > 0 ? peakTop : Math.floor(sampleH * 0.22)
  let finalBottom = peakBottom > 0 ? peakBottom : Math.floor(sampleH * 0.78)
  let finalLeft = peakLeft > 0 ? peakLeft : Math.floor(sampleW * 0.16)
  let finalRight = peakRight > 0 ? peakRight : Math.floor(sampleW * 0.84)

  let estWidth = (finalRight - finalLeft) * scaleX
  let estHeight = (finalBottom - finalTop) * scaleY

  const ratio = estWidth / estHeight
  if (ratio < 1.3 || ratio > 1.85) {
    if (estWidth > w * 0.5) {
      estHeight = estWidth / ID_CARD_RATIO
      if (peakTop > 0) {
        finalBottom = Math.round(peakTop + estHeight / scaleY)
      } else if (peakBottom > 0) {
        finalTop = Math.round(peakBottom - estHeight / scaleY)
      }
    } else {
      return defaultCrop()
    }
  }

  let rx = Math.round(finalLeft * scaleX)
  let ry = Math.round(finalTop * scaleY)
  let rw = Math.round((finalRight - finalLeft) * scaleX)
  let rh = Math.round((finalBottom - finalTop) * scaleY)

  if (rw < w * 0.35 || rh < h * 0.25 || rw > w * 0.96) {
    return defaultCrop()
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

      if (lum > 175) {
        const whiteLift = Math.min(255, lum + (lum - 175) * 0.9)
        r = Math.min(255, r * 0.35 + whiteLift * 0.65)
        g = Math.min(255, g * 0.35 + whiteLift * 0.65)
        b = Math.min(255, b * 0.35 + whiteLift * 0.65)
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
