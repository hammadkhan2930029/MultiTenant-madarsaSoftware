import React, { useEffect, useMemo, useState } from 'react';
import { CreditCard, GraduationCap, Layout, Printer, Search, Smartphone, User } from 'lucide-react';
/* eslint-disable-next-line no-unused-vars */
import { motion, AnimatePresence } from 'framer-motion';
import { AppImages } from '../../../Constant/AppImages';
import { getStudents } from '../../../Constant/StudentsApi';
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
        className: activeAssignment?.class?.name || '---',
        section: activeAssignment?.section?.name || '---',
        session: activeAssignment?.session?.name || '---',
        mobile: student.phone || primaryParent?.phone || '---',
        address: student.address || madrassaProfile?.address || '',
        image: getStudentImage(student),
        madrassaName: madrassaProfile?.name || 'جامعہ انوار القرآن',
    };
};

export const CreateIdCard = () => {
    const [searchId, setSearchId] = useState('');
    const [layout, setLayout] = useState('horizontal');
    const [studentData, setStudentData] = useState(null);
    const [students, setStudents] = useState([]);
    const [searchResults, setSearchResults] = useState([]);
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
                const [studentsResult, profileResult] = await Promise.all([
                    getStudents('page=1&limit=1000'),
                    fetchMadrassaProfile().catch(() => getAdminSession()?.madrassaProfile || null),
                ]);

                setStudents(normalizeStudentItems(studentsResult));
                setMadrassaProfile(profileResult);
            } catch (loadError) {
                setError(loadError.message || 'ID card data load nahi ho saka.');
            } finally {
                setLoading(false);
            }
        };

        loadIdCardData();
    }, []);

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
                const result = await getStudents(`page=1&limit=20&search=${encodeURIComponent(query)}`);
                setSearchResults(normalizeStudentItems(result));
            } catch {
                setSearchResults([]);
            } finally {
                setIsSearching(false);
            }
        }, 250);

        return () => clearTimeout(timeoutId);
    }, [searchId]);

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

            const result = await getStudents(`page=1&limit=20&search=${encodeURIComponent(query)}`);
            const serverStudents = normalizeStudentItems(result);
            const serverMatch = findStudentMatch(serverStudents, query) || serverStudents[0];

            setSearchResults(serverStudents);

            if (!serverMatch) {
                setStudentData(null);
                setError('Is registration number ya naam ka student nahi mila.');
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
            setError(searchError.message || 'Student search nahi ho saka.');
        } finally {
            setIsSearching(false);
        }
    };

    return (
        <div className="min-h-screen bg-[var(--color-bg)] p-4 md:p-8" dir="rtl">
            <div className="max-w-6xl mx-auto bg-[var(--color-surface)] p-6 rounded-[2rem] shadow-xl border border-[var(--color-border)] mb-10 print:hidden">
                <h2 className="text-2xl font-black mb-6 flex items-center gap-3 text-[var(--color-text-main)]">
                    <CreditCard className="text-[var(--color-primary)]" /> آئی ڈی کارڈ جنریٹر
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
                    <div className="flex flex-col gap-2 relative">
                        <label className="text-xs font-bold text-[var(--color-text-muted)] mr-2">رجسٹریشن نمبر یا نام</label>
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
                                className="w-full bg-[var(--color-input)] border-2 border-[var(--color-border)] focus:border-[var(--color-primary)] p-3.5 pl-11 rounded-xl outline-none font-bold text-[var(--color-text-main)] transition-all"
                                placeholder={loading || isSearching ? 'Students search ho rahe hain...' : '0001 یا طالب علم کا نام'}
                            />
                            <Search size={18} className="absolute left-4 top-4 text-[var(--color-text-muted)]" />
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
                        <div className="flex bg-[var(--color-input)] p-1 rounded-xl border-2 border-[var(--color-border)]">
                            <button
                                type="button"
                                onClick={() => setLayout('horizontal')}
                                className={`flex-1 py-2 rounded-lg font-bold flex items-center justify-center gap-2 ${layout === 'horizontal' ? 'bg-[var(--color-primary)] text-white' : 'text-[var(--color-text-muted)]'}`}
                            >
                                <Layout size={16} /> Horizontal
                            </button>
                            <button
                                type="button"
                                onClick={() => setLayout('vertical')}
                                className={`flex-1 py-2 rounded-lg font-bold flex items-center justify-center gap-2 ${layout === 'vertical' ? 'bg-[var(--color-primary)] text-white' : 'text-[var(--color-text-muted)]'}`}
                            >
                                <Smartphone size={16} /> Vertical
                            </button>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={handleSearch}
                        disabled={loading || isSearching || !searchId.trim()}
                        className="bg-[var(--color-primary)] text-white py-4 rounded-xl font-black shadow-lg shadow-[var(--color-primary)]/20 hover:opacity-90 active:scale-[0.98] transition-all disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {loading || isSearching ? 'تلاش جاری...' : 'کارڈ جنریٹ کریں'}
                    </button>
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
                            {loading ? 'Students load ho rahe hain...' : 'Student search karein, phir ID card yahan show hoga.'}
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

const HorizontalCard = ({ data }) => (
    <div style={{ fontFamily: 'Noto Nastaliq Urdu' }} className="w-[85.6mm] h-[60mm] bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden flex flex-col text-black font-sans print:shadow-none print:border-gray-400 relative">
        <div className="bg-[#002a33] p-2 flex items-center justify-between border-b-2 border-[#00d094]">
            <div className="flex items-center gap-2">
                <div className="w-7 h-7 bg-white rounded-lg p-1 shadow-inner">
                    <img src={AppImages.logo} className="w-full h-full object-contain" alt="Logo" />
                </div>
                <div>
                    <h2 className="text-white text-[11px] font-black leading-tight">{data.madrassaName}</h2>
                    <p className="text-[#00d094] text-[6px] font-bold tracking-wider uppercase">Student Identity Card</p>
                </div>
            </div>
            <span className="text-white bg-white/10 px-2 py-0.5 rounded-full text-[7px] font-black border border-white/10 uppercase tracking-tighter">Student ID</span>
        </div>

        <div className="flex flex-1 p-3 gap-3 items-center bg-gradient-to-br from-white to-gray-50">
            <div className="flex-1 space-y-1.5">
                <CardLine label="نام" value={data.name} />
                <CardLine label="ولدیت" value={data.fatherName} />
                <CardLine label="درجہ" value={data.className} />
                <CardLine label="سیکشن" value={data.section} />
                <CardLine label="سیشن" value={data.session} />
            </div>

            <div className="flex flex-col items-center gap-1">
                <StudentPhoto data={data} className="w-[22mm] h-[26mm] border-2 border-[#002a33] rounded-md overflow-hidden bg-white shadow-md flex items-center justify-center" />
            </div>
        </div>

        <div className="bg-gray-100 px-3 py-1.5 flex justify-between items-center border-t border-gray-200">
            <div className="flex items-center gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-[#00d094]" />
                <span className="text-[9px] font-black text-[#002a33]">Reg: {data.idNo}</span>
            </div>
            <span className="text-[8px] font-bold text-gray-500 tracking-tight">{data.mobile}</span>
        </div>

        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.03] pointer-events-none">
            <GraduationCap size={100} />
        </div>
    </div>
);

const VerticalCard = ({ data }) => (
    <div style={{ fontFamily: 'Noto Nastaliq Urdu' }} className="w-[280px] h-[470px] bg-white rounded-xl shadow-2xl border border-gray-300 overflow-hidden flex flex-col text-black font-sans print:shadow-none print:border-gray-400">
        <div className="bg-[#002a33] pt-2 pb-12 px-4 text-center">
            <div className="w-12 h-12 bg-white rounded-lg p-2 mx-auto">
                <img src={AppImages.logo} className="w-full h-full object-contain" alt="Logo" />
            </div>
            <h2 className="text-white text-lg font-bold leading-tight mt-1">{data.madrassaName}</h2>
            <div className="bg-[#00d094] inline-block px-3 py-0.5 rounded-full text-[9px] font-black text-[#002a33] mt-1 uppercase">Student ID</div>
        </div>

        <div className="flex-1 flex flex-col items-center px-6 -mt-10">
            <StudentPhoto data={data} className="w-24 h-24 border-4 border-white shadow-lg rounded-full overflow-hidden bg-gray-50 z-10 flex items-center justify-center" iconSize={40} />
            <h3 className="text-lg font-black text-[#002a33] mt-2 text-center">{data.name}</h3>
            <p className="text-xs font-bold text-gray-400 mb-2">{data.idNo}</p>

            <div className="w-full space-y-1">
                <VerticalInfo label="Father Name" value={data.fatherName} />
                <VerticalInfo label="Class" value={data.className} />
                <VerticalInfo label="Section" value={data.section} />
                <VerticalInfo label="Session" value={data.session} />
            </div>
        </div>

        <div className="p-2 border-t border-gray-300 text-center text-[10px] font-bold text-gray-500">
            {data.mobile}
        </div>
    </div>
);

const CardLine = ({ label, value }) => (
    <div className="flex justify-between items-center border-b border-gray-100 pb-0.5 gap-2">
        <span className="text-[8px] font-bold text-[#00a876] whitespace-nowrap">{label}</span>
        <span className="text-[10px] font-bold text-gray-800 truncate">{value}</span>
    </div>
);

const VerticalInfo = ({ label, value }) => (
    <div className="text-center">
        <p className="text-[9px] font-bold text-[#00a876] uppercase">{label}</p>
        <p className="text-[13px] font-bold text-gray-800">{value}</p>
    </div>
);
