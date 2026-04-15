import { useStore } from "../store/useStore";
import { Send } from "lucide-react";

const VKIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M19.985 1.1c-5.122 0-10.243 0-15.365 0-2.545 0-4.62 2.075-4.62 4.62 0 5.123 0 10.244 0 15.366 0 2.545 2.075 4.619 4.62 4.619 5.122 0 10.243 0 15.365 0 2.545 0 4.62-2.074 4.62-4.619 0-5.122 0-10.243 0-15.366 0-2.545-2.075-4.62-4.62-4.62zm-.21 17.554c-.655.85-1.57 1.176-2.748 1.176-1.177 0-2.355-.326-3.01-.85-.655-.523-1.31-1.307-1.965-2.091-.654.784-1.309 1.568-1.964 2.091-.655.524-1.833.85-3.01.85-1.178 0-2.093-.326-2.748-1.176-.655-.85-.655-2.091 0-2.94.655-.85 1.57-1.177 2.748-1.177 1.177 0 2.355.327 3.01.85.655.523 1.31 1.307 1.965 2.091.654-.784 1.309-1.568 1.964-2.091.655-.524 1.833-.85 3.01-.85 1.178 0 2.093.327 2.748 1.177.655.849.655 2.09 0 2.94z" />
  </svg>
);

export default function Footer() {
  const { settings } = useStore();

  return (
    <footer className="py-24 border-t border-white/5 bg-bg">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid md:grid-cols-3 gap-12 items-start mb-16">
          <div className="space-y-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-[10px]">☀️</div>
              <span className="font-serif font-bold text-xl tracking-tight">Sun_Shine</span>
            </div>
            <p className="text-white/40 text-sm leading-relaxed max-w-xs">
              {settings?.description || "Таролог • Энергопрактик. Помогаю найти ответы и обрести внутреннюю силу."}
            </p>
          </div>

          <div className="space-y-6">
            <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-accent">Навигация</h4>
            <nav className="flex flex-col gap-4 text-sm text-white/60">
              <a href="#services" className="hover:text-white transition-colors">Услуги</a>
              <a href="#stories" className="hover:text-white transition-colors">Истории</a>
              <a href="#events" className="hover:text-white transition-colors">Мероприятия</a>
              <a href="/admin" className="hover:text-white transition-colors">Панель управления</a>
            </nav>
          </div>

          <div className="space-y-6" id="contacts">
            <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-accent">Контакты</h4>
            <div className="flex flex-col gap-4">
              <a 
                href={`https://t.me/${settings?.telegram}`} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-3 text-white/60 hover:text-white transition-colors group"
              >
                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center group-hover:bg-accent group-hover:text-bg transition-all">
                  <Send className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-widest text-white/20">Telegram</div>
                  <div className="text-sm font-medium">@{settings?.telegram}</div>
                </div>
              </a>

              <a 
                href={`https://vk.com/${settings?.vk}`} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-3 text-white/60 hover:text-white transition-colors group"
              >
                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center group-hover:bg-accent group-hover:text-bg transition-all">
                  <VKIcon className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-widest text-white/20">ВКонтакте</div>
                  <div className="text-sm font-medium">@{settings?.vk}</div>
                </div>
              </a>

              <a 
                href={settings?.vkGroup} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-xs text-accent hover:underline font-bold"
              >
                Группа ВК: {settings?.vkGroup}
              </a>
            </div>
          </div>
        </div>

        <div className="pt-12 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="text-[10px] text-white/20 font-medium uppercase tracking-widest">
            © 2026 Светлана Романова (Sun_Shine). Все права защищены.
          </div>
          <div className="text-[10px] text-white/20 font-medium italic">
            Деятельность не является медицинской услугой.
          </div>
        </div>
      </div>
    </footer>
  );
}
