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
      richColors
      expand={true}
      duration={4000}
      toastOptions={{
        classNames: {
          toast:
            "group toast cursor-pointer group-[.toaster]:bg-zinc-950/90 group-[.toaster]:backdrop-blur-2xl group-[.toaster]:text-zinc-100 group-[.toaster]:border group-[.toaster]:border-zinc-800/60 group-[.toaster]:shadow-2xl group-[.toaster]:rounded-xl font-medium transition-all duration-300",
          description: "group-[.toast]:text-zinc-400 text-sm",
          success:
            "group-[.toaster]:bg-emerald-950/40 group-[.toaster]:text-emerald-500 group-[.toaster]:border-emerald-500/30",
          error:
            "group-[.toaster]:bg-red-950/40 group-[.toaster]:text-red-500 group-[.toaster]:border-red-500/30",
          info: "group-[.toaster]:bg-blue-950/40 group-[.toaster]:text-blue-500 group-[.toaster]:border-blue-500/30",
          warning:
            "group-[.toaster]:bg-orange-950/40 group-[.toaster]:text-orange-500 group-[.toaster]:border-orange-500/30",
          actionButton:
            "group-[.toast]:bg-zinc-800 group-[.toast]:text-zinc-100 group-[.toast]:border-zinc-700 hover:group-[.toast]:bg-zinc-700 transition-colors",
          cancelButton:
            "group-[.toast]:bg-zinc-900 group-[.toast]:text-zinc-400 group-[.toast]:border-zinc-800 hover:group-[.toast]:text-zinc-300 transition-colors",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
