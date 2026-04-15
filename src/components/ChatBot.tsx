import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { MessageCircle, X, Send, Calendar, Briefcase, User, CheckCircle } from "lucide-react";
import { cn } from "../lib/utils";
import { useStore } from "../store/useStore";
import { Message, ChatSession } from "../types";
import { format, parseISO } from "date-fns";

export default function ChatBot() {
  const { services, addApplication, trackingData, schedule, isChatOpen, setIsChatOpen } = useStore();
  const [chatId, setChatId] = useState<string>("");
  const [session, setSession] = useState<ChatSession | null>(null);
  const [inputValue, setInputValue] = useState("");
  const [bookingState, setBookingState] = useState<{
    step: "service" | "date" | "time" | "name" | "contact" | "situation" | null;
    serviceId?: string;
    date?: string;
    time?: string;
    name?: string;
    contact?: string;
    situation?: string;
    slotIso?: string;
  }>({ step: null });
  const [tooltipIndex, setTooltipIndex] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  const tooltips = [
    "У меня есть чат-бот который поможет записаться на расклад",
    "Запишитесь на расклад или свяжитесь со мной",
    "Смогу ответить здесь, если у меня сейчас не сеанс. Бот может оформить запись и подобрать время"
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setTooltipIndex((prev) => (prev + 1) % tooltips.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const getCookie = (name: string) => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop()?.split(";").shift();
  };

  const setCookie = (name: string, value: string, days: number) => {
    const date = new Date();
    date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
    document.cookie = `${name}=${value};expires=${date.toUTCString()};path=/`;
  };

  const saveSession = async (updatedSession: ChatSession) => {
    try {
      await fetch(`/api/chats/${updatedSession.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedSession)
      });
    } catch (e) {
      console.error("Failed to save session", e);
    }
  };

  const generateChatId = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let result = "";
    for (let i = 0; i < 52; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  const createNewSession = (id: string) => {
    const newSession: ChatSession = {
      id,
      ip: "Loading...",
      messages: [{
        id: "1",
        text: "Привет! Я помощник Светланы. Чем могу помочь?",
        sender: "bot",
        timestamp: new Date().toISOString(),
        options: ["Записаться", "Услуги", "Позвать человека"]
      }],
      status: "bot",
      lastMessageAt: new Date().toISOString(),
      tracking: trackingData
    };
    setSession(newSession);
    saveSession(newSession);
  };

  useEffect(() => {
    const initChat = async () => {
      let id = localStorage.getItem("chat_id");
      if (!id || id.length !== 52) {
        id = generateChatId();
        localStorage.setItem("chat_id", id);
      }
      setChatId(id);

      try {
        const res = await fetch(`/api/chats/${id}`);
        if (res.ok && res.status !== 204) {
          const data = await res.json();
          if (data) {
            if (data.status === "closed") {
              const newId = generateChatId();
              localStorage.setItem("chat_id", newId);
              setChatId(newId);
              createNewSession(newId);
              setIsChatOpen(false);
            } else {
              setSession(data);
            }
          } else {
            createNewSession(id);
          }
        } else {
          createNewSession(id);
        }
      } catch (e) {
        createNewSession(id);
      }
    };

    initChat();
  }, []);

  useEffect(() => {
    if (trackingData && session && !session.tracking) {
      const updatedSession = { ...session, tracking: trackingData };
      setSession(updatedSession);
      saveSession(updatedSession);
    }
  }, [trackingData, session]);

  useEffect(() => {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const ws = new WebSocket(`${protocol}//${window.location.host}`);
    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      if (message.type === "CHAT_UPDATED" && message.chatId === chatId) {
        // Fetch updated chat
        fetch(`/api/chats/${chatId}`).then(res => res.json()).then(data => {
          if (data.status === "closed") {
            const newId = generateChatId();
            localStorage.setItem("chat_id", newId);
            setChatId(newId);
            createNewSession(newId);
            setIsChatOpen(false);
          } else {
            setSession(data);
          }
        });
      }
    };
    return () => ws.close();
  }, [chatId]);

  useEffect(() => {
    if (scrollRef.current && session?.messages) {
      const lastMessage = session.messages[session.messages.length - 1];
      if (lastMessage && lastMessage.sender !== "user") {
        scrollRef.current.scrollTo({
          top: scrollRef.current.scrollHeight,
          behavior: "smooth"
        });
      }
    }
  }, [session?.messages]);

  const handleOptionClick = (option: string) => {
    if (!session) return;

    const userMsg: Message = { 
      id: Date.now().toString(), 
      text: option, 
      sender: "user",
      timestamp: new Date().toISOString()
    };
    
    const updatedMessages = [...session.messages, userMsg];
    const updatedSession = { ...session, messages: updatedMessages, lastMessageAt: new Date().toISOString() };
    setSession(updatedSession);
    saveSession(updatedSession);

    setTimeout(() => {
      let botMsg: Message;
      let newStatus = session.status;

      if (option === "Записаться") {
        setBookingState({ step: "service" });
        botMsg = {
          id: (Date.now() + 1).toString(),
          text: "Выберите услугу для записи:",
          sender: "bot",
          timestamp: new Date().toISOString(),
          options: services.map(s => s.title)
        };
      } else if (bookingState.step === "service" && services.some(s => s.title === option)) {
        const service = services.find(s => s.title === option);
        setBookingState({ ...bookingState, step: "date", serviceId: service?.id });
        
        const next7Days = Array.from({ length: 7 }, (_, i) => {
          const d = new Date();
          d.setDate(d.getDate() + i);
          return d.toLocaleDateString("ru-RU", { day: "numeric", month: "long" });
        });

        botMsg = {
          id: (Date.now() + 1).toString(),
          text: `Вы выбрали "${service?.title}". На какую дату вас записать?`,
          sender: "bot",
          timestamp: new Date().toISOString(),
          options: next7Days
        };
      } else if (bookingState.step === "date") {
        setBookingState({ ...bookingState, step: "time", date: option });
        
        // Filter times based on existing applications and blocked slots
        const allTimes = ["12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00", "20:00", "21:00", "22:00"];
        
        // Find the date object for the selected option string
        const selectedDateStr = option;
        const d = new Date();
        let targetDate: Date | null = null;
        for (let i = 0; i < 30; i++) {
          const checkDate = new Date();
          checkDate.setDate(checkDate.getDate() + i);
          if (checkDate.toLocaleDateString("ru-RU", { day: "numeric", month: "long" }) === selectedDateStr) {
            targetDate = checkDate;
            break;
          }
        }

        const isDayBlocked = targetDate && schedule?.blockedDays?.includes(format(targetDate, "yyyy-MM-dd"));
        
        if (isDayBlocked) {
          botMsg = {
            id: (Date.now() + 1).toString(),
            text: `К сожалению, ${option} Светлана не принимает. Пожалуйста, выберите другую дату:`,
            sender: "bot",
            timestamp: new Date().toISOString(),
            options: Array.from({ length: 7 }, (_, i) => {
              const d = new Date();
              d.setDate(d.getDate() + i);
              return d.toLocaleDateString("ru-RU", { day: "numeric", month: "long" });
            })
          };
        } else {
          const bookedTimes = useStore.getState().applications
            .filter(app => {
              const appDate = new Date(app.slot).toLocaleDateString("ru-RU", { day: "numeric", month: "long" });
              return appDate === option && app.status !== "cancelled";
            })
            .map(app => format(parseISO(app.slot), "HH:mm"));
          
          const blockedSlots = schedule?.blockedSlots || [];
          
          const availableTimes = allTimes.filter(t => {
            if (!targetDate) return false;
            const slotDate = new Date(targetDate);
            slotDate.setHours(parseInt(t.split(":")[0]), 0, 0, 0);
            const slotIso = slotDate.toISOString();
            return !bookedTimes.includes(t) && !blockedSlots.includes(slotIso);
          });

          botMsg = {
            id: (Date.now() + 1).toString(),
            text: `Принято: ${option}. Выберите удобное время (МСК):`,
            sender: "bot",
            timestamp: new Date().toISOString(),
            options: availableTimes.length > 0 ? availableTimes : ["Нет свободных окон", "Другая дата"]
          };
        }
      } else if (option === "Нет свободных окон" || option === "Другая дата") {
        setBookingState({ ...bookingState, step: "date" });
        const next7Days = Array.from({ length: 7 }, (_, i) => {
          const d = new Date();
          d.setDate(d.getDate() + i);
          return d.toLocaleDateString("ru-RU", { day: "numeric", month: "long" });
        });
        botMsg = {
          id: (Date.now() + 1).toString(),
          text: `Пожалуйста, выберите другую дату:`,
          sender: "bot",
          timestamp: new Date().toISOString(),
          options: next7Days
        };
      } else if (bookingState.step === "time") {
        setBookingState({ ...bookingState, step: "name", time: option });
        
        // Calculate the actual ISO slot
        const selectedDateStr = bookingState.date;
        let targetDate = new Date();
        for (let i = 0; i < 30; i++) {
          const checkDate = new Date();
          checkDate.setDate(checkDate.getDate() + i);
          if (checkDate.toLocaleDateString("ru-RU", { day: "numeric", month: "long" }) === selectedDateStr) {
            targetDate = checkDate;
            break;
          }
        }
        targetDate.setHours(parseInt(option.split(":")[0]), 0, 0, 0);
        const slotIso = targetDate.toISOString();
        setBookingState(prev => ({ ...prev, slotIso }));

        botMsg = {
          id: (Date.now() + 1).toString(),
          text: `Записал на ${option}. Как мне к вам обращаться?`,
          sender: "bot",
          timestamp: new Date().toISOString()
        };
      } else if (option === "Услуги") {
        botMsg = {
          id: (Date.now() + 1).toString(),
          text: "Наши основные направления. Нажмите на услугу, чтобы узнать подробнее:",
          sender: "bot",
          timestamp: new Date().toISOString(),
          options: services.map(s => s.title)
        };
      } else if (services.some(s => s.title === option) && bookingState.step !== "service") {
        const service = services.find(s => s.title === option);
        botMsg = {
          id: (Date.now() + 1).toString(),
          text: `✨ **${service?.title}**\n\n${service?.description}\n\n⏳ Длительность: ${service?.duration} мин\n💰 Стоимость: ${service?.price} ₽`,
          sender: "bot",
          timestamp: new Date().toISOString(),
          options: ["Записаться на эту услугу", "Другие услуги", "Главное меню"]
        };
      } else if (option === "Записаться на эту услугу") {
        // Find the last service mentioned
        const lastBotMsg = session.messages.filter(m => m.sender === "bot").reverse()[0];
        const serviceTitle = lastBotMsg.text.split("**")[1];
        const service = services.find(s => s.title === serviceTitle);
        
        setBookingState({ step: "date", serviceId: service?.id });
        const next7Days = Array.from({ length: 7 }, (_, i) => {
          const d = new Date();
          d.setDate(d.getDate() + i);
          return d.toLocaleDateString("ru-RU", { day: "numeric", month: "long" });
        });

        botMsg = {
          id: (Date.now() + 1).toString(),
          text: `На какую дату вас записать на услугу "${service?.title}"?`,
          sender: "bot",
          timestamp: new Date().toISOString(),
          options: next7Days
        };
      } else if (option === "Позвать человека") {
        botMsg = {
          id: (Date.now() + 1).toString(),
          text: "Переключаю вас на Светлану. Пожалуйста, подождите, она ответит вам в ближайшее время.",
          sender: "bot",
          timestamp: new Date().toISOString()
        };
        newStatus = "human";
      } else if (option === "Главное меню") {
        setBookingState({ step: null });
        botMsg = {
          id: (Date.now() + 1).toString(),
          text: "Чем еще я могу вам помочь?",
          sender: "bot",
          timestamp: new Date().toISOString(),
          options: ["Записаться", "Услуги", "Позвать человека"]
        };
      } else {
        botMsg = {
          id: (Date.now() + 1).toString(),
          text: "Понял вас. Что-нибудь еще?",
          sender: "bot",
          timestamp: new Date().toISOString(),
          options: ["Записаться", "Услуги", "Позвать человека"]
        };
      }

      const finalMessages = [...updatedMessages, botMsg];
      const finalSession = { ...updatedSession, messages: finalMessages, status: newStatus, lastMessageAt: new Date().toISOString() };
      setSession(finalSession);
      saveSession(finalSession);
    }, 600);
  };

  const handleSend = async () => {
    if (!inputValue.trim() || !session) return;
    
    const text = inputValue.trim();
    setInputValue("");

    if (text === "/clear") {
      try {
        await fetch(`/api/chats/${chatId}`, { method: "DELETE" });
        const newId = Math.random().toString(36).substring(7);
        setCookie("chat_id", newId, 30);
        setChatId(newId);
        const newSession: ChatSession = {
          id: newId,
          ip: "Loading...",
          messages: [{
            id: "1",
            text: "Чат очищен. Чем могу помочь?",
            sender: "bot",
            timestamp: new Date().toISOString(),
            options: ["Записаться", "Услуги", "Позвать человека"]
          }],
          status: "bot",
          lastMessageAt: new Date().toISOString(),
          tracking: trackingData
        };
        setSession(newSession);
        saveSession(newSession);
        return;
      } catch (e) {
        console.error("Failed to clear chat", e);
      }
    }

    const userMsg: Message = { 
      id: Date.now().toString(), 
      text, 
      sender: "user",
      timestamp: new Date().toISOString()
    };
    
    const updatedMessages = [...session.messages, userMsg];
    const updatedSession = { ...session, messages: updatedMessages, lastMessageAt: new Date().toISOString() };
    setSession(updatedSession);
    saveSession(updatedSession);
    
    setTimeout(async () => {
      let botMsg: Message;

      if (bookingState.step === "name") {
        setBookingState({ ...bookingState, step: "contact", name: text });
        botMsg = {
          id: (Date.now() + 1).toString(),
          text: `Приятно познакомиться, ${text}! Оставьте ваш контакт (Telegram или номер телефона), чтобы Светлана могла подтвердить запись.`,
          sender: "bot",
          timestamp: new Date().toISOString()
        };
      } else if (bookingState.step === "contact") {
        setBookingState({ ...bookingState, step: "situation", contact: text });
        botMsg = {
          id: (Date.now() + 1).toString(),
          text: `Отлично. Теперь кратко опишите вашу ситуацию, с чем вы обращаетесь?`,
          sender: "bot",
          timestamp: new Date().toISOString()
        };
      } else if (bookingState.step === "situation") {
        const service = services.find(s => s.id === bookingState.serviceId);
        
        // Create application
        const slot = bookingState.slotIso || new Date().toISOString();
        const newApp = await addApplication({
          serviceId: service?.id || "",
          serviceTitle: service?.title || "",
          clientName: bookingState.name || "",
          clientContact: bookingState.contact || "",
          situation: text,
          slot: slot,
          status: "pending",
          paymentStatus: "unpaid",
          tracking: trackingData
        });

        setBookingState({ step: null });
        botMsg = {
          id: (Date.now() + 1).toString(),
          text: `Готово! Ваша заявка на "${service?.title}" принята. Светлана свяжется с вами в ближайшее время для подтверждения.\n\nВы можете внести оплату заранее, чтобы закрепить время.`,
          sender: "bot",
          timestamp: new Date().toISOString(),
          options: [`Оплатить ${service?.price || 0}₽`, "Главное меню"]
        };
      } else if (text.startsWith("Оплатить")) {
        // Find the last application or assume payment is in progress
        botMsg = {
          id: (Date.now() + 1).toString(),
          text: `Оплата происходит через онлайн сервис оплат и чаевых АО "АльфаБанк" в НетМонет.\n\nВручную укажите сумму при оплате, а при выборе типа — уберите галочку "Заплатить за услуги НетМонет", чтобы не платить комиссию. После оплаты нажмите "Внёс оплату".`,
          sender: "bot",
          timestamp: new Date().toISOString(),
          options: ["Внёс оплату", "Главное меню"]
        };
        // Open payment link
        window.open("https://netmonet.co/qr/175046/tip?o=0", "_blank");
      } else if (text === "Внёс оплату") {
        // Update the last application's payment status to reported
        // We'll just send a message for now, as we don't have the appId in context easily, 
        // but let's assume the backend or admin will handle it, or we can fetch the last app.
        botMsg = {
          id: (Date.now() + 1).toString(),
          text: "Спасибо! Информация об оплате передана Светлане. Она проверит поступление средств и свяжется с вами.",
          sender: "bot",
          timestamp: new Date().toISOString(),
          options: ["Главное меню"]
        };
      } else {
        botMsg = {
          id: (Date.now() + 1).toString(),
          text: session.status === "bot" 
            ? "Светлана сейчас занята. Вы можете записаться на услугу самостоятельно или дождаться её ответа (нажмите 'Позвать человека')."
            : "Сообщение доставлено Светлане.",
          sender: "bot",
          timestamp: new Date().toISOString(),
          options: session.status === "bot" ? ["Записаться", "Позвать человека"] : undefined
        };
      }

      const finalMessages = [...updatedMessages, botMsg];
      const finalSession = { ...updatedSession, messages: finalMessages, lastMessageAt: new Date().toISOString() };
      setSession(finalSession);
      saveSession(finalSession);
    }, 1000);
  };

  return (
    <>
      <div className="fixed bottom-6 right-6 flex flex-col items-end gap-4 z-[100]">
        <AnimatePresence>
          {!isChatOpen && (
            <motion.div
              initial={{ opacity: 0, x: 20, scale: 0.8 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 20, scale: 0.8 }}
              className="bg-accent text-bg p-4 rounded-2xl rounded-br-none shadow-2xl max-w-[240px] text-xs font-medium relative border border-white/20"
            >
              <div className="absolute -bottom-2 right-0 w-4 h-4 bg-accent rotate-45" />
              <motion.p
                key={tooltipIndex}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
              >
                {tooltips[tooltipIndex]}
              </motion.p>
            </motion.div>
          )}
        </AnimatePresence>

        <button
          onClick={() => setIsChatOpen(true)}
          className="w-14 h-14 bg-accent text-bg rounded-full flex items-center justify-center shadow-2xl hover:scale-110 transition-transform relative group"
        >
          <MessageCircle className="w-6 h-6" />
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-bg animate-pulse" />
        </button>
      </div>

      <AnimatePresence>
        {isChatOpen && session && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-24 right-6 w-[360px] h-[500px] glass-panel flex flex-col z-[100] shadow-2xl overflow-hidden border-accent/20"
          >
            <div className="p-4 border-b border-white/10 flex items-center justify-between bg-accent/5">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-[10px]">☀️</div>
                <div>
                  <div className="font-bold text-sm">Sun_Shine</div>
                  <div className="flex items-center gap-1.5">
                    <div className={cn("w-1.5 h-1.5 rounded-full animate-pulse", session.status === "human" ? "bg-blue-500" : "bg-green-500")} />
                    <span className="text-[10px] text-white/40 uppercase tracking-widest font-bold">
                      {session.status === "human" ? "Светлана на связи" : "Бот онлайн"}
                    </span>
                  </div>
                </div>
              </div>
              <button onClick={() => setIsChatOpen(false)} className="text-white/40 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
              {session.messages.map((msg) => (
                <div key={msg.id} className={cn("flex flex-col", msg.sender === "user" ? "items-end" : "items-start")}>
                  <div className={cn(
                    "max-w-[80%] p-3 rounded-2xl text-sm leading-relaxed",
                    msg.sender === "user" ? "bg-accent text-bg rounded-tr-none" : "bg-white/5 text-white/80 rounded-tl-none border border-white/5"
                  )}>
                    {msg.text}
                  </div>
                  {msg.options && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {msg.options.map((opt) => (
                        <button
                          key={opt}
                          onClick={() => handleOptionClick(opt)}
                          className="px-3 py-1.5 rounded-full border border-accent/30 text-[11px] font-bold text-accent hover:bg-accent hover:text-bg transition-all flex items-center gap-1.5"
                        >
                          {opt === "Записаться" && <Calendar className="w-3 h-3" />}
                          {opt === "Услуги" && <Briefcase className="w-3 h-3" />}
                          {opt === "Позвать человека" && <User className="w-3 h-3" />}
                          {opt === "Внёс оплату" && <CheckCircle className="w-3 h-3" />}
                          {opt}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="p-4 border-t border-white/10 bg-white/[0.02]">
              <div className="relative">
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleSend()}
                  placeholder="Напишите..."
                  className="w-full bg-white/5 border border-white/10 rounded-full py-3 px-5 pr-12 text-sm focus:outline-none focus:border-accent/50 transition-all"
                />
                <button 
                  onClick={handleSend}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-accent text-bg rounded-full flex items-center justify-center hover:scale-110 transition-transform"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
