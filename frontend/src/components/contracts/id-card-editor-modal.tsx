"use client"

import React, { useState, useEffect, useRef } from "react"
import {
  RotateCw,
  Sparkles,
  Crop,
  Check,
  X,
  Maximize2,
  Scan,
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

  useEffect(() => {
    if (!open || !imageSource) return

    setRotation(0)
    setFilterMode("enhanced_color")

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

  const handleResetCrop = () => {
    if (naturalSize.w && naturalSize.h) {
      setCropBox({
        x: 0,
        y: 0,
        width: naturalSize.w,
        height: naturalSize.h,
      })
    }
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
    const minSize = 40

    if (activeDrag === "move") {
      x = Math.max(0, Math.min(canvasRef.current.width - width, orig.x + deltaX))
      y = Math.max(0, Math.min(canvasRef.current.height - height, orig.y + deltaY))
    } else {
      if (activeDrag.includes("w")) {
        const newX = Math.max(0, Math.min(orig.x + orig.width - minSize, orig.x + deltaX))
        width = orig.width + (orig.x - newX)
        x = newX
      }
      if (activeDrag.includes("e")) {
        width = Math.max(minSize, Math.min(canvasRef.current.width - orig.x, orig.width + deltaX))
      }
      if (activeDrag.includes("n")) {
        const newY = Math.max(0, Math.min(orig.y + orig.height - minSize, orig.y + deltaY))
        height = orig.height + (orig.y - newY)
        y = newY
      }
      if (activeDrag.includes("s")) {
        height = Math.max(minSize, Math.min(canvasRef.current.height - orig.y, orig.height + deltaY))
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
    : { left: "5%", top: "5%", width: "90%", height: "90%" }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl w-[95vw] p-4 sm:p-6 bg-zinc-950 border-zinc-800 text-zinc-100 max-h-[95vh] flex flex-col">
        <DialogHeader className="pb-2">
          <DialogTitle className="text-base sm:text-lg flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Scan className="h-5 w-5 text-blue-500" />
              {cardTitle} - Akıllı Kırpma & Temizleme
            </span>
          </DialogTitle>
        </DialogHeader>

        {/* TOOLBAR */}
        <div className="flex flex-wrap items-center justify-between gap-2 py-2 border-y border-zinc-800 bg-zinc-900/60 px-3 rounded-lg text-xs">
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAutoDetect}
              className="h-8 gap-1.5 text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border-zinc-700"
            >
              <Sparkles className="h-3.5 w-3.5 text-amber-400" />
              Kartı Otomatik Bul
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleRotate}
              className="h-8 gap-1.5 text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border-zinc-700"
            >
              <RotateCw className="h-3.5 w-3.5 text-blue-400" />
              90° Döndür
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleResetCrop}
              className="h-8 gap-1 text-xs text-zinc-400 hover:text-zinc-200"
            >
              <Maximize2 className="h-3.5 w-3.5" />
              Sıfırla
            </Button>
          </div>

          {/* FILTER MODES */}
          <div className="flex items-center gap-1">
            <Label className="text-[11px] text-zinc-400 mr-1 hidden sm:inline">Efekt:</Label>
            <Button
              type="button"
              size="sm"
              variant={filterMode === "enhanced_color" ? "default" : "outline"}
              onClick={() => setFilterMode("enhanced_color")}
              className={`h-7 px-2 text-[11px] ${
                filterMode === "enhanced_color"
                  ? "bg-blue-600 hover:bg-blue-700 text-white"
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
                  ? "bg-blue-600 hover:bg-blue-700 text-white"
                  : "bg-zinc-800 text-zinc-300 border-zinc-700"
              }`}
            >
              Fotokopi (S/B)
            </Button>
            <Button
              type="button"
              size="sm"
              variant={filterMode === "grayscale" ? "default" : "outline"}
              onClick={() => setFilterMode("grayscale")}
              className={`h-7 px-2 text-[11px] ${
                filterMode === "grayscale"
                  ? "bg-blue-600 hover:bg-blue-700 text-white"
                  : "bg-zinc-800 text-zinc-300 border-zinc-700"
              }`}
            >
              Gri Ton
            </Button>
            <Button
              type="button"
              size="sm"
              variant={filterMode === "original" ? "default" : "outline"}
              onClick={() => setFilterMode("original")}
              className={`h-7 px-2 text-[11px] ${
                filterMode === "original"
                  ? "bg-blue-600 hover:bg-blue-700 text-white"
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
          className="relative flex-1 min-h-[360px] max-h-[58vh] bg-black/80 rounded-xl overflow-hidden flex items-center justify-center select-none border border-zinc-800 my-2"
        >
          <canvas
            ref={canvasRef}
            className="max-w-full max-h-[56vh] object-contain block pointer-events-none"
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
              className="border-2 border-blue-400 bg-blue-500/10 shadow-[0_0_0_9999px_rgba(0,0,0,0.65)] cursor-move transition-shadow"
              onMouseDown={(e) => onMouseDownHandle("move", e)}
            >
              {/* CORNER HANDLES */}
              <div
                className="absolute -top-2 -left-2 w-4 h-4 bg-blue-500 border-2 border-white rounded-full cursor-nwse-resize shadow"
                onMouseDown={(e) => onMouseDownHandle("nw", e)}
              />
              <div
                className="absolute -top-2 -right-2 w-4 h-4 bg-blue-500 border-2 border-white rounded-full cursor-nesw-resize shadow"
                onMouseDown={(e) => onMouseDownHandle("ne", e)}
              />
              <div
                className="absolute -bottom-2 -left-2 w-4 h-4 bg-blue-500 border-2 border-white rounded-full cursor-nesw-resize shadow"
                onMouseDown={(e) => onMouseDownHandle("sw", e)}
              />
              <div
                className="absolute -bottom-2 -right-2 w-4 h-4 bg-blue-500 border-2 border-white rounded-full cursor-nwse-resize shadow"
                onMouseDown={(e) => onMouseDownHandle("se", e)}
              />

              {/* EDGE HANDLES */}
              <div
                className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-2 bg-blue-500 rounded-full cursor-ns-resize"
                onMouseDown={(e) => onMouseDownHandle("n", e)}
              />
              <div
                className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-6 h-2 bg-blue-500 rounded-full cursor-ns-resize"
                onMouseDown={(e) => onMouseDownHandle("s", e)}
              />
              <div
                className="absolute left-0 top-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-6 bg-blue-500 rounded-full cursor-ew-resize"
                onMouseDown={(e) => onMouseDownHandle("w", e)}
              />
              <div
                className="absolute right-0 top-1/2 translate-x-1/2 -translate-y-1/2 w-2 h-6 bg-blue-500 rounded-full cursor-ew-resize"
                onMouseDown={(e) => onMouseDownHandle("e", e)}
              />

              {/* CENTER GUIDE */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <span className="bg-black/70 text-blue-300 text-[10px] font-semibold px-2 py-0.5 rounded backdrop-blur-sm border border-blue-500/30">
                  Kimlik Alanı
                </span>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex items-center justify-between sm:justify-between w-full pt-2">
          <p className="text-xs text-zinc-400 hidden sm:block">
            Mavi çerçevenin kenarlarını sürükleyerek masayı dışarıda bırakabilirsiniz.
          </p>
          <div className="flex items-center gap-2">
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
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-md shadow-blue-600/30"
            >
              <Check className="h-4 w-4 mr-1" />
              {isProcessing ? "İşleniyor..." : "Uygula ve Kaydet"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
