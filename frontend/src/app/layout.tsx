"use client"

import { useEffect, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import { Inter } from "next/font/google"
import { ThemeProvider } from "next-themes"
import { Toaster } from "sonner"
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
  const [checked, setChecked] = useState(false)

  useEffect(() => {
    if (!isLoginPage && !isLoggedIn()) {
      router.replace("/login")
    } else {
      setChecked(true)
    }
  }, [pathname, isLoginPage, router])

  // While checking auth, show nothing to avoid flash
  if (!isLoginPage && !checked) {
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
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="dark" disableTransitionOnChange>
          {isLoginPage ? (
            // Login page: full screen, no sidebar/header
            <>
              {children}
              <Toaster richColors position="top-right" />
            </>
          ) : (
            // App pages: with sidebar and header
            <div className="flex h-screen overflow-hidden">
              <Sidebar />
              <div className="flex flex-1 flex-col overflow-hidden">
                <Header />
                <main className="flex-1 overflow-y-auto p-6">
                  {children}
                </main>
              </div>
            </div>
          )}
          {!isLoginPage && <Toaster richColors position="top-right" />}
        </ThemeProvider>
      </body>
    </html>
  )
}
