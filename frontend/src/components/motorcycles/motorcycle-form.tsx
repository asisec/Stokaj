"use client";

import { useState, useEffect } from "react";
import { api, type Motorcycle } from "@/lib/api";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface MotorcycleFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  motorcycle: Motorcycle | null;
  onSuccess: () => void;
}

const initialFormState = {
  chassis_number: "",
  brand: "",
  model: "",
  year: new Date().getFullYear(),
  color: "",
  purchase_price: 0,
};

export function MotorcycleForm({
  open,
  onOpenChange,
  motorcycle,
  onSuccess,
}: MotorcycleFormProps) {
  const [formData, setFormData] = useState(initialFormState);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (motorcycle) {
      setFormData({
        chassis_number: motorcycle.chassis_number,
        brand: motorcycle.brand,
        model: motorcycle.model,
        year: motorcycle.year,
        color: motorcycle.color,
        purchase_price: motorcycle.purchase_price,
      });
    } else {
      setFormData(initialFormState);
    }
  }, [motorcycle, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (motorcycle) {
        await api.updateMotorcycle(motorcycle.id, formData);
        toast.success("Motosiklet başarıyla güncellendi");
      } else {
        await api.createMotorcycle(formData);
        toast.success("Motosiklet başarıyla eklendi");
      }
      setFormData(initialFormState);
      onOpenChange(false);
      onSuccess();
    } catch {
      toast.error(
        motorcycle
          ? "Motosiklet güncellenirken hata oluştu"
          : "Motosiklet eklenirken hata oluştu"
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (field: string, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-zinc-950 border-zinc-800 text-zinc-100 sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-zinc-100">
            {motorcycle ? "Motosiklet Düzenle" : "Yeni Motosiklet Ekle"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-5 mt-2">
          <div className="space-y-2">
            <Label htmlFor="chassis_number" className="text-zinc-400 text-sm">
              Şasi Numarası
            </Label>
            <Input
              id="chassis_number"
              value={formData.chassis_number}
              onChange={(e) => handleChange("chassis_number", e.target.value)}
              className="bg-zinc-900/50 border-zinc-800 text-zinc-200 focus:border-blue-500/50 transition-colors"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="brand" className="text-zinc-400 text-sm">
                Marka
              </Label>
              <Input
                id="brand"
                value={formData.brand}
                onChange={(e) => handleChange("brand", e.target.value)}
                className="bg-zinc-900/50 border-zinc-800 text-zinc-200 focus:border-blue-500/50 transition-colors"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="model" className="text-zinc-400 text-sm">
                Model
              </Label>
              <Input
                id="model"
                value={formData.model}
                onChange={(e) => handleChange("model", e.target.value)}
                className="bg-zinc-900/50 border-zinc-800 text-zinc-200 focus:border-blue-500/50 transition-colors"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="year" className="text-zinc-400 text-sm">
                Yıl
              </Label>
              <Input
                id="year"
                type="number"
                value={formData.year}
                onChange={(e) =>
                  handleChange("year", parseInt(e.target.value) || 0)
                }
                className="bg-zinc-900/50 border-zinc-800 text-zinc-200 focus:border-blue-500/50 transition-colors"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="color" className="text-zinc-400 text-sm">
                Renk
              </Label>
              <Input
                id="color"
                value={formData.color}
                onChange={(e) => handleChange("color", e.target.value)}
                className="bg-zinc-900/50 border-zinc-800 text-zinc-200 focus:border-blue-500/50 transition-colors"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="purchase_price"
              className="text-zinc-400 text-sm"
            >
              Alış Fiyatı (₺)
            </Label>
            <Input
              id="purchase_price"
              type="number"
              step="0.01"
              min="0"
              value={formData.purchase_price}
              onChange={(e) =>
                handleChange(
                  "purchase_price",
                  parseFloat(e.target.value) || 0
                )
              }
              className="bg-zinc-900/50 border-zinc-800 text-zinc-200 focus:border-blue-500/50 transition-colors"
              required
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
              className="bg-blue-600 hover:bg-blue-700 text-white min-w-[100px] transition-all duration-200"
            >
              {submitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : motorcycle ? (
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
