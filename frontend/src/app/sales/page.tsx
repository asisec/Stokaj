"use client";

import { useEffect, useState, useMemo } from "react";
import { api, type Sale } from "@/lib/api";
import { useCensorStore } from "@/store/censor";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Printer, Search, Calendar, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(value);

const formatDate = (date: string) => new Date(date).toLocaleDateString("tr-TR");

const paymentMethodLabels: Record<string, string> = {
  cash: "Nakit",
  credit_card: "Kredi Kartı (Tek Çekim)",
  transfer: "Havale/EFT",
  open_account: "Açık Hesap (Veresiye)",
};

const ITEMS_PER_PAGE = 10;

export default function SalesPage() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const { isCensored } = useCensorStore();

  const [searchTerm, setSearchTerm] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useEffect(() => {
    api.getSales()
      .then(setSales)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filteredSales = useMemo(() => {
    return sales.filter((sale) => {
      const customerName = sale.customer 
        ? `${sale.customer.first_name} ${sale.customer.last_name}`.toLowerCase() 
        : "";
      const matchesSearch = customerName.includes(searchTerm.toLowerCase());
      
      let matchesDate = true;
      if (dateFilter) {
        const saleDate = new Date(sale.created_at).toISOString().split('T')[0];
        matchesDate = saleDate === dateFilter;
      }

      return matchesSearch && matchesDate;
    });
  }, [sales, searchTerm, dateFilter]);

  const totalPages = Math.ceil(filteredSales.length / itemsPerPage);
  const paginatedSales = filteredSales.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 p-2 print:p-0">
      <div className="flex items-center justify-between print:hidden">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100 tracking-tight">Satış Geçmişi</h1>
          <p className="text-sm text-zinc-500 mt-1">Tüm satış işlemlerinizi detaylı olarak inceleyin</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 print:hidden">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
          <Input 
            placeholder="Tüm tablodaki verilerde ara (Müşteri adına göre)..." 
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="pl-10 bg-zinc-900/50 border-zinc-800 text-zinc-200 placeholder:text-zinc-600 focus:border-zinc-600 transition-colors"
          />
        </div>
        
        <div className="relative w-full sm:w-auto flex gap-2">
          <div className="relative flex-1 sm:flex-none">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
            <Input 
              type="date"
              value={dateFilter}
              onChange={(e) => {
                setDateFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-10 w-full sm:w-48 bg-zinc-900/50 border-zinc-800 text-zinc-300 hover:border-zinc-700 transition-colors"
            />
          </div>
          <Button onClick={handlePrint} variant="outline" className="border-zinc-800 bg-zinc-900/50 text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100">
            <Printer className="mr-2 h-4 w-4" />
            Yazdır
          </Button>
        </div>
      </div>

      <div className="print:block hidden mb-4">
        <h2 className="text-2xl font-bold text-black">Satış Raporu</h2>
        {dateFilter && <p className="text-sm text-gray-600">Tarih: {dateFilter}</p>}
        {searchTerm && <p className="text-sm text-gray-600">Arama: {searchTerm}</p>}
      </div>

      <div className="rounded-xl border border-zinc-800/50 bg-zinc-900/30 overflow-hidden print:border-gray-300 print:bg-white print:text-black">
        <Table>
          <TableHeader>
            <TableRow className="border-zinc-800/50 hover:bg-transparent bg-zinc-900/50 print:bg-transparent print:border-gray-300">
              <TableHead className="text-zinc-400 font-medium print:text-gray-700">Tarih</TableHead>
              <TableHead className="text-zinc-400 font-medium print:text-gray-700">Müşteri</TableHead>
              <TableHead className="text-zinc-400 font-medium print:text-gray-700">Ürünler</TableHead>
              <TableHead className="text-zinc-400 font-medium print:text-gray-700">Toplam</TableHead>
              <TableHead className="text-emerald-400/80 font-medium print:text-gray-700">Kâr</TableHead>
              <TableHead className="text-zinc-400 font-medium print:text-gray-700">Ödeme</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-zinc-500">Yükleniyor...</TableCell>
              </TableRow>
            ) : paginatedSales.length > 0 ? (
              paginatedSales.map((sale) => {
                const profit = sale.total_amount - (sale.items?.reduce((acc, item) => acc + (item.purchase_price * item.quantity), 0) || 0);
                return (
                <TableRow key={sale.id} className="border-zinc-800/50 hover:bg-zinc-800/30 print:border-gray-200 print:hover:bg-transparent">
                  <TableCell className="text-zinc-400 print:text-black">
                    {formatDate(sale.created_at)}
                  </TableCell>
                  <TableCell className="font-medium text-zinc-200 print:text-black">
                    {sale.customer
                      ? (isCensored ? "**** ****" : `${sale.customer.first_name} ${sale.customer.last_name}`)
                      : "-"}
                  </TableCell>
                  <TableCell className="text-zinc-400 max-w-[250px] truncate print:text-black print:whitespace-normal">
                    {sale.items
                      ? sale.items.map((item) => item.item_name).join(", ")
                      : "-"}
                  </TableCell>
                  <TableCell className="text-zinc-200 font-semibold print:text-black">
                    {isCensored ? "****" : formatCurrency(sale.total_amount)}
                  </TableCell>
                  <TableCell className="text-emerald-400 font-semibold print:text-black">
                    {isCensored ? "****" : formatCurrency(profit)}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      {sale.payments && sale.payments.length > 0 ? (
                        sale.payments.map((p) => {
                          let label = paymentMethodLabels[p.method] || p.method;
                          if (p.method.startsWith("credit_card_")) {
                            const installments = p.method.split("_")[2];
                            label = `Kredi Kartı (${installments} Taksit)`;
                          }
                          return (
                            <Badge
                              key={p.id}
                              variant="secondary"
                              className="bg-zinc-800 text-zinc-300 border-zinc-700 w-max print:bg-transparent print:border-none print:p-0 print:text-black"
                            >
                              {label} ({isCensored ? "****" : formatCurrency(p.amount)})
                            </Badge>
                          );
                        })
                      ) : (
                        <Badge variant="secondary" className="bg-zinc-800 text-zinc-500 border-zinc-700 print:bg-transparent print:border-none print:text-gray-500">
                          Belirtilmemiş
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-zinc-500 print:text-black">Kayıt bulunamadı.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between px-2 print:hidden">
        <div className="flex-1 text-sm text-zinc-400">
          Toplam <span className="font-medium text-zinc-200">{filteredSales.length}</span> kayıt bulunuyor.
        </div>
        <div className="flex items-center space-x-6 lg:space-x-8">
          <div className="flex items-center space-x-2">
            <p className="text-sm font-medium text-zinc-300">Sayfa başı</p>
            <Select
              value={`${itemsPerPage}`}
              onValueChange={(value) => {
                setItemsPerPage(Number(value));
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="h-8 w-[70px] bg-zinc-900/50 border-zinc-800 text-zinc-300">
                <SelectValue placeholder={`${itemsPerPage}`} />
              </SelectTrigger>
              <SelectContent side="top" className="bg-zinc-950 border-zinc-800">
                {[10, 20, 50, 100].map((pageSize) => (
                  <SelectItem key={pageSize} value={`${pageSize}`} className="text-zinc-300 focus:bg-zinc-800">
                    {pageSize}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex w-[100px] items-center justify-center text-sm font-medium text-zinc-300">
            Sayfa {currentPage} / {totalPages || 1}
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              className="hidden h-8 w-8 p-0 lg:flex bg-zinc-900/50 border-zinc-800 text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100"
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
            >
              <span className="sr-only">İlk sayfaya git</span>
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              className="h-8 w-8 p-0 bg-zinc-900/50 border-zinc-800 text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              <span className="sr-only">Önceki sayfa</span>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              className="h-8 w-8 p-0 bg-zinc-900/50 border-zinc-800 text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages}
            >
              <span className="sr-only">Sonraki sayfa</span>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              className="hidden h-8 w-8 p-0 lg:flex bg-zinc-900/50 border-zinc-800 text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100"
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage >= totalPages}
            >
              <span className="sr-only">Son sayfaya git</span>
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
