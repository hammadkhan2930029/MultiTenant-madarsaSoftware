import React, { useEffect, useState } from 'react';
import { Plus, Trash2, Save, Receipt, AlertCircle, Edit2, X } from 'lucide-react';
import { createFinanceHead, deactivateFinanceHead, getFinanceHeads, updateFinanceHead } from '../../../../Constant/FinanceHeadsApi';
import { useNotificationBridge } from '../../../../Components/Notifications/useNotificationBridge';
import { createClientId } from '../../../../Utils/createClientId';

const createExpenseHead = () => ({ id: createClientId(), title: '', category: 'عام اخراجات', budgetLimit: '' });

const buildDescription = (item) => {
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

export const ExpenseHeadsSetup = () => {
    const [expenseHeads, setExpenseHeads] = useState(() => [createExpenseHead()]);
    const [existingExpenses, setExistingExpenses] = useState([]);
    const [editingId, setEditingId] = useState(null);
    const [editForm, setEditForm] = useState(createExpenseHead());
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [newRowDeleteTarget, setNewRowDeleteTarget] = useState(null);
    const [isSaving, setIsSaving] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    useNotificationBridge({ error, success });

    const loadExpenseHeads = async () => {
        setIsLoading(true);
        setError('');

        try {
            const result = await getFinanceHeads('page=1&limit=100&type=expense&status=active');
            setExistingExpenses((result.items || []).map((item) => ({
                id: item.id,
                title: item.name,
                category: readCategory(item.description),
                budgetLimit: readBudgetLimit(item.description),
                description: item.description || '',
            })));
        } catch (loadError) {
            setError(loadError.message || 'اخراجات کی اقسام لوڈ نہیں ہو سکیں۔');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadExpenseHeads();
    }, []);

    const addRow = () => {
        setExpenseHeads([...expenseHeads, createExpenseHead()]);
    };

    const deleteNewRow = () => {
        if (!newRowDeleteTarget) return;

        if (expenseHeads.length > 1) {
            setExpenseHeads(expenseHeads.filter((row) => row.id !== newRowDeleteTarget.id));
        }
        setNewRowDeleteTarget(null);
    };

    const handleInputChange = (id, field, value) => {
        setExpenseHeads(expenseHeads.map((row) => (row.id === id ? { ...row, [field]: value } : row)));
    };

    const handleEditChange = (field, value) => {
        setEditForm((prev) => ({ ...prev, [field]: value }));
    };

    const handleSaveNew = async () => {
        const validRows = expenseHeads.filter((item) => item.title.trim());
        setError('');
        setSuccess('');

        if (!validRows.length) {
            setError('براہ کرم کم از کم ایک خرچ کا نام درج کریں۔');
            return;
        }

        setIsSaving(true);
        try {
            await Promise.all(validRows.map((item) => createFinanceHead({
                name: item.title.trim(),
                type: 'expense',
                description: buildDescription(item),
            })));
            setSuccess('اخراجات کی اقسام کامیابی سے محفوظ ہو گئیں۔');
            setExpenseHeads([createExpenseHead()]);
            await loadExpenseHeads();
        } catch (saveError) {
            setError(saveError.message || 'اخراجات کی اقسام محفوظ نہیں ہو سکیں۔');
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
        setEditForm(createExpenseHead());
    };

    const saveEdit = async () => {
        if (!editForm.title.trim()) {
            setError('خرچ کا نام لازمی ہے۔');
            return;
        }

        setIsSaving(true);
        setError('');
        setSuccess('');
        try {
            await updateFinanceHead(editingId, {
                name: editForm.title.trim(),
                type: 'expense',
                description: buildDescription(editForm),
            });
            setSuccess('خرچ کی قسم کامیابی سے تبدیل ہو گئی۔');
            cancelEdit();
            await loadExpenseHeads();
        } catch (saveError) {
            setError(saveError.message || 'خرچ کی قسم تبدیل نہیں ہو سکی۔');
        } finally {
            setIsSaving(false);
        }
    };

    const confirmDelete = async () => {
        if (!deleteTarget) return;

        setError('');
        setSuccess('');
        setIsDeleting(true);
        try {
            await deactivateFinanceHead(deleteTarget.id);
            setSuccess('خرچ کی قسم کامیابی سے ختم کر دی گئی۔');
            setDeleteTarget(null);
            await loadExpenseHeads();
        } catch (deleteError) {
            setError(deleteError.message || 'خرچ کی قسم ختم نہیں ہو سکی۔');
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <div className="finance-heads-page p-6 min-h-screen text-white " style={{ backgroundColor: 'var(--color-bg)' }}>
            <div className="flex flex-row items-center justify-between mb-8 p-6 rounded-3xl border"
                style={{ backgroundColor: 'var(--color-surface)', borderColor: 'rgba(255,255,255,0.05)' }}>
                <div className="flex flex-row-reverse items-center gap-4 text-right">
                    <div className="p-3 rounded-2xl" style={{ backgroundColor: 'rgba(var(--color-primary-rgb), 0.1)', color: 'var(--color-primary)' }}>
                        <Receipt size={28} />
                    </div>
                    <div>
                        <h1 className="text-2xl ">اخراجات کی اقسام</h1>
                        <p className="text-gray-400 text-sm mt-4">طے کریں کہ پیسہ کہاں خرچ ہو رہا ہے</p>
                    </div>
                </div>
                <button onClick={handleSaveNew} disabled={isSaving} className="flex items-center gap-2 font-bold px-8 py-3 rounded-2xl transition-all shadow-lg active:scale-95 disabled:opacity-60"
                    style={{ backgroundColor: 'var(--color-primary)', color: 'var(--color-bg)' }}>
                    <Save size={20} />
                    {isSaving ? 'محفوظ ہو رہا ہے...' : 'ڈیٹا محفوظ کریں'}
                </button>
            </div>

            <div className="max-w-5xl space-y-4 mb-12">
                <h2 className="text-lg font-semibold mb-4 text-right border-r-4 border-emerald-500 pr-3">نئی اقسام شامل کریں <span className="text-red-500">*</span></h2>
                {expenseHeads.map((item, index) => (
                    <div key={item.id} className="flex flex-row-reverse items-center gap-4 p-4 rounded-2xl border animate-in slide-in-from-right duration-300"
                        style={{ backgroundColor: 'var(--color-surface)', borderColor: 'rgba(255,255,255,0.05)' }}>
                        <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm"
                            style={{ backgroundColor: 'var(--color-primary)', color: 'var(--color-bg)' }}>
                            {index + 1}
                        </div>

                        <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
                            <input dir="rtl" type="text" required placeholder="خرچ کا نام (مثلاً بجلی کا بل)" value={item.title}
                                onChange={(e) => handleInputChange(item.id, 'title', e.target.value)}
                                className="border rounded-xl p-3 text-sm outline-none bg-black/20 text-right focus:border-[var(--color-primary)] border-white/10"
                            />
                            <select dir="rtl" value={item.category} onChange={(e) => handleInputChange(item.id, 'category', e.target.value)}
                                className="border rounded-xl p-3 text-sm outline-none bg-black text-right focus:border-[var(--color-primary)] border-white/10">
                                <option value="عام اخراجات">عام اخراجات</option>
                                <option value="انتظامی اخراجات">انتظامی اخراجات</option>
                                <option value="مستقل اثاثے">مستقل اثاثے</option>
                                <option value="عملے کے متعلق">عملے کے متعلق</option>
                            </select>
                            <input dir="rtl" type="number" placeholder="بجٹ لمٹ (اختیاری)" value={item.budgetLimit}
                                onChange={(e) => handleInputChange(item.id, 'budgetLimit', e.target.value)}
                                className="border rounded-xl p-3 text-sm outline-none bg-black/20 text-right focus:border-[var(--color-primary)] border-white/10"
                            />
                        </div>

                        {expenseHeads.length > 1 && (
                            <button onClick={() => setNewRowDeleteTarget({ id: item.id, title: item.title })} className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg" aria-label="سطر حذف کریں">
                                <Trash2 size={20} />
                            </button>
                        )}
                    </div>
                ))}

                <div className="flex justify-start pt-2">
                    <button onClick={addRow} className="flex items-center gap-2 border-2 border-dashed px-6 py-2 rounded-xl transition-all text-gray-400 hover:text-[var(--color-primary)] hover:border-[var(--color-primary)]">
                        <Plus size={18} />
                        مزید سطر شامل کریں
                    </button>
                </div>
            </div>

            <div className="max-w-5xl space-y-4">
                <h2 className="text-lg font-semibold mb-4 text-right border-r-4 border-blue-500 pr-3">موجودہ اخراجات کی فہرست</h2>
                <div className="overflow-hidden rounded-3xl border border-white/5" style={{ backgroundColor: 'var(--color-surface)' }}>
                    <table className="w-full text-right" dir="rtl">
                        <thead className="bg-black/20 text-gray-400 text-sm">
                            <tr>
                                <th className="p-4">نمبر</th>
                                <th className="p-4">نام</th>
                                <th className="p-4">کیٹیگری</th>
                                <th className="p-4">بجٹ لمٹ</th>
                                <th className="p-4 text-center">کارروائی</th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                <tr><td className="p-6 text-center text-gray-400" colSpan={5}>اخراجات کی اقسام لوڈ ہو رہی ہیں...</td></tr>
                            ) : existingExpenses.length ? existingExpenses.map((item, idx) => (
                                <tr key={item.id} className="border-t border-white/5 hover:bg-white/5 transition-colors">
                                    <td className="p-4 text-sm">{idx + 1}</td>
                                    <td className="p-4 font-medium text-[var(--color-primary)]">
                                        {editingId === item.id ? (
                                            <input dir="rtl" required className="w-full border rounded-xl p-2 text-sm outline-none bg-black/20 text-right border-white/10" value={editForm.title} onChange={(e) => handleEditChange('title', e.target.value)} />
                                        ) : item.title}
                                    </td>
                                    <td className="p-4">
                                        {editingId === item.id ? (
                                            <select dir="rtl" className="border rounded-xl p-2 text-sm outline-none bg-black text-right border-white/10" value={editForm.category} onChange={(e) => handleEditChange('category', e.target.value)}>
                                                <option value="عام اخراجات">عام اخراجات</option>
                                                <option value="انتظامی اخراجات">انتظامی اخراجات</option>
                                                <option value="مستقل اثاثے">مستقل اثاثے</option>
                                                <option value="عملے کے متعلق">عملے کے متعلق</option>
                                            </select>
                                        ) : <span className="px-3 py-1 bg-white/5 rounded-full text-xs">{item.category}</span>}
                                    </td>
                                    <td className="p-4 text-sm font-mono">
                                        {editingId === item.id ? (
                                            <input dir="rtl" type="number" className="w-28 border rounded-xl p-2 text-sm outline-none bg-black/20 text-right border-white/10" value={editForm.budgetLimit} onChange={(e) => handleEditChange('budgetLimit', e.target.value)} />
                                        ) : item.budgetLimit || '---'}
                                    </td>
                                    <td className="p-4">
                                        <div className="flex justify-center gap-3">
                                            {editingId === item.id ? (
                                                <>
                                                    <button onClick={saveEdit} disabled={isSaving} className="p-2 text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-all" aria-label="محفوظ کریں"><Save size={16} /></button>
                                                    <button onClick={cancelEdit} className="p-2 text-gray-400 hover:bg-white/10 rounded-lg transition-all" aria-label="منسوخ کریں"><X size={16} /></button>
                                                </>
                                            ) : (
                                                <>
                                                    <button onClick={() => startEdit(item)} className="p-2 text-blue-400 hover:bg-blue-500/10 rounded-lg transition-all" aria-label="تبدیل کریں"><Edit2 size={16} /></button>
                                                    <button onClick={() => setDeleteTarget(item)} className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-all" aria-label="حذف کریں"><Trash2 size={16} /></button>
                                                </>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            )) : (
                                <tr><td className="p-6 text-center text-gray-400" colSpan={5}>کوئی خرچ کی قسم موجود نہیں۔</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="mt-12 flex flex-row items-start justify-center gap-4 p-5 rounded-3xl max-w-5xl text-right border border-[var(--color-border)]">
                <AlertCircle size={24} className="shrink-0 mt-1 text-[var(--color-primary)]" />
                <div className="flex flex-row justify-center items-center gap-3">
                    <h4 style={{ color: 'var(--color-primary)' }} className="font-bold mb-1">ضروری نوٹ:</h4>
                    <p className="text-xs text-gray-500 leading-loose">
                        یہاں درج کی گئی اخراجات کی اقسام روزانہ واؤچر اندراج میں نظر آئیں گی۔ بجٹ لمٹ لگانے سے آپ خرچ کی حد کو بہتر طریقے سے دیکھ سکیں گے۔
                    </p>
                </div>
            </div>

            {newRowDeleteTarget ? (
                <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/60 px-4 backdrop-blur-sm">
                    <div className="w-full max-w-md rounded-[2rem] border border-rose-500/20 bg-[var(--color-surface)] p-8 shadow-2xl" dir="rtl">
                        <div className="flex items-start justify-between gap-4">
                            <div className="text-right">
                                <h3 className="text-xl font-black text-[var(--color-text-main)]">سطر حذف کرنے کی تصدیق</h3>
                                <p className="mt-3 text-sm font-bold leading-7 text-[var(--color-text-muted)]">
                                    کیا آپ واقعی یہ سطر حذف کرنا چاہتے ہیں؟
                                </p>
                            </div>
                            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-rose-500/10 text-rose-500">
                                <Trash2 size={22} />
                            </div>
                        </div>
                        <div className="mt-8 flex justify-end gap-3">
                            <button type="button" onClick={() => setNewRowDeleteTarget(null)} className="rounded-xl border border-[var(--color-border)] px-5 py-3 text-sm font-black text-[var(--color-text-muted)] transition-all hover:bg-[var(--color-bg)]">منسوخ کریں</button>
                            <button type="button" onClick={deleteNewRow} className="rounded-xl bg-rose-500 px-6 py-3 text-sm font-black text-white transition-all hover:bg-rose-600">تصدیق کریں</button>
                        </div>
                    </div>
                </div>
            ) : null}

            {deleteTarget ? (
                <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/60 px-4 backdrop-blur-sm">
                    <div className="w-full max-w-md rounded-[2rem] border border-rose-500/20 bg-[var(--color-surface)] p-8 shadow-2xl" dir="rtl">
                        <div className="flex items-start justify-between gap-4">
                            <div className="text-right">
                                <h3 className="text-xl font-black text-[var(--color-text-main)]">خرچ کی قسم حذف کرنے کی تصدیق</h3>
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
