import { motion } from "motion/react";
import { Calendar, MapPin, Users } from "lucide-react";
import { useStore } from "../store/useStore";

export default function Events() {
  const { settings, setIsChatOpen } = useStore();
  const events = settings?.events || [];

  if (events.length === 0) return null;

  return (
    <section id="events" className="py-24">
      <div className="max-w-7xl mx-auto px-6">
        <div className="mb-16">
          <span className="text-accent text-xs font-bold tracking-[0.2em] uppercase mb-4 block">
            События
          </span>
          <h2 className="text-4xl md:text-5xl font-serif font-bold">
            Ближайшие мероприятия
          </h2>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {events.map((event, i) => (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="glass-panel p-8 md:p-10 flex flex-col"
            >
              <div className="flex items-center justify-between mb-8">
                <span className="text-[10px] font-bold text-accent bg-accent/10 px-3 py-1 rounded-full uppercase tracking-widest">
                  Мероприятие
                </span>
                <div className="flex items-center gap-2 text-white/40 text-xs font-bold uppercase tracking-widest">
                  <Users className="w-3 h-3" /> Места ограничены
                </div>
              </div>

              <h3 className="text-2xl font-serif font-bold mb-4">{event.title}</h3>
              <p className="text-white/50 text-sm leading-relaxed mb-8 flex-1">
                {event.description}
              </p>

              <div className="space-y-3 mb-10">
                <div className="flex items-center gap-3 text-sm text-white/80">
                  <Calendar className="w-4 h-4 text-accent" />
                  {event.date}
                </div>
                <div className="flex items-center gap-3 text-sm text-white/80">
                  <MapPin className="w-4 h-4 text-accent" />
                  Онлайн / Оффлайн
                </div>
              </div>

              <button 
                onClick={() => setIsChatOpen(true)}
                className="w-full bg-white/5 hover:bg-accent hover:text-bg border border-white/10 hover:border-accent py-4 rounded-xl font-bold transition-all uppercase tracking-widest text-xs"
              >
                Оставить заявку через бота
              </button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
