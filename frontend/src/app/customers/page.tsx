"use client";

import { useEffect, useState, useCallback } from "react";
import { api, type Customer } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { CustomerTable } from "@/components/customers/customer-table";
import { CustomerForm } from "@/components/customers/customer-form";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { toast } from "sonner";

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const fetchCustomers = useCallback(() => {
    setLoading(true);
    api
      .getCustomers()
      .then(setCustomers)
      .catch(() => toast.error("Müşteriler yüklenirken hata oluştu"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const handleEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    setDialogOpen(true);
  };

  const handleDeleteClick = (id: number) => {
    setDeletingId(id);
    setConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (deletingId === null) return;
    try {
      await api.deleteCustomer(deletingId);
      toast.success("Müşteri başarıyla silindi");
      fetchCustomers();
    } catch {
      toast.error("Müşteri silinirken hata oluştu");
    } finally {
      setDeletingId(null);
    }
  };

  const handleDialogChange = (open: boolean) => {
    setDialogOpen(open);
    if (!open) {
      setEditingCustomer(null);
    }
  };

  return (
    <div className="space-y-6 p-2">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100 tracking-tight">
            Müşteriler
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            Müşteri bilgilerini yönetin
          </p>
        </div>
        <Button
          onClick={() => setDialogOpen(true)}
          className="bg-purple-600 hover:bg-purple-700 text-white gap-2 transition-all duration-200 hover:shadow-lg hover:shadow-purple-600/20"
        >
          <Plus className="h-4 w-4" />
          Yeni Müşteri Ekle
        </Button>
      </div>

      <CustomerTable
        customers={customers}
        onEdit={handleEdit}
        onDelete={handleDeleteClick}
        loading={loading}
      />

      <CustomerForm
        open={dialogOpen}
        onOpenChange={handleDialogChange}
        customer={editingCustomer}
        onSuccess={fetchCustomers}
      />

      <ConfirmDialog
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Müşteriyi Sil"
        description="Bu müşteriyi silmek istediğinizden emin misiniz? Bu işlem geri alınamaz."
      />
    </div>
  );
}
