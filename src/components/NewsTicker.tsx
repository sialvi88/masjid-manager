import React from 'react';
import { motion } from 'motion/react';
import { useStore } from '../store';

export default function NewsTicker() {
  const { settings, language } = useStore();
  
  const rawNewsItems = settings.news && settings.news.length > 0 ? settings.news : [
    "جامع مسجد اور مدرسہ کے لیے آپ کے تعاون کا شکریہ۔",
    "صدقہ بلاؤں کو ٹالتا ہے اور رزق میں برکت لاتا ہے۔",
    "نئے تعلیمی سال کے لیے داخلے شروع ہو چکے ہیں۔"
  ];

  const { speed = 30, fontSize = 20, bgColor = "#1e3a8a", textColor = "#ffffff" } = settings.ticker || {};
  const label = language === 'ur' ? 'تازہ ترین' : 'LIVE';

  // Responsive font size adjustment
  const [windowWidth, setWindowWidth] = React.useState(typeof window !== 'undefined' ? window.innerWidth : 1200);

  React.useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const responsiveFontSize = windowWidth < 640 ? Math.min(fontSize, 14) : 
                             windowWidth < 1024 ? Math.min(fontSize, 18) : 
                             fontSize;

  if (rawNewsItems.length === 0) return null;

  // For correct Urdu reading: the first news should enter first from the right.
  // We use flex-row-reverse so the items are laid out RTL.
  const TickerSet = () => (
    <div className="flex flex-row-reverse items-center shrink-0">
      {rawNewsItems.map((item, idx) => (
        <div key={idx} className="flex flex-row-reverse items-center px-4 shrink-0" style={{ fontSize: `${responsiveFontSize}px`, color: textColor }}>
           <span className="font-bold drop-shadow-sm">{item}</span>
           <span className="mx-2 md:mx-3 text-yellow-400 text-xl md:text-2xl font-black opacity-80">★</span>
        </div>
      ))}
    </div>
  );

  // Duration based on news length
  const duration = (speed * rawNewsItems.length) / 3;

  return (
    <div 
      className="fixed bottom-0 left-0 w-full z-50 overflow-hidden flex h-10 md:h-14 shadow-[0_-10px_30px_rgba(0,0,0,0.5)] select-none border-t-2 border-yellow-500"
      style={{ backgroundColor: bgColor }}
    >
      {/* 1. Ticker Area (Entering from Right, going Left - Correct for Urdu TV) */}
      <div className="relative flex-1 overflow-hidden">
        <motion.div 
          className="flex flex-row-reverse whitespace-nowrap w-max h-full items-center absolute right-0"
          animate={{ x: ["0%", "50%"] }} // Moving Left in an absolute right-anchored container
          transition={{ 
            duration: duration, 
            ease: "linear", 
            repeat: Infinity 
          }}
        >
          <TickerSet />
          <TickerSet />
        </motion.div>
      </div>

      {/* 2. Static Label (On the Right) */}
      <div className="relative bg-yellow-500 text-black px-4 md:px-6 flex items-center justify-center font-black z-30 shadow-[-5px_0_15px_rgba(0,0,0,0.3)] shrink-0">
        <div className="absolute top-0 -left-4 h-full w-4 bg-yellow-500 [clip-path:polygon(100%_0,100%_100%,0_0)]"></div>
        
        <motion.span
          animate={{ opacity: [1, 0.4, 1] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="text-sm md:text-xl uppercase tracking-tighter"
        >
          {label}
        </motion.span>
      </div>

      {/* Screen Gloss Effect */}
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-white/10 via-transparent to-black/10 opacity-70"></div>
    </div>
  );
}
