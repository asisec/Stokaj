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
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Printer, Search, Calendar, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Filter, SlidersHorizontal } from "lucide-react";

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
  const [filters, setFilters] = useState({
    startDate: "",
    endDate: "",
    minTotal: "",
    maxTotal: "",
    paymentMethod: "all"
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useEffect(() => {
    api.getSales()
      .then(setSales)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setFilters({
      startDate: "",
      endDate: "",
      minTotal: "",
      maxTotal: "",
      paymentMethod: "all"
    });
    setSearchTerm("");
    setCurrentPage(1);
  };

  const activeFiltersCount = Object.values(filters).filter(v => v !== "" && v !== "all").length;

  const filteredSales = useMemo(() => {
    return sales.filter((sale) => {
      const customerName = sale.customer 
        ? `${sale.customer.first_name} ${sale.customer.last_name}`.toLowerCase() 
        : "";
      const matchesSearch = customerName.includes(searchTerm.toLowerCase());
      
      let matchesFilters = true;
      const saleDate = new Date(sale.created_at).toISOString().split('T')[0];
      
      if (filters.startDate && saleDate < filters.startDate) matchesFilters = false;
      if (filters.endDate && saleDate > filters.endDate) matchesFilters = false;
      if (filters.minTotal && sale.total_amount < Number(filters.minTotal)) matchesFilters = false;
      if (filters.maxTotal && sale.total_amount > Number(filters.maxTotal)) matchesFilters = false;
      if (filters.paymentMethod !== "all") {
        const hasPaymentMethod = sale.payments?.some(p => p.method.startsWith(filters.paymentMethod));
        if (!hasPaymentMethod) matchesFilters = false;
      }

      return matchesSearch && matchesFilters;
    });
  }, [sales, searchTerm, filters]);

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
        
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="bg-zinc-900/50 border-zinc-800 text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100 relative w-full sm:w-auto">
              <Filter className="w-4 h-4 mr-2" />
              Gelişmiş Filtreler
              {activeFiltersCount > 0 && (
                <span className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-emerald-600 text-white text-xs flex items-center justify-center font-semibold border-2 border-zinc-950">
                  {activeFiltersCount}
                </span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-full sm:w-[520px] bg-zinc-950/95 backdrop-blur-xl border-zinc-800/50 shadow-2xl shadow-black p-6 rounded-2xl">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-emerald-500/10 rounded-lg">
                    <SlidersHorizontal className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-zinc-100">Gelişmiş Filtreleme</h4>
                    <p className="text-xs text-zinc-500">Detaylı arama kriterlerini belirleyin</p>
                  </div>
                </div>
                {activeFiltersCount > 0 && (
                  <Button variant="ghost" size="sm" onClick={clearFilters} className="h-8 text-red-400 hover:text-red-300 hover:bg-red-400/10 transition-colors">
                    Filtreleri Temizle
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Başlangıç Tarihi</Label>
                  <Input type="date" value={filters.startDate} onChange={(e) => handleFilterChange("startDate", e.target.value)} className="bg-zinc-900/50 border-zinc-800/80 text-zinc-200 h-10 hover:border-zinc-700 focus:border-emerald-500 transition-all rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Bitiş Tarihi</Label>
                  <Input type="date" value={filters.endDate} onChange={(e) => handleFilterChange("endDate", e.target.value)} className="bg-zinc-900/50 border-zinc-800/80 text-zinc-200 h-10 hover:border-zinc-700 focus:border-emerald-500 transition-all rounded-xl" />
                </div>
                
                <div className="space-y-2">
                  <Label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Min. Tutar (₺)</Label>
                  <Input type="number" placeholder="0" value={filters.minTotal} onChange={(e) => handleFilterChange("minTotal", e.target.value)} className="bg-zinc-900/50 border-zinc-800/80 text-zinc-200 h-10 hover:border-zinc-700 focus:border-emerald-500 transition-all rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Maks. Tutar (₺)</Label>
                  <Input type="number" placeholder="Sınırsız" value={filters.maxTotal} onChange={(e) => handleFilterChange("maxTotal", e.target.value)} className="bg-zinc-900/50 border-zinc-800/80 text-zinc-200 h-10 hover:border-zinc-700 focus:border-emerald-500 transition-all rounded-xl" />
                </div>

                <div className="space-y-2 sm:col-span-2">
                  <Label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Ödeme Yöntemi</Label>
                  <Select value={filters.paymentMethod} onValueChange={(v) => handleFilterChange("paymentMethod", v)}>
                    <SelectTrigger className="bg-zinc-900/50 border-zinc-800/80 text-zinc-200 h-10 hover:border-zinc-700 focus:border-emerald-500 transition-all rounded-xl">
                      <SelectValue placeholder="Tümü" />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-950 border-zinc-800 text-zinc-200 rounded-xl">
                      <SelectItem value="all">Tümü</SelectItem>
                      <SelectItem value="cash">Nakit</SelectItem>
                      <SelectItem value="credit_card">Kredi Kartı</SelectItem>
                      <SelectItem value="transfer">Havale / EFT</SelectItem>
                      <SelectItem value="open_account">Açık Hesap (Veresiye)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </PopoverContent>
        </Popover>

        <Button
          variant="outline"
          onClick={handlePrint}
          className="border-zinc-800 bg-zinc-900/50 text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100 relative w-full sm:w-auto"
        >
          <Printer className="mr-2 h-4 w-4" />
          Yazdır
        </Button>
      </div>

      <div className="print:block hidden mb-4">
        <h2 className="text-2xl font-bold text-black">Satış Raporu</h2>
        {filters.startDate && <p className="text-sm text-gray-600">Başlangıç: {filters.startDate}</p>}
        {filters.endDate && <p className="text-sm text-gray-600">Bitiş: {filters.endDate}</p>}
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
