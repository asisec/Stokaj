"use client";

import { useState, useEffect, useRef } from "react";
import { api, type Customer } from "@/lib/api";
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

interface CustomerFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer: Customer | null;
  onSuccess: () => void;
}

const initialFormState = {
  first_name: "",
  last_name: "",
  identity_number: "",
  phone: "+90",
  email: "",
  address: "",
};

export function CustomerForm({
  open,
  onOpenChange,
  customer,
  onSuccess,
}: CustomerFormProps) {
  const [formData, setFormData] = useState(initialFormState);
  const [submitting, setSubmitting] = useState(false);

  const wasEditing = useRef(false);

  useEffect(() => {
    if (customer) {
      setFormData({
        first_name: customer.first_name,
        last_name: customer.last_name,
        identity_number: customer.identity_number || "",
        phone: customer.phone || "+90",
        email: customer.email || "",
        address: customer.address || "",
      });
      wasEditing.current = true;
    } else {
      if (wasEditing.current) {
        setFormData(initialFormState);
        wasEditing.current = false;
      }
    }
  }, [customer]);

  const formatPhone = (value: string) => {
    let digits = value.replace(/\D/g, "");
    if (digits.startsWith("90")) {
      digits = digits.substring(2);
    }
    digits = digits.substring(0, 10);
    let formatted = "+90";
    if (digits.length > 0) {
      formatted += " " + digits.substring(0, 3);
    }
    if (digits.length > 3) {
      formatted += " " + digits.substring(3, 6);
    }
    if (digits.length > 6) {
      formatted += " " + digits.substring(6, 8);
    }
    if (digits.length > 8) {
      formatted += " " + digits.substring(8, 10);
    }
    return formatted;
  };

  const handlePhoneChange = (val: string) => {
    if (!val.startsWith("+90")) {
      handleChange("phone", "+90");
      return;
    }
    const formatted = formatPhone(val);
    handleChange("phone", formatted);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const tcRegex = /^[1-9]\d{10}$/;
    if (!tcRegex.test(formData.identity_number)) {
      toast.error("Geçersiz T.C. Kimlik Numarası (11 haneli olmalıdır)");
      return;
    }

    const phoneDigits = formData.phone.replace(/\D/g, "");
    if (phoneDigits.length !== 12) {
      toast.error("Geçersiz Telefon Numarası (10 hane girilmelidir)");
      return;
    }

    setSubmitting(true);
    try {
      if (customer) {
        await api.updateCustomer(customer.id, formData);
        toast.success("Müşteri başarıyla güncellendi");
      } else {
        await api.createCustomer(formData);
        toast.success("Müşteri başarıyla eklendi");
      }
      setFormData(initialFormState);
      onOpenChange(false);
      onSuccess();
    } catch {
      toast.error(
        customer
          ? "Müşteri güncellenirken hata oluştu"
          : "Müşteri eklenirken hata oluştu"
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (field: string, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleIdentityChange = (val: string) => {
    const digitsOnly = val.replace(/\D/g, "").substring(0, 11);
    handleChange("identity_number", digitsOnly);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-zinc-950 border-zinc-800 text-zinc-100 sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-zinc-100">
            {customer ? "Müşteri Düzenle" : "Yeni Müşteri Ekle"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-5 mt-2">
          <div className="space-y-2">
            <Label htmlFor="identity_number" className="text-zinc-400 text-sm">
              T.C. Kimlik Numarası
            </Label>
            <Input
              id="identity_number"
              value={formData.identity_number}
              onChange={(e) => handleIdentityChange(e.target.value)}
              placeholder="11 haneli kimlik numarası"
              maxLength={11}
              className="bg-zinc-900/50 border-zinc-800 text-zinc-200 focus:border-purple-500/50 transition-colors font-mono"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="first_name" className="text-zinc-400 text-sm">
                Ad
              </Label>
              <Input
                id="first_name"
                value={formData.first_name}
                onChange={(e) => handleChange("first_name", e.target.value.toLocaleUpperCase("tr-TR"))}
                className="bg-zinc-900/50 border-zinc-800 text-zinc-200 focus:border-purple-500/50 transition-colors uppercase"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="last_name" className="text-zinc-400 text-sm">
                Soyad
              </Label>
              <Input
                id="last_name"
                value={formData.last_name}
                onChange={(e) => handleChange("last_name", e.target.value.toLocaleUpperCase("tr-TR"))}
                className="bg-zinc-900/50 border-zinc-800 text-zinc-200 focus:border-purple-500/50 transition-colors uppercase"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone" className="text-zinc-400 text-sm">
                Telefon
              </Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => handlePhoneChange(e.target.value)}
                className="bg-zinc-900/50 border-zinc-800 text-zinc-200 focus:border-purple-500/50 transition-colors font-mono"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-zinc-400 text-sm">
                E-posta
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleChange("email", e.target.value.toLocaleUpperCase("tr-TR"))}
                className="bg-zinc-900/50 border-zinc-800 text-zinc-200 focus:border-purple-500/50 transition-colors uppercase"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address" className="text-zinc-400 text-sm">
              Adres
            </Label>
            <textarea
              id="address"
              value={formData.address}
              onChange={(e) => handleChange("address", e.target.value)}
              rows={3}
              className="flex w-full rounded-md border border-zinc-800 bg-zinc-900/50 px-3 py-2 text-sm text-zinc-200 placeholder:text-zinc-600 focus:border-purple-500/50 focus:outline-none focus:ring-1 focus:ring-purple-500/30 transition-colors resize-none"
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
              className="bg-purple-600 hover:bg-purple-700 text-white min-w-[100px] transition-all duration-200"
            >
              {submitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : customer ? (
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
