"use client"

import React from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { type ContractRecord, api } from "@/lib/api"
import { printContract, type ContractData } from "./contract-print"
import {
  Printer,
  FileSignature,
  Building2,
  User,
  Bike,
  FileText,
  CheckCircle2,
  Calendar,
  Hash,
  MapPin,
  Phone,
  CreditCard,
} from "lucide-react"

interface ContractDetailModalProps {
  contract: ContractRecord | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ContractDetailModal({
  contract,
  open,
  onOpenChange,
}: ContractDetailModalProps) {
  if (!contract) return null

  const formattedDate = contract.contract_date
    ? new Date(contract.contract_date).toLocaleDateString("tr-TR", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      })
    : contract.contract_date

  const contractData: ContractData = {
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

  const handlePrint = () => {
    printContract(contractData)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-zinc-950 border-zinc-800 text-zinc-100 max-w-4xl max-h-[90vh] flex flex-col p-0 overflow-hidden">
        {/* HEADER BAR */}
        <DialogHeader className="p-5 pb-4 border-b border-zinc-800/80 bg-zinc-900/60 flex flex-row items-center justify-between">
          <div className="space-y-1">
            <DialogTitle className="text-lg font-bold flex items-center gap-2 text-zinc-100">
              <FileSignature className="h-5 w-5 text-blue-500" />
              Sözleşme Detayı & Dijital Belge
            </DialogTitle>
            <DialogDescription className="text-xs text-zinc-400 flex items-center gap-3">
              <span className="flex items-center gap-1">
                <Hash className="h-3.5 w-3.5 text-blue-400" />
                <span className="font-mono text-zinc-300 font-semibold">{contract.contract_no}</span>
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5 text-emerald-400" />
                {formattedDate}
              </span>
            </DialogDescription>
          </div>

          <div className="flex items-center gap-2 pr-6">
            <Button
              type="button"
              onClick={handlePrint}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold flex items-center gap-2 text-xs h-9 px-4 rounded-xl shadow-md shadow-blue-600/20"
            >
              <Printer className="h-4 w-4" />
              Tekrar Yazdır / PDF Al
            </Button>
          </div>
        </DialogHeader>

        {/* BODY SCROLL AREA */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-zinc-950 text-xs">
          {/* FIRMA VE SÖZLEŞME KÜNYESİ */}
          <div className="bg-zinc-900/40 border border-zinc-800/70 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="text-sm font-bold text-zinc-200 flex items-center gap-1.5">
                <Building2 className="h-4 w-4 text-blue-400" />
                {contract.company_name || "STOKAJ MOTOSİKLET"}
              </div>
              <p className="text-zinc-400 text-xs mt-1 leading-relaxed">
                {contract.company_address || "-"}
              </p>
            </div>
            <div className="text-left sm:text-right text-zinc-400 text-xs space-y-1">
              <div><strong>V.D. / V.No:</strong> {contract.company_tax_office || "-"} {contract.company_tax_no || ""}</div>
              <div><strong>Yetkili:</strong> {contract.company_authorized || "-"}</div>
              <div><strong>Tel:</strong> {contract.company_phone || "-"}</div>
            </div>
          </div>

          {/* 2 COLUMNS: CUSTOMER & VEHICLE */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* MÜŞTERİ BİLGİLERİ */}
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 space-y-3">
              <h3 className="text-sm font-semibold text-emerald-400 flex items-center gap-2 border-b border-zinc-800 pb-2">
                <User className="h-4 w-4" />
                Müşteri / Alıcı Bilgileri
              </h3>
              <div className="space-y-2 text-zinc-300">
                <div className="flex justify-between">
                  <span className="text-zinc-500">Adı Soyadı:</span>
                  <span className="font-semibold text-zinc-100">{contract.customer_name || "-"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">T.C. / Vergi No:</span>
                  <span className="font-mono text-zinc-200">{contract.customer_identity || "-"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Telefon:</span>
                  <span className="text-zinc-200">{contract.customer_phone || "-"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Adres:</span>
                  <span className="text-zinc-300 text-right max-w-[220px]">{contract.customer_address || "-"}</span>
                </div>
              </div>
            </div>

            {/* TESLİM EDİLEN ARAÇ BİLGİLERİ */}
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 space-y-3">
              <h3 className="text-sm font-semibold text-blue-400 flex items-center gap-2 border-b border-zinc-800 pb-2">
                <Bike className="h-4 w-4" />
                Teslim Edilen Araç Bilgileri
              </h3>
              <div className="space-y-2 text-zinc-300">
                <div className="flex justify-between">
                  <span className="text-zinc-500">Marka / Model:</span>
                  <span className="font-semibold text-zinc-100">{contract.vehicle_brand} {contract.vehicle_model}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Şasi No (VIN):</span>
                  <span className="font-mono text-blue-300 font-bold tracking-wide">{contract.vehicle_chassis || "-"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Motor No / Yıl:</span>
                  <span className="text-zinc-200">{contract.vehicle_engine_no || "-"} / {contract.vehicle_year || "-"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Renk / Km / Konum:</span>
                  <span className="text-zinc-200">{contract.vehicle_color || "-"} / {contract.vehicle_km || "0"} KM / {contract.vehicle_location || "Merkez"}</span>
                </div>
              </div>
            </div>
          </div>

          {/* KİMLİK GÖRSELLERİ (ÖN / ARKA) */}
          {(contract.id_card_front || contract.id_card_back) && (
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 space-y-3">
              <h3 className="text-xs font-semibold text-amber-400 flex items-center gap-2 border-b border-zinc-800 pb-2">
                <CreditCard className="h-4 w-4" />
                Müşteri Kimlik Kartı Görselleri (Dijital Tescil)
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                {contract.id_card_front && (
                  <div className="space-y-1.5 text-center">
                    <span className="text-[11px] font-medium text-zinc-400">Kimlik Ön Yüzü</span>
                    <div className="border border-zinc-800 rounded-lg p-2 bg-zinc-950 flex items-center justify-center">
                      <img
                        src={contract.id_card_front}
                        alt="Kimlik Ön Yüzü"
                        className="max-h-44 object-contain rounded"
                      />
                    </div>
                  </div>
                )}
                {contract.id_card_back && (
                  <div className="space-y-1.5 text-center">
                    <span className="text-[11px] font-medium text-zinc-400">Kimlik Arka Yüzü</span>
                    <div className="border border-zinc-800 rounded-lg p-2 bg-zinc-950 flex items-center justify-center">
                      <img
                        src={contract.id_card_back}
                        alt="Kimlik Arka Yüzü"
                        className="max-h-44 object-contain rounded"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* SÖZLEŞME MADDELERİ */}
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 space-y-3">
            <h3 className="text-xs font-semibold text-zinc-300 flex items-center gap-2 border-b border-zinc-800 pb-2">
              <FileText className="h-4 w-4 text-purple-400" />
              Sözleşme Maddeleri & Şartlar
            </h3>
            <div className="space-y-2 text-zinc-300 leading-relaxed">
              <p><strong>1. Eksiksiz Teslimat:</strong> Alıcı; aracı, anahtarlarını, şarj aletini ve evraklarını bizzat kontrol etmiş, eksiksiz, hasarsız ve çalışır durumda teslim almıştır.</p>
              <p><strong>2. Servis Ve Garanti:</strong> Araç üretici garantisindedir. Arıza, bakım ve garanti işlemleri Yetkili Servisler tarafından yapılır; satıcı firmanın tamir yükümlülüğü yoktur.</p>
              <p><strong>3. Nakliye Ve Çekici:</strong> Teslimat sonrası aracın servise götürülmesi/getirilmesi satıcının sorumluluğunda değildir. Nakliye/çekici masrafları alıcıya aittir.</p>
              <p><strong>4. Kullanıcı Hatası Ve Parça Temini:</strong> Düşme/kaza kaynaklı parça kırılmaları ve kayıplar garanti dışıdır. İhtiyaç halinde parçalar ücreti karşılığında satıcıdan sipariş edilebilir.</p>
              <p><strong>5. Hukuki Ve Trafik Sorumluluğu:</strong> Teslim anından itibaren araca ait her türlü kaza, trafik cezası, idari ve hukuki sorumluluk alıcıya aittir.</p>
              <p className="text-amber-300/90"><strong>6. Ödeme Ve Kart Sorumluluğu:</strong> İşlemde kullanılan ödeme kartı aracı teslim alana ait olmasa dahi tüm hukuki ve mali sorumluluk kartı ibraz eden ve aracı teslim alan kişiye aittir. Kart sahibine ulaşmayan onay mesajlarından firmamız sorumlu tutulamaz.</p>
              {contract.special_notes && (
                <p className="text-purple-300 pt-1 border-t border-zinc-800/80"><strong>7. Özel Notlar:</strong> {contract.special_notes}</p>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
