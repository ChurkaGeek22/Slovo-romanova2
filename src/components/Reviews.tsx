import { motion } from "motion/react";
import { ChevronRight } from "lucide-react";

export default function Reviews() {
  const reviews = [
    "https://picsum.photos/seed/review1/400/600",
    "https://picsum.photos/seed/review2/400/600",
    "https://picsum.photos/seed/review3/400/600",
    "https://picsum.photos/seed/review4/400/600",
    "https://picsum.photos/seed/review5/400/600",
    "https://picsum.photos/seed/review6/400/600",
  ];

  return (
    <section id="reviews" className="py-24 bg-white/[0.02]">
      <div className="max-w-7xl mx-auto px-6">
        <div className="mb-16 text-center">
          <span className="text-accent text-xs font-bold tracking-[0.2em] uppercase mb-4 block">
            Отзывы
          </span>
          <h2 className="text-4xl md:text-5xl font-serif font-bold">
            Ваши истории
          </h2>
        </div>

        <div className="relative">
          <div className="flex overflow-x-auto gap-6 pb-8 no-scrollbar scroll-smooth">
            {reviews.map((src, i) => (
              <motion.div
                key={i}
                whileHover={{ scale: 1.02 }}
                className="flex-shrink-0 w-64 md:w-80 aspect-[2/3] rounded-2xl overflow-hidden border border-white/10"
              >
                <img 
                  src={src} 
                  alt={`Review ${i + 1}`} 
                  className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-500"
                  referrerPolicy="no-referrer"
                />
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
