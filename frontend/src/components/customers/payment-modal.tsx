"use client";

import { useState } from "react";
import { type Customer, api } from "@/lib/api";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { customToast as toast } from "@/lib/toast";

interface PaymentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer: Customer | null;
  onSuccess: () => void;
}

export function PaymentModal({
  open,
  onOpenChange,
  customer,
  onSuccess,
}: PaymentModalProps) {
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("cash");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  if (!customer) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(amount);
    if (isNaN(val) || val <= 0) {
      toast.error("Geçerli bir tutar girin");
      return;
    }

    setLoading(true);
    try {
      await api.addCustomerPayment(customer.id, {
        amount: val,
        method,
        description,
      });
      toast.success("Tahsilat başarıyla kaydedildi");
      onSuccess();
      onOpenChange(false);
      setAmount("");
      setDescription("");
      setMethod("cash");
    } catch {
      toast.error("Tahsilat kaydedilirken hata oluştu");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-zinc-950 border-zinc-800">
        <DialogHeader>
          <DialogTitle className="text-zinc-100">
            Tahsilat Al - {customer.first_name} {customer.last_name}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-400">
              Mevcut Borç: <span className="text-rose-400">{new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(customer.balance || 0)}</span>
            </label>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-400">Ödeme Yöntemi</label>
            <select
              value={method}
              onChange={(e) => setMethod(e.target.value)}
              className="w-full h-10 px-3 rounded-md bg-zinc-900 border border-zinc-800 text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="cash">Nakit</option>
              <option value="credit_card">Kredi Kartı</option>
              <option value="bank_transfer">Havale / EFT</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-400">Tutar</label>
            <Input
              type="number"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Tahsil edilen tutar"
              className="bg-zinc-900 border-zinc-800 text-zinc-100"
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-400">Açıklama (Opsiyonel)</label>
            <Input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Örn: Kalan bakiye ödemesi"
              className="bg-zinc-900 border-zinc-800 text-zinc-100"
            />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="text-zinc-400 hover:text-zinc-100"
            >
              İptal
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {loading ? "Kaydediliyor..." : "Tahsilatı Kaydet"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
