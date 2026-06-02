import React from 'react';
import { Joyride, ACTIONS, EVENTS, STATUS } from 'react-joyride';

/**
 * CustomTooltip component for React Joyride
 * Reuses the premium styles from index.css
 */
function CustomTooltip({
  index,
  step,
  backProps,
  closeProps,
  primaryProps,
  skipProps,
  tooltipProps,
  isLastStep,
  size,
}) {
  return (
    <div
      ref={tooltipProps.ref}
      style={tooltipProps.style}
      className="tour-tooltip"
      role="dialog"
      aria-modal="true"
    >
      {/* Arrow */}
      <div className="tour-tooltip-arrow" data-popper-arrow />

      {/* Header */}
      <div className="tour-tooltip-header">
        <div className="tour-tooltip-icon">{step.icon}</div>
        <div className="tour-tooltip-title">{step.title}</div>
        <button
          className="tour-tooltip-close"
          {...closeProps}
          aria-label="Skip tour"
          title="Skip tour"
        >
          ✕
        </button>
      </div>

      {/* Body */}
      <p className="tour-tooltip-body">{step.content}</p>

      {/* Footer */}
      <div className="tour-tooltip-footer">
        {/* Step dots */}
        <div className="tour-step-dots">
          {Array.from({ length: size }, (_, i) => (
            <span
              key={i}
              className={`tour-step-dot ${i === index ? 'active' : ''} ${i < index ? 'completed' : ''}`}
            />
          ))}
        </div>

        {/* Navigation */}
        <div className="tour-tooltip-nav">
          <button
            className="tour-tooltip-skip"
            {...skipProps}
          >
            Skip Tour
          </button>
          {index > 0 && (
            <button
              className="tour-nav-btn tour-nav-btn--back"
              {...backProps}
            >
              Back
            </button>
          )}
          <button
            className="tour-nav-btn tour-nav-btn--next"
            {...primaryProps}
          >
            {isLastStep ? '✦ Finish' : 'Next →'}
          </button>
        </div>
      </div>

      {/* Step counter */}
      <div className="tour-step-counter">
        {index + 1} / {size}
      </div>
    </div>
  );
}

export default function WelcomeTour({
  isActive,
  steps,
  currentStep,
  setCurrentStep,
  onClose,
}) {
  const handleJoyrideCallback = (data) => {
    const { action, index, status, type } = data;

    if ([STATUS.FINISHED, STATUS.SKIPPED].includes(status)) {
      if (onClose) {
        onClose();
      }
    } else if ([EVENTS.STEP_AFTER, EVENTS.TARGET_NOT_FOUND].includes(type)) {
      const nextStepIndex = index + (action === ACTIONS.PREV ? -1 : 1);
      setCurrentStep(nextStepIndex);
    }
  };

  return (
    <Joyride
      steps={steps}
      run={isActive}
      stepIndex={currentStep}
      callback={handleJoyrideCallback}
      continuous
      showSkipButton
      showProgress={false}
      tooltipComponent={CustomTooltip}
      disableOverlayClose
      disableScrollParentFix
      spotlightClicks={false}
      styles={{
        options: {
          arrowColor: 'rgba(37, 37, 38, 0.97)',
          overlayColor: 'rgba(0, 0, 0, 0.72)',
          zIndex: 9999,
        },
      }}
    />
  );
}
