import React, { useEffect, useState } from 'react';
import { Plus, Trash2, Save, Wallet, Receipt, AlertCircle, Edit2, X } from 'lucide-react';
import { createFinanceHead, deactivateFinanceHead, getFinanceHeads, updateFinanceHead } from '../../../../Constant/FinanceHeadsApi';
import { useNotificationBridge } from '../../../../Components/Notifications/useNotificationBridge';

const createIncomeHead = () => ({ id: crypto.randomUUID(), title: '', description: '' });
const createExpenseHead = () => ({ id: crypto.randomUUID(), title: '', category: 'عام اخراجات', budgetLimit: '' });

const buildExpenseDescription = (item) => {
    const parts = [`کیٹیگری: ${item.category || 'عام اخراجات'}`];
    if (item.budgetLimit) parts.push(`بجٹ لمٹ: ${item.budgetLimit}`);
    return parts.join(' | ');
};

const readCategory = (description = '') => {
    const match = description.match(/کیٹیگری:\s*([^|]+)/);
    return match?.[1]?.trim() || 'عام اخراجات';
};

const readBudgetLimit = (description = '') => {
    const match = description.match(/بجٹ لمٹ:\s*([^|]+)/);
    return match?.[1]?.trim() || '';
};

export const FinanceHeadsSetup = () => {
    const [activeTab, setActiveTab] = useState('income');
    const [incomeHeads, setIncomeHeads] = useState(() => [createIncomeHead()]);
    const [expenseHeads, setExpenseHeads] = useState(() => [createExpenseHead()]);
    const [existingIncome, setExistingIncome] = useState([]);
    const [existingExpenses, setExistingExpenses] = useState([]);
    const [editingId, setEditingId] = useState(null);
    const [editForm, setEditForm] = useState(null);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    useNotificationBridge({ error, success });

    const loadHeads = async () => {
        setIsLoading(true);
        setError('');

        try {
            const [incomeResult, expenseResult] = await Promise.all([
                getFinanceHeads('page=1&limit=100&type=income&status=active'),
                getFinanceHeads('page=1&limit=100&type=expense&status=active'),
            ]);

            setExistingIncome((incomeResult.items || []).map((item) => ({
                id: item.id,
                title: item.name,
                description: item.description || '',
            })));

            setExistingExpenses((expenseResult.items || []).map((item) => ({
                id: item.id,
                title: item.name,
                category: readCategory(item.description),
                budgetLimit: readBudgetLimit(item.description),
                description: item.description || '',
            })));
        } catch (loadError) {
            setError(loadError.message || 'مالیاتی اقسام لوڈ نہیں ہو سکیں۔');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadHeads();
    }, []);

    const addRow = () => {
        if (activeTab === 'income') {
            setIncomeHeads([...incomeHeads, createIncomeHead()]);
        } else {
            setExpenseHeads([...expenseHeads, createExpenseHead()]);
        }
    };

    const deleteNewRow = (id) => {
        if (activeTab === 'income') {
            if (incomeHeads.length > 1) setIncomeHeads(incomeHeads.filter((row) => row.id !== id));
        } else {
            if (expenseHeads.length > 1) setExpenseHeads(expenseHeads.filter((row) => row.id !== id));
        }
    };

    const handleInputChange = (id, field, value) => {
        if (activeTab === 'income') {
            setIncomeHeads(incomeHeads.map((row) => (row.id === id ? { ...row, [field]: value } : row)));
        } else {
            setExpenseHeads(expenseHeads.map((row) => (row.id === id ? { ...row, [field]: value } : row)));
        }
    };

    const resetMessages = () => {
        setError('');
        setSuccess('');
    };

    const handleSave = async () => {
        const rows = activeTab === 'income' ? incomeHeads : expenseHeads;
        const validRows = rows.filter((item) => item.title.trim());
        resetMessages();

        if (!validRows.length) {
            setError(activeTab === 'income' ? 'براہ کرم کم از کم ایک آمدنی کا نام درج کریں۔' : 'براہ کرم کم از کم ایک خرچ کا نام درج کریں۔');
            return;
        }

        setIsSaving(true);
        try {
            await Promise.all(validRows.map((item) => createFinanceHead({
                name: item.title.trim(),
                type: activeTab,
                description: activeTab === 'income' ? item.description || '' : buildExpenseDescription(item),
            })));

            setSuccess(activeTab === 'income' ? 'آمدنی کی اقسام کامیابی سے محفوظ ہو گئیں۔' : 'اخراجات کی اقسام کامیابی سے محفوظ ہو گئیں۔');
            activeTab === 'income'
                ? setIncomeHeads([createIncomeHead()])
                : setExpenseHeads([createExpenseHead()]);
            await loadHeads();
        } catch (saveError) {
            setError(saveError.message || 'مالیاتی اقسام محفوظ نہیں ہو سکیں۔');
        } finally {
            setIsSaving(false);
        }
    };

    const startEdit = (item) => {
        setEditingId(item.id);
        setEditForm({ ...item });
    };

    const cancelEdit = () => {
        setEditingId(null);
        setEditForm(null);
    };

    const saveEdit = async () => {
        if (!editForm?.title?.trim()) {
            setError(activeTab === 'income' ? 'آمدنی کا نام لازمی ہے۔' : 'خرچ کا نام لازمی ہے۔');
            return;
        }

        setIsSaving(true);
        resetMessages();
        try {
            await updateFinanceHead(editingId, {
                name: editForm.title.trim(),
                type: activeTab,
                description: activeTab === 'income' ? editForm.description || '' : buildExpenseDescription(editForm),
            });
            setSuccess(activeTab === 'income' ? 'آمدنی کی قسم کامیابی سے تبدیل ہو گئی۔' : 'خرچ کی قسم کامیابی سے تبدیل ہو گئی۔');
            cancelEdit();
            await loadHeads();
        } catch (saveError) {
            setError(saveError.message || 'مالیاتی قسم تبدیل نہیں ہو سکی۔');
        } finally {
            setIsSaving(false);
        }
    };

    const confirmDelete = async () => {
        if (!deleteTarget) return;
        const label = deleteTarget.type === 'income' ? 'آمدنی' : 'خرچ';

        resetMessages();
        setIsDeleting(true);
        try {
            await deactivateFinanceHead(deleteTarget.id);
            setSuccess(`${label} کی قسم کامیابی سے ختم کر دی گئی۔`);
            setDeleteTarget(null);
            await loadHeads();
        } catch (deleteError) {
            setError(deleteError.message || `${label} کی قسم ختم نہیں ہو سکی۔`);
        } finally {
            setIsDeleting(false);
        }
    };

    const activeNewRows = activeTab === 'income' ? incomeHeads : expenseHeads;
    const activeExistingRows = activeTab === 'income' ? existingIncome : existingExpenses;

    return (
        <div className="finance-heads-page p-6 min-h-screen text-[var(--color-text)] bg-[var(--color-bg)]" >
            <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-8 p-6 rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)]">
                <div className="flex flex-row-reverse items-center gap-4 text-right">
                    <div className="p-3 rounded-2xl" style={{ backgroundColor: 'rgba(var(--color-primary-rgb), 0.1)', color: 'var(--color-primary)' }}>
                        {activeTab === 'income' ? <Wallet size={28} /> : <Receipt size={28} />}
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold">{activeTab === 'income' ? 'آمدنی کی اقسام' : 'اخراجات کی اقسام'}</h1>
                        <p className="text-gray-400 text-sm mt-4">مالیاتی کیٹیگریز کی سیٹنگ یہاں سے کریں</p>
                    </div>
                </div>

                <div className="flex bg-black/40 p-1.5 rounded-2xl border border-[var(--color-border)] w-full md:w-auto">
                    <button
                        onClick={() => { setActiveTab('expense'); cancelEdit(); }}
                        className={`flex-1 md:w-32 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${activeTab === 'expense' ? 'bg-[var(--color-primary)] text-[var(--color-bg)]' : 'text-gray-500 hover:text-white'}`}
                    >
                        <Receipt size={16} /> اخراجات
                    </button>
                    <button
                        onClick={() => { setActiveTab('income'); cancelEdit(); }}
                        className={`flex-1 md:w-32 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${activeTab === 'income' ? 'bg-[var(--color-primary)] text-[var(--color-bg)]' : 'text-gray-500 hover:text-white'}`}
                    >
                        <Wallet size={16} /> آمدنی
                    </button>
                </div>

                <button onClick={handleSave} disabled={isSaving} className="bg-[var(--color-primary)] text-[var(--color-bg)] w-full md:w-auto flex items-center justify-center gap-2 font-bold px-10 py-3 rounded-2xl transition-all shadow-lg active:scale-95 disabled:opacity-60">
                    <Save size={20} /> {isSaving ? 'محفوظ ہو رہا ہے...' : 'محفوظ کریں'}
                </button>
            </div>

            <div className="max-w-6xl mx-auto space-y-4 mb-12">
                <h2 className="text-lg font-semibold mb-4 text-right border-r-4 border-[var(--color-primary)] pr-3">
                    نئی {activeTab === 'income' ? 'آمدنی' : 'اخراجات'} شامل کریں <span className="text-red-500">*</span>
                </h2>

                {activeNewRows.map((item, index) => (
                    <div key={item.id} className="bg-[var(--color-surface)] flex flex-row-reverse items-center gap-4 p-4 rounded-2xl border border-[rgba(255,255,255,0.05)] animate-in slide-in-from-top-4 duration-300">
                        <div className="w-8 h-8 bg-[var(--color-primary)]  rounded-full flex items-center justify-center font-bold text-xs shrink-0 text-[var(--color-bg)]">
                            {index + 1}
                        </div>

                        <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
                            <input dir="rtl" type="text" required
                                placeholder={activeTab === 'income' ? 'آمدنی کا نام' : 'خرچ کا نام'}
                                value={item.title}
                                onChange={(e) => handleInputChange(item.id, 'title', e.target.value)}
                                className="border rounded-xl p-3 text-sm outline-none bg-black/20 text-right focus:border-[var(--color-primary)] border-white/10"
                            />

                            {activeTab === 'expense' ? (
                                <>
                                    <select dir="rtl" value={item.category} onChange={(e) => handleInputChange(item.id, 'category', e.target.value)}
                                        className="border bg-black/20 rounded-xl p-3 text-sm outline-none bg-black text-right focus:border-[var(--color-primary)] border-white/10">
                                        <option value="عام اخراجات">عام اخراجات</option>
                                        <option value="انتظامی اخراجات">انتظامی اخراجات</option>
                                        <option value="مستقل اثاثے">مستقل اثاثے</option>
                                        <option value="عملے کے متعلق">عملے کے متعلق</option>
                                    </select>
                                    <input dir="rtl" type="number" placeholder="بجٹ لمٹ" value={item.budgetLimit}
                                        onChange={(e) => handleInputChange(item.id, 'budgetLimit', e.target.value)}
                                        className="border rounded-xl p-3 text-sm outline-none bg-black/20 text-right focus:border-[var(--color-primary)] border-white/10"
                                    />
                                </>
                            ) : (
                                <input dir="rtl" type="text" placeholder="تفصیل (اختیاری)" value={item.description}
                                    onChange={(e) => handleInputChange(item.id, 'description', e.target.value)}
                                    className="md:col-span-2 border rounded-xl p-3 text-sm outline-none bg-black/20 text-right focus:border-[var(--color-primary)] border-white/10"
                                />
                            )}
                        </div>

                        <button onClick={() => deleteNewRow(item.id)}
                            className={`p-2 rounded-lg transition-all ${activeNewRows.length === 1 ? 'opacity-20 cursor-not-allowed' : 'text-red-400 hover:bg-red-500/10'}`}
                            aria-label="سطر حذف کریں">
                            <Trash2 size={20} />
                        </button>
                    </div>
                ))}

                <button onClick={addRow} className="flex items-center gap-2 border-2 border-dashed px-6 py-2 rounded-xl transition-all text-gray-500 hover:text-[var(--color-primary)] hover:border-[var(--color-primary)]">
                    <Plus size={18} /> مزید سطر شامل کریں
                </button>
            </div>

            <div className="max-w-6xl mx-auto space-y-4">
                <h2 className="text-lg font-semibold mb-4 text-right border-r-4 border-blue-500 pr-3">موجودہ فہرست ({activeTab === 'income' ? 'آمدنی' : 'اخراجات'})</h2>
                <div className="overflow-hidden rounded-3xl border border-white/5" style={{ backgroundColor: 'var(--color-surface)' }}>
                    <table className="w-full text-right" dir="rtl">
                        <thead className="bg-black/20 text-gray-400 text-xs uppercase">
                            <tr>
                                <th className="p-4">نمبر</th>
                                <th className="p-4">نام</th>
                                {activeTab === 'expense' ? <th className="p-4">کیٹیگری / بجٹ</th> : <th className="p-4">تفصیل</th>}
                                <th className="p-4 text-center">کارروائی</th>
                            </tr>
                        </thead>
                        <tbody className="text-sm">
                            {isLoading ? (
                                <tr><td className="p-6 text-center text-gray-400" colSpan={4}>مالیاتی اقسام لوڈ ہو رہی ہیں...</td></tr>
                            ) : activeExistingRows.length ? activeExistingRows.map((item, idx) => (
                                <tr key={item.id} className="border-t border-white/5 hover:bg-white/5 transition-colors">
                                    <td className="p-4 text-gray-500">{idx + 1}</td>
                                    <td className="p-4 font-medium text-[var(--color-primary)]">
                                        {editingId === item.id ? (
                                            <input dir="rtl" required className="w-full border rounded-xl p-2 text-sm outline-none bg-black/20 text-right border-white/10" value={editForm.title} onChange={(e) => setEditForm((prev) => ({ ...prev, title: e.target.value }))} />
                                        ) : item.title}
                                    </td>
                                    <td className="p-4">
                                        {activeTab === 'expense' ? (
                                            editingId === item.id ? (
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                                    <select dir="rtl" className="border bg-black rounded-xl p-2 text-sm outline-none text-right border-white/10" value={editForm.category} onChange={(e) => setEditForm((prev) => ({ ...prev, category: e.target.value }))}>
                                                        <option value="عام اخراجات">عام اخراجات</option>
                                                        <option value="انتظامی اخراجات">انتظامی اخراجات</option>
                                                        <option value="مستقل اثاثے">مستقل اثاثے</option>
                                                        <option value="عملے کے متعلق">عملے کے متعلق</option>
                                                    </select>
                                                    <input dir="rtl" type="number" className="border rounded-xl p-2 text-sm outline-none bg-black/20 text-right border-white/10" value={editForm.budgetLimit} onChange={(e) => setEditForm((prev) => ({ ...prev, budgetLimit: e.target.value }))} />
                                                </div>
                                            ) : (
                                                <div className="flex flex-col">
                                                    <span>{item.category}</span>
                                                    <span className="text-xs text-gray-500">لمٹ: {item.budgetLimit || 'مقرر نہیں'}</span>
                                                </div>
                                            )
                                        ) : editingId === item.id ? (
                                            <input dir="rtl" className="w-full border rounded-xl p-2 text-sm outline-none bg-black/20 text-right border-white/10" value={editForm.description} onChange={(e) => setEditForm((prev) => ({ ...prev, description: e.target.value }))} />
                                        ) : (
                                            <span className="text-gray-400">{item.description || '---'}</span>
                                        )}
                                    </td>
                                    <td className="p-4">
                                        <div className="flex justify-center gap-2">
                                            {editingId === item.id ? (
                                                <>
                                                    <button onClick={saveEdit} disabled={isSaving} className="p-2 text-emerald-400 hover:bg-emerald-500/10 rounded-lg" aria-label="محفوظ کریں"><Save size={16} /></button>
                                                    <button onClick={cancelEdit} className="p-2 text-gray-400 hover:bg-white/10 rounded-lg" aria-label="منسوخ کریں"><X size={16} /></button>
                                                </>
                                            ) : (
                                                <>
                                                    <button onClick={() => startEdit(item)} className="p-2 text-blue-400 hover:bg-blue-500/10 rounded-lg" aria-label="تبدیل کریں"><Edit2 size={16} /></button>
                                                    <button onClick={() => setDeleteTarget({ ...item, type: activeTab })} className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg" aria-label="حذف کریں"><Trash2 size={16} /></button>
                                                </>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            )) : (
                                <tr><td className="p-6 text-center text-gray-400" colSpan={4}>کوئی ریکارڈ موجود نہیں۔</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="mt-12 max-w-6xl mx-auto flex flex-row items-center gap-4 p-5 rounded-3xl border border-white/5 bg-white/5">
                <AlertCircle size={24} className="text-gray-500 shrink-0" />
                <p className="text-xs text-gray-500 text-right leading-relaxed">
                    <span className="font-bold text-[var(--color-primary)]">پیشہ ورانہ مشورہ:</span> آمدنی اور اخراجات کو صحیح طرح کیٹیگریز میں تقسیم کرنے سے ماہانہ مالیاتی رپورٹ سمجھنا آسان ہو جاتا ہے۔
                </p>
            </div>

            {deleteTarget ? (
                <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/60 px-4 backdrop-blur-sm">
                    <div className="w-full max-w-md rounded-[2rem] border border-rose-500/20 bg-[var(--color-surface)] p-8 shadow-2xl" dir="rtl">
                        <div className="flex items-start justify-between gap-4">
                            <div className="text-right">
                                <h3 className="text-xl font-black text-[var(--color-text-main)]">مالیاتی قسم حذف کرنے کی تصدیق</h3>
                                <p className="mt-3 text-sm font-bold leading-7 text-[var(--color-text-muted)]">
                                    کیا آپ واقعی <span className="text-rose-500">{deleteTarget.title}</span> کو حذف کرنا چاہتے ہیں؟
                                    یہ عمل واپس نہیں ہو گا۔
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => !isDeleting && setDeleteTarget(null)}
                                className="rounded-xl bg-[var(--color-bg)] p-2 text-[var(--color-text-muted)] transition-all hover:text-rose-500"
                                aria-label="بند کریں"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <div className="mt-8 flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={() => setDeleteTarget(null)}
                                disabled={isDeleting}
                                className="rounded-xl border border-[var(--color-border)] px-5 py-3 text-sm font-black text-[var(--color-text-muted)] transition-all hover:bg-[var(--color-bg)] disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                منسوخ کریں
                            </button>
                            <button
                                type="button"
                                onClick={confirmDelete}
                                disabled={isDeleting}
                                className="rounded-xl bg-rose-500 px-6 py-3 text-sm font-black text-white transition-all hover:bg-rose-600 disabled:cursor-not-allowed disabled:opacity-70"
                            >
                                {isDeleting ? 'حذف ہو رہی ہے...' : 'تصدیق کریں'}
                            </button>
                        </div>
                    </div>
                </div>
            ) : null}
        </div>
    );
};
