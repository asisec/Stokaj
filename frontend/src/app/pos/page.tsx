"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { api, type Customer, type Motorcycle, type SparePart } from "@/lib/api";
import { useCensorStore } from "@/store/censor";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { customToast as toast } from "@/lib/toast";
import {
  Search,
  X,
  ShoppingCart,
  User,
  Phone,
  Bike,
  Wrench,
  CreditCard,
  Banknote,
  Building2,
  Check,
  Loader2,
  Tag,
  Plus,
  Trash2,
  AlertCircle,
  ShoppingBag,
  Package,
  BookOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface CartItem {
  item_type: "motorcycle" | "spare_part";
  item_id: number;
  item_name: string;
  chassis_number?: string;
  quantity: number;
  max_quantity?: number; // Only for spare parts to limit input
}


export default function POSPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [motorcycles, setMotorcycles] = useState<Motorcycle[]>([]);
  const [spareParts, setSpareParts] = useState<SparePart[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerSearch, setCustomerSearch] = useState("");
  const [productSearch, setProductSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [sparePartQuantities, setSparePartQuantities] = useState<Record<number, number>>({});
  const [nextId, setNextId] = useState(2);
  const [activeTab, setActiveTab] = useState<"motorcycles" | "spare_parts">("motorcycles");
  const { isCensored } = useCensorStore();

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [customersData, motorcyclesData, sparePartsData] = await Promise.all([
        api.getCustomers(),
        api.getMotorcycles(),
        api.getSpareParts(),
      ]);
      setCustomers(customersData);
      setMotorcycles(motorcyclesData);
      setSpareParts(sparePartsData);
    } catch {
      toast.error("Veriler yüklenirken hata oluştu");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredCustomers = useMemo(() => {
    if (!customerSearch) return customers;
    const query = customerSearch.toLowerCase();
    return customers.filter(
      (c) =>
        c.first_name.toLowerCase().includes(query) ||
        c.last_name.toLowerCase().includes(query) ||
        c.phone.toLowerCase().includes(query)
    );
  }, [customers, customerSearch]);

  const availableMotorcycles = useMemo(() => {
    const available = motorcycles.filter((m) => m.status === "available");
    if (!productSearch) return available;
    const query = productSearch.toLowerCase();
    return available.filter(
      (m) =>
        m.brand.toLowerCase().includes(query) ||
        m.model.toLowerCase().includes(query) ||
        m.chassis_number.toLowerCase().includes(query)
    );
  }, [motorcycles, productSearch]);

  const availableSpareParts = useMemo(() => {
    const available = spareParts.filter((sp) => sp.quantity > 0 && !sp.is_defective);
    if (!productSearch) return available;
    const query = productSearch.toLowerCase();
    return available.filter(
      (sp) =>
        sp.name.toLowerCase().includes(query) ||
        sp.category.toLowerCase().includes(query) ||
        sp.compatible_brand.toLowerCase().includes(query) ||
        sp.compatible_model.toLowerCase().includes(query)
    );
  }, [spareParts, productSearch]);

  const addMotorcycleToCart = (motorcycle: Motorcycle) => {
    const existing = cart.find(
      (item) => item.item_type === "motorcycle" && item.item_id === motorcycle.id
    );
    if (existing) {
      toast.error("Bu motosiklet zaten sepette");
      return;
    }
    setCart((prev) => [
      ...prev,
      {
        item_type: "motorcycle",
        item_id: motorcycle.id,
        item_name: `${motorcycle.brand} ${motorcycle.model} (${motorcycle.year})`,
        chassis_number: motorcycle.chassis_number,
        quantity: 1,
      },
    ]);
    toast.success("Motosiklet sepete eklendi");
  };

  const addSparePartToCart = (sparePart: SparePart) => {
    const quantity = sparePartQuantities[sparePart.id] || 1;
    if (quantity > sparePart.quantity) {
      toast.error("Yeterli stok bulunmuyor");
      return;
    }

    setCart((prev) => {
      const existingIdx = prev.findIndex(
        (item) => item.item_type === "spare_part" && item.item_id === sparePart.id
      );
      if (existingIdx >= 0) {
        const newCart = [...prev];
        const newTotalQty = newCart[existingIdx].quantity + quantity;
        if (newTotalQty > sparePart.quantity) {
          toast.error("Toplam miktar stoktan fazla olamaz");
          return prev;
        }
        newCart[existingIdx].quantity = newTotalQty;
        toast.success("Yedek parça miktarı güncellendi");
        return newCart;
      }

      toast.success("Yedek parça sepete eklendi");
      return [
        ...prev,
        {
          item_type: "spare_part",
          item_id: sparePart.id,
          item_name: sparePart.name,
          quantity: quantity,
            max_quantity: sparePart.quantity,
        },
      ];
    });

    // Reset local quantity input
    setSparePartQuantities((prev) => ({ ...prev, [sparePart.id]: 1 }));
  };

  const updateCartQuantity = (index: number, newQty: number) => {
    const item = cart[index];
    if (newQty < 1) return;
    if (item.max_quantity && newQty > item.max_quantity) {
      toast.error(`Stokta sadece ${item.max_quantity} adet bulunuyor`);
      return;
    }
    setCart((prev) => prev.map((p, i) => (i === index ? { ...p, quantity: newQty } : p)));
  };

  const removeFromCart = (index: number) => {
    setCart((prev) => prev.filter((_, i) => i !== index));
  };

  const canComplete =
    !!selectedCustomer &&
    cart.length > 0;

  const handleCompleteSale = async () => {
    if (!canComplete) return;
    setSubmitting(true);
    try {
      await api.createSale({
        customer_id: selectedCustomer!.id,
        items: cart.map((item) => ({
          item_type: item.item_type,
          item_id: item.item_id,
          quantity: item.quantity,
        })),
      });
      toast.success("Satış başarıyla tamamlandı!");
      setCart([]);
      setSelectedCustomer(null);
      setSparePartQuantities({});
      await fetchData();
    } catch {
      toast.error("Satış tamamlanırken hata oluştu");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex gap-6 h-[calc(100vh-8rem)] p-2">
        <div className="w-80 flex flex-col">
          <Skeleton className="h-14 mb-4 rounded-2xl bg-zinc-800/50" />
          <div className="space-y-3 flex-1">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-20 w-full rounded-2xl bg-zinc-800/50" />
            ))}
          </div>
        </div>

        <div className="flex-1 flex flex-col">
          <Skeleton className="h-14 mb-4 rounded-2xl bg-zinc-800/50" />
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-32 w-full rounded-3xl bg-zinc-800/50" />
            ))}
          </div>
        </div>

        <div className="w-[420px] flex flex-col">
          <Skeleton className="h-14 mb-4 rounded-2xl bg-zinc-800/50" />
          <div className="flex-1 bg-zinc-900/50 border border-zinc-800/50 rounded-3xl p-6 space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-20 w-full rounded-2xl bg-zinc-800/50" />
            ))}
            <div className="mt-auto space-y-4 pt-6 border-t border-zinc-800/50">
              <Skeleton className="h-12 w-full rounded-2xl bg-zinc-800/50" />
              <Skeleton className="h-14 w-full rounded-2xl bg-zinc-800/50" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Generate initials for avatar
  const getInitials = (first: string, last: string) => {
    return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase();
  };

  return (
    <div className="flex gap-6 h-[calc(100vh-8rem)] p-2">
      {/* 1. SOL PANEL: Müşteri Seçimi */}
      <div className="w-80 flex flex-col gap-4 shrink-0">
        <Card className="border-zinc-800/60 bg-zinc-950/40 backdrop-blur-xl flex flex-col h-full rounded-3xl shadow-2xl">
          <CardHeader className="p-5 pb-5 border-b border-zinc-800/60 shrink-0">
            <CardTitle className="text-xl font-semibold text-zinc-100 flex items-center gap-2.5">
              <div className="p-2.5 bg-blue-500/10 rounded-xl text-blue-400">
                <User className="h-5 w-5" />
              </div>
              Müşteri Seçimi
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 p-0 min-h-0 flex flex-col">
            <div className="px-4 pt-4 pb-2">
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                <Input
                  placeholder="Müşteri ara..."
                  value={customerSearch}
                  onChange={(e) => setCustomerSearch(e.target.value)}
                  className="pl-10 h-11 rounded-xl bg-zinc-900/50 border-zinc-800/50 text-zinc-200 placeholder:text-zinc-500 focus:border-blue-500/50 focus:ring-blue-500/20 transition-all"
                />
              </div>
            </div>
            <ScrollArea className="flex-1 px-3 pb-3">
              <div className="space-y-2 pb-4 pt-1">
                {filteredCustomers.map((customer) => {
                  const isSelected = selectedCustomer?.id === customer.id;
                  return (
                    <button
                      key={customer.id}
                      onClick={() => setSelectedCustomer(customer)}
                      className={cn(
                        "w-full text-left p-3.5 rounded-2xl border transition-all duration-300 group relative overflow-hidden",
                        isSelected
                          ? "border-blue-500/40 bg-blue-500/10 shadow-[0_0_20px_-5px_rgba(59,130,246,0.2)]"
                          : "border-zinc-800/50 bg-zinc-900/30 hover:bg-zinc-800/40 hover:border-zinc-700/60"
                      )}
                    >
                      {isSelected && (
                        <motion.div
                          layoutId="active-customer-glow"
                          className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-transparent pointer-events-none"
                        />
                      )}
                      <div className="flex items-center gap-3 relative z-10">
                        <div
                          className={cn(
                            "w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0 transition-colors duration-300",
                            isSelected
                              ? "bg-blue-500 text-white shadow-lg shadow-blue-500/30"
                              : "bg-zinc-800 text-zinc-400 group-hover:bg-zinc-700 group-hover:text-zinc-200"
                          )}
                        >
                          {getInitials(customer.first_name, customer.last_name)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className={cn("font-medium text-sm truncate transition-colors", isSelected ? "text-blue-100" : "text-zinc-200 group-hover:text-white")}>
                            {isCensored ? "**** ****" : `${customer.first_name} ${customer.last_name}`}
                          </div>
                          <div className="flex items-center gap-1.5 text-xs text-zinc-500 mt-1">
                            <User className="h-3 w-3" />
                            {isCensored ? "***********" : customer.identity_number}
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
                {filteredCustomers.length === 0 && (
                  <div className="text-center py-10 text-zinc-500 text-sm">
                    Müşteri bulunamadı
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* 2. ORTA PANEL: Ürünler */}
      <div className="flex-1 flex flex-col gap-4 min-w-0">
        <Card className="border-zinc-800/60 bg-zinc-950/40 backdrop-blur-xl flex flex-col h-full rounded-3xl shadow-2xl">
          <Tabs
            value={activeTab}
            onValueChange={(v) => setActiveTab(v as "motorcycles" | "spare_parts")}
            className="flex flex-col h-full"
          >
            <CardHeader className="p-5 pb-5 border-b border-zinc-800/60 shrink-0">
              <CardTitle className="text-xl font-semibold text-zinc-100 flex items-center gap-2.5">
                <div className="p-2.5 bg-emerald-500/10 rounded-xl text-emerald-400">
                  <Package className="h-5 w-5" />
                </div>
                Ürün Seçimi
              </CardTitle>
            </CardHeader>

            <CardContent className="flex-1 p-0 min-h-0 flex flex-col">
              {/* Sekmeler ve Arama - sabit üst alan */}
              <div className="px-5 pt-4 pb-3 border-b border-zinc-800/40 shrink-0 flex flex-col gap-3">
                <TabsList className="bg-zinc-900/80 border border-zinc-800/50 p-1 rounded-xl h-11 w-full grid grid-cols-2">
                  <TabsTrigger value="motorcycles" className="rounded-lg gap-2 data-[state=active]:bg-zinc-800 data-[state=active]:text-zinc-100 text-zinc-400">
                    <Bike className="h-4 w-4" />
                    Motosikletler
                  </TabsTrigger>
                  <TabsTrigger value="spare_parts" className="rounded-lg gap-2 data-[state=active]:bg-zinc-800 data-[state=active]:text-zinc-100 text-zinc-400">
                    <Wrench className="h-4 w-4" />
                    Yedek Parçalar
                  </TabsTrigger>
                </TabsList>
                <div className="relative w-full">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                  <Input
                    placeholder="Ürün ara..."
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    className="pl-9 h-11 bg-zinc-900/50 border-zinc-800/50 text-zinc-200 focus:border-blue-500/50 rounded-xl placeholder:text-zinc-500"
                  />
                </div>
              </div>

              <TabsContent value="motorcycles" className="flex-1 m-0 data-[state=inactive]:hidden min-h-0">
                <ScrollArea className="h-full px-5 pb-5">
                  <div className="flex flex-col gap-2 pt-2 pb-4">
                    {availableMotorcycles.map((motorcycle) => {
                      const inCart = cart.some(
                        (item) => item.item_type === "motorcycle" && item.item_id === motorcycle.id
                      );
                      return (
                        <div
                          key={motorcycle.id}
                          className={cn(
                            "group relative overflow-hidden rounded-xl border transition-all duration-300",
                            inCart
                              ? "border-zinc-800/30 bg-zinc-900/20 opacity-50 grayscale-[0.5]"
                              : "border-zinc-800/50 bg-zinc-900/40 hover:bg-zinc-800/40 hover:border-blue-500/30 shadow-sm hover:shadow-lg"
                          )}
                        >
                          <div className="p-3 flex flex-col gap-3">
                            {/* Üst kısım: Bilgiler */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1.5">
                                <h3 className="font-bold text-zinc-100 text-[14px] group-hover:text-blue-400 transition-colors leading-tight truncate">
                                  {motorcycle.brand} {motorcycle.model}
                                </h3>
                              </div>
                              <div className="text-xs text-zinc-500 flex items-center gap-2 truncate">
                                <span className="font-medium text-zinc-400 bg-zinc-800/50 px-2 py-0.5 rounded">
                                  {motorcycle.year}
                                </span>
                                <span>•</span>
                                <span className="capitalize">{motorcycle.color}</span>
                                <span>•</span>
                                <span className="font-mono text-[11px] text-blue-400 font-semibold bg-blue-500/10 border border-blue-500/20 px-1.5 py-0.5 rounded">
                                  Şasi: {motorcycle.chassis_number}
                                </span>
                              </div>
                            </div>

                            {/* Alt kısım: İşlemler */}
                              <div className="flex items-center w-full">
                                {inCart ? (
                                  <Badge className="bg-blue-500/20 text-blue-300 border-none px-3 h-10 rounded-xl w-full flex justify-center text-sm">
                                    <Check className="h-4 w-4 mr-2" />
                                    Sepette
                                  </Badge>
                                ) : (
                                  <div className="flex items-center border border-zinc-800 rounded-xl overflow-hidden bg-zinc-950/50 focus-within:border-blue-500/50 focus-within:ring-1 focus-within:ring-blue-500/20 transition-all w-full">
                                    <Button
                                      disabled={inCart}
                                      onClick={() => addMotorcycleToCart(motorcycle)}
                                      className="w-full h-10 rounded-none bg-blue-600 hover:bg-blue-500 text-white font-semibold px-6 transition-colors"
                                    >
                                      Sepete Ekle
                                    </Button>
                                  </div>
                                )}
                              </div>
                          </div>
                        </div>
                      );
                    })}
                    {availableMotorcycles.length === 0 && (
                      <div className="col-span-full flex flex-col items-center justify-center py-20 text-zinc-500">
                        <Bike className="h-12 w-12 mb-4 opacity-20" />
                        <p className="text-sm font-medium">Motosiklet bulunamadı</p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="spare_parts" className="flex-1 m-0 data-[state=inactive]:hidden min-h-0">
                <ScrollArea className="h-full px-5 pb-5">
                  <div className="flex flex-col gap-2 pt-2 pb-4">
                    {availableSpareParts.map((sp) => {
                      return (
                        <div
                          key={sp.id}
                          className="group relative overflow-hidden rounded-xl border border-zinc-800/50 bg-zinc-900/40 hover:bg-zinc-800/40 hover:border-blue-500/30 transition-all duration-300 shadow-sm hover:shadow-lg"
                        >
                          <div className="p-3 flex flex-col gap-3">
                            {/* Üst kısım: Bilgiler */}
                            <div className="flex-1 min-w-0">
                              <h3 className="font-bold text-zinc-100 text-[14px] group-hover:text-blue-400 transition-colors truncate mb-1.5">
                                {sp.name}
                              </h3>
                              <div className="text-xs text-zinc-500 flex items-center gap-2 truncate">
                                <span className="font-medium text-amber-400/80 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded shrink-0">
                                  {sp.quantity} adet
                                </span>
                                <span className="truncate">{sp.category} • {sp.compatible_brand} {sp.compatible_model}</span>
                              </div>
                            </div>

                            {/* Alt kısım: İşlemler */}
                            <div className="flex items-center w-full">
                              <div className="flex items-center border border-zinc-800 rounded-xl overflow-hidden bg-zinc-950/50 focus-within:border-blue-500/50 focus-within:ring-1 focus-within:ring-blue-500/20 transition-all w-full">
                                <Input
                                  type="number"
                                  min="1"
                                  max={sp.quantity}
                                  placeholder="Adet"
                                  value={sparePartQuantities[sp.id] || 1}
                                  onChange={(e) =>
                                    setSparePartQuantities((prev) => ({
                                      ...prev,
                                      [sp.id]: parseInt(e.target.value) || 1,
                                    }))
                                  }
                                  className="w-[70px] h-10 border-0 border-r border-zinc-800 bg-transparent text-center text-zinc-200 font-medium focus-visible:ring-0 px-1 placeholder:text-zinc-600 flex-1"
                                />
                                <Button
                                  onClick={() => addSparePartToCart(sp)}
                                  className="h-10 rounded-none bg-blue-600 hover:bg-blue-500 text-white font-semibold px-6 transition-colors shrink-0 w-[120px]"
                                >
                                  Sepete Ekle
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    {availableSpareParts.length === 0 && (
                      <div className="col-span-full flex flex-col items-center justify-center py-20 text-zinc-500">
                        <Wrench className="h-12 w-12 mb-4 opacity-20" />
                        <p className="text-sm font-medium">Yedek parça bulunamadı</p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>
            </CardContent>
          </Tabs>
        </Card>
      </div>

      {/* 3. SAĞ PANEL: Sepet */}
      <div className="w-[420px] flex flex-col gap-4 shrink-0">
        <Card className="border-zinc-800/60 bg-zinc-950/40 backdrop-blur-xl flex flex-col h-full rounded-3xl shadow-2xl relative overflow-hidden">
          {/* Subtle glow in background */}
          <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />

          <CardHeader className="px-5 pt-5 pb-4 relative z-10 border-b border-zinc-800/60 shrink-0">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl font-bold text-zinc-100 flex items-center gap-2.5">
                <div className="p-2.5 bg-amber-500/10 rounded-xl text-amber-500">
                  <ShoppingBag className="h-5 w-5" />
                </div>
                Sepet
              </CardTitle>
              {cart.length > 0 && (
                <Badge className="bg-zinc-800 text-zinc-300 border-zinc-700/50 px-2.5 py-1 rounded-lg">
                  {cart.length} Ürün
                </Badge>
              )}
            </div>
          </CardHeader>

          <CardContent className="flex-1 flex flex-col p-0 min-h-0 overflow-hidden relative z-10">

            {/* Müşteri Bloğu - sabit, küçülmez */}
            {selectedCustomer && (
              <div className="px-5 pt-3 pb-2 shrink-0">
                <div className="flex items-center gap-3 p-3 rounded-xl bg-blue-500/10 border border-blue-500/20">
                  <div className="w-9 h-9 rounded-full bg-blue-500 flex items-center justify-center font-bold text-sm text-white shrink-0">
                    {getInitials(selectedCustomer.first_name, selectedCustomer.last_name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-blue-100 truncate">
                      {isCensored ? "**** ****" : `${selectedCustomer.first_name} ${selectedCustomer.last_name}`}
                    </div>
                    <div className="text-xs text-blue-300/70 flex items-center gap-1">
                      <User className="h-3 w-3" />
                      {isCensored ? "***********" : selectedCustomer.identity_number}
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedCustomer(null)}
                    className="p-1 rounded-lg text-blue-400/50 hover:text-blue-300 hover:bg-blue-500/20 transition-colors shrink-0"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* Sepet Ürünleri - esnek, kaydırılabilir */}
            <ScrollArea className="flex-1 px-5 min-h-0">
              <AnimatePresence mode="popLayout">
                {cart.length > 0 ? (
                  <div className="space-y-2 py-3">
                    {cart.map((item, index) => (
                      <motion.div
                        layout
                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, x: 20 }}
                        key={`${item.item_type}-${item.item_id}`}
                        className="flex items-center justify-between gap-2 p-3 rounded-xl border border-zinc-800/50 bg-zinc-900/60"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-semibold text-zinc-100 truncate">{item.item_name}</div>
                          {item.chassis_number && (
                            <div className="text-[11px] font-mono text-blue-400 font-medium">
                              Şasi: {item.chassis_number}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {item.item_type === "spare_part" && (
                            <div className="flex items-center gap-1 bg-zinc-950/50 rounded-lg p-0.5 border border-zinc-800/50">
                              <button onClick={() => updateCartQuantity(index, item.quantity - 1)} className="w-6 h-6 flex items-center justify-center text-zinc-400 hover:text-zinc-100 rounded-md hover:bg-zinc-800 transition-colors text-sm font-bold">-</button>
                              <span className="text-xs font-medium w-5 text-center text-zinc-200">{item.quantity}</span>
                              <button onClick={() => updateCartQuantity(index, item.quantity + 1)} className="w-6 h-6 flex items-center justify-center text-zinc-400 hover:text-zinc-100 rounded-md hover:bg-zinc-800 transition-colors text-sm font-bold">+</button>
                            </div>
                          )}
                          <button onClick={() => removeFromCart(index)} className="p-1.5 rounded-lg text-zinc-600 hover:text-red-400 hover:bg-red-500/10 transition-colors">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex flex-col items-center justify-center py-16 text-zinc-500"
                  >
                    <motion.div animate={{ y: [0, -10, 0] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}>
                      <ShoppingBag className="h-14 w-14 mb-4 opacity-20" />
                    </motion.div>
                    <p className="text-sm font-medium text-zinc-400">Sepetiniz boş</p>
                    <p className="text-xs mt-1.5 text-zinc-600 text-center max-w-[180px]">Satışa başlamak için sol taraftan ürün ekleyin.</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </ScrollArea>

            {/* Ödeme Footer - sabit, hiç büyümez */}
            {cart.length > 0 && (
              <div className="shrink-0 bg-zinc-900/90 border-t border-zinc-800/60 px-5 pt-3 pb-4 backdrop-blur-md flex flex-col gap-2.5">

                {/* Özet Footer */}
                <div className="flex items-center justify-between py-1">
                  <span className="text-sm font-medium text-zinc-400">Toplam Ürün</span>
                  <span className="text-xl font-bold text-emerald-400 tabular-nums">
                    {cart.reduce((sum, item) => sum + item.quantity, 0)} Adet
                  </span>
                </div>

                {!selectedCustomer && (
                  <div className="text-xs text-amber-400/90 bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-2 text-center font-medium">
                    Satışı tamamlamak için müşteri seçin
                  </div>
                )}

                <Button
                  onClick={handleCompleteSale}
                  disabled={!canComplete || submitting}
                  className="w-full h-11 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm gap-2 transition-all duration-300 hover:shadow-lg hover:shadow-blue-600/25 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <><Check className="h-5 w-5" />SATIŞI TAMAMLA</>}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
