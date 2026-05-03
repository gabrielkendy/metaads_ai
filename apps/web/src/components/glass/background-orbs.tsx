"use client";

import { motion, useReducedMotion } from "framer-motion";

export function BackgroundOrbs() {
  const reduced = useReducedMotion();

  return (
    <div
      aria-hidden
      className="fixed inset-0 -z-10 overflow-hidden pointer-events-none"
    >
      <motion.div
        animate={
          reduced
            ? undefined
            : { x: [0, 30, 0], y: [0, -20, 0] }
        }
        transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
        className="absolute -top-40 -left-40 w-[500px] h-[500px] rounded-full blur-[120px]"
        style={{ background: "rgba(61, 90, 254, 0.10)" }}
      />
      <motion.div
        animate={
          reduced
            ? undefined
            : { x: [0, -40, 0], y: [0, 30, 0] }
        }
        transition={{ duration: 28, repeat: Infinity, ease: "easeInOut" }}
        className="absolute -bottom-40 -right-40 w-[600px] h-[600px] rounded-full blur-[150px]"
        style={{ background: "rgba(61, 90, 254, 0.08)" }}
      />
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full blur-[200px]"
        style={{ background: "rgba(61, 90, 254, 0.03)" }}
      />
      {/* Grain */}
      <div
        className="absolute inset-0 opacity-[0.025] mix-blend-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />
    </div>
  );
}
