import { toast as sonnerToast } from "sonner";
import { useNotificationStore } from "@/store/notifications";

export const customToast = {
  success: (message: string, description?: string) => {
    useNotificationStore.getState().addNotification({
      title: message,
      description,
      type: "success",
    });
    return sonnerToast.success(message, { description });
  },
  error: (message: string, description?: string) => {
    useNotificationStore.getState().addNotification({
      title: message,
      description,
      type: "error",
    });
    return sonnerToast.error(message, { description });
  },
  info: (message: string, description?: string) => {
    useNotificationStore.getState().addNotification({
      title: message,
      description,
      type: "info",
    });
    return sonnerToast.info(message, { description });
  },
  warning: (message: string, description?: string) => {
    useNotificationStore.getState().addNotification({
      title: message,
      description,
      type: "warning",
    });
    return sonnerToast.warning(message, { description });
  },
};
