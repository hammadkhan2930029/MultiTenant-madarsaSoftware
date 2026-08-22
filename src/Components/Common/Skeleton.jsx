import React from 'react';

const joinClasses = (...classes) => classes.filter(Boolean).join(' ');

export const Skeleton = ({ className = '', ...props }) => (
    <div
        aria-hidden="true"
        className={joinClasses(
            'animate-pulse rounded-2xl bg-[var(--color-surface)]/70',
            className,
        )}
        {...props}
    />
);

export const FormSkeleton = ({ sections = 3, fieldsPerSection = 6, className = '' }) => (
    <div
        className={joinClasses('space-y-8', className)}
        role="status"
        aria-label="معلومات لوڈ ہو رہی ہیں"
        aria-live="polite"
    >
        <span className="sr-only">معلومات لوڈ ہو رہی ہیں...</span>
        {Array.from({ length: sections }, (_, sectionIndex) => (
            <div
                key={sectionIndex}
                className="rounded-[2.5rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 md:p-8"
            >
                <Skeleton className="mb-7 h-8 w-48 bg-[var(--color-bg)]" />
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {Array.from({ length: fieldsPerSection }, (_, fieldIndex) => (
                        <div key={fieldIndex} className="space-y-3">
                            <Skeleton className="mr-auto h-4 w-28 bg-[var(--color-bg)]" />
                            <Skeleton className="h-16 w-full bg-[var(--color-bg)]" />
                        </div>
                    ))}
                </div>
            </div>
        ))}
    </div>
);

export const TableSkeleton = ({ rows = 5, columns = 4, className = '' }) => (
    <div
        className={joinClasses(
            'overflow-hidden rounded-[2.5rem] border border-[var(--color-border)] bg-[var(--color-surface)]',
            className,
        )}
        role="status"
        aria-label="فہرست لوڈ ہو رہی ہے"
        aria-live="polite"
    >
        <span className="sr-only">فہرست لوڈ ہو رہی ہے...</span>
        {Array.from({ length: rows }, (_, rowIndex) => (
            <div
                key={rowIndex}
                className="grid gap-4 border-b border-[var(--color-border)]/60 p-5 last:border-b-0"
                style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
            >
                {Array.from({ length: columns }, (_, columnIndex) => (
                    <Skeleton key={columnIndex} className="h-6 w-full bg-[var(--color-bg)]" />
                ))}
            </div>
        ))}
    </div>
);

export const CardGridSkeleton = ({ cards = 3, className = '' }) => (
    <div className={joinClasses('grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3', className)} role="status" aria-label="ریکارڈ لوڈ ہو رہا ہے" aria-live="polite">
        <span className="sr-only">ریکارڈ لوڈ ہو رہا ہے...</span>
        {Array.from({ length: cards }, (_, index) => (
            <div key={index} className="rounded-[2.5rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
                <Skeleton className="mb-6 h-12 w-12 bg-[var(--color-bg)]" />
                <Skeleton className="h-4 w-28 bg-[var(--color-bg)]" />
                <Skeleton className="mt-5 h-8 w-36 bg-[var(--color-bg)]" />
            </div>
        ))}
    </div>
);
