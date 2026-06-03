import { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';

/**
 * Computes tooltip position relative to a target element.
 * Returns { top, left, arrowDirection } for the tooltip card.
 */
function computePosition(targetRect, placement, tooltipWidth, tooltipHeight) {
  const GAP = 16;
  const ARROW_SIZE = 8;
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  let top, left, arrowDirection;

  switch (placement) {
    case 'right': {
      top = targetRect.top + targetRect.height / 2 - tooltipHeight / 2;
      left = targetRect.right + GAP + ARROW_SIZE;
      arrowDirection = 'left';
      // If overflows right, flip to left
      if (left + tooltipWidth > vw - 20) {
        left = targetRect.left - tooltipWidth - GAP - ARROW_SIZE;
        arrowDirection = 'right';
      }
      break;
    }
    case 'left': {
      top = targetRect.top + targetRect.height / 2 - tooltipHeight / 2;
      left = targetRect.left - tooltipWidth - GAP - ARROW_SIZE;
      arrowDirection = 'right';
      if (left < 20) {
        left = targetRect.right + GAP + ARROW_SIZE;
        arrowDirection = 'left';
      }
      break;
    }
    case 'bottom': {
      top = targetRect.bottom + GAP + ARROW_SIZE;
      left = targetRect.left + targetRect.width / 2 - tooltipWidth / 2;
      arrowDirection = 'top';
      if (top + tooltipHeight > vh - 20) {
        top = targetRect.top - tooltipHeight - GAP - ARROW_SIZE;
        arrowDirection = 'bottom';
      }
      break;
    }
    case 'top': {
      top = targetRect.top - tooltipHeight - GAP - ARROW_SIZE;
      left = targetRect.left + targetRect.width / 2 - tooltipWidth / 2;
      arrowDirection = 'bottom';
      if (top < 20) {
        top = targetRect.bottom + GAP + ARROW_SIZE;
        arrowDirection = 'top';
      }
      break;
    }
    default:
      top = targetRect.bottom + GAP;
      left = targetRect.left;
      arrowDirection = 'top';
  }

  // Clamp within viewport
  top = Math.max(12, Math.min(vh - tooltipHeight - 12, top));
  left = Math.max(12, Math.min(vw - tooltipWidth - 12, left));

  return { top, left, arrowDirection };
}

export default function WelcomeTour({
  isActive,
  currentStep,
  totalSteps,
  step,
  onNext,
  onPrev,
  onSkip,
}) {
  const [targetRect, setTargetRect] = useState(null);
  const [tooltipPos, setTooltipPos] = useState(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const tooltipRef = useRef(null);
  const prevStepRef = useRef(currentStep);

  // Measure target element and compute position
  const measure = useCallback(() => {
    if (!step) return;
    const el = document.querySelector(step.target);
    if (!el) return;

    const rect = el.getBoundingClientRect();
    setTargetRect(rect);

    // Use a default tooltip size for initial render, then re-measure
    const tooltipEl = tooltipRef.current;
    const tw = tooltipEl ? tooltipEl.offsetWidth : 340;
    const th = tooltipEl ? tooltipEl.offsetHeight : 200;

    const pos = computePosition(rect, step.placement, tw, th);
    setTooltipPos(pos);
  }, [step]);

  // Trigger animation on step change
  useEffect(() => {
    if (prevStepRef.current !== currentStep) {
      setIsAnimating(true);
      const timer = setTimeout(() => setIsAnimating(false), 300);
      prevStepRef.current = currentStep;
      return () => clearTimeout(timer);
    }
  }, [currentStep]);

  // Measure on mount, step change, and window resize
  useEffect(() => {
    if (!isActive) return;

    // Delay initial measurement to let DOM settle
    const timer = setTimeout(measure, 50);

    window.addEventListener('resize', measure);
    window.addEventListener('scroll', measure, true);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', measure);
      window.removeEventListener('scroll', measure, true);
    };
  }, [isActive, measure]);

  // Re-measure after tooltip renders to get accurate size
  useEffect(() => {
    if (!isActive || !tooltipRef.current) return;
    const timer = setTimeout(measure, 60);
    return () => clearTimeout(timer);
  }, [isActive, currentStep, measure]);

  if (!isActive || !step) return null;

  // Spotlight clip-path: full-screen with a rectangle cut out for the target
  const spotlightPath = targetRect
    ? `polygon(
        0% 0%, 0% 100%, 100% 100%, 100% 0%, 0% 0%,
        ${targetRect.left - 6}px ${targetRect.top - 6}px,
        ${targetRect.left - 6}px ${targetRect.bottom + 6}px,
        ${targetRect.right + 6}px ${targetRect.bottom + 6}px,
        ${targetRect.right + 6}px ${targetRect.top - 6}px,
        ${targetRect.left - 6}px ${targetRect.top - 6}px
      )`
    : 'none';

  const isLastStep = currentStep === totalSteps - 1;
  const isFirstStep = currentStep === 0;

  const content = (
    <>
      {/* Overlay backdrop with spotlight cutout */}
      <div
        className="tour-overlay"
        style={{ clipPath: spotlightPath }}
        onClick={onSkip}
        aria-hidden="true"
      />

      {/* Glow ring around target */}
      {targetRect && (
        <div
          className="tour-glow-ring"
          style={{
            top: targetRect.top - 6,
            left: targetRect.left - 6,
            width: targetRect.width + 12,
            height: targetRect.height + 12,
          }}
        />
      )}

      {/* Tooltip card */}
      {tooltipPos && (
        <div
          ref={tooltipRef}
          className={`tour-tooltip ${isAnimating ? 'tour-tooltip--animating' : ''}`}
          style={{
            top: tooltipPos.top,
            left: tooltipPos.left,
          }}
          role="dialog"
          aria-label={`Tour step ${currentStep + 1} of ${totalSteps}`}
          aria-modal="true"
        >
          {/* Arrow */}
          <div className={`tour-tooltip-arrow tour-tooltip-arrow--${tooltipPos.arrowDirection}`} />

          {/* Header */}
          <div className="tour-tooltip-header">
            <div className="tour-tooltip-icon">{step.icon}</div>
            <div className="tour-tooltip-title">{step.title}</div>
            <button
              className="tour-tooltip-close"
              onClick={onSkip}
              aria-label="Skip tour"
              title="Skip tour"
            >
              ✕
            </button>
          </div>

          {/* Body */}
          <p className="tour-tooltip-body">{step.description}</p>

          {/* Footer */}
          <div className="tour-tooltip-footer">
            {/* Step dots */}
            <div className="tour-step-dots">
              {Array.from({ length: totalSteps }, (_, i) => (
                <span
                  key={i}
                  className={`tour-step-dot ${i === currentStep ? 'active' : ''} ${i < currentStep ? 'completed' : ''}`}
                />
              ))}
            </div>

            {/* Navigation */}
            <div className="tour-tooltip-nav">
              <button aria-label="Button"
                className="tour-tooltip-skip"
                onClick={onSkip}
              >
                Skip Tour
              </button>
              {!isFirstStep && (
                <button aria-label="Button"
                  className="tour-nav-btn tour-nav-btn--back"
                  onClick={onPrev}
                >
                  Back
                </button>
              )}
              <button aria-label="Button"
                className="tour-nav-btn tour-nav-btn--next"
                onClick={onNext}
              >
                {isLastStep ? '✦ Finish' : 'Next →'}
              </button>
            </div>
          </div>

          {/* Step counter */}
          <div className="tour-step-counter">
            {currentStep + 1} / {totalSteps}
          </div>
        </div>
      )}
    </>
  );

  return createPortal(content, document.body);
}
