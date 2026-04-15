import { motion } from "motion/react";

export default function Stats() {
  const stats = [
    { label: "лет опыта", value: "10" },
    { label: "проведённых раскладов", value: "1000+" },
    { label: "онлайн-запись", value: "24/7" }
  ];

  return (
    <section className="py-20 border-y border-white/5 bg-bg">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-center">
          {stats.map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
            >
              <div className="text-5xl md:text-6xl font-serif font-bold text-accent mb-2">
                {stat.value}
              </div>
              <div className="text-white/40 text-sm uppercase tracking-widest font-medium">
                {stat.label}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
