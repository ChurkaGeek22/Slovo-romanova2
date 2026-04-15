import { useState, useEffect } from "react";
import { 
  Users, Calendar, Settings as SettingsIcon, Briefcase, 
  CheckCircle, XCircle, Clock, Trash2, Save, Plus, 
  MessageSquare, Shield, ShieldOff, Bell, ArrowRight, LogOut,
  Bot, Send, MessageCircle
} from "lucide-react";
import { useStore } from "../store/useStore";
import { cn } from "../lib/utils";
import { Service, Application, ChatSession, Message, Settings } from "../types";
import { format, addDays, startOfDay, isSameDay, parseISO } from "date-fns";
import { ru } from "date-fns/locale/ru";

export default function Admin() {
  console.log("Admin component mounting...");
  const { 
    applications, services, settings, chats, blockedIps, schedule,
    fetchApplications, fetchServices, fetchSettings, fetchChats, fetchBlockedIps, fetchSchedule,
    updateServices, updateApplication, updateChat, blockIp, unblockIp, playSound,
    updateSettings, updateSchedule, deleteApplication
  } = useStore();

  const [activeTab, setActiveTab] = useState<"applications" | "services" | "schedule" | "chats" | "settings" | "bots">("applications");
  const [editingServices, setEditingServices] = useState<Service[]>([]);
  const [keywordsInput, setKeywordsInput] = useState("");
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  // Modal State
  const [modal, setModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm?: (inputValue?: string) => void;
    onCancel?: () => void;
    type: "confirm" | "alert" | "prompt";
    inputValue?: string;
  }>({
    isOpen: false,
    title: "",
    message: "",
    type: "alert"
  });

  const showModal = (config: Partial<typeof modal>) => {
    setModal({ ...modal, ...config, isOpen: true });
  };

  useEffect(() => {
    if (settings?.keywords) {
      setKeywordsInput(settings.keywords.join(", "));
    }
  }, [settings?.keywords]);
  const [selectedChat, setSelectedChat] = useState<ChatSession | null>(null);
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const [chatInput, setChatInput] = useState("");

  useEffect(() => {
    fetchApplications();
    fetchServices();
    fetchSettings();
    fetchChats();
    fetchBlockedIps();
    fetchSchedule();

    // Set up real-time updates via WebSocket
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const ws = new WebSocket(`${protocol}//${window.location.host}`);
    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      if (message.type === "NEW_APPLICATION") {
        fetchApplications();
        playSound("new_application");
      }
      if (message.type === "CHAT_UPDATED") {
        fetchChats();
        playSound("new_message");
      }
    };
    return () => ws.close();
  }, []);

  useEffect(() => {
    if (services.length > 0) {
      setEditingServices(services);
    }
  }, [services]);

  const handleUpdatePrice = (id: string, price: number) => {
    setEditingServices(prev => prev.map(s => s.id === id ? { ...s, price } : s));
  };

  const handleSaveServices = async () => {
    await updateServices(editingServices);
    showModal({ title: "Успех", message: "Цены обновлены!", type: "alert" });
  };

  const handleStatusUpdate = async (id: string, status: Application["status"]) => {
    await updateApplication(id, { status });
  };

  const handlePaymentUpdate = async (id: string, paymentStatus: Application["paymentStatus"]) => {
    await updateApplication(id, { paymentStatus });
  };

  const handleDeleteApplication = async (id: string) => {
    showModal({
      title: "Удаление заявки",
      message: "Вы уверены, что хотите удалить эту заявку? Это действие необратимо.",
      type: "confirm",
      onConfirm: async () => {
        await deleteApplication(id);
        setModal(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const handleReschedule = async (id: string) => {
    showModal({
      title: "Перенос записи",
      message: "Введите новую дату и время (ГГГГ-ММ-ДДTЧЧ:ММ):",
      type: "prompt",
      inputValue: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
      onConfirm: async (newDate) => {
        if (newDate) {
          try {
            const isoDate = new Date(newDate).toISOString();
            await updateApplication(id, { slot: isoDate });
            setModal(prev => ({ ...prev, isOpen: false }));
            showModal({ title: "Успех", message: "Запись перенесена!", type: "alert" });
          } catch (e) {
            showModal({ title: "Ошибка", message: "Неверный формат даты", type: "alert" });
          }
        }
      }
    });
  };

  const toggleDayBlocking = async (date: Date) => {
    if (!schedule) return;
    const dateStr = format(date, "yyyy-MM-dd");
    const isBlocked = schedule.blockedDays?.includes(dateStr);
    const newBlockedDays = isBlocked
      ? schedule.blockedDays.filter(d => d !== dateStr)
      : [...(schedule.blockedDays || []), dateStr];
    
    await updateSchedule({ ...schedule, blockedDays: newBlockedDays });
  };

  const toggleSlotBlocking = async (slot: string) => {
    if (!schedule) return;
    const isBlocked = schedule.blockedSlots?.includes(slot);
    const newBlockedSlots = isBlocked
      ? schedule.blockedSlots.filter(s => s !== slot)
      : [...(schedule.blockedSlots || []), slot];
    
    await updateSchedule({ ...schedule, blockedSlots: newBlockedSlots });
  };

  const handleSendChatMessage = async () => {
    if (!selectedChat || !chatInput.trim()) return;

    const adminMsg: Message = {
      id: Date.now().toString(),
      text: chatInput,
      sender: "admin",
      timestamp: new Date().toISOString()
    };

    const updatedChat = {
      ...selectedChat,
      messages: [...selectedChat.messages, adminMsg],
      lastMessageAt: new Date().toISOString()
    };

    await updateChat(selectedChat.id, updatedChat);
    setSelectedChat(updatedChat);
    setChatInput("");
  };

  const handleCloseChat = async (chatId: string) => {
    const chat = chats.find(c => c.id === chatId);
    if (!chat) return;
    
    showModal({
      title: "Закрыть диалог",
      message: "Вы уверены, что хотите закрыть этот диалог? Пользователю будет выдан новый ID.",
      type: "confirm",
      onConfirm: async () => {
        const updatedChat: ChatSession = { ...chat, status: "closed" };
        await updateChat(chatId, updatedChat);
        if (selectedChat?.id === chatId) setSelectedChat(null);
        setModal(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const handleLogout = async () => {
    await fetch("/api/logout", { method: "POST" });
    window.location.href = "/login";
  };

  const handleBotControl = async (type: "telegram" | "vk", action: "start" | "stop") => {
    if (!settings) return;
    const botKey = type === "telegram" ? "telegramBot" : "vkBot";
    const updatedSettings = {
      ...settings,
      [botKey]: {
        ...settings[botKey as keyof Settings] as any,
        status: action === "start" ? "running" : "stopped"
      }
    };
    await updateSettings(updatedSettings as Settings);
  };

  const next30Days = Array.from({ length: 30 }, (_, i) => addDays(startOfDay(new Date()), i));

  const sortedApplications = [...(applications || [])].sort((a, b) => {
    const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return dateB - dateA;
  });

  const sortedChats = [...(chats || [])]
    .filter(chat => chat.status !== "closed")
    .sort((a, b) => {
      const dateA = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
      const dateB = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
      return dateB - dateA;
    });

  const stats = {
    total: applications.length,
    pending: applications.filter(a => a.status === "pending").length,
    confirmed: applications.filter(a => a.status === "confirmed").length,
    paid: applications.filter(a => a.paymentStatus === "paid").length,
  };

  return (
    <div className="min-h-screen bg-[#0B0B0B] text-white flex font-sans">
      {/* Sidebar */}
      <aside className="w-64 border-r border-white/10 p-6 flex flex-col gap-2 bg-[#0B0B0B] shrink-0">
        <div className="flex items-center gap-3 mb-8 px-2">
          <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-black font-bold">☀️</div>
          <span className="font-bold tracking-tight">Sun_Shine Admin</span>
        </div>
        
        <nav className="flex-1 space-y-1">
          {[
            { id: "applications", label: "Заявки", icon: Users },
            { id: "services", label: "Услуги", icon: Briefcase },
            { id: "schedule", label: "Расписание", icon: Calendar },
            { id: "chats", label: "Чаты", icon: MessageSquare },
            { id: "bots", label: "Боты", icon: Bot },
            { id: "settings", label: "Настройки", icon: SettingsIcon },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium text-sm",
                activeTab === tab.id ? "bg-accent text-black shadow-lg shadow-accent/20" : "text-white/60 hover:text-white hover:bg-white/5"
              )}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </nav>

        <button 
          onClick={handleLogout}
          className="mt-auto flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-400 hover:bg-red-500/10 transition-all"
        >
          <LogOut className="w-5 h-5" />
          Выйти
        </button>
      </aside>

      {/* Content */}
      <main className="flex-1 p-8 overflow-y-auto bg-[#0B0B0B]">
        <header className="mb-8 flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold">
              {activeTab === "applications" && "Все заявки"}
              {activeTab === "services" && "Управление услугами"}
              {activeTab === "schedule" && "Расписание на 30 дней"}
              {activeTab === "chats" && "Диалоги"}
              {activeTab === "bots" && "Боты"}
              {activeTab === "settings" && "Настройки системы"}
            </h1>
            <div className="flex gap-4">
              <span className="text-[10px] uppercase font-bold text-white/40 tracking-widest">Всего: {stats.total}</span>
              <span className="text-[10px] uppercase font-bold text-yellow-500 tracking-widest">Ожидают: {stats.pending}</span>
              <span className="text-[10px] uppercase font-bold text-green-500 tracking-widest">Оплачено: {stats.paid}</span>
            </div>
          </div>
          <div className="text-xs text-white/40 font-medium uppercase tracking-widest">
            {format(new Date(), "d MMMM, HH:mm", { locale: ru })}
          </div>
        </header>

        {activeTab === "applications" && (
          <div className="space-y-6">
            <div className="grid gap-4">
              {sortedApplications.map((app) => (
                <div 
                  key={app.id} 
                  className="glass-panel p-6 flex items-center justify-between cursor-pointer hover:bg-white/5 transition-colors"
                  onClick={() => setSelectedApplication(app)}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-lg">{app.clientName}</span>
                      <span className={cn(
                        "text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider",
                        app.status === "confirmed" ? "bg-green-500/20 text-green-500" : 
                        app.status === "pending" ? "bg-yellow-500/20 text-yellow-500" : "bg-red-500/20 text-red-500"
                      )}>
                        {app.status}
                      </span>
                    </div>
                    <div className="text-sm text-white/60">
                      {app.serviceTitle} • {app.slot ? format(parseISO(app.slot), "d MMMM, HH:mm", { locale: ru }) : "N/A"}
                    </div>
                    <div className="text-xs text-white/40">
                      Контакт: {app.clientContact} • IP: {app.ip || "N/A"}
                    </div>
                    {app.tracking && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-white/5 text-white/40 border border-white/10">
                          Source: {app.tracking.utm_source || "direct"}
                        </span>
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-white/5 text-white/40 border border-white/10">
                          Campaign: {app.tracking.utm_campaign || "none"}
                        </span>
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-white/5 text-white/40 border border-white/10">
                          Term: {app.tracking.utm_term || "none"}
                        </span>
                        <span className={cn(
                          "text-[9px] px-1.5 py-0.5 rounded border",
                          app.tracking.cn === "line" ? "bg-green-500/10 text-green-500 border-green-500/20" : "bg-red-500/10 text-red-500 border-red-500/20"
                        )}>
                          {app.tracking.cn?.toUpperCase() || "UNKNOWN"} • {app.tracking.country || "UNKNOWN"}
                        </span>
                        {app.tracking.realIp && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                            Real IP: {app.tracking.realIp}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-4" onClick={(e) => e.stopPropagation()}>
                    <div className="flex flex-col items-end gap-2">
                      <span className="text-xs text-white/40 uppercase font-bold">Оплата</span>
                      <select 
                        value={app.paymentStatus}
                        onChange={(e) => handlePaymentUpdate(app.id, e.target.value as any)}
                        className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs focus:outline-none text-white"
                      >
                        <option value="unpaid" className="bg-[#161616]">Не оплачено</option>
                        <option value="reported" className="bg-[#161616]">Внес средства</option>
                        <option value="paid" className="bg-[#161616]">Оплачено</option>
                      </select>
                    </div>

                    <div className="flex gap-2">
                      <button 
                        onClick={() => handleReschedule(app.id)}
                        className="p-2 rounded-lg bg-white/5 text-white/60 hover:text-accent transition-all"
                        title="Перенести"
                      >
                        <Calendar className="w-5 h-5" />
                      </button>
                      <button 
                        onClick={() => handleStatusUpdate(app.id, "confirmed")}
                        className="p-2 rounded-lg bg-green-500/10 text-green-500 hover:bg-green-500 hover:text-white transition-all"
                      >
                        <CheckCircle className="w-5 h-5" />
                      </button>
                      <button 
                        onClick={() => handleStatusUpdate(app.id, "cancelled")}
                        className="p-2 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all"
                      >
                        <XCircle className="w-5 h-5" />
                      </button>
                      <button 
                        onClick={() => handleDeleteApplication(app.id)}
                        className="p-2 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              {applications.length === 0 && (
                <div className="py-20 text-center text-white/20 border-2 border-dashed border-white/5 rounded-2xl">
                  Заявок пока нет
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "services" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <p className="text-white/60">Редактируйте цены на услуги. Изменения вступят в силу мгновенно.</p>
              <button 
                onClick={handleSaveServices}
                className="flex items-center gap-2 bg-accent text-bg px-6 py-2 rounded-xl font-bold hover:scale-105 transition-transform"
              >
                <Save className="w-5 h-5" />
                Сохранить цены
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {editingServices.map((service) => (
                <div key={service.id} className="glass-panel p-6 space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-lg">{service.title}</h3>
                      <p className="text-sm text-white/60">{service.category}</p>
                    </div>
                    <span className="text-[10px] font-bold text-accent bg-accent/10 px-2 py-1 rounded uppercase">
                      {service.type}
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <label className="text-[10px] uppercase font-bold text-white/40 block mb-1">Цена (₽)</label>
                      <input 
                        type="number" 
                        value={service.price}
                        onChange={(e) => handleUpdatePrice(service.id, parseInt(e.target.value))}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 focus:outline-none focus:border-accent/50"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="text-[10px] uppercase font-bold text-white/40 block mb-1">Длительность (мин)</label>
                      <div className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white/60">
                        {service.duration}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "schedule" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <p className="text-white/60">Кликните на день, чтобы просмотреть записи, или используйте кнопку блокировки.</p>
              {selectedDate && (
                <button 
                  onClick={() => toggleDayBlocking(selectedDate)}
                  className={cn(
                    "px-6 py-2 rounded-xl font-bold transition-all",
                    schedule?.blockedDays?.includes(format(selectedDate, "yyyy-MM-dd"))
                      ? "bg-red-500 text-white"
                      : "bg-white/5 text-white/60 hover:bg-red-500/20 hover:text-red-500"
                  )}
                >
                  {schedule?.blockedDays?.includes(format(selectedDate, "yyyy-MM-dd")) ? "Разблокировать день" : "Заблокировать день"}
                </button>
              )}
            </div>
            <div className="grid grid-cols-7 gap-4">
              {next30Days.map((date) => {
                const dateStr = format(date, "yyyy-MM-dd");
                const dayApps = applications.filter(app => isSameDay(parseISO(app.slot), date));
                const isSelected = isSameDay(date, selectedDate);
                const isBlocked = schedule?.blockedDays?.includes(dateStr);
                
                return (
                  <button
                    key={date.toISOString()}
                    onClick={() => setSelectedDate(date)}
                    className={cn(
                      "glass-panel p-4 flex flex-col items-center gap-2 transition-all hover:border-accent/50",
                      isSelected && "border-accent bg-accent/5",
                      isBlocked && "border-red-500/50 bg-red-500/5"
                    )}
                  >
                    <span className="text-[10px] uppercase font-bold text-white/40">{format(date, "EEE", { locale: ru })}</span>
                    <span className={cn("text-xl font-bold", isBlocked && "text-red-500")}>{format(date, "d")}</span>
                    <div className="flex gap-1">
                      {dayApps.map(app => (
                        <div key={app.id} className={cn(
                          "w-2 h-2 rounded-full",
                          app.paymentStatus === "paid" ? "bg-green-500" : "bg-yellow-500"
                        )} />
                      ))}
                    </div>
                  </button>
                );
              })}
            </div>

            {selectedDate && (
              <div className="grid lg:grid-cols-2 gap-8 mt-8">
                <div className="space-y-4">
                  <h3 className="text-xl font-bold">Записи на {format(selectedDate, "d MMMM", { locale: ru })}</h3>
                  <div className="grid gap-4">
                    {applications
                      .filter(app => isSameDay(parseISO(app.slot), selectedDate))
                      .sort((a, b) => a.slot.localeCompare(b.slot))
                      .map(app => (
                        <div key={app.id} className="glass-panel p-4 flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="text-accent font-bold">{format(parseISO(app.slot), "HH:mm")}</div>
                            <div>
                              <div className="font-bold">{app.clientName}</div>
                              <div className="text-xs text-white/60">{app.serviceTitle}</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className={cn(
                              "text-[10px] font-bold uppercase tracking-widest",
                              app.paymentStatus === "paid" ? "text-green-500" : "text-yellow-500"
                            )}>
                              {app.paymentStatus === "paid" ? "Оплачено" : "Ожидает"}
                            </span>
                          </div>
                        </div>
                      ))}
                    {applications.filter(app => isSameDay(parseISO(app.slot), selectedDate)).length === 0 && (
                      <div className="text-center py-12 text-white/20 font-medium">Нет записей на этот день</div>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-xl font-bold">Управление окнами</h3>
                  <div className="grid grid-cols-4 gap-3">
                    {Array.from({ length: 11 }, (_, i) => {
                      const hour = 12 + i;
                      const time = `${hour}:00`;
                      const slotDate = new Date(selectedDate);
                      slotDate.setHours(hour, 0, 0, 0);
                      const slotIso = slotDate.toISOString();
                      
                      const app = applications.find(a => a.slot === slotIso);
                      const isBlocked = schedule?.blockedSlots?.includes(slotIso);
                      const isDayBlocked = schedule?.blockedDays?.includes(format(selectedDate, "yyyy-MM-dd"));

                      let statusColor = "bg-yellow-500/20 text-yellow-500 border-yellow-500/20"; // Available
                      if (isDayBlocked || isBlocked) statusColor = "bg-red-500/20 text-red-500 border-red-500/20"; // Blocked
                      if (app) {
                        if (app.paymentStatus === "paid") statusColor = "bg-green-500/20 text-green-500 border-green-500/20"; // Paid
                        else statusColor = "bg-white/10 text-white/40 border-white/10"; // Occupied/Pending
                      }

                      return (
                        <button
                          key={time}
                          disabled={!!app || isDayBlocked}
                          onClick={() => toggleSlotBlocking(slotIso)}
                          className={cn(
                            "p-4 rounded-xl border text-center transition-all",
                            statusColor,
                            !app && !isDayBlocked && "hover:scale-105"
                          )}
                        >
                          <div className="text-lg font-bold">{time}</div>
                          <div className="text-[8px] uppercase font-bold tracking-widest mt-1">
                            {isDayBlocked ? "День закр." : isBlocked ? "Закрыто" : app ? (app.paymentStatus === "paid" ? "Оплачено" : "Занято") : "Свободно"}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "chats" && (
          <div className="h-[calc(100vh-200px)] flex gap-6">
            <div className="w-80 flex flex-col gap-4">
              <div className="flex-1 overflow-y-auto space-y-2 pr-2">
                {sortedChats.map((chat) => (
                  <button
                    key={chat.id}
                    onClick={() => setSelectedChat(chat)}
                    className={cn(
                      "w-full glass-panel p-4 text-left transition-all hover:border-accent/40",
                      selectedChat?.id === chat.id && "border-accent bg-accent/5"
                    )}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-bold text-sm truncate">{chat.ip}</span>
                      <span className="text-[10px] text-white/40">{format(parseISO(chat.lastMessageAt), "HH:mm")}</span>
                    </div>
                    <p className="text-xs text-white/60 truncate">
                      {chat.messages[chat.messages.length - 1]?.text}
                    </p>
                    {chat.status === "human" && (
                      <div className="mt-2 flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                        <span className="text-[10px] text-blue-500 font-bold uppercase">Требует ответа</span>
                      </div>
                    )}
                  </button>
                ))}
                {chats.length === 0 && (
                  <div className="text-center py-12 text-white/20 text-sm">Нет активных диалогов</div>
                )}
              </div>
            </div>

            <div className="flex-1 glass-panel flex flex-col overflow-hidden">
              {selectedChat ? (
                <>
                  <div className="p-4 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
                    <div>
                      <div className="font-bold">{selectedChat.ip}</div>
                      <div className="text-xs text-white/40">ID: {selectedChat.id}</div>
                      {selectedChat.tracking && (
                        <div className="flex flex-wrap gap-2 mt-1">
                          <span className="text-[8px] text-white/30 uppercase font-bold">
                            {selectedChat.tracking.utm_source} • {selectedChat.tracking.cn} • {selectedChat.tracking.country}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => handleCloseChat(selectedChat.id)}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 text-white/60 text-xs font-bold hover:bg-white/10"
                      >
                        Закрыть диалог
                      </button>
                      {blockedIps.includes(selectedChat.ip) ? (
                        <button 
                          onClick={() => unblockIp(selectedChat.ip)}
                          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-green-500/10 text-green-500 text-xs font-bold"
                        >
                          <ShieldOff className="w-4 h-4" /> Разблокировать
                        </button>
                      ) : (
                        <button 
                          onClick={() => blockIp(selectedChat.ip)}
                          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-500/10 text-red-500 text-xs font-bold"
                        >
                          <Shield className="w-4 h-4" /> Заблокировать IP
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto p-6 space-y-4">
                    {selectedChat.messages.map((msg) => (
                      <div key={msg.id} className={cn("flex flex-col", msg.sender === "admin" ? "items-end" : "items-start")}>
                        <div className={cn(
                          "max-w-[70%] p-3 rounded-2xl text-sm",
                          msg.sender === "admin" ? "bg-accent text-bg" : "bg-white/5 text-white/80 border border-white/5"
                        )}>
                          {msg.text}
                        </div>
                        <span className="text-[10px] text-white/20 mt-1">{format(parseISO(msg.timestamp), "HH:mm")}</span>
                      </div>
                    ))}
                  </div>

                  <div className="p-4 border-t border-white/10">
                    <div className="flex gap-3">
                      <input
                        type="text"
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        onKeyPress={(e) => e.key === "Enter" && handleSendChatMessage()}
                        placeholder="Введите сообщение..."
                        className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-accent/50"
                      />
                      <button 
                        onClick={handleSendChatMessage}
                        className="bg-accent text-bg px-6 py-2 rounded-xl font-bold hover:scale-105 transition-transform"
                      >
                        Отправить
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-white/20 gap-4">
                  <MessageSquare className="w-12 h-12" />
                  <span className="font-medium">Выберите диалог для начала общения</span>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "bots" && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Telegram Bot */}
              <div className="glass-panel p-8 border-accent/10">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-400">
                      <Send className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold">Telegram Бот</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <div className={cn(
                          "w-2 h-2 rounded-full",
                          settings?.telegramBot?.status === "running" ? "bg-green-500" : "bg-red-500"
                        )} />
                        <span className="text-xs text-white/40 uppercase font-bold tracking-wider">
                          {settings?.telegramBot?.status === "running" ? "Запущен" : "Остановлен"}
                        </span>
                      </div>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleBotControl("telegram", settings?.telegramBot?.status === "running" ? "stop" : "start")}
                    className={cn(
                      "px-4 py-2 rounded-xl font-bold text-sm transition-all",
                      settings?.telegramBot?.status === "running" 
                        ? "bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white" 
                        : "bg-green-500/10 text-green-500 hover:bg-green-500 hover:text-white"
                    )}
                  >
                    {settings?.telegramBot?.status === "running" ? "Остановить" : "Запустить"}
                  </button>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-white/40 mb-2">API Токен</label>
                    <input 
                      type="password"
                      value={settings?.telegramBot?.token || ""}
                      onChange={(e) => updateSettings({ ...settings!, telegramBot: { ...settings!.telegramBot!, token: e.target.value } })}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-accent/50 transition-all"
                      placeholder="Введите токен от @BotFather"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-white/40 mb-4">Меню бота</label>
                    <div className="space-y-3">
                      {settings?.telegramBot?.menu?.map((item, idx) => (
                        <div key={idx} className="flex gap-3">
                          <input 
                            value={item.label}
                            onChange={(e) => {
                              if (!settings?.telegramBot) return;
                              const newMenu = [...settings.telegramBot.menu];
                              newMenu[idx].label = e.target.value;
                              updateSettings({ ...settings, telegramBot: { ...settings.telegramBot, menu: newMenu } });
                            }}
                            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm"
                            placeholder="Название кнопки"
                          />
                          <select 
                            value={item.action}
                            onChange={(e) => {
                              if (!settings?.telegramBot) return;
                              const newMenu = [...settings.telegramBot.menu];
                              newMenu[idx].action = e.target.value as any;
                              updateSettings({ ...settings, telegramBot: { ...settings.telegramBot, menu: newMenu } });
                            }}
                            className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm"
                          >
                            <option value="booking">Запись</option>
                            <option value="services">Услуги</option>
                            <option value="human">Человек</option>
                          </select>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-6 border-t border-white/5">
                    <label className="block text-xs font-bold uppercase tracking-widest text-white/40 mb-4">Предпросмотр (Симуляция)</label>
                    <div className="bg-[#1a1a1a] rounded-2xl p-4 border border-white/5">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400">
                          <Send className="w-4 h-4" />
                        </div>
                        <span className="text-sm font-bold">Sun_Shine Bot</span>
                      </div>
                      <div className="space-y-2 mb-4">
                        <div className="bg-white/5 rounded-2xl rounded-tl-none p-3 text-xs max-w-[80%]">
                          Привет! Я помощник Светланы. Чем могу помочь?
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {settings?.telegramBot?.menu?.map((item, idx) => (
                          <div key={idx} className="bg-white/10 rounded-lg p-2 text-[10px] text-center font-bold">
                            {item.label}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* VK Bot */}
              <div className="glass-panel p-8 border-accent/10">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-blue-400/10 flex items-center justify-center text-blue-400">
                      <MessageCircle className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold">VK Бот</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <div className={cn(
                          "w-2 h-2 rounded-full",
                          settings?.vkBot?.status === "running" ? "bg-green-500" : "bg-red-500"
                        )} />
                        <span className="text-xs text-white/40 uppercase font-bold tracking-wider">
                          {settings?.vkBot?.status === "running" ? "Запущен" : "Остановлен"}
                        </span>
                      </div>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleBotControl("vk", settings?.vkBot?.status === "running" ? "stop" : "start")}
                    className={cn(
                      "px-4 py-2 rounded-xl font-bold text-sm transition-all",
                      settings?.vkBot?.status === "running" 
                        ? "bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white" 
                        : "bg-green-500/10 text-green-500 hover:bg-green-500 hover:text-white"
                    )}
                  >
                    {settings?.vkBot?.status === "running" ? "Остановить" : "Запустить"}
                  </button>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-white/40 mb-2">Ключ доступа сообщества</label>
                    <input 
                      type="password"
                      value={settings?.vkBot?.token || ""}
                      onChange={(e) => updateSettings({ ...settings!, vkBot: { ...settings!.vkBot!, token: e.target.value } })}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-accent/50 transition-all"
                      placeholder="Введите Access Token"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-white/40 mb-4">Меню бота</label>
                    <div className="space-y-3">
                      {settings?.vkBot?.menu?.map((item, idx) => (
                        <div key={idx} className="flex gap-3">
                          <input 
                            value={item.label}
                            onChange={(e) => {
                              if (!settings?.vkBot) return;
                              const newMenu = [...settings.vkBot.menu];
                              newMenu[idx].label = e.target.value;
                              updateSettings({ ...settings, vkBot: { ...settings.vkBot, menu: newMenu } });
                            }}
                            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm"
                            placeholder="Название кнопки"
                          />
                          <select 
                            value={item.action}
                            onChange={(e) => {
                              if (!settings?.vkBot) return;
                              const newMenu = [...settings.vkBot.menu];
                              newMenu[idx].action = e.target.value as any;
                              updateSettings({ ...settings, vkBot: { ...settings.vkBot, menu: newMenu } });
                            }}
                            className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm"
                          >
                            <option value="booking">Запись</option>
                            <option value="services">Услуги</option>
                            <option value="human">Человек</option>
                          </select>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-6 border-t border-white/5">
                    <label className="block text-xs font-bold uppercase tracking-widest text-white/40 mb-4">Предпросмотр (Симуляция)</label>
                    <div className="bg-[#1a1a1a] rounded-2xl p-4 border border-white/5">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-8 h-8 rounded-full bg-blue-400/20 flex items-center justify-center text-blue-400">
                          <MessageCircle className="w-4 h-4" />
                        </div>
                        <span className="text-sm font-bold">Sun_Shine VK</span>
                      </div>
                      <div className="space-y-2 mb-4">
                        <div className="bg-white/5 rounded-2xl rounded-tl-none p-3 text-xs max-w-[80%]">
                          Привет! Я помощник Светланы. Чем могу помочь?
                        </div>
                      </div>
                      <div className="grid grid-cols-1 gap-2">
                        {settings?.vkBot?.menu?.map((item, idx) => (
                          <div key={idx} className="bg-blue-500/20 text-blue-400 rounded-lg p-2 text-[10px] text-center font-bold">
                            {item.label}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "settings" && (
          <div className="space-y-8">
            {/* General Settings */}
            <div className="glass-panel p-8 space-y-6">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <SettingsIcon className="w-5 h-5 text-accent" /> Общие настройки
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-bold text-white/40">Заголовок сайта</label>
                  <input 
                    type="text" 
                    value={settings?.title || ""}
                    onChange={(e) => settings && updateSettings({ ...settings, title: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-accent/50"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-bold text-white/40">Описание</label>
                  <input 
                    type="text" 
                    value={settings?.description || ""}
                    onChange={(e) => settings && updateSettings({ ...settings, description: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-accent/50"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-bold text-white/40">Telegram (ник)</label>
                  <input 
                    type="text" 
                    value={settings?.telegram || ""}
                    onChange={(e) => settings && updateSettings({ ...settings, telegram: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-accent/50"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-bold text-white/40">VK (ник)</label>
                  <input 
                    type="text" 
                    value={settings?.vk || ""}
                    onChange={(e) => settings && updateSettings({ ...settings, vk: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-accent/50"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-[10px] uppercase font-bold text-white/40">Ссылка на группу VK</label>
                  <input 
                    type="text" 
                    value={settings?.vkGroup || ""}
                    onChange={(e) => settings && updateSettings({ ...settings, vkGroup: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-accent/50"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-[10px] uppercase font-bold text-white/40">Ключевые слова (через запятую, до 10)</label>
                  <input 
                    type="text" 
                    value={keywordsInput}
                    onChange={(e) => setKeywordsInput(e.target.value)}
                    onBlur={() => {
                      if (settings) {
                        const keywords = keywordsInput.split(",").map(k => k.trim()).filter(k => k !== "").slice(0, 10);
                        updateSettings({ ...settings, keywords });
                      }
                    }}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-accent/50"
                    placeholder="таро, гадание, психология..."
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-[10px] uppercase font-bold text-white/40">Способ оплаты по кнопке "Оплатить"</label>
                  <select
                    value={settings?.paymentMethodType || "netmonet_modal"}
                    onChange={(e) => settings && updateSettings({ ...settings, paymentMethodType: e.target.value as any })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-accent/50"
                  >
                    <option value="netmonet_modal">Модальная форма с НетМонет</option>
                    <option value="netmonet_tab">НетМонет в новой вкладке</option>
                    <option value="sbp_modal">Модальная форма с реквизитами СБП</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Texts Management */}
            <div className="glass-panel p-8 space-y-6">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <SettingsIcon className="w-5 h-5 text-accent" /> Тексты на главной
              </h3>
              <div className="grid grid-cols-1 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-bold text-white/40">Заголовок (Hero)</label>
                  <input 
                    type="text" 
                    value={settings?.texts?.heroTitle || ""}
                    onChange={(e) => settings && updateSettings({ ...settings, texts: { ...settings.texts, heroTitle: e.target.value } })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-accent/50"
                    placeholder="Светлана Романова"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-bold text-white/40">Подзаголовок (Hero)</label>
                  <input 
                    type="text" 
                    value={settings?.texts?.heroSubtitle || ""}
                    onChange={(e) => settings && updateSettings({ ...settings, texts: { ...settings.texts, heroSubtitle: e.target.value } })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-accent/50"
                    placeholder="Sun_Shine"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-bold text-white/40">Описание (Hero)</label>
                  <textarea 
                    value={settings?.texts?.heroDescription || ""}
                    onChange={(e) => settings && updateSettings({ ...settings, texts: { ...settings.texts, heroDescription: e.target.value } })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-accent/50 min-h-[100px]"
                    placeholder="Дипломированный таролог..."
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-bold text-white/40">Заголовок (Обо мне)</label>
                  <input 
                    type="text" 
                    value={settings?.texts?.aboutTitle || ""}
                    onChange={(e) => settings && updateSettings({ ...settings, texts: { ...settings.texts, aboutTitle: e.target.value } })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-accent/50"
                    placeholder="Светлана <span class='text-accent'>Романова</span>"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-bold text-white/40">Описание (Обо мне)</label>
                  <textarea 
                    value={settings?.texts?.aboutDescription || ""}
                    onChange={(e) => settings && updateSettings({ ...settings, texts: { ...settings.texts, aboutDescription: e.target.value } })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-accent/50 min-h-[150px]"
                    placeholder="Меня зовут Светлана..."
                  />
                </div>
              </div>
            </div>

            {/* Stories Management */}
            <div className="glass-panel p-8 space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold flex items-center gap-2">
                  <Plus className="w-5 h-5 text-accent" /> Ваши истории
                </h3>
                <button 
                  onClick={() => {
                    showModal({
                      title: "Добавить историю",
                      message: "Введите URL изображения:",
                      type: "prompt",
                      onConfirm: (url) => {
                        if (url && settings) {
                          const newStory = { id: Date.now().toString(), imageUrl: url, order: (settings.stories?.length || 0) + 1 };
                          updateSettings({ ...settings, stories: [...(settings.stories || []), newStory] });
                        }
                      }
                    });
                  }}
                  className="bg-accent/10 text-accent px-4 py-2 rounded-xl text-xs font-bold hover:bg-accent hover:text-bg transition-all"
                >
                  Добавить историю
                </button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-4">
                {[...(settings?.stories || [])].sort((a, b) => a.order - b.order).map((story, index) => (
                  <div key={story.id} className="relative group aspect-[9/16] rounded-xl overflow-hidden border border-white/10">
                    <img src={story.imageUrl} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                      <div className="flex gap-1">
                        <button 
                          disabled={index === 0}
                          onClick={() => {
                            if (!settings) return;
                            const newStories = [...settings.stories];
                            [newStories[index].order, newStories[index-1].order] = [newStories[index-1].order, newStories[index].order];
                            updateSettings({ ...settings, stories: newStories });
                          }}
                          className="p-1.5 bg-white/10 rounded-lg hover:bg-white/20 disabled:opacity-30"
                        >
                          ←
                        </button>
                        <button 
                          disabled={index === (settings?.stories?.length || 0) - 1}
                          onClick={() => {
                            if (!settings) return;
                            const newStories = [...settings.stories];
                            [newStories[index].order, newStories[index+1].order] = [newStories[index+1].order, newStories[index].order];
                            updateSettings({ ...settings, stories: newStories });
                          }}
                          className="p-1.5 bg-white/10 rounded-lg hover:bg-white/20 disabled:opacity-30"
                        >
                          →
                        </button>
                      </div>
                      <button 
                        onClick={() => {
                          if (settings) {
                            updateSettings({ ...settings, stories: settings.stories.filter(s => s.id !== story.id) });
                          }
                        }}
                        className="p-1.5 bg-red-500/20 text-red-500 rounded-lg hover:bg-red-500 hover:text-white"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Events Management */}
            <div className="glass-panel p-8 space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-accent" /> Ближайшие мероприятия
                </h3>
                <button 
                  onClick={() => {
                    showModal({
                      title: "Добавить мероприятие",
                      message: "Введите название мероприятия:",
                      type: "prompt",
                      onConfirm: (title) => {
                        if (title && settings) {
                          const newEvent = { 
                            id: Date.now().toString(), 
                            title, 
                            date: new Date().toISOString(), 
                            description: "Описание мероприятия",
                            price: 1000
                          };
                          updateSettings({ ...settings, events: [...(settings.events || []), newEvent] });
                        }
                      }
                    });
                  }}
                  className="bg-accent/10 text-accent px-4 py-2 rounded-xl text-xs font-bold hover:bg-accent hover:text-bg transition-all"
                >
                  Добавить мероприятие
                </button>
              </div>
              <div className="grid gap-4">
                {[...(settings?.events || [])].map((event) => (
                  <div key={event.id} className="bg-white/5 border border-white/10 rounded-2xl p-6 flex items-center justify-between">
                    <div className="space-y-1">
                      <input 
                        type="text" 
                        value={event.title}
                        onChange={(e) => {
                          if (settings) {
                            const newEvents = settings.events.map(ev => ev.id === event.id ? { ...ev, title: e.target.value } : ev);
                            updateSettings({ ...settings, events: newEvents });
                          }
                        }}
                        className="bg-transparent font-bold text-lg focus:outline-none focus:text-accent"
                      />
                      <div className="flex gap-4">
                        <input 
                          type="text" 
                          value={event.date}
                          onChange={(e) => {
                            if (settings) {
                              const newEvents = settings.events.map(ev => ev.id === event.id ? { ...ev, date: e.target.value } : ev);
                              updateSettings({ ...settings, events: newEvents });
                            }
                          }}
                          className="bg-transparent text-xs text-white/40 focus:outline-none"
                        />
                        <input 
                          type="number" 
                          value={event.price}
                          onChange={(e) => {
                            if (settings) {
                              const newEvents = settings.events.map(ev => ev.id === event.id ? { ...ev, price: parseInt(e.target.value) } : ev);
                              updateSettings({ ...settings, events: newEvents });
                            }
                          }}
                          className="bg-transparent text-xs text-accent font-bold focus:outline-none w-20"
                        />
                      </div>
                    </div>
                    <button 
                      onClick={() => {
                        if (settings) {
                          updateSettings({ ...settings, events: settings.events.filter(e => e.id !== event.id) });
                        }
                      }}
                      className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Application Details Modal */}
      {selectedApplication && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setSelectedApplication(null)} />
          <div className="relative glass-panel p-8 max-w-md w-full space-y-6 border-accent/20 animate-in fade-in zoom-in duration-300">
            <button 
              onClick={() => setSelectedApplication(null)}
              className="absolute top-4 right-4 p-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors"
            >
              <XCircle className="w-5 h-5" />
            </button>
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-accent">Детали заявки</h3>
              <p className="text-white/60 text-sm">Полная информация о клиенте и услуге</p>
            </div>
            
            <div className="space-y-4">
              <div>
                <div className="text-[10px] uppercase font-bold text-white/40 mb-1">Клиент</div>
                <div className="font-bold">{selectedApplication.clientName}</div>
              </div>
              <div>
                <div className="text-[10px] uppercase font-bold text-white/40 mb-1">Контакт</div>
                <div className="font-bold">{selectedApplication.clientContact}</div>
              </div>
              <div>
                <div className="text-[10px] uppercase font-bold text-white/40 mb-1">Услуга</div>
                <div className="font-bold">{selectedApplication.serviceTitle}</div>
              </div>
              <div>
                <div className="text-[10px] uppercase font-bold text-white/40 mb-1">Время</div>
                <div className="font-bold">{selectedApplication.slot ? format(parseISO(selectedApplication.slot), "d MMMM yyyy, HH:mm", { locale: ru }) : "Не выбрано"}</div>
              </div>
              <div>
                <div className="text-[10px] uppercase font-bold text-white/40 mb-1">Описание ситуации</div>
                <div className="bg-white/5 p-3 rounded-xl text-sm whitespace-pre-wrap">
                  {selectedApplication.situation || "Не указано"}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal System */}
      {modal.isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setModal({ ...modal, isOpen: false })} />
          <div className="relative glass-panel p-8 max-w-md w-full space-y-6 border-accent/20 animate-in fade-in zoom-in duration-300">
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-accent">{modal.title}</h3>
              <p className="text-white/60 text-sm leading-relaxed">{modal.message}</p>
            </div>

            {modal.type === "prompt" && (
              <input 
                type="text"
                value={modal.inputValue}
                onChange={(e) => setModal({ ...modal, inputValue: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-accent/50"
                autoFocus
              />
            )}

            <div className="flex gap-3 pt-2">
              {modal.type !== "alert" && (
                <button 
                  onClick={() => {
                    modal.onCancel?.();
                    setModal({ ...modal, isOpen: false });
                  }}
                  className="flex-1 px-6 py-3 rounded-xl border border-white/10 font-bold hover:bg-white/5 transition-all"
                >
                  Отмена
                </button>
              )}
              <button 
                onClick={() => {
                  modal.onConfirm?.(modal.inputValue);
                  if (modal.type === "alert" || modal.type === "prompt" || modal.type === "confirm") setModal({ ...modal, isOpen: false });
                }}
                className="flex-1 px-6 py-3 rounded-xl bg-accent text-bg font-bold hover:scale-105 transition-transform"
              >
                {modal.type === "alert" ? "Понятно" : "Подтвердить"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
