"use client"

import React from "react"
import { Printer } from "lucide-react"
import { Button } from "@/components/ui/button"

export interface ContractData {
  contractDate: string
  contractNo: string

  companyName: string
  companyAddress: string
  companyTaxOffice: string
  companyTaxNo: string
  companyPhone: string
  companyAuthorized: string

  customerName: string
  customerIdentity: string
  customerPhone: string
  customerAddress: string

  vehicleBrand: string
  vehicleModel: string
  vehicleYear: string
  vehicleColor: string
  vehicleChassis: string
  vehicleEngineNo: string
  vehicleKm: string
  vehicleLocation: string

  idCardFront: string | null
  idCardBack: string | null

  specialNotes: string
}

interface ContractPrintProps {
  data: ContractData
}

export function printContract(data: ContractData) {
  const printWindow = window.open("", "_blank")
  if (!printWindow) {
    alert("Yazdırma penceresi açılamadı. Lütfen tarayıcı açılır pencerelerine (popup) izin verin.")
    return
  }

  const formattedDate = data.contractDate
    ? new Date(data.contractDate).toLocaleDateString("tr-TR", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      })
    : new Date().toLocaleDateString("tr-TR")

  const html = `
    <!DOCTYPE html>
    <html lang="tr">
    <head>
      <meta charset="utf-8" />
      <title>Müşteri Sözleşmesi & Teslim Tutanağı - ${data.customerName || "Belge"}</title>
      <style>
        @page {
          size: A4 portrait;
          margin: 12mm 15mm 12mm 15mm;
        }
        * {
          box-sizing: border-box;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        body {
          font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, Helvetica, Arial, sans-serif;
          font-size: 11px;
          line-height: 1.35;
          color: #1a1a1a;
          background: #fff;
          margin: 0;
          padding: 0;
        }
        .container {
          width: 100%;
          max-width: 100%;
        }
        .header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          border-bottom: 2px solid #0f172a;
          padding-bottom: 8px;
          margin-bottom: 12px;
        }
        .header-left {
          flex: 1;
        }
        .company-title {
          font-size: 16px;
          font-weight: 800;
          letter-spacing: 0.5px;
          color: #0f172a;
          text-transform: uppercase;
          margin: 0 0 2px 0;
        }
        .company-subtitle {
          font-size: 10px;
          color: #475569;
          margin: 0;
        }
        .header-right {
          text-align: right;
        }
        .doc-badge {
          background: #0f172a;
          color: #fff;
          font-size: 11px;
          font-weight: 700;
          padding: 4px 10px;
          border-radius: 4px;
          display: inline-block;
          margin-bottom: 4px;
          letter-spacing: 0.5px;
        }
        .doc-meta {
          font-size: 10px;
          color: #475569;
        }
        .grid-2 {
          display: flex;
          gap: 12px;
          margin-bottom: 10px;
        }
        .card {
          flex: 1;
          border: 1px solid #cbd5e1;
          border-radius: 5px;
          padding: 8px 10px;
          background: #f8fafc;
        }
        .card-title {
          font-size: 11px;
          font-weight: 700;
          color: #0f172a;
          border-bottom: 1px solid #e2e8f0;
          padding-bottom: 4px;
          margin-bottom: 6px;
          text-transform: uppercase;
          letter-spacing: 0.3px;
        }
        .info-row {
          display: flex;
          margin-bottom: 3px;
        }
        .info-label {
          width: 90px;
          font-weight: 600;
          color: #475569;
          font-size: 10.5px;
        }
        .info-value {
          flex: 1;
          font-weight: 500;
          color: #0f172a;
          font-size: 10.5px;
        }
        .id-cards-section {
          border: 1px solid #cbd5e1;
          border-radius: 5px;
          padding: 8px 10px;
          margin-bottom: 10px;
          background: #fff;
        }
        .id-cards-container {
          display: flex;
          gap: 12px;
          justify-content: center;
          margin-top: 6px;
        }
        .id-card-box {
          flex: 1;
          max-width: 48%;
          border: 1px dashed #94a3b8;
          border-radius: 6px;
          padding: 6px;
          text-align: center;
          background: #fcfcfc;
        }
        .id-card-box img {
          max-width: 100%;
          height: 120px;
          object-fit: contain;
          border-radius: 4px;
          border: 1px solid #e2e8f0;
        }
        .id-card-label {
          font-size: 10px;
          font-weight: 600;
          color: #64748b;
          margin-top: 4px;
        }
        .terms-section {
          border: 1px solid #cbd5e1;
          border-radius: 5px;
          padding: 8px 10px;
          margin-bottom: 10px;
          background: #fff;
        }
        .terms-title {
          font-size: 11px;
          font-weight: 700;
          color: #0f172a;
          border-bottom: 1px solid #e2e8f0;
          padding-bottom: 4px;
          margin-bottom: 6px;
          text-transform: uppercase;
        }
        .term-item {
          font-size: 9.5px;
          line-height: 1.35;
          margin-bottom: 4px;
          color: #334155;
          text-align: justify;
        }
        .term-item strong {
          color: #0f172a;
        }
        .handwritten-box {
          border: 1.5px solid #0f172a;
          border-radius: 5px;
          padding: 8px 10px;
          margin-bottom: 12px;
          background: #fdfdfd;
        }
        .handwritten-instruction {
          font-size: 10.5px;
          font-weight: 700;
          color: #0f172a;
          margin-bottom: 4px;
        }
        .handwritten-lines {
          border-bottom: 1px dashed #94a3b8;
          height: 28px;
          margin-top: 4px;
        }
        .signatures {
          display: flex;
          justify-content: space-between;
          gap: 20px;
          margin-top: 10px;
        }
        .sig-block {
          flex: 1;
          border: 1px solid #cbd5e1;
          border-radius: 5px;
          padding: 8px 12px;
          text-align: center;
          height: 95px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }
        .sig-title {
          font-weight: 700;
          font-size: 10.5px;
          color: #0f172a;
          text-transform: uppercase;
        }
        .sig-line {
          font-size: 9.5px;
          color: #64748b;
          border-top: 1px solid #cbd5e1;
          padding-top: 4px;
        }
        @media print {
          body {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <!-- HEADER -->
        <div class="header">
          <div class="header-left">
            <h1 class="company-title">${data.companyName || "MOTOSİKLET SATIŞ VE TESLİM NOKTASI"}</h1>
            <p class="company-subtitle">${data.companyAddress ? data.companyAddress + " | " : ""}Tel: ${data.companyPhone || "-"}</p>
          </div>
          <div class="header-right">
            <div class="doc-badge">TESLİM - TESELLÜM VE SATIŞ SÖZLEŞMESİ</div>
            <div class="doc-meta">
              <strong>Tarih:</strong> ${formattedDate}<br/>
              <strong>Sözleşme No:</strong> ${data.contractNo || "STK-" + Date.now().toString().slice(-6)}
            </div>
          </div>
        </div>

        <!-- 2 COLUMNS: CUSTOMER & VEHICLE -->
        <div class="grid-2">
          <!-- CUSTOMER INFO -->
          <div class="card">
            <div class="card-title">MÜŞTERİ / ALICI BİLGİLERİ</div>
            <div class="info-row">
              <span class="info-label">Adı Soyadı:</span>
              <span class="info-value"><strong>${data.customerName || "-"}</strong></span>
            </div>
            <div class="info-row">
              <span class="info-label">T.C. / Vergi No:</span>
              <span class="info-value">${data.customerIdentity || "-"}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Telefon:</span>
              <span class="info-value">${data.customerPhone || "-"}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Adres:</span>
              <span class="info-value">${data.customerAddress || "-"}</span>
            </div>
          </div>

          <!-- VEHICLE INFO -->
          <div class="card">
            <div class="card-title">TESLİM EDİLEN ARAÇ BİLGİLERİ</div>
            <div class="info-row">
              <span class="info-label">Marka / Model:</span>
              <span class="info-value"><strong>${data.vehicleBrand || ""} ${data.vehicleModel || ""}</strong></span>
            </div>
            <div class="info-row">
              <span class="info-label">Şasi Numarası:</span>
              <span class="info-value" style="font-family: monospace; letter-spacing: 0.5px; font-weight:700;">${data.vehicleChassis || "-"}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Motor No / Yıl:</span>
              <span class="info-value">${data.vehicleEngineNo || "-"} / ${data.vehicleYear || "-"}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Renk / Km / Konum:</span>
              <span class="info-value">${data.vehicleColor || "-"} / ${data.vehicleKm || "0"} KM / ${data.vehicleLocation || "Merkez"}</span>
            </div>
          </div>
        </div>

        <!-- ID CARDS SECTION (IF AVAILABLE) -->
        ${
          data.idCardFront || data.idCardBack
            ? `
          <div class="id-cards-section">
            <div class="card-title">ALICI KİMLİK GÖRSELLERİ (ÖN / ARKA TESCİL ONAYI)</div>
            <div class="id-cards-container">
              ${
                data.idCardFront
                  ? `
                <div class="id-card-box">
                  <img src="${data.idCardFront}" alt="Kimlik Ön Yüzü" />
                  <div class="id-card-label">KİMLİK ÖN YÜZÜ</div>
                </div>
              `
                  : ""
              }
              ${
                data.idCardBack
                  ? `
                <div class="id-card-box">
                  <img src="${data.idCardBack}" alt="Kimlik Arka Yüzü" />
                  <div class="id-card-label">KİMLİK ARKA YÜZÜ</div>
                </div>
              `
                  : ""
              }
            </div>
          </div>
        `
            : ""
        }

        <!-- CONTRACT ARTICLES -->
        <div class="terms-section">
          <div class="terms-title">SÖZLEŞME VE TESLİMAT ŞARTLARI</div>
          
          <div class="term-item">
            <strong>1. EKSİKSİZ VE HASARSIZ TESLİMAT:</strong> Alıcı, yukarıda şasi ve motor numarası belirtilen aracı, anahtarları, şarj aleti ve resmi belgeleri ile birlikte çalışır, eksiksiz, ayıpsız ve hasarsız vaziyette bizzat muayene ederek teslim almıştır.
          </div>

          <div class="term-item">
            <strong>2. YETKİLİ SERVİS VE TEKNİK ARIZA SORUMLULUĞU:</strong> Satışa konu araç üretici / ithalatçı firma garantisi altındadır. Teslim anından itibaren araçta meydana gelebilecek olası mekanik, elektriksel, yazılımsal veya batarya/şarj arızalarında müdahale yetkisi münhasıran üretici/ithalatçı firmanın <strong>Yetkili Servislerine</strong> aittir. <strong>Satıcı firmanın servis, bakım, arıza tespiti veya garanti tamir yükümlülüğü bulunmamaktadır.</strong> Alıcı, herhangi bir teknik arıza vukuunda yetkili servise bizzat başvuracağını kabul ve taahhüt eder.
          </div>

          <div class="term-item">
            <strong>3. NAKLİYE, YERİNDE SERVİS VE ÇEKİCİ SORUMLULUĞU:</strong> Aracın alıcıya ilk teslimatının gerçekleştirilmesinden sonra, satıcı firmanın aracı bulunduğu yerden alma, servise taşıma, nakletme veya tekrar yerine bırakma gibi herhangi bir yükümlülüğü bulunmamaktadır. Olası bakım, onarım veya yerinde yapılacak her türlü servis, nakliye, çekici ve ulaşım masrafları münhasıran alıcıya ve kullanıcıya aittir.
          </div>

          <div class="term-item">
            <strong>4. PARÇA KIRILMASI, KAYBOLMASI VE YEDEK PARÇA SİPARİŞİ:</strong> Araç tesliminden sonra alıcı kaynaklı kullanım hataları, kaza, düşme, devrilme, hor kullanım neticesinde kırılan, hasar gören veya kaybolan parçalar (grenaj, şarj aleti, ayna, anahtar, koruma demiri, kumanda vb.) garanti kapsamı dışındadır. Bu tür parça ihtiyaçlarında alıcı, orijinal yedek parça siparişi ve temini amacıyla satıcı firma veya yetkili yedek parça noktası ile iletişime geçerek ücreti mukabilinde tedarik sağlayabileceğini bilir ve kabul eder.
          </div>

          <div class="term-item">
            <strong>5. TRAFİK, İDARİ VE HUKUKİ SORUMLULUK:</strong> Aracın fiilen teslim edildiği tarih ve saatten itibaren araca ait her türlü hukuki, cezai, idari sorumluluk, trafik cezaları, kaza, otoyol geçiş ücretleri ve üçüncü şahıslara verilecek zararlar münhasıran alıcıya aittir.
          </div>

          ${
            data.specialNotes
              ? `
            <div class="term-item">
              <strong>6. ÖZEL NOTLAR:</strong> ${data.specialNotes}
            </div>
          `
              : ""
          }
        </div>

        <!-- HANDWRITTEN SECTION -->
        <div class="handwritten-box">
          <div class="handwritten-instruction">
            ALICI EL YAZISI ONAYI: (Lütfen aşağıdaki çizgiye kendi el yazınız ile <u>"Aracı eksiksiz, hasarsız ve çalışır durumda teslim aldım"</u> yazınız)
          </div>
          <div class="handwritten-lines"></div>
        </div>

        <!-- SIGNATURES -->
        <div class="signatures">
          <div class="sig-block">
            <div class="sig-title">SATICI FİRMA / YETKİLİ</div>
            <div style="font-size: 10px; color:#475569;">${data.companyAuthorized || data.companyName || "Yetkili İmza"}</div>
            <div class="sig-line">Kaşe & Islak İmza</div>
          </div>
          
          <div class="sig-block">
            <div class="sig-title">ALICI (MÜŞTERİ)</div>
            <div style="font-size: 10px; color:#475569;">${data.customerName || "Adı Soyadı"} - ${data.customerIdentity ? "TC: " + data.customerIdentity : ""}</div>
            <div class="sig-line">Tarih & Islak İmza</div>
          </div>
        </div>
      </div>

      <script>
        window.onload = function() {
          window.print();
        }
      </script>
    </body>
    </html>
  `

  printWindow.document.open()
  printWindow.document.write(html)
  printWindow.document.close()
}

export function ContractPrintButton({ data }: ContractPrintProps) {
  return (
    <Button
      onClick={() => printContract(data)}
      className="bg-blue-600 hover:bg-blue-700 text-white font-semibold flex items-center gap-2 shadow-lg shadow-blue-600/25"
    >
      <Printer className="h-4 w-4" />
      Sözleşmeyi Yazdır / PDF Al
    </Button>
  )
}
