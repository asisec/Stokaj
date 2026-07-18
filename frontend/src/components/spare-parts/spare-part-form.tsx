"use client";

import { useState, useEffect, useRef } from "react";
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
import { customToast as toast } from "@/lib/toast";
import { Loader2 } from "lucide-react";

interface SparePartFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sparePart: SparePart | null;
  onSuccess: () => void;
}

const CATEGORIES = [
  "Akü",
  "Far",
  "Tablet",
  "Silecek",
  "Şarj Makinesi",
  "Motor Kabini",
  "Fren Balatası",
  "Lastik",
  "Diğer",
];

const initialFormState = {
  category: "Diğer",
  name: "",
  compatible_brand: "",
  compatible_model: "",
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
  const [uniqueBrands, setUniqueBrands] = useState<string[]>([]);
  const [uniqueModels, setUniqueModels] = useState<string[]>([]);

  const getSuggestion = (input: string, list: string[]) => {
    if (!input) return "";
    const match = list.find((item) => item.toUpperCase().startsWith(input.toUpperCase()));
    return match || "";
  };

  const suggestedBrand = getSuggestion(formData.compatible_brand, uniqueBrands);
  const suggestedModel = getSuggestion(formData.compatible_model, uniqueModels);

  const wasEditing = useRef(false);

  useEffect(() => {
    if (open) {
      api.getMotorcycles().then((motos) => {
        const brands = Array.from(new Set(motos.map((m) => m.brand))).filter(Boolean);
        const models = Array.from(new Set(motos.map((m) => m.model))).filter(Boolean);
        setUniqueBrands(brands);
        setUniqueModels(models);
      }).catch(() => {});
    }
  }, [open]);

  useEffect(() => {
    if (sparePart) {
      setFormData({
        category: sparePart.category || "Diğer",
        name: sparePart.name,
        compatible_brand: sparePart.compatible_brand || "",
        compatible_model: sparePart.compatible_model || "",
        quantity: sparePart.quantity,
        description: sparePart.description || "",
        is_defective: sparePart.is_defective || false,
      });
      wasEditing.current = true;
    } else {
      if (wasEditing.current) {
        setFormData(initialFormState);
        wasEditing.current = false;
      }
    }
  }, [sparePart]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const dataToSubmit = { ...formData };
      if (dataToSubmit.category !== "Diğer") {
        dataToSubmit.name = dataToSubmit.category.toLocaleUpperCase("tr-TR");
      }
      
      if (sparePart) {
        await api.updateSparePart(sparePart.id, dataToSubmit);
        toast.success("Parça başarıyla güncellendi");
      } else {
        await api.createSparePart(dataToSubmit);
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
    if ((field === "name" || field === "compatible_brand" || field === "compatible_model") && typeof value === "string") {
      value = value.toLocaleUpperCase("tr-TR");
    }
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
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-zinc-400 text-sm">Kategori</Label>
                <Select
                  value={formData.category}
                  onValueChange={(val) => handleChange("category", val)}
                >
                  <SelectTrigger className="bg-zinc-900/50 border-zinc-800 focus:ring-blue-500/20">
                    <SelectValue placeholder="Kategori seçin" />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-zinc-800 text-zinc-300">
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat} className="focus:bg-zinc-800 focus:text-zinc-100 cursor-pointer">
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {formData.category === "Diğer" && (
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-zinc-400 text-sm">
                    Parça Adı
                  </Label>
                  <Input
                    id="name"
                    required
                    value={formData.name}
                    onChange={(e) => handleChange("name", e.target.value)}
                    className="bg-zinc-900/50 border-zinc-800 text-zinc-100 focus:border-blue-500/50 focus:ring-blue-500/20"
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="quantity" className="text-zinc-400 text-sm">
                  Stok Adedi
                </Label>
                <Input
                  id="quantity"
                  type="number"
                  required
                  min="0"
                  value={formData.quantity}
                  onChange={(e) =>
                    handleChange("quantity", parseInt(e.target.value) || 0)
                  }
                  className="bg-zinc-900/50 border-zinc-800 text-zinc-100 focus:border-blue-500/50 focus:ring-blue-500/20"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="compatible_brand" className="text-zinc-400 text-sm">
                  Uyumlu Marka
                </Label>
                <div className="relative flex items-center">
                  <Input
                    id="compatible_brand"
                    value={formData.compatible_brand}
                    onChange={(e) => handleChange("compatible_brand", e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Tab" && suggestedBrand) {
                        e.preventDefault();
                        handleChange("compatible_brand", suggestedBrand);
                      }
                    }}
                    className="bg-zinc-900/50 border-zinc-800 text-zinc-100 focus:border-blue-500/50 focus:ring-blue-500/20"
                  />
                  {suggestedBrand && (
                    <div className="absolute inset-0 pointer-events-none flex items-center px-3 text-sm border border-transparent">
                      <span className="text-transparent">{formData.compatible_brand}</span>
                      <span className="text-zinc-500/50">{suggestedBrand.slice(formData.compatible_brand.length)}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="compatible_model" className="text-zinc-400 text-sm">
                  Uyumlu Model
                </Label>
                <div className="relative flex items-center">
                  <Input
                    id="compatible_model"
                    value={formData.compatible_model}
                    onChange={(e) => handleChange("compatible_model", e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Tab" && suggestedModel) {
                        e.preventDefault();
                        handleChange("compatible_model", suggestedModel);
                      }
                    }}
                    className="bg-zinc-900/50 border-zinc-800 text-zinc-100 focus:border-blue-500/50 focus:ring-blue-500/20"
                  />
                  {suggestedModel && (
                    <div className="absolute inset-0 pointer-events-none flex items-center px-3 text-sm border border-transparent">
                      <span className="text-transparent">{formData.compatible_model}</span>
                      <span className="text-zinc-500/50">{suggestedModel.slice(formData.compatible_model.length)}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-zinc-400 text-sm">Durum</Label>
                <div className="flex items-center gap-3 bg-zinc-900/50 border border-zinc-800 rounded-lg p-3">
                  <div
                    className={`h-2.5 w-2.5 rounded-full ${
                      formData.is_defective ? "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]" : "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"
                    }`}
                  />
                  <Select
                    value={formData.is_defective ? "true" : "false"}
                    onValueChange={(val) =>
                      handleChange("is_defective", val === "true")
                    }
                  >
                    <SelectTrigger className="border-0 bg-transparent p-0 h-auto focus:ring-0 focus:ring-offset-0 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-900 border-zinc-800 text-zinc-300">
                      <SelectItem value="false" className="focus:bg-zinc-800 focus:text-zinc-100 cursor-pointer">
                        Sağlam
                      </SelectItem>
                      <SelectItem value="true" className="focus:bg-zinc-800 focus:text-zinc-100 cursor-pointer text-red-400 focus:text-red-300">
                        Bozuk
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
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
