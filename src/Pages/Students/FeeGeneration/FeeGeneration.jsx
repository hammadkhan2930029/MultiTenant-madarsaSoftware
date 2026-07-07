import React, { useEffect, useMemo, useState } from 'react';
import { CheckCircle, Clock, CreditCard, Eye, Filter, Printer, ReceiptText, Search, Wallet } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getClasses, getSections, getSessions } from '../../../Constant/AcademicSetupApi';
import { generateStudentFees, getStudentFees, saveStudentFeePayment } from '../../../Constant/StudentFeesApi';
import { fetchMadrassaProfile, getAdminSession, getApiAssetUrl } from '../../../Constant/AdminAuth';
import { AppImages } from '../../../Constant/AppImages';
import { useNotificationBridge } from '../../../Components/Notifications/useNotificationBridge';
import { Can } from '../../../Components/Auth/Can';

const monthNames = [
    'جنوری',
    'فروری',
    'مارچ',
    'اپریل',
    'مئی',
    'جون',
    'جولائی',
    'اگست',
    'ستمبر',
    'اکتوبر',
    'نومبر',
    'دسمبر',
];

const currentDate = new Date();
const toMoney = (value) => Number(value || 0).toLocaleString('en-PK');
const toInputDate = (date) => new Date(date).toISOString().slice(0, 10);
const getAssignment = (voucher) => voucher?.student?.assignments?.[0] || {};

const statusConfig = {
    paid: { label: 'ادا شدہ', className: 'bg-emerald-500/10 text-emerald-500', icon: CheckCircle },
    partial: { label: 'جزوی ادا', className: 'bg-amber-500/10 text-amber-500', icon: Clock },
    unpaid: { label: 'بقایاجات', className: 'bg-rose-500/10 text-rose-500', icon: Clock },
    cancelled: { label: 'منسوخ', className: 'bg-slate-500/10 text-slate-500', icon: Clock },
};

const escapeHtml = (value) =>
    String(value ?? '')
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;');

const buildFeeReceiptHtml = ({ voucher, madrassaProfile }) => {
    const assignment = getAssignment(voucher);
    const madrassaName = madrassaProfile?.name || 'مدرسہ تعلیم القرآن';
    const logoUrl = madrassaProfile?.logoUrl ? getApiAssetUrl(madrassaProfile.logoUrl) : AppImages.logo;
    const receiptRows = [
        ['ماہانہ فیس', voucher?.monthlyFee],
        ['داخلہ فیس', voucher?.admissionFee],
        ['رعایت', voucher?.discount],
        ['جرمانہ', voucher?.fine],
        ['کل رقم', voucher?.totalAmount, true],
        ['ادا شدہ', voucher?.paidAmount],
        ['باقی', voucher?.dueAmount, true],
    ];

    return `<!doctype html>
<html lang="ur" dir="rtl">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(voucher?.voucherNo || 'Fee Receipt')}</title>
 <style>
  :root {
    --print-primary: #00d094;
    --print-primary-light: #19e0a5;
    --print-primary-dark: #00b883;
    --print-dark: #002a33;
    --print-dark-light: #004d61;
    --print-gradient: linear-gradient(
      135deg,
      #19e0a5 0%,
      #00d094 35%,
      #00b883 65%,
      #004d61 100%
    );

    --print-gradient-dark: linear-gradient(
      135deg,
      #004d61 0%,
      #003847 45%,
      #002a33 100%
    );
  
    --print-border: #d1d5db;
    --print-light-bg: rgba(0, 208, 148, 0.08);
    --print-light-bg-strong: rgba(0, 208, 148, 0.16);
    --receipt-urdu-font: "Jameel Noori Nastaleeq", "Noto Nastaliq Urdu", "Noto Naskh Arabic", "Urdu Typesetting", "Segoe UI", serif;
    --receipt-ui-font: "Noto Naskh Arabic", "Segoe UI", Tahoma, Arial, sans-serif;
    --receipt-number-font: "Inter", "Segoe UI", Arial, sans-serif;
  }

  @page {
    size: A5 portrait;
    margin: 0;
  }

  * {
    box-sizing: border-box;
  }

  html,
  body {
    margin: 0;
    padding: 0;
    width: 148mm;
    min-height: 210mm;
    background: #fff;
  }

 body {
  color: var(--print-dark);
  font-family: var(--receipt-urdu-font);
  text-rendering: optimizeLegibility;
  font-feature-settings: "kern";

  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
}

  .receipt {
    position: relative;
    width: 148mm;
    height: 210mm;
    padding: 8mm 14mm 6mm;
    overflow: hidden;
    background: #fff;
  }

  .watermark {
    position: absolute;
    left: 50%;
    top: 53%;
    width: 72mm;
    height: 72mm;
    transform: translate(-50%, -50%);
    object-fit: contain;
    opacity: 0.05;
    z-index: 1;
  }

  .content {
    position: relative;
    z-index: 2;
    height: 100%;
  }

  .header {
    min-height: 22mm;
    display: flex;
    align-items: center;
    gap: 4mm;
    border-bottom: 3px solid #00d094;
    position: relative;
  }

  .corner {
    position: absolute;
    top: -8mm;
    left: -14mm;
    width: 48mm;
    height: 14mm;
    background: var(--print-gradient);
    clip-path: polygon(0 0, 100% 0, 82% 100%, 0 100%);
    box-shadow: 0 4px 14px rgba(0, 208, 148, 0.35);
  }

  .logo {
    width: 18mm;
    height: 18mm;
    border: 1.5px solid #00d094;
    border-radius: 999px;
   
    background: #fff;
    z-index: 3;
    box-shadow: 0 0 0 3px rgba(0, 208, 148, 0.12);
  }

  .logo img {
    width: 100%;
    height: 100%;
    object-fit: contain;
     border-radius: 999px;
  }

 h1 {
  margin: 0;

  color: var(--print-dark);
  font-family: var(--receipt-urdu-font);

  font-size: 24pt;
  line-height: 1.45;
  font-weight: 900;
  letter-spacing: 0;

  text-shadow:
    0 1px 0 rgba(255,255,255,0.6),
    0 2px 12px rgba(0, 208, 148, 0.18);
}

  .school p {
  margin: 1mm 0 0;

  color: #6b7280;
  font-family: var(--receipt-ui-font);

  font-size: 8pt;
  font-weight: 700;
  letter-spacing: 0;
}

  .title {
    margin-top: 8mm;
    display: grid;
    grid-template-columns: 1fr 1.2fr 1fr;
    gap: 4mm;
    align-items: center;
    text-align: center;
  }

  .title span {
    display: block;
    color: #6b7280;
    font-size: 7.5pt;
    font-weight: 800;
  }

  .title strong {
    color: var(--print-dark);
    font-family: var(--receipt-number-font);
    font-size: 8.5pt;
  }

 h2 {
  margin: 0;
  font-family: var(--receipt-urdu-font);

  font-size: 22pt;
  line-height: 1.35;
  font-weight: 900;
  letter-spacing: 0;

  background: var(--print-gradient);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

  .title i {
    display: block;
    width: 18mm;
    height: 1.5mm;
    margin: 2mm auto 0;
    border-radius: 999px;
    background: var(--print-gradient);
  }

  .student {
    margin-top: 7mm;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 3mm 8mm;
    font-size: 8.8pt;
  }

  .student div {
    display: flex;
    justify-content: space-between;
    gap: 4mm;
    border-bottom: 1px dotted #9ca3af;
    padding-bottom: 1mm;
  }

  .student span {
    color: var(--print-dark);
    font-weight: 800;
  }

  table {
    width: 100%;
    margin-top: 7mm;
    border-collapse: collapse;
    text-align: right;
    font-size: 9pt;
    overflow: hidden;
    border-radius: 10px;
  }

  th {
   background: var(--print-gradient);
    color: #fff;
    border: 1px solid #002a33;
    padding: 2.3mm 4mm;
    font-weight: 900;
  }

  td {
    color: var(--print-dark);
    border: 1px solid #002a33;
    padding: 2.2mm 4mm;
    font-weight: 800;
    background: #fff;
  }

  tbody tr:nth-child(even) td {
    background: rgba(0, 208, 148, 0.03);
  }

  th:last-child,
  td:last-child {
    width: 36%;
    direction: ltr;
    text-align: center;
    font-family: var(--receipt-number-font);
    font-weight: 900;
  }

  tr.strong td {
    background: var(--print-light-bg-strong);
    color: var(--print-dark);
    font-weight: 900;
  }

  .signatures {
    position: absolute;
    left: 14mm;
    right: 14mm;
    bottom: 7mm;

    display: flex;
    justify-content: space-between;
    text-align: center;

    color: var(--print-dark);
    font-size: 9pt;
    font-weight: 800;
  }

  .signatures span {
    display: block;
    width: 34mm;
    border-top: 1.5px solid #002a33;
    margin-bottom: 2mm;
  }

  .signatures p {
    margin: 0;
  }

  @media print {
    html,
    body {
      width: 148mm;
      height: 210mm;
      overflow: hidden;
    }

    .receipt {
      page-break-inside: avoid;
      page-break-after: avoid;
    }
  }
</style>
</head>
<body>
  <main class="receipt">
    <img class="watermark" src="${escapeHtml(logoUrl)}" alt="" />
    <section class="content">
      <header class="header">
        <div class="corner"></div>
        <div class="logo"><img src="${escapeHtml(logoUrl)}" alt="${escapeHtml(madrassaName)}" /></div>
        <div class="school">
          <h1>${escapeHtml(madrassaName)}</h1>
          <p>${escapeHtml(madrassaProfile?.address || 'Main Campus')}</p>
        </div>
      </header>
      <section class="title">
        <div><span>رسید نمبر</span><strong>${escapeHtml(voucher?.voucherNo || '')}</strong></div>
        <div><h2>فیس رسید</h2><i></i></div>
        <div><span>تاریخ</span><strong>${escapeHtml(new Date().toLocaleDateString('ur-PK'))}</strong></div>
      </section>
      <section class="student">
        <div><span>نام:</span><strong>${escapeHtml(voucher?.student?.fullName || '')}</strong></div>
        <div><span>داخلہ نمبر:</span><strong>${escapeHtml(voucher?.student?.admissionNumber || '')}</strong></div>
        <div><span>کلاس:</span><strong>${escapeHtml(`${assignment.class?.name || ''} / ${assignment.section?.name || ''}`)}</strong></div>
        <div><span>مہینہ:</span><strong>${escapeHtml(voucher ? `${monthNames[voucher.feeMonth - 1]} ${voucher.feeYear}` : '')}</strong></div>
      </section>
      <table>
        <thead><tr><th>تفصیل</th><th>رقم</th></tr></thead>
        <tbody>
          ${receiptRows.map(([label, value, strong]) => `<tr class="${strong ? 'strong' : ''}"><td>${escapeHtml(label)}</td><td>Rs ${escapeHtml(toMoney(value))}</td></tr>`).join('')}
        </tbody>
      </table>
      <footer class="signatures">
        <div><span></span><p>کیشیئر</p></div>
        <div><span></span><p>دستخط</p></div>
      </footer>
    </section>
  </main>
</body>
</html>`;
};

export const FeesCollection = () => {
    const navigate = useNavigate();
    const [filters, setFilters] = useState({
        feeMonth: String(currentDate.getMonth() + 1),
        feeYear: String(currentDate.getFullYear()),
        sessionId: '',
        classId: '',
        sectionId: '',
        status: '',
        search: '',
        dueDate: toInputDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), 10)),
    });
    const [sessions, setSessions] = useState([]);
    const [classes, setClasses] = useState([]);
    const [sections, setSections] = useState([]);
    const [vouchers, setVouchers] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [paymentTarget, setPaymentTarget] = useState(null);
    const [paymentAmount, setPaymentAmount] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('Cash');
    const [madrassaProfile, setMadrassaProfile] = useState(() => getAdminSession()?.madrassaProfile || null);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    useNotificationBridge({ error, success });

    useEffect(() => {
        window.scrollTo(0, 0);

        const loadSetup = async () => {
            try {
                const [sessionResult, classResult, profileResult] = await Promise.all([
                    getSessions('page=1&limit=100'),
                    getClasses('page=1&limit=100'),
                    fetchMadrassaProfile().catch(() => getAdminSession()?.madrassaProfile || null),
                ]);
                setSessions(sessionResult.items || []);
                setClasses(classResult.items || []);
                setMadrassaProfile(profileResult);
            } catch (loadError) {
                setError(loadError.message || 'فیس فلٹرز لوڈ نہیں ہو سکے۔');
            }
        };

        loadSetup();
    }, []);

    useEffect(() => {
        const loadSections = async () => {
            if (!filters.classId) {
                setSections([]);
                return;
            }

            try {
                const result = await getSections(`page=1&limit=100&classId=${filters.classId}`);
                setSections(result.items || []);
            } catch (loadError) {
                setError(loadError.message || 'سیکشنز لوڈ نہیں ہو سکے۔');
            }
        };

        loadSections();
    }, [filters.classId]);

    const loadFees = async () => {
        setIsLoading(true);
        setError('');

        try {
            const params = new URLSearchParams({
                page: '1',
                limit: '200',
                feeMonth: filters.feeMonth,
                feeYear: filters.feeYear,
            });

            ['sessionId', 'classId', 'sectionId', 'status', 'search'].forEach((key) => {
                if (filters[key]) params.set(key, filters[key]);
            });

            const result = await getStudentFees(params.toString());
            setVouchers(result.items || []);
        } catch (loadError) {
            setError(loadError.message || 'فیس ریکارڈ لوڈ نہیں ہو سکا۔');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadFees();
    }, [filters.feeMonth, filters.feeYear, filters.sessionId, filters.classId, filters.sectionId, filters.status]);

    const handleFilterChange = (key, value) => {
        setFilters((prev) => {
            const next = { ...prev, [key]: value };
            if (key === 'classId') next.sectionId = '';
            return next;
        });
    };

    const handleGenerateFees = async () => {
        if (!filters.feeMonth || !filters.feeYear) {
            setError('مہینہ اور سال منتخب کریں۔');
            return;
        }

        setIsGenerating(true);
        setError('');
        setSuccess('');

        try {
            const result = await generateStudentFees({
                feeMonth: Number(filters.feeMonth),
                feeYear: Number(filters.feeYear),
                sessionId: filters.sessionId ? Number(filters.sessionId) : undefined,
                classId: filters.classId ? Number(filters.classId) : undefined,
                sectionId: filters.sectionId ? Number(filters.sectionId) : undefined,
                dueDate: filters.dueDate || undefined,
            });

            setSuccess(`فیس جنریٹ ہو گئی۔ نئے: ${result.generated}، پہلے سے موجود/چھوڑے گئے: ${result.skipped}`);
            await loadFees();
        } catch (generateError) {
            setError(generateError.message || 'فیس جنریٹ نہیں ہو سکی۔');
        } finally {
            setIsGenerating(false);
        }
    };

    const openPaymentModal = (voucher) => {
        setPaymentTarget(voucher);
        setPaymentAmount(String(Number(voucher.dueAmount || 0)));
        setPaymentMethod(voucher.paymentMethod || 'Cash');
    };

    const handleSavePayment = async () => {
        if (!paymentTarget) return;
        if (paymentAmount === '') {
            setError('ادا شدہ رقم درج کریں۔');
            return;
        }

        try {
            await saveStudentFeePayment(paymentTarget.id, {
                paidAmount: Number(paymentAmount || 0),
                paidDate: new Date().toISOString().slice(0, 10),
                paymentMethod,
            });
            setSuccess('فیس ادائیگی محفوظ ہو گئی۔');
            setPaymentTarget(null);
            await loadFees();
        } catch (paymentError) {
            setError(paymentError.message || 'ادائیگی محفوظ نہیں ہو سکی۔');
        }
    };

    const handlePrint = (voucher) => {
        if (!voucher) return;

        const printContents = buildFeeReceiptHtml({
            voucher,
            madrassaProfile,
        });

        const iframe = document.createElement('iframe');

        iframe.style.position = 'fixed';
        iframe.style.right = '0';
        iframe.style.bottom = '0';
        iframe.style.width = '0';
        iframe.style.height = '0';
        iframe.style.border = '0';

        document.body.appendChild(iframe);

        const frameDoc =
            iframe.contentWindow ||
            iframe.contentDocument?.document ||
            iframe.contentDocument;

        frameDoc.document.open();
        frameDoc.document.write(printContents);
        frameDoc.document.close();

        const cleanupPrintFrame = () => {
            if (iframe.parentNode) {
                document.body.removeChild(iframe);
            }
        };

        iframe.onload = () => {
            setTimeout(() => {
                const printWindow = iframe.contentWindow;
                if (!printWindow) {
                    cleanupPrintFrame();
                    return;
                }

                printWindow.onafterprint = cleanupPrintFrame;
                printWindow.focus();
                printWindow.print();

                setTimeout(cleanupPrintFrame, 1500);
            }, 500);
        };
    };

    const stats = useMemo(
        () => ({
            total: vouchers.length,
            paid: vouchers.filter((item) => item.status === 'paid').length,
            unpaid: vouchers.filter((item) => item.status === 'unpaid').length,
            totalAmount: vouchers.reduce((sum, item) => sum + Number(item.totalAmount || 0), 0),
            paidAmount: vouchers.reduce((sum, item) => sum + Number(item.paidAmount || 0), 0),
            dueAmount: vouchers.reduce((sum, item) => sum + Number(item.dueAmount || 0), 0),
        }),
        [vouchers],
    );

    return (
        <div dir="rtl" className="fee-page-root min-h-screen bg-[var(--color-bg)] text-[var(--color-text-main)] p-4 md:p-6 font-urdu">
            <div className="mx-auto max-w-7xl space-y-6">
                <div className="rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-sm print:hidden">
                    <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div className="flex items-center gap-3">
                            <div className="rounded-2xl bg-[var(--color-primary)]/10 p-3 text-[var(--color-primary)]">
                                <CreditCard size={26} />
                            </div>
                            <div>
                                <h1 className="text-3xl font-black">فیس جنریشن</h1>
                                <p className="mt-4 text-sm font-bold text-[var(--color-text-muted)]">ماہانہ فیس واؤچر بنائیں، ادائیگی محفوظ کریں اور رسید پرنٹ کریں</p>
                            </div>
                        </div>
                        <Can permission="fees.create">
                            <button
                                onClick={handleGenerateFees}
                                disabled={isGenerating}
                                className="rounded-2xl bg-[var(--color-primary)] px-7 py-3 text-sm font-black text-white shadow-lg shadow-[var(--color-primary)]/20 transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {isGenerating ? 'جنریٹ ہو رہی ہے...' : 'فیس جنریٹ کریں'}
                            </button>
                        </Can>
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-6">
                        <Select label="مہینہ" value={filters.feeMonth} onChange={(value) => handleFilterChange('feeMonth', value)} required>
                            {monthNames.map((month, index) => <option key={month} value={index + 1}>{month}</option>)}
                        </Select>
                        <Field label="سال" type="number" value={filters.feeYear} onChange={(value) => handleFilterChange('feeYear', value)} required />
                        <Select label="سیشن" value={filters.sessionId} onChange={(value) => handleFilterChange('sessionId', value)}>
                            <option value="">تمام</option>
                            {sessions.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                        </Select>
                        <Select label="کلاس" value={filters.classId} onChange={(value) => handleFilterChange('classId', value)}>
                            <option value="">تمام</option>
                            {classes.filter((item) => item.status === 'active').map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                        </Select>
                        <Select label="سیکشن" value={filters.sectionId} onChange={(value) => handleFilterChange('sectionId', value)}>
                            <option value="">تمام</option>
                            {sections.filter((item) => item.status === 'active').map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                        </Select>
                        <Field label="آخری تاریخ" type="date" value={filters.dueDate} onChange={(value) => handleFilterChange('dueDate', value)} />
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4 print:hidden">
                    <SummaryCard icon={ReceiptText} label="کل واؤچرز" value={stats.total} />
                    <SummaryCard icon={Wallet} label="کل رقم" value={`Rs ${toMoney(stats.totalAmount)}`} />
                    <SummaryCard icon={CheckCircle} label="وصول شدہ" value={`Rs ${toMoney(stats.paidAmount)}`} />
                    <SummaryCard icon={Clock} label="بقایاجات" value={`Rs ${toMoney(stats.dueAmount)}`} danger />
                </div>

                <div className="rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-sm print:hidden">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                        <div className="relative flex-1">
                            <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" size={18} />
                            <input
                                value={filters.search}
                                onChange={(event) => handleFilterChange('search', event.target.value)}
                                onKeyDown={(event) => {
                                    if (event.key === 'Enter') loadFees();
                                }}
                                placeholder="نام، والد کا نام، داخلہ نمبر یا فون سے تلاش کریں"
                                className="h-12 w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] pr-12 pl-4 text-sm font-bold outline-none"
                            />
                        </div>
                        <Select compact value={filters.status} onChange={(value) => handleFilterChange('status', value)}>
                            <option value="">تمام اسٹیٹس</option>
                            <option value="unpaid">بقایاجات</option>
                            <option value="partial">جزوی ادا</option>
                            <option value="paid">ادا شدہ</option>
                        </Select>
                        <button onClick={loadFees} className="flex h-12 items-center justify-center gap-2 rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] px-5 text-sm font-black">
                            <Filter size={16} /> فلٹر
                        </button>
                    </div>
                </div>

                <div className="overflow-hidden rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm print:hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[1100px] text-right">
                            <thead className="bg-[var(--color-bg)] text-xs font-black text-[var(--color-text-muted)]">
                                <tr>
                                    <th className="px-5 py-4">واؤچر</th>
                                    <th className="px-5 py-4">طالب علم</th>
                                    <th className="px-5 py-4">کلاس</th>
                                    <th className="px-5 py-4">مہینہ</th>
                                    <th className="px-5 py-4">کل رقم</th>
                                    <th className="px-5 py-4">ادا شدہ</th>
                                    <th className="px-5 py-4">بقایاجات</th>
                                    <th className="px-5 py-4 text-center">اسٹیٹس</th>
                                    <th className="px-5 py-4 text-center">ایکشن</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[var(--color-border)]">
                                {isLoading ? (
                                    <tr><td colSpan="9" className="px-5 py-10 text-center text-sm font-bold text-[var(--color-text-muted)]">فیس ریکارڈ لوڈ ہو رہا ہے...</td></tr>
                                ) : vouchers.length ? vouchers.map((voucher) => {
                                    const StatusIcon = statusConfig[voucher.status]?.icon || Clock;
                                    const assignment = getAssignment(voucher);
                                    return (
                                        <tr key={voucher.id} className="transition-colors hover:bg-[var(--color-primary)]/5">
                                            <td className="px-5 py-4 font-mono text-xs font-black text-[var(--color-primary)]">{voucher.voucherNo}</td>
                                            <td className="px-5 py-4">
                                                <div className="font-black">{voucher.student?.fullName}</div>
                                                <div className="text-xs font-bold text-[var(--color-text-muted)]">{voucher.student?.admissionNumber} - {voucher.student?.fatherName}</div>
                                            </td>
                                            <td className="px-5 py-4 text-sm font-bold text-[var(--color-text-muted)]">{assignment.class?.name || '---'} / {assignment.section?.name || '---'}</td>
                                            <td className="px-5 py-4 text-sm font-bold">{monthNames[voucher.feeMonth - 1]} {voucher.feeYear}</td>
                                            <td className="px-5 py-4 font-black">Rs {toMoney(voucher.totalAmount)}</td>
                                            <td className="px-5 py-4 font-bold text-emerald-500">Rs {toMoney(voucher.paidAmount)}</td>
                                            <td className="px-5 py-4 font-bold text-rose-500">Rs {toMoney(voucher.dueAmount)}</td>
                                            <td className="px-5 py-4 text-center">
                                                <span className={`inline-flex items-center gap-1 rounded-xl px-3 py-1.5 text-xs font-black ${statusConfig[voucher.status]?.className || statusConfig.unpaid.className}`}>
                                                    <StatusIcon size={14} /> {statusConfig[voucher.status]?.label || voucher.status}
                                                </span>
                                            </td>
                                            <td className="px-5 py-4">
                                                <div className="flex justify-center gap-2">
                                                    <button onClick={() => navigate(`/students/details/${voucher.id}`)} className="rounded-xl bg-sky-500/10 p-2.5 text-sky-500 transition-all hover:bg-sky-500 hover:text-white">
                                                        <Eye size={16} />
                                                    </button>
                                                    <Can permission="fees.create">
                                                        <button onClick={() => openPaymentModal(voucher)} className="rounded-xl bg-emerald-500/10 p-2.5 text-emerald-500 transition-all hover:bg-emerald-500 hover:text-white">
                                                            <Wallet size={16} />
                                                        </button>
                                                    </Can>
                                                    <button onClick={() => handlePrint(voucher)} className="rounded-xl bg-[var(--color-primary)]/10 p-2.5 text-[var(--color-primary)] transition-all hover:bg-[var(--color-primary)] hover:text-white">
                                                        <Printer size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                }) : (
                                    <tr><td colSpan="9" className="px-5 py-10 text-center text-sm font-bold text-[var(--color-text-muted)]">اس مہینے کا کوئی فیس واؤچر نہیں ملا۔</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {paymentTarget ? (
                <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm print:hidden">
                    <div className="w-full max-w-md rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-2xl">
                        <h3 className="text-xl font-black">فیس ادائیگی</h3>
                        <p className="mt-2 text-sm font-bold text-[var(--color-text-muted)]">{paymentTarget.student?.fullName} - {paymentTarget.voucherNo}</p>
                        <div className="mt-5 space-y-4">
                            <Field label="ادا شدہ رقم" type="number" value={paymentAmount} onChange={setPaymentAmount} required />
                            <Select label="طریقہ ادائیگی" value={paymentMethod} onChange={setPaymentMethod}>
                                <option value="Cash">Cash</option>
                                <option value="Online">Online</option>
                                <option value="Cheque">Cheque</option>
                                <option value="Bank Transfer">Bank Transfer</option>
                            </Select>
                        </div>
                        <div className="mt-6 flex gap-3">
                            <Can permission="fees.create">
                                <button onClick={handleSavePayment} className="flex-1 rounded-2xl bg-[var(--color-primary)] px-5 py-3 font-black text-white">محفوظ کریں</button>
                            </Can>
                            <button onClick={() => setPaymentTarget(null)} className="flex-1 rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] px-5 py-3 font-black">منسوخ</button>
                        </div>
                    </div>
                </div>
            ) : null}

        </div>
    );
};

const Field = ({ label, value, onChange, type = 'text', required = false }) => (
    <label className="block space-y-2">
        {label ? <span className="mr-1 text-xs font-black text-[var(--color-text-muted)]">{label}{required ? <span className="text-red-500"> *</span> : null}</span> : null}
        <input
            type={type}
            value={value}
            onChange={(event) => onChange(event.target.value)}
            required={required}
            className="h-12 w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 text-sm font-bold text-[var(--color-text-main)] outline-none"
        />
    </label>
);

const Select = ({ label, value, onChange, children, compact = false, required = false }) => (
    <label className={`block space-y-2 ${compact ? 'min-w-52' : ''}`}>
        {label ? <span className="mr-1 text-xs font-black text-[var(--color-text-muted)]">{label}{required ? <span className="text-red-500"> *</span> : null}</span> : null}
        <select
            value={value}
            onChange={(event) => onChange(event.target.value)}
            required={required}
            className="h-12 w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 text-sm font-bold text-[var(--color-text-main)] outline-none"
        >
            {children}
        </select>
    </label>
);

const SummaryCard = ({ icon, label, value, danger }) => (
    <div className="rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm">
        <div className="flex items-center justify-between">
            <div>
                <p className="text-xs font-black text-[var(--color-text-muted)]">{label}</p>
                <h3 className={`mt-2 text-2xl font-black ${danger ? 'text-rose-500' : 'text-[var(--color-text-main)]'}`}>{value}</h3>
            </div>
            <div className="rounded-2xl bg-[var(--color-primary)]/10 p-3 text-[var(--color-primary)]">
                {React.createElement(icon, { size: 24 })}
            </div>
        </div>
    </div>
);

const FeeReceipt = ({ voucher, madrassaProfile }) => {
    const assignment = getAssignment(voucher);
    const madrassaName = madrassaProfile?.name || 'مدرسہ تعلیم القرآن';
    const logoUrl = madrassaProfile?.logoUrl ? getApiAssetUrl(madrassaProfile.logoUrl) : AppImages.logo;

    return (
        <>
            <div className="fee-print-area relative hidden overflow-hidden bg-white text-black" dir="rtl">
                <img
                    src={logoUrl}
                    alt=""
                    className="fee-slip-watermark pointer-events-none absolute left-1/2 top-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 object-contain opacity-[0.055]"
                />
                <div className="relative z-10 text-center">
                    <div className="mx-auto mb-3 flex h-20 w-20 items-center justify-center rounded-2xl border border-black/10 p-2">
                        <img src={logoUrl} alt={madrassaName} className="h-full w-full object-contain" />
                    </div>
                    <h1 className="text-3xl font-black">{madrassaName}</h1>
                    <p className="mt-1 text-xs">{madrassaProfile?.address || ''}</p>
                    <p className="mt-2 text-sm font-bold">فیس رسید</p>
                    <p className="mt-2 text-xs font-bold">{voucher?.voucherNo || ''}</p>
                </div>
                <div className="relative z-10 mt-8 grid grid-cols-2 gap-4 text-sm">
                    <div>نام: <strong>{voucher?.student?.fullName || ''}</strong></div>
                    <div>داخلہ نمبر: <strong>{voucher?.student?.admissionNumber || ''}</strong></div>
                    <div>کلاس: <strong>{assignment.class?.name || ''} / {assignment.section?.name || ''}</strong></div>
                    <div>مہینہ: <strong>{voucher ? `${monthNames[voucher.feeMonth - 1]} ${voucher.feeYear}` : ''}</strong></div>
                </div>
                <table className="relative z-10 mt-8 w-full border-collapse text-center text-sm">
                    <tbody>
                        <ReceiptRow label="ماہانہ فیس" value={voucher?.monthlyFee} />
                        <ReceiptRow label="داخلہ فیس" value={voucher?.admissionFee} />
                        <ReceiptRow label="رعایت" value={voucher?.discount} />
                        <ReceiptRow label="جرمانہ" value={voucher?.fine} />
                        <ReceiptRow label="کل رقم" value={voucher?.totalAmount} strong />
                        <ReceiptRow label="ادا شدہ" value={voucher?.paidAmount} />
                        <ReceiptRow label="باقی" value={voucher?.dueAmount} strong />
                    </tbody>
                </table>
                <div className="relative z-10 mt-14 flex justify-between text-center text-sm">
                    <div><div className="mb-2 w-36 border-t border-black"></div>کیشیئر</div>
                    <div><div className="mb-2 w-36 border-t border-black"></div>دستخط</div>
                </div>
            </div>
            <style>{`
                @media print {
                    html, body, #root {
                        width: 100% !important;
                        min-height: 0 !important;
                        margin: 0 !important;
                        padding: 0 !important;
                        background: #fff !important;
                    }

                    body * {
                        visibility: hidden !important;
                    }

                    .fee-print-area,
                    .fee-print-area * {
                        visibility: visible !important;
                    }

                    .fee-page-root {
                        min-height: 0 !important;
                        margin: 0 !important;
                        padding: 0 !important;
                        background: #fff !important;
                    }

                    .fee-page-root > :not(.fee-print-area) {
                        visibility: hidden !important;
                    }

                    .fee-print-area {
                        display: block !important;
                        position: fixed !important;
                        inset: 0 auto auto 0 !important;
                        width: 148mm !important;
                        height: 210mm !important;
                        margin: 0 auto !important;
                        padding: 13mm 14mm 12mm !important;
                        box-sizing: border-box !important;
                        overflow: hidden !important;
                        border: 0 !important;
                        box-shadow: none !important;
                        page-break-after: avoid !important;
                        page-break-inside: avoid !important;
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                        font-family: "Jameel Noori Nastaleeq", "Noto Nastaliq Urdu", "Noto Naskh Arabic", serif !important;
                    }

                    .fee-print-area::before {
                        content: "";
                        position: absolute;
                        top: 0;
                        left: 0;
                        width: 45mm;
                        height: 16mm;
                        background: #1f7a83;
                        clip-path: polygon(0 0, 100% 0, 82% 100%, 0 100%);
                        z-index: 0;
                    }

                    .fee-print-area::after {
                        content: "";
                        position: absolute;
                        top: 27mm;
                        left: 14mm;
                        right: 14mm;
                        border-top: 3px solid #1f7a83;
                        z-index: 0;
                    }

                    .fee-slip-watermark {
                        display: block !important;
                    }

                    .fee-print-area > .relative {
                        position: relative !important;
                        z-index: 2 !important;
                    }

                    .fee-print-area .text-center:first-of-type {
                        min-height: 44mm;
                    }

                    .fee-print-area .text-center:first-of-type > div {
                        width: 20mm !important;
                        height: 20mm !important;
                        margin-bottom: 2mm !important;
                        border-radius: 999px !important;
                        border: 1px solid #1f7a83 !important;
                        background: #fff !important;
                    }

                    .fee-print-area h1 {
                        margin: 0 !important;
                        color: #111 !important;
                        font-size: 25pt !important;
                        font-weight: 900 !important;
                        line-height: 1.35 !important;
                    }

                    .fee-print-area .text-center:first-of-type p {
                        margin-top: 1mm !important;
                        font-size: 9pt !important;
                        color: #555 !important;
                        font-weight: 700 !important;
                    }

                    .fee-print-area .text-center:first-of-type p:nth-of-type(2) {
                        margin-top: 4mm !important;
                        color: #1f7a83 !important;
                        font-size: 20pt !important;
                        font-weight: 900 !important;
                    }

                    .fee-print-area .text-center:first-of-type p:nth-of-type(2)::after {
                        content: "";
                        display: block;
                        width: 18mm;
                        height: 1.5mm;
                        margin: 2mm auto 0;
                        background: #1f7a83;
                    }

                    .fee-print-area .grid {
                        margin-top: 6mm !important;
                        display: grid !important;
                        grid-template-columns: 1fr 1fr !important;
                        gap: 5mm 12mm !important;
                        font-size: 11pt !important;
                    }

                    .fee-print-area .grid > div {
                        display: flex !important;
                        justify-content: space-between !important;
                        gap: 5mm !important;
                        border-bottom: 1px dotted #888 !important;
                        padding-bottom: 1.5mm !important;
                    }

                    .fee-print-area table {
                        width: 100% !important;
                        margin-top: 12mm !important;
                        border-collapse: collapse !important;
                        text-align: right !important;
                        font-size: 12pt !important;
                    }

                    .fee-print-area tbody::before {
                        content: "تفصیل                 رقم";
                        display: table-row;
                        background: #1f7a83;
                        color: #fff;
                        font-weight: 900;
                        white-space: pre;
                    }

                    .fee-print-area td {
                        border: 1px solid #111 !important;
                        padding: 3mm 4mm !important;
                        font-weight: 800 !important;
                    }

                    .fee-print-area td:last-child {
                        width: 36% !important;
                        direction: ltr !important;
                        text-align: center !important;
                        font-family: Arial, sans-serif !important;
                        font-weight: 900 !important;
                    }

                    .fee-print-area tr:nth-last-child(3) td,
                    .fee-print-area tr:last-child td {
                        background: rgba(31, 122, 131, 0.08) !important;
                        font-weight: 900 !important;
                    }

                    .fee-print-area > .relative:last-of-type {
                        position: absolute !important;
                        left: 14mm !important;
                        right: 14mm !important;
                        bottom: 18mm !important;
                        display: flex !important;
                        justify-content: space-between !important;
                        margin-top: 0 !important;
                        font-size: 11pt !important;
                        font-weight: 800 !important;
                    }

                    .fee-print-area > .relative:last-of-type .border-t {
                        width: 38mm !important;
                        border-top: 1.5px solid #111 !important;
                    }

                    @page { size: A5 portrait; margin: 0; }
                }
            `}</style>
        </>
    );
};

const ReceiptRow = ({ label, value, strong }) => (
    <tr className={strong ? 'font-black' : ''}>
        <td className="border border-black p-3 text-right">{label}</td>
        <td className="border border-black p-3">Rs {toMoney(value)}</td>
    </tr>
);

const FeeReceiptPrint = ({ voucher, madrassaProfile }) => {
    const assignment = getAssignment(voucher);
    const madrassaName = madrassaProfile?.name || 'مدرسہ تعلیم القرآن';
    const logoUrl = madrassaProfile?.logoUrl ? getApiAssetUrl(madrassaProfile.logoUrl) : AppImages.logo;
    const receiptRows = [
        { label: 'ماہانہ فیس', value: voucher?.monthlyFee },
        { label: 'داخلہ فیس', value: voucher?.admissionFee },
        { label: 'رعایت', value: voucher?.discount },
        { label: 'جرمانہ', value: voucher?.fine },
        { label: 'کل رقم', value: voucher?.totalAmount, strong: true },
        { label: 'ادا شدہ', value: voucher?.paidAmount },
        { label: 'باقی', value: voucher?.dueAmount, strong: true },
    ];

    return (
        <>
            <div className="fee-print-area hidden bg-white text-black" dir="rtl">
                <img src={logoUrl} alt="" className="fee-print-watermark" />
                <div className="fee-print-content">
                    <header className="fee-print-header">
                        <div className="fee-print-corner"></div>
                        <div className="fee-print-logo">
                            <img src={logoUrl} alt={madrassaName} />
                        </div>
                        <div className="fee-print-school">
                            <h1>{madrassaName}</h1>
                            <p>{madrassaProfile?.address || 'Main Campus'}</p>
                        </div>
                    </header>

                    <section className="fee-print-title">
                        <div>
                            <span>رسید نمبر</span>
                            <strong>{voucher?.voucherNo || ''}</strong>
                        </div>
                        <div>
                            <h2>فیس رسید</h2>
                            <i></i>
                        </div>
                        <div>
                            <span>تاریخ</span>
                            <strong>{new Date().toLocaleDateString('ur-PK')}</strong>
                        </div>
                    </section>

                    <section className="fee-print-student">
                        <div><span>نام:</span><strong>{voucher?.student?.fullName || ''}</strong></div>
                        <div><span>داخلہ نمبر:</span><strong>{voucher?.student?.admissionNumber || ''}</strong></div>
                        <div><span>کلاس:</span><strong>{assignment.class?.name || ''} / {assignment.section?.name || ''}</strong></div>
                        <div><span>مہینہ:</span><strong>{voucher ? `${monthNames[voucher.feeMonth - 1]} ${voucher.feeYear}` : ''}</strong></div>
                    </section>

                    <table className="fee-print-table">
                        <thead>
                            <tr>
                                <th>تفصیل</th>
                                <th>رقم</th>
                            </tr>
                        </thead>
                        <tbody>
                            {receiptRows.map((row) => (
                                <tr key={row.label} className={row.strong ? 'strong-row' : ''}>
                                    <td>{row.label}</td>
                                    <td>Rs {toMoney(row.value)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    <footer className="fee-print-signatures">
                        <div><span></span><p>کیشیئر</p></div>
                        <div><span></span><p>دستخط</p></div>
                    </footer>
                </div>
            </div>
            <style>{`
                @media print {
                    html, body, #root {
                        width: 100% !important;
                        min-height: 0 !important;
                        margin: 0 !important;
                        padding: 0 !important;
                        background: #fff !important;
                    }

                    .fee-page-root {
                        min-height: 0 !important;
                        margin: 0 !important;
                        padding: 0 !important;
                        background: #fff !important;
                    }

                    .fee-page-root > :not(.fee-print-area) {
                        display: none !important;
                    }

                    .fee-print-area {
                        display: block !important;
                        position: relative !important;
                        width: 148mm !important;
                        height: 210mm !important;
                        margin: 0 auto !important;
                        padding: 0 !important;
                        overflow: hidden !important;
                        box-sizing: border-box !important;
                        border: 0 !important;
                        box-shadow: none !important;
                        page-break-after: avoid !important;
                        page-break-inside: avoid !important;
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }

                    .fee-print-content {
                        position: relative !important;
                        z-index: 2 !important;
                        width: 100% !important;
                        height: 100% !important;
                        padding: 13mm 14mm 12mm !important;
                        box-sizing: border-box !important;
                        font-family: "Jameel Noori Nastaleeq", "Noto Nastaliq Urdu", "Noto Naskh Arabic", serif !important;
                    }

                    .fee-print-watermark {
                        position: absolute !important;
                        left: 50% !important;
                        top: 53% !important;
                        width: 78mm !important;
                        height: 78mm !important;
                        transform: translate(-50%, -50%) !important;
                        object-fit: contain !important;
                        opacity: 0.055 !important;
                        z-index: 1 !important;
                    }

                    .fee-print-header {
                        min-height: 27mm !important;
                        display: flex !important;
                        align-items: center !important;
                        gap: 4mm !important;
                        border-bottom: 3px solid #1f7a83 !important;
                        position: relative !important;
                    }

                    .fee-print-corner {
                        position: absolute !important;
                        top: -13mm !important;
                        left: -14mm !important;
                        width: 45mm !important;
                        height: 16mm !important;
                        background: #1f7a83 !important;
                        clip-path: polygon(0 0, 100% 0, 82% 100%, 0 100%) !important;
                    }

                    .fee-print-logo {
                        width: 20mm !important;
                        height: 20mm !important;
                        border: 1px solid #1f7a83 !important;
                        border-radius: 999px !important;
                        padding: 2mm !important;
                        background: #fff !important;
                        z-index: 3 !important;
                    }

                    .fee-print-logo img {
                        width: 100% !important;
                        height: 100% !important;
                        object-fit: contain !important;
                    }

                    .fee-print-school h1 {
                        margin: 0 !important;
                        color: #111 !important;
                        font-size: 25pt !important;
                        font-weight: 900 !important;
                        line-height: 1.35 !important;
                    }

                    .fee-print-school p {
                        margin: 1mm 0 0 !important;
                        color: #555 !important;
                        font-size: 9pt !important;
                        font-weight: 700 !important;
                    }

                    .fee-print-title {
                        margin-top: 13mm !important;
                        display: grid !important;
                        grid-template-columns: 1fr 1.2fr 1fr !important;
                        gap: 5mm !important;
                        align-items: center !important;
                        text-align: center !important;
                    }

                    .fee-print-title span {
                        display: block !important;
                        color: #555 !important;
                        font-size: 8pt !important;
                        font-weight: 800 !important;
                    }

                    .fee-print-title strong {
                        font-family: Arial, sans-serif !important;
                        font-size: 9pt !important;
                    }

                    .fee-print-title h2 {
                        margin: 0 !important;
                        color: #1f7a83 !important;
                        font-size: 22pt !important;
                        font-weight: 900 !important;
                    }

                    .fee-print-title i {
                        display: block !important;
                        width: 18mm !important;
                        height: 1.5mm !important;
                        margin: 2mm auto 0 !important;
                        background: #1f7a83 !important;
                    }

                    .fee-print-student {
                        margin-top: 11mm !important;
                        display: grid !important;
                        grid-template-columns: 1fr 1fr !important;
                        gap: 5mm 12mm !important;
                        font-size: 11pt !important;
                    }

                    .fee-print-student div {
                        display: flex !important;
                        justify-content: space-between !important;
                        gap: 5mm !important;
                        border-bottom: 1px dotted #888 !important;
                        padding-bottom: 1.5mm !important;
                    }

                    .fee-print-student span {
                        font-weight: 800 !important;
                    }

                    .fee-print-table {
                        width: 100% !important;
                        margin-top: 12mm !important;
                        border-collapse: collapse !important;
                        text-align: right !important;
                        font-size: 12pt !important;
                    }

                    .fee-print-table th {
                        background: #1f7a83 !important;
                        color: #fff !important;
                        border: 1px solid #111 !important;
                        padding: 2.8mm 4mm !important;
                        font-weight: 900 !important;
                    }

                    .fee-print-table td {
                        border: 1px solid #111 !important;
                        padding: 3mm 4mm !important;
                        font-weight: 800 !important;
                    }

                    .fee-print-table th:last-child,
                    .fee-print-table td:last-child {
                        width: 36% !important;
                        direction: ltr !important;
                        text-align: center !important;
                        font-family: Arial, sans-serif !important;
                        font-weight: 900 !important;
                    }

                    .fee-print-table .strong-row td {
                        background: rgba(31, 122, 131, 0.08) !important;
                        font-weight: 900 !important;
                    }

                    .fee-print-signatures {
                        position: absolute !important;
                        left: 14mm !important;
                        right: 14mm !important;
                        bottom: 18mm !important;
                        display: flex !important;
                        justify-content: space-between !important;
                        text-align: center !important;
                        font-size: 11pt !important;
                        font-weight: 800 !important;
                    }

                    .fee-print-signatures span {
                        display: block !important;
                        width: 38mm !important;
                        border-top: 1.5px solid #111 !important;
                        margin-bottom: 3mm !important;
                    }

                    .fee-print-signatures p {
                        margin: 0 !important;
                    }

                    @page { size: A5 portrait; margin: 0; }
                }
            `}</style>
        </>
    );
};


