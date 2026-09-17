"use client"

import React, { useState, useEffect, useRef } from "react"
import {
  RotateCw,
  Sparkles,
  Check,
  X,
  Scan,
  Lock,
  Unlock,
  ZoomIn,
  ZoomOut,
  Maximize2,
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
  detectCardBoundsPct,
  processIdCardImage,
  ID_CARD_RATIO,
  type CropPctBox,
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
  const [cropPct, setCropPct] = useState<CropPctBox>({
    xPct: 14,
    yPct: 20,
    wPct: 72,
    hPct: 46,
  })
  const [isProcessing, setIsProcessing] = useState(false)
  const [imageLoaded, setImageLoaded] = useState(false)

  const imageWrapperRef = useRef<HTMLDivElement>(null)
  const imgRef = useRef<HTMLImageElement>(null)

  const [activeDrag, setActiveDrag] = useState<string | null>(null)
  const dragStartPos = useRef<{
    clientX: number
    clientY: number
    box: CropPctBox
    wrapperWidth: number
    wrapperHeight: number
  }>({
    clientX: 0,
    clientY: 0,
    box: { xPct: 14, yPct: 20, wPct: 72, hPct: 46 },
    wrapperWidth: 1,
    wrapperHeight: 1,
  })

  useEffect(() => {
    if (!open) {
      setImageLoaded(false)
      return
    }
    setRotation(0)
    setFilterMode("enhanced_color")
    setLockRatio(true)
    setCropPct({
      xPct: 14,
      yPct: 20,
      wPct: 72,
      hPct: 46,
    })
  }, [open, imageSource])

  const runAutoDetect = () => {
    if (!imageSource) return
    const img = new Image()
    img.onload = () => {
      const isRotated = rotation % 180 !== 0
      const sw = isRotated ? img.height : img.width
      const sh = isRotated ? img.width : img.height

      const canvas = document.createElement("canvas")
      canvas.width = sw
      canvas.height = sh
      const ctx = canvas.getContext("2d")
      if (ctx) {
        ctx.translate(sw / 2, sh / 2)
        ctx.rotate((rotation * Math.PI) / 180)
        ctx.drawImage(img, -img.width / 2, -img.height / 2)
        const pctBox = detectCardBoundsPct(canvas)
        setCropPct(pctBox)
      }
    }
    img.src = imageSource
  }

  const onImageLoad = () => {
    setImageLoaded(true)
    runAutoDetect()
  }

  const handleRotate = () => {
    const nextRot = (rotation + 90) % 360
    setRotation(nextRot)
    setTimeout(() => {
      runAutoDetect()
    }, 50)
  }

  const handleFullImage = () => {
    setCropPct({
      xPct: 2,
      yPct: 2,
      wPct: 96,
      hPct: 96,
    })
  }

  const handleZoomBox = (factor: number) => {
    const nw = Math.max(15, Math.min(98, cropPct.wPct * factor))
    const nh = lockRatio ? nw / ID_CARD_RATIO : Math.max(10, Math.min(98, cropPct.hPct * factor))

    const nx = Math.max(0, Math.min(100 - nw, cropPct.xPct - (nw - cropPct.wPct) / 2))
    const ny = Math.max(0, Math.min(100 - nh, cropPct.yPct - (nh - cropPct.hPct) / 2))

    setCropPct({
      xPct: Math.round(nx * 10) / 10,
      yPct: Math.round(ny * 10) / 10,
      wPct: Math.round(nw * 10) / 10,
      hPct: Math.round(nh * 10) / 10,
    })
  }

  const onMouseDownHandle = (handle: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!imageWrapperRef.current) return

    const rect = imageWrapperRef.current.getBoundingClientRect()
    setActiveDrag(handle)
    dragStartPos.current = {
      clientX: e.clientX,
      clientY: e.clientY,
      box: { ...cropPct },
      wrapperWidth: rect.width || 1,
      wrapperHeight: rect.height || 1,
    }
  }

  const onMouseMove = (e: React.MouseEvent) => {
    if (!activeDrag || !imageWrapperRef.current) return

    const { clientX, clientY, box, wrapperWidth, wrapperHeight } = dragStartPos.current
    const deltaXPct = ((e.clientX - clientX) / wrapperWidth) * 100
    const deltaYPct = ((e.clientY - clientY) / wrapperHeight) * 100

    let { xPct, yPct, wPct, hPct } = box
    const minW = 15
    const minH = 10

    if (activeDrag === "move") {
      xPct = Math.max(0, Math.min(100 - wPct, box.xPct + deltaXPct))
      yPct = Math.max(0, Math.min(100 - hPct, box.yPct + deltaYPct))
    } else if (lockRatio) {
      if (activeDrag === "se") {
        wPct = Math.max(minW, Math.min(100 - box.xPct, box.wPct + deltaXPct))
        hPct = Math.max(minH, Math.min(100 - box.yPct, wPct / ID_CARD_RATIO))
      } else if (activeDrag === "sw") {
        const targetW = Math.max(minW, Math.min(box.xPct + box.wPct, box.wPct - deltaXPct))
        xPct = box.xPct + box.wPct - targetW
        wPct = targetW
        hPct = Math.max(minH, Math.min(100 - box.yPct, wPct / ID_CARD_RATIO))
      } else if (activeDrag === "ne") {
        wPct = Math.max(minW, Math.min(100 - box.xPct, box.wPct + deltaXPct))
        const targetH = Math.max(minH, wPct / ID_CARD_RATIO)
        yPct = Math.max(0, box.yPct + box.hPct - targetH)
        hPct = targetH
      } else if (activeDrag === "nw") {
        const targetW = Math.max(minW, Math.min(box.xPct + box.wPct, box.wPct - deltaXPct))
        const targetH = Math.max(minH, targetW / ID_CARD_RATIO)
        xPct = Math.max(0, box.xPct + box.wPct - targetW)
        yPct = Math.max(0, box.yPct + box.hPct - targetH)
        wPct = targetW
        hPct = targetH
      }
    } else {
      if (activeDrag.includes("w")) {
        const newX = Math.max(0, Math.min(box.xPct + box.wPct - minW, box.xPct + deltaXPct))
        wPct = box.wPct + (box.xPct - newX)
        xPct = newX
      }
      if (activeDrag.includes("e")) {
        wPct = Math.max(minW, Math.min(100 - box.xPct, box.wPct + deltaXPct))
      }
      if (activeDrag.includes("n")) {
        const newY = Math.max(0, Math.min(box.yPct + box.hPct - minH, box.yPct + deltaYPct))
        hPct = box.hPct + (box.yPct - newY)
        yPct = newY
      }
      if (activeDrag.includes("s")) {
        hPct = Math.max(minH, Math.min(100 - box.yPct, box.hPct + deltaYPct))
      }
    }

    setCropPct({
      xPct: Math.round(xPct * 10) / 10,
      yPct: Math.round(yPct * 10) / 10,
      wPct: Math.round(wPct * 10) / 10,
      hPct: Math.round(hPct * 10) / 10,
    })
  }

  const onMouseUp = () => {
    setActiveDrag(null)
  }

  const getLiveFilterStyle = () => {
    if (filterMode === "photocopy_bw") {
      return "grayscale(100%) contrast(350%) brightness(120%)"
    }
    if (filterMode === "enhanced_color") {
      return "contrast(155%) brightness(115%) saturate(125%)"
    }
    return "none"
  }

  const handleSave = async () => {
    if (!imageSource) return
    setIsProcessing(true)

    try {
      const processed = await processIdCardImage(imageSource, {
        cropPct,
        filterMode,
        rotation,
      })

      onSave(processed)
      onOpenChange(false)
    } finally {
      setIsProcessing(false)
    }
  }

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
              onClick={runAutoDetect}
              className="h-8 gap-1.5 text-xs bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-sm"
              title="Kenar algılama ile kartı otomatik seç"
            >
              <Sparkles className="h-3.5 w-3.5 text-amber-300" />
              Kartı Otomatik Bul
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleFullImage}
              className="h-8 gap-1 text-xs text-zinc-400 hover:text-zinc-200"
              title="Tüm görseli seç"
            >
              <Maximize2 className="h-3.5 w-3.5" />
              Tam Görsel
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
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onMouseLeave={onMouseUp}
          className="relative flex-1 min-h-[380px] max-h-[62vh] bg-zinc-950 rounded-xl overflow-hidden flex items-center justify-center p-3 select-none border border-zinc-800 my-2 shadow-inner"
        >
          {imageSource ? (
            <div
              ref={imageWrapperRef}
              className="relative inline-block select-none shadow-2xl rounded"
              style={{ lineHeight: 0 }}
            >
              {/* IMAGE (ALWAYS VISIBLE, NO CANVAS GLITCHES) */}
              <img
                ref={imgRef}
                src={imageSource}
                alt={cardTitle}
                style={{
                  transform: `rotate(${rotation}deg)`,
                  filter: getLiveFilterStyle(),
                  maxHeight: "56vh",
                  maxWidth: "100%",
                  objectFit: "contain",
                  transition: "filter 0.15s ease",
                }}
                className="block pointer-events-none rounded"
                onLoad={onImageLoad}
              />

              {/* CROP OVERLAY (POSITIONED ACCURATELY OVER THE IMAGE) */}
              <div
                style={{
                  position: "absolute",
                  left: `${cropPct.xPct}%`,
                  top: `${cropPct.yPct}%`,
                  width: `${cropPct.wPct}%`,
                  height: `${cropPct.hPct}%`,
                }}
                className="border-[2.5px] border-blue-400 bg-blue-500/15 shadow-[0_0_0_9999px_rgba(0,0,0,0.72)] cursor-move transition-shadow"
                onMouseDown={(e) => onMouseDownHandle("move", e)}
              >
                {/* CORNER BRACKETS */}
                <div className="absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 border-white pointer-events-none" />
                <div className="absolute top-0 right-0 w-4 h-4 border-t-4 border-r-4 border-white pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-4 h-4 border-b-4 border-l-4 border-white pointer-events-none" />
                <div className="absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 border-white pointer-events-none" />

                {/* CORNER HANDLES */}
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

                {/* EDGE HANDLES (WHEN FREE RATIO) */}
                {!lockRatio && (
                  <>
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
                  </>
                )}

                {/* CENTER BADGE */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <span className="bg-blue-900/80 text-blue-200 text-[11px] font-semibold px-2.5 py-1 rounded-md backdrop-blur-sm border border-blue-400/40 shadow-sm flex items-center gap-1.5">
                    <Scan className="h-3.5 w-3.5" />
                    Kimlik Sınırı
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-sm text-zinc-500">Görsel yüklenmedi</div>
          )}
        </div>

        <DialogFooter className="flex flex-col sm:flex-row items-center justify-between gap-3 w-full pt-2">
          <div className="text-xs text-zinc-400 text-center sm:text-left">
            💡 İpucu: Mavi çerçevenin ortasından tutarak sürükleyebilir, köşelerindeki yuvarlaklardan çekerek kartın tam üstüne oturtabilirsiniz.
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
