import { useState, useCallback, useEffect } from 'react';

const STORAGE_KEY = 'debugra_hasCompletedTour';

const TOUR_STEPS = [
  {
    target: '#editor-container',
    title: 'Code Editor',
    description:
      'Write and edit your code here. Supports 10+ languages with syntax highlighting, IntelliSense, and bracket matching.',
    icon: '✦',
    placement: 'right',
  },
  {
    target: '.run-btn',
    title: 'Run Your Code',
    description:
      'Click here or press Ctrl+Enter to compile and execute your code instantly. Output appears in the panel on the right.',
    icon: '▶',
    placement: 'bottom',
  },
  {
    target: '.ai-btn',
    title: 'AI Debugger',
    description:
      'Generate test cases, audit code quality, visualize logic flow, and get AI-powered explanations and fixes.',
    icon: '⚡',
    placement: 'bottom',
  },
  {
    target: '.room-controls',
    title: 'Collaborate in Real-Time',
    description:
      'Create or join a room to code together with friends in real-time, complete with voice and video support.',
    icon: '👥',
    placement: 'bottom',
  },
];

export function useWelcomeTour() {
  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  // Check localStorage on mount — start tour if first visit
  useEffect(() => {
    const completed = localStorage.getItem(STORAGE_KEY);
    if (!completed) {
      // Small delay so the editor has time to mount and render
      const timer = setTimeout(() => setIsActive(true), 1200);
      return () => clearTimeout(timer);
    }
  }, []);

  const completeTour = useCallback(() => {
    localStorage.setItem(STORAGE_KEY, 'true');
    setIsActive(false);
    setCurrentStep(0);
  }, []);

  const nextStep = useCallback(() => {
    if (currentStep < TOUR_STEPS.length - 1) {
      setCurrentStep((s) => s + 1);
    } else {
      completeTour();
    }
  }, [currentStep, completeTour]);

  const prevStep = useCallback(() => {
    setCurrentStep((s) => Math.max(0, s - 1));
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
    currentStep,
    totalSteps: TOUR_STEPS.length,
    step: TOUR_STEPS[currentStep],
    steps: TOUR_STEPS,
    nextStep,
    prevStep,
    skipTour,
    resetTour,
  };
}
