

import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import {AppRoutes} from './Routes/Route'; 
import { NotificationProvider } from './Components/Notifications/NotificationProvider';

export const App = () => {
  return (
    <NotificationProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </NotificationProvider>
  );
}
