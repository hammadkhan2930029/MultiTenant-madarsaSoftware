export const formatAmount = (value, fallback = '0', options = {}) => {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;

  return new Intl.NumberFormat(options.locale || 'en-US', {
    minimumFractionDigits: options.minimumFractionDigits ?? 0,
    maximumFractionDigits: options.maximumFractionDigits ?? 2,
  }).format(number);
};

export const formatCurrencyAmount = (value, fallback = 'PKR 0', options = {}) => {
  const amount = formatAmount(value, null, options);
  if (amount === null) return fallback;
  return `${options.currencyLabel || 'PKR'} ${amount}`;
};
