import { create } from "zustand";
import { persist } from "zustand/middleware";

interface GuideState {
  isHelpMode: boolean;
  toggleHelpMode: () => void;
  setHelpMode: (value: boolean) => void;
}

export const useGuideStore = create<GuideState>()(
  persist(
    (set) => ({
      isHelpMode: false,
      toggleHelpMode: () => set((state) => ({ isHelpMode: !state.isHelpMode })),
      setHelpMode: (value) => set({ isHelpMode: value }),
    }),
    {
      name: "guide-storage", // unique name for localStorage
    },
  ),
);
