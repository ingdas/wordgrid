import { motion } from "framer-motion";
import { useMemo } from "react";

// The Puzzle Press palette — the theme's four group colours plus the stamp red
// and gold. (The neon pink/sky/violet mix here predated the retheme and read as
// a different game landing on the paper.)
const COLORS = [
  "#eda820", // gold
  "#d9482b", // stamp red
  "#5eb0e0", // group blue
  "#b48fd9", // group purple
  "#6cc793", // group green
  "#1c7a4d", // leaf
];

/** A short, celebratory burst of confetti pieces. */
export default function Confetti({ count = 90 }: { count?: number }) {
  const pieces = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        delay: Math.random() * 0.4,
        duration: 2.4 + Math.random() * 1.6,
        rotate: Math.random() * 720 - 360,
        drift: Math.random() * 120 - 60,
        size: 6 + Math.random() * 8,
        color: COLORS[i % COLORS.length],
        round: Math.random() > 0.6,
      })),
    [count]
  );

  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
      {pieces.map((p) => (
        <motion.span
          key={p.id}
          initial={{ y: -40, x: 0, opacity: 1, rotate: 0 }}
          animate={{ y: "110vh", x: p.drift, rotate: p.rotate, opacity: [1, 1, 0.9, 0] }}
          transition={{ duration: p.duration, delay: p.delay, ease: "easeIn" }}
          style={{
            position: "absolute",
            left: `${p.x}%`,
            top: 0,
            width: p.size,
            height: p.round ? p.size : p.size * 0.5,
            borderRadius: p.round ? "50%" : 2,
            background: p.color,
          }}
        />
      ))}
    </div>
  );
}
