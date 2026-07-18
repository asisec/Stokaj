"use client";

import { useState, useEffect } from "react";
import { api, type SparePart, type Motorcycle } from "@/lib/api";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { customToast as toast } from "@/lib/toast";
import { Loader2, Plus, Trash2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

interface SparePartBulkFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
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

const emptyRow = (): Partial<SparePart> => ({
  category: "Diğer",
  name: "",
  compatible_brand: "",
  compatible_model: "",
  quantity: 1,
  description: "",
  is_defective: false,
});

export function SparePartBulkForm({
  open,
  onOpenChange,
  onSuccess,
}: SparePartBulkFormProps) {
  const [rows, setRows] = useState<Partial<SparePart>[]>([emptyRow()]);
  const [submitting, setSubmitting] = useState(false);
  const [uniqueBrands, setUniqueBrands] = useState<string[]>([]);
  const [uniqueModels, setUniqueModels] = useState<string[]>([]);

  const getSuggestion = (input: string, list: string[]) => {
    if (!input) return "";
    const match = list.find((item) => item.toUpperCase().startsWith(input.toUpperCase()));
    return match || "";
  };

  useEffect(() => {
    if (open) {
      api.getMotorcycles().then((motos) => {
        const brands = Array.from(new Set(motos.map((m) => m.brand))).filter(Boolean);
        const models = Array.from(new Set(motos.map((m) => m.model))).filter(Boolean);
        setUniqueBrands(brands);
        setUniqueModels(models);
      }).catch(() => {});
      setRows([emptyRow()]);
    }
  }, [open]);

  const addRow = () => setRows([...rows, emptyRow()]);
  const removeRow = (index: number) => {
    if (rows.length > 1) {
      setRows(rows.filter((_, i) => i !== index));
    }
  };

  const updateRow = (index: number, field: keyof SparePart, value: any) => {
    if (field === "name" || field === "compatible_brand" || field === "compatible_model") {
      value = typeof value === "string" ? value.toLocaleUpperCase("tr-TR") : value;
    }
    const newRows = [...rows];
    newRows[index] = { ...newRows[index], [field]: value };
    setRows(newRows);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const preparedRows = rows.map(r => {
      if (r.category !== "Diğer") {
        return { ...r, name: r.category?.toLocaleUpperCase("tr-TR") };
      }
      return r;
    });
    
    const validRows = preparedRows.filter(r => r.name && r.name.trim() !== "");
    if (validRows.length === 0) {
      toast.error("Lütfen geçerli parça bilgileri girin");
      return;
    }

    setSubmitting(true);
    try {
      await api.bulkCreateSpareParts(validRows);
      toast.success("Parçalar başarıyla eklendi");
      onOpenChange(false);
      onSuccess();
    } catch {
      toast.error("Toplu ekleme sırasında hata oluştu");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-zinc-950 border-zinc-800 text-zinc-100 max-w-[90vw] max-h-[90vh] flex flex-col p-0">
        <DialogHeader className="p-6 pb-4 border-b border-zinc-800/50">
          <DialogTitle className="text-xl font-bold">Toplu Parça Ekle</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="flex-1 overflow-auto p-6">
            <div className="min-w-[1000px] space-y-4">
              <div className="grid grid-cols-[150px_1fr_150px_150px_80px_1.5fr_80px_40px] gap-4 text-sm font-medium text-zinc-400 px-2">
                <div>Kategori</div>
                <div>Parça Adı</div>
                <div>Uyumlu Marka</div>
                <div>Uyumlu Model</div>
                <div>Adet</div>
                <div>Açıklama</div>
                <div className="text-center">Bozuk</div>
                <div></div>
              </div>
              
              <div className="space-y-3">
                {rows.map((row, index) => (
                  <div key={index} className="grid grid-cols-[150px_1fr_150px_150px_80px_1.5fr_80px_40px] gap-4 items-start">
                    <Select
                      value={row.category}
                      onValueChange={(val) => updateRow(index, "category", val)}
                    >
                      <SelectTrigger className="bg-zinc-900/50 border-zinc-800 h-9">
                        <SelectValue placeholder="Kategori" />
                      </SelectTrigger>
                      <SelectContent className="bg-zinc-900 border-zinc-800">
                        {CATEGORIES.map((cat) => (
                          <SelectItem key={cat} value={cat} className="focus:bg-zinc-800 focus:text-zinc-100 cursor-pointer">
                            {cat}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    {row.category === "Diğer" ? (
                      <Input
                        required
                        placeholder="Parça adı"
                        value={row.name}
                        onChange={(e) => updateRow(index, "name", e.target.value)}
                        className="bg-zinc-900/50 border-zinc-800 h-9"
                      />
                    ) : (
                      <div className="bg-zinc-900/30 border border-zinc-800/50 h-9 rounded-md flex items-center px-3 text-sm text-zinc-500 italic">
                        Otomatik
                      </div>
                    )}

                    <div className="relative flex items-center">
                      <Input
                        placeholder="Marka"
                        value={row.compatible_brand}
                        onChange={(e) => updateRow(index, "compatible_brand", e.target.value)}
                        onKeyDown={(e) => {
                          const suggestion = getSuggestion(row.compatible_brand || "", uniqueBrands);
                          if (e.key === "Tab" && suggestion) {
                            e.preventDefault();
                            updateRow(index, "compatible_brand", suggestion);
                          }
                        }}
                        className="bg-zinc-900/50 border-zinc-800 h-9"
                      />
                      {getSuggestion(row.compatible_brand || "", uniqueBrands) && (
                        <div className="absolute inset-0 pointer-events-none flex items-center px-3 text-sm border border-transparent">
                          <span className="text-transparent">{row.compatible_brand}</span>
                          <span className="text-zinc-500/50">
                            {getSuggestion(row.compatible_brand || "", uniqueBrands).slice((row.compatible_brand || "").length)}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="relative flex items-center">
                      <Input
                        placeholder="Model"
                        value={row.compatible_model}
                        onChange={(e) => updateRow(index, "compatible_model", e.target.value)}
                        onKeyDown={(e) => {
                          const suggestion = getSuggestion(row.compatible_model || "", uniqueModels);
                          if (e.key === "Tab" && suggestion) {
                            e.preventDefault();
                            updateRow(index, "compatible_model", suggestion);
                          }
                        }}
                        className="bg-zinc-900/50 border-zinc-800 h-9"
                      />
                      {getSuggestion(row.compatible_model || "", uniqueModels) && (
                        <div className="absolute inset-0 pointer-events-none flex items-center px-3 text-sm border border-transparent">
                          <span className="text-transparent">{row.compatible_model}</span>
                          <span className="text-zinc-500/50">
                            {getSuggestion(row.compatible_model || "", uniqueModels).slice((row.compatible_model || "").length)}
                          </span>
                        </div>
                      )}
                    </div>

                    <Input
                      type="number"
                      required
                      min="0"
                      value={row.quantity}
                      onChange={(e) => updateRow(index, "quantity", parseInt(e.target.value) || 0)}
                      className="bg-zinc-900/50 border-zinc-800 h-9"
                    />

                    <Input
                      placeholder="Açıklama (İsteğe bağlı)"
                      value={row.description}
                      onChange={(e) => updateRow(index, "description", e.target.value)}
                      className="bg-zinc-900/50 border-zinc-800 h-9"
                    />

                    <div className="flex items-center justify-center h-9">
                      <Checkbox
                        checked={row.is_defective}
                        onCheckedChange={(c) => updateRow(index, "is_defective", c === true)}
                        className="border-zinc-700 data-[state=checked]:bg-red-500 data-[state=checked]:border-red-500"
                      />
                    </div>

                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeRow(index)}
                      disabled={rows.length === 1}
                      className="h-9 w-9 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 shrink-0"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
            
            <Button
              type="button"
              variant="outline"
              onClick={addRow}
              className="mt-4 border-dashed border-zinc-700 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 hover:border-zinc-600"
            >
              <Plus className="mr-2 h-4 w-4" />
              Yeni Satır Ekle
            </Button>
          </div>

          <div className="p-6 border-t border-zinc-800/50 bg-zinc-950 flex justify-end gap-3">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800"
              disabled={submitting}
            >
              İptal
            </Button>
            <Button
              type="submit"
              disabled={submitting}
              className="bg-blue-600 hover:bg-blue-700 text-white min-w-[120px]"
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Kaydediliyor
                </>
              ) : (
                "Tümünü Kaydet"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
