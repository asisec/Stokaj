"use client";

import { useEffect, useState } from "react";
import { api, type Motorcycle } from "@/lib/api";
import { useParams } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ShieldCheck, Info, Calendar, Palette, Tag } from "lucide-react";

export default function MobileMotorcyclePage() {
  const params = useParams();
  const chassis = params.chassis as string;
  const [motorcycle, setMotorcycle] = useState<Motorcycle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (chassis) {
      api.getPublicMotorcycleByChassis(chassis)
        .then(setMotorcycle)
        .catch(() => setError(true))
        .finally(() => setLoading(false));
    }
  }, [chassis]);

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 p-6 flex flex-col items-center justify-center space-y-4">
        <Skeleton className="h-40 w-full max-w-sm rounded-2xl bg-zinc-900" />
        <Skeleton className="h-8 w-3/4 bg-zinc-900" />
        <Skeleton className="h-32 w-full max-w-sm rounded-xl bg-zinc-900" />
      </div>
    );
  }

  if (error || !motorcycle) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-6 text-center">
        <div className="bg-red-500/10 p-4 rounded-full mb-4">
          <Info className="h-8 w-8 text-red-500" />
        </div>
        <h1 className="text-xl font-bold text-zinc-100 mb-2">Bulunamadı</h1>
        <p className="text-zinc-400">Bu şasi numarasına ait bir kayıt bulunamadı veya silinmiş olabilir.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 pb-20">
      {/* Header Image Area (Placeholder gradient for now) */}
      <div className="h-64 w-full bg-gradient-to-br from-zinc-800 to-zinc-900 relative flex items-center justify-center overflow-hidden">
        <ShieldCheck className="h-24 w-24 text-zinc-800/50 absolute" />
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 to-transparent" />
        <Badge
          className={`absolute top-4 right-4 text-sm px-3 py-1 ${
            motorcycle.status === "available"
              ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
              : "bg-red-500/15 text-red-400 border-red-500/30"
          }`}
        >
          {motorcycle.status === "available" ? "Satışta" : "Satıldı"}
        </Badge>
      </div>

      <div className="px-6 -mt-8 relative z-10">
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-2xl backdrop-blur-xl">
          <h1 className="text-3xl font-black text-zinc-100 tracking-tight mb-1">
            {motorcycle.brand}
          </h1>
          <h2 className="text-xl text-zinc-400 font-medium mb-6">
            {motorcycle.model}
          </h2>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-2xl bg-zinc-950/50 border border-zinc-800/50">
              <div className="flex items-center gap-3 text-zinc-400">
                <Tag className="h-5 w-5 text-blue-500" />
                <span className="text-sm font-medium">Şasi No</span>
              </div>
              <span className="text-zinc-100 font-mono text-sm font-semibold">{motorcycle.chassis_number}</span>
            </div>

            <div className="flex items-center justify-between p-4 rounded-2xl bg-zinc-950/50 border border-zinc-800/50">
              <div className="flex items-center gap-3 text-zinc-400">
                <Calendar className="h-5 w-5 text-orange-500" />
                <span className="text-sm font-medium">Model Yılı</span>
              </div>
              <span className="text-zinc-100 font-semibold">{motorcycle.year}</span>
            </div>

            {motorcycle.color && (
              <div className="flex items-center justify-between p-4 rounded-2xl bg-zinc-950/50 border border-zinc-800/50">
                <div className="flex items-center gap-3 text-zinc-400">
                  <Palette className="h-5 w-5 text-purple-500" />
                  <span className="text-sm font-medium">Renk</span>
                </div>
                <span className="text-zinc-100 font-semibold">{motorcycle.color}</span>
              </div>
            )}
          </div>
        </div>
      </div>
      
      <div className="text-center mt-12 mb-4">
        <p className="text-xs text-zinc-600 font-medium tracking-widest uppercase">Stokaj Yönetim Sistemi</p>
      </div>
    </div>
  );
}
