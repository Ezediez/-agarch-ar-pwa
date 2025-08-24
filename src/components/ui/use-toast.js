import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const TOAST_LIMIT = 3;

let count = 0;
function generateId() {
  count = (count + 1) % Number.MAX_VALUE;
  return count.toString();
}

const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const toast = useCallback((props) => {
    const id = generateId();

    const dismiss = () => {
      setToasts((prevToasts) => prevToasts.filter((t) => t.id !== id));
    };

    setToasts((prevToasts) => {
      const newToast = { ...props, id, dismiss };
      return [newToast, ...prevToasts].slice(0, TOAST_LIMIT);
    });

    return { id, dismiss };
  }, []);

  useEffect(() => {
    const timers = toasts.map((t) => {
      if (t.duration === Infinity) return null;

      return setTimeout(() => {
        t.dismiss();
      }, t.duration || 5000);
    });

    return () => {
      timers.forEach((timer) => {
        if (timer) clearTimeout(timer);
      });
    };
  }, [toasts]);
  
  const value = {
    toasts,
    toast,
  };

  return <ToastContext.Provider value={value}>{children}</ToastContext.Provider>;
};

export function useToast() {
  const context = useContext(ToastContext);
  if (context === null) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}