"use client"

import Link from "next/link"
import { AlertCircle, ArrowLeft, Home } from "lucide-react"

export default function NotFound() {
  return (
    <div className="flex h-[80vh] w-full flex-col items-center justify-center p-6 text-center">
      <div className="relative mb-8">
        <div className="absolute -inset-1 rounded-full bg-blue-500/20 blur-xl"></div>
        <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-blue-500/10 text-blue-500 ring-1 ring-blue-500/20">
          <AlertCircle className="h-12 w-12" />
        </div>
      </div>

      <h1 className="bg-gradient-to-br from-white to-zinc-400 bg-clip-text text-6xl font-black tracking-tight text-transparent">
        404
      </h1>
      <h2 className="mt-4 text-2xl font-bold tracking-tight text-zinc-200">
        Sayfa Bulunamadı
      </h2>
      <p className="mt-3 max-w-md text-zinc-400">
        Aradığınız sayfa silinmiş, adı değiştirilmiş veya geçici olarak kullanılamıyor olabilir. Lütfen adresi kontrol edin.
      </p>

      <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
        <Link
          href="/"
          className="group flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-500/25 transition-all hover:bg-blue-500"
        >
          <Home className="h-4 w-4 transition-transform group-hover:-translate-y-0.5" />
          Ana Sayfaya Dön
        </Link>
        <button
          onClick={() => window.history.back()}
          className="group flex items-center justify-center gap-2 rounded-xl bg-zinc-800/50 px-6 py-3 text-sm font-semibold text-zinc-300 ring-1 ring-zinc-700/50 transition-all hover:bg-zinc-800 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
          Geri Git
        </button>
      </div>
    </div>
  )
}
