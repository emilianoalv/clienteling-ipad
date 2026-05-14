"use client";

import { create } from "zustand";
import type { BrandId } from "@/types/brand";

interface BrandLockState {
  lock: BrandId | null;
  setLock: (next: BrandId | null) => void;
}

export const useBrandLock = create<BrandLockState>((set) => ({
  lock: null,
  setLock: (lock) => set({ lock }),
}));
