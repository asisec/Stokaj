"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Bike, LayoutDashboard, Wrench, Users, ShoppingCart, LogOut, Tags, FileText, FileCheck2, FileSignature, FileCheck } from "lucide-react"
import { cn } from "@/lib/utils"
import { removeToken } from "@/lib/auth"
import { useCensorStore } from "@/store/censor"

interface NavGroup {
  title?: string
  items: {
    label: string
    href: string
    icon: React.ElementType
  }[]
}

const navigationGroups: NavGroup[] = [
  {
    items: [
      { label: "Gösterge Paneli", href: "/", icon: LayoutDashboard },
    ],
  },
  {
    title: "ENVANTER",
    items: [
      { label: "Motosikletler", href: "/motorcycles", icon: Bike },
      { label: "Yedek Parçalar", href: "/spare-parts", icon: Wrench },
      { label: "Markalar", href: "/brands", icon: Tags },
    ],
  },
  {
    title: "SATIŞ & OPERASYON",
    items: [
      { label: "Satış / POS", href: "/pos", icon: ShoppingCart },
      { label: "Satış Geçmişi", href: "/sales", icon: FileText },
      { label: "Evrak & Noter", href: "/documents", icon: FileCheck2 },
      { label: "Müşteri Sözleşmesi", href: "/contracts", icon: FileSignature },
      { label: "Dijital Sözleşmeler", href: "/contracts/history", icon: FileCheck },
    ],
  },
  {
    title: "MÜŞTERİ",
    items: [
      { label: "Müşteriler", href: "/customers", icon: Users },
    ],
  },
]

export function Sidebar() {
  const pathname = usePathname()
  const { isCensored, toggleCensor } = useCensorStore()

  const navLink = (href: string, label: string, Icon: React.ElementType) => {
    const isActive = pathname === href || (href !== "/" && pathname.startsWith(href))
    return (
      <Link
        key={href}
        href={href}
        className={cn(
          "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium transition-all duration-200",
          isActive
            ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-600/20 font-semibold"
            : "text-zinc-400 hover:bg-zinc-800/40 hover:text-zinc-100 hover:translate-x-0.5"
        )}
      >
        <div className={cn(
          "flex items-center justify-center rounded-lg p-1.5 transition-colors duration-200 shrink-0",
          isActive ? "bg-white/20 text-white" : "bg-zinc-800/60 group-hover:bg-zinc-700/60 text-zinc-400 group-hover:text-zinc-200"
        )}>
          <Icon className="h-4 w-4" />
        </div>
        <span className="truncate">{label}</span>
      </Link>
    )
  }

  return (
    <aside className="flex h-full w-64 flex-col border-r border-zinc-800/50 bg-zinc-950/90 backdrop-blur-xl shrink-0 select-none">
      <div className="flex h-16 items-center gap-3 border-b border-zinc-800/50 px-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/25">
          <Bike className="h-5 w-5" />
        </div>
        <div className="flex flex-col">
          <span className="text-xl font-black tracking-wider bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent">STOKAJ</span>
          <span className="text-[10px] text-zinc-500 font-medium tracking-wide -mt-1">Bayi & Envanter</span>
        </div>
      </div>

      <nav className="flex-1 space-y-4 p-3 overflow-y-auto custom-scrollbar">
        {navigationGroups.map((group, groupIdx) => (
          <div key={groupIdx} className="space-y-1">
            {group.title && (
              <div className="px-3 pt-2 pb-1 text-[10px] font-bold uppercase tracking-wider text-zinc-500/80">
                {group.title}
              </div>
            )}
            <div className="space-y-1">
              {group.items.map((item) => navLink(item.href, item.label, item.icon))}
            </div>
          </div>
        ))}
      </nav>

      <div className="p-4 border-t border-zinc-800/50 bg-zinc-950/50">
        <div className="flex items-center justify-between p-2 rounded-xl hover:bg-zinc-900 transition-colors group">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center border border-zinc-700 shadow-md">
              <Users className="h-4 w-4 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-zinc-200">Yönetici</span>
              <span className="text-[11px] text-zinc-500">Sistem Admini</span>
            </div>
          </div>
          <button
            onClick={() => {
              removeToken()
              window.location.href = "/login"
            }}
            className="p-2 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all duration-300"
            title="Çıkış Yap"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  )
}
