import { create } from "zustand";
import { Application, Schedule, Settings, Service, ChatSession, Message } from "../types";

interface AppState {
  settings: Settings | null;
  schedule: Schedule | null;
  applications: Application[];
  services: Service[];
  chats: ChatSession[];
  blockedIps: string[];
  trackingData: any;
  isLoading: boolean;
  theme: "dark" | "light";
  isChatOpen: boolean;
  setIsChatOpen: (isOpen: boolean) => void;
  setTheme: (theme: "dark" | "light") => void;
  setTrackingData: (data: any) => void;
  fetchSettings: () => Promise<void>;
  updateSettings: (settings: Settings) => Promise<void>;
  fetchSchedule: () => Promise<void>;
  fetchApplications: () => Promise<void>;
  fetchServices: () => Promise<void>;
  fetchChats: () => Promise<void>;
  fetchBlockedIps: () => Promise<void>;
  updateServices: (services: Service[]) => Promise<void>;
  updateSchedule: (schedule: Schedule) => Promise<void>;
  addApplication: (app: Partial<Application>) => Promise<void>;
  updateApplication: (id: string, data: Partial<Application>) => Promise<void>;
  deleteApplication: (id: string) => Promise<void>;
  updateChat: (chatId: string, session: ChatSession) => Promise<void>;
  blockIp: (ip: string) => Promise<void>;
  unblockIp: (ip: string) => Promise<void>;
  playSound: (type: "new_message" | "new_application") => void;
}

export const useStore = create<AppState>((set, get) => ({
  settings: null,
  schedule: null,
  applications: [],
  services: [],
  chats: [],
  blockedIps: [],
  trackingData: null,
  isLoading: false,
  theme: (localStorage.getItem("theme") as "dark" | "light") || "dark",
  isChatOpen: false,

  setIsChatOpen: (isOpen) => set({ isChatOpen: isOpen }),

  setTheme: (theme) => {
    localStorage.setItem("theme", theme);
    set({ theme });
  },

  setTrackingData: (data) => set({ trackingData: data }),

  fetchSettings: async () => {
    const res = await fetch("/api/settings");
    const data = await res.json();
    set({ settings: data });
  },

  updateSettings: async (settings) => {
    const res = await fetch("/api/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings),
    });
    const data = await res.json();
    set({ settings: data });
  },

  fetchSchedule: async () => {
    const res = await fetch("/api/schedule");
    const data = await res.json();
    set({ schedule: data });
  },

  fetchApplications: async () => {
    try {
      const res = await fetch("/api/applications");
      const data = await res.json();
      set({ applications: Array.isArray(data) ? data : [] });
    } catch (e) {
      set({ applications: [] });
    }
  },

  fetchServices: async () => {
    try {
      const res = await fetch("/api/services");
      const data = await res.json();
      set({ services: Array.isArray(data) ? data : [] });
    } catch (e) {
      set({ services: [] });
    }
  },

  fetchChats: async () => {
    try {
      const res = await fetch("/api/chats");
      const data = await res.json();
      set({ chats: Array.isArray(data) ? data : [] });
    } catch (e) {
      set({ chats: [] });
    }
  },

  fetchBlockedIps: async () => {
    try {
      const res = await fetch("/api/blocked-ips");
      const data = await res.json();
      set({ blockedIps: Array.isArray(data) ? data : [] });
    } catch (e) {
      set({ blockedIps: [] });
    }
  },

  updateServices: async (services) => {
    await fetch("/api/services", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(services),
    });
    set({ services });
  },

  updateSchedule: async (schedule) => {
    await fetch("/api/schedule", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(schedule),
    });
    set({ schedule });
  },

  addApplication: async (app) => {
    const res = await fetch("/api/applications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(app),
    });
    const newApp = await res.json();
    set((state) => ({ applications: [...state.applications, newApp] }));
    get().playSound("new_application");
  },

  updateApplication: async (id, data) => {
    const res = await fetch(`/api/applications/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const updatedApp = await res.json();
    set((state) => ({
      applications: state.applications.map((a) => (a.id === id ? updatedApp : a)),
    }));
  },

  deleteApplication: async (id) => {
    await fetch(`/api/applications/${id}`, {
      method: "DELETE",
    });
    set((state) => ({
      applications: state.applications.filter((a) => a.id !== id),
    }));
  },

  updateChat: async (chatId, session) => {
    await fetch(`/api/chats/${chatId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(session),
    });
    set((state) => ({
      chats: state.chats.map((c) => (c.id === chatId ? session : c)),
    }));
  },

  blockIp: async (ip) => {
    const current = get().blockedIps;
    if (!current.includes(ip)) {
      const updated = [...current, ip];
      await fetch("/api/blocked-ips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updated),
      });
      set({ blockedIps: updated });
    }
  },

  unblockIp: async (ip) => {
    const updated = get().blockedIps.filter((i) => i !== ip);
    await fetch("/api/blocked-ips", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updated),
    });
    set({ blockedIps: updated });
  },

  playSound: (type) => {
    const audio = new Audio(
      type === "new_message" 
        ? "https://assets.mixkit.co/active_storage/sfx/2354/2354-preview.mp3" 
        : "https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3"
    );
    audio.play().catch(() => {}); // Ignore autoplay blocks
  },
}));
