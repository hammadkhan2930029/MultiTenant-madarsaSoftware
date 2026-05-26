import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
    ArrowDownCircle,
    ArrowUpCircle,
    BadgeDollarSign,
    Download,
    FileSpreadsheet,
    FileText,
    Landmark,
    Search,
    Wallet,
    X,
} from 'lucide-react';
import { getFinancialRecords } from '../../../Constant/FinancialApi';
import { DateField } from '../../../Components/HR/FormElements';

const PAGE_SIZE = 8;
const MotionDiv = motion.div;

const text = {
    title: '\u0645\u0627\u0644\u06cc\u0627\u062a\u06cc \u06af\u0648\u0634\u0648\u0627\u0631\u06c1',
    subtitle: '\u0622\u0645\u062f\u0646\u060c \u062e\u0631\u0686\u060c \u0628\u0642\u0627\u06cc\u0627 \u0631\u0642\u0645 \u0627\u0648\u0631 \u062a\u0645\u0627\u0645 \u0645\u0627\u0644\u06cc\u0627\u062a\u06cc \u0644\u06cc\u0646 \u062f\u06cc\u0646 \u06a9\u0627 \u062e\u0644\u0627\u0635\u06c1',
    exportExcel: '\u0627\u06cc\u06a9\u0633\u0644 \u0628\u0631\u0622\u0645\u062f \u06a9\u0631\u06cc\u06ba',
    exportPdf: '\u067e\u06cc \u0688\u06cc \u0627\u06cc\u0641 \u0628\u0631\u0622\u0645\u062f \u06a9\u0631\u06cc\u06ba',
    totalIncome: '\u06a9\u0644 \u0622\u0645\u062f\u0646',
    totalExpense: '\u06a9\u0644 \u062e\u0631\u0686',
    balance: '\u0628\u0642\u0627\u06cc\u0627 \u0631\u0642\u0645',
    totalTransactions: '\u06a9\u0644 \u0644\u06cc\u0646 \u062f\u06cc\u0646',
    startDate: '\u0634\u0631\u0648\u0639 \u062a\u0627\u0631\u06cc\u062e',
    endDate: '\u0627\u062e\u062a\u062a\u0627\u0645\u06cc \u062a\u0627\u0631\u06cc\u062e',
    type: '\u0642\u0633\u0645',
    duration: '\u0645\u062f\u062a',
    search: '\u062a\u0644\u0627\u0634',
    all: '\u062a\u0645\u0627\u0645',
    allTypes: '\u062a\u0645\u0627\u0645 \u0627\u0642\u0633\u0627\u0645',
    income: '\u0622\u0645\u062f\u0646',
    expense: '\u062e\u0631\u0686',
    allDuration: '\u062a\u0645\u0627\u0645 \u0645\u062f\u062a',
    daily: '\u0631\u0648\u0632\u0627\u0646\u06c1',
    weekly: '\u06c1\u0641\u062a\u06c1 \u0648\u0627\u0631',
    monthly: '\u0645\u0627\u06c1\u0627\u0646\u06c1',
    yearly: '\u0633\u0627\u0644\u0627\u0646\u06c1',
    searchPlaceholder: '\u0645\u062f\u060c \u062a\u0641\u0635\u06cc\u0644 \u06cc\u0627 \u0631\u0642\u0645 \u062a\u0644\u0627\u0634 \u06a9\u0631\u06cc\u06ba...',
    listTitle: '\u0644\u06cc\u0646 \u062f\u06cc\u0646 \u06a9\u06cc \u0641\u06c1\u0631\u0633\u062a',
    listSubtitle: '\u0645\u0646\u062a\u062e\u0628 \u0641\u0644\u0679\u0631\u0632 \u06a9\u06d2 \u0645\u0637\u0627\u0628\u0642 \u0631\u06cc\u06a9\u0627\u0631\u0688',
    clear: '\u0635\u0627\u0641',
    date: '\u062a\u0627\u0631\u06cc\u062e',
    category: '\u0645\u062f',
    description: '\u062a\u0641\u0635\u06cc\u0644',
    amount: '\u0631\u0642\u0645',
    loading: '\u0631\u06cc\u06a9\u0627\u0631\u0688 \u0644\u0648\u0688 \u06c1\u0648 \u0631\u06c1\u0627 \u06c1\u06d2...',
    noRecord: '\u06a9\u0648\u0626\u06cc \u0631\u06cc\u06a9\u0627\u0631\u0688 \u0645\u0648\u062c\u0648\u062f \u0646\u06c1\u06cc\u06ba',
    tryAgain: '\u0641\u0644\u0679\u0631 \u062a\u0628\u062f\u06cc\u0644 \u06a9\u0631 \u06a9\u06d2 \u062f\u0648\u0628\u0627\u0631\u06c1 \u06a9\u0648\u0634\u0634 \u06a9\u0631\u06cc\u06ba\u06d4',
    clearFilters: '\u0641\u0644\u0679\u0631 \u0635\u0627\u0641 \u06a9\u0631\u06cc\u06ba',
    page: '\u0635\u0641\u062d\u06c1',
    of: '\u0627\u0632',
    previous: '\u067e\u0686\u06be\u0644\u0627',
    next: '\u0627\u06af\u0644\u0627',
    loadError: '\u0645\u0627\u0644\u06cc\u0627\u062a\u06cc \u0631\u06cc\u06a9\u0627\u0631\u0688 \u0644\u0648\u0688 \u0646\u06c1\u06cc\u06ba \u06c1\u0648 \u0633\u06a9\u0627\u06d4',
};

const formatAmount = (value) => Number(value || 0).toLocaleString('en-US');
const formatDate = (value) => (value ? new Date(value).toLocaleDateString('ur-PK') : '---');
const getFieldValue = (valueOrEvent) => valueOrEvent?.target?.value ?? valueOrEvent ?? '';

export const FinancialStatement = () => {
    const [filters, setFilters] = useState({
        fromDate: '',
        toDate: '',
        type: 'all',
        duration: 'all',
        search: '',
    });
    const [tableFilters, setTableFilters] = useState({
        date: '',
        type: 'all',
        category: '',
        description: '',
        amount: '',
    });
    const [page, setPage] = useState(1);
    const [records, setRecords] = useState([]);
    const [summary, setSummary] = useState({
        totalAmdan: 0,
        totalKharch: 0,
        remainingBalance: 0,
        totalTransactions: 0,
    });
    const [meta, setMeta] = useState({ currentPage: 1, totalPages: 1, totalItems: 0, perPage: PAGE_SIZE });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const queryString = useMemo(() => {
        const params = new URLSearchParams();
        params.set('page', String(page));
        params.set('limit', String(PAGE_SIZE));
        const effectiveFilters = {
            ...filters,
            fromDate: tableFilters.date || filters.fromDate,
            toDate: tableFilters.date || filters.toDate,
            type: tableFilters.type !== 'all' ? tableFilters.type : filters.type,
        };
        Object.entries(effectiveFilters).forEach(([key, value]) => {
            if (value && value !== 'all') params.set(key, value);
        });
        return params.toString();
    }, [filters, page, tableFilters.date, tableFilters.type]);

    const visibleRecords = useMemo(() => {
        const category = tableFilters.category.trim().toLowerCase();
        const description = tableFilters.description.trim().toLowerCase();
        const amount = tableFilters.amount.trim();

        return records.filter((entry) => {
            const categoryOk = !category || String(entry.category || '').toLowerCase().includes(category);
            const descriptionOk = !description || String(entry.description || '').toLowerCase().includes(description);
            const amountOk = !amount || String(entry.amount || '').includes(amount);
            return categoryOk && descriptionOk && amountOk;
        });
    }, [records, tableFilters.amount, tableFilters.category, tableFilters.description]);

    useEffect(() => {
        let isMounted = true;
        queueMicrotask(() => setLoading(true));
        queueMicrotask(() => setError(''));

        getFinancialRecords(queryString)
            .then((data) => {
                if (!isMounted) return;
                setRecords(data.items || []);
                setSummary(data.summary || { totalAmdan: 0, totalKharch: 0, remainingBalance: 0, totalTransactions: 0 });
                setMeta(data.meta || { currentPage: page, totalPages: 1, totalItems: 0, perPage: PAGE_SIZE });
            })
            .catch((err) => {
                if (!isMounted) return;
                setRecords([]);
                setError(err?.message || text.loadError);
            })
            .finally(() => {
                if (isMounted) setLoading(false);
            });

        return () => {
            isMounted = false;
        };
    }, [queryString, page]);

    const updateFilter = (field, value) => {
        setFilters((prev) => ({ ...prev, [field]: value }));
        setPage(1);
    };

    const updateTableFilter = (field, value) => {
        setTableFilters((prev) => ({ ...prev, [field]: value }));
        setPage(1);
    };

    const clearTableFilters = () => {
        setTableFilters({
            date: '',
            type: 'all',
            category: '',
            description: '',
            amount: '',
        });
        setPage(1);
    };

    const exportCsv = () => {
        const header = [text.date, text.type, text.category, text.description, text.amount];
        const rows = visibleRecords.map((entry) => [
            formatDate(entry.date),
            entry.type === 'amdan' ? text.income : text.expense,
            entry.category,
            entry.description,
            entry.amount,
        ]);
        const csv = [header, ...rows].map((row) => row.map((cell) => `"${String(cell || '').replace(/"/g, '""')}"`).join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `maliyati-goshwara-${new Date().toISOString().slice(0, 10)}.csv`;
        link.click();
        URL.revokeObjectURL(url);
    };

    const exportPdf = () => {
        window.print();
    };

    return (
        <div className="min-h-screen bg-[var(--color-bg)] p-3 md:p-6 text-[var(--color-text-main)] font-urdu" dir="rtl">
            <div className="mx-auto max-w-7xl space-y-6">
                <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-black text-[var(--color-primary)]">{text.title}</h1>
                        <p className="mt-2 text-sm font-bold text-[var(--color-text-muted)]">{text.subtitle}</p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2">
                        <button type="button" onClick={exportCsv} className="flex items-center justify-center gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-sm font-black transition-all hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]">
                            <FileSpreadsheet size={18} />
                            {text.exportExcel}
                        </button>
                        <button type="button" onClick={exportPdf} className="flex items-center justify-center gap-2 rounded-xl bg-[var(--color-primary)] px-4 py-3 text-sm font-black text-[#0b1120] transition-all hover:bg-[var(--color-primary-hover)]">
                            <Download size={18} />
                            {text.exportPdf}
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                    <SummaryCard icon={<ArrowUpCircle size={24} />} label={text.totalIncome} value={`${formatAmount(summary.totalAmdan)}/-`} tone="income" delay={0.05} />
                    <SummaryCard icon={<ArrowDownCircle size={24} />} label={text.totalExpense} value={`${formatAmount(summary.totalKharch)}/-`} tone="expense" delay={0.1} />
                    <SummaryCard icon={<Wallet size={24} />} label={text.balance} value={`${formatAmount(summary.remainingBalance)}/-`} tone={summary.remainingBalance >= 0 ? 'income' : 'expense'} delay={0.15} />
                    <SummaryCard icon={<BadgeDollarSign size={24} />} label={text.totalTransactions} value={formatAmount(summary.totalTransactions)} tone="neutral" delay={0.2} />
                </div>

                <MotionDiv
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35 }}
                    className="rounded-[1.5rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 md:p-5 shadow-xl"
                >
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-6 gap-3 flex items-center">
                        <DateField
                            label={text.startDate}
                            value={filters.fromDate}
                            onChange={(nextValue) => updateFilter('fromDate', getFieldValue(nextValue))}
                            max={filters.toDate || undefined}
                            size="sm"
                            className="[&_button]:h-[52px]"
                        />
                        <DateField
                            label={text.endDate}
                            value={filters.toDate}
                            onChange={(nextValue) => updateFilter('toDate', getFieldValue(nextValue))}
                            min={filters.fromDate || undefined}
                            size="sm"
                            className="[&_button]:h-[52px]"
                        />
                        <FilterSelect label={text.type} value={filters.type} onChange={(value) => updateFilter('type', value)}>
                            <option value="all">{text.all}</option>
                            <option value="amdan">{text.income}</option>
                            <option value="kharch">{text.expense}</option>
                        </FilterSelect>
                        <FilterSelect label={text.duration} value={filters.duration} onChange={(value) => updateFilter('duration', value)}>
                            <option value="all">{text.allDuration}</option>
                            <option value="daily">{text.daily}</option>
                            <option value="weekly">{text.weekly}</option>
                            <option value="monthly">{text.monthly}</option>
                            <option value="yearly">{text.yearly}</option>
                        </FilterSelect>
                        <div className="relative xl:col-span-2">
                            <label className="mb-2 mr-2 block text-[11px] font-black text-[var(--color-text-muted)]">{text.search}</label>
                            <Search size={16} className="absolute right-4 top-[45px] text-[var(--color-text-muted)]" />
                            <input
                                value={filters.search}
                                onChange={(event) => updateFilter('search', event.target.value)}
                                className="h-[52px] w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-input)] pr-10 pl-4 text-sm font-bold outline-none transition-all focus:border-[var(--color-primary)]"
                                placeholder={text.searchPlaceholder}
                            />
                        </div>
                    </div>
                </MotionDiv>

                <MotionDiv
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    className="overflow-hidden rounded-[1.5rem] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-xl"
                >
                    <div className="flex items-center justify-between border-b border-[var(--color-border)] p-4">
                        <div>
                            <h2 className="text-lg font-black">{text.listTitle}</h2>
                            <p className="mt-5 text-xs font-bold text-[var(--color-text-muted)]">{text.listSubtitle}</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={clearTableFilters}
                                className="hidden items-center gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-xs font-black text-[var(--color-text-muted)] transition-all hover:border-rose-500/50 hover:text-rose-400 md:flex"
                            >
                                <X size={14} />
                                {text.clear}
                            </button>
                            <Landmark className="text-[var(--color-primary)]" size={22} />
                        </div>
                    </div>

                    {error ? <div className="m-4 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-sm font-bold text-rose-400">{error}</div> : null}

                    <div className="hidden md:block max-h-[560px] overflow-auto">
                        <table className="w-full min-w-[820px] text-right">
                            <thead className="sticky top-0 z-10 bg-[var(--color-bg)] text-[11px] text-[var(--color-text-muted)]">
                                <tr>
                                    <th className="p-4">{text.date}</th>
                                    <th className="p-4">{text.type}</th>
                                    <th className="p-4">{text.category}</th>
                                    <th className="p-4">{text.description}</th>
                                    <th className="p-4">{text.amount}</th>
                                </tr>
                                <tr className="border-t border-[var(--color-border)] bg-[var(--color-surface)]">
                                    <th className="p-2">
                                        <DateField
                                            value={tableFilters.date}
                                            onChange={(nextValue) => updateTableFilter('date', getFieldValue(nextValue))}
                                            placeholder={text.date}
                                            size="sm"
                                            className="[&_button]:h-[42px] [&_button]:rounded-xl [&_button]:text-[11px]"
                                        />
                                    </th>
                                    <th className="p-2">
                                        <select
                                            value={tableFilters.type}
                                            onChange={(event) => updateTableFilter('type', event.target.value)}
                                            className="h-[42px] w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-input)] px-3 text-[11px] font-black outline-none transition-all focus:border-[var(--color-primary)]"
                                        >
                                            <option value="all">{text.all}</option>
                                            <option value="amdan">{text.income}</option>
                                            <option value="kharch">{text.expense}</option>
                                        </select>
                                    </th>
                                    <th className="p-2">
                                        <input
                                            value={tableFilters.category}
                                            onChange={(event) => updateTableFilter('category', event.target.value)}
                                            className="h-[42px] w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-input)] px-3 text-[11px] font-black outline-none transition-all focus:border-[var(--color-primary)]"
                                            placeholder={text.category}
                                        />
                                    </th>
                                    <th className="p-2">
                                        <input
                                            value={tableFilters.description}
                                            onChange={(event) => updateTableFilter('description', event.target.value)}
                                            className="h-[42px] w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-input)] px-3 text-[11px] font-black outline-none transition-all focus:border-[var(--color-primary)]"
                                            placeholder={text.description}
                                        />
                                    </th>
                                    <th className="p-2">
                                        <input
                                            value={tableFilters.amount}
                                            onChange={(event) => updateTableFilter('amount', event.target.value)}
                                            className="h-[42px] w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-input)] px-3 text-[11px] font-black outline-none transition-all focus:border-[var(--color-primary)]"
                                            placeholder={text.amount}
                                        />
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr>
                                        <td colSpan={5} className="p-6 text-center text-sm font-bold text-[var(--color-text-muted)]">{text.loading}</td>
                                    </tr>
                                ) : visibleRecords.length ? visibleRecords.map((entry) => (
                                    <tr key={entry.id} className="border-t border-[var(--color-border)] transition-colors hover:bg-[var(--color-bg)]/50">
                                        <td className="p-4 text-xs font-mono">{formatDate(entry.date)}</td>
                                        <td className="p-4">
                                            <TypeBadge type={entry.type} />
                                        </td>
                                        <td className="p-4 font-black">{entry.category}</td>
                                        <td className="p-4 text-sm text-[var(--color-text-muted)]">{entry.description || '---'}</td>
                                        <td className={`p-4 font-black ${entry.type === 'amdan' ? 'text-emerald-500' : 'text-rose-500'}`}>
                                            {entry.type === 'amdan' ? '+' : '-'}{formatAmount(entry.amount)}/-
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan={5}>
                                            <EmptyState />
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="grid gap-3 border-b border-[var(--color-border)] p-4 md:hidden">
                        <DateField
                            value={tableFilters.date}
                            onChange={(nextValue) => updateTableFilter('date', getFieldValue(nextValue))}
                            placeholder={text.date}
                            size="sm"
                            className="[&_button]:h-[46px]"
                        />
                        <div className="grid grid-cols-2 gap-3">
                            <select
                                value={tableFilters.type}
                                onChange={(event) => updateTableFilter('type', event.target.value)}
                                className="h-[46px] rounded-xl border border-[var(--color-border)] bg-[var(--color-input)] px-3 text-xs font-black outline-none"
                            >
                                <option value="all">{text.allTypes}</option>
                                <option value="amdan">{text.income}</option>
                                <option value="kharch">{text.expense}</option>
                            </select>
                            <input
                                value={tableFilters.amount}
                                onChange={(event) => updateTableFilter('amount', event.target.value)}
                                className="h-[46px] rounded-xl border border-[var(--color-border)] bg-[var(--color-input)] px-3 text-xs font-black outline-none"
                                placeholder={text.amount}
                            />
                        </div>
                        <input
                            value={tableFilters.category}
                            onChange={(event) => updateTableFilter('category', event.target.value)}
                            className="h-[46px] rounded-xl border border-[var(--color-border)] bg-[var(--color-input)] px-3 text-xs font-black outline-none"
                            placeholder={text.category}
                        />
                        <input
                            value={tableFilters.description}
                            onChange={(event) => updateTableFilter('description', event.target.value)}
                            className="h-[46px] rounded-xl border border-[var(--color-border)] bg-[var(--color-input)] px-3 text-xs font-black outline-none"
                            placeholder={text.description}
                        />
                        <button
                            type="button"
                            onClick={clearTableFilters}
                            className="flex h-[44px] items-center justify-center gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] text-xs font-black text-[var(--color-text-muted)]"
                        >
                            <X size={14} />
                            {text.clearFilters}
                        </button>
                    </div>

                    <div className="md:hidden divide-y divide-[var(--color-border)]">
                        {loading ? (
                            <div className="p-6 text-center text-sm font-bold text-[var(--color-text-muted)]">{text.loading}</div>
                        ) : visibleRecords.length ? visibleRecords.map((entry) => (
                            <div key={entry.id} className="p-4">
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <p className="font-black">{entry.category}</p>
                                        <p className="mt-1 text-xs font-bold text-[var(--color-text-muted)]">{entry.description || '---'}</p>
                                    </div>
                                    <TypeBadge type={entry.type} />
                                </div>
                                <div className="mt-4 flex items-center justify-between">
                                    <span className="text-xs font-mono text-[var(--color-text-muted)]">{formatDate(entry.date)}</span>
                                    <span className={`text-lg font-black ${entry.type === 'amdan' ? 'text-emerald-500' : 'text-rose-500'}`}>
                                        {entry.type === 'amdan' ? '+' : '-'}{formatAmount(entry.amount)}/-
                                    </span>
                                </div>
                            </div>
                        )) : <EmptyState />}
                    </div>

                    <div className="flex flex-col gap-3 border-t border-[var(--color-border)] px-4 py-3 md:flex-row md:items-center md:justify-between">
                        <p className="text-xs font-bold text-[var(--color-text-muted)]">{text.page} {meta.currentPage || page} {text.of} {meta.totalPages || 1}</p>
                        <div className="flex gap-2">
                            <button type="button" disabled={page <= 1 || loading} onClick={() => setPage((prev) => Math.max(1, prev - 1))} className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-2 text-xs font-black disabled:opacity-40">
                                {text.previous}
                            </button>
                            <button type="button" disabled={page >= (meta.totalPages || 1) || loading} onClick={() => setPage((prev) => Math.min(meta.totalPages || 1, prev + 1))} className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-2 text-xs font-black disabled:opacity-40">
                                {text.next}
                            </button>
                        </div>
                    </div>
                </MotionDiv>
            </div>
        </div>
    );
};

const SummaryCard = ({ icon, label, value, tone, delay }) => {
    const toneClass = tone === 'expense'
        ? 'text-rose-500 bg-rose-500/10'
        : tone === 'income'
            ? 'text-emerald-500 bg-emerald-500/10'
            : 'text-sky-500 bg-sky-500/10';

    return (
        <MotionDiv
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -4, scale: 1.01 }}
            transition={{ duration: 0.35, delay }}
            className="rounded-[1.2rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-xl"
        >
            <div className="flex items-center justify-between gap-4">
                <div>
                    <p className="text-xs font-black text-[var(--color-text-muted)]">{label}</p>
                    <p className="mt-3 text-2xl font-black">{value}</p>
                </div>
                <div className={`rounded-xl p-3 ${toneClass}`}>
                    {icon}
                </div>
            </div>
        </MotionDiv>
    );
};

const FilterSelect = ({ label, value, onChange, children }) => (
    <div>
        <label className="mb-2 mr-2 block text-[11px] font-black text-[var(--color-text-muted)]">{label}</label>
        <select
            value={value}
            onChange={(event) => onChange(event.target.value)}
            className="h-[52px] w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-input)] px-4 text-sm font-bold outline-none transition-all focus:border-[var(--color-primary)]"
        >
            {children}
        </select>
    </div>
);

const TypeBadge = ({ type }) => (
    <span className={`inline-flex rounded-full px-3 py-1 text-[10px] font-black ${type === 'amdan' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
        {type === 'amdan' ? text.income : text.expense}
    </span>
);

const EmptyState = () => (
    <div className="flex flex-col items-center justify-center px-4 py-14 text-center">
        <div className="rounded-2xl bg-[var(--color-bg)] p-4 text-[var(--color-primary)]">
            <FileText size={28} />
        </div>
        <h3 className="mt-4 text-lg font-black">{text.noRecord}</h3>
        <p className="mt-2 max-w-sm text-sm font-bold text-[var(--color-text-muted)]">{text.tryAgain}</p>
    </div>
);
