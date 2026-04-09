"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";

export default function IntroLoader() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const seen = sessionStorage.getItem("intro_seen");

    if (!seen) {
      setShow(true);
      sessionStorage.setItem("intro_seen", "true");

      const timer = setTimeout(() => {
        setShow(false);
      }, 2200); // FAST (performance safe)

      return () => clearTimeout(timer);
    }
  }, []);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black overflow-hidden"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* BACKGROUND GRADIENT GLOW (LIGHTWEIGHT) */}
          <motion.div
            className="absolute w-[300px] h-[300px] bg-pink-500/20 rounded-full blur-3xl"
            animate={{
              scale: [1, 1.4, 1],
              opacity: [0.4, 0.7, 0.4],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />

          <div className="relative flex flex-col items-center gap-6">
            {/* LOGO */}
            <motion.img
              src="/logo.png"
              alt="Baby Mall"
              className="w-28 md:w-40 object-contain drop-shadow-[0_0_25px_rgba(255,0,150,0.5)]"
              initial={{
                scale: 0.7,
                opacity: 0,
                y: 20,
              }}
              animate={{
                scale: 1,
                opacity: 1,
                y: 0,
              }}
              transition={{
                duration: 0.8,
                ease: "easeOut",
              }}
            />

{/* TEXT */}
<div className="flex gap-[2px] overflow-hidden">
  {"Welcome to Baby Mall".split("").map((char, i) => (
    <motion.span
      key={i}
      className="bg-gradient-to-r from-pink-400 via-purple-400 to-pink-400 bg-clip-text text-transparent text-lg md:text-2xl font-medium tracking-wide relative drop-shadow-[0_0_10px_rgba(255,0,150,0.5)]"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        delay: 0.4 + i * 0.03,
        duration: 0.4,
      }}
    >
      {char}
      <motion.span
        className="absolute inset-0 rounded-full bg-pink-500/30 blur-md"
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: [0, 0.6, 0], scale: [0.5, 1.2, 1] }}
        transition={{
          delay: 0.4 + i * 0.03,
          duration: 0.6,
          ease: "easeOut",
        }}
      />
    </motion.span>
  ))}
</div>

            {/* PROGRESS LINE */}
            <motion.div
              className="h-[2px] w-32 bg-gradient-to-r from-pink-500 via-purple-500 to-pink-500"
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{
                delay: 0.7,
                duration: 0.8,
                ease: "easeInOut",
              }}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
