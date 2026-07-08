import toast from 'react-hot-toast';

const activeToasts = new Map();

export function showToast(message, { type = 'success', duration, id } = {}) {
  const key = id || message;
  if (activeToasts.has(key)) return activeToasts.get(key);
  const toastId = toast[type](message, {
    id: key,
    duration: duration || 3000,
  });
  activeToasts.set(key, toastId);
  const originalDuration = duration || 3000;
  setTimeout(() => activeToasts.delete(key), originalDuration + 100);
  return toastId;
}
