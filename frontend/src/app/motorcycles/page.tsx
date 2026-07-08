"use client";

import { useEffect, useState, useCallback } from "react";
import { api, type Motorcycle } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { MotorcycleTable } from "@/components/motorcycles/motorcycle-table";
import { MotorcycleForm } from "@/components/motorcycles/motorcycle-form";
import { QRCodeModal } from "@/components/motorcycles/qr-code-modal";
import { toast } from "sonner";

export default function MotorcyclesPage() {
  const [motorcycles, setMotorcycles] = useState<Motorcycle[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [qrDialogOpen, setQrDialogOpen] = useState(false);
  const [editingMotorcycle, setEditingMotorcycle] = useState<Motorcycle | null>(
    null
  );
  const [qrMotorcycle, setQrMotorcycle] = useState<Motorcycle | null>(null);

  const fetchMotorcycles = useCallback(() => {
    setLoading(true);
    api
      .getMotorcycles()
      .then(setMotorcycles)
      .catch(() => toast.error("Motosikletler yüklenirken hata oluştu"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchMotorcycles();
  }, [fetchMotorcycles]);

  const handleEdit = (motorcycle: Motorcycle) => {
    setEditingMotorcycle(motorcycle);
    setDialogOpen(true);
  };

  const handleShowQR = (motorcycle: Motorcycle) => {
    setQrMotorcycle(motorcycle);
    setQrDialogOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Bu motosikleti silmek istediğinizden emin misiniz?")) {
      return;
    }
    try {
      await api.deleteMotorcycle(id);
      toast.success("Motosiklet başarıyla silindi");
      fetchMotorcycles();
    } catch {
      toast.error("Motosiklet silinirken hata oluştu");
    }
  };

  const handleDialogChange = (open: boolean) => {
    setDialogOpen(open);
    if (!open) {
      setEditingMotorcycle(null);
    }
  };

  const handleQrDialogChange = (open: boolean) => {
    setQrDialogOpen(open);
    if (!open) {
      setQrMotorcycle(null);
    }
  };

  return (
    <div className="space-y-6 p-2">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100 tracking-tight">
            Motosikletler
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            Envanterdeki tüm motosikletleri yönetin
          </p>
        </div>
        <Button
          onClick={() => setDialogOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white gap-2 transition-all duration-200 hover:shadow-lg hover:shadow-blue-600/20"
        >
          <Plus className="h-4 w-4" />
          Yeni Motosiklet Ekle
        </Button>
      </div>

      <MotorcycleTable
        motorcycles={motorcycles}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onShowQR={handleShowQR}
        loading={loading}
      />

      <MotorcycleForm
        open={dialogOpen}
        onOpenChange={handleDialogChange}
        motorcycle={editingMotorcycle}
        onSuccess={fetchMotorcycles}
      />

      <QRCodeModal
        open={qrDialogOpen}
        onOpenChange={handleQrDialogChange}
        motorcycle={qrMotorcycle}
      />
    </div>
  );
}
