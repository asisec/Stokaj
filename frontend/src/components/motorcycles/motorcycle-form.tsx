"use client";

import { useState, useEffect, useRef } from "react";
import { api, type Motorcycle } from "@/lib/api";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CurrencyInput } from "@/components/ui/currency-input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import { validateVIN } from "@/lib/vin-validator";

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

const SUGGESTED_BRANDS = ["LEKSAS", "APACHI", "REBAT", "ZLIN", "ARORA", "LYM"];

function getBrandSuggestion(input: string): string | null {
  if (!input) return null;
  const upperInput = input.toUpperCase();
  for (const brand of SUGGESTED_BRANDS) {
    if (brand.startsWith(upperInput) && brand !== upperInput) {
      return brand;
    }
  }
  return null;
}

export function MotorcycleForm({
  open,
  onOpenChange,
  motorcycle,
  onSuccess,
}: MotorcycleFormProps) {
  const [formData, setFormData] = useState(initialFormState);
  const [submitting, setSubmitting] = useState(false);

  const wasEditing = useRef(false);

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
      wasEditing.current = true;
    } else {
      if (wasEditing.current) {
        setFormData(initialFormState);
        wasEditing.current = false;
      }
    }
  }, [motorcycle]);

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
    if (["chassis_number", "brand", "model", "color"].includes(field) && typeof value === "string") {
      value = value.toLocaleUpperCase("tr-TR");
    }
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const vinValidation = validateVIN(formData.chassis_number);
  const suggestedBrand = getBrandSuggestion(formData.brand);

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
              className={`bg-zinc-900/50 text-zinc-200 transition-colors focus:border-blue-500/50 ${
                formData.chassis_number.length > 0
                  ? vinValidation.status === "valid"
                    ? "border-green-500/50 focus:border-green-500/50"
                    : vinValidation.status === "partial"
                    ? "border-blue-500/50 focus:border-blue-500/50"
                    : "border-red-500/50 focus:border-red-500/50"
                  : "border-zinc-800"
              }`}
              required
              maxLength={17}
            />
            {formData.chassis_number.length > 0 && (
              <div
                className={`flex items-center gap-1.5 text-xs mt-1.5 ${
                  vinValidation.status === "valid"
                    ? "text-green-500"
                    : vinValidation.status === "partial"
                    ? "text-blue-500"
                    : "text-red-500"
                }`}
              >
                {vinValidation.status === "valid" ? (
                  <CheckCircle2 className="h-3.5 w-3.5" />
                ) : vinValidation.status === "partial" ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <XCircle className="h-3.5 w-3.5" />
                )}
                <span>{vinValidation.message}</span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="brand" className="text-zinc-400 text-sm">
                Marka
              </Label>
              <div className="relative flex items-center">
                <Input
                  id="brand"
                  value={formData.brand}
                  onChange={(e) => handleChange("brand", e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Tab" && suggestedBrand) {
                      e.preventDefault();
                      handleChange("brand", suggestedBrand);
                    }
                  }}
                  className="bg-zinc-900/50 border-zinc-800 text-zinc-200 focus:border-blue-500/50 transition-colors"
                  required
                />
                {suggestedBrand && (
                  <div className="absolute inset-0 pointer-events-none flex items-center px-3 text-sm border border-transparent">
                    <span className="text-transparent">{formData.brand}</span>
                    <span className="text-zinc-500/50">{suggestedBrand.slice(formData.brand.length)}</span>
                  </div>
                )}
              </div>
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
            <CurrencyInput
              id="purchase_price"
              value={formData.purchase_price}
              onChange={(val) => handleChange("purchase_price", val)}
              className="bg-zinc-900/50 border-zinc-800 text-zinc-200 focus:border-blue-500/50 transition-colors"
              required
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setFormData(initialFormState);
                onOpenChange(false);
              }}
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
