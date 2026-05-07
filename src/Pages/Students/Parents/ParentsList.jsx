import React, { useEffect, useMemo, useState } from 'react';
import { Eye, Pencil, Plus, Search, Trash2, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { InputField } from '../../../Components/HR/FormElements';
import { createParent, deactivateParent, getParents, updateParent } from '../../../Constant/StudentsApi';

const INITIAL_FORM = {
    fullName: '',
    phone: '',
    occupation: '',
    address: '',
    email: '',
    cnic: '',
};

export const ParentsList = () => {
    const navigate = useNavigate();
    const [parents, setParents] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [formValues, setFormValues] = useState(INITIAL_FORM);
    const [editingParentId, setEditingParentId] = useState(null);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const loadParents = async () => {
        try {
            const result = await getParents('page=1&limit=100');
            setParents(result.items || []);
        } catch (loadError) {
            setError(loadError.message || 'Parents load nahi ho sake.');
        }
    };

    useEffect(() => {
        window.scrollTo(0, 0);
        loadParents();
    }, []);

    const handleChange = (fieldName, fieldValue) => {
        setFormValues((currentValues) => ({
            ...currentValues,
            [fieldName]: fieldValue,
        }));
    };

    const resetForm = () => {
        setFormValues(INITIAL_FORM);
        setEditingParentId(null);
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError('');
        setSuccess('');

        try {
            if (editingParentId) {
                await updateParent(editingParentId, formValues);
                setSuccess('Parent update ho gaye.');
            } else {
                await createParent(formValues);
                setSuccess('Parent create ho gaye.');
            }

            resetForm();
            await loadParents();
        } catch (saveError) {
            setError(saveError.message || 'Parent save nahi ho sake.');
        }
    };

    const handleEdit = (parent) => {
        setEditingParentId(parent.id);
        setFormValues({
            fullName: parent.fullName || '',
            phone: parent.phone || '',
            occupation: parent.occupation || '',
            address: parent.address || '',
            email: parent.email || '',
            cnic: parent.cnic || '',
        });
        window.scrollTo(0, 0);
    };

    const handleDelete = async (parentId) => {
        try {
            await deactivateParent(parentId);
            if (editingParentId === parentId) {
                resetForm();
            }
            setSuccess('Parent inactive kar diye gaye.');
            await loadParents();
        } catch (deleteError) {
            setError(deleteError.message || 'Parent inactive nahi ho sake.');
        }
    };

    const filteredParents = useMemo(
        () =>
            parents.filter((parent) =>
                [parent.fullName, parent.phone, parent.occupation, parent.address, parent.email]
                    .filter(Boolean)
                    .some((value) => value.toLowerCase().includes(searchTerm.toLowerCase())),
            ),
        [parents, searchTerm],
    );

    return (
        <div className="max-w-7xl mx-auto p-2 md:p-0 space-y-8 pb-10" dir="rtl">
            <div className="bg-[var(--color-surface)] rounded-[3rem] border border-[var(--color-border)] shadow-[2px_6px_26px_2px_rgba(0,_0,_0,_0.1)] p-6 md:p-8 space-y-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5">
                    <div>
                        <h2 className="text-xl md:text-3xl font-black text-[var(--color-text-main)] flex items-center gap-3">
                            <div className="p-3 bg-[var(--color-primary)]/10 rounded-2xl text-[var(--color-primary)]">
                                <Users size={26} />
                            </div>
                            والدین کی فہرست
                        </h2>
                        <p className="text-[var(--color-text-muted)] text-xs font-bold mt-2 mr-14">کل اندراجات: {filteredParents.length}</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="bg-[var(--color-bg)] rounded-[2.5rem] border border-[var(--color-border)] p-5 md:p-6 space-y-5">
                    <div className="flex items-center justify-between gap-4">
                        <h3 className="text-lg md:text-xl font-black text-[var(--color-text-main)]">
                            {editingParentId ? 'والدین کی تفصیل تبدیل کریں' : 'والدین شامل کریں'}
                        </h3>
                        <div className="flex items-center gap-3">
                            {editingParentId ? (
                                <button type="button" onClick={resetForm} className="px-4 py-3 rounded-2xl border border-[var(--color-border)] text-[var(--color-text-main)] font-bold">
                                    منسوخ کریں
                                </button>
                            ) : null}
                            <button type="submit" className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-[var(--color-primary)] text-[#06211a] font-black shadow-lg shadow-[var(--color-primary)]/20">
                                <Plus size={18} /> {editingParentId ? 'اپڈیٹ کریں' : 'شامل کریں'}
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                        <InputField label="والدین کا نام" value={formValues.fullName} onChange={(event) => handleChange('fullName', event.target.value)} placeholder="نام درج کریں" />
                        <InputField label="فون نمبر" value={formValues.phone} onChange={(event) => handleChange('phone', event.target.value)} placeholder="0300-0000000" />
                        <InputField label="پیشہ" value={formValues.occupation} onChange={(event) => handleChange('occupation', event.target.value)} placeholder="پیشہ درج کریں" />
                        <InputField label="پتہ" value={formValues.address} onChange={(event) => handleChange('address', event.target.value)} placeholder="گھر کا پتہ درج کریں" />
                        <InputField label="ای میل" value={formValues.email} onChange={(event) => handleChange('email', event.target.value)} placeholder="example@email.com" />
                        <InputField label="CNIC" value={formValues.cnic} onChange={(event) => handleChange('cnic', event.target.value)} placeholder="42101-1234567-1" />
                    </div>

                    {error ? <MessageBox tone="error" message={error} /> : null}
                    {success ? <MessageBox tone="success" message={success} /> : null}
                </form>
            </div>

            <div className="bg-[var(--color-surface)] rounded-[3rem] border border-[var(--color-border)] shadow-[2px_6px_26px_2px_rgba(0,_0,_0,_0.08)] overflow-hidden">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 px-6 md:px-8 py-5 border-b border-[var(--color-border)] bg-[var(--color-bg)]">
                    <h3 className="text-lg md:text-xl font-black text-[var(--color-text-main)]">والدین کی فہرست</h3>
                    <div className="relative w-full md:max-w-md group">
                        <Search size={18} className="absolute right-5 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] group-focus-within:text-[var(--color-primary)] transition-colors" />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(event) => setSearchTerm(event.target.value)}
                            placeholder="والدین یا فون نمبر سے تلاش کریں..."
                            className="w-full pr-14 pl-6 py-4 bg-[var(--color-input)] border border-[var(--color-border)] rounded-2xl outline-none font-bold text-sm text-[var(--color-text-main)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-primary)]/50"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full min-w-[1100px] text-right">
                        <thead className="bg-[var(--color-input)]/50 border-b border-[var(--color-border)]">
                            <tr>
                                <th className="p-5 text-[14px] font-black text-[var(--color-text-muted)] uppercase tracking-widest">والدین</th>
                                <th className="p-5 text-[14px] font-black text-[var(--color-text-muted)] uppercase tracking-widest">فون نمبر</th>
                                <th className="p-5 text-[14px] font-black text-[var(--color-text-muted)] uppercase tracking-widest">پیشہ</th>
                                <th className="p-5 text-[14px] font-black text-[var(--color-text-muted)] uppercase tracking-widest">پتہ</th>
                                <th className="p-5 text-[14px] font-black text-[var(--color-text-muted)] uppercase tracking-widest">منسلک طلباء</th>
                                <th className="p-5 text-[14px] font-black text-[var(--color-text-muted)] uppercase tracking-widest text-center">ایکشن</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--color-border)]">
                            {filteredParents.map((parent) => (
                                <tr key={parent.id} className="hover:bg-white/[0.02] transition-colors">
                                    <td className="p-5">
                                        <div className="font-black text-[var(--color-text-main)]">{parent.fullName || '---'}</div>
                                        <div className="text-xs font-bold text-[var(--color-text-muted)] mt-1">{parent.email || '---'}</div>
                                    </td>
                                    <td className="p-5 text-sm font-bold text-[var(--color-text-main)]">{parent.phone || '---'}</td>
                                    <td className="p-5 text-sm font-bold text-[var(--color-text-muted)]">{parent.occupation || '---'}</td>
                                    <td className="p-5 text-sm font-bold text-[var(--color-text-muted)] max-w-[200px] truncate" title={parent.address}>{parent.address || '---'}</td>
                                    <td className="p-5 text-sm font-bold text-[var(--color-text-main)]">{parent.students?.length || 0}</td>
                                    <td className="p-5">
                                        <div className="flex items-center justify-center gap-2">
                                            <button type="button" onClick={() => navigate(`/students/parents/profile/${parent.id}`)} className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500 hover:text-white transition-all">
                                                <Eye size={16} />
                                            </button>
                                            <button type="button" onClick={() => handleEdit(parent)} className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400 hover:bg-blue-500 hover:text-white transition-all">
                                                <Pencil size={16} />
                                            </button>
                                            <button type="button" onClick={() => handleDelete(parent.id)} className="p-2.5 rounded-xl bg-rose-500/10 text-rose-400 hover:bg-rose-500 hover:text-white transition-all">
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

const MessageBox = ({ tone, message }) => (
    <div className={`rounded-2xl px-4 py-3 text-sm font-bold ${tone === 'error' ? 'border border-red-500/20 bg-red-500/10 text-red-400' : 'border border-emerald-500/20 bg-emerald-500/10 text-emerald-400'}`}>
        {message}
    </div>
);
