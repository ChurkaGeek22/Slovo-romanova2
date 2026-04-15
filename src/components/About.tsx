import { motion } from "motion/react";
import { Check, MessageSquare } from "lucide-react";
import { useStore } from "../store/useStore";

export default function About() {
  const { setIsChatOpen, settings } = useStore();
  const benefits = [
    "Индивидуальный подход к каждому",
    "Конфиденциальность и деликатность",
    "Работа с любой сферой жизни",
    "Быстрая обратная связь"
  ];

  return (
    <section id="about" className="py-24 bg-white/[0.02]">
      <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-16 items-center">
        <motion.div 
          initial={{ opacity: 0, x: -40 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          className="relative"
        >
          <div className="aspect-square rounded-full border-2 border-accent/20 p-4">
            <div className="w-full h-full rounded-full overflow-hidden border-4 border-accent/10">
              <img 
                src="/svetlana.jpeg" 
                alt="About Svetlana" 
                className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-700"
                referrerPolicy="no-referrer"
              />
            </div>
          </div>
          {/* Decorative element */}
          <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-accent/20 rounded-full blur-3xl" />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 40 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
        >
          <span className="text-accent text-xs font-bold tracking-[0.2em] uppercase mb-4 block">
            Обо мне
          </span>
          <h2 className="text-4xl md:text-5xl font-serif font-bold mb-8" dangerouslySetInnerHTML={{ __html: settings?.texts?.aboutTitle || "Светлана <span class='text-accent'>Романова</span>" }} />
          
          <div className="space-y-6 text-white/60 leading-relaxed text-lg">
            <p className="whitespace-pre-wrap">
              {settings?.texts?.aboutDescription || "Меня зовут Светлана. Под именем Sun_Shine я работаю уже более 10 лет. Моя специализация — расклады на картах Таро и психологическая поддержка.\n\nЯ помогаю людям найти ответы на сложные вопросы, разобраться в запутанных ситуациях и получить ясность там, где кажется, что её нет. Каждый клиент — это уникальная история, к которой я подхожу с вниманием и заботой.\n\nМоя работа — это не просто гадание. Это глубокий анализ ситуации, понимание причин и поиск лучшего пути для вас."}
            </p>
          </div>

          <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {benefits.map((benefit, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-accent/10 flex items-center justify-center">
                  <Check className="w-3 h-3 text-accent" />
                </div>
                <span className="text-sm font-medium text-white/80">{benefit}</span>
              </div>
            ))}
          </div>

          <div className="mt-12">
            <button 
              onClick={() => setIsChatOpen(true)}
              className="bg-accent text-black px-8 py-4 rounded-full font-bold text-sm glow-button transition-all flex items-center gap-3"
            >
              <MessageSquare className="w-4 h-4" />
              Написать в чат
            </button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
