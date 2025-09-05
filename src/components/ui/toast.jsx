import React from 'react';

export function ToastProvider({ children }) {
  return <div className="toast-provider">{children}</div>;
}

export function Toast({ children, ...props }) {
  return (
    <div className="toast bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg border" {...props}>
      {children}
    </div>
  );
}

export function ToastTitle({ children }) {
  return <div className="toast-title font-semibold text-gray-900 dark:text-gray-100">{children}</div>;
}

export function ToastDescription({ children }) {
  return <div className="toast-description text-gray-600 dark:text-gray-300 text-sm mt-1">{children}</div>;
}

export function ToastClose() {
  return (
    <button className="toast-close absolute top-2 right-2 text-gray-400 hover:text-gray-600">
      ×
    </button>
  );
}

export function ToastViewport() {
  return <div className="toast-viewport fixed top-4 right-4 z-50 flex flex-col gap-2" />;
}