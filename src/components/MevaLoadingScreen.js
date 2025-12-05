'use client'
import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Utensils, ChefHat } from 'lucide-react';

const MevaLoadingScreen = ({ onComplete, tableNumber }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  const steps = [
    { icon: Sparkles, text: "QASA'ya Hoş Geldiniz", duration: 1200 },
    { icon: Utensils, text: "Menü hazırlanıyor", duration: 1000 },
    { icon: ChefHat, text: `Masa ${tableNumber}`, duration: 800 }
  ];

  useEffect(() => {
    const timer = setTimeout(() => {
      if (currentStep < steps.length - 1) {
        setCurrentStep(currentStep + 1);
      } else {
        setIsComplete(true);
        setTimeout(() => {
          onComplete();
        }, 500);
      }
    }, steps[currentStep].duration);

    return () => clearTimeout(timer);
  }, [currentStep, onComplete, tableNumber]);

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-qasa via-qasa-light to-slate-900 flex items-center justify-center z-50 overflow-hidden">
      {/* Subtle Animated Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.1, 0.2, 0.1],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute -top-1/2 -left-1/2 w-full h-full bg-qasa-accent/20 rounded-full blur-[150px]"
        />
        <motion.div
          animate={{
            scale: [1.1, 1, 1.1],
            opacity: [0.08, 0.15, 0.08],
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 2
          }}
          className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-indigo-500/15 rounded-full blur-[150px]"
        />
      </div>

      <div className="text-center px-6 relative z-10">
        {/* Logo Area - Premium Minimalist */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          className="mb-16"
        >
          {/* Floating Logo with Subtle Glow */}
          <motion.div
            animate={{ 
              y: [0, -10, 0],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="relative"
          >
            {/* Subtle Glow Behind Logo */}
            <motion.div
              animate={{
                opacity: [0.3, 0.5, 0.3],
                scale: [1, 1.1, 1],
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="absolute inset-0 flex items-center justify-center"
            >
              <div className="w-[200px] h-[60px] bg-qasa-accent/30 blur-[40px] rounded-full" />
            </motion.div>

            {/* Main Logo */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.8, ease: "easeOut" }}
              className="relative z-10"
            >
              <Image
                src="/qasa.png"
                alt="QASA"
                width={180}
                height={54}
                className="drop-shadow-[0_0_25px_rgba(168,85,247,0.4)] mx-auto brightness-0 invert"
                priority
              />
            </motion.div>

            {/* Elegant Underline */}
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: '120px', opacity: 1 }}
              transition={{ delay: 0.6, duration: 0.8 }}
              className="h-[2px] bg-gradient-to-r from-transparent via-qasa-accent to-transparent mx-auto mt-6"
            />
          </motion.div>

          {/* Tagline */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8, duration: 0.8 }}
            className="text-white/60 font-light tracking-[0.2em] text-sm uppercase mt-8"
          >
            Digital Restaurant Experience
          </motion.p>
        </motion.div>

        {/* Loading Steps - Minimalist */}
        <div className="space-y-5 max-w-md mx-auto">
          <AnimatePresence mode="wait">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isActive = currentStep === index;
              const isCompleted = currentStep > index;
              
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ 
                    opacity: currentStep >= index ? 1 : 0.3,
                    x: 0,
                  }}
                  transition={{ 
                    duration: 0.6, 
                    ease: [0.16, 1, 0.3, 1],
                    delay: index * 0.15 
                  }}
                  className="flex items-center gap-4"
                >
                  {/* Minimalist Step Indicator */}
                  <motion.div 
                    animate={{
                      scale: isActive ? [1, 1.1, 1] : 1,
                    }}
                    transition={{
                      duration: 2,
                      repeat: isActive ? Infinity : 0,
                    }}
                    className="relative flex-shrink-0"
                  >
                    {/* Circle Border */}
                    <svg className="w-12 h-12 -rotate-90">
                      {/* Background Circle */}
                      <circle
                        cx="24"
                        cy="24"
                        r="20"
                        stroke="rgba(255,255,255,0.1)"
                        strokeWidth="2"
                        fill="none"
                      />
                      {/* Progress Circle */}
                      <motion.circle
                        cx="24"
                        cy="24"
                        r="20"
                        stroke="url(#gradient)"
                        strokeWidth="2"
                        fill="none"
                        strokeLinecap="round"
                        initial={{ pathLength: 0 }}
                        animate={{ 
                          pathLength: isCompleted ? 1 : isActive ? 0.7 : 0,
                          opacity: isCompleted || isActive ? 1 : 0.3
                        }}
                        transition={{ 
                          duration: 0.8,
                          ease: "easeOut"
                        }}
                      />
                      <defs>
                        <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#A855F7" />
                          <stop offset="100%" stopColor="#C084FC" />
                        </linearGradient>
                      </defs>
                    </svg>

                    {/* Icon */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      {isCompleted ? (
                        <motion.svg
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="w-5 h-5 text-qasa-accent"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </motion.svg>
                      ) : (
                        <Icon 
                          className={`w-5 h-5 transition-colors duration-500 ${
                            isActive ? 'text-qasa-accent' : 'text-white/40'
                          }`} 
                        />
                      )}
                    </div>
                  </motion.div>

                  {/* Step Text */}
                  <motion.div
                    animate={{
                      opacity: isActive ? [1, 0.7, 1] : 1,
                    }}
                    transition={{
                      duration: 2,
                      repeat: isActive ? Infinity : 0,
                    }}
                    className="flex-1"
                  >
                    <p className={`
                      text-base font-medium transition-all duration-500 tracking-wide
                      ${isCompleted || isActive ? 'text-white' : 'text-white/30'}
                    `}>
                      {step.text}
                    </p>
                  </motion.div>

                  {/* Elegant Line */}
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ 
                      width: isActive ? '40px' : '0px',
                      opacity: isActive ? 1 : 0 
                    }}
                    className="h-[1px] bg-gradient-to-r from-qasa-accent to-transparent"
                  />
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {/* Elegant Progress Bar */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 0.8 }}
          className="mt-12 max-w-xs mx-auto"
        >
          {/* Thin Progress Line */}
          <div className="relative h-[1px] bg-white/10 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ 
                width: `${((currentStep + 1) / steps.length) * 100}%`,
              }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="h-full bg-gradient-to-r from-qasa-accent via-qasa-accent-light to-qasa-accent relative"
            >
              {/* Glowing Tip */}
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 bg-qasa-accent rounded-full shadow-[0_0_10px_rgba(168,85,247,0.8)]" />
            </motion.div>
          </div>

          {/* Percentage - Minimalist */}
          <motion.p
            animate={{ opacity: [0.4, 0.8, 0.4] }}
            transition={{ duration: 3, repeat: Infinity }}
            className="mt-4 text-white/40 text-xs font-light tracking-[0.3em] text-center"
          >
            {Math.round(((currentStep + 1) / steps.length) * 100)}%
          </motion.p>
        </motion.div>

        {/* Subtle Loading Indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5, duration: 1 }}
          className="mt-8 flex justify-center items-center gap-1.5"
        >
          {[...Array(3)].map((_, i) => (
            <motion.div
              key={i}
              animate={{ 
                opacity: [0.2, 0.6, 0.2],
              }}
              transition={{ 
                duration: 1.8, 
                repeat: Infinity, 
                delay: i * 0.3,
                ease: "easeInOut"
              }}
              className="w-1 h-1 bg-white/40 rounded-full"
            />
          ))}
        </motion.div>

        {/* Minimalist Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2, duration: 1 }}
          className="mt-12 text-white/25 text-xs font-light tracking-widest"
        >
          R&apos;ES SOLUTION
        </motion.div>
      </div>

      {/* Subtle Corner Decorations */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-qasa-accent/5 rounded-full blur-[100px]" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-[100px]" />
    </div>
  );
};

export default MevaLoadingScreen;