import React, { createContext, useContext, useReducer, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';

const ToastContext = createContext();
const ToastDispatchContext = createContext();

const toastReducer = (state, action) => {
  switch (action.type) {
    case 'ADD_TOAST':
      return [...state, { ...action.toast, id: uuidv4() }];
    case 'REMOVE_TOAST':
      return state.filter(t => t.id !== action.id);
    default:
      throw new Error(`Unhandled action type: ${action.type}`);
  }
};

export function ToastProvider({ children }) {
  const [state, dispatch] = useReducer(toastReducer, []);

  return (
    <ToastContext.Provider value={state}>
      <ToastDispatchContext.Provider value={dispatch}>
        {children}
      </ToastDispatchContext.Provider>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const toasts = useContext(ToastContext);
  const dispatch = useContext(ToastDispatchContext);
  
  if (dispatch === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }

  const toast = useCallback(({ title, description, variant, duration = 5000 }) => {
    const id = uuidv4();
    dispatch({
      type: 'ADD_TOAST',
      toast: { id, title, description, variant, duration },
    });

    if (duration) {
      setTimeout(() => {
        dispatch({ type: 'REMOVE_TOAST', id });
      }, duration);
    }
  }, [dispatch]);

  const dismiss = (id) => {
    dispatch({ type: 'REMOVE_TOAST', id });
  };
  
  return { toasts, toast, dismiss };
}
