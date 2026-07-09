"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { api, type Customer, type Motorcycle } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  Search,
  X,
  ShoppingCart,
  User,
  Phone,
  Bike,
  CreditCard,
  Banknote,
  Building2,
  Check,
  Loader2,
  Tag,
  Plus,
  Trash2,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface CartItem {
  item_type: "motorcycle";
  item_id: number;
  item_name: string;
  quantity: number;
  unit_price: number;
}

interface PaymentLine {
  id: number;
  method: string;
  amount: string;
  installments?: number;
}

const paymentMethods = [
  { value: "cash", label: "Nakit", icon: Banknote },
  { value: "credit_card", label: "Kredi Kartı", icon: CreditCard },
  { value: "bank_transfer", label: "Havale / EFT", icon: Building2 },
];

const installmentOptions = [0, 2, 3, 4, 6, 9, 12];

const methodLabel = (value: string) =>
  paymentMethods.find((m) => m.value === value)?.label ?? value;

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(value);

export default function POSPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [motorcycles, setMotorcycles] = useState<Motorcycle[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [paymentLines, setPaymentLines] = useState<PaymentLine[]>([
    { id: 1, method: "cash", amount: "" },
  ]);
  const [customerSearch, setCustomerSearch] = useState("");
  const [productSearch, setProductSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [customPrices, setCustomPrices] = useState<Record<number, string>>({});
  const [nextId, setNextId] = useState(2);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [customersData, motorcyclesData] = await Promise.all([
        api.getCustomers(),
        api.getMotorcycles(),
      ]);
      setCustomers(customersData);
      setMotorcycles(motorcyclesData);
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

  const cartTotal = useMemo(
    () => cart.reduce((sum, item) => sum + item.unit_price * item.quantity, 0),
    [cart]
  );

  const paidTotal = useMemo(
    () =>
      paymentLines.reduce((sum, line) => {
        const val = parseFloat(line.amount);
        return sum + (isNaN(val) ? 0 : val);
      }, 0),
    [paymentLines]
  );

  const remaining = cartTotal - paidTotal;

  const addMotorcycleToCart = (motorcycle: Motorcycle) => {
    const existing = cart.find(
      (item) => item.item_type === "motorcycle" && item.item_id === motorcycle.id
    );
    if (existing) {
      toast.error("Bu motosiklet zaten sepette");
      return;
    }
    const priceStr = customPrices[motorcycle.id];
    const price = priceStr ? parseFloat(priceStr) : 0;
    if (!price || price <= 0) {
      toast.error("Lütfen önce satış fiyatını girin");
      return;
    }
    setCart((prev) => [
      ...prev,
      {
        item_type: "motorcycle",
        item_id: motorcycle.id,
        item_name: `${motorcycle.brand} ${motorcycle.model} (${motorcycle.year})`,
        quantity: 1,
        unit_price: price,
      },
    ]);
    toast.success("Motosiklet sepete eklendi");
  };

  const removeFromCart = (index: number) => {
    setCart((prev) => prev.filter((_, i) => i !== index));
  };

  const addPaymentLine = () => {
    setPaymentLines((prev) => [...prev, { id: nextId, method: "cash", amount: "" }]);
    setNextId((n) => n + 1);
  };

  const removePaymentLine = (id: number) => {
    setPaymentLines((prev) => prev.filter((line) => line.id !== id));
  };

  const updatePaymentLine = (id: number, field: keyof PaymentLine, value: any) => {
    setPaymentLines((prev) =>
      prev.map((line) => (line.id === id ? { ...line, [field]: value } : line))
    );
  };

  const fillRemaining = (id: number) => {
    const others = paymentLines
      .filter((l) => l.id !== id)
      .reduce((sum, l) => {
        const v = parseFloat(l.amount);
        return sum + (isNaN(v) ? 0 : v);
      }, 0);
    const rem = cartTotal - others;
    if (rem > 0) {
      updatePaymentLine(id, "amount", rem.toFixed(2));
    }
  };

  const canComplete =
    !!selectedCustomer &&
    cart.length > 0 &&
    paymentLines.length > 0 &&
    paymentLines.every((l) => l.amount && parseFloat(l.amount) > 0) &&
    Math.abs(remaining) < 0.01;

  const handleCompleteSale = async () => {
    if (!canComplete) return;
    setSubmitting(true);
    try {
      await api.createSale({
        customer_id: selectedCustomer!.id,
        payments: paymentLines.map((l) => ({
          method: l.method === "credit_card" && l.installments && l.installments > 0 ? `Kredi Kartı (${l.installments} Taksit)` : methodLabel(l.method),
          amount: parseFloat(l.amount),
        })),
        items: cart.map((item) => ({
          item_type: item.item_type,
          item_id: item.item_id,
          quantity: item.quantity,
          unit_price: item.unit_price,
        })),
      });
      toast.success("Satış başarıyla tamamlandı!");
      setCart([]);
      setSelectedCustomer(null);
      setPaymentLines([{ id: 1, method: "cash", amount: "" }]);
      setNextId(2);
      setCustomPrices({});
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
        <Skeleton className="w-80 h-full bg-zinc-800/50 rounded-2xl" />
        <Skeleton className="flex-1 h-full bg-zinc-800/50 rounded-2xl" />
        <Skeleton className="w-96 h-full bg-zinc-800/50 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="flex gap-4 h-[calc(100vh-8rem)] p-2">
      <div className="w-72 flex flex-col gap-4 shrink-0">
        <Card className="border-zinc-800/50 bg-zinc-900/50 backdrop-blur-sm flex flex-col h-full">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold text-zinc-200 flex items-center gap-2">
              <User className="h-4 w-4 text-blue-400" />
              Müşteri Seçimi
            </CardTitle>
            <div className="relative mt-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-500" />
              <Input
                placeholder="Müşteri ara..."
                value={customerSearch}
                onChange={(e) => setCustomerSearch(e.target.value)}
                className="pl-9 h-9 bg-zinc-800/50 border-zinc-700/50 text-zinc-200 text-sm placeholder:text-zinc-600 focus:border-blue-500/50 transition-colors"
              />
            </div>
          </CardHeader>
          <CardContent className="flex-1 p-0 min-h-0">
            <ScrollArea className="h-full px-4 pb-4">
              <div className="space-y-2">
                {filteredCustomers.map((customer) => (
                  <button
                    key={customer.id}
                    onClick={() => setSelectedCustomer(customer)}
                    className={cn(
                      "w-full text-left p-3 rounded-xl border transition-all duration-200 group",
                      selectedCustomer?.id === customer.id
                        ? "border-blue-500/50 bg-blue-500/10 shadow-lg shadow-blue-500/5"
                        : "border-zinc-800/50 bg-zinc-800/20 hover:bg-zinc-800/40 hover:border-zinc-700/50"
                    )}
                  >
                    <div className="font-medium text-sm text-zinc-200 group-hover:text-zinc-100 transition-colors">
                      {customer.first_name} {customer.last_name}
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-zinc-500 mt-1">
                      <Phone className="h-3 w-3" />
                      {customer.phone}
                    </div>
                  </button>
                ))}
                {filteredCustomers.length === 0 && (
                  <div className="text-center py-8 text-zinc-600 text-sm">
                    Müşteri bulunamadı
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      <div className="flex-1 flex flex-col gap-4 min-w-0">
        <Card className="border-zinc-800/50 bg-zinc-900/50 backdrop-blur-sm flex flex-col h-full">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold text-zinc-200 flex items-center gap-2">
              <Bike className="h-4 w-4 text-blue-400" />
              Mevcut Motosikletler
            </CardTitle>
            <div className="relative mt-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-500" />
              <Input
                placeholder="Marka, model veya şasi no ara..."
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                className="pl-9 h-9 bg-zinc-800/50 border-zinc-700/50 text-zinc-200 text-sm placeholder:text-zinc-600 focus:border-zinc-500/50 transition-colors"
              />
            </div>
          </CardHeader>
          <CardContent className="flex-1 p-0 min-h-0">
            <ScrollArea className="h-full px-4 pb-4">
              <div className="space-y-3">
                {availableMotorcycles.map((motorcycle) => {
                  const inCart = cart.some(
                    (item) =>
                      item.item_type === "motorcycle" && item.item_id === motorcycle.id
                  );
                  return (
                    <div
                      key={motorcycle.id}
                      className={cn(
                        "p-4 rounded-xl border transition-all duration-200",
                        inCart
                          ? "border-zinc-800/30 bg-zinc-800/10 opacity-50"
                          : "border-zinc-800/50 bg-zinc-800/20 hover:border-blue-500/20"
                      )}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-sm text-zinc-200">
                            {motorcycle.brand} {motorcycle.model}
                          </div>
                          <div className="flex items-center gap-3 mt-1">
                            <span className="text-xs text-zinc-500">{motorcycle.year}</span>
                            <span className="text-xs text-zinc-600">•</span>
                            <span className="text-xs text-zinc-500">{motorcycle.color}</span>
                            <span className="text-xs text-zinc-600">•</span>
                            <span className="text-[10px] font-mono text-zinc-600">
                              {motorcycle.chassis_number}
                            </span>
                            <span className="text-xs text-zinc-600">•</span>
                            <span className="text-xs text-emerald-500 font-medium">
                              Alış: {formatCurrency(motorcycle.purchase_price)}
                            </span>
                          </div>
                          {!inCart && (
                            <div className="flex items-center gap-2 mt-3">
                              <div className="relative flex-1">
                                <Tag className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-zinc-500" />
                                <Input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  placeholder="Satış fiyatı (₺)"
                                  value={customPrices[motorcycle.id] || ""}
                                  onChange={(e) =>
                                    setCustomPrices((prev) => ({
                                      ...prev,
                                      [motorcycle.id]: e.target.value,
                                    }))
                                  }
                                  className="pl-8 h-8 text-sm bg-zinc-900/50 border-zinc-700/50 text-zinc-200 placeholder:text-zinc-600 focus:border-blue-500/50"
                                />
                              </div>
                              <Button
                                size="sm"
                                onClick={() => addMotorcycleToCart(motorcycle)}
                                className="h-8 px-3 bg-blue-600 hover:bg-blue-700 text-white text-xs"
                              >
                                Ekle
                              </Button>
                            </div>
                          )}
                        </div>
                        {inCart && (
                          <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30 text-[10px] shrink-0">
                            <Check className="h-3 w-3 mr-1" />
                            Sepette
                          </Badge>
                        )}
                      </div>
                    </div>
                  );
                })}
                {availableMotorcycles.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-16 text-zinc-600">
                    <Bike className="h-10 w-10 mb-3 opacity-30" />
                    <p className="text-sm">Mevcut motosiklet bulunamadı</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      <div className="w-[420px] flex flex-col gap-4 shrink-0">
        <Card className="border-zinc-800/50 bg-zinc-900/50 backdrop-blur-sm flex flex-col h-full">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold text-zinc-200 flex items-center gap-2">
              <ShoppingCart className="h-4 w-4 text-amber-400" />
              Sepet
              {cart.length > 0 && (
                <Badge className="ml-auto bg-amber-500/20 text-amber-300 border-amber-500/30 text-xs">
                  {cart.length} ürün
                </Badge>
              )}
            </CardTitle>
            {selectedCustomer && (
              <div className="mt-2 p-2.5 rounded-lg bg-blue-500/10 border border-blue-500/20">
                <div className="text-xs font-semibold text-blue-300">
                  {selectedCustomer.first_name} {selectedCustomer.last_name}
                </div>
                <div className="text-[11px] text-zinc-500 mt-0.5">{selectedCustomer.phone}</div>
              </div>
            )}
          </CardHeader>

          <CardContent className="flex-1 flex flex-col p-0 min-h-0 overflow-hidden">
            <ScrollArea className="flex-1 px-4">
              {cart.length > 0 ? (
                <div className="space-y-2 pb-2">
                  {cart.map((item, index) => (
                    <div
                      key={`${item.item_type}-${item.item_id}`}
                      className="p-3 rounded-xl border border-zinc-800/50 bg-zinc-800/20 animate-in slide-in-from-right-2"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-zinc-200 truncate">
                            {item.item_name}
                          </div>
                          <div className="text-xs text-zinc-500 mt-0.5">
                            {formatCurrency(item.unit_price)}
                          </div>
                        </div>
                        <button
                          onClick={() => removeFromCart(index)}
                          className="p-1 rounded-md text-zinc-600 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-zinc-600">
                  <ShoppingCart className="h-8 w-8 mb-2 opacity-20" />
                  <p className="text-sm">Sepet boş</p>
                </div>
              )}

              {cart.length > 0 && (
                <div className="pb-4 space-y-3">
                  <Separator className="bg-zinc-800/50" />

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-zinc-400">Toplam Tutar</span>
                    <span className="text-lg font-bold text-zinc-100 tabular-nums">
                      {formatCurrency(cartTotal)}
                    </span>
                  </div>

                  <Separator className="bg-zinc-800/50" />

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs text-zinc-400 font-medium">Ödeme Yöntemleri</Label>
                      <button
                        onClick={addPaymentLine}
                        className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 transition-colors"
                      >
                        <Plus className="h-3 w-3" />
                        Ekle
                      </button>
                    </div>

                    <div className="space-y-2">
                      {paymentLines.map((line) => (
                        <div key={line.id} className="flex items-center gap-2">
                          <Select
                            value={line.method}
                            onValueChange={(val) => updatePaymentLine(line.id, "method", val)}
                          >
                            <SelectTrigger className="h-9 flex-1 bg-zinc-800/50 border-zinc-700/50 text-zinc-300 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-zinc-900 border-zinc-800">
                              {paymentMethods.map((m) => {
                                const Icon = m.icon;
                                return (
                                  <SelectItem
                                    key={m.value}
                                    value={m.value}
                                    className="text-zinc-300 focus:bg-zinc-800 text-xs"
                                  >
                                    <span className="flex items-center gap-1.5">
                                      <Icon className="h-3.5 w-3.5" />
                                      {m.label}
                                    </span>
                                  </SelectItem>
                                );
                              })}
                            </SelectContent>
                          </Select>

                          {line.method === "credit_card" && (
                            <Select
                              value={line.installments?.toString() || "0"}
                              onValueChange={(val) => updatePaymentLine(line.id, "installments", parseInt(val))}
                            >
                              <SelectTrigger className="h-9 w-28 bg-zinc-800/50 border-zinc-700/50 text-zinc-300 text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="bg-zinc-900 border-zinc-800">
                                {installmentOptions.map((opt) => (
                                  <SelectItem
                                    key={opt}
                                    value={opt.toString()}
                                    className="text-zinc-300 focus:bg-zinc-800 text-xs"
                                  >
                                    {opt === 0 ? "Tek Çekim" : `${opt} Taksit`}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}

                          <div className="relative w-32">
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              placeholder="Tutar"
                              value={line.amount}
                              onChange={(e) => updatePaymentLine(line.id, "amount", e.target.value)}
                              className="h-9 pr-8 bg-zinc-800/50 border-zinc-700/50 text-zinc-200 text-xs placeholder:text-zinc-600 focus:border-blue-500/50"
                            />
                            <button
                              onClick={() => fillRemaining(line.id)}
                              title="Kalan tutarı doldur"
                              className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-blue-400 transition-colors text-[10px] font-bold"
                            >
                              ↓
                            </button>
                          </div>

                          {paymentLines.length > 1 && (
                            <button
                              onClick={() => removePaymentLine(line.id)}
                              className="p-1.5 rounded-md text-zinc-600 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>

                    <div
                      className={cn(
                        "flex items-center justify-between p-2.5 rounded-lg text-xs font-semibold transition-colors",
                        Math.abs(remaining) < 0.01
                          ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400"
                          : remaining > 0
                          ? "bg-amber-500/10 border border-amber-500/20 text-amber-400"
                          : "bg-red-500/10 border border-red-500/20 text-red-400"
                      )}
                    >
                      <span className="flex items-center gap-1.5">
                        {Math.abs(remaining) < 0.01 ? (
                          <Check className="h-3.5 w-3.5" />
                        ) : (
                          <AlertCircle className="h-3.5 w-3.5" />
                        )}
                        {Math.abs(remaining) < 0.01
                          ? "Ödeme tamamlandı"
                          : remaining > 0
                          ? "Kalan"
                          : "Fazla ödeme"}
                      </span>
                      {Math.abs(remaining) >= 0.01 && (
                        <span className="tabular-nums">
                          {formatCurrency(Math.abs(remaining))}
                        </span>
                      )}
                    </div>
                  </div>

                  {!selectedCustomer && (
                    <div className="text-xs text-amber-400/80 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2 text-center">
                      Satışı tamamlamak için müşteri seçin
                    </div>
                  )}

                  <Button
                    onClick={handleCompleteSale}
                    disabled={!canComplete || submitting}
                    className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm gap-2 transition-all duration-200 hover:shadow-lg hover:shadow-emerald-600/20 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {submitting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <Check className="h-4 w-4" />
                        Satışı Tamamla
                      </>
                    )}
                  </Button>
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
