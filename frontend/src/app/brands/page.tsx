"use client";

import { useEffect, useState, useMemo } from "react";
import { api, Motorcycle } from "@/lib/api";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tags, Bike, LayoutGrid, AlertCircle, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function BrandsPage() {
  const [motorcycles, setMotorcycles] = useState<Motorcycle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMotorcycles = async () => {
      try {
        const data = await api.getMotorcycles();
        setMotorcycles(data);
      } catch (error) {
        toast.error("Veriler alınırken bir hata oluştu");
      } finally {
        setLoading(false);
      }
    };
    fetchMotorcycles();
  }, []);

  const brandStats = useMemo(() => {
    const stats: Record<string, { total: number; models: Record<string, number> }> = {};

    motorcycles.forEach((motorcycle) => {
      const brand = motorcycle.brand;
      const model = motorcycle.model;

      if (!stats[brand]) {
        stats[brand] = { total: 0, models: {} };
      }

      stats[brand].total += 1;

      if (!stats[brand].models[model]) {
        stats[brand].models[model] = 0;
      }
      stats[brand].models[model] += 1;
    });

    // Convert to sorted array
    return Object.entries(stats)
      .map(([brand, data]) => ({
        brand,
        total: data.total,
        models: Object.entries(data.models)
          .map(([model, count]) => ({ model, count }))
          .sort((a, b) => b.count - a.count), // Sort models by count descending
      }))
      .sort((a, b) => b.total - a.total); // Sort brands by total count descending
  }, [motorcycles]);

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-100 flex items-center gap-3">
            <div className="p-2.5 bg-blue-500/10 rounded-xl">
              <Tags className="h-6 w-6 text-blue-500" />
            </div>
            Markalar ve Modeller
          </h1>
          <p className="text-zinc-400 mt-2">
            Stoktaki tüm motosikletlerin marka ve model bazlı sayısal dağılımı. Toplam {brandStats.length} farklı marka bulunuyor.
          </p>
        </div>
      </div>

      {brandStats.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-zinc-950/50 rounded-2xl border border-zinc-800 border-dashed">
          <AlertCircle className="h-10 w-10 text-zinc-600 mb-4" />
          <p className="text-zinc-400 text-lg">Sistemde henüz hiç motosiklet bulunmuyor.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {brandStats.map((stat) => (
            <Card key={stat.brand} className="bg-zinc-900/40 border-zinc-800/50 hover:bg-zinc-900/60 transition-colors backdrop-blur-sm overflow-hidden flex flex-col">
              <div className="h-1.5 w-full bg-gradient-to-r from-blue-500/50 to-blue-500/10" />
              <CardHeader className="pb-4">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-xl font-bold text-zinc-100 uppercase tracking-wide">
                      {stat.brand}
                    </CardTitle>
                    <CardDescription className="text-zinc-500 mt-1 flex items-center gap-1.5">
                      <LayoutGrid className="h-3.5 w-3.5" />
                      {stat.models.length} Farklı Model
                    </CardDescription>
                  </div>
                  <Badge variant="secondary" className="bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 text-sm font-semibold px-2.5 py-0.5">
                    {stat.total} Adet
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="flex-1">
                <div className="space-y-2">
                  {stat.models.map((m) => (
                    <div
                      key={m.model}
                      className="flex items-center justify-between p-2.5 rounded-lg bg-zinc-950/50 border border-zinc-800/30 group"
                    >
                      <div className="flex items-center gap-2.5">
                        <Bike className="h-4 w-4 text-zinc-500 group-hover:text-blue-400 transition-colors" />
                        <span className="text-sm font-medium text-zinc-300">{m.model}</span>
                      </div>
                      <span className="text-xs font-semibold text-zinc-400 bg-zinc-800/50 px-2 py-1 rounded-md">
                        {m.count}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
