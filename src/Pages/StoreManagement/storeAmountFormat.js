export const formatAmountInput = (value) => {
    const text = String(value ?? '');
    if (!text.trim()) return '';

    const normalized = text.replace(/,/g, '').replace(/[^\d.]/g, '');
    const dotIndex = normalized.indexOf('.');
    const integerPart = (dotIndex >= 0 ? normalized.slice(0, dotIndex) : normalized).replace(/\D/g, '');
    const decimalPart = dotIndex >= 0 ? normalized.slice(dotIndex + 1).replace(/\./g, '').replace(/\D/g, '').slice(0, 2) : null;
    const groupedInteger = (integerPart || '0').replace(/^0+(?=\d)/, '').replace(/\B(?=(\d{3})+(?!\d))/g, ',');

    return decimalPart === null ? groupedInteger : `${groupedInteger}.${decimalPart}`;
};

export const parseAmountInput = (value) => {
    const rawValue = String(value ?? '').replace(/,/g, '').replace(/[^\d.]/g, '');
    const parsed = Number(rawValue);
    return Number.isFinite(parsed) ? parsed : 0;
};

