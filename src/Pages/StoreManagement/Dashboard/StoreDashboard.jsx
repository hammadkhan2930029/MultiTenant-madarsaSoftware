import React, { useEffect, useMemo, useState } from 'react';
import { AlertCircle, Boxes, PackageSearch, ReceiptText, ShoppingCart } from 'lucide-react';
import { getStoreDashboard } from '../../../Constant/StoreApi';
import { formatAmount } from '../../../Utils/amountFormat';

const emptyDashboard = {
    totalItems: 0,
    monthlyPurchase: 0,
    monthlyExpense: 0,
};

const formatCurrency = (value) => formatAmount(value, '0', { locale: 'ur-PK', maximumFractionDigits: 0 });

export const StoreDashboard = () => {
    const [dashboard, setDashboard] = useState(emptyDashboard);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    const loadDashboard = async () => {
        setIsLoading(true);
        setError('');

        try {
            const result = await getStoreDashboard();
            setDashboard({
                totalItems: result.totalItems || 0,
                monthlyPurchase: result.monthlyPurchase || 0,
                monthlyExpense: result.monthlyExpense || 0,
            });
        } catch (loadError) {
            setError(loadError.message || 'اسٹور ڈیش بورڈ لوڈ نہیں ہو سکا۔');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadDashboard();
    }, []);

    const cards = useMemo(
        () => [
            {
                id: 'total-items',
                title: 'کل اشیاء',
                value: formatCurrency(dashboard.totalItems),
                icon: Boxes,
            },
            {
                id: 'monthly-purchase',
                title: 'ماہانہ خریداری',
                value: `روپے ${formatCurrency(dashboard.monthlyPurchase)}`,
                icon: ShoppingCart,
            },
            {
                id: 'monthly-expense',
                title: 'ماہانہ خرچ',
                value: `روپے ${formatCurrency(dashboard.monthlyExpense)}`,
                icon: ReceiptText,
            },
        ],
        [dashboard],
    );

    const isEmpty = !isLoading && !error && cards.every((card) => String(card.value).replace(/[^\d]/g, '') === '0');

    return (
        <div className="space-y-6 animate-in fade-in duration-700 p-2" dir="rtl">
            <div className="flex flex-col gap-4 rounded-[2.5rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-sm md:flex-row md:items-center md:justify-between">
                <div className="text-right">
                    <div className="mb-3 inline-flex items-center gap-2 rounded-2xl bg-emerald-500/10 px-4 py-2 text-sm font-black text-[#00d094]">
                        <PackageSearch size={18} />
                        اسٹور مینجمنٹ
                    </div>
                    <h2 className="text-2xl font-black tracking-tight text-[var(--color-text)]">اسٹور ڈیش بورڈ</h2>
                    <p className="mt-4 text-sm font-medium text-[var(--color-text-muted)]">موجودہ ماہ کی خریداری، خرچ اور اشیاء کا خلاصہ</p>
                </div>
            </div>

            {error ? (
                <div className="flex items-center gap-3 rounded-[2rem] border border-rose-500/20 bg-rose-500/10 p-5 text-sm font-black text-rose-500">
                    <AlertCircle size={20} />
                    <span>{error}</span>
                </div>
            ) : null}

            <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
                {isLoading
                    ? cards.map((card) => (
                          <div key={card.id} className="rounded-[2.5rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-sm">
                              <div className="mb-6 h-12 w-12 animate-pulse rounded-2xl bg-[var(--color-bg)]" />
                              <div className="h-4 w-28 animate-pulse rounded-full bg-[var(--color-bg)]" />
                              <div className="mt-5 h-8 w-36 animate-pulse rounded-full bg-[var(--color-bg)]" />
                          </div>
                      ))
                    : cards.map((card) => {
                          const Icon = card.icon;

                          return (
                              <div
                                  key={card.id}
                                  className="group rounded-[2.5rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-sm transition-all hover:border-[#00d094]/40 hover:shadow-md"
                              >
                                  <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-[#00d094] transition-transform group-hover:scale-105">
                                      <Icon size={24} />
                                  </div>
                                  <p className="text-sm font-black text-[var(--color-text-muted)]">{card.title}</p>
                                  <h3 className="mt-4 break-words text-3xl font-black tracking-tight text-[var(--color-text)]">{card.value}</h3>
                              </div>
                          );
                      })}
            </div>

            {isEmpty ? (
                <div className="rounded-[2.5rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-8 text-center shadow-sm">
                    <PackageSearch className="mx-auto mb-4 text-[var(--color-text-muted)]" size={32} />
                    <h3 className="text-lg font-black text-[var(--color-text)]">ابھی کوئی ریکارڈ موجود نہیں</h3>
                    <p className="mt-3 text-sm font-bold text-[var(--color-text-muted)]">اشیاء، خریداری یا خرچ شامل ہونے کے بعد خلاصہ یہاں نظر آئے گا۔</p>
                </div>
            ) : null}
        </div>
    );
};
