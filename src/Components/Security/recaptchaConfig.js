export const isRecaptchaEnabled = import.meta.env.VITE_RECAPTCHA_ENABLED
    ? import.meta.env.VITE_RECAPTCHA_ENABLED === 'true'
    : import.meta.env.PROD;

export const recaptchaSiteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY || '';
