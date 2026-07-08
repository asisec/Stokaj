"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { QRCodeSVG } from "qrcode.react";
import { type Motorcycle } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { useEffect, useState } from "react";

interface QRCodeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  motorcycle: Motorcycle | null;
}

export function QRCodeModal({ open, onOpenChange, motorcycle }: QRCodeModalProps) {
  const [qrUrl, setQrUrl] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined" && motorcycle) {
      setQrUrl(`${window.location.origin}/m/${motorcycle.chassis_number}`);
    }
  }, [motorcycle]);

  if (!motorcycle) return null;

  const handleDownload = () => {
    const svg = document.getElementById("motorcycle-qr-code");
    if (!svg) return;
    
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();
    
    img.onload = () => {
      // Add padding and white background
      canvas.width = img.width + 40;
      canvas.height = img.height + 40;
      if (ctx) {
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 20, 20);
      }
      
      const pngFile = canvas.toDataURL("image/png");
      const downloadLink = document.createElement("a");
      downloadLink.download = `QR-${motorcycle.chassis_number}.png`;
      downloadLink.href = `${pngFile}`;
      downloadLink.click();
    };
    img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-zinc-950 border-zinc-800 text-zinc-100 sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-center text-zinc-100">
            {motorcycle.brand} {motorcycle.model}
          </DialogTitle>
          <p className="text-center text-zinc-400 font-mono text-sm mt-1">{motorcycle.chassis_number}</p>
        </DialogHeader>

        <div className="flex flex-col items-center justify-center py-6 space-y-6">
          <div className="bg-white p-4 rounded-xl shadow-lg">
            <QRCodeSVG
              id="motorcycle-qr-code"
              value={qrUrl}
              size={200}
              level="H"
              includeMargin={false}
              fgColor="#000000"
              bgColor="#ffffff"
            />
          </div>

          <Button 
            onClick={handleDownload}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white gap-2 transition-all duration-200"
          >
            <Download className="h-4 w-4" />
            QR Kodu İndir
          </Button>
          
          <p className="text-xs text-zinc-500 text-center px-4">
            Bu QR kodu telefonunuzla okutarak aracın detaylı mobil sayfasına ulaşabilirsiniz.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
