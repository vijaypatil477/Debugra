import toast from 'react-hot-toast';

const TOAST_ID = 'rate-limit';

export function showRateLimitToast(message, seconds) {
  toast.dismiss(TOAST_ID);
  let remaining = Math.max(1, seconds);
  toast.error(`${message} Retry in ${remaining}s.`, { id: TOAST_ID, duration: Infinity });
  const interval = setInterval(() => {
    remaining -= 1;
    if (remaining <= 0) {
      clearInterval(interval);
      toast.dismiss(TOAST_ID);
    } else {
      toast.error(`${message} Retry in ${remaining}s.`, { id: TOAST_ID, duration: Infinity });
    }
  }, 1000);
}
