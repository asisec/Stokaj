"use client";

import { useState, useEffect } from "react";
import { api, type RegistrationDocument, type DocumentStatus } from "@/lib/api";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { customToast as toast } from "@/lib/toast";
import { FileCheck2, Loader2, Bike, User, Shield, Calendar, Hash, FileText } from "lucide-react";

interface DocumentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  document: RegistrationDocument | null;
  onSuccess: () => void;
}

export function DocumentModal({
  open,
  onOpenChange,
  document,
  onSuccess,
}: DocumentModalProps) {
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    plate_number: "",
    registration_serial: "",
    notary_name: "",
    notary_doc_no: "",
    notary_date: "",
    has_insurance: false,
    status: "notary_pending" as DocumentStatus,
    notes: "",
  });

  useEffect(() => {
    if (document) {
      setFormData({
        plate_number: document.plate_number || "",
        registration_serial: document.registration_serial || "",
        notary_name: document.notary_name || "",
        notary_doc_no: document.notary_doc_no || "",
        notary_date: document.notary_date ? document.notary_date.split("T")[0] : "",
        has_insurance: document.has_insurance || false,
        status: document.status || "notary_pending",
        notes: document.notes || "",
      });
    }
  }, [document]);

  if (!document) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.updateDocument(document.id, {
        plate_number: formData.plate_number.toUpperCase().trim(),
        registration_serial: formData.registration_serial.toUpperCase().trim(),
        notary_name: formData.notary_name.trim(),
        notary_doc_no: formData.notary_doc_no.trim(),
        notary_date: formData.notary_date || null,
        has_insurance: formData.has_insurance,
        status: formData.status,
        notes: formData.notes.trim(),
      });
      toast.success("Evrak kaydı güncellendi");
      onOpenChange(false);
      onSuccess();
    } catch {
      toast.error("Evrak güncellenirken hata oluştu");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[620px] bg-zinc-950/95 border-zinc-800/80 backdrop-blur-2xl p-6 rounded-3xl shadow-2xl max-h-[90vh] overflow-y-auto custom-scrollbar">
        <DialogHeader className="pb-4 border-b border-zinc-800/60">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <FileCheck2 className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold text-zinc-100">
                Evrak & Noter İşlemi Düzenle
              </DialogTitle>
              <p className="text-xs text-zinc-500 mt-0.5">
                Plaka, noter, ruhsat ve teslimat bilgilerini güncelleyin
              </p>
            </div>
          </div>
        </DialogHeader>

        {/* Motosiklet & Müşteri Özet Kartı */}
        <div className="grid grid-cols-2 gap-3 p-3.5 rounded-2xl bg-zinc-900/60 border border-zinc-800/60 text-xs">
          <div className="flex items-start gap-2.5">
            <Bike className="h-4 w-4 text-blue-400 mt-0.5 shrink-0" />
            <div className="min-w-0">
              <span className="font-semibold text-zinc-200 block truncate">
                {document.motorcycle ? `${document.motorcycle.brand} ${document.motorcycle.model}` : "Motosiklet"}
              </span>
              <span className="font-mono text-zinc-500 block truncate">
                {document.motorcycle?.chassis_number || "-"}
              </span>
            </div>
          </div>
          <div className="flex items-start gap-2.5 border-l border-zinc-800/80 pl-3">
            <User className="h-4 w-4 text-emerald-400 mt-0.5 shrink-0" />
            <div className="min-w-0">
              <span className="font-semibold text-zinc-200 block truncate">
                {document.customer ? `${document.customer.first_name} ${document.customer.last_name}` : "Müşteri"}
              </span>
              <span className="text-zinc-500 block truncate">
                {document.customer?.phone || "-"}
              </span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          {/* Durum Seçimi */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">
              İşlem Aşaması / Durumu
            </Label>
            <Select
              value={formData.status}
              onValueChange={(val: DocumentStatus) => setFormData((prev) => ({ ...prev, status: val }))}
            >
              <SelectTrigger className="h-11 bg-zinc-900/50 border-zinc-800 rounded-xl text-zinc-200 text-sm focus:border-blue-500">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-zinc-900 border-zinc-800 rounded-xl">
                <SelectItem value="notary_pending" className="text-amber-400 focus:bg-zinc-800">
                  🟡 Noter Bekliyor
                </SelectItem>
                <SelectItem value="plate_pending" className="text-blue-400 focus:bg-zinc-800">
                  🔵 Ruhsat & Plaka Sürecinde
                </SelectItem>
                <SelectItem value="ready_for_delivery" className="text-purple-400 focus:bg-zinc-800">
                  🟣 Teslimata Hazır
                </SelectItem>
                <SelectItem value="delivered" className="text-emerald-400 focus:bg-zinc-800">
                  🟢 Teslim Edildi
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Plaka ve Ruhsat Bilgileri */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs font-medium text-zinc-400">Plaka No</Label>
              <Input
                placeholder="Örn: 34 ABC 123"
                value={formData.plate_number}
                onChange={(e) => setFormData((prev) => ({ ...prev, plate_number: e.target.value }))}
                className="h-10 bg-zinc-900/50 border-zinc-800 rounded-xl uppercase font-mono tracking-wider text-zinc-200 focus:border-blue-500"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-medium text-zinc-400">Ruhsat Belge Seri No</Label>
              <Input
                placeholder="Örn: AA123456"
                value={formData.registration_serial}
                onChange={(e) => setFormData((prev) => ({ ...prev, registration_serial: e.target.value }))}
                className="h-10 bg-zinc-900/50 border-zinc-800 rounded-xl uppercase font-mono tracking-wider text-zinc-200 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Noter Bilgileri */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-2 sm:col-span-2">
              <Label className="text-xs font-medium text-zinc-400">Noterlik Adı</Label>
              <Input
                placeholder="Örn: Kadıköy 5. Noterliği"
                value={formData.notary_name}
                onChange={(e) => setFormData((prev) => ({ ...prev, notary_name: e.target.value }))}
                className="h-10 bg-zinc-900/50 border-zinc-800 rounded-xl text-zinc-200 focus:border-blue-500"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-medium text-zinc-400">Yevmiye / Belge No</Label>
              <Input
                placeholder="Örn: 14890"
                value={formData.notary_doc_no}
                onChange={(e) => setFormData((prev) => ({ ...prev, notary_doc_no: e.target.value }))}
                className="h-10 bg-zinc-900/50 border-zinc-800 rounded-xl text-zinc-200 focus:border-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
            <div className="space-y-2">
              <Label className="text-xs font-medium text-zinc-400">Noter Satış Tarihi</Label>
              <Input
                type="date"
                value={formData.notary_date}
                onChange={(e) => setFormData((prev) => ({ ...prev, notary_date: e.target.value }))}
                className="h-10 bg-zinc-900/50 border-zinc-800 rounded-xl text-zinc-200 focus:border-blue-500"
              />
            </div>
            <div className="flex items-center gap-3 pt-6">
              <Checkbox
                id="has_insurance"
                checked={formData.has_insurance}
                onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, has_insurance: !!checked }))}
                className="border-zinc-700 data-[state=checked]:bg-emerald-600"
              />
              <Label htmlFor="has_insurance" className="text-xs font-medium text-zinc-300 cursor-pointer">
                Zorunlu Trafik Sigortası Yapıldı
              </Label>
            </div>
          </div>

          {/* Notlar */}
          <div className="space-y-2">
            <Label className="text-xs font-medium text-zinc-400">Operasyonel Notlar</Label>
            <Input
              placeholder="Örn: Yedek anahtar teslim edildi, vekaletname alındı..."
              value={formData.notes}
              onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
              className="h-10 bg-zinc-900/50 border-zinc-800 rounded-xl text-zinc-200 focus:border-blue-500"
            />
          </div>

          <DialogFooter className="gap-2 pt-3 border-t border-zinc-800/60">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="h-10 border-zinc-800 bg-zinc-900 text-zinc-300 hover:bg-zinc-800 rounded-xl"
            >
              İptal
            </Button>
            <Button
              type="submit"
              disabled={submitting}
              className="h-10 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl px-6 transition-all"
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Kaydet & Güncelle
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
