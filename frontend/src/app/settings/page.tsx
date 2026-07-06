"use client";

import { useEffect, useRef, useState } from "react";
import { api, type SMTPSettings } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  Mail,
  Server,
  Key,
  User,
  AtSign,
  Save,
  Upload,
  ShieldAlert,
  CheckCircle2,
  Loader2,
  Database,
  FileUp,
  X,
} from "lucide-react";
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

const emptySettings: SMTPSettings = {
  smtp_host: "",
  smtp_port: "587",
  smtp_username: "",
  smtp_password: "",
  recipient_email: "",
};

export default function SettingsPage() {
  const [settings, setSettings] = useState<SMTPSettings>(emptySettings);
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [restoring, setRestoring] = useState(false);
  const [showRestoreDialog, setShowRestoreDialog] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    api
      .getSettings()
      .then((data) => setSettings({ ...emptySettings, ...data }))
      .catch(() => {})
      .finally(() => setLoadingSettings(false));
  }, []);

  const handleSaveSettings = async () => {
    setSavingSettings(true);
    try {
      await api.saveSettings(settings);
      toast.success("Ayarlar başarıyla kaydedildi");
      setSettings(prev => ({ ...prev, is_configured: true }));
      setShowForm(false);
    } catch {
      toast.error("Ayarlar kaydedilemedi");
    } finally {
      setSavingSettings(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.endsWith(".sql")) {
      toast.error("Sadece .sql uzantılı dosyalar kabul edilir");
      return;
    }
    setSelectedFile(file);
  };

  const handleRestoreConfirm = async () => {
    if (!selectedFile) return;
    setRestoring(true);
    setShowRestoreDialog(false);
    try {
      await api.restoreDatabase(selectedFile);
      toast.success("Veritabanı başarıyla geri yüklendi");
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Geri yükleme başarısız";
      toast.error(message);
    } finally {
      setRestoring(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 py-4">
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-br from-white to-zinc-400 bg-clip-text text-transparent">Ayarlar</h1>
        <p className="text-sm text-zinc-400 mt-1.5">
          Sistem tercihlerinizi, e-posta bildirimlerini ve yedekleme yapılandırmasını yönetin
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Email Settings Card */}
        <Card className="border-zinc-800/50 bg-black/40 backdrop-blur-xl shadow-2xl relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400 ring-1 ring-blue-500/20">
                <Mail className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-lg font-semibold text-zinc-100">
                  Otomatik Yedekleme (E-Posta)
                </CardTitle>
                <CardDescription className="text-zinc-500 text-xs mt-1">
                  Her işlem sonrasında veritabanı yedeğiniz bu bilgilerle e-posta olarak iletilir.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-5 relative z-10">
            {loadingSettings ? (
              <div className="space-y-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-12 bg-zinc-800/50 rounded-xl animate-pulse" />
                ))}
              </div>
            ) : settings.is_configured && !showForm ? (
              <div className="flex flex-col items-center justify-center py-6 space-y-4">
                <div className="p-4 bg-emerald-500/10 rounded-full">
                  <CheckCircle2 className="h-10 w-10 text-emerald-400" />
                </div>
                <div className="text-center">
                  <h3 className="text-lg font-medium text-zinc-100">Yedekleme Aktif</h3>
                  <p className="text-sm text-zinc-400 mt-1 max-w-sm">
                    E-posta yedekleme sistemi şu anda yapılandırılmış durumda ve sorunsuz çalışıyor. Güvenliğiniz gereği mevcut yapılandırma bilgileri gizlenmiştir.
                  </p>
                </div>
                <Button
                  onClick={() => setShowForm(true)}
                  variant="outline"
                  className="mt-2 border-zinc-700 bg-transparent hover:bg-zinc-800 text-zinc-300"
                >
                  Ayarları Yeniden Yapılandır
                </Button>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-zinc-400">Yeni Yapılandırma Bilgilerini Girin</p>
                  {settings.is_configured && (
                    <Button variant="ghost" size="sm" onClick={() => setShowForm(false)} className="text-zinc-500 hover:text-zinc-300">
                      <X className="h-4 w-4 mr-1" /> İptal
                    </Button>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-zinc-400 flex items-center gap-1.5">
                      <Server className="h-3.5 w-3.5" />
                      SMTP Sunucusu
                    </Label>
                    <Input
                      placeholder="smtp.gmail.com"
                      value={settings.smtp_host || ""}
                      onChange={(e) =>
                        setSettings((p) => ({ ...p, smtp_host: e.target.value }))
                      }
                      className="bg-zinc-900/50 border-zinc-800 focus:border-blue-500/50 focus:ring-blue-500/20 transition-all rounded-xl h-11 text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-zinc-400 flex items-center gap-1.5">
                      <Server className="h-3.5 w-3.5" />
                      SMTP Port
                    </Label>
                    <Input
                      placeholder="587"
                      value={settings.smtp_port || ""}
                      onChange={(e) =>
                        setSettings((p) => ({ ...p, smtp_port: e.target.value }))
                      }
                      className="bg-zinc-900/50 border-zinc-800 focus:border-blue-500/50 focus:ring-blue-500/20 transition-all rounded-xl h-11 text-sm"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-medium text-zinc-400 flex items-center gap-1.5">
                    <User className="h-3.5 w-3.5" />
                    Gmail Adresi (Gönderici)
                  </Label>
                  <Input
                    placeholder="ornek@gmail.com"
                    type="email"
                    value={settings.smtp_username || ""}
                    onChange={(e) =>
                      setSettings((p) => ({ ...p, smtp_username: e.target.value }))
                    }
                    className="bg-zinc-900/50 border-zinc-800 focus:border-blue-500/50 focus:ring-blue-500/20 transition-all rounded-xl h-11 text-sm"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-medium text-zinc-400 flex items-center gap-1.5">
                    <Key className="h-3.5 w-3.5" />
                    Uygulama Şifresi (App Password)
                  </Label>
                  <Input
                    placeholder="••••••••••••••••"
                    type="password"
                    value={settings.smtp_password || ""}
                    onChange={(e) =>
                      setSettings((p) => ({ ...p, smtp_password: e.target.value }))
                    }
                    className="bg-zinc-900/50 border-zinc-800 focus:border-blue-500/50 focus:ring-blue-500/20 transition-all rounded-xl h-11 text-sm tracking-widest font-mono placeholder:tracking-normal placeholder:font-sans"
                  />
                </div>

                <div className="space-y-2 pt-2">
                  <Label className="text-xs font-medium text-blue-400 flex items-center gap-1.5">
                    <AtSign className="h-3.5 w-3.5" />
                    Yedeklerin Gönderileceği E-Posta
                  </Label>
                  <Input
                    placeholder="alici@gmail.com"
                    type="email"
                    value={settings.recipient_email || ""}
                    onChange={(e) =>
                      setSettings((p) => ({ ...p, recipient_email: e.target.value }))
                    }
                    className="bg-blue-500/5 border-blue-500/20 text-blue-100 focus:border-blue-500/50 focus:ring-blue-500/20 transition-all rounded-xl h-11 text-sm"
                  />
                </div>

                <Separator className="bg-zinc-800" />

                <Button
                  onClick={handleSaveSettings}
                  disabled={savingSettings}
                  className="w-full h-11 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white shadow-lg shadow-blue-500/20 border-0 transition-all duration-300 gap-2"
                >
                  {savingSettings ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  Yapılandırmayı Kaydet
                </Button>
              </>
            )}
          </CardContent>
        </Card>

        {/* Database Restore Card */}
        <Card className="border-zinc-800/50 bg-black/40 backdrop-blur-xl shadow-2xl relative overflow-hidden group h-fit">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 ring-1 ring-amber-500/20">
                <Database className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-lg font-semibold text-zinc-100">
                  Sistem Geri Yükleme
                </CardTitle>
                <CardDescription className="text-zinc-500 text-xs mt-1">
                  E-posta ile iletilen <code className="text-zinc-400 bg-zinc-800/50 px-1 rounded">.sql</code> uzantılı dosyayı içeri aktarın.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6 relative z-10">
            <div
              className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all duration-300 group/drop ${
                selectedFile
                  ? "border-emerald-500/30 bg-emerald-500/5"
                  : "border-zinc-700 hover:border-amber-500/30 hover:bg-amber-500/5"
              }`}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".sql"
                className="hidden"
                onChange={handleFileChange}
              />
              {selectedFile ? (
                <div className="flex flex-col items-center gap-3 animate-in fade-in slide-in-from-bottom-2">
                  <div className="p-3 bg-emerald-500/10 rounded-full text-emerald-400">
                    <CheckCircle2 className="h-8 w-8" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-zinc-200">{selectedFile.name}</p>
                    <p className="text-xs text-zinc-500 mt-0.5">
                      {(selectedFile.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedFile(null);
                      if (fileInputRef.current) fileInputRef.current.value = "";
                    }}
                    className="h-7 text-xs text-zinc-400 hover:text-red-400 hover:bg-red-500/10 mt-2 rounded-full px-4"
                  >
                    Farklı Dosya Seç
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3">
                  <div className="p-4 bg-zinc-800/50 rounded-full text-zinc-400 group-hover/drop:text-amber-400 group-hover/drop:scale-110 group-hover/drop:bg-amber-500/10 transition-all duration-300">
                    <FileUp className="h-8 w-8" />
                  </div>
                  <div>
                    <p className="text-sm text-zinc-300 font-medium">Yedek dosyasını seçin</p>
                    <p className="text-xs text-zinc-500 mt-1">Sürükle bırak veya tıklayarak göz at</p>
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-3 p-4 rounded-xl bg-red-500/5 border border-red-500/10 items-start">
              <ShieldAlert className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-red-400/90">Kritik Uyarı</p>
                <p className="text-xs text-red-400/70 leading-relaxed">
                  Geri yükleme işlemi, sistemdeki tüm mevcut verileri tamamen siler ve yerine yüklediğiniz dosyadaki verileri yazar. Bu işlem kesinlikle geri döndürülemez.
                </p>
              </div>
            </div>

            <Button
              onClick={() => setShowRestoreDialog(true)}
              disabled={!selectedFile || restoring}
              className="w-full h-11 rounded-xl bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white shadow-lg shadow-red-500/20 border-0 transition-all duration-300 gap-2 disabled:opacity-50 disabled:shadow-none"
            >
              {restoring ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Upload className="h-4 w-4" />
              )}
              {restoring ? "Sistem Geri Yükleniyor..." : "Geri Yüklemeyi Başlat"}
            </Button>
          </CardContent>
        </Card>
      </div>

      <AlertDialog open={showRestoreDialog} onOpenChange={setShowRestoreDialog}>
        <AlertDialogContent className="bg-zinc-950 border-zinc-800/80 shadow-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-zinc-100 flex items-center gap-2 text-xl">
              <div className="p-2 bg-red-500/10 text-red-400 rounded-lg">
                <ShieldAlert className="h-5 w-5" />
              </div>
              Son Onay
            </AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-400 mt-4 leading-relaxed">
              <strong className="text-zinc-200">{selectedFile?.name}</strong> adlı dosya kullanılarak sistem geri yüklenecek.<br/><br/>
              Mevcut tüm veritabanınız silinecek ve bu dosyadaki veriler geçerli olacaktır. Bu işlem geri alınamaz. Onaylıyor musunuz?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-6 gap-2 sm:gap-0">
            <AlertDialogCancel className="bg-zinc-900 border-zinc-800 text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors">
              İptal Et
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRestoreConfirm}
              className="bg-red-600 hover:bg-red-500 text-white border-0 transition-colors"
            >
              Evet, Riskleri Kabul Ediyorum
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
