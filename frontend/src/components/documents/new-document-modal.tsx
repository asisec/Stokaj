"use client";

import { useState, useEffect } from "react";
import { api, type Motorcycle, type Customer, type DocumentStatus } from "@/lib/api";
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
import { PlusCircle, Loader2 } from "lucide-react";

interface NewDocumentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function NewDocumentModal({
  open,
  onOpenChange,
  onSuccess,
}: NewDocumentModalProps) {
  const [motorcycles, setMotorcycles] = useState<Motorcycle[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [motorcycleId, setMotorcycleId] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [plateNumber, setPlateNumber] = useState("");
  const [registrationSerial, setRegistrationSerial] = useState("");
  const [notaryName, setNotaryName] = useState("");
  const [notaryDocNo, setNotaryDocNo] = useState("");
  const [notaryDate, setNotaryDate] = useState("");
  const [hasInsurance, setHasInsurance] = useState(false);
  const [status, setStatus] = useState<DocumentStatus>("notary_pending");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (open) {
      setLoadingData(true);
      Promise.all([api.getMotorcycles(), api.getCustomers()])
        .then(([m, c]) => {
          setMotorcycles(m);
          setCustomers(c);
        })
        .catch(() => toast.error("Veriler yüklenirken hata oluştu"))
        .finally(() => setLoadingData(false));
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!motorcycleId || !customerId) {
      toast.error("Lütfen bir motosiklet ve müşteri seçin");
      return;
    }
    setSubmitting(true);
    try {
      await api.createDocument({
        motorcycle_id: Number(motorcycleId),
        customer_id: Number(customerId),
        plate_number: plateNumber.toUpperCase().trim(),
        registration_serial: registrationSerial.toUpperCase().trim(),
        notary_name: notaryName.trim(),
        notary_doc_no: notaryDocNo.trim(),
        notary_date: notaryDate || null,
        has_insurance: hasInsurance,
        status,
        notes: notes.trim(),
      });
      toast.success("Yeni evrak takip kaydı oluşturuldu");
      onOpenChange(false);
      onSuccess();
      // Reset
      setMotorcycleId("");
      setCustomerId("");
      setPlateNumber("");
      setRegistrationSerial("");
      setNotaryName("");
      setNotaryDocNo("");
      setNotaryDate("");
      setHasInsurance(false);
      setStatus("notary_pending");
      setNotes("");
    } catch {
      toast.error("Kayıt oluşturulurken hata oluştu");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] bg-zinc-950/95 border-zinc-800/80 backdrop-blur-2xl p-6 rounded-3xl shadow-2xl max-h-[90vh] overflow-y-auto custom-scrollbar">
        <DialogHeader className="pb-4 border-b border-zinc-800/60">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <PlusCircle className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold text-zinc-100">
                Yeni Evrak / Noter Takip Kaydı
              </DialogTitle>
              <p className="text-xs text-zinc-500 mt-0.5">
                Motosiklet seçerek evrak ve noter sürecini başlatın
              </p>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {/* Motosiklet Seçimi */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">
              Motosiklet Seçin *
            </Label>
            <Select value={motorcycleId} onValueChange={setMotorcycleId} disabled={loadingData}>
              <SelectTrigger className="h-11 bg-zinc-900/50 border-zinc-800 rounded-xl text-zinc-200 text-sm focus:border-blue-500">
                <SelectValue placeholder="Motosiklet seçin..." />
              </SelectTrigger>
              <SelectContent className="bg-zinc-900 border-zinc-800 rounded-xl max-h-56">
                {motorcycles.map((m) => (
                  <SelectItem key={m.id} value={m.id.toString()} className="text-zinc-200 focus:bg-zinc-800">
                    <span className="font-semibold">{m.brand} {m.model}</span>
                    <span className="text-zinc-500 text-xs ml-2 font-mono">({m.chassis_number})</span>
                    <span className={`text-[10px] ml-2 px-1.5 py-0.5 rounded ${m.status === 'sold' ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                      {m.status === 'sold' ? 'Satıldı' : 'Bekliyor'}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Müşteri Seçimi */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">
              Müşteri Seçin *
            </Label>
            <Select value={customerId} onValueChange={setCustomerId} disabled={loadingData}>
              <SelectTrigger className="h-11 bg-zinc-900/50 border-zinc-800 rounded-xl text-zinc-200 text-sm focus:border-blue-500">
                <SelectValue placeholder="Müşteri seçin..." />
              </SelectTrigger>
              <SelectContent className="bg-zinc-900 border-zinc-800 rounded-xl max-h-56">
                {customers.map((c) => (
                  <SelectItem key={c.id} value={c.id.toString()} className="text-zinc-200 focus:bg-zinc-800">
                    <span className="font-semibold">{c.first_name} {c.last_name}</span>
                    <span className="text-zinc-500 text-xs ml-2 font-mono">{c.phone || c.identity_number}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Süreç Durumu */}
          <div className="space-y-2">
            <Label className="text-xs font-medium text-zinc-400">Başlangıç Aşaması</Label>
            <Select value={status} onValueChange={(val: DocumentStatus) => setStatus(val)}>
              <SelectTrigger className="h-10 bg-zinc-900/50 border-zinc-800 rounded-xl text-zinc-200 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-zinc-900 border-zinc-800 rounded-xl">
                <SelectItem value="notary_pending" className="text-amber-400">🟡 Noter Bekliyor</SelectItem>
                <SelectItem value="plate_pending" className="text-blue-400">🔵 Ruhsat & Plaka Sürecinde</SelectItem>
                <SelectItem value="ready_for_delivery" className="text-purple-400">🟣 Teslimata Hazır</SelectItem>
                <SelectItem value="delivered" className="text-emerald-400">🟢 Teslim Edildi</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Plaka ve Ruhsat Seri No */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs font-medium text-zinc-400">Plaka No (Varsa)</Label>
              <Input
                placeholder="Örn: 34 ABC 123"
                value={plateNumber}
                onChange={(e) => setPlateNumber(e.target.value)}
                className="h-10 bg-zinc-900/50 border-zinc-800 rounded-xl uppercase font-mono text-zinc-200"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-medium text-zinc-400">Ruhsat Seri No (Varsa)</Label>
              <Input
                placeholder="Örn: AA123456"
                value={registrationSerial}
                onChange={(e) => setRegistrationSerial(e.target.value)}
                className="h-10 bg-zinc-900/50 border-zinc-800 rounded-xl uppercase font-mono text-zinc-200"
              />
            </div>
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
              disabled={submitting || !motorcycleId || !customerId}
              className="h-10 bg-purple-600 hover:bg-purple-500 text-white font-semibold rounded-xl px-6 transition-all"
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Takibi Başlat
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
