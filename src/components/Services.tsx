import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useStore } from "../store/useStore";
import { Search, MessageSquare, Video, User, ChevronRight } from "lucide-react";
import { cn } from "../lib/utils";
import BookingModal from "./BookingModal";
import { Service } from "../types";

export default function Services() {
  const { services } = useStore();
  const [activeTab, setActiveTab] = useState("tarot");
  const [selectedService, setSelectedService] = useState<Service | null>(null);

  const tabs = [
    { id: "tarot", label: "Гадание на Таро" },
    { id: "magic", label: "Магические корректировки" },
    { id: "amulets", label: "Амулеты" },
    { id: "path", label: "Путь к Себе" },
    { id: "retreat", label: "Ретрит" },
    { id: "education", label: "Обучение магии" }
  ];

  const getIcon = (type: string) => {
    switch (type) {
      case "fast": return <Search className="w-5 h-5" />;
      case "complex": return <MessageSquare className="w-5 h-5" />;
      case "video": return <Video className="w-5 h-5" />;
      case "personal": return <User className="w-5 h-5" />;
      default: return null;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "fast": return "БЫСТРЫЙ";
      case "complex": return "КОМПЛЕКС";
      case "video": return "ВИДЕО";
      case "personal": return "ЛИЧНО";
      default: return "";
    }
  };

  return (
    <section id="services" className="py-24">
      <div className="max-w-7xl mx-auto px-6">
        <div className="mb-16">
          <span className="text-accent text-xs font-bold tracking-[0.2em] uppercase mb-4 block">
            Услуги
          </span>
          <h2 className="text-4xl md:text-5xl font-serif font-bold mb-6">
            Что я делаю для вас
          </h2>
          <p className="text-white/60 max-w-2xl leading-relaxed">
            Выберите подходящий формат. От конкретного вопроса до полной личной консультации. Работаю с любой сферой жизни.
          </p>
        </div>

        {/* Tabs */}
        <div className="relative mb-12">
          <div className="flex overflow-x-auto pb-4 gap-2 no-scrollbar border-b border-white/5 scroll-smooth">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "px-6 py-4 text-sm font-medium whitespace-nowrap transition-all relative",
                  activeTab === tab.id ? "text-accent" : "text-white/40 hover:text-white/60"
                )}
              >
                {tab.label}
                {activeTab === tab.id && (
                  <motion.div 
                    layoutId="activeTab"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent"
                  />
                )}
              </button>
            ))}
          </div>
          {/* Mobile Swipe Hint */}
          <div className="md:hidden absolute right-0 top-0 bottom-4 w-12 bg-gradient-to-l from-[#0B0B0B] to-transparent pointer-events-none flex items-center justify-end pr-2">
            <motion.div
              animate={{ x: [0, 5, 0] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
              className="text-accent/50"
            >
              <ChevronRight className="w-4 h-4" />
            </motion.div>
          </div>
          <div className="md:hidden text-[10px] text-white/20 font-bold uppercase tracking-widest mt-2 flex items-center gap-2">
            <span>Листайте вправо</span>
            <div className="h-px flex-1 bg-white/5" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence mode="wait">
            {services
              .filter(s => s.category === activeTab)
              .map((service) => (
                <motion.div
                  key={service.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  whileHover={{ y: -8 }}
                  onClick={() => setSelectedService(service)}
                  className="group glass-panel p-8 hover:border-accent/30 transition-all cursor-pointer relative overflow-hidden"
                >
                  <div className="flex items-start justify-between mb-8">
                    <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center text-accent group-hover:bg-accent group-hover:text-bg transition-all">
                      {getIcon(service.type)}
                    </div>
                    <span className="text-[10px] font-bold tracking-widest text-accent bg-accent/10 px-2 py-1 rounded">
                      {getTypeLabel(service.type)}
                    </span>
                  </div>

                  <h3 className="text-xl font-bold mb-3 group-hover:text-accent transition-colors">
                    {service.title}
                  </h3>
                  <p className="text-white/50 text-sm leading-relaxed mb-8">
                    {service.description}
                  </p>

                  <div className="flex items-center justify-end mt-auto">
                    <button className="text-xs font-bold uppercase tracking-widest text-white/40 group-hover:text-white transition-colors">
                      Подробнее →
                    </button>
                  </div>

                  {/* Hover price effect mentioned in spec */}
                  <div className="absolute inset-0 bg-bg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    <div className="text-4xl font-serif font-bold text-accent">
                      {service.price} ₽
                    </div>
                  </div>
                </motion.div>
              ))}
          </AnimatePresence>
          
          {/* Placeholder for categories without services yet */}
          {services.filter(s => s.category === activeTab).length === 0 && (
            <div className="col-span-full py-20 text-center text-white/20 border-2 border-dashed border-white/5 rounded-2xl">
              Раздел находится в разработке. Оставьте заявку, чтобы узнать подробности.
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {selectedService && (
          <BookingModal 
            service={selectedService} 
            onClose={() => setSelectedService(null)} 
          />
        )}
      </AnimatePresence>
    </section>
  );
}
