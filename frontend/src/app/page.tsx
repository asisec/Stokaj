"use client";

import { useEffect, useState } from "react";
import { api, type DashboardStats } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Bike, Wrench, Users, ShoppingCart, Trash2, ShieldAlert, Eye, EyeOff } from "lucide-react";
import { customToast as toast } from "@/lib/toast";
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
import { useCensorStore } from "@/store/censor";

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(
    value
  );

const formatDate = (date: string) =>
  new Date(date).toLocaleDateString("tr-TR");

const paymentMethodLabels: Record<string, string> = {
  cash: "Nakit",
  credit_card: "Kredi Kartı",
  bank_transfer: "Havale/EFT",
  installment: "Taksit",
};

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  const [deletingId, setDeletingId] = useState<number | null>(null);
  const { isCensored, toggleCensor } = useCensorStore();

  const loadStats = () => {
    api
      .getDashboardStats()
      .then(setStats)
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadStats();
  }, []);

  const handleDelete = async () => {
    if (!deletingId) return;
    try {
      await api.deleteSale(deletingId);
      toast.success("Satış başarıyla silindi");
      loadStats();
    } catch {
      toast.error("Satış silinirken hata oluştu");
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-8 p-2">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-36 rounded-2xl bg-zinc-800/50" />
          ))}
        </div>
        <Skeleton className="h-[400px] rounded-2xl bg-zinc-800/50" />
      </div>
    );
  }

  if (!stats) return null;

  const statCards = [
    {
      title: "Motosikletler",
      value: `${stats.available_motorcycles} / ${stats.total_motorcycles}`,
      subtitle: "Mevcut / Toplam",
      icon: Bike,
      gradient: "from-blue-500/20 to-blue-600/5",
      border: "border-l-blue-500",
      iconColor: "text-blue-400",
      bgGlow: "bg-blue-500/10",
    },
    {
      title: "Yedek Parçalar",
      value: stats.total_spare_parts_quantity.toLocaleString("tr-TR"),
      subtitle: "Toplam Stok",
      icon: Wrench,
      gradient: "from-emerald-500/20 to-emerald-600/5",
      border: "border-l-emerald-500",
      iconColor: "text-emerald-400",
      bgGlow: "bg-emerald-500/10",
      badge:
        stats.low_stock_count > 0
          ? { text: `${stats.low_stock_count} düşük stok`, variant: "destructive" as const }
          : null,
    },
    {
      title: "Müşteriler",
      value: stats.total_customers.toLocaleString("tr-TR"),
      subtitle: "Kayıtlı Müşteri",
      icon: Users,
      gradient: "from-purple-500/20 to-purple-600/5",
      border: "border-l-purple-500",
      iconColor: "text-purple-400",
      bgGlow: "bg-purple-500/10",
    },
    {
      title: "Net Ciro",
      value: formatCurrency(stats.total_revenue),
      subtitle: "Toplam Net Kâr",
      icon: ShoppingCart,
      gradient: "from-amber-500/20 to-amber-600/5",
      border: "border-l-amber-500",
      iconColor: "text-amber-400",
      bgGlow: "bg-amber-500/10",
    },
  ];

  return (
    <div className="space-y-8 p-2">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-zinc-100">
          Gösterge Paneli
        </h1>
        <button
          type="button"
          onClick={toggleCensor}
          className="p-2 rounded-lg bg-zinc-900/50 border border-zinc-800 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
          title={isCensored ? "Verileri Göster" : "Verileri Gizle"}
        >
          {isCensored ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <Card
              key={card.title}
              className={`relative overflow-hidden border-l-4 ${card.border} bg-gradient-to-br ${card.gradient} backdrop-blur-sm border-zinc-800/50 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:shadow-black/20 cursor-default group`}
            >
              <div
                className={`absolute top-0 right-0 w-32 h-32 ${card.bgGlow} rounded-full blur-3xl -translate-y-8 translate-x-8 group-hover:scale-150 transition-transform duration-500`}
              />
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-zinc-400">
                  {card.title}
                </CardTitle>
                <div
                  className={`p-2.5 rounded-xl ${card.bgGlow} ${card.iconColor} transition-transform duration-300 group-hover:scale-110`}
                >
                  <Icon className="h-5 w-5" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-zinc-100 tracking-tight transition-all">
                  {isCensored ? "****" : card.value}
                </div>
                <p className="text-xs text-zinc-500 mt-1">{card.subtitle}</p>
                {card.badge && (
                  <Badge
                    variant={card.badge.variant}
                    className="mt-2 text-[10px] px-2 py-0.5 animate-pulse"
                  >
                    {card.badge.text}
                  </Badge>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="border-zinc-800/50 bg-zinc-900/50 backdrop-blur-sm mb-8">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-zinc-100 flex items-center gap-2">
            <ShoppingCart className="h-5 w-5 text-zinc-400" />
            Son Satışlar
          </CardTitle>
        </CardHeader>
        <CardContent>
          {stats.recent_sales && stats.recent_sales.length > 0 ? (
            <div className="rounded-xl border border-zinc-800/50 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="border-zinc-800/50 hover:bg-transparent">
                    <TableHead className="text-zinc-400 font-medium">
                      Müşteri
                    </TableHead>
                    <TableHead className="text-zinc-400 font-medium">
                      Ürünler
                    </TableHead>
                    <TableHead className="text-zinc-400 font-medium">
                      Toplam
                    </TableHead>
                    <TableHead className="text-zinc-400 font-medium">
                      Ödeme
                    </TableHead>
                    <TableHead className="text-zinc-400 font-medium">
                      Tarih
                    </TableHead>
                    <TableHead className="text-right text-zinc-400 font-medium">
                      İşlem
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stats.recent_sales.slice(0, 5).map((sale) => (
                    <TableRow
                      key={sale.id}
                      className="border-zinc-800/50 transition-colors duration-200 hover:bg-zinc-800/30"
                    >
                      <TableCell className="font-medium text-zinc-200">
                        {sale.customer
                          ? (isCensored ? "**** ****" : `${sale.customer.first_name} ${sale.customer.last_name}`)
                          : "-"}
                      </TableCell>
                      <TableCell className="text-zinc-400 max-w-[200px] truncate">
                        {sale.items
                          ? sale.items.map((item) => item.item_name).join(", ")
                          : "-"}
                      </TableCell>
                      <TableCell className="text-zinc-200 font-semibold transition-all">
                        {isCensored ? "****" : formatCurrency(sale.total_amount)}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          {sale.payments && sale.payments.length > 0 ? (
                            sale.payments.map((p) => (
                              <Badge
                                key={p.id}
                                variant="secondary"
                                className="bg-zinc-800 text-zinc-300 border-zinc-700 w-max"
                              >
                                {paymentMethodLabels[p.method] || p.method} ({isCensored ? "****" : formatCurrency(p.amount)})
                              </Badge>
                            ))
                          ) : (
                            <Badge variant="secondary" className="bg-zinc-800 text-zinc-500 border-zinc-700">
                              Belirtilmemiş
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-zinc-400">
                        {formatDate(sale.created_at)}
                      </TableCell>
                      <TableCell className="text-right">
                        <button
                          onClick={() => setDeletingId(sale.id)}
                          className="p-2 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                          title="Satışı Sil"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-zinc-500">
              <ShoppingCart className="h-12 w-12 mb-3 opacity-30" />
              <p className="text-sm">Henüz satış kaydı bulunmuyor</p>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7 mb-8">
        {/* Sales Trend Line Chart */}
        <Card className="border-zinc-800/50 bg-zinc-900/50 backdrop-blur-sm xl:col-span-4">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-zinc-100">
              Son 6 Aylık Satış Trendi
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              {stats.sales_trend && stats.sales_trend.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={stats.sales_trend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" vertical={false} />
                    <XAxis
                      dataKey="month"
                      stroke="#a1a1aa"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      stroke="#a1a1aa"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(value) => isCensored ? "****" : `₺${value}`}
                    />
                    <RechartsTooltip
                      contentStyle={{ backgroundColor: "#18181b", borderColor: "#27272a", borderRadius: "8px" }}
                      itemStyle={{ color: "#e4e4e7" }}
                      formatter={(value: number) => [isCensored ? "****" : formatCurrency(value), "Ciro"]}
                      labelStyle={{ color: "#a1a1aa", marginBottom: "4px" }}
                    />
                    <Line
                      type="monotone"
                      dataKey="revenue"
                      stroke="#3b82f6"
                      strokeWidth={3}
                      dot={{ fill: "#3b82f6", strokeWidth: 2 }}
                      activeDot={{ r: 6, strokeWidth: 0 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-zinc-500">
                  Yeterli veri yok
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Top Motorcycle Brands Pie Chart */}
        <Card className="border-zinc-800/50 bg-zinc-900/50 backdrop-blur-sm xl:col-span-3">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-zinc-100">
              Popüler Markalar
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              {stats.top_brands && stats.top_brands.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={stats.top_brands}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="count"
                      nameKey="brand"
                    >
                      {stats.top_brands.map((_, index) => {
                        const colors = ["#3b82f6", "#10b981", "#8b5cf6", "#f59e0b", "#ef4444"];
                        return <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />;
                      })}
                    </Pie>
                    <RechartsTooltip
                      contentStyle={{ backgroundColor: "#18181b", borderColor: "#27272a", borderRadius: "8px" }}
                      itemStyle={{ color: "#e4e4e7" }}
                      formatter={(value: number) => [isCensored ? "****" : value, "Adet"]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-zinc-500">
                  Yeterli veri yok
                </div>
              )}
            </div>
            {/* Custom Legend */}
            <div className="mt-4 flex flex-wrap justify-center gap-4">
              {stats.top_brands?.map((brand, index) => {
                const colors = ["#3b82f6", "#10b981", "#8b5cf6", "#f59e0b", "#ef4444"];
                return (
                  <div key={brand.brand} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: colors[index % colors.length] }} />
                    <span className="text-xs text-zinc-400">{brand.brand}</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      <AlertDialog open={deletingId !== null} onOpenChange={(open) => !open && setDeletingId(null)}>
        <AlertDialogContent className="bg-zinc-900 border-zinc-800">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-zinc-100 flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-red-400" />
              Satışı Silmek İstediğinize Emin Misiniz?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-400">
              Bu işlem geri alınamaz. İlgili satış kaydı ve ödeme geçmişi kalıcı olarak silinecek. Satılan motosikletler <span className="font-semibold text-zinc-300">tekrar stoka</span> eklenecektir.
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
              Evet, Satışı Sil
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
