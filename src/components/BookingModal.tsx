import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Calendar as CalendarIcon, Clock, ChevronRight } from "lucide-react";
import { format, addDays, startOfToday, setHours, setMinutes, isAfter } from "date-fns";
import { ru } from "date-fns/locale";
import { useStore } from "../store/useStore";
import { Service } from "../types";
import { cn } from "../lib/utils";
import { useNavigate } from "react-router-dom";

interface BookingModalProps {
  service: Service | null;
  onClose: () => void;
}

export default function BookingModal({ service, onClose }: BookingModalProps) {
  const navigate = useNavigate();
  const { addApplication, trackingData } = useStore();
  const [step, setStep] = useState(1);
  const [selectedDate, setSelectedDate] = useState(startOfToday());
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: "", contact: "", situation: "" });

  if (!service) return null;

  const days = Array.from({ length: 7 }, (_, i) => addDays(startOfToday(), i));
  
  const timeSlots = [
    "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00"
  ];

  const handleBooking = async () => {
    if (!selectedTime) return;
    
    const [hours, minutes] = selectedTime.split(":").map(Number);
    const slotDate = setMinutes(setHours(selectedDate, hours), minutes);

    await addApplication({
      serviceId: service.id,
      serviceTitle: service.title,
      clientName: formData.name,
      clientContact: formData.contact,
      situation: formData.situation,
      slot: slotDate.toISOString(),
      status: "pending",
      paymentStatus: "unpaid",
      tracking: trackingData
    });

    navigate("/payment", { 
      state: { 
        serviceId: service.id, 
        price: service.price, 
        title: service.title 
      } 
    });
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-6">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-bg/90 backdrop-blur-sm"
      />
      
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-2xl glass-panel p-8 md:p-12 overflow-hidden"
      >
        <button onClick={onClose} className="absolute top-6 right-6 text-white/40 hover:text-white">
          <X className="w-6 h-6" />
        </button>

        <div className="mb-10">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-[10px] font-bold text-accent bg-accent/10 px-2 py-1 rounded uppercase tracking-widest">
              Запись на услугу
            </span>
            <div className="h-px flex-1 bg-white/5" />
          </div>
          <h2 className="text-3xl font-serif font-bold">{service.title}</h2>
        </div>

        {step === 1 && (
          <div className="space-y-8">
            <div>
              <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-white/40 mb-4">
                <CalendarIcon className="w-3 h-3" /> Выберите дату
              </label>
              <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
                {days.map((day) => (
                  <button
                    key={day.toISOString()}
                    onClick={() => setSelectedDate(day)}
                    className={cn(
                      "flex-shrink-0 w-20 py-4 rounded-2xl border transition-all flex flex-col items-center gap-1",
                      format(selectedDate, "yyyy-MM-dd") === format(day, "yyyy-MM-dd")
                        ? "bg-accent border-accent text-bg"
                        : "bg-white/5 border-white/5 text-white/60 hover:border-white/20"
                    )}
                  >
                    <span className="text-[10px] font-bold uppercase">{format(day, "EEE", { locale: ru })}</span>
                    <span className="text-xl font-serif font-bold">{format(day, "d")}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-white/40 mb-4">
                <Clock className="w-3 h-3" /> Доступное время (МСК)
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                {timeSlots.map((time) => (
                  <button
                    key={time}
                    onClick={() => setSelectedTime(time)}
                    className={cn(
                      "py-3 rounded-xl border text-sm font-bold transition-all",
                      selectedTime === time
                        ? "bg-accent border-accent text-bg"
                        : "bg-white/5 border-white/5 text-white/60 hover:border-white/20"
                    )}
                  >
                    {time}
                  </button>
                ))}
              </div>
            </div>

            <button
              disabled={!selectedTime}
              onClick={() => setStep(2)}
              className="w-full bg-accent text-bg py-4 rounded-xl font-bold glow-button disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              Далее <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-white/40 mb-2">Ваше имя</label>
                <input 
                  type="text" 
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Как к вам обращаться?"
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-4 px-6 text-sm focus:outline-none focus:border-accent/50 transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-white/40 mb-2">Контакт (TG/WA/VK)</label>
                <input 
                  type="text" 
                  value={formData.contact}
                  onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                  placeholder="@username или номер телефона"
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-4 px-6 text-sm focus:outline-none focus:border-accent/50 transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-white/40 mb-2">Опишите Вашу ситуацию</label>
                <textarea 
                  value={formData.situation}
                  onChange={(e) => setFormData({ ...formData, situation: e.target.value })}
                  placeholder="Кратко опишите, с чем вы обращаетесь..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-4 px-6 text-sm focus:outline-none focus:border-accent/50 transition-all min-h-[100px] resize-none"
                  required
                />
              </div>
            </div>

            <div className="bg-accent/5 border border-accent/10 rounded-xl p-6">
              <div className="text-[10px] font-bold text-accent uppercase tracking-widest mb-2">Детали записи</div>
              <div className="text-sm font-medium">
                {format(selectedDate, "d MMMM", { locale: ru })} в {selectedTime}
              </div>
              <div className="text-xs text-white/40 mt-1">
                Светлана свяжется с вами для подтверждения
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => setStep(1)}
                className="flex-1 bg-white/5 border border-white/10 py-4 rounded-xl font-bold text-sm hover:bg-white/10 transition-all"
              >
                Назад
              </button>
              <button
                disabled={!formData.name || !formData.contact || !formData.situation}
                onClick={handleBooking}
                className="flex-[2] bg-accent text-bg py-4 rounded-xl font-bold glow-button disabled:opacity-50"
              >
                Подтвердить и перейти к оплате
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
