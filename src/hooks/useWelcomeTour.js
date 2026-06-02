import { useState, useCallback, useEffect } from 'react';

const STORAGE_KEY = 'debugra_hasCompletedTour';

export function useWelcomeTour() {
  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile viewport on mount and resize
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Determine steps dynamically based on screen size
  const steps = isMobile
    ? [
        {
          target: '#editor-container',
          title: 'Code Editor',
          content: 'Write and edit your code here. Supports multiple languages with syntax highlighting, auto-completion, and diagnostic feedback.',
          placement: 'bottom',
          icon: '✦',
          disableBeacon: true,
        },
        {
          target: '.mobile-nav-run',
          title: 'Run Your Code',
          content: 'Tap here to compile and execute your code instantly. The output will be shown in the Output tab.',
          placement: 'top',
          icon: '▶',
        },
      ]
    : [
        {
          target: '#editor-container',
          title: 'Code Editor',
          content: 'Write and edit your code here. Supports 10+ languages with syntax highlighting, IntelliSense, and bracket matching.',
          placement: 'right',
          icon: '✦',
          disableBeacon: true,
        },
        {
          target: '.run-btn',
          title: 'Run Your Code',
          content: 'Click here or press Ctrl+Enter to compile and execute your code instantly. Output appears in the panel on the right.',
          placement: 'bottom',
          icon: '▶',
        },
        {
          target: '.ai-btn',
          title: 'AI Debugger & Chat',
          content: 'Audit code quality, generate test cases, analyze complexity, and get AI-powered explanations and fixes in the AI panel.',
          placement: 'bottom',
          icon: '⚡',
        },
        {
          target: '.room-controls',
          title: 'Collaborate in Real-Time',
          content: 'Create or join a room to code together with your peers in real-time, complete with voice and video support.',
          placement: 'bottom',
          icon: '👥',
        },
      ];

  // Check localStorage on mount — start tour if first visit
  useEffect(() => {
    const completed = localStorage.getItem(STORAGE_KEY);
    if (!completed) {
      const timer = setTimeout(() => setIsActive(true), 1200);
      return () => clearTimeout(timer);
    }
  }, []);

  const completeTour = useCallback(() => {
    localStorage.setItem(STORAGE_KEY, 'true');
    setIsActive(false);
    setCurrentStep(0);
  }, []);

  const skipTour = useCallback(() => {
    completeTour();
  }, [completeTour]);

  const resetTour = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setCurrentStep(0);
    setIsActive(true);
  }, []);

  return {
    isActive,
    setIsActive,
    currentStep,
    setCurrentStep,
    totalSteps: steps.length,
    step: steps[currentStep],
    steps,
    completeTour,
    skipTour,
    resetTour,
  };
}
