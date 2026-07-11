import React from 'react';
import { Trash2 } from 'lucide-react';

export const DeleteConfirmationModal = ({
    title = 'حذف کرنے کی تصدیق',
    message = 'کیا آپ واقعی یہ ریکارڈ حذف کرنا چاہتے ہیں؟',
    targetName = '',
    isDeleting = false,
    onClose,
    onConfirm,
    confirmText = 'تصدیق کریں',
    loadingText = 'حذف ہو رہا ہے...',
}) => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm" dir="rtl">
        <div className="w-full max-w-md rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-2xl">
            <div className="flex items-center justify-between gap-4">
                <div>
                    <h3 className="text-xl font-black text-[var(--color-text-main)]">{title}</h3>
                    <p className="mt-3 text-sm font-bold leading-7 text-[var(--color-text-muted)]">
                        {message}
                        {targetName ? <span className="text-rose-500"> {targetName}</span> : null}
                    </p>
                </div>
                <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-rose-500/10 text-rose-500">
                    <Trash2 size={22} />
                </div>
            </div>

            <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row">
                <button
                    type="button"
                    onClick={onClose}
                    disabled={isDeleting}
                    className="flex-1 rounded-2xl border border-[var(--color-border)] px-5 py-3 text-sm font-black text-[var(--color-text-muted)] transition-all hover:bg-[var(--color-bg)] disabled:cursor-not-allowed disabled:opacity-70"
                >
                    منسوخ
                </button>
                <button
                    type="button"
                    onClick={onConfirm}
                    disabled={isDeleting}
                    className="flex-1 rounded-2xl bg-rose-500 px-5 py-3 text-sm font-black text-white transition-all hover:bg-rose-600 disabled:cursor-not-allowed disabled:opacity-70"
                >
                    {isDeleting ? loadingText : confirmText}
                </button>
            </div>
        </div>
    </div>
);