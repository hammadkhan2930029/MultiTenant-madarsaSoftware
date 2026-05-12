import { createContext, useContext } from 'react';

export const NotificationContext = createContext(null);

export const useNotifier = () => {
  const context = useContext(NotificationContext);

  if (!context) {
    throw new Error('NotificationProvider ke andar useNotifier use karein.');
  }

  return context;
};
