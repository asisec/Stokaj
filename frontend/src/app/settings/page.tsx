"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Settings, Store, BellRing, Shield, Database, Save, Loader2 } from "lucide-react";
import { useSettingsStore } from "@/store/settings";

export default function SettingsPage() {
  const store = useSettingsStore();
  const [loading, setLoading] = useState(false);

  // Local state to track unsubmitted changes
  const [formData, setFormData] = useState({
    storeName: store.storeName,
    taxRate: store.taxRate.toString(),
    lowStockThreshold: store.lowStockThreshold.toString(),
    emailNotifications: store.emailNotifications,
    smsNotifications: store.smsNotifications,
    autoBackup: store.autoBackup,
  });

  const handleChange = (key: keyof typeof formData, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setLoading(true);
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 800));
    
    store.updateSettings({
      storeName: formData.storeName,
      taxRate: parseFloat(formData.taxRate) || 0,
      lowStockThreshold: parseInt(formData.lowStockThreshold) || 5,
      emailNotifications: formData.emailNotifications,
      smsNotifications: formData.smsNotifications,
      autoBackup: formData.autoBackup,
    });
    
    setLoading(false);
    toast.success("Ayarlar başarıyla kaydedildi");
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-100 flex items-center gap-3">
            <div className="p-2.5 bg-blue-500/10 rounded-xl">
              <Settings className="h-6 w-6 text-blue-500" />
            </div>
            Gelişmiş Ayarlar
          </h1>
          <p className="text-zinc-400 mt-2">
            Sistem tercihlerini, vergi oranlarını ve bildirim kurallarını yapılandırın.
          </p>
        </div>
        <Button 
          onClick={handleSave} 
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 text-white gap-2 shadow-lg shadow-blue-500/20"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Değişiklikleri Kaydet
        </Button>
      </div>

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="bg-zinc-900/50 border border-zinc-800/50 p-1 rounded-xl grid grid-cols-4 w-full md:w-auto md:inline-grid">
          <TabsTrigger value="general" className="rounded-lg data-[state=active]:bg-zinc-800 data-[state=active]:text-zinc-100 text-zinc-400">
            <Store className="h-4 w-4 mr-2" />
            Genel
          </TabsTrigger>
          <TabsTrigger value="notifications" className="rounded-lg data-[state=active]:bg-zinc-800 data-[state=active]:text-zinc-100 text-zinc-400">
            <BellRing className="h-4 w-4 mr-2" />
            Bildirimler
          </TabsTrigger>
          <TabsTrigger value="security" className="rounded-lg data-[state=active]:bg-zinc-800 data-[state=active]:text-zinc-100 text-zinc-400">
            <Shield className="h-4 w-4 mr-2" />
            Güvenlik
          </TabsTrigger>
          <TabsTrigger value="advanced" className="rounded-lg data-[state=active]:bg-zinc-800 data-[state=active]:text-zinc-100 text-zinc-400">
            <Database className="h-4 w-4 mr-2" />
            Veri & Yedek
          </TabsTrigger>
        </TabsList>

        <div className="mt-6">
          <TabsContent value="general" className="space-y-6 outline-none">
            <Card className="bg-zinc-900/40 border-zinc-800/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-xl font-bold text-zinc-100">Mağaza Bilgileri</CardTitle>
                <CardDescription className="text-zinc-400">
                  İşletmenizin temel bilgileri ve sistemsel varsayılan değerleri.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-3">
                  <Label htmlFor="storeName" className="text-zinc-300">Mağaza / İşletme Adı</Label>
                  <Input 
                    id="storeName" 
                    value={formData.storeName}
                    onChange={(e) => handleChange("storeName", e.target.value)}
                    className="bg-zinc-950/50 border-zinc-800 text-zinc-100 focus:border-blue-500/50" 
                  />
                  <p className="text-xs text-zinc-500">Bu isim fatura ve teklif formlarında kullanılacaktır.</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="grid gap-3">
                    <Label htmlFor="taxRate" className="text-zinc-300">Varsayılan KDV Oranı (%)</Label>
                    <Input 
                      id="taxRate" 
                      type="number" 
                      value={formData.taxRate}
                      onChange={(e) => handleChange("taxRate", e.target.value)}
                      className="bg-zinc-950/50 border-zinc-800 text-zinc-100 focus:border-blue-500/50" 
                    />
                  </div>
                  <div className="grid gap-3">
                    <Label htmlFor="lowStockThreshold" className="text-zinc-300">Kritik Stok Uyarısı (Adet)</Label>
                    <Input 
                      id="lowStockThreshold" 
                      type="number" 
                      value={formData.lowStockThreshold}
                      onChange={(e) => handleChange("lowStockThreshold", e.target.value)}
                      className="bg-zinc-950/50 border-zinc-800 text-zinc-100 focus:border-blue-500/50" 
                    />
                    <p className="text-xs text-zinc-500">Yedek parçalar bu adedin altına düşünce uyarı verilir.</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-6 outline-none">
            <Card className="bg-zinc-900/40 border-zinc-800/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-xl font-bold text-zinc-100">İletişim & Bildirimler</CardTitle>
                <CardDescription className="text-zinc-400">
                  Hangi durumlarda ve hangi kanallardan bildirim almak istediğinizi seçin.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center space-x-4 rounded-xl border border-zinc-800/50 bg-zinc-950/50 p-4 transition-colors hover:border-zinc-700/50">
                  <Checkbox 
                    id="emailNotifications" 
                    checked={formData.emailNotifications}
                    onCheckedChange={(checked) => handleChange("emailNotifications", checked as boolean)}
                    className="border-zinc-700 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                  />
                  <div className="flex-1 space-y-1">
                    <Label htmlFor="emailNotifications" className="text-zinc-200 text-sm font-medium leading-none cursor-pointer">
                      E-Posta Bildirimleri
                    </Label>
                    <p className="text-sm text-zinc-500">
                      Günlük satış özetlerini ve stok uyarılarını e-posta olarak alın.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4 rounded-xl border border-zinc-800/50 bg-zinc-950/50 p-4 transition-colors hover:border-zinc-700/50">
                  <Checkbox 
                    id="smsNotifications" 
                    checked={formData.smsNotifications}
                    onCheckedChange={(checked) => handleChange("smsNotifications", checked as boolean)}
                    className="border-zinc-700 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                  />
                  <div className="flex-1 space-y-1">
                    <Label htmlFor="smsNotifications" className="text-zinc-200 text-sm font-medium leading-none cursor-pointer">
                      SMS Uyarıları
                    </Label>
                    <p className="text-sm text-zinc-500">
                      Sadece kritik güvenlik ve sistem hatalarında SMS ile anında haberdar olun.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security" className="space-y-6 outline-none">
            <Card className="bg-zinc-900/40 border-zinc-800/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-xl font-bold text-zinc-100">Güvenlik Ayarları</CardTitle>
                <CardDescription className="text-zinc-400">
                  Hesap güvenliğiniz ve oturum yönetimi.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-3 max-w-sm">
                  <Label htmlFor="currentPass" className="text-zinc-300">Mevcut Şifre</Label>
                  <Input id="currentPass" type="password" placeholder="••••••••" className="bg-zinc-950/50 border-zinc-800 text-zinc-100" />
                </div>
                <div className="grid gap-3 max-w-sm">
                  <Label htmlFor="newPass" className="text-zinc-300">Yeni Şifre</Label>
                  <Input id="newPass" type="password" placeholder="••••••••" className="bg-zinc-950/50 border-zinc-800 text-zinc-100" />
                </div>
                <Button variant="secondary" className="bg-zinc-800 hover:bg-zinc-700 text-zinc-100">
                  Şifreyi Güncelle
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="advanced" className="space-y-6 outline-none">
            <Card className="bg-zinc-900/40 border-zinc-800/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-xl font-bold text-zinc-100">Veritabanı ve Yedekleme</CardTitle>
                <CardDescription className="text-zinc-400">
                  Veri bütünlüğünü sağlama ve dışa aktarma seçenekleri.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center space-x-4 rounded-xl border border-zinc-800/50 bg-zinc-950/50 p-4 transition-colors hover:border-zinc-700/50">
                  <Checkbox 
                    id="autoBackup" 
                    checked={formData.autoBackup}
                    onCheckedChange={(checked) => handleChange("autoBackup", checked as boolean)}
                    className="border-zinc-700 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                  />
                  <div className="flex-1 space-y-1">
                    <Label htmlFor="autoBackup" className="text-zinc-200 text-sm font-medium leading-none cursor-pointer">
                      Otomatik Bulut Yedekleme
                    </Label>
                    <p className="text-sm text-zinc-500">
                      Veritabanınız her gece saat 03:00'da güvenli bulut sunucularına şifrelenerek yedeklenir.
                    </p>
                  </div>
                </div>

                <div className="pt-4 border-t border-zinc-800/50 flex flex-col sm:flex-row gap-4">
                  <Button variant="outline" className="border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100">
                    Sistemi Dışa Aktar (.CSV)
                  </Button>
                  <Button variant="destructive" className="bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500 hover:text-white">
                    Tüm Verileri Sıfırla
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
