"use client";

import { useEffect, useState } from "react";
import { type Customer, type CustomerTransaction, api } from "@/lib/api";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface TransactionsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer: Customer | null;
}

export function TransactionsModal({
  open,
  onOpenChange,
  customer,
}: TransactionsModalProps) {
  const [transactions, setTransactions] = useState<CustomerTransaction[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && customer) {
      setLoading(true);
      api.getCustomerTransactions(customer.id)
        .then(setTransactions)
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [open, customer]);

  if (!customer) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-zinc-950 border-zinc-800 max-w-3xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-zinc-100 flex items-center justify-between">
            <span>Hesap Hareketleri - {customer.first_name} {customer.last_name}</span>
            <span className="text-sm font-normal text-zinc-400 mr-8">
              Mevcut Borç: <span className="font-semibold text-rose-400">
                {new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(customer.balance || 0)}
              </span>
            </span>
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-auto mt-4">
          {loading ? (
            <div className="text-center py-8 text-zinc-500">Yükleniyor...</div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-8 text-zinc-500">Kayıtlı hesap hareketi bulunamadı.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-zinc-800/50">
                  <TableHead className="text-zinc-400">Tarih</TableHead>
                  <TableHead className="text-zinc-400">İşlem Tipi</TableHead>
                  <TableHead className="text-zinc-400">Açıklama</TableHead>
                  <TableHead className="text-right text-zinc-400">Tutar</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((t) => (
                  <TableRow key={t.id} className="border-zinc-800/50 hover:bg-zinc-900/50">
                    <TableCell className="text-zinc-300">
                      {new Date(t.created_at).toLocaleString("tr-TR")}
                    </TableCell>
                    <TableCell>
                      {t.type === "debt" ? (
                        <Badge variant="destructive" className="bg-rose-500/10 text-rose-400 hover:bg-rose-500/20">Borç (Satış)</Badge>
                      ) : (
                        <Badge variant="default" className="bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20">Alacak (Tahsilat)</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-zinc-300">
                      {t.description || "-"}
                    </TableCell>
                    <TableCell className={`text-right font-semibold ${t.type === "debt" ? "text-rose-400" : "text-emerald-400"}`}>
                      {t.type === "debt" ? "+" : "-"}
                      {new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(t.amount)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
