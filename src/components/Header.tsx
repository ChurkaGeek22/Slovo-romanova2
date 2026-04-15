import { motion } from "motion/react";
import { cn } from "../lib/utils";

import { Sun, Moon } from "lucide-react";
import { useStore } from "../store/useStore";

export default function Header() {
  const { theme, setTheme, setIsChatOpen } = useStore();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-bg/90 backdrop-blur-md border-b border-white/5 h-20">
      <div className="max-w-[1024px] mx-auto px-[60px] h-full flex items-center justify-between">
        <div className="flex items-center gap-2">
          <a href="/" className="font-sans text-2xl font-bold tracking-wider text-accent uppercase no-underline hover:opacity-80 transition-opacity">Sun_Shine</a>
        </div>
        
        <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-white/60">
          <a href="#services" className="hover:text-accent transition-colors uppercase tracking-wider">Услуги</a>
          <a href="#about" className="hover:text-accent transition-colors uppercase tracking-wider">Обо мне</a>
          <a href="#contacts" className="hover:text-accent transition-colors uppercase tracking-wider">Контакты</a>
        </nav>
 
        <button 
          onClick={() => {
            document.getElementById("services")?.scrollIntoView({ behavior: "smooth" });
            setIsChatOpen(true);
          }}
          className="bg-accent text-black px-7 py-3 rounded-full font-bold text-sm glow-button transition-all"
        >
          Записаться
        </button>
      </div>
    </header>
  );
}
