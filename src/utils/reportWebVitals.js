/**
 * Reports Core Web Vitals to a specified logging endpoint or the console.
 * Helpful for performance auditing and identifying bottlenecks.
 */
const reportWebVitals = (onPerfEntry) => {
  if (onPerfEntry && typeof onPerfEntry === 'function') {
    import('web-vitals').then(({ onCLS, onINP, onFCP, onLCP, onTTFB }) => {
      onCLS(onPerfEntry);
      onINP(onPerfEntry);
      onFCP(onPerfEntry);
      onLCP(onPerfEntry);
      onTTFB(onPerfEntry);
    }).catch(err => {
      console.warn("web-vitals import failed:", err);
    });
  }
};

export default reportWebVitals;
