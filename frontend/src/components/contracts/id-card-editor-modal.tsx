"use client"

import React, { useState, useEffect, useRef } from "react"
import {
  RotateCw,
  Sparkles,
  Check,
  X,
  Maximize2,
  Scan,
  Lock,
  Unlock,
  ZoomIn,
  ZoomOut,
  CreditCard,
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  detectCardBounds,
  processIdCardImage,
  ID_CARD_RATIO,
  type CropBox,
  type FilterMode,
} from "@/lib/image-processing"

interface IdCardEditorModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  imageSource: string | null
  cardTitle: string
  onSave: (processedDataUrl: string) => void
}

export function IdCardEditorModal({
  open,
  onOpenChange,
  imageSource,
  cardTitle,
  onSave,
}: IdCardEditorModalProps) {
  const [rotation, setRotation] = useState(0)
  const [filterMode, setFilterMode] = useState<FilterMode>("enhanced_color")
  const [lockRatio, setLockRatio] = useState(true)
  const [cropBox, setCropBox] = useState<CropBox | null>(null)
  const [naturalSize, setNaturalSize] = useState<{ w: number; h: number }>({ w: 0, h: 0 })
  const [isProcessing, setIsProcessing] = useState(false)

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const [activeDrag, setActiveDrag] = useState<string | null>(null)
  const dragStartPos = useRef<{ mouseX: number; mouseY: number; box: CropBox }>({
    mouseX: 0,
    mouseY: 0,
    box: { x: 0, y: 0, width: 0, height: 0 },
  })

  const getStandardCrop = (w: number, h: number): CropBox => {
    let rw = Math.round(w * 0.74)
    let rh = Math.round(rw / ID_CARD_RATIO)
    if (rh > h * 0.88) {
      rh = Math.round(h * 0.84)
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

  useEffect(() => {
    if (!open || !imageSource) return

    setRotation(0)
    setFilterMode("enhanced_color")
    setLockRatio(true)

    const img = new Image()
    img.onload = () => {
      const sw = img.width
      const sh = img.height
      setNaturalSize({ w: sw, h: sh })

      const tempCanvas = document.createElement("canvas")
      tempCanvas.width = sw
      tempCanvas.height = sh
      const ctx = tempCanvas.getContext("2d")
      if (ctx) {
        ctx.drawImage(img, 0, 0)
        const detected = detectCardBounds(tempCanvas)
        setCropBox(detected)
      } else {
        setCropBox(getStandardCrop(sw, sh))
      }
    }
    img.src = imageSource
  }, [open, imageSource])

  useEffect(() => {
    if (!open || !imageSource) return

    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const img = new Image()
    img.onload = () => {
      const isRotated = rotation % 180 !== 0
      const sw = isRotated ? img.height : img.width
      const sh = isRotated ? img.width : img.height

      canvas.width = sw
      canvas.height = sh

      ctx.save()
      ctx.translate(sw / 2, sh / 2)
      ctx.rotate((rotation * Math.PI) / 180)
      ctx.drawImage(img, -img.width / 2, -img.height / 2)
      ctx.restore()
    }
    img.src = imageSource
  }, [open, imageSource, rotation])

  const handleRotate = () => {
    const nextRot = (rotation + 90) % 360
    setRotation(nextRot)

    const img = new Image()
    img.onload = () => {
      const isRotated = nextRot % 180 !== 0
      const sw = isRotated ? img.height : img.width
      const sh = isRotated ? img.width : img.height
      setNaturalSize({ w: sw, h: sh })

      const tempCanvas = document.createElement("canvas")
      tempCanvas.width = sw
      tempCanvas.height = sh
      const ctx = tempCanvas.getContext("2d")
      if (ctx) {
        ctx.translate(sw / 2, sh / 2)
        ctx.rotate((nextRot * Math.PI) / 180)
        ctx.drawImage(img, -img.width / 2, -img.height / 2)
        const detected = detectCardBounds(tempCanvas)
        setCropBox(detected)
      } else {
        setCropBox(getStandardCrop(sw, sh))
      }
    }
    img.src = imageSource!
  }

  const handleAutoDetect = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const detected = detectCardBounds(canvas)
    setCropBox(detected)
  }

  const handleStandardCardCrop = () => {
    const canvas = canvasRef.current
    const w = canvas?.width || naturalSize.w
    const h = canvas?.height || naturalSize.h
    if (w && h) {
      setCropBox(getStandardCrop(w, h))
    }
  }

  const handleZoomBox = (factor: number) => {
    if (!cropBox || !canvasRef.current) return
    const cw = canvasRef.current.width
    const ch = canvasRef.current.height

    const nw = Math.round(cropBox.width * factor)
    const nh = lockRatio ? Math.round(nw / ID_CARD_RATIO) : Math.round(cropBox.height * factor)

    if (nw < 80 || nh < 50 || nw > cw || nh > ch) return

    const nx = Math.max(0, Math.min(cw - nw, Math.round(cropBox.x - (nw - cropBox.width) / 2)))
    const ny = Math.max(0, Math.min(ch - nh, Math.round(cropBox.y - (nh - cropBox.height) / 2)))

    setCropBox({
      x: nx,
      y: ny,
      width: nw,
      height: nh,
    })
  }

  const onMouseDownHandle = (handle: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!cropBox) return

    setActiveDrag(handle)
    dragStartPos.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      box: { ...cropBox },
    }
  }

  const onMouseMove = (e: React.MouseEvent) => {
    if (!activeDrag || !cropBox || !containerRef.current || !canvasRef.current) return

    const containerRect = containerRef.current.getBoundingClientRect()
    const scaleX = canvasRef.current.width / containerRect.width
    const scaleY = canvasRef.current.height / containerRect.height

    const deltaX = (e.clientX - dragStartPos.current.mouseX) * scaleX
    const deltaY = (e.clientY - dragStartPos.current.mouseY) * scaleY

    const orig = dragStartPos.current.box
    let { x, y, width, height } = orig
    const minW = 60
    const minH = 40

    if (activeDrag === "move") {
      x = Math.max(0, Math.min(canvasRef.current.width - width, orig.x + deltaX))
      y = Math.max(0, Math.min(canvasRef.current.height - height, orig.y + deltaY))
    } else if (lockRatio) {
      if (activeDrag.includes("e") || activeDrag.includes("s")) {
        const targetW = Math.max(minW, Math.min(canvasRef.current.width - orig.x, orig.width + deltaX))
        width = targetW
        height = Math.round(targetW / ID_CARD_RATIO)
        if (orig.y + height > canvasRef.current.height) {
          height = canvasRef.current.height - orig.y
          width = Math.round(height * ID_CARD_RATIO)
        }
      } else if (activeDrag.includes("w") || activeDrag.includes("n")) {
        const targetW = Math.max(minW, orig.width - deltaX)
        const targetH = Math.round(targetW / ID_CARD_RATIO)
        const newX = orig.x + orig.width - targetW
        const newY = orig.y + orig.height - targetH
        if (newX >= 0 && newY >= 0) {
          x = newX
          y = newY
          width = targetW
          height = targetH
        }
      }
    } else {
      if (activeDrag.includes("w")) {
        const newX = Math.max(0, Math.min(orig.x + orig.width - minW, orig.x + deltaX))
        width = orig.width + (orig.x - newX)
        x = newX
      }
      if (activeDrag.includes("e")) {
        width = Math.max(minW, Math.min(canvasRef.current.width - orig.x, orig.width + deltaX))
      }
      if (activeDrag.includes("n")) {
        const newY = Math.max(0, Math.min(orig.y + orig.height - minH, orig.y + deltaY))
        height = orig.height + (orig.y - newY)
        y = newY
      }
      if (activeDrag.includes("s")) {
        height = Math.max(minH, Math.min(canvasRef.current.height - orig.y, orig.height + deltaY))
      }
    }

    setCropBox({
      x: Math.round(x),
      y: Math.round(y),
      width: Math.round(width),
      height: Math.round(height),
    })
  }

  const onMouseUp = () => {
    setActiveDrag(null)
  }

  const handleSave = async () => {
    if (!imageSource) return
    setIsProcessing(true)

    try {
      const processed = await processIdCardImage(imageSource, {
        cropBox: cropBox || undefined,
        autoDetectBounds: !cropBox,
        filterMode,
        rotation,
      })

      onSave(processed)
      onOpenChange(false)
    } finally {
      setIsProcessing(false)
    }
  }

  const canvasWidth = canvasRef.current?.width || naturalSize.w || 1
  const canvasHeight = canvasRef.current?.height || naturalSize.h || 1

  const cropPct = cropBox
    ? {
        left: `${(cropBox.x / canvasWidth) * 100}%`,
        top: `${(cropBox.y / canvasHeight) * 100}%`,
        width: `${(cropBox.width / canvasWidth) * 100}%`,
        height: `${(cropBox.height / canvasHeight) * 100}%`,
      }
    : { left: "12%", top: "20%", width: "76%", height: "60%" }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl w-[96vw] p-4 sm:p-6 bg-zinc-950 border-zinc-800 text-zinc-100 max-h-[96vh] flex flex-col shadow-2xl">
        <DialogHeader className="pb-2">
          <DialogTitle className="text-base sm:text-lg flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Scan className="h-5 w-5 text-blue-500" />
              {cardTitle} - Akıllı Kırpma & Belge Temizleme
            </span>
            <span className="text-xs font-normal text-zinc-400 hidden sm:inline">
              Mavi çerçeveyi kartın tam sınırlarına yerleştirin
            </span>
          </DialogTitle>
        </DialogHeader>

        {/* TOOLBAR */}
        <div className="flex flex-wrap items-center justify-between gap-2 py-2 border-y border-zinc-800 bg-zinc-900/80 px-3 rounded-xl text-xs">
          <div className="flex flex-wrap items-center gap-1.5">
            <Button
              type="button"
              variant="default"
              size="sm"
              onClick={handleAutoDetect}
              className="h-8 gap-1.5 text-xs bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-sm"
              title="Kenar algılama ile kartı otomatik seç"
            >
              <Sparkles className="h-3.5 w-3.5 text-amber-300" />
              Kartı Otomatik Bul
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleStandardCardCrop}
              className="h-8 gap-1.5 text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border-zinc-700"
              title="Merkezde standart kimlik oranında seç"
            >
              <CreditCard className="h-3.5 w-3.5 text-blue-400" />
              Standart Kimlik Boyutu
            </Button>
            <div className="h-4 w-px bg-zinc-700 mx-1 hidden sm:block" />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleZoomBox(1.05)}
              className="h-8 w-8 p-0 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border-zinc-700"
              title="Çerçeveyi Büyüt (+)"
            >
              <ZoomIn className="h-3.5 w-3.5" />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleZoomBox(0.95)}
              className="h-8 w-8 p-0 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border-zinc-700"
              title="Çerçeveyi Küçült (-)"
            >
              <ZoomOut className="h-3.5 w-3.5" />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setLockRatio(!lockRatio)}
              className={`h-8 gap-1 text-xs border-zinc-700 ${
                lockRatio ? "bg-blue-950/60 text-blue-300 border-blue-700" : "bg-zinc-800 text-zinc-400"
              }`}
              title="Kimlik en/boy oranını sabitle"
            >
              {lockRatio ? <Lock className="h-3.5 w-3.5" /> : <Unlock className="h-3.5 w-3.5" />}
              {lockRatio ? "Oran Sabit (1.58:1)" : "Serbest Oran"}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleRotate}
              className="h-8 gap-1 text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border-zinc-700"
              title="90° Saat Yönünde Döndür"
            >
              <RotateCw className="h-3.5 w-3.5 text-blue-400" />
              90° Döndür
            </Button>
          </div>

          {/* FILTER MODES */}
          <div className="flex items-center gap-1">
            <Label className="text-[11px] text-zinc-400 mr-1 hidden lg:inline">Temizleme Efekti:</Label>
            <Button
              type="button"
              size="sm"
              variant={filterMode === "enhanced_color" ? "default" : "outline"}
              onClick={() => setFilterMode("enhanced_color")}
              className={`h-7 px-2 text-[11px] ${
                filterMode === "enhanced_color"
                  ? "bg-blue-600 hover:bg-blue-700 text-white font-medium"
                  : "bg-zinc-800 text-zinc-300 border-zinc-700"
              }`}
            >
              Renkli Netleştirme
            </Button>
            <Button
              type="button"
              size="sm"
              variant={filterMode === "photocopy_bw" ? "default" : "outline"}
              onClick={() => setFilterMode("photocopy_bw")}
              className={`h-7 px-2 text-[11px] ${
                filterMode === "photocopy_bw"
                  ? "bg-blue-600 hover:bg-blue-700 text-white font-medium"
                  : "bg-zinc-800 text-zinc-300 border-zinc-700"
              }`}
            >
              Fotokopi (S/B)
            </Button>
            <Button
              type="button"
              size="sm"
              variant={filterMode === "original" ? "default" : "outline"}
              onClick={() => setFilterMode("original")}
              className={`h-7 px-2 text-[11px] ${
                filterMode === "original"
                  ? "bg-blue-600 hover:bg-blue-700 text-white font-medium"
                  : "bg-zinc-800 text-zinc-300 border-zinc-700"
              }`}
            >
              Orijinal
            </Button>
          </div>
        </div>

        {/* CROP WORKSPACE */}
        <div
          ref={containerRef}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onMouseLeave={onMouseUp}
          className="relative flex-1 min-h-[380px] max-h-[60vh] bg-zinc-950 rounded-xl overflow-hidden flex items-center justify-center select-none border border-zinc-800 my-2 shadow-inner"
        >
          <canvas
            ref={canvasRef}
            className="max-w-full max-h-[58vh] object-contain block pointer-events-none"
          />

          {/* CROP OVERLAY */}
          {cropBox && (
            <div
              style={{
                position: "absolute",
                left: cropPct.left,
                top: cropPct.top,
                width: cropPct.width,
                height: cropPct.height,
              }}
              className="border-[2.5px] border-blue-400 bg-blue-500/10 shadow-[0_0_0_9999px_rgba(0,0,0,0.72)] cursor-move transition-shadow"
              onMouseDown={(e) => onMouseDownHandle("move", e)}
            >
              {/* CORNER BRACKETS (HIGH-VISIBILITY VIEWFINDER) */}
              <div className="absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 border-white pointer-events-none" />
              <div className="absolute top-0 right-0 w-4 h-4 border-t-4 border-r-4 border-white pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-4 h-4 border-b-4 border-l-4 border-white pointer-events-none" />
              <div className="absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 border-white pointer-events-none" />

              {/* CORNER DRAG HANDLES (BIGGER & EASIER TO GRAB) */}
              <div
                className="absolute -top-3.5 -left-3.5 w-7 h-7 bg-blue-500 border-2 border-white rounded-full cursor-nwse-resize shadow-lg flex items-center justify-center hover:scale-110 transition-transform"
                onMouseDown={(e) => onMouseDownHandle("nw", e)}
              >
                <div className="w-1.5 h-1.5 bg-white rounded-full" />
              </div>
              <div
                className="absolute -top-3.5 -right-3.5 w-7 h-7 bg-blue-500 border-2 border-white rounded-full cursor-nesw-resize shadow-lg flex items-center justify-center hover:scale-110 transition-transform"
                onMouseDown={(e) => onMouseDownHandle("ne", e)}
              >
                <div className="w-1.5 h-1.5 bg-white rounded-full" />
              </div>
              <div
                className="absolute -bottom-3.5 -left-3.5 w-7 h-7 bg-blue-500 border-2 border-white rounded-full cursor-nesw-resize shadow-lg flex items-center justify-center hover:scale-110 transition-transform"
                onMouseDown={(e) => onMouseDownHandle("sw", e)}
              >
                <div className="w-1.5 h-1.5 bg-white rounded-full" />
              </div>
              <div
                className="absolute -bottom-3.5 -right-3.5 w-7 h-7 bg-blue-500 border-2 border-white rounded-full cursor-nwse-resize shadow-lg flex items-center justify-center hover:scale-110 transition-transform"
                onMouseDown={(e) => onMouseDownHandle("se", e)}
              >
                <div className="w-1.5 h-1.5 bg-white rounded-full" />
              </div>

              {/* EDGE HANDLES */}
              <div
                className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-2.5 bg-blue-500 border border-white rounded-full cursor-ns-resize shadow"
                onMouseDown={(e) => onMouseDownHandle("n", e)}
              />
              <div
                className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-8 h-2.5 bg-blue-500 border border-white rounded-full cursor-ns-resize shadow"
                onMouseDown={(e) => onMouseDownHandle("s", e)}
              />
              <div
                className="absolute left-0 top-1/2 -translate-x-1/2 -translate-y-1/2 w-2.5 h-8 bg-blue-500 border border-white rounded-full cursor-ew-resize shadow"
                onMouseDown={(e) => onMouseDownHandle("w", e)}
              />
              <div
                className="absolute right-0 top-1/2 translate-x-1/2 -translate-y-1/2 w-2.5 h-8 bg-blue-500 border border-white rounded-full cursor-ew-resize shadow"
                onMouseDown={(e) => onMouseDownHandle("e", e)}
              />

              {/* CENTER BADGE */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <span className="bg-blue-900/80 text-blue-200 text-[11px] font-semibold px-2.5 py-1 rounded-md backdrop-blur-sm border border-blue-400/40 shadow-sm flex items-center gap-1.5">
                  <CreditCard className="h-3.5 w-3.5" />
                  Kimlik Sınırı
                </span>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex flex-col sm:flex-row items-center justify-between gap-3 w-full pt-2">
          <div className="text-xs text-zinc-400 text-center sm:text-left">
            💡 İpucu: Mavi kutunun ortasından tutarak taşıyabilir, köşelerindeki yuvarlaklardan çekerek kartın tam üstüne oturtabilirsiniz.
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="border-zinc-700 bg-zinc-900 text-zinc-300 hover:bg-zinc-800"
            >
              <X className="h-4 w-4 mr-1" />
              İptal
            </Button>
            <Button
              type="button"
              onClick={handleSave}
              disabled={isProcessing}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-lg shadow-blue-600/25 px-5"
            >
              <Check className="h-4 w-4 mr-1" />
              {isProcessing ? "İşleniyor..." : "Uygula ve Temizle"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
