"use client"

import React, { useState, useEffect, useRef } from "react"
import {
  FileSignature,
  Printer,
  Upload,
  RotateCw,
  Sparkles,
  Building2,
  User,
  Bike,
  FileText,
  Trash2,
  CheckCircle2,
  HelpCircle,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { api, type Customer, type Motorcycle } from "@/lib/api"
import { processIdCardImage } from "@/lib/image-processing"
import { printContract, type ContractData } from "./contract-print"

const DEFAULT_COMPANY_KEY = "stokaj_contract_company_info"

export function ContractForm() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [motorcycles, setMotorcycles] = useState<Motorcycle[]>([])
  const [loading, setLoading] = useState(true)

  const [contractNo, setContractNo] = useState("")
  const [contractDate, setContractDate] = useState("")

  const [companyName, setCompanyName] = useState("STOKAJ MOTOSİKLET")
  const [companyAddress, setCompanyAddress] = useState("Bağdat Cad. No: 124 Kadıköy / İstanbul")
  const [companyTaxOffice, setCompanyTaxOffice] = useState("Kadıköy V.D.")
  const [companyTaxNo, setCompanyTaxNo] = useState("1234567890")
  const [companyPhone, setCompanyPhone] = useState("0216 555 00 00")
  const [companyAuthorized, setCompanyAuthorized] = useState("Firma Yetkilisi")

  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("")
  const [customerName, setCustomerName] = useState("")
  const [customerIdentity, setCustomerIdentity] = useState("")
  const [customerPhone, setCustomerPhone] = useState("")
  const [customerAddress, setCustomerAddress] = useState("")

  const [selectedMotorcycleId, setSelectedMotorcycleId] = useState<string>("")
  const [vehicleBrand, setVehicleBrand] = useState("")
  const [vehicleModel, setVehicleModel] = useState("")
  const [vehicleYear, setVehicleYear] = useState("")
  const [vehicleColor, setVehicleColor] = useState("")
  const [vehicleChassis, setVehicleChassis] = useState("")
  const [vehicleEngineNo, setVehicleEngineNo] = useState("")
  const [vehicleKm, setVehicleKm] = useState("0")
  const [vehicleLocation, setVehicleLocation] = useState("Merkez")

  const [idFrontRaw, setIdFrontRaw] = useState<string | null>(null)
  const [idFrontProcessed, setIdFrontProcessed] = useState<string | null>(null)
  const [frontRotation, setFrontRotation] = useState(0)
  const [isProcessingFront, setIsProcessingFront] = useState(false)

  const [idBackRaw, setIdBackRaw] = useState<string | null>(null)
  const [idBackProcessed, setIdBackProcessed] = useState<string | null>(null)
  const [backRotation, setBackRotation] = useState(0)
  const [isProcessingBack, setIsProcessingBack] = useState(false)

  const [autoClean, setAutoClean] = useState(true)
  const [specialNotes, setSpecialNotes] = useState("")

  const frontInputRef = useRef<HTMLInputElement>(null)
  const backInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const today = new Date().toISOString().split("T")[0]
    setContractDate(today)
    setContractNo("SZL-" + Math.floor(100000 + Math.random() * 900000))

    try {
      const savedCompany = localStorage.getItem(DEFAULT_COMPANY_KEY)
      if (savedCompany) {
        const parsed = JSON.parse(savedCompany)
        if (parsed.companyName) setCompanyName(parsed.companyName)
        if (parsed.companyAddress) setCompanyAddress(parsed.companyAddress)
        if (parsed.companyTaxOffice) setCompanyTaxOffice(parsed.companyTaxOffice)
        if (parsed.companyTaxNo) setCompanyTaxNo(parsed.companyTaxNo)
        if (parsed.companyPhone) setCompanyPhone(parsed.companyPhone)
        if (parsed.companyAuthorized) setCompanyAuthorized(parsed.companyAuthorized)
      }
    } catch {
      // Ignore localstorage errors
    }

    async function loadData() {
      try {
        const [cList, mList] = await Promise.all([
          api.getCustomers().catch(() => []),
          api.getMotorcycles().catch(() => []),
        ])
        setCustomers(cList || [])
        setMotorcycles(mList || [])
      } catch {
        toast.error("Veriler yüklenirken hata oluştu")
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  const saveCompanyInfo = () => {
    try {
      const data = {
        companyName,
        companyAddress,
        companyTaxOffice,
        companyTaxNo,
        companyPhone,
        companyAuthorized,
      }
      localStorage.setItem(DEFAULT_COMPANY_KEY, JSON.stringify(data))
      toast.success("Firma bilgileri varsayılan olarak kaydedildi")
    } catch {
      toast.error("Firma bilgileri kaydedilemedi")
    }
  }

  const handleCustomerSelect = (custId: string) => {
    setSelectedCustomerId(custId)
    const found = customers.find((c) => c.id.toString() === custId)
    if (found) {
      setCustomerName(`${found.first_name} ${found.last_name}`.trim())
      setCustomerIdentity(found.identity_number || "")
      setCustomerPhone(found.phone || "")
      setCustomerAddress(found.address || "")
    }
  }

  const handleMotorcycleSelect = (motoId: string) => {
    setSelectedMotorcycleId(motoId)
    const found = motorcycles.find((m) => m.id.toString() === motoId)
    if (found) {
      setVehicleBrand(found.brand || "")
      setVehicleModel(found.model || "")
      setVehicleYear(found.year ? found.year.toString() : "")
      setVehicleColor(found.color || "")
      setVehicleChassis(found.chassis_number || "")
      setVehicleLocation(
        found.is_other_branch && found.branch_name ? found.branch_name : "Merkez"
      )
    }
  }

  const handleFrontUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsProcessingFront(true)
    try {
      const reader = new FileReader()
      reader.onload = async (event) => {
        const rawUrl = event.target?.result as string
        setIdFrontRaw(rawUrl)
        setFrontRotation(0)

        if (autoClean) {
          const processed = await processIdCardImage(rawUrl, {
            autoCrop: true,
            cleanBackground: true,
            rotation: 0,
          })
          setIdFrontProcessed(processed)
        } else {
          setIdFrontProcessed(rawUrl)
        }
        setIsProcessingFront(false)
        toast.success("Kimlik ön yüzü yüklendi ve işlendi")
      }
      reader.readAsDataURL(file)
    } catch {
      setIsProcessingFront(false)
      toast.error("Kimlik görseli işlenirken bir hata oluştu")
    }
  }

  const handleBackUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsProcessingBack(true)
    try {
      const reader = new FileReader()
      reader.onload = async (event) => {
        const rawUrl = event.target?.result as string
        setIdBackRaw(rawUrl)
        setBackRotation(0)

        if (autoClean) {
          const processed = await processIdCardImage(rawUrl, {
            autoCrop: true,
            cleanBackground: true,
            rotation: 0,
          })
          setIdBackProcessed(processed)
        } else {
          setIdBackProcessed(rawUrl)
        }
        setIsProcessingBack(false)
        toast.success("Kimlik arka yüzü yüklendi ve işlendi")
      }
      reader.readAsDataURL(file)
    } catch {
      setIsProcessingBack(false)
      toast.error("Kimlik görseli işlenirken bir hata oluştu")
    }
  }

  const rotateFront = async () => {
    if (!idFrontRaw) return
    const nextRot = (frontRotation + 90) % 360
    setFrontRotation(nextRot)
    setIsProcessingFront(true)
    try {
      const processed = await processIdCardImage(idFrontRaw, {
        autoCrop: autoClean,
        cleanBackground: autoClean,
        rotation: nextRot,
      })
      setIdFrontProcessed(processed)
    } finally {
      setIsProcessingFront(false)
    }
  }

  const rotateBack = async () => {
    if (!idBackRaw) return
    const nextRot = (backRotation + 90) % 360
    setBackRotation(nextRot)
    setIsProcessingBack(true)
    try {
      const processed = await processIdCardImage(idBackRaw, {
        autoCrop: autoClean,
        cleanBackground: autoClean,
        rotation: nextRot,
      })
      setIdBackProcessed(processed)
    } finally {
      setIsProcessingBack(false)
    }
  }

  const buildContractData = (): ContractData => {
    return {
      contractDate,
      contractNo,
      companyName,
      companyAddress,
      companyTaxOffice,
      companyTaxNo,
      companyPhone,
      companyAuthorized,
      customerName,
      customerIdentity,
      customerPhone,
      customerAddress,
      vehicleBrand,
      vehicleModel,
      vehicleYear,
      vehicleColor,
      vehicleChassis,
      vehicleEngineNo,
      vehicleKm,
      vehicleLocation,
      idCardFront: idFrontProcessed,
      idCardBack: idBackProcessed,
      specialNotes,
    }
  }

  const handlePrint = () => {
    if (!customerName.trim()) {
      toast.warning("Lütfen müşteri adını girin veya seçin")
      return
    }
    if (!vehicleChassis.trim() && !vehicleModel.trim()) {
      toast.warning("Lütfen teslim edilecek araç bilgisini girin veya seçin")
      return
    }

    const data = buildContractData()
    printContract(data)
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* ACTION BAR */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-card/60 backdrop-blur-md p-4 rounded-2xl border border-border shadow-sm">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <FileSignature className="h-6 w-6 text-blue-500" />
            Müşteri Satış & Teslim Sözleşmesi
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Otomatik kimlik hizalama, temizleme ve kurumsal A4 PDF çıktısı
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Button
            type="button"
            onClick={handlePrint}
            className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold flex items-center justify-center gap-2 shadow-md shadow-blue-500/20 px-6 py-5 rounded-xl text-sm"
          >
            <Printer className="h-5 w-5" />
            Sözleşmeyi Yazdır / PDF Al
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT 2 COLS: FORMS */}
        <div className="lg:col-span-2 space-y-6">
          {/* SÖZLEŞME GENEL & FİRMA BİLGİLERİ */}
          <Card className="border-border shadow-sm">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-blue-500" />
                  Sözleşme & Satıcı Firma Bilgileri
                </CardTitle>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={saveCompanyInfo}
                  className="text-xs h-7"
                >
                  Firma Bilgilerini Kaydet
                </Button>
              </div>
              <CardDescription className="text-xs">
                Sözleşmede yer alacak resmi bayi ve evrak bilgileri
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs font-semibold">Sözleşme No</Label>
                  <Input
                    value={contractNo}
                    onChange={(e) => setContractNo(e.target.value)}
                    placeholder="SZL-0001"
                    className="h-9 text-sm mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs font-semibold">Sözleşme / Teslim Tarihi</Label>
                  <Input
                    type="date"
                    value={contractDate}
                    onChange={(e) => setContractDate(e.target.value)}
                    className="h-9 text-sm mt-1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs font-semibold">Firma Ünvanı</Label>
                  <Input
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="Bayi / Firma Adı"
                    className="h-9 text-sm mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs font-semibold">Firma Telefonu</Label>
                  <Input
                    value={companyPhone}
                    onChange={(e) => setCompanyPhone(e.target.value)}
                    placeholder="0212 ..."
                    className="h-9 text-sm mt-1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs font-semibold">Vergi Dairesi & No</Label>
                  <div className="flex gap-2 mt-1">
                    <Input
                      value={companyTaxOffice}
                      onChange={(e) => setCompanyTaxOffice(e.target.value)}
                      placeholder="Vergi Dairesi"
                      className="h-9 text-sm w-1/2"
                    />
                    <Input
                      value={companyTaxNo}
                      onChange={(e) => setCompanyTaxNo(e.target.value)}
                      placeholder="Vergi No"
                      className="h-9 text-sm w-1/2"
                    />
                  </div>
                </div>
                <div>
                  <Label className="text-xs font-semibold">Yetkili Adı Soyadı</Label>
                  <Input
                    value={companyAuthorized}
                    onChange={(e) => setCompanyAuthorized(e.target.value)}
                    placeholder="Yetkili Kişi"
                    className="h-9 text-sm mt-1"
                  />
                </div>
              </div>

              <div>
                <Label className="text-xs font-semibold">Firma Adresi</Label>
                <Input
                  value={companyAddress}
                  onChange={(e) => setCompanyAddress(e.target.value)}
                  placeholder="Açık adres..."
                  className="h-9 text-sm mt-1"
                />
              </div>
            </CardContent>
          </Card>

          {/* MÜŞTERİ BİLGİLERİ */}
          <Card className="border-border shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-base flex items-center gap-2">
                <User className="h-4 w-4 text-emerald-500" />
                Müşteri / Alıcı Bilgileri
              </CardTitle>
              <CardDescription className="text-xs">
                Mevcut kayıtlı müşterilerden seçebilir veya doğrudan doldurabilirsiniz
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {customers.length > 0 && (
                <div>
                  <Label className="text-xs font-semibold text-muted-foreground">
                    Kayıtlı Müşteriden Hızlı Seç
                  </Label>
                  <Select value={selectedCustomerId} onValueChange={handleCustomerSelect}>
                    <SelectTrigger className="h-9 text-sm mt-1 bg-zinc-900/50">
                      <SelectValue placeholder="Müşteri seçiniz..." />
                    </SelectTrigger>
                    <SelectContent>
                      {customers.map((c) => (
                        <SelectItem key={c.id} value={c.id.toString()}>
                          {c.first_name} {c.last_name} {c.identity_number ? `(${c.identity_number})` : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs font-semibold">Müşteri Adı Soyadı *</Label>
                  <Input
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Ad Soyad"
                    className="h-9 text-sm mt-1 font-medium"
                  />
                </div>
                <div>
                  <Label className="text-xs font-semibold">T.C. Kimlik / Vergi No</Label>
                  <Input
                    value={customerIdentity}
                    onChange={(e) => setCustomerIdentity(e.target.value)}
                    placeholder="11 haneli TCKN"
                    maxLength={11}
                    className="h-9 text-sm mt-1 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs font-semibold">Telefon Numarası</Label>
                  <Input
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="05..."
                    className="h-9 text-sm mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs font-semibold">İkametgah / Teslimat Adresi</Label>
                  <Input
                    value={customerAddress}
                    onChange={(e) => setCustomerAddress(e.target.value)}
                    placeholder="Açık ikametgah adresi"
                    className="h-9 text-sm mt-1"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* TESLİM EDİLEN ARAÇ BİLGİLERİ */}
          <Card className="border-border shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-base flex items-center gap-2">
                <Bike className="h-4 w-4 text-blue-500" />
                Teslim Edilen Araç Bilgileri
              </CardTitle>
              <CardDescription className="text-xs">
                Envanterdeki motosikletlerden seçebilir veya elle girebilirsiniz
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {motorcycles.length > 0 && (
                <div>
                  <Label className="text-xs font-semibold text-muted-foreground">
                    Envanterden Araç Seç
                  </Label>
                  <Select value={selectedMotorcycleId} onValueChange={handleMotorcycleSelect}>
                    <SelectTrigger className="h-9 text-sm mt-1 bg-zinc-900/50">
                      <SelectValue placeholder="Motosiklet seçiniz..." />
                    </SelectTrigger>
                    <SelectContent>
                      {motorcycles.map((m) => (
                        <SelectItem key={m.id} value={m.id.toString()}>
                          {m.brand} {m.model} - {m.chassis_number} ({m.color})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <Label className="text-xs font-semibold">Marka</Label>
                  <Input
                    value={vehicleBrand}
                    onChange={(e) => setVehicleBrand(e.target.value)}
                    placeholder="Örn: CFMOTO"
                    className="h-9 text-sm mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs font-semibold">Model</Label>
                  <Input
                    value={vehicleModel}
                    onChange={(e) => setVehicleModel(e.target.value)}
                    placeholder="Örn: 250 NK"
                    className="h-9 text-sm mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs font-semibold">Model Yılı</Label>
                  <Input
                    value={vehicleYear}
                    onChange={(e) => setVehicleYear(e.target.value)}
                    placeholder="2024"
                    className="h-9 text-sm mt-1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <Label className="text-xs font-semibold">Şasi Numarası (VIN) *</Label>
                  <Input
                    value={vehicleChassis}
                    onChange={(e) => setVehicleChassis(e.target.value.toUpperCase())}
                    placeholder="17 haneli şasi no"
                    className="h-9 text-sm mt-1 font-mono tracking-wide"
                  />
                </div>
                <div>
                  <Label className="text-xs font-semibold">Renk</Label>
                  <Input
                    value={vehicleColor}
                    onChange={(e) => setVehicleColor(e.target.value)}
                    placeholder="Siyah / Mavi"
                    className="h-9 text-sm mt-1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <Label className="text-xs font-semibold">Motor No</Label>
                  <Input
                    value={vehicleEngineNo}
                    onChange={(e) => setVehicleEngineNo(e.target.value)}
                    placeholder="Motor Seri No"
                    className="h-9 text-sm mt-1 font-mono"
                  />
                </div>
                <div>
                  <Label className="text-xs font-semibold">Teslim Kilometresi</Label>
                  <Input
                    value={vehicleKm}
                    onChange={(e) => setVehicleKm(e.target.value)}
                    placeholder="0"
                    className="h-9 text-sm mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs font-semibold">Teslim Konumu</Label>
                  <Input
                    value={vehicleLocation}
                    onChange={(e) => setVehicleLocation(e.target.value)}
                    placeholder="Merkez"
                    className="h-9 text-sm mt-1"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* ÖZEL NOTLAR & SÖZLEŞME MADDELERİ ÖNİZLEMESİ */}
          <Card className="border-border shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="h-4 w-4 text-purple-500" />
                Sözleşme Maddeleri & Ek Açıklamalar
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-xs text-muted-foreground">
              <div className="bg-zinc-900/60 p-3 rounded-lg border border-border/60 space-y-2">
                <p className="flex items-start gap-1.5 text-zinc-300">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 mt-0.5 shrink-0" />
                  <span>
                    <strong>Eksiksiz Teslim:</strong> Araç, anahtarları, şarj aletleri ve resmi belgeleri ile eksiksiz teslim alınmıştır.
                  </span>
                </p>
                <p className="flex items-start gap-1.5 text-zinc-300">
                  <CheckCircle2 className="h-3.5 w-3.5 text-blue-400 mt-0.5 shrink-0" />
                  <span>
                    <strong>Yetkili Servis & Arıza Sorumluluğu:</strong> Garanti münhasıran yetkili servislere aittir, satıcı teknik/arıza sorumluluğu taşımaz.
                  </span>
                </p>
                <p className="flex items-start gap-1.5 text-zinc-300">
                  <CheckCircle2 className="h-3.5 w-3.5 text-amber-400 mt-0.5 shrink-0" />
                  <span>
                    <strong>Kırılma/Kaybolma ve Parça Siparişi:</strong> Şarj aleti, anahtar veya plastik parça kırılma/kaybolma durumlarında sipariş için satıcı veya yetkili distribütör ile iletişime geçilir.
                  </span>
                </p>
              </div>

              <div>
                <Label className="text-xs font-semibold text-zinc-300">Varsa Özel Not / Ek Madde</Label>
                <Input
                  value={specialNotes}
                  onChange={(e) => setSpecialNotes(e.target.value)}
                  placeholder="Örn: Yedek anahtar teslim edildi. 1 adet kask hediye verildi."
                  className="h-9 text-sm mt-1"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* RIGHT 1 COL: SMART ID CARD PROCESSOR & LIVE PREVIEW */}
        <div className="space-y-6">
          <Card className="border-border shadow-sm sticky top-6">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-amber-500" />
                  Müşteri Kimlik Kartı İşleme
                </CardTitle>
              </div>
              <CardDescription className="text-xs">
                Önlü ve arkalı kimlik yükleyin. Sistem otomatik hizalama, ISO oranında kırpma ve arka plan temizleme uygular.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between bg-zinc-900/50 p-2.5 rounded-lg border border-border text-xs">
                <span className="text-zinc-300 font-medium">Akıllı Tarama & Temizleme</span>
                <Button
                  type="button"
                  variant={autoClean ? "default" : "outline"}
                  size="sm"
                  onClick={() => setAutoClean(!autoClean)}
                  className="h-7 text-xs"
                >
                  {autoClean ? "Aktif" : "Kapalı"}
                </Button>
              </div>

              {/* FRONT ID CARD */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-semibold">Kimlik Ön Yüzü</Label>
                  {idFrontProcessed && (
                    <div className="flex items-center gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={rotateFront}
                        title="90° Döndür"
                      >
                        <RotateCw className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-red-400 hover:text-red-300"
                        onClick={() => {
                          setIdFrontRaw(null)
                          setIdFrontProcessed(null)
                        }}
                        title="Kaldır"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  )}
                </div>

                <input
                  ref={frontInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFrontUpload}
                  className="hidden"
                />

                {idFrontProcessed ? (
                  <div
                    className="relative group border border-border rounded-xl overflow-hidden bg-white/5 cursor-pointer flex items-center justify-center p-2"
                    onClick={() => frontInputRef.current?.click()}
                  >
                    <img
                      src={idFrontProcessed}
                      alt="Kimlik Ön"
                      className="w-full h-36 object-contain rounded-lg shadow-sm"
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-xs text-white font-medium">
                      Görseli Değiştirmek İçin Tıklayın
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={() => frontInputRef.current?.click()}
                    className="border-2 border-dashed border-border hover:border-blue-500/50 transition-colors rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer bg-zinc-900/30 hover:bg-zinc-900/60"
                  >
                    <Upload className="h-6 w-6 text-muted-foreground mb-2" />
                    <span className="text-xs font-medium text-zinc-300">
                      Ön Yüz Yükle
                    </span>
                    <span className="text-[10px] text-muted-foreground mt-0.5">
                      JPG, PNG, WebP
                    </span>
                  </div>
                )}
              </div>

              <Separator />

              {/* BACK ID CARD */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-semibold">Kimlik Arka Yüzü</Label>
                  {idBackProcessed && (
                    <div className="flex items-center gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={rotateBack}
                        title="90° Döndür"
                      >
                        <RotateCw className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-red-400 hover:text-red-300"
                        onClick={() => {
                          setIdBackRaw(null)
                          setIdBackProcessed(null)
                        }}
                        title="Kaldır"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  )}
                </div>

                <input
                  ref={backInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleBackUpload}
                  className="hidden"
                />

                {idBackProcessed ? (
                  <div
                    className="relative group border border-border rounded-xl overflow-hidden bg-white/5 cursor-pointer flex items-center justify-center p-2"
                    onClick={() => backInputRef.current?.click()}
                  >
                    <img
                      src={idBackProcessed}
                      alt="Kimlik Arka"
                      className="w-full h-36 object-contain rounded-lg shadow-sm"
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-xs text-white font-medium">
                      Görseli Değiştirmek İçin Tıklayın
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={() => backInputRef.current?.click()}
                    className="border-2 border-dashed border-border hover:border-blue-500/50 transition-colors rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer bg-zinc-900/30 hover:bg-zinc-900/60"
                  >
                    <Upload className="h-6 w-6 text-muted-foreground mb-2" />
                    <span className="text-xs font-medium text-zinc-300">
                      Arka Yüz Yükle
                    </span>
                    <span className="text-[10px] text-muted-foreground mt-0.5">
                      JPG, PNG, WebP
                    </span>
                  </div>
                )}
              </div>

              {/* QUICK PRINT CALLOUT */}
              <div className="pt-2">
                <Button
                  type="button"
                  onClick={handlePrint}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold flex items-center justify-center gap-2 py-5 shadow-lg shadow-blue-600/20 rounded-xl"
                >
                  <Printer className="h-4 w-4" />
                  Yazdır / PDF Çıktısı Al
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
