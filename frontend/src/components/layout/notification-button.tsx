"use client";

import { Bell, Check, CheckCircle2, Info, AlertTriangle, XCircle, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useNotificationStore } from "@/store/notifications";
import { formatDistanceToNow } from "date-fns";
import { tr } from "date-fns/locale";

const typeIcons = {
  success: <CheckCircle2 className="h-4 w-4 text-emerald-500" />,
  error: <XCircle className="h-4 w-4 text-red-500" />,
  info: <Info className="h-4 w-4 text-blue-500" />,
  warning: <AlertTriangle className="h-4 w-4 text-orange-500" />,
};

export function NotificationButton() {
  const { notifications, unreadCount, markAsRead, markAllAsRead, clearAll, removeNotification } =
    useNotificationStore();

  const count = unreadCount();

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative text-zinc-400 hover:text-zinc-100 transition-colors"
        >
          <Bell className="h-5 w-5" />
          {count > 0 && (
            <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-80 p-0 bg-zinc-950 border-zinc-800 shadow-2xl backdrop-blur-xl"
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800/50">
          <h4 className="text-sm font-semibold text-zinc-100">Bildirimler</h4>
          {count > 0 && (
            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400">
              {count} Yeni
            </span>
          )}
        </div>
        
        <div className="max-h-[300px] overflow-y-auto py-2 flex flex-col gap-1 px-2">
          {notifications.length === 0 ? (
            <div className="py-8 text-center text-sm text-zinc-500 flex flex-col items-center gap-2">
              <Bell className="h-8 w-8 opacity-20" />
              <p>Henüz bildirim yok</p>
            </div>
          ) : (
            notifications.map((notification) => (
              <div
                key={notification.id}
                className={`relative group/item flex gap-3 items-start p-3 rounded-lg transition-all ${
                  notification.read ? "opacity-60" : "bg-zinc-900/20"
                }`}
              >
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeNotification(notification.id);
                  }}
                  className="absolute right-2 top-2 p-1 text-zinc-500 hover:text-zinc-300 opacity-0 group-hover/item:opacity-100 transition-opacity"
                  title="Bildirimi sil"
                >
                  <XCircle className="h-4 w-4" />
                </button>
                <div 
                  className="mt-0.5 shrink-0 cursor-pointer"
                  onClick={() => markAsRead(notification.id)}
                >
                  {typeIcons[notification.type]}
                </div>
                <div 
                  className="flex-1 space-y-1 cursor-pointer pr-4"
                  onClick={() => markAsRead(notification.id)}
                >
                  <p className="text-sm font-medium leading-none text-zinc-200">
                    {notification.title}
                  </p>
                  {notification.description && (
                    <p className="text-xs text-zinc-400 line-clamp-2">
                      {notification.description}
                    </p>
                  )}
                  <p className="text-[10px] text-zinc-500 font-medium">
                    {formatDistanceToNow(new Date(notification.createdAt), {
                      addSuffix: true,
                      locale: tr,
                    })}
                  </p>
                </div>
                {!notification.read && (
                  <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 shrink-0 cursor-pointer" onClick={() => markAsRead(notification.id)} />
                )}
              </div>
            ))
          )}
        </div>

        {notifications.length > 0 && (
          <div className="flex items-center justify-between p-2 border-t border-zinc-800/50 bg-zinc-900/30">
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAll}
              className="text-xs h-8 text-zinc-400 hover:text-red-400 hover:bg-red-500/10"
            >
              <Trash2 className="h-3.5 w-3.5 mr-1.5" />
              Temizle
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={markAllAsRead}
              className="text-xs h-8 text-zinc-400 hover:text-zinc-100"
            >
              <Check className="h-3.5 w-3.5 mr-1.5" />
              Tümünü Okundu İşaretle
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
