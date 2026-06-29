import React, { useEffect, useState } from 'react';
import { Save, Copy, Plus, Trash2, User, Wallet, FileText, Printer, CheckCircle } from 'lucide-react';
/* eslint-disable-next-line no-unused-vars */
import { motion, AnimatePresence } from 'framer-motion';
import { BankSearchField, DateField, InputField } from '../../../../Components/HR/FormElements';
import { pakistanBanks } from '../../../../Constant/AllBanks';
import {AppImages} from '../../../../Constant/AppImages'
import { useNotificationBridge } from '../../../../Components/Notifications/useNotificationBridge';
import { createFundCollection, getFundCollections } from '../../../../Constant/FundCollectionsApi';
import { getAdminSession, getApiAssetUrl } from '../../../../Constant/AdminAuth';
import { printFundReceipt } from '../../../../Utils/FundReceiptPrint';
import { createClientId } from '../../../../Utils/createClientId';

const donationTypes = {
    'صدقات واجبہ': ['زکوٰۃ', 'فطرہ', 'فدیہ', 'کفارہ', 'عشر', 'قربانی', 'نذر'],
    'صدقات نافلہ': ['صدقہ', 'عطیہ', 'تعمیرات', 'تعلیمی فنڈ', 'افطار', 'قرآن فنڈ', 'عام تعاون'],
};

const createFundEntry = () => ({
    id: createClientId(),
    paymentMode: 'نقد',
    donationType: 'صدقات واجبہ',
    donationSubType: 'زکوٰۃ',
    amount: '',
    purpose: '',
    receiptNo: '',
    details: '',
    bankName: '',
    branchCode: '',
    chequeNo: '',
    chequeDate: new Date().toISOString().split('T')[0]
});

const getPaymentModeLabel = (mode) => {
    return mode;
};

const parseAmount = (value) => Number(String(value || '').replace(/,/g, '')) || 0;

const formatAmount = (value) => parseAmount(value).toLocaleString('en-US');

const formatAmountInput = (value) => {
    const cleaned = String(value || '').replace(/,/g, '').replace(/[^\d.]/g, '');
    const [wholePart, ...decimalParts] = cleaned.split('.');
    const whole = wholePart.replace(/^0+(?=\d)/, '');
    const formattedWhole = whole ? Number(whole).toLocaleString('en-US') : '';
    const decimal = decimalParts.length ? `.${decimalParts.join('').slice(0, 2)}` : cleaned.includes('.') ? '.' : '';
    return `${formattedWhole}${decimal}`;
};

const normalizeContactNumber = (value) => String(value || '').replace(/[\s-]/g, '');

const isValidContactNumber = (value) => /^(03\d{9}|\+923\d{9}|923\d{9})$/.test(normalizeContactNumber(value));

const formatContactInput = (value) => String(value || '').replace(/[^\d+]/g, '').slice(0, 13);

export const FundCollection = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [donorInfo, setDonorInfo] = useState({ name: '', careOf: '', number: '' });
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useNotificationBridge({ error, success });

    const [funds, setFunds] = useState(() => [createFundEntry()]);

    useEffect(() => {
        const contactNumber = normalizeContactNumber(donorInfo.number);
        if (!isValidContactNumber(contactNumber)) return undefined;

        let isCancelled = false;
        const timer = window.setTimeout(async () => {
            try {
                const data = await getFundCollections(`search=${encodeURIComponent(contactNumber)}&page=1&limit=5`);
                if (isCancelled) return;

                const matchedEntry = (data.items || []).find((item) => normalizeContactNumber(item.phone) === contactNumber);
                if (!matchedEntry) return;

                setDonorInfo((prev) => {
                    if (normalizeContactNumber(prev.number) !== contactNumber) return prev;
                    return {
                        ...prev,
                        name: matchedEntry.donorName || prev.name,
                        careOf: matchedEntry.careOf || prev.careOf,
                    };
                });
            } catch {
                // Search is helpful, not mandatory; save validation handles real errors.
            }
        }, 450);

        return () => {
            isCancelled = true;
            window.clearTimeout(timer);
        };
    }, [donorInfo.number]);

    const handleAddFund = () => setFunds([...funds, createFundEntry()]);
    const handleCopyFund = (index) => setFunds([...funds, { ...funds[index], id: createClientId() }]);
    const removeFund = (id) => { if (funds.length > 1) setFunds(funds.filter(f => f.id !== id)); };

    const updateFund = (index, field, value) => {
        const newFunds = [...funds];
        newFunds[index][field] = value;
        if (field === 'donationType') {
            newFunds[index].donationSubType = donationTypes[value]?.[0] || '';
        }
        setFunds(newFunds);
    };

    const buildRemarks = (fund) => {
        const details = [
            donorInfo.name ? `نام دہندہ: ${donorInfo.name}` : '',
            donorInfo.careOf ? `ولدیت: ${donorInfo.careOf}` : '',
            donorInfo.number ? `فون نمبر: ${donorInfo.number}` : '',
            fund.paymentMode ? `ادائیگی: ${getPaymentModeLabel(fund.paymentMode)}` : '',
            fund.donationType ? `عطیہ کی قسم: ${fund.donationType}` : '',
            fund.donationSubType ? `ذیلی قسم: ${fund.donationSubType}` : '',
            fund.purpose ? `مقصد: ${fund.purpose}` : '',
            fund.receiptNo ? `رسید نمبر: ${fund.receiptNo}` : '',
            fund.details ? `تفصیل: ${fund.details}` : '',
            fund.bankName ? `بینک: ${fund.bankName}` : '',
            fund.branchCode ? `برانچ کوڈ: ${fund.branchCode}` : '',
            fund.chequeNo ? `چیک نمبر: ${fund.chequeNo}` : '',
        ].filter(Boolean);

        return details.join(' | ').slice(0, 255);
    };

    // eslint-disable-next-line no-unused-vars
    const handlePrint = () => {
        const printWindow = window.open('', '_blank');
        const session = getAdminSession();
        const madrassaProfile = session?.madrassaProfile || {};
        const madrassaName = madrassaProfile.name || 'دارالعلوم المحمدیہ';
        const profileLogo = madrassaProfile.logoUrl ? getApiAssetUrl(madrassaProfile.logoUrl) : '';
        const receiptLogo = profileLogo || new URL(AppImages.logo, window.location.origin).toString();
        const totalAmount = funds.reduce((acc, curr) => acc + parseAmount(curr.amount), 0);
        const currentDate = new Date().toLocaleDateString('en-GB');
        const currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const cashTotal = funds.filter(f => f.paymentMode === 'نقد').reduce((a, b) => a + parseAmount(b.amount), 0);
        const chequeTotal = funds.filter(f => f.paymentMode === 'چیک').reduce((a, b) => a + parseAmount(b.amount), 0);
        const onlineTotal = funds.filter(f => f.paymentMode === 'آن لائن').reduce((a, b) => a + parseAmount(b.amount), 0);

        printWindow.document.write(`
        <html dir="rtl">
            <head>
                <title>رسید</title>
                <script src="https://cdn.tailwindcss.com"></script>
                <style>
                    @font-face { font-family: 'Jameel Noori Nastaleeq'; src: url('/fonts/JameelNooriNastaleeq.ttf') format('truetype'); font-weight: 400 700; font-style: normal; font-display: swap; }
                    
                    @page { 
                        size: A5; 
                        margin: 0; 
                    }
                    body { 
                        margin: 0; 
                        padding: 0; 
                        -webkit-print-color-adjust: exact; 
                    }
                    .urdu-font { font-family: 'Jameel Noori Nastaleeq', 'Noto Nastaliq Urdu', serif; }
                    
                    /* A5 dimensions constraint */
                 .a5-page {
  width: 148mm;
  min-height: 210mm;
  padding: 10mm;
  margin: auto;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  background: white;
  position: relative;
}
                </style>
            </head>
            <body class="bg-gray-100">
                <div class="a5-page shadow-lg relative">
                    <div class="flex justify-between text-[8px] text-gray-500 mb-2">
                        <span>وقتِ پرنٹ: ${currentDate} | ${currentTime}</span>
                        <span dir="ltr">ID: ${donorInfo.name ? donorInfo.name.substring(0, 5) : '---'}</span>
                    </div>
                    <div>
                       <div class="relative text-center mb-4 border-b-2 border-green-700 pb-3">
                             <img 
                                src="${receiptLogo}" 
                                alt="مدرسہ لوگو" 
                                class="w-14 h-14 object-contain mx-auto mb-2"
                             />
                             <h1 class="urdu-font text-xl font-bold text-green-800">${madrassaName}</h1>
                             <span class="mt-3 urdu-font text-xs bg-green-700 text-white px-3 py-3 rounded-full inline-block mt-1">الیکٹرانک رسیدِ عطیات</span>
                        </div>
                    </div>
                    <div class="absolute inset-0 flex items-center justify-center pointer-events-none select-none z-0">
                        <img 
                             src="${receiptLogo}" 
                             alt="مدرسہ لوگو" 
                             class="w-1/2 opacity-5 -rotate-12 object-contain"
                          />
                    </div>

                    <div class="grid grid-cols-2 gap-2 mb-3">
                        <div class="border border-green-200 bg-green-50 p-2 rounded-lg flex flex-row items-center">
                            <p class="urdu-font text-[10px] text-green-700">نام دہندہ:</p>
                            <p class="urdu-font text-xs font-bold mr-4">${donorInfo.name || '---'}</p>
                        </div>
                        <div class="border border-green-200 bg-green-50 p-2 rounded-lg flex flex-row items-center">
                            <p class="urdu-font text-[10px] text-green-700">فون نمبر:</p>
                            <p class="text-xs font-bold" dir="ltr mr-4">${donorInfo.number || '---'}</p>
                        </div>
                    </div>

                  <div class="fund-section flex-1 flex items-center">
  <table class="w-full text-right border-collapse">
                            <thead>
                                <tr class="bg-green-700 text-white urdu-font text-[10px]">
                                    <th class="p-1 border border-green-800 text-center">شمار</th>
                                    <th class="p-1 border border-green-800">نوعیت</th>
                                    <th class="p-1 border border-green-800 text-center">طریقہ</th>
                                    <th class="p-1 border border-green-800 text-center">رقم</th>
                                </tr>
                            </thead>
                            <tbody class="urdu-font text-[10px]">
                                ${funds.map((f, i) => `
                                    <tr class="border-b border-gray-200">
                                        <td class="p-1 text-center border-x">${i + 1}</td>
                                        <td class="p-1 border-x">${f.donationType} - ${f.donationSubType}</td>
                                        <td class="p-1 text-center border-x">${getPaymentModeLabel(f.paymentMode)}</td>
                                        <td class="p-1 text-center font-bold border-x">${formatAmount(f.amount)}/-</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>

                    <div class="mt-4 border-t border-dashed border-gray-400 pt-3">
                        <div class="flex justify-between items-start gap-4">
                            <div class="w-1/2">
                                <table class="w-full text-[10px] border border-gray-300">
                                    <tr class="bg-gray-50 border-b">
                                        <td class="p-1 border-l urdu-font text-center font-bold">نقد</td>
                                        <td class="p-1 border-l urdu-font text-center font-bold">چیک</td>
                                        <td class="p-1 border-l urdu-font text-center font-bold">آن لائن</td>
                                        <td class="p-1 urdu-font text-center font-bold bg-green-50 text-green-800">میزان کل</td>
                                    </tr>
                                    <tr>
                                        <td class="p-1 border-l text-center">${formatAmount(cashTotal)}/-</td>
                                        <td class="p-1 border-l text-center">${formatAmount(chequeTotal)}/-</td>
                                        <td class="p-1 border-l text-center">${formatAmount(onlineTotal)}/-</td>
                                        <td class="p-1 text-center font-extrabold text-sm bg-green-100 text-green-900">${formatAmount(totalAmount)}/-</td>
                                    </tr>
                                </table>
                            </div>

                            <div class="w-1/2 urdu-font text-[10px] space-y-4 pt-2">
                                <div class="flex justify-between border-b border-black pb-1">
                                    <span>دستخط دہندہ:</span>
                                    <span></span>
                                </div>
                                <div class="flex justify-between border-b border-black pb-1">
                                    <span>دستخط وصول کنندہ:</span>
                                    <span></span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="mt-4 bg-green-800 text-white p-2 rounded-lg text-center">
                        <p class="urdu-font text-[9px] leading-relaxed">
                            آپ کا شکریہ
                        </p>
                    </div>
                </div>

                <script>
                    window.onload = () => {
                        window.print();
                        window.onafterprint = () => window.close();
                    };
                </script>
            </body>
        </html>
    `);
        printWindow.document.close();
    };

    const handleFinalSave = async (shouldPrint) => {
        if (!isValidContactNumber(donorInfo.number)) {
            setError('براہ کرم درست رابطہ نمبر درج کریں، مثلاً 03001234567۔');
            return;
        }

        if (!donorInfo.name.trim()) {
            setError('براہ کرم نام دہندہ درج کریں۔');
            return;
        }

        const invalidFund = funds.find((fund) => !fund.donationType || !fund.donationSubType || !parseAmount(fund.amount));
        if (invalidFund) {
            setError('براہ کرم ہر فنڈ میں عطیہ کی قسم، ذیلی قسم اور رقم درج کریں۔');
            return;
        }

        try {
            setIsSaving(true);
            setError('');
            const collectionGroupId = `FG-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

            await Promise.all(
                funds.map((fund) =>
                    createFundCollection({
                        collectionGroupId,
                        donorName: donorInfo.name.trim(),
                        careOf: donorInfo.careOf.trim(),
                        phone: normalizeContactNumber(donorInfo.number),
                        paymentMode: fund.paymentMode,
                        donationType: fund.donationType,
                        donationSubType: fund.donationSubType,
                        purpose: fund.purpose.trim(),
                        amount: parseAmount(fund.amount),
                        receiptNo: fund.receiptNo.trim(),
                        details: fund.details.trim(),
                        paymentDate: fund.chequeDate || new Date().toISOString().split('T')[0],
                        remarks: buildRemarks(fund),
                    })
                )
            );

            setIsModalOpen(false);
            setSuccess('فنڈ وصولی کامیابی سے محفوظ ہو گئی۔');
            if (shouldPrint) {
                printFundReceipt({
                    donorInfo,
                    collectionGroupId,
                    funds: funds.map((fund) => ({
                        ...fund,
                        collectionGroupId,
                        donorName: donorInfo.name.trim(),
                        careOf: donorInfo.careOf.trim(),
                        phone: normalizeContactNumber(donorInfo.number),
                        amount: parseAmount(fund.amount),
                        paymentDate: fund.chequeDate || new Date().toISOString().split('T')[0],
                    })),
                });
            }
            setFunds([createFundEntry()]);
            setDonorInfo({ name: '', careOf: '', number: '' });
        } catch (err) {
            setError(err?.message || 'فنڈ وصولی محفوظ نہیں ہو سکی۔');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div dir="rtl" className="min-h-screen bg-[var(--color-bg)] md:p-8 font-urdu">
            <div className="max-w-6xl mx-auto space-y-6">

                {/* Header - ORIGINAL UI */}
                <div className="flex items-center gap-3 mb-8">
                    <div className="p-3 rounded-2xl bg-[var(--color-primary)] text-white shadow-lg shadow-[var(--color-primary)]/20">
                        <Wallet size={28} />
                    </div>
                    <h1 className="text-3xl font-bold text-[var(--color-text-main)]">فنڈ کلیکشن فارم</h1>
                </div>

                {/* Section 1: Personal Info - ORIGINAL UI */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                    className="bg-[var(--color-surface)] rounded-[2rem] p-6 border border-[var(--color-border)] shadow-sm">
                    <div className="flex items-center gap-2 mb-6 border-b border-[var(--color-border)] pb-3">
                        <User className="text-[var(--color-primary)]" size={20} />
                        <h2 className="text-xl font-bold">ذاتی معلومات</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-semibold pr-2">رابطہ نمبر<span className="text-red-500"> *</span></label>
                            <input required type="text" dir="ltr" value={donorInfo.number} onChange={(e) => setDonorInfo({ ...donorInfo, number: formatContactInput(e.target.value) })} className="w-full bg-[var(--color-input)] p-3 rounded-xl border border-[var(--color-border)] focus:ring-2 focus:ring-[var(--color-primary)] outline-none text-right" placeholder="03001234567" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-semibold pr-2">نام دہندہ<span className="text-red-500"> *</span></label>
                            <input required type="text" value={donorInfo.name} onChange={(e) => setDonorInfo({ ...donorInfo, name: e.target.value })} className="w-full bg-[var(--color-input)] p-3 rounded-xl border border-[var(--color-border)] focus:ring-2 focus:ring-[var(--color-primary)] outline-none" placeholder="احمد علی..." />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-semibold pr-2">ولدیت / ولد</label>
                            <input type="text" value={donorInfo.careOf} onChange={(e) => setDonorInfo({ ...donorInfo, careOf: e.target.value })} className="w-full bg-[var(--color-input)] p-3 rounded-xl border border-[var(--color-border)] focus:ring-2 focus:ring-[var(--color-primary)] outline-none" placeholder="نام..." />
                        </div>
                    </div>
                </motion.div>

                {/* Section 2: Fund Info - ORIGINAL UI */}
                <AnimatePresence>
                    {funds.map((fund, index) => (
                        <motion.div key={fund.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, x: 50 }}
                            className="bg-[var(--color-surface)] rounded-[2rem] p-6 border-2 border-[var(--color-primary)]/10 shadow-md relative"
                        >
                            <div className="flex justify-between items-center mb-6 border-b border-[var(--color-border)] pb-3">
                                <div className="flex items-center gap-2">
                                    <FileText className="text-[var(--color-primary)]" size={20} />
                                    <h2 className="text-xl font-bold text-[var(--color-primary)]">فنڈ کی تفصیلات #{index + 1}</h2>
                                </div>
                                <div className="flex gap-2">
                                    <InputField type='file' placeholder='تصویر منتضب فرمائے' />
                                    <button onClick={() => handleCopyFund(index)} className="p-2 hover:bg-blue-500/10 text-blue-500 rounded-lg transition-all"><Copy size={20} /></button>
                                    {funds.length > 1 && <button onClick={() => removeFund(fund.id)} className="p-2 hover:bg-red-500/10 text-red-500 rounded-lg transition-all"><Trash2 size={20} /></button>}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold">ادائیگی کا طریقہ<span className="text-red-500"> *</span></label>
                                    <select required value={fund.paymentMode} onChange={(e) => updateFund(index, 'paymentMode', e.target.value)} className="w-full bg-[var(--color-input)] p-3 rounded-xl border border-[var(--color-border)] outline-none">
                                        <option value="نقد">نقد</option>
                                        <option value="چیک">چیک</option>
                                        <option value="آن لائن">آن لائن</option>

                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold">عطیہ کی قسم<span className="text-red-500"> *</span></label>
                                    <select required value={fund.donationType} onChange={(e) => updateFund(index, 'donationType', e.target.value)} className="w-full bg-[var(--color-input)] p-3 rounded-xl border border-[var(--color-border)] outline-none">
                                        {Object.keys(donationTypes).map((type) => (
                                            <option key={type} value={type}>{type}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold">عطیہ کی ذیلی قسم<span className="text-red-500"> *</span></label>
                                    <select required value={fund.donationSubType} onChange={(e) => updateFund(index, 'donationSubType', e.target.value)} className="w-full bg-[var(--color-input)] p-3 rounded-xl border border-[var(--color-border)] outline-none">
                                        {(donationTypes[fund.donationType] || []).map((subType) => (
                                            <option key={subType} value={subType}>{subType}</option>
                                        ))}
                                    </select>
                                </div>
                                <InputField label='مقصد' placeholder="مثلاً مدرسہ، تعمیرات، طلبہ..." value={fund.purpose} onChange={(e) => updateFund(index, 'purpose', e.target.value)} />
                                <InputField label='رقم' required placeholder="00,000" type="text" value={fund.amount} onChange={(e) => updateFund(index, 'amount', formatAmountInput(e.target.value))} />
                                <InputField label="رسید نمبر" placeholder="R-101" value={fund.receiptNo} onChange={(e) => updateFund(index, 'receiptNo', e.target.value)} />
                                <div className="space-y-2 lg:col-span-3">
                                    <InputField label='تفصیل' placeholder="اضافی تفصیل درج کریں..." value={fund.details} onChange={(e) => updateFund(index, 'details', e.target.value)} />
                                </div>
                            </div>

                            {fund.paymentMode === 'چیک' && (
                                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                                    className="mt-6 p-4 bg-[var(--color-surface)] rounded-2xl border border-blue-200 grid grid-cols-1 md:grid-cols-4 gap-4">
                                    <BankSearchField label=" بینک کا نام" value={fund.bankName} options={pakistanBanks} isDark={true} onSelect={(bank) => updateFund(index, 'bankName', bank)} onChange={(val) => updateFund(index, 'bankName', val)} />
                                    <InputField label='برانچ کوڈ' type="number" placeholder="0021" value={fund.branchCode} onChange={(e) => updateFund(index, 'branchCode', e.target.value)} />
                                    <InputField label='چیک نمبر' type="number" placeholder="0021000" value={fund.chequeNo} onChange={(e) => updateFund(index, 'chequeNo', e.target.value)} />
                                    <DateField label='تاریخ' value={fund.chequeDate} onChange={(e) => updateFund(index, 'chequeDate', e.target.value)} />
                                </motion.div>
                            )}
                        </motion.div>
                    ))}
                </AnimatePresence>

                {/* Buttons - ORIGINAL UI */}
                <div className="flex flex-wrap gap-4 pt-4">
                    <button onClick={handleAddFund} className="flex-1 min-w-[150px] bg-[var(--color-input)] text-[var(--color-text-main)] py-4 rounded-2xl border-2 border-dashed border-[var(--color-border)] hover:border-[var(--color-primary)] flex items-center justify-center gap-2 font-bold">
                        <Plus size={20} /> ایک اور فنڈ شامل کریں
                    </button>
                    <button onClick={() => setIsModalOpen(true)} disabled={isSaving} className="flex-1 min-w-[150px] bg-[var(--color-primary)] text-white py-4 rounded-2xl shadow-lg shadow-[var(--color-primary)]/20 flex items-center justify-center gap-2 font-bold transition-all hover:scale-[1.02] disabled:opacity-60 disabled:cursor-not-allowed">
                        <Save size={20} /> ڈیٹا محفوظ کریں
                    </button>
                </div>

                {/* Pop-up Modal (Added Logic) */}
                <AnimatePresence>
                    {isModalOpen && (
                        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} className="bg-white rounded-[2rem] p-8 max-w-sm w-full text-center">
                                <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4"><CheckCircle size={32} /></div>
                                <h3 className="text-xl font-bold mb-2">ڈیٹا محفوظ کریں</h3>
                                <div className="space-y-3 mt-6">
                                    <button onClick={() => handleFinalSave(true)} disabled={isSaving} className="w-full bg-[var(--color-primary)] text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"><Printer size={18} /> {isSaving ? 'محفوظ ہو رہا ہے...' : 'محفوظ اور پرنٹ کریں'}</button>
                                    <button onClick={() => handleFinalSave(false)} disabled={isSaving} className="w-full bg-gray-100 text-gray-800 py-3 rounded-xl font-bold flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"><Save size={18} /> {isSaving ? 'محفوظ ہو رہا ہے...' : 'صرف محفوظ کریں'}</button>
                                    <button onClick={() => setIsModalOpen(false)} disabled={isSaving} className="w-full text-gray-400 py-2 text-sm font-bold underline disabled:opacity-60">کینسل کریں</button>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};


