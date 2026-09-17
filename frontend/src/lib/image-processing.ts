export interface CropBox {
  x: number
  y: number
  width: number
  height: number
}

export interface CropPctBox {
  xPct: number
  yPct: number
  wPct: number
  hPct: number
}

export type FilterMode = "enhanced_color" | "photocopy_bw" | "grayscale" | "original"

export interface ProcessImageOptions {
  cropBox?: CropBox
  cropPct?: CropPctBox
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

  // Baseline edge noise at outer margins
  let topMarginEnergy = 0
  for (let y = 1; y < Math.floor(sampleH * 0.08); y++) {
    topMarginEnergy += rowEnergy[y]
  }
  const baseEnergyTop = topMarginEnergy / Math.max(1, Math.floor(sampleH * 0.08) - 1)

  let bottomMarginEnergy = 0
  for (let y = Math.floor(sampleH * 0.92); y < sampleH - 1; y++) {
    bottomMarginEnergy += rowEnergy[y]
  }
  const baseEnergyBottom = bottomMarginEnergy / Math.max(1, sampleH - 1 - Math.floor(sampleH * 0.92))

  let leftMarginEnergy = 0
  for (let x = 1; x < Math.floor(sampleW * 0.08); x++) {
    leftMarginEnergy += colEnergy[x]
  }
  const baseEnergyLeft = leftMarginEnergy / Math.max(1, Math.floor(sampleW * 0.08) - 1)

  let rightMarginEnergy = 0
  for (let x = Math.floor(sampleW * 0.92); x < sampleW - 1; x++) {
    rightMarginEnergy += colEnergy[x]
  }
  const baseEnergyRight = rightMarginEnergy / Math.max(1, sampleW - 1 - Math.floor(sampleW * 0.92))

  const thresholdFactor = 1.75

  let peakTop = -1
  for (let y = Math.floor(sampleH * 0.06); y < Math.floor(sampleH * 0.45); y++) {
    if (rowEnergy[y] > baseEnergyTop * thresholdFactor + 12) {
      peakTop = Math.max(0, y - 2)
      break
    }
  }

  let peakBottom = -1
  for (let y = sampleH - Math.floor(sampleH * 0.06); y > Math.floor(sampleH * 0.55); y--) {
    if (rowEnergy[y] > baseEnergyBottom * thresholdFactor + 12) {
      peakBottom = Math.min(sampleH - 1, y + 2)
      break
    }
  }

  let peakLeft = -1
  for (let x = Math.floor(sampleW * 0.06); x < Math.floor(sampleW * 0.45); x++) {
    if (colEnergy[x] > baseEnergyLeft * thresholdFactor + 12) {
      peakLeft = Math.max(0, x - 2)
      break
    }
  }

  let peakRight = -1
  for (let x = sampleW - Math.floor(sampleW * 0.06); x > Math.floor(sampleW * 0.55); x--) {
    if (colEnergy[x] > baseEnergyRight * thresholdFactor + 12) {
      peakRight = Math.min(sampleW - 1, x + 2)
      break
    }
  }

  const scaleX = w / sampleW
  const scaleY = h / sampleH

  let finalTop = peakTop > 0 ? peakTop : Math.floor(sampleH * 0.16)
  let finalBottom = peakBottom > 0 ? peakBottom : Math.floor(sampleH * 0.84)
  let finalLeft = peakLeft > 0 ? peakLeft : Math.floor(sampleW * 0.16)
  let finalRight = peakRight > 0 ? peakRight : Math.floor(sampleW * 0.84)

  let rx = Math.round(finalLeft * scaleX)
  let ry = Math.round(finalTop * scaleY)
  let rw = Math.round((finalRight - finalLeft) * scaleX)
  let rh = Math.round((finalBottom - finalTop) * scaleY)

  if (rw < w * 0.35 || rh < h * 0.25 || rw > w * 0.98) {
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
    const threshold = Math.max(120, Math.min(175, avgGray * 0.96))

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
      g = Math.min(255, Math.max(0, 1.4 * (g - 110) + 128))
      if (g > 180) g = Math.min(255, g + 40)
      d[i] = g
      d[i + 1] = g
      d[i + 2] = g
    }
  } else if (mode === "enhanced_color") {
    const cFactor = 1.5
    for (let i = 0; i < d.length; i += 4) {
      let r = d[i]
      let g = d[i + 1]
      let b = d[i + 2]

      r = cFactor * (r - 128) + 128 + 20
      g = cFactor * (g - 128) + 128 + 20
      b = cFactor * (b - 128) + 128 + 20

      const lum = 0.299 * r + 0.587 * g + 0.114 * b

      if (lum > 145) {
        const whiteLift = Math.min(255, lum + (lum - 145) * 1.25)
        r = Math.min(255, r * 0.2 + whiteLift * 0.8)
        g = Math.min(255, g * 0.2 + whiteLift * 0.8)
        b = Math.min(255, b * 0.2 + whiteLift * 0.8)
      } else if (lum < 110) {
        r = Math.max(0, r * 0.75)
        g = Math.max(0, g * 0.75)
        b = Math.max(0, b * 0.75)
      }

      d[i] = Math.min(255, Math.max(0, r))
      d[i + 1] = Math.min(255, Math.max(0, g))
      d[i + 2] = Math.min(255, Math.max(0, b))
    }
  }

  ctx.putImageData(imgData, 0, 0)
}

export function detectCardBoundsPct(canvas: HTMLCanvasElement): CropPctBox {
  const box = detectCardBounds(canvas)
  const w = canvas.width || 1
  const h = canvas.height || 1
  return {
    xPct: Math.max(0, Math.min(90, Math.round((box.x / w) * 1000) / 10)),
    yPct: Math.max(0, Math.min(90, Math.round((box.y / h) * 1000) / 10)),
    wPct: Math.max(10, Math.min(100, Math.round((box.width / w) * 1000) / 10)),
    hPct: Math.max(10, Math.min(100, Math.round((box.height / h) * 1000) / 10)),
  }
}

export function processIdCardImage(
  imageSource: string | File,
  options: ProcessImageOptions = {}
): Promise<string> {
  const {
    cropBox,
    cropPct,
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

        let targetCrop: CropBox | undefined = cropBox
        if (cropPct) {
          targetCrop = {
            x: Math.round((cropPct.xPct / 100) * sw),
            y: Math.round((cropPct.yPct / 100) * sh),
            width: Math.round((cropPct.wPct / 100) * sw),
            height: Math.round((cropPct.hPct / 100) * sh),
          }
        } else if (!targetCrop && autoDetectBounds) {
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
