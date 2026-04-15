import { motion } from "motion/react";
import { useStore } from "../store/useStore";
import { useEffect, useRef, useState } from "react";

export default function Hero() {
  const { setIsChatOpen, settings } = useStore();
  const sunRef = useRef<HTMLImageElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const rotationRef = useRef(0);
  const speedRef = useRef(0.5); // base speed degrees per frame

  useEffect(() => {
    let animationFrameId: number;
    
    const animate = () => {
      // Target speed: 0.5 normally, 2.5 when hovered (5x)
      const targetSpeed = isHovered ? 2.5 : 0.5;
      
      // Smoothly interpolate current speed towards target speed
      speedRef.current += (targetSpeed - speedRef.current) * 0.05;
      
      rotationRef.current += speedRef.current;
      
      if (sunRef.current) {
        sunRef.current.style.transform = `rotate(${rotationRef.current}deg)`;
      }
      
      animationFrameId = requestAnimationFrame(animate);
    };
    
    animate();
    
    return () => cancelAnimationFrame(animationFrameId);
  }, [isHovered]);

  const scrollToServices = () => {
    const servicesSection = document.getElementById("services");
    if (servicesSection) {
      servicesSection.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section className="relative pt-20 pb-10 overflow-hidden flex flex-col items-center text-center">
      {/* Background Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-accent/5 rounded-full blur-[120px] -z-10" />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8 }}
        className="mb-5"
      >
        <div 
          className="w-[100px] h-[100px] rounded-full sun-avatar-glow flex items-center justify-center overflow-hidden cursor-pointer"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <img 
            ref={sunRef}
            src="/logo.jpg" 
            alt="Sun Logo" 
            className="w-full h-full object-cover"
          />
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.8 }}
        className="px-6"
      >
        <h1 className="text-[42px] font-bold mb-2 tracking-tight">
          {settings?.texts?.heroTitle || "Светлана Романова"}
        </h1>
        <span className="text-accent text-xl font-bold tracking-[4px] uppercase mb-4 block">
          {settings?.texts?.heroSubtitle || "Sun_Shine"}
        </span>
        <p className="text-text-dim text-base max-w-[600px] mx-auto mb-8 leading-relaxed">
          {settings?.texts?.heroDescription || "Дипломированный таролог и мастер энергетических практик. Помогаю найти ответы в глубине подсознания и скорректировать жизненный путь к успеху и гармонии."}
        </p>

        <div className="flex flex-row items-center justify-center gap-4">
          <button 
            onClick={scrollToServices}
            className="bg-accent text-black px-7 py-3 rounded-full font-semibold text-sm glow-button transition-all"
          >
            Выбрать услугу
          </button>
          <button 
            onClick={() => setIsChatOpen(true)}
            className="bg-transparent border border-accent text-accent px-7 py-3 rounded-full font-semibold text-sm hover:bg-accent/10 transition-all"
          >
            Написать в чат
          </button>
        </div>
      </motion.div>
    </section>
  );
}
