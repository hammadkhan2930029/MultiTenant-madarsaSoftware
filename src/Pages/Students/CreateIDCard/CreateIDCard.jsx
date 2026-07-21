import React, { useEffect, useMemo, useState } from 'react';
import { CreditCard, GraduationCap, Layout, Printer, Search, Smartphone, User } from 'lucide-react';
/* eslint-disable-next-line no-unused-vars */
import { motion, AnimatePresence } from 'framer-motion';
import { AppImages } from '../../../Constant/AppImages';
import { getStudents } from '../../../Constant/StudentsApi';
import { getClasses, getSections, getSessions } from '../../../Constant/AcademicSetupApi';
import { fetchMadrassaProfile, getAdminSession, getApiAssetUrl } from '../../../Constant/AdminAuth';
import { useNotificationBridge } from '../../../Components/Notifications/useNotificationBridge';

const getActiveAssignment = (student) =>
    student?.assignments?.find((assignment) => assignment.status === 'active') || student?.assignments?.[0] || null;

const getStudentImage = (student) => {
    const imagePath = student?.imageUrl || student?.image || student?.photoUrl || '';
    return imagePath ? getApiAssetUrl(imagePath) : '';
};

const normalizeStudentItems = (result) => {
    if (Array.isArray(result)) return result;
    if (Array.isArray(result?.items)) return result.items;
    if (Array.isArray(result?.data?.items)) return result.data.items;
    if (Array.isArray(result?.data)) return result.data;
    return [];
};

const normalizeSearchText = (value) => String(value || '').trim().toLowerCase();

const getStudentSearchFields = (student) => [
    student?.id,
    student?.admissionNumber,
    student?.fullName,
    student?.fatherName,
    student?.phone,
    student?.parents?.find((parentItem) => parentItem.isPrimary)?.parent?.fullName,
    student?.parents?.find((parentItem) => parentItem.isPrimary)?.parent?.phone,
].filter(Boolean);

const findStudentMatch = (studentList, query) => {
    const normalizedQuery = normalizeSearchText(query);
    if (!normalizedQuery) return null;

    return (
        studentList.find((student) =>
            [student?.admissionNumber, student?.fullName]
                .filter(Boolean)
                .some((value) => normalizeSearchText(value) === normalizedQuery),
        ) ||
        studentList.find((student) =>
            getStudentSearchFields(student).some((value) => normalizeSearchText(value).includes(normalizedQuery)),
        ) ||
        null
    );
};

const mapStudentForCard = (student, madrassaProfile) => {
    const activeAssignment = getActiveAssignment(student);
    const primaryParent = student?.parents?.find((parentItem) => parentItem.isPrimary)?.parent;

    return {
        id: student.id,
        idNo: student.admissionNumber || '---',
        name: student.fullName || '---',
        fatherName: student.fatherName || primaryParent?.fullName || '---',
        className: activeAssignment?.class?.name || student?.requiredClass || '---',
        section: activeAssignment?.section?.name || student?.requiredJamaat || '---',
        session: activeAssignment?.session?.name || '---',
        mobile: student.phone || primaryParent?.phone || '---',
        address: student.address || madrassaProfile?.address || '',
        image: getStudentImage(student),
        madrassaName: madrassaProfile?.name || 'جامعہ انوار القرآن',
        madrassaLogo: madrassaProfile?.logoUrl ? getApiAssetUrl(madrassaProfile.logoUrl) : AppImages.logo,
    };
};

const getStudentClassName = (student) => getActiveAssignment(student)?.class?.name || student?.requiredClass || '---';
const getStudentSectionName = (student) => getActiveAssignment(student)?.section?.name || student?.requiredJamaat || '---';
const getStudentSessionName = (student) => getActiveAssignment(student)?.session?.name || '---';

const buildStudentQuery = (filters = {}, search = '') => {
    const params = new URLSearchParams({ page: '1', limit: '100', status: 'active' });
    if (filters.sessionId) params.set('sessionId', filters.sessionId);
    if (filters.classId) params.set('classId', filters.classId);
    if (filters.sectionId) params.set('sectionId', filters.sectionId);
    if (search?.trim()) params.set('search', search.trim());
    return params.toString();
};

export const CreateIdCard = () => {
    const [searchId, setSearchId] = useState('');
    const [layout, setLayout] = useState('horizontal');
    const [studentData, setStudentData] = useState(null);
    const [students, setStudents] = useState([]);
    const [searchResults, setSearchResults] = useState([]);
    const [sessions, setSessions] = useState([]);
    const [classes, setClasses] = useState([]);
    const [sections, setSections] = useState([]);
    const [filters, setFilters] = useState({ sessionId: '', classId: '', sectionId: '' });
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [madrassaProfile, setMadrassaProfile] = useState(() => getAdminSession()?.madrassaProfile || null);
    const [loading, setLoading] = useState(true);
    const [isSearching, setIsSearching] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useNotificationBridge({ error, success });

    useEffect(() => {
        window.scrollTo(0, 0);

        const loadIdCardData = async () => {
            setLoading(true);
            setError('');

            try {
                const [studentsResult, profileResult, sessionsResult, classesResult, sectionsResult] = await Promise.all([
                    getStudents('page=1&limit=100&status=active'),
                    fetchMadrassaProfile().catch(() => getAdminSession()?.madrassaProfile || null),
                    getSessions('page=1&limit=100&status=active'),
                    getClasses('page=1&limit=100&status=active'),
                    getSections('page=1&limit=100&status=active'),
                ]);

                setStudents(normalizeStudentItems(studentsResult));
                setMadrassaProfile(profileResult);
                setSessions(sessionsResult.items || []);
                setClasses(classesResult.items || []);
                setSections(sectionsResult.items || []);
            } catch (loadError) {
                setError(loadError.message || 'آئی ڈی کارڈ کا ڈیٹا لوڈ نہیں ہو سکا۔');
            } finally {
                setLoading(false);
            }
        };

        loadIdCardData();
    }, []);

    useEffect(() => {
        let isCurrent = true;

        const loadFilteredStudents = async () => {
            setLoading(true);
            setError('');
            setSearchResults([]);

            try {
                const result = await getStudents(buildStudentQuery(filters));
                if (!isCurrent) return;
                setStudents(normalizeStudentItems(result));
            } catch (loadError) {
                if (!isCurrent) return;
                setStudents([]);
                setError(loadError.message || 'طلبہ کی فہرست لوڈ نہیں ہو سکی۔');
            } finally {
                if (!isCurrent) return;
                setLoading(false);
            }
        };

        loadFilteredStudents();

        return () => {
            isCurrent = false;
        };
    }, [filters]);

    const availableSections = useMemo(
        () => sections.filter((section) => !filters.classId || String(section.classId) === String(filters.classId)),
        [filters.classId, sections],
    );

    const tableStudents = useMemo(
        () => students.slice(0, 100),
        [students],
    );

    const filteredStudents = useMemo(() => {
        const query = normalizeSearchText(searchId);
        if (!query) return [];

        const mergedStudents = [...students, ...searchResults].filter(
            (student, index, list) => list.findIndex((item) => String(item.id) === String(student.id)) === index,
        );

        return mergedStudents
            .filter((student) => getStudentSearchFields(student).some((value) => normalizeSearchText(value).includes(query)))
            .slice(0, 8);
    }, [searchId, searchResults, students]);

    useEffect(() => {
        const query = searchId.trim();

        if (query.length < 2) {
            setSearchResults([]);
            return undefined;
        }

        const timeoutId = setTimeout(async () => {
            setIsSearching(true);

            try {
                const result = await getStudents(buildStudentQuery(filters, query).replace('limit=100', 'limit=20'));
                setSearchResults(normalizeStudentItems(result));
            } catch {
                setSearchResults([]);
            } finally {
                setIsSearching(false);
            }
        }, 250);

        return () => clearTimeout(timeoutId);
    }, [filters, searchId]);

    const selectStudent = (student) => {
        setStudentData(mapStudentForCard(student, madrassaProfile));
        setSearchId(student.admissionNumber || student.fullName || '');
        setIsDropdownOpen(false);
        setError('');
        setSuccess('');
    };

    const handleSearch = async () => {
        const query = searchId.trim();
        if (!query) return;

        setIsSearching(true);
        setError('');

        try {
            const localMatch = findStudentMatch([...students, ...searchResults], query) || filteredStudents[0];

            if (localMatch) {
                selectStudent(localMatch);
                return;
            }

            const result = await getStudents(buildStudentQuery(filters, query).replace('limit=100', 'limit=20'));
            const serverStudents = normalizeStudentItems(result);
            const serverMatch = findStudentMatch(serverStudents, query) || serverStudents[0];

            setSearchResults(serverStudents);

            if (!serverMatch) {
                setStudentData(null);
                setError('اس رجسٹریشن نمبر یا نام کا طالب علم نہیں ملا۔');
                return;
            }

            setStudents((current) => {
                const mergedStudents = [...current, ...serverStudents];
                return mergedStudents.filter(
                    (student, index, list) => list.findIndex((item) => String(item.id) === String(student.id)) === index,
                );
            });
            selectStudent(serverMatch);
        } catch (searchError) {
            setStudentData(null);
            setError(searchError.message || 'طالب علم تلاش نہیں ہو سکا۔');
        } finally {
            setIsSearching(false);
        }
    };

    return (
        <div className="min-h-screen bg-[var(--color-bg)] p-4 md:p-8" dir="rtl">
            <div className="max-w-6xl mx-auto bg-[var(--color-surface)] p-6 rounded-[2rem] shadow-xl border border-[var(--color-border)] mb-10 print:hidden">
                <h2 className="text-3xl font-black mb-6 flex items-center gap-3 text-[var(--color-text-main)]">
                    <CreditCard className="text-[var(--color-primary)]" /> آئی ڈی کارڈ جنریٹر
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-6 gap-5 items-end">
                    <FilterSelect
                        label="سیشن"
                        value={filters.sessionId}
                        onChange={(value) => setFilters((current) => ({ ...current, sessionId: value }))}
                        options={sessions}
                        placeholder="تمام سیشن"
                    />
                    <FilterSelect
                        label="جماعت"
                        value={filters.classId}
                        onChange={(value) => setFilters((current) => ({ ...current, classId: value, sectionId: '' }))}
                        options={classes}
                        placeholder="تمام جماعتیں"
                    />
                    <FilterSelect
                        label="جماعت سیکشن"
                        value={filters.sectionId}
                        onChange={(value) => setFilters((current) => ({ ...current, sectionId: value }))}
                        options={availableSections}
                        placeholder="تمام سیکشن"
                        disabled={!filters.classId}
                    />
                    <div className="relative flex flex-col gap-2 xl:col-span-2">
                        <label className="text-xs font-bold text-[var(--color-text-muted)] mr-2">رجسٹریشن نمبر یا نام<span className="text-red-500"> *</span></label>
                        <div className="relative">
                            <input
                                type="text"
                                value={searchId}
                                onChange={(event) => {
                                    setSearchId(event.target.value);
                                    setStudentData(null);
                                    setIsDropdownOpen(true);
                                }}
                                onFocus={() => {
                                    if (searchId.trim() && !studentData) {
                                        setIsDropdownOpen(true);
                                    }
                                }}
                                onKeyDown={(event) => {
                                    if (event.key === 'Enter') {
                                        event.preventDefault();
                                        handleSearch();
                                    }
                                }}
                                className="h-14 w-full bg-[var(--color-input)] border-2 border-[var(--color-border)] focus:border-[var(--color-primary)] px-4 pl-11 rounded-xl outline-none font-bold text-[var(--color-text-main)] transition-all"
                                placeholder={loading || isSearching ? 'طلبہ تلاش ہو رہے ہیں...' : '0001 یا طالب علم کا نام'}
                            />
                            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
                        </div>

                        {isDropdownOpen && searchId && filteredStudents.length > 0 ? (
                            <div className="absolute top-full right-0 left-0 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl mt-2 shadow-xl z-50 overflow-hidden">
                                {filteredStudents.map((student) => (
                                    <button
                                        type="button"
                                        key={student.id}
                                        onClick={() => selectStudent(student)}
                                        className="block w-full p-3 text-right hover:bg-[var(--color-primary)]/10 border-b border-[var(--color-border)] last:border-0 transition-colors"
                                    >
                                        <p className="font-black text-sm text-[var(--color-text-main)]">{student.fullName}</p>
                                        <p className="text-[10px] font-bold text-[var(--color-text-muted)]">
                                            {student.admissionNumber} - {student.fatherName || '---'}
                                        </p>
                                    </button>
                                ))}
                            </div>
                        ) : isDropdownOpen && searchId && !isSearching && !loading && !studentData ? (
                            <div className="absolute top-full right-0 left-0 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl mt-2 shadow-xl z-50 overflow-hidden">
                                <div className="p-3 text-xs font-bold text-[var(--color-text-muted)]">کوئی طالب علم نہیں ملا</div>
                            </div>
                        ) : null}
                    </div>

                    <div className="flex flex-col gap-2">
                        <label className="text-xs font-bold text-[var(--color-text-muted)] mr-2">لے آؤٹ</label>
                        <div className="grid h-14 grid-cols-2 gap-1 rounded-xl border-2 border-[var(--color-border)] bg-[var(--color-input)] p-1">
                            <button
                                type="button"
                                onClick={() => setLayout('horizontal')}
                                className={`min-w-0 rounded-lg px-2 text-sm font-bold flex items-center justify-center gap-1.5 transition-all ${layout === 'horizontal' ? 'bg-[var(--color-primary)] text-white' : 'text-[var(--color-text-muted)]'}`}
                            >
                                <Layout size={15} className="shrink-0" /> <span className="truncate">افقی</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setLayout('vertical')}
                                className={`min-w-0 rounded-lg px-2 text-sm font-bold flex items-center justify-center gap-1.5 transition-all ${layout === 'vertical' ? 'bg-[var(--color-primary)] text-white' : 'text-[var(--color-text-muted)]'}`}
                            >
                                <Smartphone size={15} className="shrink-0" /> <span className="truncate">عمودی</span>
                            </button>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={handleSearch}
                        disabled={loading || isSearching || !searchId.trim()}
                        className="h-14 bg-[var(--color-primary)] text-white px-4 rounded-xl font-black shadow-lg shadow-[var(--color-primary)]/20 hover:opacity-90 active:scale-[0.98] transition-all disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {loading || isSearching ? 'تلاش جاری...' : 'کارڈ جنریٹ کریں'}
                    </button>
                </div>

                <div className="mt-8 overflow-x-auto rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)]">
                    <div className="grid min-w-[820px] grid-cols-[90px_1.2fr_1fr_1fr_1fr_150px] gap-3 border-b border-[var(--color-border)] px-4 py-4 text-xs font-black text-[var(--color-text-muted)]">
                        <span>داخلہ نمبر</span>
                        <span>نام</span>
                        <span>سیشن</span>
                        <span>جماعت</span>
                        <span>جماعت سیکشن</span>
                        <span>ایکشن</span>
                    </div>
                    {loading ? (
                        <div className="px-4 py-6 text-center text-sm font-bold text-[var(--color-text-muted)]">طلبہ لوڈ ہو رہے ہیں...</div>
                    ) : tableStudents.length > 0 ? (
                        tableStudents.map((student) => (
                            <div key={student.id} className="grid min-w-[820px] grid-cols-[90px_1.2fr_1fr_1fr_1fr_150px] items-center gap-3 border-b border-[var(--color-border)] px-4 py-3 text-sm font-bold last:border-b-0">
                                <span className="text-[var(--color-text-muted)]">{student.admissionNumber || '---'}</span>
                                <span className="text-[var(--color-text-main)]">{student.fullName || '---'}</span>
                                <span className="text-[var(--color-text-muted)]">{getStudentSessionName(student)}</span>
                                <span className="text-[var(--color-text-muted)]">{getStudentClassName(student)}</span>
                                <span className="text-[var(--color-text-muted)]">{getStudentSectionName(student)}</span>
                                <button
                                    type="button"
                                    onClick={() => selectStudent(student)}
                                    className="rounded-xl bg-[var(--color-primary)] px-4 py-2 text-xs font-black text-white transition-all hover:opacity-90"
                                >
                                    کارڈ جنریٹ کریں
                                </button>
                            </div>
                        ))
                    ) : (
                        <div className="px-4 py-6 text-center text-sm font-bold text-[var(--color-text-muted)]">کوئی طالب علم نہیں ملا۔</div>
                    )}
                </div>
            </div>

            <AnimatePresence mode="wait">
                {studentData ? (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center gap-6">
                        <div className="print-area">
                            {layout === 'horizontal' ? <HorizontalCard data={studentData} /> : <VerticalCard data={studentData} />}
                        </div>

                        <button
                            type="button"
                            onClick={() => window.print()}
                            className="print:hidden bg-[var(--color-primary)] text-white px-10 py-4 rounded-xl font-bold shadow-2xl flex items-center gap-2 hover:scale-105 transition-transform"
                        >
                            <Printer size={20} /> پرنٹ نکالیں
                        </button>
                    </motion.div>
                ) : (
                    <div className="max-w-6xl mx-auto rounded-[2rem] border border-dashed border-[var(--color-border)] bg-[var(--color-surface)] p-10 text-center print:hidden">
                        <p className="font-bold text-[var(--color-text-muted)]">
                            {loading ? 'طلبہ لوڈ ہو رہے ہیں...' : 'طالب علم تلاش کریں، پھر آئی ڈی کارڈ یہاں دکھائی دے گا۔'}
                        </p>
                    </div>
                )}
            </AnimatePresence>

            <style
                dangerouslySetInnerHTML={{
                    __html: `
                        @media print {
                            @page { size: A4; margin: 0; }
                            body * { visibility: hidden; }
                            * {
                                -webkit-print-color-adjust: exact !important;
                                print-color-adjust: exact !important;
                                color-adjust: exact !important;
                            }
                            .print-area,
                            .print-area * {
                                visibility: visible !important;
                            }
                            .print-area {
                                position: fixed;
                                inset: 0;
                                display: flex !important;
                                align-items: flex-start;
                                justify-content: center;
                                padding-top: 24mm;
                                width: 100%;
                            }
                        }
                    `,
                }}
            />
        </div>
    );
};

const StudentPhoto = ({ data, className, iconSize = 35 }) => (
    <div className={className}>
        {data.image ? (
            <img
                src={data.image}
                className="w-full h-full object-cover"
                alt={data.name}
                onError={(event) => {
                    event.currentTarget.src = AppImages.profile;
                }}
            />
        ) : (
            <User size={iconSize} className="text-gray-300" />
        )}
    </div>
);

const FilterSelect = ({ label, value, onChange, options, placeholder, disabled = false }) => (
    <div className="flex flex-col gap-2">
        <label className="text-xs font-bold text-[var(--color-text-muted)] mr-2">{label}</label>
        <select
            value={value}
            disabled={disabled}
            onChange={(event) => onChange(event.target.value)}
            className="h-14 w-full rounded-xl border-2 border-[var(--color-border)] bg-[var(--color-input)] px-4 font-bold text-[var(--color-text-main)] outline-none transition-all focus:border-[var(--color-primary)] disabled:cursor-not-allowed disabled:opacity-60"
        >
            <option value="">{placeholder}</option>
            {(options || []).map((item) => (
                <option key={item.id} value={item.id}>
                    {item.name}
                </option>
            ))}
        </select>
    </div>
);

const HorizontalCard = ({ data }) => (
    <div dir="rtl" style={{ fontFamily: 'Jameel Noori Nastaleeq, Noto Nastaliq Urdu, serif' }} className="student-id-card-horizontal w-[85.6mm] h-[60mm] bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden flex flex-col text-black print:shadow-none print:border-gray-400 relative">
        <div className="bg-[#002a33] p-2 flex items-center justify-between border-b-2 border-[#00d094]">
            <div className="flex items-center gap-2">
                <div className="w-7 h-7 bg-white rounded-lg p-1 shadow-inner">
                    <img src={data.madrassaLogo || AppImages.logo} className="w-full h-full object-contain" alt="Logo" />
                </div>
                <div>
                    <h2 className="id-card-header-title text-white font-black">{data.madrassaName}</h2>
                    <p className="id-card-header-subtitle text-[#00d094] font-bold">طالب علم شناختی کارڈ</p>
                </div>
            </div>
            <span className="id-card-badge text-white bg-white/10 px-2 py-0.5 rounded-full font-black border border-white/10">طالب علم</span>
        </div>

        <div dir="ltr" className="relative z-10 flex flex-1 items-center gap-3 bg-gradient-to-br from-white to-gray-50 px-3 py-2">
            <StudentPhoto data={data} className="w-[22mm] h-[27mm] shrink-0 border-2 border-[#002a33] rounded-md overflow-hidden bg-white shadow-md flex items-center justify-center" />

            <div dir="rtl" className="min-w-0 flex-1 space-y-1">
                <CardLine label="نام" value={data.name} />
                <CardLine label="ولدیت" value={data.fatherName} />
                <CardLine label="درجہ" value={data.className} />
                <CardLine label="سیکشن" value={data.section} />
                <CardLine label="آئی ڈی نمبر" value={data.idNo} />
            </div>
        </div>

        <div className="bg-gray-100 px-3 py-1.5 flex justify-between items-center border-t border-gray-200">
            <div className="flex items-center gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-[#00d094]" />
                <span className="id-card-footer-text font-black text-[#002a33]">آئی ڈی: {data.idNo}</span>
            </div>
            <span dir="ltr" className="id-card-footer-text font-bold text-gray-500">{data.mobile}</span>
        </div>

        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.03] pointer-events-none">
            <GraduationCap size={100} />
        </div>
    </div>
);

const VerticalCard = ({ data }) => (
    <div style={{ fontFamily: 'Jameel Noori Nastaleeq, Noto Nastaliq Urdu, serif' }} className="w-[280px] h-[470px] bg-white rounded-xl shadow-2xl border border-gray-300 overflow-hidden flex flex-col text-black font-sans print:shadow-none print:border-gray-400">
        <div className="bg-[#002a33] pt-3 pb-14 px-4 text-center">
            <div className="w-11 h-11 bg-white rounded-lg p-2 mx-auto">
                <img src={data.madrassaLogo || AppImages.logo} className="w-full h-full object-contain" alt="Logo" />
            </div>
            <h2 className="text-white text-lg font-bold leading-tight mt-2">{data.madrassaName}</h2>
        </div>

        <div className="flex-1 flex flex-col items-center px-5 pb-5 -mt-12">
            <StudentPhoto data={data} className="w-24 h-24 border-4 border-white shadow-lg rounded-full overflow-hidden bg-gray-50 z-10 flex items-center justify-center" iconSize={40} />
            <h3 className="text-lg font-black text-[#002a33] mt-2 text-center leading-tight">{data.name}</h3>
            <p className="text-[11px] font-bold text-gray-400 ">{data.idNo}</p>

            <div className="mt-auto w-full space-y-1  ">
                <VerticalInfo label="والد کا نام" value={data.fatherName} />
                <VerticalInfo label="درجہ" value={data.className} />
                <VerticalInfo label="سیکشن" value={data.section} />
                <VerticalInfo label="آئی ڈی نمبر" value={data.idNo} />
            </div>
        </div>

        <div className="p-2 border-t border-gray-300 text-center text-[10px] font-bold text-gray-500">
            {data.mobile}
        </div>
    </div>
);

const CardLine = ({ label, value }) => (
    <div className="id-card-line grid grid-cols-[62px_minmax(0,1fr)] items-center gap-2 border-b border-gray-200 text-right">
        <span className="id-card-label whitespace-nowrap font-black text-[#00a876]">{label}</span>
        <span className="id-card-value truncate font-black text-gray-800">{value || '---'}</span>
    </div>
);

const VerticalInfo = ({ label, value }) => (
    <div className="grid grid-cols-[74px_minmax(0,1fr)] flex items-center gap-2 border-b border-gray-200 py-1 text-center">
        <p className="text-[12px] font-bold text-[#00a876]">{label}</p>
        <p className="truncate text-center text-[12px] font-bold leading-tight text-gray-800">{value || '---'}</p>
    </div>
);


