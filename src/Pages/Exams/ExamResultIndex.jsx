import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Award, BookOpen, ChevronLeft, ChevronRight, Edit3, Eye, FileText, Printer, RefreshCcw, Search, Trash2, Users, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getClasses, getSessions } from '../../Constant/AcademicSetupApi';
import { deleteExamResult, getExamResults } from '../../Constant/ExamResultsApi';
import { AppImages } from '../../Constant/AppImages';
import { getAdminSession, getApiAssetUrl } from '../../Constant/AdminAuth';
import { useNotifier } from '../../Components/Notifications/useNotifier';

const text = {
    title: 'رزلٹ فہرست',
    subtitle: 'تمام طلبہ کے محفوظ شدہ سالانہ، ماہانہ، ششماہی اور دیگر امتحانی نتائج یہاں دیکھیں۔',
    searchPlaceholder: 'طالب علم، داخلہ نمبر، والد کا نام یا امتحان تلاش کریں...',
    allClasses: 'تمام کلاسیں',
    allSessions: 'تمام سیشن',
    allResults: 'تمام نتائج',
    loading: 'رزلٹ لوڈ ہو رہے ہیں...',
    empty: 'ابھی کوئی رزلٹ موجود نہیں',
    refresh: 'ریفریش',
    student: 'طالب علم',
    exam: 'امتحان',
    class: 'کلاس',
    session: 'سیشن',
    section: 'سیکشن',
    marks: 'نمبر',
    percentage: 'فیصد',
    grade: 'گریڈ',
    actions: 'ایکشن',
    view: 'دیکھیں',
    edit: 'ترمیم',
    print: 'پرنٹ',
    delete: 'حذف',
    close: 'بند کریں',
    detailTitle: 'رزلٹ تفصیل',
    confirmDelete: 'کیا آپ واقعی یہ رزلٹ حذف کرنا چاہتے ہیں؟',
    previous: 'پچھلا',
    next: 'اگلا',
    totalResults: 'کل رزلٹ',
    shownResults: 'دکھائے گئے',
    loadError: 'رزلٹ فہرست لوڈ نہیں ہو سکی۔',
};

const activeOnly = (items) => (items || []).filter((item) => !item.status || item.status === 'active');
const formatPercent = (value) => (Number.isFinite(Number(value)) ? `${Number(value).toFixed(2)}%` : '---');
const getExamName = (result) => result.examName || 'امتحانی رزلٹ';

const escapeHtml = (value) =>
    String(value ?? '')
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;');

const getValue = (value, fallback = '---') => {
    const normalized = String(value ?? '').trim();
    return normalized || fallback;
};

const buildResultPrintHtml = ({ result, madrassaProfile }) => {
    const madrassaName = getValue(madrassaProfile?.name, 'جامعہ انوار القرآن');
    const logoUrl = madrassaProfile?.logoUrl ? getApiAssetUrl(madrassaProfile.logoUrl) : AppImages.logo;
    const subjects = result.subjects || [];
    const printDate = new Date().toLocaleDateString('ur-PK');
    const subjectRows = subjects.length
        ? subjects.map((subject, index) => `
            <tr>
              <td class="num">${index + 1}</td>
              <td>${escapeHtml(getValue(subject.subjectName))}</td>
              <td class="num">${escapeHtml(getValue(subject.totalMarks))}</td>
              <td class="num">${escapeHtml(getValue(subject.obtainedMarks))}</td>
              <td class="num">${escapeHtml(formatPercent(subject.percentage))}</td>
            </tr>
          `).join('')
        : `<tr><td colspan="5" class="empty">مضامین کی تفصیل موجود نہیں۔</td></tr>`;

    return `<!doctype html>
<html lang="ur" dir="rtl">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(getValue(result.student?.fullName, 'Result Card'))}</title>
  <style>
    @page { size: A4 portrait; margin: 10mm; }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      background: #eef2f7;
      color: #132033;
      font-family: "Jameel Noori Nastaleeq", "Noto Nastaliq Urdu", "Noto Naskh Arabic", "Urdu Typesetting", "Segoe UI", Tahoma, Arial, sans-serif;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .sheet {
      width: 190mm;
      height: 277mm;
      min-height: 277mm;
      margin: 0 auto;
      background: #ffffff;
      border: 1.5mm solid #0f766e;
      padding: 8mm;
      position: relative;
      overflow: hidden;
    }
    .sheet:before,
    .sheet:after {
      content: "";
      position: absolute;
      width: 92mm;
      height: 92mm;
      border-radius: 50%;
      background: rgba(15, 118, 110, 0.08);
      pointer-events: none;
    }
    .sheet:before { top: -48mm; right: -35mm; }
    .sheet:after { bottom: -48mm; left: -35mm; }
    .inner {
      height: 100%;
      min-height: 0;
      border: 1px solid #bfd8d4;
      padding: 6mm;
      position: relative;
      z-index: 1;
    }
    .header {
      display: grid;
      grid-template-columns: 26mm 1fr;
      gap: 5mm;
      align-items: center;
      border-bottom: 2px solid #0f766e;
      padding-bottom: 5mm;
    }
    .logo {
      width: 24mm;
      height: 24mm;
      border: 2px solid #0f766e;
      border-radius: 50%;
      padding: 2mm;
      object-fit: contain;
      background: #fff;
    }
    .school { text-align: center; }
    .school h1 {
      margin: 0;
      color: #0f766e;
      font-size: 28pt;
      line-height: 1.25;
      font-weight: 900;
    }
    .school p {
      margin: 2mm 0 0;
      color: #475569;
      font-size: 10.5pt;
      line-height: 1.8;
      font-family: "Jameel Noori Nastaleeq", "Noto Nastaliq Urdu", serif;
    }
    .title {
      margin: 6mm auto 5mm;
      width: fit-content;
      min-width: 68mm;
      border: 2px solid #0f766e;
      border-radius: 999px;
      background: #ecfdf5;
      color: #064e3b;
      padding: 1.8mm 9mm 2.5mm;
      text-align: center;
      font-size: 20pt;
      font-weight: 900;
      box-shadow: inset 0 0 0 1px #ffffff;
    }
    .info-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 3mm;
      margin-bottom: 5mm;
    }
    .box {
      border: 1px solid #cbd5e1;
      background: #f8fafc;
      border-radius: 3mm;
      padding: 2.5mm 3mm;
      min-height: 16mm;
    }
    .box strong {
      display: block;
      color: #64748b;
      font-size: 8.5pt;
      font-family: "Jameel Noori Nastaleeq", "Noto Nastaliq Urdu", serif;
      margin-bottom: 1mm;
    }
    .box span {
      display: block;
      color: #132033;
      font-size: 13pt;
      font-weight: 900;
      line-height: 1.5;
    }
    .summary {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 3mm;
      margin-bottom: 5mm;
    }
    .summary .box {
      text-align: center;
      border-color: #99f6e4;
      background: linear-gradient(180deg, #ecfdf5, #ffffff);
    }
    .summary .box span {
      color: #0f766e;
      font-size: 16pt;
      font-family: "Jameel Noori Nastaleeq", "Noto Nastaliq Urdu", serif;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      overflow: hidden;
      border: 1px solid #0f766e;
      border-radius: 2mm;
      font-family: "Jameel Noori Nastaleeq", "Noto Nastaliq Urdu", serif;
    }
    th {
      background: #0f766e;
      color: #fff;
      font-size: 10pt;
      padding: 2.5mm;
      border: 1px solid #0b5f59;
    }
    td {
      padding: 2.2mm 2.5mm;
      border: 1px solid #cbd5e1;
      font-size: 10pt;
      color: #1e293b;
    }
    tbody tr:nth-child(even) td { background: #f8fafc; }
    .num {
      direction: ltr;
      text-align: center;
      font-family: "Jameel Noori Nastaleeq", "Noto Nastaliq Urdu", serif;
      font-weight: 800;
    }
    .empty {
      text-align: center;
      color: #64748b;
      padding: 8mm;
    }
    .remarks {
      margin-top: 5mm;
      min-height: 18mm;
      border: 1px dashed #94a3b8;
      border-radius: 3mm;
      padding: 3mm 4mm;
      background: #f8fafc;
      font-size: 11pt;
      line-height: 1.9;
      font-family: "Jameel Noori Nastaleeq", "Noto Nastaliq Urdu", serif;
    }
    .remarks strong { color: #0f766e; margin-left: 2mm; }
    .signatures {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 8mm;
      margin-top: 17mm;
      text-align: center;
      font-size: 11pt;
      font-weight: 800;
    }
    .signatures div { border-top: 1px solid #334155; padding-top: 2mm; }
    .footer {
      position: absolute;
      left: 6mm;
      right: 6mm;
      bottom: 4mm;
      display: flex;
      justify-content: space-between;
      color: #64748b;
      font-size: 8.5pt;
      font-family: "Jameel Noori Nastaleeq", "Noto Nastaliq Urdu", serif;
      border-top: 1px solid #e2e8f0;
      padding-top: 2mm;
    }
    @media print {
      body { background: #fff; }
      .sheet {
        width: 190mm;
        height: 277mm;
        min-height: 277mm;
        margin: 0 auto;
      }
    }
  </style>
</head>
<body>
  <main class="sheet">
    <section class="inner">
      <header class="header">
        <img class="logo" src="${escapeHtml(logoUrl)}" alt="${escapeHtml(madrassaName)}" />
        <div class="school">
          <h1>${escapeHtml(madrassaName)}</h1>
          <p>${escapeHtml(getValue(madrassaProfile?.address, ''))}</p>
          <p>${escapeHtml(getValue(madrassaProfile?.phone1 || madrassaProfile?.phone2, ''))}</p>
        </div>
      </header>

      <div class="title">امتحانی رزلٹ کارڈ</div>

      <section class="info-grid">
        <div class="box"><strong>طالب علم</strong><span>${escapeHtml(getValue(result.student?.fullName))}</span></div>
        <div class="box"><strong>والد کا نام</strong><span>${escapeHtml(getValue(result.student?.fatherName))}</span></div>
        <div class="box"><strong>داخلہ نمبر</strong><span>${escapeHtml(getValue(result.student?.admissionNumber))}</span></div>
        <div class="box"><strong>امتحان</strong><span>${escapeHtml(getExamName(result))}</span></div>
        <div class="box"><strong>کلاس</strong><span>${escapeHtml(getValue(result.class?.name))}</span></div>
        <div class="box"><strong>سیکشن</strong><span>${escapeHtml(getValue(result.section?.name))}</span></div>
        <div class="box"><strong>سیشن</strong><span>${escapeHtml(getValue(result.session?.name))}</span></div>
        <div class="box"><strong>تاریخ</strong><span>${escapeHtml(printDate)}</span></div>
      </section>

      <section class="summary">
        <div class="box"><strong>کل نمبر</strong><span>${escapeHtml(getValue(result.totalMarks))}</span></div>
        <div class="box"><strong>حاصل کردہ نمبر</strong><span>${escapeHtml(getValue(result.obtainedMarks))}</span></div>
        <div class="box"><strong>فیصد</strong><span>${escapeHtml(formatPercent(result.percentage))}</span></div>
        <div class="box"><strong>گریڈ</strong><span>${escapeHtml(getValue(result.grade || result.gradeTitle))}</span></div>
      </section>

      <table>
        <thead>
          <tr>
            <th>نمبر شمار</th>
            <th>مضمون</th>
            <th>کل نمبر</th>
            <th>حاصل کردہ نمبر</th>
            <th>فیصد</th>
          </tr>
        </thead>
        <tbody>${subjectRows}</tbody>
      </table>

      <div class="remarks"><strong>تبصرہ:</strong>${escapeHtml(getValue(result.remarks, ''))}</div>

      <section class="signatures">
        <div>استاد کے دستخط</div>
        <div>ناظم امتحانات</div>
        <div>سرپرست کے دستخط</div>
      </section>

      <footer class="footer">
        <span>یہ رزلٹ کمپیوٹر سے تیار کیا گیا ہے۔</span>
        <span>${escapeHtml(printDate)}</span>
      </footer>
    </section>
  </main>
</body>
</html>`;
};

const buildQuery = (filters, page) => {
    const params = new URLSearchParams();
    params.set('page', page);
    params.set('limit', '100');
    params.set('status', 'active');
    if (filters.search.trim()) params.set('search', filters.search.trim());
    if (filters.classId) params.set('classId', filters.classId);
    if (filters.sessionId) params.set('sessionId', filters.sessionId);
    return params.toString();
};

export const ExamResultIndex = () => {
    const navigate = useNavigate();
    const notify = useNotifier();
    const [results, setResults] = useState([]);
    const [classOptions, setClassOptions] = useState([]);
    const [sessionOptions, setSessionOptions] = useState([]);
    const [filters, setFilters] = useState({ search: '', classId: '', sessionId: '', examName: '' });
    const [page, setPage] = useState(1);
    const [meta, setMeta] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedResult, setSelectedResult] = useState(null);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [deletingId, setDeletingId] = useState(null);
    const [error, setError] = useState('');

    const loadData = useCallback(async () => {
        setIsLoading(true);
        setError('');
        try {
            const [classesResult, sessionsResult, resultsResult] = await Promise.all([
                getClasses('page=1&limit=100'),
                getSessions('page=1&limit=100'),
                getExamResults(buildQuery(filters, page)),
            ]);
            setClassOptions(activeOnly(classesResult.items));
            setSessionOptions(activeOnly(sessionsResult.items));
            setResults(resultsResult.items || []);
            setMeta(resultsResult.meta || null);
        } catch (loadError) {
            setError(loadError.message || text.loadError);
        } finally {
            setIsLoading(false);
        }
    }, [filters, page]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const examNames = useMemo(() => (
        [...new Set(results.map(getExamName).filter(Boolean))]
    ), [results]);

    const filteredResults = useMemo(() => {
        if (!filters.examName) return results;
        return results.filter((result) => getExamName(result) === filters.examName);
    }, [filters.examName, results]);

    const stats = useMemo(() => ({
        total: meta?.totalItems ?? results.length,
        shown: filteredResults.length,
        students: new Set(filteredResults.map((result) => result.student?.id).filter(Boolean)).size,
    }), [filteredResults, meta, results.length]);

    const updateFilter = (field, value) => {
        setFilters((current) => ({ ...current, [field]: value }));
        setPage(1);
    };

    const handleEdit = (result) => {
        navigate('/exams/result', { state: { editResult: result } });
    };

    const handlePrint = (result) => {
        const printWindow = window.open('', '_blank', 'width=1100,height=850');
        if (!printWindow) {
            notify.error('پرنٹ ونڈو نہیں کھل سکی۔ براہ کرم پاپ اپ اجازت دیں۔', 'پرنٹ');
            return;
        }

        const html = buildResultPrintHtml({
            result,
            madrassaProfile: getAdminSession()?.madrassaProfile || {},
        });

        printWindow.document.open();
        printWindow.document.write(html);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
            printWindow.print();
        }, 350);
    };

    const handleDelete = async () => {
        if (!deleteTarget) return;
        setDeletingId(deleteTarget.id);
        setError('');
        try {
            await deleteExamResult(deleteTarget.id);
            setResults((current) => current.filter((item) => item.id !== deleteTarget.id));
            setDeleteTarget(null);
            notify.success('رزلٹ حذف ہو گیا۔', 'رزلٹ حذف');
        } catch (deleteError) {
            const message = deleteError.message || 'رزلٹ حذف نہیں ہو سکا۔';
            setError(message);
            notify.error(message, 'حذف کرنے میں مسئلہ');
        } finally {
            setDeletingId(null);
        }
    };

    return (
        <div className="min-h-screen bg-[var(--color-bg)] p-3 text-[var(--color-text-main)] font-urdu md:p-6" dir="rtl">
            <div className="mx-auto max-w-7xl space-y-5">
                <div className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-xl">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                            <h1 className="text-2xl font-black text-[var(--color-primary)] md:text-3xl">{text.title}</h1>
                            <p className="mt-4 text-sm font-bold text-[var(--color-text-muted)]">{text.subtitle}</p>
                        </div>
                        <button
                            type="button"
                            onClick={loadData}
                            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-[var(--color-border)] px-4 text-xs font-black"
                        >
                            <RefreshCcw size={16} /> {text.refresh}
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <StatCard icon={<Award size={22} />} label={text.totalResults} value={stats.total} />
                    <StatCard icon={<FileText size={22} />} label={text.shownResults} value={stats.shown} />
                    <StatCard icon={<Users size={22} />} label={text.student} value={stats.students} />
                </div>

                {error ? <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-sm font-bold text-rose-400">{error}</div> : null}

                <div className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-xl">
                    <div className="flex items-center grid grid-cols-1 gap-3 lg:grid-cols-12">
                        <div className="relative lg:col-span-5">
                            <Search size={17} className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
                            <input
                                value={filters.search}
                                onChange={(event) => updateFilter('search', event.target.value)}
                                placeholder={text.searchPlaceholder}
                                className="h-12 w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-input)] pr-11 pl-4 text-sm font-bold outline-none focus:border-[var(--color-primary)]"
                            />
                        </div>
                        <select value={filters.classId} onChange={(event) => updateFilter('classId', event.target.value)} className="h-12 rounded-xl border border-[var(--color-border)] bg-[var(--color-input)] px-4 text-sm font-bold outline-none lg:col-span-2">
                            <option value="">{text.allClasses}</option>
                            {classOptions.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                        </select>
                        <select value={filters.sessionId} onChange={(event) => updateFilter('sessionId', event.target.value)} className="h-12 rounded-xl border border-[var(--color-border)] bg-[var(--color-input)] px-4 text-sm font-bold outline-none lg:col-span-2">
                            <option value="">{text.allSessions}</option>
                            {sessionOptions.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                        </select>
                        <select value={filters.examName} onChange={(event) => updateFilter('examName', event.target.value)} className="h-12 rounded-xl border border-[var(--color-border)] bg-[var(--color-input)] px-4 text-sm font-bold outline-none lg:col-span-3">
                            <option value="">{text.allResults}</option>
                            {examNames.map((name) => <option key={name} value={name}>{name}</option>)}
                        </select>
                    </div>
                </div>

                <div className="overflow-hidden rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-xl">
                    {isLoading ? (
                        <div className="p-10 text-center text-sm font-black text-[var(--color-text-muted)]">{text.loading}</div>
                    ) : filteredResults.length ? (
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[1080px] text-right text-sm">
                                <thead className="bg-[var(--color-bg)] text-xs font-black text-[var(--color-text-muted)]">
                                    <tr>
                                        <th className="p-4">{text.student}</th>
                                        <th className="p-4">{text.exam}</th>
                                        <th className="p-4">{text.class}</th>
                                        <th className="p-4">{text.session}</th>
                                        <th className="p-4">{text.marks}</th>
                                        <th className="p-4">{text.percentage}</th>
                                        <th className="p-4">{text.grade}</th>
                                        <th className="p-4 text-center">{text.actions}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[var(--color-border)]">
                                    {filteredResults.map((result) => (
                                        <ResultRow
                                            key={result.id}
                                            result={result}
                                            onView={setSelectedResult}
                                            onEdit={handleEdit}
                                            onPrint={handlePrint}
                                            onDelete={setDeleteTarget}
                                            deletingId={deletingId}
                                        />
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center px-4 py-16 text-center">
                            <BookOpen size={30} className="text-[var(--color-primary)]" />
                            <p className="mt-3 text-sm font-black text-[var(--color-text-muted)]">{text.empty}</p>
                        </div>
                    )}
                </div>

                <div className="flex flex-col gap-3 rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-xl sm:flex-row sm:items-center sm:justify-between">
                    <div className="text-xs font-black text-[var(--color-text-muted)]">
                        صفحہ {meta?.page || page} / {meta?.totalPages || 1}
                    </div>
                    <div className="flex gap-2">
                        <button
                            type="button"
                            disabled={page <= 1 || isLoading}
                            onClick={() => setPage((current) => Math.max(1, current - 1))}
                            className="inline-flex h-10 items-center gap-2 rounded-xl border border-[var(--color-border)] px-4 text-xs font-black disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            <ChevronRight size={16} /> {text.previous}
                        </button>
                        <button
                            type="button"
                            disabled={Boolean(meta) && page >= meta.totalPages || isLoading}
                            onClick={() => setPage((current) => current + 1)}
                            className="inline-flex h-10 items-center gap-2 rounded-xl border border-[var(--color-border)] px-4 text-xs font-black disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {text.next} <ChevronLeft size={16} />
                        </button>
                    </div>
                </div>
            </div>

            {selectedResult ? (
                <ResultDetailModal result={selectedResult} onClose={() => setSelectedResult(null)} onPrint={handlePrint} />
            ) : null}

            {deleteTarget ? (
                <DeleteModal
                    result={deleteTarget}
                    isDeleting={deletingId === deleteTarget.id}
                    onClose={() => setDeleteTarget(null)}
                    onConfirm={handleDelete}
                />
            ) : null}
        </div>
    );
};

const StatCard = ({ icon, label, value }) => (
    <div className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-xl">
        <div className="flex items-center justify-between gap-4">
            <div>
                <p className="text-xs font-black text-[var(--color-text-muted)]">{label}</p>
                <p className="mt-2 font-sans text-2xl font-black text-[var(--color-text-main)]">{value}</p>
            </div>
            <div className="rounded-xl bg-emerald-500/10 p-3 text-[var(--color-primary)]">{icon}</div>
        </div>
    </div>
);

const ResultRow = ({ result, onView, onEdit, onPrint, onDelete, deletingId }) => (
    <tr className="transition-colors hover:bg-[var(--color-bg)]/50">
        <td className="p-4">
            <div className="font-black text-[var(--color-primary)]">{result.student?.fullName || '---'}</div>
            <div className="mt-1 text-xs font-bold text-[var(--color-text-muted)]">
                {result.student?.admissionNumber || '---'} / {result.student?.fatherName || '---'}
            </div>
        </td>
        <td className="p-4 font-bold">{getExamName(result)}</td>
        <td className="p-4 font-bold">
            <div>{result.class?.name || '---'}</div>
            <div className="mt-1 text-xs text-[var(--color-text-muted)]">{result.section?.name || '---'}</div>
        </td>
        <td className="p-4 font-bold">{result.session?.name || '---'}</td>
        <td className="p-4 font-sans font-black">{result.obtainedMarks}/{result.totalMarks}</td>
        <td className="p-4 font-sans font-black">{formatPercent(result.percentage)}</td>
        <td className="p-4 font-black text-[var(--color-primary)]">{result.grade || result.gradeTitle || '---'}</td>
        <td className="p-4">
            <div className="flex items-center justify-center gap-2">
                <ActionButton label={text.view} onClick={() => onView(result)}><Eye size={16} /></ActionButton>
                <ActionButton label={text.edit} onClick={() => onEdit(result)}><Edit3 size={16} /></ActionButton>
                <ActionButton label={text.print} onClick={() => onPrint(result)}><Printer size={16} /></ActionButton>
                <ActionButton label={text.delete} tone="danger" disabled={deletingId === result.id} onClick={() => onDelete(result)}><Trash2 size={16} /></ActionButton>
            </div>
        </td>
    </tr>
);

const ActionButton = ({ children, label, tone = 'default', disabled, onClick }) => (
    <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        title={label}
        aria-label={label}
        className={`flex h-10 w-10 items-center justify-center rounded-xl transition-all disabled:cursor-not-allowed disabled:opacity-50 ${tone === 'danger'
                ? 'bg-rose-500/10 text-rose-400 hover:bg-rose-500 hover:text-white'
                : 'bg-emerald-500/10 text-[var(--color-primary)] hover:bg-[var(--color-primary)] hover:text-[#0b1120]'
            }`}
    >
        {children}
    </button>
);

const ResultDetailModal = ({ result, onClose, onPrint }) => (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/70 p-3 backdrop-blur-sm" dir="rtl">
        <div className="max-h-[92vh] w-full max-w-5xl overflow-auto rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-2xl">
            <div className="mb-5 flex items-center justify-between border-b border-[var(--color-border)] pb-4">
                <div>
                    <h2 className="text-2xl font-black text-[var(--color-primary)]">{text.detailTitle}</h2>
                    <p className="mt-2 text-sm font-bold text-[var(--color-text-muted)]">{result.student?.fullName || '---'} / {getExamName(result)}</p>
                </div>
                <div className="flex items-center gap-2">
                    <button type="button" onClick={() => onPrint(result)} className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-[var(--color-primary)] transition-all hover:bg-[var(--color-primary)] hover:text-[#0b1120]" title={text.print} aria-label={text.print}>
                        <Printer size={18} />
                    </button>
                    <button type="button" onClick={onClose} className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--color-bg)]">
                        <X size={18} />
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
                <InfoBox label={text.student} value={result.student?.fullName || '---'} />
                <InfoBox label="داخلہ نمبر" value={result.student?.admissionNumber || '---'} />
                <InfoBox label="والد کا نام" value={result.student?.fatherName || '---'} />
                <InfoBox label={text.exam} value={getExamName(result)} />
                <InfoBox label={text.class} value={result.class?.name || '---'} />
                <InfoBox label={text.section} value={result.section?.name || '---'} />
                <InfoBox label={text.session} value={result.session?.name || '---'} />
                <InfoBox label={text.grade} value={result.grade || result.gradeTitle || '---'} />
                <InfoBox label={text.marks} value={`${result.obtainedMarks}/${result.totalMarks}`} />
                <InfoBox label={text.percentage} value={formatPercent(result.percentage)} />
                <InfoBox label="تبصرہ" value={result.remarks || '---'} className="md:col-span-2" />
            </div>

            <div className="mt-5 overflow-hidden rounded-2xl border border-[var(--color-border)]">
                <table className="w-full min-w-[680px] text-right text-sm">
                    <thead className="bg-[var(--color-bg)] text-xs font-black text-[var(--color-text-muted)]">
                        <tr>
                            <th className="p-4">مضمون</th>
                            <th className="p-4">کل نمبر</th>
                            <th className="p-4">حاصل کردہ نمبر</th>
                            <th className="p-4">فیصد</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--color-border)]">
                        {(result.subjects || []).map((subject) => (
                            <tr key={subject.id}>
                                <td className="p-4 font-black text-[var(--color-primary)]">{subject.subjectName || '---'}</td>
                                <td className="p-4 font-sans font-black">{subject.totalMarks}</td>
                                <td className="p-4 font-sans font-black">{subject.obtainedMarks}</td>
                                <td className="p-4 font-sans font-black">{formatPercent(subject.percentage)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    </div>
);

const InfoBox = ({ label, value, className = '' }) => (
    <div className={`rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] p-4 ${className}`}>
        <div className="text-[11px] font-black text-[var(--color-text-muted)]">{label}</div>
        <div className="mt-2 min-h-7 text-sm font-black text-[var(--color-text-main)]">{value}</div>
    </div>
);

const DeleteModal = ({ result, isDeleting, onClose, onConfirm }) => (
    <div className="fixed inset-0 z-[130] flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm" dir="rtl">
        <div className="w-full max-w-md rounded-3xl border border-rose-500/20 bg-[var(--color-surface)] p-7 shadow-2xl">
            <h3 className="text-xl font-black text-[var(--color-text-main)]">{text.delete}</h3>
            <p className="mt-3 text-sm font-bold leading-7 text-[var(--color-text-muted)]">
                {text.confirmDelete}
            </p>
            <p className="mt-3 text-sm font-black text-[var(--color-primary)]">{result.student?.fullName || '---'} / {getExamName(result)}</p>
            <div className="mt-7 flex justify-end gap-3">
                <button type="button" onClick={onClose} disabled={isDeleting} className="rounded-xl border border-[var(--color-border)] px-5 py-3 text-sm font-black disabled:opacity-60">
                    منسوخ کریں
                </button>
                <button type="button" onClick={onConfirm} disabled={isDeleting} className="rounded-xl bg-rose-500 px-6 py-3 text-sm font-black text-white disabled:opacity-60">
                    {isDeleting ? 'حذف ہو رہا ہے...' : 'تصدیق کریں'}
                </button>
            </div>
        </div>
    </div>
);


