"use client"

import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"

const pageTitles: Record<string, string> = {
  "/": "Gösterge Paneli",
  "/motorcycles": "Motosikletler",
  "/spare-parts": "Yedek Parçalar",
  "/customers": "Müşteriler",
  "/pos": "Satış / POS",
}

export function Header() {
  const pathname = usePathname()
  const [currentTime, setCurrentTime] = useState("")

  useEffect(() => {
    const updateTime = () => {
      setCurrentTime(
        new Date().toLocaleDateString("tr-TR", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })
      )
    }
    updateTime()
    const interval = setInterval(updateTime, 60000)
    return () => clearInterval(interval)
  }, [])

  const title = pageTitles[pathname] || "Stokaj"

  return (
    <header className="flex h-16 items-center justify-between border-b border-border bg-card px-6">
      <h1 className="text-xl font-semibold text-foreground">{title}</h1>
      <span className="text-sm text-muted-foreground">{currentTime}</span>
    </header>
  )
}
