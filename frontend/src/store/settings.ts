import { create } from "zustand";
import { persist } from "zustand/middleware";

interface SettingsStore {
  storeName: string;
  currency: string;
  taxRate: number;
  lowStockThreshold: number;
  theme: "dark" | "light" | "system";
  emailNotifications: boolean;
  smsNotifications: boolean;
  autoBackup: boolean;
  updateSettings: (settings: Partial<Omit<SettingsStore, "updateSettings">>) => void;
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      storeName: "STOKAJ MOTORS",
      currency: "TRY",
      taxRate: 20,
      lowStockThreshold: 5,
      theme: "dark",
      emailNotifications: true,
      smsNotifications: false,
      autoBackup: true,
      updateSettings: (newSettings) => set((state) => ({ ...state, ...newSettings })),
    }),
    {
      name: "stokaj-settings",
    }
  )
);
