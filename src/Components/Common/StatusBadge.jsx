const STATUS_LABELS = {
    active: 'فعال',
    inactive: 'غیر فعال',
    suspended: 'معطل',
    archived: 'محفوظ شدہ',
    pending: 'زیر التواء',
    approved: 'منظور شدہ',
    rejected: 'مسترد',
    paid: 'ادا شدہ',
    unpaid: 'غیر ادا شدہ',
    partial: 'جزوی ادا شدہ',
    overdue: 'واجب الادا',
    completed: 'مکمل',
    complete: 'مکمل',
    present: 'حاضر',
    absent: 'غیر حاضر',
    leave: 'رخصت',
    late: 'تاخیر',
    open: 'کھلا',
    closed: 'بند',
    new: 'نیا',
    good: 'درست',
    damaged: 'خراب',
};

const POSITIVE = new Set(['active', 'approved', 'paid', 'completed', 'complete', 'present', 'good']);
const NEGATIVE = new Set(['inactive', 'rejected', 'overdue', 'absent', 'suspended', 'damaged']);
const WARNING = new Set(['pending', 'unpaid', 'partial', 'leave', 'late', 'open', 'new']);

const toneClasses = (status) => {
    if (POSITIVE.has(status)) return 'border-emerald-500/30 bg-emerald-500/10 text-[var(--color-primary)]';
    if (NEGATIVE.has(status)) return 'border-rose-500/30 bg-rose-500/10 text-rose-500';
    if (WARNING.has(status)) return 'border-amber-500/30 bg-amber-500/10 text-amber-500';
    return 'border-[var(--color-primary)]/30 bg-[var(--color-primary)]/10 text-[var(--color-primary)]';
};

const StatusBadge = ({ status, label, className = '', children }) => {
    const normalizedStatus = String(status || '').trim().toLowerCase();
    const content = children ?? label ?? STATUS_LABELS[normalizedStatus] ?? status ?? '---';

    return (
        <span
            className={`inline-flex min-w-[54px] items-center justify-center gap-1 rounded-full border px-4 py-1.5 text-xs font-black whitespace-nowrap ${toneClasses(normalizedStatus)} ${className}`.trim()}
        >
            {content}
        </span>
    );
};

export default StatusBadge;
