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
          margin: 12mm 15mm;
        }
        * {
          box-sizing: border-box;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        body {
          font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, Helvetica, Arial, sans-serif;
          font-size: 11.5px;
          line-height: 1.45;
          color: #1a1a1a;
          background: #fff;
          margin: 0;
          padding: 0;
        }
        .container {
          width: 100%;
          max-width: 100%;
          display: flex;
          flex-direction: column;
        }
        .header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          border-bottom: 2.5px solid #0f172a;
          padding-bottom: 12px;
          margin-bottom: 16px;
        }
        .header-left {
          flex: 1;
        }
        .company-title {
          font-size: 18px;
          font-weight: 800;
          letter-spacing: 0.5px;
          color: #0f172a;
          text-transform: uppercase;
          margin: 0 0 4px 0;
        }
        .company-subtitle {
          font-size: 11px;
          color: #475569;
          margin: 0;
          line-height: 1.4;
        }
        .header-right {
          text-align: right;
        }
        .doc-badge {
          background: #0f172a;
          color: #fff;
          font-size: 11.5px;
          font-weight: 700;
          padding: 5px 12px;
          border-radius: 4px;
          display: inline-block;
          margin-bottom: 6px;
          letter-spacing: 0.5px;
        }
        .doc-meta {
          font-size: 10.5px;
          color: #475569;
          line-height: 1.4;
        }
        .grid-2 {
          display: flex;
          gap: 14px;
          margin-bottom: 14px;
          align-items: stretch;
        }
        .card {
          flex: 1 1 50%;
          width: calc(50% - 7px);
          border: 1px solid #cbd5e1;
          border-radius: 6px;
          padding: 12px 14px;
          background: #f8fafc;
          display: flex;
          flex-direction: column;
        }
        .card-title {
          font-size: 11.5px;
          font-weight: 700;
          color: #0f172a;
          border-bottom: 1px solid #e2e8f0;
          padding-bottom: 6px;
          margin-bottom: 8px;
          text-transform: uppercase;
          letter-spacing: 0.3px;
        }
        .info-table {
          width: 100%;
          border-collapse: collapse;
          table-layout: fixed;
          flex: 1;
        }
        .info-table tr {
          vertical-align: top;
        }
        .info-table td {
          padding: 3px 0;
          font-size: 11px;
          line-height: 1.4;
        }
        .info-table td.label-col {
          width: 115px;
          font-weight: 600;
          color: #475569;
          white-space: nowrap;
        }
        .info-table td.val-col {
          color: #0f172a;
          font-weight: 500;
          word-break: break-word;
        }
        .id-cards-section {
          border: 1px solid #cbd5e1;
          border-radius: 6px;
          padding: 12px 14px;
          margin-bottom: 14px;
          background: #fff;
        }
        .id-cards-container {
          display: flex;
          gap: 16px;
          justify-content: center;
          margin-top: 8px;
        }
        .id-card-box {
          flex: 1;
          max-width: 48%;
          border: 1px dashed #94a3b8;
          border-radius: 6px;
          padding: 8px;
          text-align: center;
          background: #fcfcfc;
        }
        .id-card-box img {
          max-width: 100%;
          height: 155px;
          object-fit: contain;
          border-radius: 4px;
          border: 1px solid #e2e8f0;
        }
        .id-card-label {
          font-size: 10.5px;
          font-weight: 600;
          color: #64748b;
          margin-top: 6px;
        }
        .terms-section {
          border: 1px solid #cbd5e1;
          border-radius: 6px;
          padding: 12px 14px;
          margin-bottom: 14px;
          background: #fff;
        }
        .terms-title {
          font-size: 12px;
          font-weight: 700;
          color: #0f172a;
          border-bottom: 1px solid #e2e8f0;
          padding-bottom: 6px;
          margin-bottom: 8px;
          text-transform: uppercase;
        }
        .term-item {
          font-size: 10.5px;
          line-height: 1.45;
          margin-bottom: 6px;
          color: #334155;
          text-align: justify;
        }
        .term-item:last-child {
          margin-bottom: 0;
        }
        .term-item strong {
          color: #0f172a;
        }
        .handwritten-box {
          border: 1.5px solid #0f172a;
          border-radius: 6px;
          padding: 10px 14px;
          margin-bottom: 14px;
          background: #fdfdfd;
        }
        .handwritten-instruction {
          font-size: 11px;
          font-weight: 700;
          color: #0f172a;
          margin-bottom: 6px;
        }
        .handwritten-lines {
          border-bottom: 1px dashed #94a3b8;
          height: 36px;
          margin-top: 6px;
        }
        .signatures {
          display: flex;
          justify-content: space-between;
          gap: 16px;
          margin-top: 4px;
        }
        .sig-block {
          flex: 1 1 50%;
          width: calc(50% - 8px);
          border: 1px solid #cbd5e1;
          border-radius: 6px;
          padding: 10px 14px 12px;
          text-align: center;
          background: #f8fafc;
        }
        .sig-title {
          font-weight: 700;
          font-size: 11px;
          color: #0f172a;
          text-transform: uppercase;
          letter-spacing: 0.3px;
          padding-bottom: 6px;
          border-bottom: 1px solid #e2e8f0;
        }
        .sig-name {
          font-size: 11px;
          color: #334155;
          font-weight: 600;
          margin-top: 8px;
          min-height: 18px;
        }
        .sig-space {
          height: 52px;
        }
        .sig-line {
          font-size: 10px;
          color: #64748b;
          border-top: 1px dashed #94a3b8;
          padding-top: 5px;
          font-weight: 500;
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
            <table class="info-table">
              <tr>
                <td class="label-col">Adı Soyadı:</td>
                <td class="val-col"><strong>${data.customerName || "-"}</strong></td>
              </tr>
              <tr>
                <td class="label-col">T.C. / Vergi No:</td>
                <td class="val-col">${data.customerIdentity || "-"}</td>
              </tr>
              <tr>
                <td class="label-col">Telefon:</td>
                <td class="val-col">${data.customerPhone || "-"}</td>
              </tr>
              <tr>
                <td class="label-col">Adres:</td>
                <td class="val-col">${data.customerAddress || "-"}</td>
              </tr>
            </table>
          </div>

          <!-- VEHICLE INFO -->
          <div class="card">
            <div class="card-title">TESLİM EDİLEN ARAÇ BİLGİLERİ</div>
            <table class="info-table">
              <tr>
                <td class="label-col">Marka / Model:</td>
                <td class="val-col"><strong>${data.vehicleBrand || ""} ${data.vehicleModel || ""}</strong></td>
              </tr>
              <tr>
                <td class="label-col">Şasi Numarası:</td>
                <td class="val-col" style="font-family: monospace; letter-spacing: 0.5px; font-weight:700;">${data.vehicleChassis || "-"}</td>
              </tr>
              <tr>
                <td class="label-col">Motor No / Yıl:</td>
                <td class="val-col">${data.vehicleEngineNo || "-"} / ${data.vehicleYear || "-"}</td>
              </tr>
              <tr>
                <td class="label-col">Renk / Km:</td>
                <td class="val-col">${data.vehicleColor || "-"} / ${data.vehicleKm || "0"} KM</td>
              </tr>
              <tr>
                <td class="label-col">Konum:</td>
                <td class="val-col">${data.vehicleLocation || "Merkez"}</td>
              </tr>
            </table>
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
            <strong>1. EKSİKSİZ TESLİMAT:</strong> Alıcı; aracı, anahtarlarını, şarj aletini ve evraklarını bizzat kontrol etmiş, eksiksiz, hasarsız ve çalışır durumda teslim almıştır.
          </div>

          <div class="term-item">
            <strong>2. SERVİS VE GARANTİ:</strong> Araç üretici garantisindedir. Arıza, bakım ve garanti işlemleri münhasıran <strong>Yetkili Servisler</strong> tarafından yapılır; satıcı firmanın tamir veya servis yükümlülüğü yoktur.
          </div>

          <div class="term-item">
            <strong>3. NAKLİYE VE ÇEKİCİ:</strong> Teslimat sonrası aracın servise götürülmesi/getirilmesi satıcının sorumluluğunda değildir. Nakliye, çekici ve yerinde servis masrafları tamamen alıcıya aittir.
          </div>

          <div class="term-item">
            <strong>4. KULLANICI HATASI VE PARÇA TEMİNİ:</strong> Düşme, kaza veya hatalı kullanımdan kaynaklanan parça kırılmaları ve kayıplar (şarj aleti, ayna, anahtar vb.) garanti dışıdır. İhtiyaç halinde parçalar ücreti karşılığında satıcıdan sipariş edilebilir.
          </div>

          <div class="term-item">
            <strong>5. HUKUKİ VE TRAFİK SORUMLULUĞU:</strong> Teslim anından itibaren araca ait her türlü kaza, trafik cezası, idari ve hukuki sorumluluk münhasıran alıcıya aittir.
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
            <div class="sig-name">${data.companyAuthorized || data.companyName || "Firma Yetkilisi"}</div>
            <div class="sig-space"></div>
            <div class="sig-line">Kaşe & Islak İmza</div>
          </div>
          
          <div class="sig-block">
            <div class="sig-title">ALICI (MÜŞTERİ)</div>
            <div class="sig-name">${data.customerName || "Adı Soyadı"} ${data.customerIdentity ? "— TC: " + data.customerIdentity : ""}</div>
            <div class="sig-space"></div>
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
