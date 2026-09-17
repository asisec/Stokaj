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

  const sampleW = 360
  const sampleH = Math.round((sampleW * h) / w)
  const tempCanvas = document.createElement("canvas")
  tempCanvas.width = sampleW
  tempCanvas.height = sampleH
  const tCtx = tempCanvas.getContext("2d")

  const defaultCrop = () => {
    let rw = Math.round(w * 0.76)
    let rh = Math.round(rw / ID_CARD_RATIO)
    if (rh > h * 0.90) {
      rh = Math.round(h * 0.86)
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

  const getColor = (x: number, y: number) => {
    const px = Math.max(0, Math.min(sampleW - 1, x))
    const py = Math.max(0, Math.min(sampleH - 1, y))
    const idx = (py * sampleW + px) * 4
    const r = data[idx]
    const g = data[idx + 1]
    const b = data[idx + 2]
    const lum = 0.299 * r + 0.587 * g + 0.114 * b
    return { r, g, b, lum }
  }

  const getDiff = (p1: { r: number; g: number; b: number; lum: number }, p2: { r: number; g: number; b: number; lum: number }) => {
    const rgbDiff = (Math.abs(p1.r - p2.r) + Math.abs(p1.g - p2.g) + Math.abs(p1.b - p2.b)) / 3
    const lumDiff = Math.abs(p1.lum - p2.lum)
    return Math.max(rgbDiff, lumDiff)
  }

  const rowDiff = new Float32Array(sampleH)
  const xStart = Math.floor(sampleW * 0.15)
  const xEnd = Math.floor(sampleW * 0.85)
  const countX = Math.max(1, Math.floor((xEnd - xStart) / 2))

  for (let y = 3; y < sampleH - 3; y++) {
    let sum = 0
    for (let x = xStart; x < xEnd; x += 2) {
      const p1 = getColor(x, y - 2)
      const p2 = getColor(x, y + 2)
      sum += getDiff(p1, p2)
    }
    rowDiff[y] = sum / countX
  }

  const colDiff = new Float32Array(sampleW)
  const yStart = Math.floor(sampleH * 0.15)
  const yEnd = Math.floor(sampleH * 0.85)
  const countY = Math.max(1, Math.floor((yEnd - yStart) / 2))

  for (let x = 3; x < sampleW - 3; x++) {
    let sum = 0
    for (let y = yStart; y < yEnd; y += 2) {
      const p1 = getColor(x - 2, y)
      const p2 = getColor(x + 2, y)
      sum += getDiff(p1, p2)
    }
    colDiff[x] = sum / countY
  }

  let noiseTop = 0
  let nTopCount = 0
  for (let y = 2; y < Math.floor(sampleH * 0.08); y++) {
    noiseTop += rowDiff[y]
    nTopCount++
  }
  const bgNoiseTop = noiseTop / Math.max(1, nTopCount)

  let noiseBottom = 0
  let nBottomCount = 0
  for (let y = sampleH - Math.floor(sampleH * 0.08); y < sampleH - 2; y++) {
    noiseBottom += rowDiff[y]
    nBottomCount++
  }
  const bgNoiseBottom = noiseBottom / Math.max(1, nBottomCount)

  let noiseLeft = 0
  let nLeftCount = 0
  for (let x = 2; x < Math.floor(sampleW * 0.08); x++) {
    noiseLeft += colDiff[x]
    nLeftCount++
  }
  const bgNoiseLeft = noiseLeft / Math.max(1, nLeftCount)

  let noiseRight = 0
  let nRightCount = 0
  for (let x = sampleW - Math.floor(sampleW * 0.08); x < sampleW - 2; x++) {
    noiseRight += colDiff[x]
    nRightCount++
  }
  const bgNoiseRight = noiseRight / Math.max(1, nRightCount)

  let peakTop = -1
  const topThreshold = Math.max(6.0, bgNoiseTop * 1.6 + 3.0)
  for (let y = Math.floor(sampleH * 0.05); y < Math.floor(sampleH * 0.45); y++) {
    if (rowDiff[y] > topThreshold) {
      peakTop = Math.max(0, y - 4)
      break
    }
  }

  let peakBottom = -1
  const bottomThreshold = Math.max(6.0, bgNoiseBottom * 1.6 + 3.0)
  for (let y = sampleH - Math.floor(sampleH * 0.05); y > Math.floor(sampleH * 0.55); y--) {
    if (rowDiff[y] > bottomThreshold) {
      peakBottom = Math.min(sampleH - 1, y + 4)
      break
    }
  }

  let peakLeft = -1
  const leftThreshold = Math.max(6.0, bgNoiseLeft * 1.6 + 3.0)
  for (let x = Math.floor(sampleW * 0.05); x < Math.floor(sampleW * 0.45); x++) {
    if (colDiff[x] > leftThreshold) {
      peakLeft = Math.max(0, x - 4)
      break
    }
  }

  let peakRight = -1
  const rightThreshold = Math.max(6.0, bgNoiseRight * 1.6 + 3.0)
  for (let x = sampleW - Math.floor(sampleW * 0.05); x > Math.floor(sampleW * 0.55); x--) {
    if (colDiff[x] > rightThreshold) {
      peakRight = Math.min(sampleW - 1, x + 4)
      break
    }
  }

  const scaleX = w / sampleW
  const scaleY = h / sampleH

  let finalLeft = peakLeft > 0 ? peakLeft : Math.floor(sampleW * 0.14)
  let finalRight = peakRight > 0 ? peakRight : Math.floor(sampleW * 0.86)
  let finalTop = peakTop > 0 ? peakTop : Math.floor(sampleH * 0.15)
  let finalBottom = peakBottom > 0 ? peakBottom : Math.floor(sampleH * 0.85)

  let pixelWidth = (finalRight - finalLeft) * scaleX
  let pixelHeight = pixelWidth / ID_CARD_RATIO

  let pixelCenterY = ((finalTop + finalBottom) / 2) * scaleY
  let pixelTop = pixelCenterY - pixelHeight / 2
  let pixelLeft = finalLeft * scaleX

  if (pixelTop < 0) {
    pixelTop = 0
  }
  if (pixelTop + pixelHeight > h) {
    pixelTop = Math.max(0, h - pixelHeight)
  }
  if (pixelLeft < 0) {
    pixelLeft = 0
  }
  if (pixelLeft + pixelWidth > w) {
    pixelLeft = Math.max(0, w - pixelWidth)
  }

  return {
    x: Math.round(pixelLeft),
    y: Math.round(pixelTop),
    width: Math.round(pixelWidth),
    height: Math.round(pixelHeight),
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
    const threshold = Math.max(125, Math.min(180, avgGray * 0.98))

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
      g = Math.min(255, Math.max(0, 1.45 * (g - 110) + 128))
      if (g > 175) g = Math.min(255, g + 45)
      d[i] = g
      d[i + 1] = g
      d[i + 2] = g
    }
  } else if (mode === "enhanced_color") {
    const cFactor = 1.6
    for (let i = 0; i < d.length; i += 4) {
      let r = d[i]
      let g = d[i + 1]
      let b = d[i + 2]

      r = cFactor * (r - 128) + 128 + 25
      g = cFactor * (g - 128) + 128 + 25
      b = cFactor * (b - 128) + 128 + 25

      const lum = 0.299 * r + 0.587 * g + 0.114 * b

      if (lum > 140) {
        const whiteLift = Math.min(255, lum + (lum - 140) * 1.4)
        r = Math.min(255, r * 0.15 + whiteLift * 0.85)
        g = Math.min(255, g * 0.15 + whiteLift * 0.85)
        b = Math.min(255, b * 0.15 + whiteLift * 0.85)
      } else if (lum < 115) {
        r = Math.max(0, r * 0.7)
        g = Math.max(0, g * 0.7)
        b = Math.max(0, b * 0.7)
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
    wPct: Math.max(15, Math.min(100, Math.round((box.width / w) * 1000) / 10)),
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
