export interface Service {
  id: string;
  title: string;
  description: string;
  price: number;
  duration: number; // in minutes
  category: string;
  type: "fast" | "complex" | "video" | "personal";
}

export interface Application {
  id: string;
  serviceId: string;
  serviceTitle: string;
  clientName: string;
  clientContact: string;
  slot: string; // ISO date string
  status: "pending" | "confirmed" | "completed" | "cancelled";
  paymentStatus: "unpaid" | "reported" | "paid";
  situation?: string;
  createdAt: string;
  ip?: string;
  tracking?: {
    utm_source?: string;
    utm_campaign?: string;
    utm_term?: string;
    cn?: "line" | "proxy" | "vpn";
    country?: string;
    realIp?: string;
  };
}

export interface Message {
  id: string;
  text: string;
  sender: "bot" | "user" | "admin";
  timestamp: string;
  options?: string[];
}

export interface ChatSession {
  id: string;
  ip: string;
  status: "bot" | "human" | "closed";
  messages: Message[];
  lastMessageAt: string;
  isBlocked?: boolean;
  tracking?: {
    utm_source?: string;
    utm_campaign?: string;
    utm_term?: string;
    cn?: "line" | "proxy" | "vpn";
    country?: string;
    realIp?: string;
  };
}

export interface Schedule {
  workingHours: {
    start: string; // "HH:mm"
    end: string;
  };
  blockedSlots: string[]; // ISO date strings
  blockedDays: string[]; // "YYYY-MM-DD"
}

export interface Story {
  id: string;
  imageUrl: string;
  order: number;
}

export interface Event {
  id: string;
  title: string;
  date: string;
  description: string;
  price: number;
}

export interface BotConfig {
  enabled: boolean;
  token: string;
  status: "running" | "stopped";
  menu: { label: string; action: string }[];
}

export interface Settings {
  title: string;
  description: string;
  telegram: string;
  vk: string;
  vkGroup: string;
  paymentDetails: string;
  stories: Story[];
  events: Event[];
  paymentMethods: {
    netMonet: boolean;
    card: boolean;
  };
  paymentMethodType?: "netmonet_modal" | "netmonet_tab" | "sbp_modal";
  sections: {
    [key: string]: boolean;
  };
  keywords?: string[];
  telegramBot?: BotConfig;
  vkBot?: BotConfig;
  texts?: {
    heroTitle?: string;
    heroSubtitle?: string;
    heroDescription?: string;
    aboutTitle?: string;
    aboutDescription?: string;
  };
}
