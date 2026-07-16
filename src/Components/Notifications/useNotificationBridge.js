import { useEffect, useRef } from 'react';
import { useNotifier } from './useNotifier';

export const useNotificationBridge = ({ error, success, info, warning }) => {
  const notify = useNotifier();
  const previous = useRef({
    error: '',
    success: '',
    info: '',
    warning: '',
  });

  useEffect(() => {
    if (error && previous.current.error !== error) {
      notify.showNotification({ severity: 'error', message: error, autoHideDuration: null });
      previous.current.error = error;
    }
    if (!error && previous.current.error) {
      previous.current.error = '';
      notify.closeNotification();
    }
  }, [error, notify]);

  useEffect(() => {
    if (success && previous.current.success !== success) {
      notify.success(success);
      previous.current.success = success;
    }
    if (!success) previous.current.success = '';
  }, [success, notify]);

  useEffect(() => {
    if (info && previous.current.info !== info) {
      notify.info(info);
      previous.current.info = info;
    }
    if (!info) previous.current.info = '';
  }, [info, notify]);

  useEffect(() => {
    if (warning && previous.current.warning !== warning) {
      notify.warning(warning);
      previous.current.warning = warning;
    }
    if (!warning) previous.current.warning = '';
  }, [warning, notify]);
};
