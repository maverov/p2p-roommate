import { create } from 'zustand';

// Feature-scoped store for auth UI state (e.g., modal visibility, form state)
interface AuthStoreState {
  isLoginModalOpen: boolean;
  setIsLoginModalOpen: (open: boolean) => void;
}

export const useAuthStore = create<AuthStoreState>((set) => ({
  isLoginModalOpen: false,
  setIsLoginModalOpen: (open: boolean) => set({ isLoginModalOpen: open }),
}));
