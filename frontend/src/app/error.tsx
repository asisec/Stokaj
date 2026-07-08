"use client"

import { useEffect } from "react"
import Link from "next/link"
import { ShieldAlert, RefreshCcw, Home } from "lucide-react"

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service if needed
    console.error(error)
  }, [error])

  return (
    <div className="flex h-[80vh] w-full flex-col items-center justify-center p-6 text-center">
      <div className="relative mb-8">
        <div className="absolute -inset-1 rounded-full bg-red-500/20 blur-xl"></div>
        <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-red-500/10 text-red-500 ring-1 ring-red-500/20">
          <ShieldAlert className="h-12 w-12" />
        </div>
      </div>

      <h1 className="bg-gradient-to-br from-white to-zinc-400 bg-clip-text text-5xl font-black tracking-tight text-transparent sm:text-6xl">
        500
      </h1>
      <h2 className="mt-4 text-2xl font-bold tracking-tight text-zinc-200">
        Sunucu Hatası
      </h2>
      <p className="mt-3 max-w-md text-zinc-400">
        Beklenmedik bir hata oluştu. Sunucu isteğinizi işlerken bir problemle karşılaştı.
      </p>

      <div className="mt-8 rounded-lg bg-zinc-900/50 p-4 border border-red-500/10 text-left w-full max-w-md">
        <p className="text-xs font-mono text-red-400/80 break-all">
          {error.message || "Bilinmeyen bir hata oluştu."}
        </p>
      </div>

      <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
        <button
          onClick={() => reset()}
          className="group flex items-center justify-center gap-2 rounded-xl bg-red-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-red-500/25 transition-all hover:bg-red-500"
        >
          <RefreshCcw className="h-4 w-4 transition-transform group-hover:rotate-180" />
          Tekrar Dene
        </button>
        <Link
          href="/"
          className="group flex items-center justify-center gap-2 rounded-xl bg-zinc-800/50 px-6 py-3 text-sm font-semibold text-zinc-300 ring-1 ring-zinc-700/50 transition-all hover:bg-zinc-800 hover:text-white"
        >
          <Home className="h-4 w-4 transition-transform group-hover:-translate-y-0.5" />
          Ana Sayfaya Dön
        </Link>
      </div>
    </div>
  )
}
