import { create } from "zustand";
import { IUser } from "@/models/user.model";

interface AuthStore {
  user: IUser | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  fetchUser: () => Promise<void>;
  register: (data: { name: string; email: string; password: string }) => Promise<{ success: boolean; message?: string }>;
  login: (email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  isAuthenticated: false,
  loading: true,
  error: null,

  fetchUser: async () => {
    try {
      const res = await fetch("/api/me", { credentials: "include" });
      const data = await res.json();
      if (data.user) {
        set({ user: data.user, isAuthenticated: true });
      }
    } catch (error) {
      console.error("Auth Fetch Error:", error);
    } finally {
      set({ loading: false });
    }
  },

  register: async ({ name, email, password }) => {
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        set({ error: data.error });
        return { success: false, message: data.error || "Registration failed" };
      }

      set({ user: data.user, isAuthenticated: true, error: null });
      return { success: true };
    } catch (error) {
      console.error("Register Error:", error);
      return { success: false, message: "Something went wrong. Please try again." };
    }
  },

  login: async (email, password) => {
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        set({ error: data.error });
        return { success: false, message: data.error || "Login failed" };
      }

      set({ user: data.user, isAuthenticated: true, error: null });
      return { success: true };
    } catch (error) {
      console.error("Login Error:", error);
      return { success: false, message: "Something went wrong. Please try again." };
    }
  },

  logout: async () => {
    await fetch("/api/auth/logout", { credentials: "include" });
    set({ user: null, isAuthenticated: false, error: null });
  },
}));
