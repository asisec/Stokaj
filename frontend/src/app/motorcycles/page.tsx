"use client";

import { useEffect, useState, useCallback } from "react";
import { api, type Motorcycle } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { MotorcycleTable } from "@/components/motorcycles/motorcycle-table";
import { MotorcycleForm } from "@/components/motorcycles/motorcycle-form";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { customToast as toast } from "@/lib/toast";

export default function MotorcyclesPage() {
  const [motorcycles, setMotorcycles] = useState<Motorcycle[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingMotorcycle, setEditingMotorcycle] = useState<Motorcycle | null>(
    null
  );
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

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

  const handleDeleteClick = (id: number) => {
    setDeletingId(id);
    setConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (deletingId === null) return;
    try {
      await api.deleteMotorcycle(deletingId);
      toast.success("Motosiklet başarıyla silindi");
      fetchMotorcycles();
    } catch {
      toast.error("Motosiklet silinirken hata oluştu");
    } finally {
      setDeletingId(null);
    }
  };

  const handleDialogChange = (open: boolean) => {
    setDialogOpen(open);
    if (!open) {
      setEditingMotorcycle(null);
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
        onDelete={handleDeleteClick}
        loading={loading}
      />

      <MotorcycleForm
        open={dialogOpen}
        onOpenChange={handleDialogChange}
        motorcycle={editingMotorcycle}
        onSuccess={fetchMotorcycles}
        existingMotorcycles={motorcycles}
      />

      <ConfirmDialog
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Motosikleti Sil"
        description="Bu motosikleti silmek istediğinizden emin misiniz? Bu işlem geri alınamaz."
      />
    </div>
  );
}
