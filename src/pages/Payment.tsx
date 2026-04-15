import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { ArrowLeft, Copy, CheckCircle2, X } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useStore } from "../store/useStore";

export default function Payment() {
  const location = useLocation();
  const { price = 0, title = "Услуга" } = location.state || {};
  const { settings, fetchSettings } = useStore();
  const [showModal, setShowModal] = useState<"netmonet" | "sbp" | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const handlePaymentClick = () => {
    const method = settings?.paymentMethodType || "netmonet_modal";
    if (method === "netmonet_tab") {
      window.open("https://netmonet.co/qr/175046/tip?o=0", "_blank");
    } else if (method === "netmonet_modal") {
      setShowModal("netmonet");
    } else if (method === "sbp_modal") {
      setShowModal("sbp");
    }
  };

  const handleCopyPhone = () => {
    navigator.clipboard.writeText("+79050911521");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-6">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-xl w-full glass-panel p-10 border-accent/10"
      >
        <div className="text-center mb-10">
          <h1 className="text-3xl font-serif font-bold text-accent mb-2">Оплата услуги</h1>
          <p className="text-white/40 text-sm">Для завершения подачи заявки, нужно внести оплату</p>
        </div>

        <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-8 mb-8">
          <div className="text-[10px] font-bold tracking-[0.2em] text-accent uppercase mb-6">Ваш заказ</div>
          
          <div className="flex items-center justify-between mb-4">
            <span className="font-bold">{title}</span>
            <span className="font-bold">{price} ₽</span>
          </div>
          
          <div className="h-px bg-white/5 my-6" />
          
          <div className="flex items-center justify-between">
            <span className="text-lg font-bold">Итого к оплате:</span>
            <span className="text-2xl font-serif font-bold text-accent">{price} ₽</span>
          </div>
        </div>

        <button 
          onClick={handlePaymentClick}
          className="w-full bg-accent text-bg py-4 rounded-xl font-bold text-lg glow-button mb-8"
        >
          Оплатить
        </button>

        <div className="bg-accent/5 border border-accent/10 rounded-xl p-6 text-[11px] leading-relaxed text-white/50 mb-8">
          Услуга оказывается только при полной оплате при подаче заявки. Я связываюсь с Вами в течение 2-х дней, по контактам которые Вы указали. Оплата происходит через онлайн сервис оплат и чаевых АО "АльфаБанк" в НетМонет.
          <br /><br />
          <span className="text-accent font-bold">Вручную укажите сумму при оплате</span>, а при выборе типа — уберите галочку "Заплатить за услуги НетМонет", чтобы не платить комиссию. После оплаты вернитесь на страницу и нажмите "Внёс оплату" обязательно.
        </div>

        <Link to="/" className="flex items-center justify-center gap-2 text-accent text-xs font-bold uppercase tracking-widest hover:opacity-80 transition-opacity">
          <ArrowLeft className="w-3 h-3" />
          Вернуться на главную
        </Link>
      </motion.div>

      {/* Modals */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowModal(null)} />
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative w-full max-w-md bg-[#111] border border-white/10 rounded-3xl overflow-hidden shadow-2xl"
          >
            <button 
              onClick={() => setShowModal(null)}
              className="absolute top-4 right-4 z-10 p-2 bg-black/50 hover:bg-black/80 rounded-full text-white/60 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {showModal === "netmonet" && (
              <div className="h-[80vh] max-h-[600px] w-full bg-white">
                <iframe 
                  src="https://netmonet.co/qr/175046/tip?o=6" 
                  className="w-full h-full border-0"
                  title="Оплата НетМонет"
                  allow="payment"
                />
              </div>
            )}

            {showModal === "sbp" && (
              <div className="p-8 space-y-6">
                <div className="text-center space-y-2">
                  <h3 className="text-2xl font-serif font-bold text-accent">Перевод по СБП</h3>
                  <p className="text-white/60 text-sm">Переведите сумму по указанным реквизитам</p>
                </div>

                <div className="bg-white/5 rounded-2xl p-6 space-y-4 border border-white/10">
                  <div>
                    <div className="text-[10px] uppercase font-bold text-white/40 mb-1">Телефон</div>
                    <button 
                      onClick={handleCopyPhone}
                      className="w-full flex items-center justify-between bg-black/30 hover:bg-black/50 p-3 rounded-xl transition-colors group"
                    >
                      <span className="font-mono text-lg tracking-wider">+7 (905) 091-1521</span>
                      {copied ? (
                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                      ) : (
                        <Copy className="w-5 h-5 text-white/40 group-hover:text-accent transition-colors" />
                      )}
                    </button>
                  </div>
                  
                  <div>
                    <div className="text-[10px] uppercase font-bold text-white/40 mb-1">Банк получателя</div>
                    <div className="font-bold text-lg">Озон Банк (Ozon)</div>
                  </div>

                  <div>
                    <div className="text-[10px] uppercase font-bold text-white/40 mb-1">Получатель</div>
                    <div className="font-bold text-lg">Светлана Р.</div>
                  </div>
                </div>

                <div className="bg-accent/10 border border-accent/20 rounded-xl p-4 text-center">
                  <p className="text-sm text-accent font-bold">Сумма к переводу: {price} ₽</p>
                </div>

                <button 
                  onClick={() => setShowModal(null)}
                  className="w-full bg-white/10 hover:bg-white/20 text-white py-4 rounded-xl font-bold transition-colors"
                >
                  Я перевел(а)
                </button>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </div>
  );
}
