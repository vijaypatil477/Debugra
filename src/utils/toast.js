import toast from 'react-hot-toast';

const lastToasts = new Map();

export function dedupToast(type, message, options = {}) {
  const key = `${type}:${message}`;
  const now = Date.now();
  const last = lastToasts.get(key);
  if (last && now - last < 2000) return;
  lastToasts.set(key, now);

  if (toast[type]) {
    toast[type](message, { duration: 3000, ...options });
  }
}

export function success(msg, opts) { return dedupToast('success', msg, opts); }
export function error(msg, opts) { return dedupToast('error', msg, opts); }
export function dismiss(id) { toast.dismiss(id); }
