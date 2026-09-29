"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  ClipboardCheck,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Bike,
  Wrench,
  History,
  Trash2,
  Loader2,
  Check,
} from "lucide-react";
import { api, type DashboardStats, type StockAudit } from "@/lib/api";
import { customToast as toast } from "@/lib/toast";
import { cn } from "@/lib/utils";

interface StockAuditModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  stats: DashboardStats;
  onAuditSaved: () => void;
}

export function StockAuditModal({
  open,
  onOpenChange,
  stats,
  onAuditSaved,
}: StockAuditModalProps) {
  const [activeTab, setActiveTab] = useState<"new" | "history">("new");
  const [status, setStatus] = useState<"all_ok" | "issues_found">("all_ok");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [history, setHistory] = useState<StockAudit[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const loadHistory = async () => {
    setLoadingHistory(true);
    try {
      const data = await api.getStockAudits();
      setHistory(data);
    } catch {
      // Ignore error
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    if (open) {
      loadHistory();
    }
  }, [open]);

  const handleSave = async () => {
    setSubmitting(true);
    try {
      await api.createStockAudit({
        status,
        notes,
        motorcycle_count: stats.available_motorcycles,
        spare_part_count: stats.total_spare_parts_quantity,
      });
      toast.success("Haftalık stok kontrol kaydı veritabanına kaydedildi");
      setNotes("");
      setStatus("all_ok");
      onAuditSaved();
      await loadHistory();
      onOpenChange(false);
    } catch (e) {
      toast.error("Kontrol kaydı eklenirken hata oluştu");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await api.deleteStockAudit(id);
      toast.success("Kontrol kaydı silindi");
      loadHistory();
      onAuditSaved();
    } catch {
      toast.error("Silinirken hata oluştu");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-zinc-950 border-zinc-800 text-zinc-100 max-w-2xl max-h-[90vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-4 border-b border-zinc-800/80 bg-zinc-900/40">
          <DialogTitle className="text-xl font-bold flex items-center gap-2.5 text-zinc-100">
            <div className="p-2.5 bg-emerald-500/10 rounded-xl text-emerald-400">
              <ClipboardCheck className="h-6 w-6" />
            </div>
            Haftalık Stok Kontrolü & Envanter Sayımı
          </DialogTitle>
          <DialogDescription className="text-xs text-zinc-400 mt-1">
            Motosikletler ve yedek parçalar için haftalık fiziki sayım notlarınızı kaydedin ve veritabanına aktarın.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
            <TabsList className="bg-zinc-900 border border-zinc-800 p-1 rounded-xl w-full grid grid-cols-2 mb-6">
              <TabsTrigger value="new" className="rounded-lg gap-2 text-xs">
                <ClipboardCheck className="h-4 w-4" />
                Yeni Kontrol Kaydı
              </TabsTrigger>
              <TabsTrigger value="history" className="rounded-lg gap-2 text-xs">
                <History className="h-4 w-4" />
                Kontrol Geçmişi ({history.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="new" className="space-y-5 m-0 focus-visible:ring-0">
              {/* Anlık Envanter Özeti */}
              <div className="grid grid-cols-2 gap-3 p-3.5 bg-zinc-900/50 border border-zinc-800/80 rounded-2xl text-xs">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400">
                    <Bike className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-zinc-400">Mevcut Motosiklet</div>
                    <div className="text-sm font-bold text-zinc-100">{stats.available_motorcycles} / {stats.total_motorcycles} adet</div>
                  </div>
                </div>

                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-400">
                    <Wrench className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-zinc-400">Yedek Parça Stok</div>
                    <div className="text-sm font-bold text-zinc-100">{stats.total_spare_parts_quantity} adet</div>
                  </div>
                </div>
              </div>

              {/* Durum Seçimi */}
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-zinc-300">Stok & Envanter Durumu</Label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setStatus("all_ok")}
                    className={cn(
                      "flex items-center gap-3 p-3.5 rounded-2xl border text-left transition-all",
                      status === "all_ok"
                        ? "bg-emerald-500/10 border-emerald-500/50 text-emerald-300 shadow-md shadow-emerald-500/10"
                        : "bg-zinc-900/40 border-zinc-800/80 text-zinc-400 hover:bg-zinc-800/50"
                    )}
                  >
                    <div className={cn("p-2 rounded-xl", status === "all_ok" ? "bg-emerald-500/20 text-emerald-400" : "bg-zinc-800 text-zinc-500")}>
                      <CheckCircle2 className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="font-semibold text-xs text-zinc-100">Her Şey Eksiksiz & Tam</div>
                      <div className="text-[11px] text-zinc-500">Stok sayımı sorunsuz tamamlandı</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setStatus("issues_found")}
                    className={cn(
                      "flex items-center gap-3 p-3.5 rounded-2xl border text-left transition-all",
                      status === "issues_found"
                        ? "bg-amber-500/10 border-amber-500/50 text-amber-300 shadow-md shadow-amber-500/10"
                        : "bg-zinc-900/40 border-zinc-800/80 text-zinc-400 hover:bg-zinc-800/50"
                    )}
                  >
                    <div className={cn("p-2 rounded-xl", status === "issues_found" ? "bg-amber-500/20 text-amber-400" : "bg-zinc-800 text-zinc-500")}>
                      <AlertTriangle className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="font-semibold text-xs text-zinc-100">Eksik / Uyuşmazlık Var</div>
                      <div className="text-[11px] text-zinc-500">Açıklamaya detayları ekleyin</div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Notlar & Açıklama Textarea */}
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                  <FileText className="h-3.5 w-3.5 text-zinc-400" />
                  Kontrol Notları & Detay Açıklaması
                </Label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Örn: Tüm motor şasi numaraları fiziki olarak sayıldı ve doğrulandı. 2 adet MDX sinyal lambası eksik tespit edildi, sipariş geçildi."
                  className="bg-zinc-900/60 border-zinc-800 text-zinc-200 text-xs min-h-[100px] rounded-xl focus:border-emerald-500/50"
                />
              </div>

              <div className="pt-2">
                <Button
                  onClick={handleSave}
                  disabled={submitting}
                  className="w-full h-11 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs gap-2 transition-all shadow-lg shadow-emerald-600/20"
                >
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Check className="h-4 w-4" /> Stok Kontrolünü Veritabanına Kaydet</>}
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="history" className="m-0 focus-visible:ring-0">
              {loadingHistory ? (
                <div className="py-12 text-center text-zinc-500 text-xs">Yükleniyor...</div>
              ) : history.length > 0 ? (
                <div className="space-y-3">
                  {history.map((item) => {
                    const isOk = item.status === "all_ok";
                    const formattedDate = new Date(item.created_at).toLocaleString("tr-TR", {
                      day: "2-digit",
                      month: "long",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    });

                    return (
                      <div
                        key={item.id}
                        className="p-4 rounded-2xl bg-zinc-900/40 border border-zinc-800/80 space-y-2 relative group"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {isOk ? (
                              <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 gap-1 text-[11px] font-semibold">
                                <CheckCircle2 className="h-3.5 w-3.5" />
                                Eksiksiz & Tam
                              </Badge>
                            ) : (
                              <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30 gap-1 text-[11px] font-semibold">
                                <AlertTriangle className="h-3.5 w-3.5" />
                                Eksik / Sorun Var
                              </Badge>
                            )}
                            <span className="text-xs text-zinc-400 font-medium">{formattedDate}</span>
                          </div>

                          <button
                            onClick={() => handleDelete(item.id)}
                            className="p-1.5 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                            title="Kaydı Sil"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>

                        {item.notes ? (
                          <p className="text-xs text-zinc-300 bg-zinc-950/60 p-2.5 rounded-xl border border-zinc-800/60 leading-relaxed">
                            {item.notes}
                          </p>
                        ) : (
                          <p className="text-xs text-zinc-500 italic">Açıklama girilmedi.</p>
                        )}

                        <div className="flex items-center gap-4 text-[11px] text-zinc-500 pt-1">
                          <span>Motosiklet: <strong>{item.motorcycle_count}</strong></span>
                          <span>•</span>
                          <span>Yedek Parça: <strong>{item.spare_part_count}</strong></span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-12 text-center text-zinc-500 text-xs">
                  Henüz kayıtlı bir stok kontrolü bulunmuyor.
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}
