import React, { useState } from "react";
import { motion } from "motion/react";
import { LogIn, ShieldAlert } from "lucide-react";

export default function Login() {
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ login, password })
      });

      const data = await res.json();
      if (res.ok) {
        if (data.unblocked) {
          window.location.reload();
        } else {
          window.location.href = "/admin";
        }
      } else {
        setError(data.error || "Ошибка входа");
      }
    } catch (err) {
      setError("Ошибка сервера");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0B0B] flex items-center justify-center p-6 font-sans">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md glass-panel p-8 space-y-8 border-accent/20"
      >
        <div className="text-center space-y-2">
          <div className="w-16 h-16 bg-accent rounded-full flex items-center justify-center text-black mx-auto mb-4 shadow-lg shadow-accent/20">
            <LogIn className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Вход в панель</h1>
          <p className="text-white/40 text-sm">Введите учетные данные для доступа</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] uppercase font-bold text-white/40 ml-1">Логин</label>
            <input
              type="text"
              value={login}
              onChange={(e) => setLogin(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-accent/50 transition-all"
              placeholder="Sveta"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] uppercase font-bold text-white/40 ml-1">Пароль</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-accent/50 transition-all"
              placeholder="••••••••"
              required
            />
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-3 text-red-400 text-sm"
            >
              <ShieldAlert className="w-5 h-5 shrink-0" />
              {error}
            </motion.div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-accent text-black py-4 rounded-xl font-bold hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:hover:scale-100 shadow-lg shadow-accent/20"
          >
            {isLoading ? "Проверка..." : "Войти"}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
