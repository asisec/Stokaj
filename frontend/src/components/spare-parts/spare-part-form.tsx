"use client";

import { useState, useEffect } from "react";
import { api, type SparePart } from "@/lib/api";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface SparePartFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sparePart: SparePart | null;
  onSuccess: () => void;
}

const initialFormState = {
  name: "",
  quantity: 0,
  description: "",
  is_defective: false,
};

export function SparePartForm({
  open,
  onOpenChange,
  sparePart,
  onSuccess,
}: SparePartFormProps) {
  const [formData, setFormData] = useState(initialFormState);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (sparePart) {
      setFormData({
        name: sparePart.name,
        quantity: sparePart.quantity,
        description: sparePart.description || "",
        is_defective: sparePart.is_defective || false,
      });
    } else {
      setFormData(initialFormState);
    }
  }, [sparePart, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (sparePart) {
        await api.updateSparePart(sparePart.id, formData);
        toast.success("Parça başarıyla güncellendi");
      } else {
        await api.createSparePart(formData);
        toast.success("Parça başarıyla eklendi");
      }
      setFormData(initialFormState);
      onOpenChange(false);
      onSuccess();
    } catch {
      toast.error(
        sparePart
          ? "Parça güncellenirken hata oluştu"
          : "Parça eklenirken hata oluştu"
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (field: string, value: string | number | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-zinc-950 border-zinc-800 text-zinc-100 sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-zinc-100">
            {sparePart ? "Parça Düzenle" : "Yeni Parça Ekle"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-5 mt-2">
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2 space-y-2">
              <Label htmlFor="name" className="text-zinc-400 text-sm">
                Parça Adı
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleChange("name", e.target.value)}
                className="bg-zinc-900/50 border-zinc-800 text-zinc-200 focus:border-emerald-500/50 transition-colors"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="quantity" className="text-zinc-400 text-sm">
                Stok Adedi
              </Label>
              <Input
                id="quantity"
                type="number"
                min="0"
                value={formData.quantity}
                onChange={(e) =>
                  handleChange("quantity", parseInt(e.target.value) || 0)
                }
                className="bg-zinc-900/50 border-zinc-800 text-zinc-200 focus:border-emerald-500/50 transition-colors"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="is_defective" className="text-zinc-400 text-sm">
              Durum
            </Label>
            <Select
              value={formData.is_defective ? "defective" : "good"}
              onValueChange={(val) =>
                handleChange("is_defective", val === "defective")
              }
            >
              <SelectTrigger className="bg-zinc-900/50 border-zinc-800 text-zinc-200 focus:border-emerald-500/50">
                <SelectValue placeholder="Parça Durumu" />
              </SelectTrigger>
              <SelectContent className="bg-zinc-950 border-zinc-800 text-zinc-200">
                <SelectItem value="good">Sağlam / Çalışıyor</SelectItem>
                <SelectItem value="defective">Bozuk / Hasarlı</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="text-zinc-400 text-sm">
              Açıklama
            </Label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleChange("description", e.target.value)}
              rows={4}
              className="flex w-full rounded-md border border-zinc-800 bg-zinc-900/50 px-3 py-2 text-sm text-zinc-200 placeholder:text-zinc-600 focus:border-emerald-500/50 focus:outline-none focus:ring-1 focus:ring-emerald-500/30 transition-colors resize-none"
              placeholder="Yedek parça detayları..."
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800"
            >
              İptal
            </Button>
            <Button
              type="submit"
              disabled={submitting}
              className="bg-emerald-600 hover:bg-emerald-700 text-white min-w-[100px] transition-all duration-200"
            >
              {submitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : sparePart ? (
                "Güncelle"
              ) : (
                "Ekle"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
