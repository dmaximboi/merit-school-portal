import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      token: null,
      role: null,
      isAuthenticated: false,
      
      login: (userData, token, role) => {
        set({ user: userData, token: token, role: role, isAuthenticated: true });
      },
      
      logout: () => {
        set({ user: null, token: null, role: null, isAuthenticated: false });
        localStorage.removeItem('merit-auth-storage');
        window.location.href = '/'; 
      },
    }),
    {
      name: 'merit-auth-storage',
      storage: createJSONStorage(() => localStorage), 
    }
  )
);