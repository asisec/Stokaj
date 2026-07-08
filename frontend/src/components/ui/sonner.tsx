"use client"

import { useTheme } from "next-themes"
import { Toaster as Sonner } from "sonner"

type ToasterProps = React.ComponentProps<typeof Sonner>

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-zinc-900/95 group-[.toaster]:backdrop-blur-xl group-[.toaster]:text-zinc-100 group-[.toaster]:border-zinc-800/50 group-[.toaster]:shadow-2xl font-medium",
          description: "group-[.toast]:text-zinc-400",
          success:
            "group-[.toaster]:bg-emerald-500/10 group-[.toaster]:text-emerald-500 group-[.toaster]:border-emerald-500/20",
          error:
            "group-[.toaster]:bg-red-500/10 group-[.toaster]:text-red-500 group-[.toaster]:border-red-500/20",
          info: "group-[.toaster]:bg-blue-500/10 group-[.toaster]:text-blue-500 group-[.toaster]:border-blue-500/20",
          warning:
            "group-[.toaster]:bg-orange-500/10 group-[.toaster]:text-orange-500 group-[.toaster]:border-orange-500/20",
          actionButton:
            "group-[.toast]:bg-zinc-800 group-[.toast]:text-zinc-100 group-[.toast]:border-zinc-700",
          cancelButton:
            "group-[.toast]:bg-zinc-900 group-[.toast]:text-zinc-400 group-[.toast]:border-zinc-800",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
