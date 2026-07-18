import { create } from "zustand";
import { persist } from "zustand/middleware";

interface CensorStore {
  isCensored: boolean;
  toggleCensor: () => void;
}

export const useCensorStore = create<CensorStore>()(
  persist(
    (set) => ({
      isCensored: false,
      toggleCensor: () => set((state) => ({ isCensored: !state.isCensored })),
    }),
    {
      name: "stokaj-censor",
    }
  )
);
