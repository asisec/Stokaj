"use client";

import { useState } from "react";
import { Bell, Check, CheckCircle2, Info, AlertTriangle, XCircle, Trash2, Archive, Settings } from "lucide-react";
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
  error: <AlertTriangle className="h-4 w-4 text-red-500" />,
  info: <Info className="h-4 w-4 text-blue-500" />,
  warning: <AlertTriangle className="h-4 w-4 text-orange-500" />,
};

export function NotificationButton() {
  const { notifications, unreadCount, markAsRead, markAllAsRead, clearAll, removeNotification, archiveNotification, archiveAll } =
    useNotificationStore();
    
  const [activeTab, setActiveTab] = useState<"inbox" | "archive">("inbox");

  const count = unreadCount();
  
  const inboxNotifications = notifications.filter(n => !n.archived);
  const archivedNotifications = notifications.filter(n => n.archived);
  
  const currentList = activeTab === "inbox" ? inboxNotifications : archivedNotifications;

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
        className="w-[380px] p-0 bg-zinc-950 border-zinc-800 shadow-2xl backdrop-blur-xl rounded-xl overflow-hidden"
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800/50 bg-zinc-950/50">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setActiveTab("inbox")}
              className={`text-sm font-medium transition-colors flex items-center gap-1.5 ${activeTab === "inbox" ? "text-zinc-100" : "text-zinc-500 hover:text-zinc-300"}`}
            >
              Inbox
              {count > 0 && (
                <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${activeTab === "inbox" ? "bg-zinc-800 text-zinc-300" : "bg-zinc-900 text-zinc-500"}`}>
                  {count}
                </span>
              )}
            </button>
            <button 
              onClick={() => setActiveTab("archive")}
              className={`text-sm font-medium transition-colors ${activeTab === "archive" ? "text-zinc-100" : "text-zinc-500 hover:text-zinc-300"}`}
            >
              Archive
            </button>
          </div>
          <Button variant="ghost" size="icon" className="h-6 w-6 text-zinc-500 hover:text-zinc-300">
            <Settings className="h-3.5 w-3.5" />
          </Button>
        </div>
        
        <div className="max-h-[350px] overflow-y-auto flex flex-col [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-zinc-800 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-zinc-700">
          {currentList.length === 0 ? (
            <div className="py-12 text-center text-sm text-zinc-600 flex flex-col items-center gap-3">
              {activeTab === "inbox" ? (
                <>
                  <CheckCircle2 className="h-8 w-8 opacity-20" />
                  <p>You're all caught up.</p>
                </>
              ) : (
                <>
                  <Archive className="h-8 w-8 opacity-20" />
                  <p>No archived notifications.</p>
                </>
              )}
            </div>
          ) : (
            currentList.map((notification) => (
              <div
                key={notification.id}
                className={`relative group/item flex gap-3 items-start p-4 border-b border-zinc-800/30 transition-all cursor-default ${
                  notification.read ? "opacity-70 hover:opacity-100 hover:bg-zinc-900/40" : "bg-zinc-900/20 hover:bg-zinc-900/60"
                }`}
                onClick={() => {
                  if (!notification.read) markAsRead(notification.id);
                }}
              >
                <div className="mt-0.5 shrink-0">
                  {typeIcons[notification.type]}
                </div>
                
                <div className="flex-1 space-y-1.5 pr-12">
                  <p className="text-sm font-medium leading-relaxed text-zinc-200">
                    {notification.title}
                  </p>
                  {notification.description && (
                    <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">
                      {notification.description}
                    </p>
                  )}
                </div>
                
                <div className="absolute right-4 top-4 flex items-center gap-2">
                  <span className="text-[11px] text-zinc-500 font-medium whitespace-nowrap group-hover/item:hidden">
                    {!notification.read && <span className="inline-block w-2 h-2 rounded-full bg-blue-500 mr-2" />}
                    {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true, locale: tr }).replace('yaklaşık ', '').replace(' önce', '')}
                  </span>
                  
                  <div className="hidden group-hover/item:flex items-center gap-1">
                    {activeTab === "inbox" ? (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800"
                        onClick={(e) => {
                          e.stopPropagation();
                          archiveNotification(notification.id);
                        }}
                        title="Arşive Gönder"
                      >
                        <Archive className="h-3.5 w-3.5" />
                      </Button>
                    ) : (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-zinc-400 hover:text-red-400 hover:bg-red-500/10"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeNotification(notification.id);
                        }}
                        title="Tamamen Sil"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {currentList.length > 0 && (
          <div className="p-1.5 border-t border-zinc-800/50 bg-zinc-950">
            {activeTab === "inbox" ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={archiveAll}
                className="w-full text-xs font-medium h-9 text-zinc-300 hover:text-zinc-100 hover:bg-zinc-900"
              >
                Archive All
              </Button>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAll}
                className="w-full text-xs font-medium h-9 text-red-400 hover:text-red-300 hover:bg-red-500/10"
              >
                Delete All
              </Button>
            )}
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
