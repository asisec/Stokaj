"use client";

import { useEffect, useState, useCallback } from "react";
import { api, type SparePart } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { SparePartTable } from "@/components/spare-parts/spare-part-table";
import { SparePartForm } from "@/components/spare-parts/spare-part-form";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { toast } from "sonner";

export default function SparePartsPage() {
  const [spareParts, setSpareParts] = useState<SparePart[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSparePart, setEditingSparePart] = useState<SparePart | null>(
    null
  );
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const fetchSpareParts = useCallback(() => {
    setLoading(true);
    api
      .getSpareParts()
      .then(setSpareParts)
      .catch(() => toast.error("Yedek parçalar yüklenirken hata oluştu"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchSpareParts();
  }, [fetchSpareParts]);

  const handleEdit = (sparePart: SparePart) => {
    setEditingSparePart(sparePart);
    setDialogOpen(true);
  };

  const handleDeleteClick = (id: number) => {
    setDeletingId(id);
    setConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (deletingId === null) return;
    try {
      await api.deleteSparePart(deletingId);
      toast.success("Yedek parça başarıyla silindi");
      fetchSpareParts();
    } catch {
      toast.error("Yedek parça silinirken hata oluştu");
    } finally {
      setDeletingId(null);
    }
  };

  const handleDialogChange = (open: boolean) => {
    setDialogOpen(open);
    if (!open) {
      setEditingSparePart(null);
    }
  };

  return (
    <div className="space-y-6 p-2">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100 tracking-tight">
            Yedek Parçalar
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            Yedek parça envanterini yönetin
          </p>
        </div>
        <Button
          onClick={() => setDialogOpen(true)}
          className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 transition-all duration-200 hover:shadow-lg hover:shadow-emerald-600/20"
        >
          <Plus className="h-4 w-4" />
          Yeni Parça Ekle
        </Button>
      </div>

      <SparePartTable
        spareParts={spareParts}
        onEdit={handleEdit}
        onDelete={handleDeleteClick}
        loading={loading}
      />

      <SparePartForm
        open={dialogOpen}
        onOpenChange={handleDialogChange}
        sparePart={editingSparePart}
        onSuccess={fetchSpareParts}
      />

      <ConfirmDialog
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Yedek Parçayı Sil"
        description="Bu yedek parçayı silmek istediğinizden emin misiniz? Bu işlem geri alınamaz."
      />
    </div>
  );
}
