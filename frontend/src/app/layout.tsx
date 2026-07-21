"use client"

import { useEffect, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import { Inter } from "next/font/google"
import { ThemeProvider } from "next-themes"
import { Toaster } from "@/components/ui/sonner"
import { Sidebar } from "@/components/layout/sidebar"
import { Header } from "@/components/layout/header"
import { isLoggedIn } from "@/lib/auth"
import "./globals.css"

const inter = Inter({ subsets: ["latin"] })

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()
  const isLoginPage = pathname === "/login"
  const isPublicPage = pathname.startsWith("/m/")
  const isStandalonePage = isLoginPage || isPublicPage
  const [checked, setChecked] = useState(false)

  useEffect(() => {
    if (!isStandalonePage && !isLoggedIn()) {
      router.replace("/login")
    } else {
      setChecked(true)
    }
  }, [pathname, isStandalonePage, router])

  // While checking auth, show nothing to avoid flash
  if (!isStandalonePage && !checked) {
    return (
      <html lang="tr" className="dark" suppressHydrationWarning>
        <body className={inter.className}>
          <div className="min-h-screen bg-[#0a0a0f]" />
        </body>
      </html>
    )
  }

  return (
    <html lang="tr" className="dark" suppressHydrationWarning>
      <head>
        <title>Stokaj - Motosiklet Bayi Yönetimi</title>
        <meta name="description" content="Motosiklet bayi envanter ve satış yönetim sistemi" />
      </head>
      <body className={`${inter.className} overflow-hidden`}>
        <ThemeProvider attribute="class" defaultTheme="dark" disableTransitionOnChange>
          {isStandalonePage ? (
            // Standalone pages: full screen, no sidebar/header
            <div className="h-screen w-full overflow-y-auto">
              {children}
              <Toaster position="bottom-right" />
            </div>
          ) : (
            // App pages: with sidebar and header
            <div className="flex h-screen overflow-hidden print:h-auto print:overflow-visible">
              <div className="print:hidden">
                <Sidebar />
              </div>
              <div className="flex flex-1 flex-col overflow-hidden print:overflow-visible">
                <div className="print:hidden">
                  <Header />
                </div>
                <main className="flex-1 overflow-y-auto p-6 print:overflow-visible print:p-0">
                  {children}
                </main>
              </div>
            </div>
          )}
          {!isStandalonePage && <Toaster position="bottom-right" />}
        </ThemeProvider>
      </body>
    </html>
  )
}
