import React, { useEffect, useMemo, useState } from 'react';
import { ArrowRight, CheckCircle, Clock, CreditCard, Printer, Wallet } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { getStudentFeeById, getStudentFeeHistory, saveStudentFeePayment } from '../../../Constant/StudentFeesApi';
import { useNotificationBridge } from '../../../Components/Notifications/useNotificationBridge';

const monthNames = ['جنوری', 'فروری', 'مارچ', 'اپریل', 'مئی', 'جون', 'جولائی', 'اگست', 'ستمبر', 'اکتوبر', 'نومبر', 'دسمبر'];
const toMoney = (value) => Number(value || 0).toLocaleString('en-PK');
const getAssignment = (student) => student?.assignments?.[0] || {};

const statusInfo = {
    paid: { label: 'ادا شدہ', className: 'bg-emerald-500/10 text-emerald-500', icon: CheckCircle },
    partial: { label: 'جزوی ادا', className: 'bg-amber-500/10 text-amber-500', icon: Clock },
    unpaid: { label: 'بقایاجات', className: 'bg-rose-500/10 text-rose-500', icon: Clock },
};

export const StudentFeeDetail = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const [student, setStudent] = useState(null);
    const [vouchers, setVouchers] = useState([]);
    const [activeVoucher, setActiveVoucher] = useState(null);
    const [paymentAmount, setPaymentAmount] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('Cash');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    useNotificationBridge({ error, success });

    const loadDetail = async () => {
        setIsLoading(true);
        setError('');

        try {
            const voucher = await getStudentFeeById(id);
            const history = await getStudentFeeHistory(voucher.student?.id);
            setActiveVoucher(voucher);
            setStudent(history.student);
            setVouchers(history.vouchers || []);
            setPaymentAmount(String(Number(voucher.dueAmount || 0)));
            setPaymentMethod(voucher.paymentMethod || 'Cash');
        } catch (loadError) {
            setError(loadError.message || 'فیس تفصیل لوڈ نہیں ہو سکی۔');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        window.scrollTo(0, 0);
        loadDetail();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    const totals = useMemo(
        () => ({
            total: vouchers.reduce((sum, item) => sum + Number(item.totalAmount || 0), 0),
            paid: vouchers.reduce((sum, item) => sum + Number(item.paidAmount || 0), 0),
            due: vouchers.reduce((sum, item) => sum + Number(item.dueAmount || 0), 0),
        }),
        [vouchers],
    );

    const handleSavePayment = async () => {
        if (!activeVoucher) return;
        if (paymentAmount === '') {
            setError('ادا شدہ رقم درج کریں۔');
            return;
        }

        try {
            const updated = await saveStudentFeePayment(activeVoucher.id, {
                paidAmount: Number(paymentAmount || 0),
                paidDate: new Date().toISOString().slice(0, 10),
                paymentMethod,
            });
            setSuccess('ادائیگی محفوظ ہو گئی۔');
            setActiveVoucher(updated);
            await loadDetail();
        } catch (paymentError) {
            setError(paymentError.message || 'ادائیگی محفوظ نہیں ہو سکی۔');
        }
    };

    if (isLoading) {
        return <div className="min-h-screen bg-[var(--color-bg)] p-6 text-[var(--color-text-muted)] font-bold">فیس تفصیل لوڈ ہو رہی ہے...</div>;
    }

    const assignment = getAssignment(student);

    return (
        <div dir="rtl" className="min-h-screen bg-[var(--color-bg)] p-4 md:p-8 font-urdu text-[var(--color-text-main)]">
            <div className="mx-auto max-w-6xl space-y-6">
                <div className="flex items-center justify-between">
                    <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-[var(--color-text-muted)] transition-all hover:text-[var(--color-primary)]">
                        <ArrowRight size={20} /> واپس جائیں
                    </button>
                    <h2 className="text-xl font-black">طالب علم فیس پروفائل</h2>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <div className="rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-sm md:col-span-2">
                        <p className="text-xs font-black text-[var(--color-text-muted)]">طالب علم</p>
                        <h3 className="mt-2 text-3xl font-black">{student?.fullName}</h3>
                        <p className="mt-2 text-sm font-bold text-[var(--color-text-muted)]">
                            {student?.admissionNumber} - ولدیت: {student?.fatherName}
                        </p>
                        <p className="mt-2 text-sm font-bold text-[var(--color-primary)]">
                            {assignment.class?.name || '---'} / {assignment.section?.name || '---'} / {assignment.session?.name || '---'}
                        </p>
                    </div>
                    <div className="rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className="rounded-2xl bg-rose-500/10 p-3 text-rose-500"><Wallet size={28} /></div>
                            <div>
                                <p className="text-xs font-black text-[var(--color-text-muted)]">کل بقایا</p>
                                <h3 className="mt-1 text-3xl font-black text-rose-500">Rs {toMoney(totals.due)}</h3>
                            </div>
                        </div>
                    </div>
                </div>

                {activeVoucher ? (
                    <div className="rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-sm">
                        <div className="mb-5 flex items-center gap-2 text-[var(--color-primary)]">
                            <CreditCard size={20} />
                            <h3 className="font-black">موجودہ واؤچر ادائیگی</h3>
                        </div>
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-5">
                            <Info label="واؤچر" value={activeVoucher.voucherNo} />
                            <Info label="مہینہ" value={`${monthNames[activeVoucher.feeMonth - 1]} ${activeVoucher.feeYear}`} />
                            <Info label="کل رقم" value={`Rs ${toMoney(activeVoucher.totalAmount)}`} />
                            <Info label="بقایا" value={`Rs ${toMoney(activeVoucher.dueAmount)}`} />
                            <Info label="اسٹیٹس" value={statusInfo[activeVoucher.status]?.label || activeVoucher.status} />
                        </div>
                        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-4">
                            <Field label="ادا شدہ رقم" type="number" value={paymentAmount} onChange={setPaymentAmount} required />
                            <Select label="ادائیگی کا طریقہ" value={paymentMethod} onChange={setPaymentMethod}>
                                <option value="Cash">Cash</option>
                                <option value="Online">Online</option>
                                <option value="Cheque">Cheque</option>
                                <option value="Bank Transfer">Bank Transfer</option>
                            </Select>
                            <button onClick={handleSavePayment} className="h-12 self-end rounded-2xl bg-[var(--color-primary)] px-5 font-black text-white">محفوظ کریں</button>
                            <button onClick={() => window.print()} className="flex h-12 items-center justify-center gap-2 self-end rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] px-5 font-black">
                                <Printer size={16} /> پرنٹ
                            </button>
                        </div>
                    </div>
                ) : null}

                <div className="rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-sm">
                    <div className="mb-4 flex items-center justify-between px-2">
                        <h3 className="text-lg font-black">سابقہ ریکارڈ</h3>
                        <div className="text-xs font-bold text-[var(--color-text-muted)]">کل: Rs {toMoney(totals.total)} / وصول: Rs {toMoney(totals.paid)}</div>
                    </div>
                    <div className="space-y-3">
                        {vouchers.map((voucher) => {
                            const StatusIcon = statusInfo[voucher.status]?.icon || Clock;
                            return (
                                <div key={voucher.id} className="flex flex-col gap-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] p-4 md:flex-row md:items-center md:justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className={`rounded-xl p-2.5 ${statusInfo[voucher.status]?.className || statusInfo.unpaid.className}`}>
                                            <StatusIcon size={22} />
                                        </div>
                                        <div>
                                            <h4 className="font-black">{monthNames[voucher.feeMonth - 1]} {voucher.feeYear}</h4>
                                            <p className="mt-1 text-xs font-bold text-[var(--color-text-muted)]">{voucher.voucherNo}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-5 text-sm font-bold">
                                        <span>کل: Rs {toMoney(voucher.totalAmount)}</span>
                                        <span className="text-emerald-500">ادا: Rs {toMoney(voucher.paidAmount)}</span>
                                        <span className="text-rose-500">باقی: Rs {toMoney(voucher.dueAmount)}</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};

const Info = ({ label, value }) => (
    <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] p-4">
        <p className="text-xs font-black text-[var(--color-text-muted)]">{label}</p>
        <p className="mt-2 text-sm font-black">{value || '---'}</p>
    </div>
);

const Field = ({ label, value, onChange, type = 'text', required = false }) => (
    <label className="block space-y-2">
        <span className="mr-1 text-xs font-black text-[var(--color-text-muted)]">{label}{required ? <span className="text-red-500"> *</span> : null}</span>
        <input type={type} value={value} onChange={(event) => onChange(event.target.value)} required={required} className="h-12 w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 text-sm font-bold outline-none" />
    </label>
);

const Select = ({ label, value, onChange, children }) => (
    <label className="block space-y-2">
        <span className="mr-1 text-xs font-black text-[var(--color-text-muted)]">{label}</span>
        <select value={value} onChange={(event) => onChange(event.target.value)} className="h-12 w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 text-sm font-bold outline-none">
            {children}
        </select>
    </label>
);
