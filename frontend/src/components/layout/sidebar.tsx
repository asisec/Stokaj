"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Bike, LayoutDashboard, Wrench, Users, ShoppingCart, LogOut, Tags, Eye, EyeOff, FileText } from "lucide-react"
import { cn } from "@/lib/utils"
import { removeToken } from "@/lib/auth"
import { useCensorStore } from "@/store/censor"

const navigationItems = [
  { label: "Gösterge Paneli", href: "/", icon: LayoutDashboard },
  { label: "Motosikletler", href: "/motorcycles", icon: Bike },
  { label: "Markalar", href: "/brands", icon: Tags },
  { label: "Yedek Parçalar", href: "/spare-parts", icon: Wrench },
  { label: "Müşteriler", href: "/customers", icon: Users },
  { label: "Satış Geçmişi", href: "/sales", icon: FileText },
  { label: "Satış / POS", href: "/pos", icon: ShoppingCart },
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
          "group flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-all duration-300",
          isActive
            ? "bg-gradient-to-r from-blue-600 to-blue-800 text-white shadow-lg shadow-blue-900/20"
            : "text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-100 hover:translate-x-1"
        )}
      >
        <div className={cn(
          "flex items-center justify-center rounded-lg p-1 transition-colors duration-300",
          isActive ? "bg-white/20 text-white" : "bg-zinc-800/50 group-hover:bg-zinc-700/50"
        )}>
          <Icon className="h-4 w-4" />
        </div>
        {label}
      </Link>
    )
  }

  return (
    <aside className="flex h-full w-64 flex-col border-r border-zinc-800/50 bg-zinc-950/80 backdrop-blur-xl">
      <div className="flex h-20 items-center gap-3 border-b border-zinc-800/50 px-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/20">
          <Bike className="h-6 w-6" />
        </div>
        <span className="text-2xl font-black tracking-widest bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">STOKAJ</span>
      </div>

      <nav className="flex-1 space-y-1.5 p-4 overflow-y-auto custom-scrollbar">
        {navigationItems.map((item) => navLink(item.href, item.label, item.icon))}
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
