import { toast as sonnerToast } from "sonner";
import { useNotificationStore } from "@/store/notifications";

export const customToast = {
  success: (message: string, description?: string) => {
    useNotificationStore.getState().addNotification({
      title: message,
      description,
      type: "success",
    });
    const id: string | number = sonnerToast.success(message, { 
      description,
      onClick: () => sonnerToast.dismiss(id)
    });
    return id;
  },
  error: (message: string, description?: string) => {
    useNotificationStore.getState().addNotification({
      title: message,
      description,
      type: "error",
    });
    const id: string | number = sonnerToast.error(message, { 
      description,
      onClick: () => sonnerToast.dismiss(id)
    });
    return id;
  },
  info: (message: string, description?: string) => {
    useNotificationStore.getState().addNotification({
      title: message,
      description,
      type: "info",
    });
    const id: string | number = sonnerToast.info(message, { 
      description,
      onClick: () => sonnerToast.dismiss(id)
    });
    return id;
  },
  warning: (message: string, description?: string) => {
    useNotificationStore.getState().addNotification({
      title: message,
      description,
      type: "warning",
    });
    const id: string | number = sonnerToast.warning(message, { 
      description,
      onClick: () => sonnerToast.dismiss(id)
    });
    return id;
  },
};
