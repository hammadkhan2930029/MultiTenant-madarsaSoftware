import React from 'react';

export const PaginationControls = ({ meta, page, onPageChange, disabled = false }) => {
    const currentPage = Number(meta?.currentPage || page || 1);
    const totalPages = Math.max(1, Number(meta?.totalPages || 1));

    if (totalPages <= 1) return null;

    return (
        <div className="flex flex-col gap-3 border-t border-[var(--color-border)] px-5 py-4 text-sm font-bold text-[var(--color-text-muted)] sm:flex-row sm:items-center sm:justify-between" dir="rtl">
            <span>صفحہ {currentPage} از {totalPages}</span>
            <div className="flex gap-2">
                <button type="button" disabled={disabled || currentPage <= 1} onClick={() => onPageChange(currentPage - 1)} className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-2 transition-colors hover:border-[var(--color-primary)] disabled:cursor-not-allowed disabled:opacity-40">
                    پچھلا
                </button>
                <button type="button" disabled={disabled || currentPage >= totalPages} onClick={() => onPageChange(currentPage + 1)} className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-2 transition-colors hover:border-[var(--color-primary)] disabled:cursor-not-allowed disabled:opacity-40">
                    اگلا
                </button>
            </div>
        </div>
    );
};
