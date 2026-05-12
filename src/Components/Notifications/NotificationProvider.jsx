import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, AlertTitle, Slide, Snackbar } from '@mui/material';
import { toUrduNotificationText } from '../../Constant/notificationUtils';
import { NotificationContext } from './useNotifier';

const SlideDown = (props) => <Slide {...props} direction="down" />;

export const NotificationProvider = ({ children }) => {
  const [notification, setNotification] = useState(null);

  const closeNotification = useCallback((_, reason) => {
    if (reason === 'clickaway') return;
    setNotification(null);
  }, []);

  const showNotification = useCallback((payload) => {
    if (!payload) return;

    const nextPayload = typeof payload === 'string' ? { message: payload } : payload;

    setNotification({
      open: true,
      severity: nextPayload.severity || nextPayload.type || 'info',
      title: toUrduNotificationText(nextPayload.title),
      message: toUrduNotificationText(nextPayload.message, 'کارروائی مکمل ہو گئی۔'),
      autoHideDuration: nextPayload.autoHideDuration || 3200,
    });
  }, []);

  const value = useMemo(
    () => ({
      showNotification,
      closeNotification,
      success: (message, title) => showNotification({ severity: 'success', message, title }),
      error: (message, title) => showNotification({ severity: 'error', message, title }),
      warning: (message, title) => showNotification({ severity: 'warning', message, title }),
      info: (message, title) => showNotification({ severity: 'info', message, title }),
    }),
    [closeNotification, showNotification],
  );

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    const originalAlert = window.alert;
    window.alert = (message) => {
      showNotification({
        severity: 'info',
        title: 'اطلاع',
        message,
      });
    };

    return () => {
      window.alert = originalAlert;
    };
  }, [showNotification]);

  return (
    <NotificationContext.Provider value={value}>
      {children}

      <Snackbar
        open={Boolean(notification?.open)}
        autoHideDuration={notification?.autoHideDuration || 3200}
        onClose={closeNotification}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        TransitionComponent={SlideDown}
      >
        <Alert
          onClose={closeNotification}
          severity={notification?.severity || 'info'}
          variant="filled"
          dir="rtl"
          sx={{
            minWidth: { xs: 'calc(100vw - 32px)', sm: 420 },
            maxWidth: 560,
            alignItems: 'flex-start',
            borderRadius: '18px',
            boxShadow: '0 24px 60px rgba(0,0,0,0.26)',
            fontFamily: 'inherit',
            '& .MuiAlert-message': {
              width: '100%',
              textAlign: 'right',
            },
            '& .MuiAlert-icon': {
              marginLeft: 1.25,
              marginRight: 0,
            },
            '& .MuiAlert-action': {
              marginRight: 'auto',
              marginLeft: 0,
              paddingTop: '2px',
            },
          }}
        >
          {notification?.title ? <AlertTitle>{notification.title}</AlertTitle> : null}
          {notification?.message}
        </Alert>
      </Snackbar>
    </NotificationContext.Provider>
  );
};
