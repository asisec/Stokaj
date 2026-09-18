"use client"

import React, { useEffect, useState, useCallback } from "react"
import Link from "next/link"
import { api, type ContractRecord } from "@/lib/api"
import { printContract, type ContractData } from "@/components/contracts/contract-print"
import { ContractDetailModal } from "@/components/contracts/contract-detail-modal"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { customToast as toast } from "@/lib/toast"
import {
  FileSignature,
  FileCheck,
  Search,
  Printer,
  Eye,
  Trash2,
  Plus,
  Building2,
  User,
  Bike,
  Calendar,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  FileText,
} from "lucide-react"

export default function ContractsHistoryPage() {
  const [contracts, setContracts] = useState<ContractRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")

  const [selectedContract, setSelectedContract] = useState<ContractRecord | null>(null)
  const [modalOpen, setModalOpen] = useState(false)

  const [confirmOpen, setConfirmOpen] = useState(false)
  const [deletingId, setDeletingId] = useState<number | null>(null)

  const fetchContracts = useCallback(async () => {
    setLoading(true)
    try {
      const data = await api.getContracts(searchQuery)
      setContracts(data || [])
    } catch {
      toast.error("Sözleşmeler yüklenirken hata oluştu")
    } finally {
      setLoading(false)
    }
  }, [searchQuery])

  useEffect(() => {
    fetchContracts()
  }, [fetchContracts])

  const handleView = (contract: ContractRecord) => {
    setSelectedContract(contract)
    setModalOpen(true)
  }

  const handlePrint = (contract: ContractRecord) => {
    const data: ContractData = {
      contractDate: contract.contract_date,
      contractNo: contract.contract_no,
      companyName: contract.company_name,
      companyAddress: contract.company_address,
      companyTaxOffice: contract.company_tax_office,
      companyTaxNo: contract.company_tax_no,
      companyPhone: contract.company_phone,
      companyAuthorized: contract.company_authorized,
      customerName: contract.customer_name,
      customerIdentity: contract.customer_identity,
      customerPhone: contract.customer_phone,
      customerAddress: contract.customer_address,
      vehicleBrand: contract.vehicle_brand,
      vehicleModel: contract.vehicle_model,
      vehicleYear: contract.vehicle_year,
      vehicleColor: contract.vehicle_color,
      vehicleChassis: contract.vehicle_chassis,
      vehicleEngineNo: contract.vehicle_engine_no,
      vehicleKm: contract.vehicle_km,
      vehicleLocation: contract.vehicle_location,
      idCardFront: contract.id_card_front,
      idCardBack: contract.id_card_back,
      specialNotes: contract.special_notes,
    }
    printContract(data)
  }

  const handleDeleteClick = (id: number) => {
    setDeletingId(id)
    setConfirmOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (deletingId === null) return
    try {
      await api.deleteContract(deletingId)
      toast.success("Sözleşme kaydı başarıyla silindi")
      fetchContracts()
    } catch {
      toast.error("Sözleşme silinirken hata oluştu")
    } finally {
      setDeletingId(null)
      setConfirmOpen(false)
    }
  }

  const totalCount = contracts.length
  const withIdCardsCount = contracts.filter((c) => c.id_card_front || c.id_card_back).length
  const thisMonthCount = contracts.filter((c) => {
    if (!c.contract_date) return false
    const d = new Date(c.contract_date)
    const now = new Date()
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
  }).length

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 sm:p-6 pb-16">
      {/* HEADER BAR */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-card/60 backdrop-blur-md p-5 rounded-2xl border border-border shadow-sm">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <FileCheck className="h-6 w-6 text-emerald-500" />
            Dijital Müşteri Sözleşmeleri Arşivi
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Oluşturulan ve yazdırılan tüm müşteri sözleşmelerine dijital olarak erişin, görüntüleyin ve tekrar yazdırın.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Link href="/contracts">
            <Button className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-semibold flex items-center justify-center gap-2 px-5 py-5 rounded-xl text-sm shadow-md shadow-blue-500/20">
              <Plus className="h-4 w-4" />
              Yeni Sözleşme Oluştur
            </Button>
          </Link>
        </div>
      </div>

      {/* STATS CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-xl p-4 flex items-center gap-4">
          <div className="p-3 bg-blue-500/10 rounded-xl border border-blue-500/20 text-blue-400">
            <FileText className="h-5 w-5" />
          </div>
          <div>
            <div className="text-xs text-zinc-400 font-medium">Toplam Kayıtlı Sözleşme</div>
            <div className="text-xl font-bold text-zinc-100">{totalCount}</div>
          </div>
        </div>

        <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-xl p-4 flex items-center gap-4">
          <div className="p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/20 text-emerald-400">
            <CreditCard className="h-5 w-5" />
          </div>
          <div>
            <div className="text-xs text-zinc-400 font-medium">Kimlik Görselli Sözleşmeler</div>
            <div className="text-xl font-bold text-emerald-400">{withIdCardsCount}</div>
          </div>
        </div>

        <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-xl p-4 flex items-center gap-4">
          <div className="p-3 bg-purple-500/10 rounded-xl border border-purple-500/20 text-purple-400">
            <Calendar className="h-5 w-5" />
          </div>
          <div>
            <div className="text-xs text-zinc-400 font-medium">Bu Ay Oluşturulanlar</div>
            <div className="text-xl font-bold text-purple-300">{thisMonthCount}</div>
          </div>
        </div>
      </div>

      {/* SEARCH BAR */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
        <Input
          placeholder="Müşteri adı, T.C. kimlik no, sözleşme no veya araç şasi no ara..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 h-10 bg-zinc-900/50 border-zinc-800 text-zinc-200 placeholder:text-zinc-600 focus:border-zinc-700 rounded-xl"
        />
      </div>

      {/* CONTRACTS LIST TABLE */}
      <div className="border border-zinc-800/70 rounded-2xl bg-zinc-950/40 overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-12 text-center text-zinc-500 text-xs">
            Sözleşmeler yükleniyor...
          </div>
        ) : contracts.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <FileSignature className="h-10 w-10 text-zinc-600 mx-auto" />
            <div className="text-sm font-semibold text-zinc-300">
              Henüz kayıtlı bir dijital sözleşme bulunamadı
            </div>
            <p className="text-xs text-zinc-500 max-w-md mx-auto">
              Sözleşme oluşturma ekranından bir sözleşme yazdırdığınızda veya PDF aldığınızda otomatik olarak buraya kaydedilir.
            </p>
            <Link href="/contracts" className="inline-block pt-2">
              <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-xs">
                Sözleşme Oluştur
              </Button>
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-900/60 text-zinc-400 font-semibold border-b border-zinc-800/80 uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3.5 px-4">Sözleşme No & Tarih</th>
                  <th className="py-3.5 px-4">Müşteri / Alıcı</th>
                  <th className="py-3.5 px-4">Teslim Edilen Araç</th>
                  <th className="py-3.5 px-4">Kimlik Belgesi</th>
                  <th className="py-3.5 px-4 text-right">İşlemler</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/50 text-zinc-300">
                {contracts.map((c) => (
                  <tr key={c.id} className="hover:bg-zinc-900/40 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-mono font-bold text-blue-400">{c.contract_no}</div>
                      <div className="text-[11px] text-zinc-500 mt-0.5">{c.contract_date}</div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-zinc-200">{c.customer_name || "-"}</div>
                      <div className="text-[11px] text-zinc-500 font-mono">
                        {c.customer_identity ? `TC: ${c.customer_identity}` : c.customer_phone || "-"}
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-medium text-zinc-200">
                        {c.vehicle_brand} {c.vehicle_model}
                      </div>
                      <div className="text-[11px] text-zinc-500 font-mono tracking-wide">
                        {c.vehicle_chassis || "-"}
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      {c.id_card_front && c.id_card_back ? (
                        <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30 gap-1 text-[10px]">
                          <CheckCircle2 className="h-3 w-3" />
                          Ön & Arka Var
                        </Badge>
                      ) : c.id_card_front || c.id_card_back ? (
                        <Badge className="bg-amber-500/15 text-amber-400 border-amber-500/30 gap-1 text-[10px]">
                          <CheckCircle2 className="h-3 w-3" />
                          Tek Yüz Var
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="border-zinc-800 text-zinc-500 text-[10px]">
                          Görsel Yok
                        </Badge>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleView(c)}
                          className="h-8 text-xs gap-1.5 border-zinc-800 hover:bg-zinc-800 text-zinc-200"
                        >
                          <Eye className="h-3.5 w-3.5 text-blue-400" />
                          Görüntüle
                        </Button>

                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handlePrint(c)}
                          className="h-8 text-xs gap-1.5 border-zinc-800 hover:bg-zinc-800 text-zinc-300"
                          title="Tekrar Yazdır"
                        >
                          <Printer className="h-3.5 w-3.5 text-emerald-400" />
                          Yazdır
                        </Button>

                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteClick(c.id)}
                          className="h-8 w-8 text-zinc-500 hover:text-red-400 hover:bg-red-500/10"
                          title="Sil"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* DETAIL MODAL */}
      <ContractDetailModal
        contract={selectedContract}
        open={modalOpen}
        onOpenChange={setModalOpen}
      />

      {/* CONFIRM DELETE DIALOG */}
      <ConfirmDialog
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Sözleşmeyi Sil"
        description="Bu dijital sözleşme kaydını silmek istediğinizden emin misiniz? Bu işlem geri alınamaz."
      />
    </div>
  )
}
