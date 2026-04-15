import { motion } from "motion/react";
import { useStore } from "../store/useStore";
import { cn } from "../lib/utils";
import { ChevronRight } from "lucide-react";

export default function Stories() {
  const { settings } = useStore();
  const stories = settings?.stories || [];

  if (stories.length === 0) return null;

  return (
    <section id="stories" className="py-24 bg-white/[0.01]">
      <div className="max-w-7xl mx-auto px-6">
        <div className="mb-16">
          <span className="text-accent text-xs font-bold tracking-[0.2em] uppercase mb-4 block">
            Ваши истории
          </span>
          <h2 className="text-4xl md:text-5xl font-serif font-bold">
            Путь трансформации
          </h2>
        </div>

        <div className="relative">
          <div className="flex gap-6 overflow-x-auto pb-8 no-scrollbar snap-x scroll-smooth">
            {stories.sort((a, b) => a.order - b.order).map((story, i) => (
              <motion.div
                key={story.id}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="flex-shrink-0 w-[280px] aspect-[9/16] rounded-3xl overflow-hidden border border-white/10 snap-center relative group"
              >
                <img 
                  src={story.imageUrl} 
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                  referrerPolicy="no-referrer"
                  alt={`Story ${i + 1}`}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              </motion.div>
            ))}
          </div>
          {/* Mobile Swipe Hint */}
          <div className="md:hidden absolute right-0 top-0 bottom-8 w-12 bg-gradient-to-l from-[#0B0B0B] to-transparent pointer-events-none flex items-center justify-end pr-2">
            <motion.div
              animate={{ x: [0, 5, 0] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
              className="text-accent/50"
            >
              <ChevronRight className="w-4 h-4" />
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
