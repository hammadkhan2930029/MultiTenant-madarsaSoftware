import React, { useEffect, useMemo, useState } from 'react';
import { Download, FileText, PackageCheck, Printer, Search, Wallet } from 'lucide-react';
import jsPDF from 'jspdf';
import { downloadStoreExport, getStoreItems, getStoreReport, getStoreSuppliers, openStorePrintPage } from '../../../Constant/StoreApi';
import { getStoreCategories } from '../../../Constant/StoreCategoriesApi';

const reportOptions = [
    { value: 'dailyStock', label: 'روزانہ اسٹاک رپورٹ' },
    { value: 'monthlyStock', label: 'ماہانہ اسٹاک رپورٹ' },
    { value: 'purchases', label: 'خریداری رپورٹ' },
    { value: 'suppliers', label: 'سپلائر رپورٹ' },
    { value: 'stockIssues', label: 'اسٹاک اجراء رپورٹ' },
    { value: 'departmentWise', label: 'شعبہ وار اجراء رپورٹ' },
    { value: 'lowStock', label: 'کم اسٹاک رپورٹ' },
    { value: 'damagedStock', label: 'خراب اسٹاک رپورٹ' },
    { value: 'storeValue', label: 'اسٹور مالیت رپورٹ' },
    { value: 'itemLedger', label: 'شے لیجر رپورٹ' },
];

const columnsByReport = {
    dailyStock: [
        ['itemName', 'شے'], ['category', 'کیٹیگری'], ['unit', 'اکائی'], ['currentStock', 'موجودہ اسٹاک'], ['purchasePrice', 'فی اکائی قیمت'], ['stockValue', 'مالیت'],
    ],
    monthlyStock: [
        ['monthLabel', 'مہینہ'], ['purchaseQuantity', 'خریداری'], ['issueQuantity', 'اجراء'], ['returnQuantity', 'واپسی'], ['damagedQuantity', 'خراب'],
    ],
    purchases: [
        ['purchaseDate', 'تاریخ'], ['supplierName', 'سپلائر'], ['invoiceNumber', 'انوائس'], ['totalAmount', 'کل رقم'], ['paidAmount', 'ادا شدہ'], ['remainingAmount', 'باقی'],
    ],
    suppliers: [
        ['supplierName', 'سپلائر'], ['mobileNumber', 'موبائل'], ['shopName', 'دکان'], ['totalPurchase', 'کل خریداری'], ['totalPaid', 'کل ادائیگی'], ['balance', 'بیلنس'],
    ],
    stockIssues: [
        ['issueDate', 'تاریخ'], ['itemName', 'شے'], ['quantity', 'مقدار'], ['department', 'شعبہ'], ['receiverName', 'وصول کنندہ'], ['approvalStatus', 'حالت'],
    ],
    departmentWise: [
        ['department', 'شعبہ'], ['totalIssues', 'کل اجراء'], ['totalQuantity', 'کل مقدار'],
    ],
    lowStock: [
        ['itemName', 'شے'], ['category', 'کیٹیگری'], ['unit', 'اکائی'], ['currentStock', 'موجودہ اسٹاک'], ['purchasePrice', 'فی اکائی قیمت'], ['stockValue', 'مالیت'],
    ],
    damagedStock: [
        ['date', 'تاریخ'], ['itemName', 'شے'], ['quantity', 'مقدار'], ['reason', 'وجہ'], ['responsiblePerson', 'ذمہ دار'], ['amountLoss', 'نقصان رقم'], ['approvalStatus', 'حالت'],
    ],
    storeValue: [
        ['itemName', 'شے'], ['category', 'کیٹیگری'], ['unit', 'اکائی'], ['currentStock', 'موجودہ اسٹاک'], ['purchasePrice', 'فی اکائی قیمت'], ['totalValue', 'کل مالیت'],
    ],
    itemLedger: [
        ['ledgerDate', 'تاریخ'], ['sourceType', 'قسم'], ['referenceNo', 'حوالہ'], ['inQuantity', 'آمد'], ['outQuantity', 'رفت'], ['balanceQuantity', 'بیلنس'], ['note', 'نوٹ'],
    ],
};

const formatValue = (value) => {
    if (value === null || value === undefined || value === '') return '-';
    if (value instanceof Date) return value.toISOString().slice(0, 10);
    if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(value)) return value.slice(0, 10);
    if (typeof value === 'number') return new Intl.NumberFormat('ur-PK', { maximumFractionDigits: 2 }).format(value);
    return String(value);
};

const moneyText = (value) => `روپے ${formatValue(Number(value || 0))}`;
const formatReportCell = (row, key) => {
    if (key === 'purchasePrice') {
        return `${moneyText(row.purchasePrice)}${row.unit ? ` فی ${row.unit}` : ''}`;
    }
    if (['stockValue', 'totalValue', 'totalAmount', 'paidAmount', 'remainingAmount', 'amountLoss', 'totalPurchase', 'totalPaid', 'balance'].includes(key)) {
        return moneyText(row[key]);
    }
    return formatValue(row[key]);
};

const getSummaryCards = (summary) => {
    if (!summary) return [];
    const cards = [];
    if (summary.totalItems !== undefined) cards.push({ key: 'totalItems', label: 'کل اشیاء', value: formatValue(summary.totalItems), icon: PackageCheck });
    if (summary.totalValue !== undefined) cards.push({ key: 'totalValue', label: 'کل مالیت', value: moneyText(summary.totalValue), icon: Wallet });
    if (summary.totalAmount !== undefined) cards.push({ key: 'totalAmount', label: 'کل رقم', value: moneyText(summary.totalAmount), icon: Wallet });
    if (summary.paidAmount !== undefined) cards.push({ key: 'paidAmount', label: 'ادا شدہ', value: moneyText(summary.paidAmount), icon: Wallet });
    if (summary.remainingAmount !== undefined) cards.push({ key: 'remainingAmount', label: 'باقی', value: moneyText(summary.remainingAmount), icon: Wallet });
    if (summary.amountLoss !== undefined) cards.push({ key: 'amountLoss', label: 'کل نقصان', value: moneyText(summary.amountLoss), icon: Wallet });
    return cards;
};

const downloadCsv = ({ rows, columns, fileName }) => {
    const escapeValue = (value) => `"${formatValue(value).replace(/"/g, '""')}"`;
    const csv = [
        columns.map(([, label]) => escapeValue(label)).join(','),
        ...rows.map((row) => columns.map(([key]) => escapeValue(formatReportCell(row, key))).join(',')),
    ].join('\r\n');
    const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${fileName}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
};

export const StoreReports = () => {
    const [reportType, setReportType] = useState('dailyStock');
    const [filters, setFilters] = useState({ fromDate: '', toDate: '', category: '', supplierId: '', department: '', itemId: '', limit: '10' });
    const [rows, setRows] = useState([]);
    const [summary, setSummary] = useState(null);
    const [items, setItems] = useState([]);
    const [suppliers, setSuppliers] = useState([]);
    const [categories, setCategories] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const columns = useMemo(() => columnsByReport[reportType] || columnsByReport.dailyStock, [reportType]);
    const reportTitle = reportOptions.find((item) => item.value === reportType)?.label || 'رپورٹ';
    const summaryCards = useMemo(() => getSummaryCards(summary), [summary]);

    useEffect(() => {
        Promise.all([getStoreItems(), getStoreSuppliers(), getStoreCategories({ activeOnly: 'true' })])
            .then(([itemsResult, suppliersResult, categoryResult]) => {
                setItems(itemsResult.items || []);
                setSuppliers(suppliersResult.items || []);
                setCategories(categoryResult.items || []);
            })
            .catch(() => setError('فلٹر معلومات لوڈ نہیں ہو سکیں۔'));
    }, []);

    useEffect(() => {
        const loadReport = async () => {
            if (reportType === 'itemLedger' && !filters.itemId) {
                setRows([]);
                setSummary(null);
                return;
            }

            setIsLoading(true);
            setError('');
            try {
                const result = await getStoreReport({ reportType, filters });
                setRows(result.items || []);
                setSummary(result.summary || null);
            } catch (loadError) {
                setError(loadError.message || 'رپورٹ لوڈ نہیں ہو سکی۔');
            } finally {
                setIsLoading(false);
            }
        };

        const timer = setTimeout(loadReport, 250);
        return () => clearTimeout(timer);
    }, [reportType, filters]);

    const departments = useMemo(() => [...new Set(rows.map((row) => row.department).filter(Boolean))], [rows]);

    const buildExportQuery = () => {
        const params = new URLSearchParams();
        ['fromDate', 'toDate', 'category', 'supplierId', 'department', 'limit'].forEach((key) => {
            if (filters[key]) params.set(key, filters[key]);
        });
        return params.toString();
    };

    const getBackendExportBase = () => {
        if (reportType === 'purchases') return '/store/export/purchases';
        if (['dailyStock', 'lowStock', 'storeValue'].includes(reportType)) return '/store/export/stock-report';
        return '';
    };

    const handlePrint = async () => {
        const exportBase = getBackendExportBase();
        if (exportBase) {
            const query = buildExportQuery();
            await openStorePrintPage(`${exportBase}/pdf${query ? `?${query}` : ''}`);
            return;
        }
        window.print();
    };

    const handlePdf = async () => {
        const exportBase = getBackendExportBase();
        if (exportBase) {
            const query = buildExportQuery();
            await openStorePrintPage(`${exportBase}/pdf${query ? `?${query}` : ''}`);
            return;
        }
        const doc = new jsPDF({ orientation: 'landscape' });
        doc.setFontSize(14);
        doc.text(reportTitle, 14, 16);
        let y = 26;
        rows.slice(0, 30).forEach((row) => {
            const line = columns.map(([key, label]) => `${label}: ${formatReportCell(row, key)}`).join(' | ');
            doc.text(line.slice(0, 180), 14, y);
            y += 8;
            if (y > 190) {
                doc.addPage();
                y = 16;
            }
        });
        doc.save(`${reportType}.pdf`);
    };

    const handleExcel = async () => {
        const exportBase = getBackendExportBase();
        if (exportBase) {
            const query = buildExportQuery();
            await downloadStoreExport(`${exportBase}/excel${query ? `?${query}` : ''}`, `${reportType}.xls`);
            return;
        }
        downloadCsv({ rows, columns, fileName: reportType });
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-700 p-2" dir="rtl">
            <div className="flex flex-col gap-4 rounded-[2.5rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-sm md:flex-row md:items-center md:justify-between">
                <div className="text-right">
                    <div className="mb-3 inline-flex items-center gap-2 rounded-2xl bg-emerald-500/10 px-4 py-2 text-sm font-black text-[#00d094]">
                        <FileText size={18} />
                        اسٹور مینجمنٹ
                    </div>
                    <h2 className="text-2xl font-black tracking-tight text-[var(--color-text)]">رپورٹس</h2>
                    <p className="mt-4 text-sm font-medium text-[var(--color-text-muted)]">فلٹرز کے مطابق اسٹور رپورٹس دیکھیں اور ایکسپورٹ کریں</p>
                </div>

                <div className="flex flex-wrap gap-3">
                    <button type="button" onClick={handlePrint} className="inline-flex items-center gap-2 rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] px-5 py-3 text-sm font-black text-[var(--color-text)]">
                        <Printer size={18} /> پرنٹ
                    </button>
                    <button type="button" onClick={handlePdf} disabled={!rows.length} className="inline-flex items-center gap-2 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-5 py-3 text-sm font-black text-emerald-500 disabled:opacity-50">
                        <FileText size={18} /> پی ڈی ایف
                    </button>
                    <button type="button" onClick={handleExcel} disabled={!rows.length} className="inline-flex items-center gap-2 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-5 py-3 text-sm font-black text-emerald-500 disabled:opacity-50">
                        <Download size={18} /> ایکسل
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4 rounded-[2.5rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-sm md:grid-cols-4">
                <select value={reportType} onChange={(event) => setReportType(event.target.value)} className="h-12 rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 text-right text-sm font-bold text-[var(--color-text)] outline-none">
                    {reportOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
                <input type="date" value={filters.fromDate} onChange={(event) => setFilters((prev) => ({ ...prev, fromDate: event.target.value }))} className="h-12 rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 text-right text-sm font-bold text-[var(--color-text)] outline-none" />
                <input type="date" value={filters.toDate} onChange={(event) => setFilters((prev) => ({ ...prev, toDate: event.target.value }))} className="h-12 rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 text-right text-sm font-bold text-[var(--color-text)] outline-none" />
                <select value={filters.category} onChange={(event) => setFilters((prev) => ({ ...prev, category: event.target.value }))} className="h-12 rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 text-right text-sm font-bold text-[var(--color-text)] outline-none">
                    <option value="">تمام کیٹیگریز</option>
                    {categories.map((category) => <option key={category.id} value={category.name}>{category.name}</option>)}
                </select>
                <select value={filters.supplierId} onChange={(event) => setFilters((prev) => ({ ...prev, supplierId: event.target.value }))} className="h-12 rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 text-right text-sm font-bold text-[var(--color-text)] outline-none">
                    <option value="">تمام سپلائرز</option>
                    {suppliers.map((supplier) => <option key={supplier.id} value={supplier.id}>{supplier.supplierName}</option>)}
                </select>
                <select value={filters.department} onChange={(event) => setFilters((prev) => ({ ...prev, department: event.target.value }))} className="h-12 rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 text-right text-sm font-bold text-[var(--color-text)] outline-none">
                    <option value="">تمام شعبہ جات</option>
                    {departments.map((department) => <option key={department} value={department}>{department}</option>)}
                </select>
                <select value={filters.itemId} onChange={(event) => setFilters((prev) => ({ ...prev, itemId: event.target.value }))} className="h-12 rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 text-right text-sm font-bold text-[var(--color-text)] outline-none">
                    <option value="">شے منتخب کریں</option>
                    {items.map((item) => <option key={item.id} value={item.id}>{item.itemName}</option>)}
                </select>
                <div className="relative">
                    <Search size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
                    <input type="number" min="0" value={filters.limit} onChange={(event) => setFilters((prev) => ({ ...prev, limit: event.target.value }))} placeholder="کم اسٹاک حد" className="h-12 w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] pr-12 pl-4 text-right text-sm font-bold text-[var(--color-text)] outline-none" />
                </div>
            </div>

            {error ? <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 p-4 text-sm font-black text-rose-500">{error}</div> : null}

            {summaryCards.length ? (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-2 ">
                    {summaryCards.map((card) => {
                        const Icon = card.icon;
                        return (
                            <div key={card.key} className="flex items-center justify-between gap-4 rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm">
                                <div className="text-right">
                                    <p className="text-xs font-black text-[var(--color-text-muted)]">{card.label}</p>
                                    <p className="mt-2 text-2xl font-black text-[var(--color-text)]">{card.value}</p>
                                </div>
                                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-[#00d094]">
                                    <Icon size={22} />
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : null}

            <div className="overflow-hidden rounded-[2.5rem] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-right">
                        <thead>
                            <tr className="text-[var(--color-text-muted)] border-b border-[var(--color-border)] bg-[var(--color-input)]/50">
                                {columns.map(([key, label]) => <th key={key} className="px-6 py-4 text-[11px] font-black uppercase tracking-widest">{label}</th>)}
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                <tr><td colSpan={columns.length} className="px-6 py-8 text-center text-sm font-bold text-[var(--color-text-muted)]">رپورٹ لوڈ ہو رہی ہے...</td></tr>
                            ) : rows.length ? (
                                rows.map((row, index) => (
                                    <tr key={row.id || index} className="border-t border-[var(--color-border)]/60">
                                        {columns.map(([key]) => <td key={key} className="px-6 py-4 text-sm font-bold text-[var(--color-text)]">{formatReportCell(row, key)}</td>)}
                                    </tr>
                                ))
                            ) : (
                                <tr><td colSpan={columns.length} className="px-6 py-8 text-center text-sm font-bold text-[var(--color-text-muted)]">کوئی ریکارڈ موجود نہیں۔</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
