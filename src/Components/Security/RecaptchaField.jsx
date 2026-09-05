import React from 'react';
import { isRecaptchaEnabled, recaptchaSiteKey } from './recaptchaConfig';

const SCRIPT_ID = 'google-recaptcha-script';
let scriptPromise;

const loadRecaptcha = () => {
    if (window.grecaptcha?.render) return Promise.resolve(window.grecaptcha);
    if (scriptPromise) return scriptPromise;

    scriptPromise = new Promise((resolve, reject) => {
        const loaded = () => window.grecaptcha?.render
            ? resolve(window.grecaptcha)
            : reject(new Error('Google reCAPTCHA load nahi ho saka.'));
        const failed = () => reject(new Error('Google reCAPTCHA load nahi ho saka.'));
        const existing = document.getElementById(SCRIPT_ID);
        if (existing) {
            existing.addEventListener('load', loaded, { once: true });
            existing.addEventListener('error', failed, { once: true });
            return;
        }

        const script = document.createElement('script');
        script.id = SCRIPT_ID;
        script.src = 'https://www.google.com/recaptcha/api.js?render=explicit&hl=ur';
        script.async = true;
        script.defer = true;
        script.addEventListener('load', loaded, { once: true });
        script.addEventListener('error', failed, { once: true });
        document.head.appendChild(script);
    }).catch((error) => {
        scriptPromise = undefined;
        throw error;
    });

    return scriptPromise;
};

export const RecaptchaField = ({ onChange, onError, resetSignal = 0 }) => {
    const containerRef = React.useRef(null);
    const widgetIdRef = React.useRef(null);

    React.useEffect(() => {
        if (!isRecaptchaEnabled) return undefined;
        if (!recaptchaSiteKey) {
            onError('reCAPTCHA configure nahi hai. Administrator se rabta karein.');
            return undefined;
        }

        let cancelled = false;
        loadRecaptcha().then((grecaptcha) => {
            if (cancelled || !containerRef.current || widgetIdRef.current !== null) return;
            widgetIdRef.current = grecaptcha.render(containerRef.current, {
                sitekey: recaptchaSiteKey,
                theme: 'dark',
                callback: onChange,
                'expired-callback': () => onChange(''),
                'error-callback': () => {
                    onChange('');
                    onError('reCAPTCHA verify nahi ho saka. Dobara koshish karein.');
                },
            });
        }).catch((error) => onError(error.message));

        return () => { cancelled = true; };
    }, [onChange, onError]);

    React.useEffect(() => {
        if (resetSignal > 0 && widgetIdRef.current !== null && window.grecaptcha?.reset) {
            window.grecaptcha.reset(widgetIdRef.current);
            onChange('');
        }
    }, [resetSignal, onChange]);

    if (!isRecaptchaEnabled) return null;
    return <div className="w-full overflow-x-auto" dir="ltr"><div ref={containerRef} className="mx-auto w-fit" /></div>;
};
