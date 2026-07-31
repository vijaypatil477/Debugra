import { useEffect, useState } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';

export default function ScrollButtons() {
  const [showUp, setShowUp] = useState(false);
  const [showDown, setShowDown] = useState(true);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;

      // Show UP button after scrolling down
      setShowUp(scrollTop > 300);

      // Hide DOWN button near bottom
      setShowDown(scrollTop + windowHeight < documentHeight - 300);
    };

    handleScroll();

    window.addEventListener('scroll', handleScroll);

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  const scrollToBottom = () => {
    window.scrollTo({
      top: document.documentElement.scrollHeight,
      behavior: 'smooth',
    });
  };

  return (
    <div className="fixed bottom-5 right-4 z-50 flex flex-col gap-3 sm:bottom-6 sm:right-6">
      {/* Scroll Up */}
      <button
        onClick={scrollToTop}
        aria-label="Scroll to top"
        className={`
          group flex h-12 w-12 items-center justify-center
          rounded-full border border-slate-700
          bg-[#1e1e3a]/90 text-slate-200
          shadow-lg backdrop-blur-md
          transition-all duration-300
          hover:scale-110 hover:bg-[#2a2a4a]
          active:scale-95
          ${showUp ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-4 opacity-0'}
        `}
      >
        <ChevronUp size={22} className="transition-transform group-hover:-translate-y-0.5" />
      </button>

      {/* Scroll Down */}
      <button
        onClick={scrollToBottom}
        aria-label="Scroll to bottom"
        className={`
          group flex h-12 w-12 items-center justify-center
          rounded-full border border-slate-700
          bg-[#1e1e3a]/90 text-slate-200
          shadow-lg backdrop-blur-md
          transition-all duration-300
          hover:scale-110 hover:bg-[#2a2a4a]
          active:scale-95
          ${showDown ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-4 opacity-0'}
        `}
      >
        <ChevronDown size={22} className="transition-transform group-hover:translate-y-0.5" />
      </button>
    </div>
  );
}
