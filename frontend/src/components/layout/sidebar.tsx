"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Bike, LayoutDashboard, Wrench, Users, ShoppingCart, Settings } from "lucide-react"
import { cn } from "@/lib/utils"

const navigationItems = [
  { label: "Gösterge Paneli", href: "/", icon: LayoutDashboard },
  { label: "Motosikletler", href: "/motorcycles", icon: Bike },
  { label: "Yedek Parçalar", href: "/spare-parts", icon: Wrench },
  { label: "Müşteriler", href: "/customers", icon: Users },
  { label: "Satış / POS", href: "/pos", icon: ShoppingCart },
]

export function Sidebar() {
  const pathname = usePathname()

  const navLink = (href: string, label: string, Icon: React.ElementType) => {
    const isActive = pathname === href || (href !== "/" && pathname.startsWith(href))
    return (
      <Link
        key={href}
        href={href}
        className={cn(
          "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
          isActive
            ? "border-l-2 border-sidebar-primary bg-sidebar-accent text-sidebar-primary"
            : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
        )}
      >
        <Icon className="h-5 w-5" />
        {label}
      </Link>
    )
  }

  return (
    <aside className="flex h-full w-64 flex-col border-r border-sidebar-border bg-sidebar">
      <div className="flex h-16 items-center gap-3 border-b border-sidebar-border px-6 bg-gradient-to-r from-sidebar-primary/10 to-transparent">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
          <Bike className="h-5 w-5" />
        </div>
        <span className="text-xl font-bold tracking-wider text-sidebar-foreground">STOKAJ</span>
      </div>

      <nav className="flex-1 space-y-1 p-3">
        {navigationItems.map((item) => navLink(item.href, item.label, item.icon))}
      </nav>

      <div className="p-3 border-t border-sidebar-border">
        {navLink("/settings", "Ayarlar", Settings)}
      </div>
    </aside>
  )
}
