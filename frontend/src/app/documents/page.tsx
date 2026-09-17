"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { api, type RegistrationDocument, type DocumentStatus } from "@/lib/api";
import { useCensorStore } from "@/store/censor";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { customToast as toast } from "@/lib/toast";
import {
  FileCheck2,
  Search,
  Plus,
  Bike,
  User,
  MoreHorizontal,
  Pencil,
  Trash2,
  Clock,
  FileSignature,
  FileText,
  CheckCircle2,
  ShieldCheck,
  ChevronRight,
  ShieldAlert,
  ArrowRight,
} from "lucide-react";
import { DocumentModal } from "@/components/documents/document-modal";
import { NewDocumentModal } from "@/components/documents/new-document-modal";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<RegistrationDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingDoc, setEditingDoc] = useState<RegistrationDocument | null>(null);

  const [newModalOpen, setNewModalOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const { isCensored } = useCensorStore();

  const fetchDocuments = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.getDocuments();
      setDocuments(data);
    } catch {
      toast.error("Evrak kayıtları yüklenirken hata oluştu");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  // Status counts for KPI cards
  const stats = useMemo(() => {
    return {
      notary_pending: documents.filter((d) => d.status === "notary_pending").length,
      plate_pending: documents.filter((d) => d.status === "plate_pending").length,
      ready_for_delivery: documents.filter((d) => d.status === "ready_for_delivery").length,
      delivered: documents.filter((d) => d.status === "delivered").length,
    };
  }, [documents]);

  const filteredDocuments = useMemo(() => {
    return documents.filter((doc) => {
      if (selectedStatus !== "all" && doc.status !== selectedStatus) {
        return false;
      }
      if (!search) return true;
      const q = search.toLowerCase();
      const plate = (doc.plate_number || "").toLowerCase();
      const chassis = (doc.motorcycle?.chassis_number || "").toLowerCase();
      const brand = (doc.motorcycle?.brand || "").toLowerCase();
      const model = (doc.motorcycle?.model || "").toLowerCase();
      const customerName = `${doc.customer?.first_name || ""} ${doc.customer?.last_name || ""}`.toLowerCase();
      const notary = (doc.notary_name || "").toLowerCase();
      return (
        plate.includes(q) ||
        chassis.includes(q) ||
        brand.includes(q) ||
        model.includes(q) ||
        customerName.includes(q) ||
        notary.includes(q)
      );
    });
  }, [documents, selectedStatus, search]);

  const handleEdit = (doc: RegistrationDocument) => {
    setEditingDoc(doc);
    setEditModalOpen(true);
  };

  const handleQuickAdvance = async (doc: RegistrationDocument) => {
    let nextStatus: DocumentStatus = doc.status;
    let successMsg = "";

    if (doc.status === "notary_pending") {
      nextStatus = "plate_pending";
      successMsg = "Noter tamamlandı, plaka sürecine alındı";
    } else if (doc.status === "plate_pending") {
      nextStatus = "ready_for_delivery";
      successMsg = "Plaka hazır, teslimata hazır durumuna alındı";
    } else if (doc.status === "ready_for_delivery") {
      nextStatus = "delivered";
      successMsg = "Motosiklet ve evraklar müşteriye teslim edildi!";
    }

    if (nextStatus === doc.status) return;

    try {
      await api.updateDocument(doc.id, { status: nextStatus });
      toast.success(successMsg);
      fetchDocuments();
    } catch {
      toast.error("Durum güncellenirken hata oluştu");
    }
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    try {
      await api.deleteDocument(deletingId);
      toast.success("Evrak kaydı silindi");
      fetchDocuments();
    } catch {
      toast.error("Evrak silinirken hata oluştu");
    } finally {
      setDeletingId(null);
    }
  };

  const renderStatusBadge = (status: DocumentStatus) => {
    switch (status) {
      case "notary_pending":
        return (
          <Badge className="bg-amber-500/15 text-amber-400 border-amber-500/30 gap-1.5 px-2.5 py-1">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
            Noter Bekliyor
          </Badge>
        );
      case "plate_pending":
        return (
          <Badge className="bg-blue-500/15 text-blue-400 border-blue-500/30 gap-1.5 px-2.5 py-1">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-400" />
            Ruhsat / Plaka Sürecinde
          </Badge>
        );
      case "ready_for_delivery":
        return (
          <Badge className="bg-purple-500/15 text-purple-400 border-purple-500/30 gap-1.5 px-2.5 py-1">
            <span className="h-1.5 w-1.5 rounded-full bg-purple-400" />
            Teslimata Hazır
          </Badge>
        );
      case "delivered":
        return (
          <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30 gap-1.5 px-2.5 py-1">
            <ShieldCheck className="h-3 w-3" />
            Teslim Edildi
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6 p-2">
      {/* Üst Başlık & Buton */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100 tracking-tight flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <FileCheck2 className="h-5 w-5" />
            </div>
            Evrak, Ruhsat & Noter Takibi
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            Satılan motosikletlerin noter satış sözleşmesi, plaka, ruhsat ve teslimat adımlarını yönetin
          </p>
        </div>
        <Button
          onClick={() => setNewModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl gap-2 shadow-lg shadow-blue-600/20"
        >
          <Plus className="h-4 w-4" />
          Yeni Evrak Takibi Başlat
        </Button>
      </div>

      {/* KPI Özet Sayaçları */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div
          onClick={() => setSelectedStatus(selectedStatus === "notary_pending" ? "all" : "notary_pending")}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            selectedStatus === "notary_pending"
              ? "bg-amber-500/10 border-amber-500/50 shadow-lg shadow-amber-500/10"
              : "bg-zinc-900/40 border-zinc-800/50 hover:bg-zinc-900/70"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Noter Bekliyor</span>
            <FileSignature className="h-4 w-4 text-amber-400" />
          </div>
          <div className="mt-2 text-2xl font-black text-amber-400 tabular-nums">{stats.notary_pending}</div>
          <p className="text-[11px] text-zinc-500 mt-0.5">Satışı verilmemiş araçlar</p>
        </div>

        <div
          onClick={() => setSelectedStatus(selectedStatus === "plate_pending" ? "all" : "plate_pending")}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            selectedStatus === "plate_pending"
              ? "bg-blue-500/10 border-blue-500/50 shadow-lg shadow-blue-500/10"
              : "bg-zinc-900/40 border-zinc-800/50 hover:bg-zinc-900/70"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Plaka / Ruhsat</span>
            <FileText className="h-4 w-4 text-blue-400" />
          </div>
          <div className="mt-2 text-2xl font-black text-blue-400 tabular-nums">{stats.plate_pending}</div>
          <p className="text-[11px] text-zinc-500 mt-0.5">Tescil & plaka sürecinde</p>
        </div>

        <div
          onClick={() => setSelectedStatus(selectedStatus === "ready_for_delivery" ? "all" : "ready_for_delivery")}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            selectedStatus === "ready_for_delivery"
              ? "bg-purple-500/10 border-purple-500/50 shadow-lg shadow-purple-500/10"
              : "bg-zinc-900/40 border-zinc-800/50 hover:bg-zinc-900/70"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Teslimata Hazır</span>
            <CheckCircle2 className="h-4 w-4 text-purple-400" />
          </div>
          <div className="mt-2 text-2xl font-black text-purple-400 tabular-nums">{stats.ready_for_delivery}</div>
          <p className="text-[11px] text-zinc-500 mt-0.5">Plaka ve evraklar hazır</p>
        </div>

        <div
          onClick={() => setSelectedStatus(selectedStatus === "delivered" ? "all" : "delivered")}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            selectedStatus === "delivered"
              ? "bg-emerald-500/10 border-emerald-500/50 shadow-lg shadow-emerald-500/10"
              : "bg-zinc-900/40 border-zinc-800/50 hover:bg-zinc-900/70"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Teslim Edildi</span>
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="mt-2 text-2xl font-black text-emerald-400 tabular-nums">{stats.delivered}</div>
          <p className="text-[11px] text-zinc-500 mt-0.5">Müşteriye teslim edilenler</p>
        </div>
      </div>

      {/* Arama & Filtreleme Çubuğu */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
          <Input
            placeholder="Plaka, şasi numarası, marka, model, müşteri veya noter ara..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 h-11 bg-zinc-900/50 border-zinc-800 rounded-xl text-zinc-200 placeholder:text-zinc-500 focus:border-blue-500"
          />
        </div>

        {/* Durum Butonları */}
        <div className="flex items-center gap-1.5 p-1 bg-zinc-900/80 border border-zinc-800/80 rounded-xl overflow-x-auto w-full sm:w-auto">
          {[
            { id: "all", label: "Tümü" },
            { id: "notary_pending", label: "Noter Bekleyen" },
            { id: "plate_pending", label: "Plaka Sürecinde" },
            { id: "ready_for_delivery", label: "Teslimata Hazır" },
            { id: "delivered", label: "Teslim Edildi" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedStatus(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all shrink-0 ${
                selectedStatus === tab.id
                  ? "bg-blue-600 text-white font-semibold shadow-sm"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tablo Listesi */}
      <div className="rounded-2xl border border-zinc-800/60 bg-zinc-900/30 overflow-hidden backdrop-blur-sm">
        <Table>
          <TableHeader>
            <TableRow className="border-zinc-800/60 hover:bg-transparent bg-zinc-900/60">
              <TableHead className="text-zinc-400 font-medium">Plaka & Durum</TableHead>
              <TableHead className="text-zinc-400 font-medium">Motosiklet</TableHead>
              <TableHead className="text-zinc-400 font-medium">Müşteri</TableHead>
              <TableHead className="text-zinc-400 font-medium">Noter Bilgisi</TableHead>
              <TableHead className="text-zinc-400 font-medium">Sigorta</TableHead>
              <TableHead className="text-zinc-400 font-medium text-center">Hızlı İlerleme</TableHead>
              <TableHead className="text-right text-zinc-400 font-medium">İşlemler</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i} className="border-zinc-800/50">
                  <TableCell><Skeleton className="h-6 w-28 bg-zinc-800/50" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-36 bg-zinc-800/50" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-28 bg-zinc-800/50" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-32 bg-zinc-800/50" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-16 bg-zinc-800/50" /></TableCell>
                  <TableCell><Skeleton className="h-8 w-24 mx-auto bg-zinc-800/50" /></TableCell>
                  <TableCell><Skeleton className="h-8 w-8 ml-auto bg-zinc-800/50" /></TableCell>
                </TableRow>
              ))
            ) : filteredDocuments.length > 0 ? (
              filteredDocuments.map((doc) => {
                return (
                  <TableRow
                    key={doc.id}
                    className="border-zinc-800/50 hover:bg-zinc-800/30 transition-colors"
                  >
                    {/* Plaka ve Durum */}
                    <TableCell>
                      <div className="space-y-1.5">
                        {doc.plate_number ? (
                          <div className="inline-flex items-center border border-zinc-700 bg-zinc-950 px-2 py-0.5 rounded-md font-mono text-xs font-bold text-zinc-100 tracking-wider">
                            <span className="bg-blue-600 text-[10px] text-white px-1 py-0.5 rounded mr-1.5 font-sans font-bold">TR</span>
                            {doc.plate_number}
                          </div>
                        ) : (
                          <span className="text-xs text-zinc-500 italic">Plaka henüz basılmadı</span>
                        )}
                        <div>{renderStatusBadge(doc.status)}</div>
                      </div>
                    </TableCell>

                    {/* Motosiklet */}
                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-semibold text-zinc-200 text-sm">
                          {doc.motorcycle ? `${doc.motorcycle.brand} ${doc.motorcycle.model}` : "-"}
                        </div>
                        <div className="text-xs text-zinc-500 font-mono">
                          {doc.motorcycle?.chassis_number || "-"}
                        </div>
                        {doc.registration_serial && (
                          <div className="text-[11px] text-zinc-400">
                            Ruhsat No: <span className="font-mono text-zinc-300">{doc.registration_serial}</span>
                          </div>
                        )}
                      </div>
                    </TableCell>

                    {/* Müşteri */}
                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-semibold text-zinc-200 text-sm">
                          {doc.customer
                            ? (isCensored ? "**** ****" : `${doc.customer.first_name} ${doc.customer.last_name}`)
                            : "-"}
                        </div>
                        <div className="text-xs text-zinc-500">
                          {doc.customer?.phone ? (isCensored ? "***********" : doc.customer.phone) : "-"}
                        </div>
                      </div>
                    </TableCell>

                    {/* Noter */}
                    <TableCell>
                      <div className="space-y-0.5 text-xs">
                        {doc.notary_name ? (
                          <>
                            <div className="font-medium text-zinc-300">{doc.notary_name}</div>
                            <div className="text-zinc-500">
                              {doc.notary_doc_no ? `Yevmiye: ${doc.notary_doc_no}` : ""}
                              {doc.notary_date ? ` • ${new Date(doc.notary_date).toLocaleDateString("tr-TR")}` : ""}
                            </div>
                          </>
                        ) : (
                          <span className="text-zinc-500 italic">Noter bilgisi girilmedi</span>
                        )}
                      </div>
                    </TableCell>

                    {/* Sigorta */}
                    <TableCell>
                      {doc.has_insurance ? (
                        <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-xs">
                          Sigortalı
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-zinc-500 border-zinc-700 text-xs">
                          Yok / Bekliyor
                        </Badge>
                      )}
                    </TableCell>

                    {/* Hızlı Aşama İlerleme Butonu */}
                    <TableCell className="text-center">
                      {doc.status === "notary_pending" && (
                        <Button
                          size="sm"
                          onClick={() => handleQuickAdvance(doc)}
                          className="h-8 bg-amber-500/15 hover:bg-amber-500/25 text-amber-400 border border-amber-500/30 text-xs font-semibold rounded-lg gap-1"
                        >
                          Noter Satışını Ver <ArrowRight className="h-3 w-3" />
                        </Button>
                      )}
                      {doc.status === "plate_pending" && (
                        <Button
                          size="sm"
                          onClick={() => handleQuickAdvance(doc)}
                          className="h-8 bg-blue-500/15 hover:bg-blue-500/25 text-blue-400 border border-blue-500/30 text-xs font-semibold rounded-lg gap-1"
                        >
                          Plaka Hazır <ArrowRight className="h-3 w-3" />
                        </Button>
                      )}
                      {doc.status === "ready_for_delivery" && (
                        <Button
                          size="sm"
                          onClick={() => handleQuickAdvance(doc)}
                          className="h-8 bg-purple-500/15 hover:bg-purple-500/25 text-purple-400 border border-purple-500/30 text-xs font-semibold rounded-lg gap-1"
                        >
                          Müşteriye Teslim Et <CheckCircle2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                      {doc.status === "delivered" && (
                        <span className="text-xs text-emerald-400/80 font-medium flex items-center justify-center gap-1">
                          <ShieldCheck className="h-4 w-4" /> Teslim Edildi
                        </span>
                      )}
                    </TableCell>

                    {/* İşlemler Dropdown */}
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-400 hover:text-zinc-100">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-zinc-900 border-zinc-800">
                          <DropdownMenuItem
                            onClick={() => handleEdit(doc)}
                            className="text-zinc-200 focus:bg-zinc-800 cursor-pointer"
                          >
                            <Pencil className="mr-2 h-4 w-4 text-blue-400" />
                            Evrak Bilgilerini Düzenle
                          </DropdownMenuItem>
                          <DropdownMenuSeparator className="bg-zinc-800" />
                          <DropdownMenuItem
                            onClick={() => setDeletingId(doc.id)}
                            className="text-red-400 focus:bg-red-500/10 focus:text-red-300 cursor-pointer"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Takibi Sil
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12 text-zinc-500">
                  <FileCheck2 className="h-10 w-10 mx-auto mb-3 opacity-30" />
                  <p className="text-sm font-medium">Kayıtlı evrak / noter takibi bulunamadı.</p>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Düzenleme Modalı */}
      <DocumentModal
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        document={editingDoc}
        onSuccess={fetchDocuments}
      />

      {/* Yeni Kayıt Modalı */}
      <NewDocumentModal
        open={newModalOpen}
        onOpenChange={setNewModalOpen}
        onSuccess={fetchDocuments}
      />

      {/* Silme Onay Dialogu */}
      <AlertDialog open={deletingId !== null} onOpenChange={(open) => !open && setDeletingId(null)}>
        <AlertDialogContent className="bg-zinc-900 border-zinc-800">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-zinc-100 flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-red-400" />
              Evrak Takibini Silmek İstediğinize Emin Misiniz?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-400">
              Bu motosikletin noter ve evrak takip geçmişi silinecektir. Motosiklet ve müşteri kaydı silinmez.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700">
              İptal
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Evet, Sil
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
